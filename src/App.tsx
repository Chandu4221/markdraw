import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TldrawCanvas, Editor } from './canvas/tldraw';
import { ExcalidrawCanvas } from './canvas/excalidraw';
import { CanvasDriver } from './canvas/port';
import { CompilationOptions } from './core/types';
import { LegendModal } from './components/LegendModal';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CompilationOptionsContext } from './core/CompilationOptionsContext';
import { ALL_ROLES } from './annotation/roles';
import { AlertCircle } from 'lucide-react';
import { AppHeader } from './components/layout';
import { OutputPanel, OutputTab, OutputDisplayMode } from './components/output';
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

  const [canvasEngine, setCanvasEngine] = useState<'excalidraw' | 'tldraw'>('excalidraw');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setEditor] = useState<Editor | null>(null);

  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const driverRef = useRef<CanvasDriver | null>(null);

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

  // Global Shortcuts Hook
  useGlobalShortcuts({
    editorRef,
    setIsRightPanelOpen,
    setIsShortcutsOpen,
    showToast
  });

  // Canvas Role Chips Toggle
  const [showRoleChips] = useState<boolean>(() => {
    const saved = localStorage.getItem('markdraw_show_role_chips');
    return saved !== null ? saved === 'true' : true;
  });

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

  const toggleEngine = () => {
    setCanvasEngine((prev) => (prev === 'excalidraw' ? 'tldraw' : 'excalidraw'));
    showToast(
      canvasEngine === 'excalidraw'
        ? 'Switched to tldraw canvas engine'
        : 'Switched to Excalidraw (MIT) canvas engine'
    );
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
    handleEditorMount,
    handleDriverReady,
    getActiveContent,
    handleCopy,
    handleCopyFullContract,
    handleDownload
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
            canvasEngine={canvasEngine}
            onToggleEngine={toggleEngine}
          />

          {/* Main Workspace */}
          <div className="flex-1 flex overflow-hidden relative" ref={workspaceRef}>
            {activeDrag !== null && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

            {/* Split Area: Canvas + Resizer + Output */}
            <div className="flex-1 flex h-full overflow-hidden relative" ref={splitAreaRef}>
              {/* Canvas Container */}
              <div
                className="h-full relative overflow-hidden bg-[var(--md-bg)] flex-1 min-w-0"
                onTransitionEnd={() => {
                  window.dispatchEvent(new Event('resize'));
                }}
              >
                {canvasEngine === 'excalidraw' ? (
                  <ExcalidrawCanvas
                    key={`excal_${activeDoc.id}`}
                    persistenceKey={activeDoc.persistenceKey}
                    onDriverReady={(driver) => {
                      driverRef.current = driver;
                      handleDriverReady(driver);
                    }}
                    theme={theme}
                    showRoleChips={showRoleChips}
                    onCopyContract={() => showToast('Copied contract to clipboard')}
                  />
                ) : (
                  <TldrawCanvas
                    key={`tl_${activeDoc.id}`}
                    persistenceKey={activeDoc.persistenceKey}
                    onDriverReady={(driver, rawEditor) => {
                      driverRef.current = driver;
                      setEditor(rawEditor);
                      editorRef.current = rawEditor;
                      handleDriverReady(driver);
                    }}
                    onEditorMount={handleEditorMount}
                    showRoleChips={showRoleChips}
                    onCopyContract={() => showToast('Copied contract to clipboard')}
                  />
                )}

                {/* Toast Message */}
                {toastMessage && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface-raised)] text-xs text-[var(--md-text-bold)] shadow-[var(--md-shadow-lg)] animate-in fade-in-0 duration-150">
                    <AlertCircle size={14} className="text-[var(--md-accent)]" />
                    <span>{toastMessage}</span>
                  </div>
                )}
              </div>

              {/* Split Resizer Divider */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize canvas and output panels"
                tabIndex={isRightPanelOpen ? 0 : -1}
                className={`w-[5px] h-full cursor-col-resize shrink-0 relative flex items-center justify-center group hover:bg-[var(--md-accent)] transition-[opacity,width] duration-200 select-none ${
                  isRightPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none w-0 overflow-hidden'
                } ${
                  activeDrag === 'right' ? 'bg-[var(--md-accent)]' : 'bg-transparent'
                }`}
                onMouseDown={isRightPanelOpen ? startResizingRight : undefined}
                onDoubleClick={() => setCanvasPercent(55)}
                title="Drag to resize (Double-click to reset 55/45)"
              >
                <div className="w-[1px] h-full bg-[var(--md-border)] group-hover:bg-transparent" />
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
          />
          <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        </div>
      </CompilationOptionsContext.Provider>
    </ErrorBoundary>
  );
};
