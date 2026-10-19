import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ExcalidrawCanvas } from './canvas/excalidraw';
import { CanvasDriver } from './canvas/port';
import { CompilationOptions, Editor } from './core/types';
import { LegendModal } from './components/LegendModal';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CompilationOptionsContext } from './core/CompilationOptionsContext';
import { ALL_ROLES } from './annotation/roles';
import { AlertCircle, Tag, ChevronRight } from 'lucide-react';
import { AppHeader } from './components/layout';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { StarterTemplate } from './canvas/templates/starterTemplates';
import { OutputPanel, OutputTab, OutputDisplayMode } from './components/output';
import { InspectorShell } from './components/inspector/InspectorShell';
import { getShapeMeta } from './annotation/shapeMeta';
import { migrateLocalStorageRoleKeys } from './annotation/storageMigration';
import {
  useDocumentManagement,
  usePanelResize,
  useGlobalShortcuts,
  useCompilation
} from './hooks';

const DEFAULT_OPTIONS: Required<CompilationOptions> = {
  containmentThreshold: 0.85,
  rowClusterThreshold: 16,
  gridBandThreshold: 32,
  sizeBucketTolerance: 2,
  alignTolerance: 3,
  includeTimestamp: false,
  includeLegend: false,
  pageNote: '',
  platform: 'web',
  platformId: 'web',
  scope: null,
  units: [],
  annotationMode: true
};

export const App: React.FC = () => {
  const [outputTab, setOutputTab] = useState<OutputTab>('spec');
  const [outputDisplayMode, setOutputDisplayMode] = useState<OutputDisplayMode>(() => {
    try {
      const saved = localStorage.getItem('markdraw_output_display_mode');
      if (saved === 'raw' || saved === 'preview') return saved;
    } catch {
      // fallback
    }
    return 'preview';
  });

  const handleOutputDisplayModeChange = (mode: OutputDisplayMode) => {
    setOutputDisplayMode(mode);
    try {
      localStorage.setItem('markdraw_output_display_mode', mode);
    } catch {
      // ignore
    }
  };

  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setEditor] = useState<Editor | null>(null);

  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const driverRef = useRef<CanvasDriver | null>(null);
  const [driver, setDriver] = useState<CanvasDriver | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Panel Resizing Hook
  const {
    canvasPercent,
    setCanvasPercent,
    activeDrag,
    splitAreaRef,
    startResizingRight
  } = usePanelResize(55);

  // Document Management Hook
  const {
    docsRegistry,
    activeDoc,
    pendingShapesRef,
    handleSelectDoc,
    handleNewDoc,
    handleDuplicateDoc,
    handleRenameDoc,
    handleDeleteDoc,
    handleExportFile,
    handleImportFile
  } = useDocumentManagement({ editorRef, showToast });

  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [simulationRootId, setSimulationRootId] = useState<string | null>(null);

  const handleToggleSimulate = useCallback(async () => {
    if (!driver || selectedIds.length === 0) return;
    const shape = await driver.getShape(selectedIds[0]);
    if (!shape) return;
    const meta = getShapeMeta(shape);
    if (meta?.role === 'page' && meta.props?.behaviors?.includes('responsive')) {
      setSimulationRootId((prev) => (prev ? null : shape.id));
    }
  }, [driver, selectedIds]);

  // Auto-open Inspector and scroll to top whenever a shape is selected
  useEffect(() => {
    if (selectedIds.length > 0) {
      setIsInspectorOpen(true);
      const inspectorEl = document.querySelector('[data-testid="markdraw-docked-inspector"] .overflow-y-auto');
      if (inspectorEl) {
        inspectorEl.scrollTop = 0;
      }
    }
  }, [selectedIds]);

  // Global Shortcuts Hook
  useGlobalShortcuts({
    editorRef,
    setIsRightPanelOpen,
    setIsShortcutsOpen,
    showToast,
    setIsInspectorOpen
  });

  // Onboarding Modal State (§11)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('markdraw_v5_onboarded') !== 'true';
  });

  const handleSelectTemplate = useCallback(
    async (template: StarterTemplate) => {
      if (driverRef.current) {
        const existing = await driverRef.current.listShapes();
        for (const s of existing) {
          await driverRef.current.deleteShape(s.id);
        }
        for (const s of template.shapes) {
          await driverRef.current.createShape(s);
        }
        showToast(`Loaded "${template.name}" template`);
      }
    },
    [showToast]
  );

  // Canvas Type Chips Toggle (§1.1, §1.2)
  const [showRoleChips, setShowRoleChips] = useState<boolean>(() => {
    migrateLocalStorageRoleKeys();
    const saved = localStorage.getItem('markdraw_show_type_chips') ?? localStorage.getItem('markdraw_show_role_chips');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleRoleChips = (show: boolean) => {
    setShowRoleChips(show);
    try {
      localStorage.setItem('markdraw_show_type_chips', String(show));
    } catch {}
  };

  // Theme Management
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('markdraw_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('markdraw_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Settings Management
  const [options, setOptions] = useState<Required<CompilationOptions>>(() => {
    try {
      const saved = localStorage.getItem('markdraw_settings');
      if (saved) {
        return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback to defaults
    }
    return DEFAULT_OPTIONS;
  });

  const [platformId, setPlatformId] = useState<string>('web');
  const [compileScopeMode, setCompileScopeMode] = useState<'all' | 'selection'>('all');

  const handleOptionsChange = useCallback(
    (
      newOptsOrUpdater:
        | Required<CompilationOptions>
        | ((prev: Required<CompilationOptions>) => Required<CompilationOptions>)
    ) => {
      setOptions((prev) => {
        const next =
          typeof newOptsOrUpdater === 'function' ? newOptsOrUpdater(prev) : newOptsOrUpdater;
        try {
          localStorage.setItem('markdraw_settings', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  // Compilation and lifecycle hook
  const {
    compilation,
    compileDuration,
    copied,
    copiedFull,
    handleDriverReady,
    getActiveContent,
    handleCopy,
    handleCopyFullContract,
    handleDownload,
    coverage,
    handleLintClick
  } = useCompilation({
    options,
    platformId,
    compileScopeMode,
    activeDoc,
    pendingShapesRef,
    editorRef,
    driverRef,
    setEditor,
    showToast,
    outputTab
  });

  // Recovery Snapshot for Error Boundary
  const getRecoverySnapshot = useCallback(() => {
    if (editorRef.current) {
      return {
        docName: activeDoc.name,
        shapes: editorRef.current.getCurrentPageShapes(),
        lastCompilation: compilation
      };
    }
    return compilation.jsonAst;
  }, [activeDoc.name, compilation]);

  return (
    <ErrorBoundary getRecoverySnapshot={getRecoverySnapshot}>
      <CompilationOptionsContext.Provider value={{ options, setOptions: handleOptionsChange }}>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--md-bg)] text-[var(--md-text)] font-sans antialiased">
          {/* Top Application Header */}
          <AppHeader
            activeDoc={activeDoc}
            docs={docsRegistry.docs}
            onSelectDoc={handleSelectDoc}
            onNewDoc={handleNewDoc}
            onDuplicateDoc={handleDuplicateDoc}
            onRenameDoc={handleRenameDoc}
            onDeleteDoc={handleDeleteDoc}
            onExportFile={handleExportFile}
            onImportFile={handleImportFile}
            isRightPanelOpen={isRightPanelOpen}
            setIsRightPanelOpen={setIsRightPanelOpen}
            canvasPercent={canvasPercent}
            setCanvasPercent={setCanvasPercent}
            elementCount={compilation.elementCount}
            compileDuration={compileDuration}
            roleCount={ALL_ROLES.length}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenLegend={() => setIsLegendOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            theme={theme}
            toggleTheme={toggleTheme}
            onSelectTemplate={handleSelectTemplate}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            isInspectorOpen={isInspectorOpen}
            setIsInspectorOpen={setIsInspectorOpen}
          />

          {/* Main Workspace */}
          <div className="flex-1 flex overflow-hidden relative" ref={workspaceRef}>
            {activeDrag !== null && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

            {/* Split Area: Canvas + Resizer + Output */}
            <div className="flex-1 flex h-full overflow-hidden relative" ref={splitAreaRef}>
              {/* Canvas Container */}
              <div
                className="h-full relative overflow-hidden bg-[var(--md-bg)] flex-1 min-w-0 flex"
                onTransitionEnd={() => {
                  window.dispatchEvent(new Event('resize'));
                }}
              >
                <div className="flex-1 h-full relative min-w-0">
                  <ExcalidrawCanvas
                    key={`excal_${activeDoc.id}`}
                    persistenceKey={activeDoc.persistenceKey}
                    onDriverReady={(drv) => {
                      driverRef.current = drv;
                      setDriver(drv);
                      handleDriverReady(drv);
                      drv.onSelectionChanged(setSelectedIds);
                    }}
                    theme={theme}
                    showRoleChips={showRoleChips}
                    selectedIds={selectedIds}
                    isInspectorOpen={isInspectorOpen}
                    onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
                    simulationRootId={simulationRootId}
                    onCloseSimulation={() => setSimulationRootId(null)}
                    onChipClick={(id) => {
                      driver?.setSelection([id]);
                      setIsInspectorOpen(true);
                    }}
                    onCopyContract={() => showToast('Copied contract to clipboard')}
                  />

                  {/* Toast Message */}
                  {toastMessage && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface-raised)] text-sm text-[var(--md-text-bold)] shadow-[var(--md-shadow-lg)] animate-in fade-in-0 duration-150">
                      <AlertCircle size={16} className="text-[var(--md-accent)]" />
                      <span>{toastMessage}</span>
                    </div>
                  )}
                </div>

                {/* Docked Semantics Inspector (§1.2 & §2.1) */}
                {isInspectorOpen && (
                  <aside
                    role="complementary"
                    aria-label="Semantics Inspector"
                    className="w-72 h-full border-l border-[var(--md-border)] bg-[var(--md-surface)] flex flex-col shrink-0 overflow-hidden z-10 select-text"
                    data-testid="markdraw-docked-inspector"
                  >
                    <div className="h-10 px-3 border-b border-[var(--md-border)] bg-[var(--md-surface-raised)] flex items-center justify-between shrink-0 select-none">
                      <div className="flex items-center gap-1.5 font-sans text-sm font-bold text-[var(--md-text-bold)]">
                        <Tag size={16} className="text-[var(--md-accent)]" />
                        <span>Inspector</span>
                        {selectedIds.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full text-sm font-mono font-bold bg-[var(--color-accent)] text-white">
                            {selectedIds.length}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsInspectorOpen(false)}
                        className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-2)] transition-colors cursor-pointer"
                        title="Collapse Inspector (Alt+I)"
                        aria-label="Collapse Inspector"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <InspectorShell
                        selectedIds={selectedIds}
                        driver={driver}
                        units={options.units}
                        onUnitsChange={(u) => handleOptionsChange((prev) => ({ ...prev, units: u }))}
                        options={options}
                        onOptionsChange={handleOptionsChange}
                        hideHeader={true}
                        isSimulating={Boolean(simulationRootId)}
                        onToggleSimulate={handleToggleSimulate}
                      />
                    </div>
                  </aside>
                )}
              </div>

              {/* Split Resizer Divider */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize canvas and output panels"
                tabIndex={isRightPanelOpen ? 0 : -1}
                className={`w-1.5 h-full cursor-col-resize shrink-0 relative flex items-center justify-center group hover:bg-[var(--md-accent)] transition-[opacity,width] duration-200 select-none ${
                  isRightPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none w-0 overflow-hidden'
                } ${
                  activeDrag === 'right' ? 'bg-[var(--md-accent)]' : 'bg-transparent'
                }`}
                onMouseDown={isRightPanelOpen ? startResizingRight : undefined}
                onDoubleClick={() => setCanvasPercent(55)}
                title="Drag to resize (Double-click to reset 55/45)"
              >
                <div className="w-px h-full bg-[var(--md-border)] group-hover:bg-transparent" />
              </div>

              {/* Right Pane: Live Reactive Output */}
              <OutputPanel
                isRightPanelOpen={isRightPanelOpen}
                canvasPercent={canvasPercent}
                activeDrag={activeDrag}
                outputTab={outputTab}
                setOutputTab={setOutputTab}
                outputDisplayMode={outputDisplayMode}
                onOutputDisplayModeChange={handleOutputDisplayModeChange}
                platformId={platformId}
                setPlatformId={setPlatformId}
                compileScopeMode={compileScopeMode}
                setCompileScopeMode={setCompileScopeMode}
                compilation={compilation}
                activeContent={getActiveContent()}
                copied={copied}
                copiedFull={copiedFull}
                onCopy={handleCopy}
                onCopyFullContract={handleCopyFullContract}
                onDownload={handleDownload}
                coverage={coverage}
                onLintClick={handleLintClick}
                onSelectShape={(id) => {
                  driver?.setSelection([id]);
                  driver?.panTo(id);
                  setIsInspectorOpen(true);
                }}
              />
            </div>
          </div>

          {/* In-App Modals */}
          <LegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            options={options}
            onChange={handleOptionsChange}
            showRoleChips={showRoleChips}
            onToggleRoleChips={handleToggleRoleChips}
          />
          <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
          <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
        </div>
      </CompilationOptionsContext.Provider>
    </ErrorBoundary>
  );
};
