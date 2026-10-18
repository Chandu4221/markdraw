import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import { MarkDrawCompiler, MARKDRAW_VERSION } from './core/compiler';
import { CompilationResult, CompilationOptions } from './core/types';
import { LegendModal } from './components/LegendModal';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DocumentMenu } from './components/DocumentMenu';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RolePanel } from './components/RolePanel';
import { RoleChipsOverlay } from './annotation/RoleChipsOverlay';
import { migrateShapes, isV3Widget, backupDocumentBeforeMigration } from './annotation/migrate';
import { ALL_ROLES } from './annotation/roles';
import {
  getDocRegistry,
  createDocument,
  renameDocument,
  deleteDocument,
  duplicateDocumentMeta,
  saveDocRegistry,
  touchDocument,
  getDemoCanvasShapes,
  serializeDocToFile,
  validateImportFile,
  MarkDrawDocMeta,
  MarkDrawDocRegistry
} from './core/documents';
import {
  Copy,
  Download,
  Check,
  Code,
  LayoutGrid,
  FileText,
  Terminal,
  BookOpen,
  Sliders,
  Sun,
  Moon,
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
  Keyboard,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownPreview } from './components/MarkdownPreview';

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
  const [outputTab, setOutputTab] = useState<'spec' | 'grid' | 'ascii' | 'json'>('spec');
  const [outputDisplayMode, setOutputDisplayMode] = useState<'preview' | 'raw'>(() => {
    try {
      const saved = localStorage.getItem('markdraw_output_display_mode');
      if (saved === 'raw' || saved === 'preview') return saved;
    } catch {
      // fallback
    }
    return 'preview';
  });

  const handleOutputDisplayModeChange = (mode: 'preview' | 'raw') => {
    setOutputDisplayMode(mode);
    try {
      localStorage.setItem('markdraw_output_display_mode', mode);
    } catch {
      // ignore
    }
  };

  const [copied, setCopied] = useState<boolean>(false);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [canvasPercent, setCanvasPercent] = useState<number>(55);
  const [activeDrag, setActiveDrag] = useState<'right' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [compileDuration, setCompileDuration] = useState<number | null>(null);

  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const splitAreaRef = useRef<HTMLDivElement | null>(null);

  // Document Registry Management (Task 1)
  const [docsRegistry, setDocsRegistry] = useState<MarkDrawDocRegistry>(() => getDocRegistry());
  const pendingShapesRef = useRef<any[] | null>(null);

  const activeDoc: MarkDrawDocMeta = useMemo(() => {
    return (
      docsRegistry.docs.find((d) => d.id === docsRegistry.activeDocId) ||
      docsRegistry.docs[0]
    );
  }, [docsRegistry]);

  // Canvas Role Chips Toggle (v4: default on)
  const [showRoleChips] = useState<boolean>(() => {
    const saved = localStorage.getItem('markdraw_show_role_chips');
    return saved !== null ? saved === 'true' : true;
  });



  // Theme Management (monochrome dark/light)
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

  const handleOptionsChange = (newOpts: Required<CompilationOptions>) => {
    setOptions(newOpts);
    localStorage.setItem('markdraw_settings', JSON.stringify(newOpts));
  };

  const [compilation, setCompilation] = useState<CompilationResult>({
    markdownSpec: 'Draw elements on the canvas or pick UI components to compile.',
    markdownGrid: '',
    markdownAscii: '',
    jsonAst: '[]',
    timestamp: '',
    elementCount: 0
  });

  const editorRef = useRef<Editor | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const compileIdRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Compile Trigger with Crash Recovery
  const triggerCompile = useCallback(() => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    try {
      const shapes = currentEditor.getCurrentPageShapes();
      compileIdRef.current += 1;

      const compileOpts: CompilationOptions = {
        ...options,
        platformId,
        scope:
          compileScopeMode === 'selection' && currentEditor.getSelectedShapeIds().length > 0
            ? { shapeIds: currentEditor.getSelectedShapeIds().map((id) => id as string) }
            : null
      };

      const start = performance.now();
      const result = MarkDrawCompiler.compile(shapes, currentEditor, compileOpts);
      const duration = Math.round(performance.now() - start);
      setCompilation(result);
      if (duration > 50) {
        setCompileDuration(duration);
      } else {
        setCompileDuration(null);
      }
    } catch (err) {
      console.error('MarkDraw compilation error:', err);
      showToast('Compile error — showing last valid output');
    }
  }, [options, platformId, compileScopeMode, showToast]);

  const handleEditorMount = useCallback(
    (mountedEditor: Editor) => {
      editorRef.current = mountedEditor;
      setEditor(mountedEditor);

      try {
        mountedEditor.updateInstanceState({ isToolLocked: false, isGridMode: true });
      } catch (err) {
        console.error('Editor configuration error:', err);
      }

      // Check if we have pending shapes to create (from duplicate or file import)
      if (pendingShapesRef.current && pendingShapesRef.current.length > 0) {
        const toCreate = pendingShapesRef.current;
        pendingShapesRef.current = null;
        try {
          const hasWidgets = toCreate.some((s: any) => isV3Widget(s));
          if (hasWidgets) {
            const migrated = migrateShapes(toCreate);
            mountedEditor.createShapes(migrated.shapes);
          } else {
            mountedEditor.createShapes(toCreate);
          }
        } catch (err) {
          console.error('[MarkDraw] Failed to create pending shapes:', err);
        }
      } else {
        // Otherwise, if canvas is completely empty, seed with demo layout
        const currentShapes = mountedEditor.getCurrentPageShapes();
        if (currentShapes.length === 0) {
          try {
            const demo = getDemoCanvasShapes();
            mountedEditor.createShapes(demo);
          } catch (err) {
            console.error('[MarkDraw] Failed to seed demo shapes:', err);
          }
        } else {
          // Check if existing shapes have v3 widgets to migrate on load (§12)
          const hasV3Widgets = currentShapes.some((s) => isV3Widget(s));
          if (hasV3Widgets) {
            backupDocumentBeforeMigration(activeDoc.id, currentShapes);
            const { shapes: migrated } = migrateShapes(currentShapes);
            mountedEditor.deleteShapes(currentShapes.map((s) => s.id));
            mountedEditor.createShapes(migrated);
            showToast('Migrated v3 document to v4 semantic annotation layer.');
          }
        }
      }

      // Initial compile
      triggerCompile();

      // Listen to store updates
      const dispose = mountedEditor.store.listen(() => {
        touchDocument(activeDoc.id);

        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = window.setTimeout(triggerCompile, 35);
      });

      return () => {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }
        dispose();
      };
    },
    [triggerCompile, showToast, activeDoc.id]
  );

  // Re-compile when settings change
  useEffect(() => {
    triggerCompile();
  }, [triggerCompile]);

  // Global Keyboard Shortcuts (Task 5 Productivity Pack)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Panel toggle
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsRightPanelOpen((prev) => !prev);
      }
      // Shortcuts modal
      else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
      // Duplicate: Ctrl/Cmd+D
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && !isInput) {
        e.preventDefault();
        const current = editorRef.current;
        if (!current) return;
        const selectedIds = current.getSelectedShapeIds();
        if (selectedIds.length > 0) {
          current.duplicateShapes(selectedIds);
          showToast(`Duplicated ${selectedIds.length} element(s)`);
        }
      }
      // Nudge: Arrow keys 1px (Shift: 10px)
      else if (
        !isInput &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')
      ) {
        const current = editorRef.current;
        if (!current) return;
        const selected = current.getSelectedShapes();
        if (selected.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;
          else if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;

          current.updateShapes(
            selected.map((s) => ({
              id: s.id,
              type: s.type,
              x: s.x + dx,
              y: s.y + dy
            }))
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  // Document Operations (Task 1 & Task 2)
  const handleSelectDoc = (docId: string) => {
    const updated: MarkDrawDocRegistry = { ...docsRegistry, activeDocId: docId };
    saveDocRegistry(updated);
    setDocsRegistry(updated);
  };

  const handleNewDoc = () => {
    const { registry, newDoc } = createDocument();
    setDocsRegistry(registry);
    showToast(`Created document "${newDoc.name}"`);
  };

  const handleDuplicateDoc = () => {
    const currentShapes = editorRef.current?.getCurrentPageShapes() || [];
    const { registry, newDoc } = duplicateDocumentMeta(activeDoc.id);
    pendingShapesRef.current = currentShapes.map((s) => ({
      type: s.type,
      x: s.x,
      y: s.y,
      props: { ...s.props }
    }));
    setDocsRegistry(registry);
    showToast(`Duplicated into "${newDoc.name}"`);
  };

  const handleRenameDoc = (docId: string, newName: string) => {
    const updated = renameDocument(docId, newName);
    setDocsRegistry(updated);
  };

  const handleDeleteDoc = (docId: string) => {
    try {
      const updated = deleteDocument(docId);
      setDocsRegistry(updated);
      showToast('Document deleted');
    } catch (err: any) {
      showToast(err?.message || 'Cannot delete document');
    }
  };

  const handleExportFile = () => {
    const current = editorRef.current;
    const shapes = current ? current.getCurrentPageShapes() : [];
    const fileData = serializeDocToFile(activeDoc.name, shapes);
    const blob = new Blob([JSON.stringify(fileData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = activeDoc.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'wireframe';
    link.download = `${safeName}.markdraw.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported "${activeDoc.name}.markdraw.json"`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = validateImportFile(text);
      if (!res.isValid || !res.shapes) {
        showToast(res.error || 'Import failed: invalid file');
        return;
      }

      const { registry, newDoc } = createDocument(res.docName);
      pendingShapesRef.current = res.shapes.map((s) => ({
        type: 'ui-widget' as const,
        x: s.x,
        y: s.y,
        props: { ...s.props }
      }));
      setDocsRegistry(registry);
      showToast(`Imported "${newDoc.name}" (${res.shapes.length} widgets)`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Accurate Panel Resizing Logic
  const startResizingRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setActiveDrag('right');
  }, []);

  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (activeDrag === 'right') {
        if (!splitAreaRef.current) return;
        const rect = splitAreaRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const newPercent = (mouseX / rect.width) * 100;
        const minRightPx = 380;
        const maxCanvasPercent = Math.max(15, ((rect.width - minRightPx) / rect.width) * 100);
        const clamped = Math.min(maxCanvasPercent, Math.max(15, newPercent));
        setCanvasPercent(clamped);
      }
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag]);

  const getActiveContent = (): string => {
    switch (outputTab) {
      case 'spec':
        return compilation.markdownSpec;
      case 'grid':
        return compilation.markdownGrid;
      case 'ascii':
        return compilation.markdownAscii;
      case 'json':
        return compilation.jsonAst;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getActiveContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = getActiveContent();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyFullContract = async () => {
    if (!editorRef.current) return;
    const shapes = editorRef.current.getCurrentPageShapes();
    const fullRes = MarkDrawCompiler.compile(shapes, editorRef.current, {
      ...options,
      includeLegend: true
    });
    const textToCopy = fullRes.markdownSpec;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    }
  };

  const handleDownload = () => {
    const ext = outputTab === 'json' ? 'json' : outputTab === 'ascii' ? 'txt' : 'md';
    const blob = new Blob([getActiveContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdraw-export-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Recovery Snapshot for Error Boundary (Task 3)
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
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--md-bg)] text-[var(--md-text)] font-sans antialiased">
        {/* Top Application Header */}
        <header className="h-11 px-3 border-b border-[var(--md-border)] bg-[var(--md-surface)] flex items-center justify-between shrink-0 select-none z-20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[5px] bg-[var(--md-text-bold)] text-[var(--md-bg)] text-xs font-bold flex items-center justify-center">
              MD
            </div>
            <span className="text-xs font-bold tracking-tight text-[var(--md-text-bold)]">
              MarkDraw
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[var(--md-surface-raised)] text-[var(--md-text-muted)] border border-[var(--md-border)]">
              v{MARKDRAW_VERSION}
            </span>

            {/* Document Menu */}
            <DocumentMenu
              activeDoc={activeDoc}
              docs={docsRegistry.docs}
              onSelectDoc={handleSelectDoc}
              onNewDoc={handleNewDoc}
              onDuplicateDoc={handleDuplicateDoc}
              onRenameDoc={handleRenameDoc}
              onDeleteDoc={handleDeleteDoc}
              onExportFile={handleExportFile}
              onImportFile={handleImportFile}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Layout Presets */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)]">
              <button
                className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  !isRightPanelOpen
                    ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                }`}
                onClick={() => setIsRightPanelOpen(false)}
                title="Canvas Fullscreen Focus"
                aria-label="Canvas Fullscreen Focus"
              >
                Canvas Full
              </button>
              <button
                className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  isRightPanelOpen && Math.round(canvasPercent) === 75
                    ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                }`}
                onClick={() => {
                  setIsRightPanelOpen(true);
                  setCanvasPercent(75);
                }}
                title="Canvas Focus (75% / 25%)"
                aria-label="Canvas Focus (75% / 25%)"
              >
                Canvas 75%
              </button>
              <button
                className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  isRightPanelOpen && Math.round(canvasPercent) === 50
                    ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                }`}
                onClick={() => {
                  setIsRightPanelOpen(true);
                  setCanvasPercent(50);
                }}
                title="Equal Split (50% / 50%)"
                aria-label="Equal Split (50% / 50%)"
              >
                50 / 50
              </button>
              <button
                className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  isRightPanelOpen && Math.round(canvasPercent) === 35
                    ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                }`}
                onClick={() => {
                  setIsRightPanelOpen(true);
                  setCanvasPercent(35);
                }}
                title="Focus Code (35% / 65%)"
                aria-label="Focus Code (35% / 65%)"
              >
                Code 65%
              </button>
            </div>

            {/* Header Stats */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--md-text-muted)] px-2">
              <span>Elements: <strong className="text-[var(--md-text-bold)] font-mono">{compilation.elementCount}</strong></span>
              {compileDuration !== null && (
                <>
                  <span className="text-[var(--md-border)]">|</span>
                  <span className="font-mono text-[11px] text-[var(--md-accent)]" title="Compiler Execution Time">
                    ⚡ {compileDuration}ms
                  </span>
                </>
              )}
              <span className="text-[var(--md-border)]">|</span>
              <span>Roles: <strong className="text-[var(--md-text-bold)] font-mono">{ALL_ROLES.length}</strong></span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsShortcutsOpen(true)}
              title="Keyboard Shortcuts (?)"
              aria-label="Keyboard Shortcuts (?)"
            >
              <Keyboard size={15} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLegendOpen(true)}
              title="View Semantic Legend"
              aria-label="View Semantic Legend"
            >
              <BookOpen size={15} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              title="Compiler & Geometry Settings"
              aria-label="Compiler & Geometry Settings"
            >
              <Sliders size={15} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </Button>

            <Button
              variant={isRightPanelOpen ? 'accent' : 'ghost'}
              size="icon"
              onClick={() => setIsRightPanelOpen((prev) => !prev)}
              title={isRightPanelOpen ? 'Collapse Output Panel (Ctrl+J)' : 'Open Output Panel (Ctrl+J)'}
              aria-label={isRightPanelOpen ? 'Collapse Output Panel (Ctrl+J)' : 'Open Output Panel (Ctrl+J)'}
            >
              {isRightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            </Button>
          </div>
        </header>

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
              <Tldraw
                key={activeDoc.id}
                persistenceKey={activeDoc.persistenceKey}
                shapeUtils={[]}
                components={undefined}
                onMount={handleEditorMount}
              />

              {/* Semantic Annotation Layer Overlays */}
              <RoleChipsOverlay
                editor={editor}
                showChips={showRoleChips}
                onCopyContract={() => showToast('Copied contract to clipboard')}
              />
              <RolePanel editor={editor} />

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
            <aside
              role="region"
              aria-label="Live Output"
              aria-hidden={!isRightPanelOpen}
              inert={!isRightPanelOpen ? true : undefined}
              onTransitionEnd={() => {
                window.dispatchEvent(new Event('resize'));
              }}
              className={`h-full flex flex-col bg-[var(--md-surface)] overflow-hidden shrink-0 relative ${
                activeDrag === 'right' ? 'transition-none' : 'transition-[width] duration-200 ease-out'
              } ${isRightPanelOpen ? 'border-l border-[var(--md-border)]' : 'border-l-0 pointer-events-none'}`}
              style={{
                width: isRightPanelOpen ? `calc(${100 - canvasPercent}% - 5px)` : '0px',
                minWidth: isRightPanelOpen ? '380px' : '0px'
              }}
            >
              <div className="h-full flex flex-col shrink-0 overflow-hidden w-full min-w-0">
                {/* Output Toolbar (Line 1: Tabs, Line 2: Preview/Raw on Left + Copy Actions on Right on SAME line) */}
                <div className="min-h-10 px-2.5 py-1.5 border-b border-[var(--md-border)] flex items-center justify-between flex-wrap shrink-0 select-none gap-2 bg-[var(--md-surface)]">
                  {/* Primary Tabs */}
                  <div
                    role="tablist"
                    aria-label="Output View Modes"
                    className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)] shrink-0"
                  >
                    <button
                      role="tab"
                      aria-selected={outputTab === 'spec'}
                      aria-label="Spec Table view"
                      className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                        outputTab === 'spec'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                      }`}
                      onClick={() => setOutputTab('spec')}
                    >
                      <FileText size={13} />
                      <span>Spec <span className="hidden xl:inline">Table</span></span>
                    </button>
                    <button
                      role="tab"
                      aria-selected={outputTab === 'grid'}
                      aria-label="Spatial Grid view"
                      className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                        outputTab === 'grid'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                      }`}
                      onClick={() => setOutputTab('grid')}
                    >
                      <LayoutGrid size={13} />
                      <span><span className="hidden xl:inline">Spatial </span>Grid</span>
                    </button>
                    <button
                      role="tab"
                      aria-selected={outputTab === 'ascii'}
                      aria-label="ASCII layout view"
                      className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                        outputTab === 'ascii'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                      }`}
                      onClick={() => setOutputTab('ascii')}
                    >
                      <Terminal size={13} />
                      <span>ASCII</span>
                    </button>
                    <button
                      role="tab"
                      aria-selected={outputTab === 'json'}
                      aria-label="JSON AST view"
                      className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                        outputTab === 'json'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                      }`}
                      onClick={() => setOutputTab('json')}
                    >
                      <Code size={13} />
                      <span>JSON<span className="hidden xl:inline"> AST</span></span>
                    </button>
                  </div>

                  {/* Secondary Controls: Preview/Raw Toggle on Left + Actions on Right (Always on the same line) */}
                  <div className="flex items-center justify-between gap-2 flex-1 min-w-[280px]">
                    {/* View Mode Toggle (Preview vs Raw) */}
                    {(outputTab === 'spec' || outputTab === 'grid') ? (
                      <div
                        role="group"
                        aria-label="Display View Mode"
                        className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)] shrink-0"
                      >
                        <button
                          type="button"
                          aria-pressed={outputDisplayMode === 'preview'}
                          className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                            outputDisplayMode === 'preview'
                              ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] shadow-xs font-semibold'
                              : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                          }`}
                          onClick={() => handleOutputDisplayModeChange('preview')}
                          title="Formatted Markdown Preview"
                          aria-label="Formatted preview mode"
                        >
                          <Eye size={12} className={outputDisplayMode === 'preview' ? 'text-blue-500' : ''} />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          aria-pressed={outputDisplayMode === 'raw'}
                          className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                            outputDisplayMode === 'raw'
                              ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] shadow-xs font-semibold'
                              : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                          }`}
                          onClick={() => handleOutputDisplayModeChange('raw')}
                          title="Raw Markdown Syntax"
                          aria-label="Raw Markdown mode"
                        >
                          <Code size={12} className={outputDisplayMode === 'raw' ? 'text-blue-500' : ''} />
                          <span>Raw</span>
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* Platform Selector & Scope Toggle (v4 - §9.3) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={platformId}
                        onChange={(e) => setPlatformId(e.target.value)}
                        className="h-6 rounded border border-[var(--md-border)] bg-[var(--md-surface)] px-1.5 text-[11px] text-[var(--md-text)] font-medium cursor-pointer"
                        title="Target compilation platform profile (§10)"
                      >
                        <option value="web">Web</option>
                        <option value="android-material">Android (M3)</option>
                      </select>
                      <div
                        role="group"
                        aria-label="Compilation Scope"
                        className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)]"
                      >
                        <button
                          type="button"
                          onClick={() => setCompileScopeMode('all')}
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                            compileScopeMode === 'all'
                              ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] font-semibold shadow-xs'
                              : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                          }`}
                          title="Compile all roots on canvas"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompileScopeMode('selection')}
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                            compileScopeMode === 'selection'
                              ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] font-semibold shadow-xs'
                              : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                          }`}
                          title="Compile selected subtree only"
                        >
                          Selection
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      <Button
                        variant={copied ? 'success' : 'brand'}
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 gap-1.5 text-xs font-medium shrink-0 px-2.5"
                        title="Copy lean contract (Directive + Spec Table)"
                        aria-label="Copy to Clipboard"
                      >
                        {copied ? (
                          <>
                            <Check size={12} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant={copiedFull ? 'success' : 'outline'}
                        size="sm"
                        onClick={handleCopyFullContract}
                        className="h-7 gap-1.5 text-xs font-medium shrink-0 px-2.5"
                        title="Copy full contract with auto-generated canvas legend"
                        aria-label="Copy Full Contract"
                      >
                        {copiedFull ? (
                          <>
                            <Check size={12} />
                            <span>Copied Full</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Full</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDownload}
                        className="shrink-0"
                        title="Download Source"
                        aria-label="Download Source"
                      >
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Informational Lints Banner */}
                {compilation.lints && compilation.lints.length > 0 && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    {compilation.lints.map((lint, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <AlertCircle size={13} className="shrink-0 text-amber-500" />
                        <span>{lint}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Output Viewport */}
                <div className="flex-1 overflow-auto p-3 bg-[var(--md-bg)]">
                  {(outputTab === 'spec' || outputTab === 'grid') && outputDisplayMode === 'preview' ? (
                    <MarkdownPreview content={getActiveContent()} />
                  ) : (
                    <pre className="text-xs font-mono leading-relaxed text-[var(--md-text)] whitespace-pre-wrap select-text">
                      <code>{getActiveContent()}</code>
                    </pre>
                  )}
                </div>

                {/* Output Footer */}
                <footer className="h-7 px-3 border-t border-[var(--md-border)] bg-[var(--md-surface)] flex items-center justify-between text-[11px] text-[var(--md-text-subtle)] shrink-0 select-none">
                  <span>
                    {(outputTab === 'spec' || outputTab === 'grid') && outputDisplayMode === 'preview'
                      ? 'Formatted Markdown preview. "Copy" always copies pristine raw markdown for LLMs.'
                      : 'Semantic layout compiled in real time. Paste directly into LLM prompts.'}
                  </span>
                </footer>
              </div>
            </aside>
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
    </ErrorBoundary>
  );
};
