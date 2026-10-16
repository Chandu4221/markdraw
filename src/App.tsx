import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Tldraw, Editor, TLUiComponents } from '@tldraw/tldraw';
import { MarkDrawCompiler, MARKDRAW_VERSION } from './core/compiler';
import { CompilationResult, CompilationOptions } from './core/types';
import { UIWidgetShapeUtil } from './core/widgets/UIWidgetShapeUtil';
import { ComponentPalette } from './components/ComponentPalette';
import { PropsPanel } from './components/PropsPanel';
import { WidgetCatalogItem } from './core/widgets/types';
import { WIDGET_CATALOG } from './core/widgets/widgetCatalog';
import { LegendModal } from './components/LegendModal';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DocumentMenu } from './components/DocumentMenu';
import { ErrorBoundary } from './components/ErrorBoundary';
import CompileWorker from './core/compile.worker?worker';
import { CompileWorkerResponse } from './core/compile.worker';
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
  MousePointer,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Tag,
  Keyboard
} from 'lucide-react';
import styles from './App.module.css';

const customShapeUtils = [UIWidgetShapeUtil];

// Lockdown default tldraw UI
const tldrawComponents: TLUiComponents = {
  Toolbar: null,
  PageMenu: null,
  MainMenu: null,
  StylePanel: null,
  NavigationPanel: null,
  QuickActions: null,
  HelperButtons: null
};

const DEFAULT_OPTIONS: Required<CompilationOptions> = {
  containmentThreshold: 0.85,
  rowClusterThreshold: 16,
  gridBandThreshold: 32,
  includeTimestamp: false,
  includeLegend: true
};

export const App: React.FC = () => {
  const [outputTab, setOutputTab] = useState<'spec' | 'grid' | 'ascii' | 'json'>('spec');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [canvasPercent, setCanvasPercent] = useState<number>(55);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [compileDuration, setCompileDuration] = useState<number | null>(null);

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

  // Canvas Labels Toggle (Task 5: Persisted in localStorage)
  const [showLabels, setShowLabels] = useState<boolean>(() => {
    const saved = localStorage.getItem('markdraw_show_labels');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleLabels = () => {
    setShowLabels((prev) => {
      const next = !prev;
      localStorage.setItem('markdraw_show_labels', String(next));
      return next;
    });
  };

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
  const warnedRef = useRef<boolean>(false);
  const workerRef = useRef<Worker | null>(null);
  const compileIdRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Web Worker for Background Compilation (Task 6)
  useEffect(() => {
    try {
      const worker = new CompileWorker();
      worker.onmessage = (e: MessageEvent<CompileWorkerResponse>) => {
        const { compileId, result, durationMs } = e.data;
        if (compileId === compileIdRef.current) {
          if (result) {
            setCompilation(result);
            if (durationMs > 50) {
              setCompileDuration(durationMs);
            } else {
              setCompileDuration(null);
            }
          }
        }
      };
      workerRef.current = worker;
    } catch (e) {
      console.warn('[MarkDraw] Background worker not supported, falling back to main thread:', e);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Compile Trigger with Crash Recovery & Threshold-based Worker Offloading
  const triggerCompile = useCallback(() => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    try {
      const shapes = currentEditor.getCurrentPageShapes();
      const widgetShapes = shapes.filter((s) => s.type === 'ui-widget');
      compileIdRef.current += 1;
      const currentCompileId = compileIdRef.current;

      // Offload to Web Worker when > 300 shapes
      if (widgetShapes.length > 300 && workerRef.current) {
        const serialized = widgetShapes.map((s) => {
          let x = s.x;
          let y = s.y;
          let w = (s.props as any)?.w || 100;
          let h = (s.props as any)?.h || 100;
          if (typeof (currentEditor as any).getShapePageBounds === 'function') {
            const pb = (currentEditor as any).getShapePageBounds(s);
            if (pb) {
              x = pb.x;
              y = pb.y;
              w = pb.w;
              h = pb.h;
            }
          }
          return {
            id: s.id,
            type: s.type,
            x,
            y,
            props: { ...s.props, w, h }
          };
        });

        workerRef.current.postMessage({
          compileId: currentCompileId,
          shapes: serialized,
          options
        });
      } else {
        const start = performance.now();
        const result = MarkDrawCompiler.compile(shapes, currentEditor, options);
        const duration = Math.round(performance.now() - start);
        setCompilation(result);
        if (duration > 50) {
          setCompileDuration(duration);
        } else {
          setCompileDuration(null);
        }
      }
    } catch (err) {
      console.error('MarkDraw compilation error:', err);
      showToast('Compile error — showing last valid output');
    }
  }, [options, showToast]);

  const handleEditorMount = useCallback(
    (mountedEditor: Editor) => {
      editorRef.current = mountedEditor;
      setEditor(mountedEditor);

      try {
        mountedEditor.updateInstanceState({ isToolLocked: true, isGridMode: true });
      } catch (err) {
        console.error('Lockdown configuration error:', err);
      }

      // Check if we have pending shapes to create (from duplicate or file import)
      if (pendingShapesRef.current && pendingShapesRef.current.length > 0) {
        const toCreate = pendingShapesRef.current;
        pendingShapesRef.current = null;
        try {
          mountedEditor.createShapes(toCreate);
        } catch (err) {
          console.error('[MarkDraw] Failed to create pending shapes:', err);
        }
      } else {
        // Otherwise, if canvas is completely empty, seed with demo layout (Task 1.6)
        const currentShapes = mountedEditor.getCurrentPageShapes();
        if (currentShapes.length === 0) {
          try {
            mountedEditor.createShapes(getDemoCanvasShapes());
          } catch (err) {
            console.error('[MarkDraw] Failed to seed demo shapes:', err);
          }
        }
      }

      // Enforce wireframe widget only
      const enforceWidgetOnly = () => {
        const shapes = mountedEditor.getCurrentPageShapes();
        const invalidShapes = shapes.filter((s) => s.type !== 'ui-widget');
        if (invalidShapes.length > 0) {
          if (!warnedRef.current) {
            warnedRef.current = true;
            showToast('MarkDraw supports wireframe components only.');
          }
          mountedEditor.deleteShapes(invalidShapes.map((s) => s.id));
        }
      };

      // Initial compile
      triggerCompile();

      // Listen to store updates
      const dispose = mountedEditor.store.listen(() => {
        enforceWidgetOnly();
        setActiveTool(mountedEditor.getCurrentToolId());
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

      // Panel toggles
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsRightPanelOpen((prev) => !prev);
      }
      // Shortcuts modal
      else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
      // Duplicate: Ctrl/Cmd+D offset (+24, +24)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && !isInput) {
        e.preventDefault();
        const current = editorRef.current;
        if (!current) return;
        const selected = current.getSelectedShapes().filter((s) => s.type === 'ui-widget');
        if (selected.length > 0) {
          const duplicated = selected.map((s) => ({
            type: 'ui-widget' as const,
            x: s.x + 24,
            y: s.y + 24,
            props: { ...s.props }
          }));
          current.createShapes(duplicated);
          showToast(`Duplicated ${selected.length} widget(s)`);
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

  // Accurate Panel Resizing Logic relative to splitArea
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitAreaRef.current) return;
      const rect = splitAreaRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const newPercent = (mouseX / rect.width) * 100;
      const clamped = Math.min(85, Math.max(15, newPercent));
      setCanvasPercent(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleInsertWidget = (item: WidgetCatalogItem) => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    try {
      const bounds = currentEditor.getViewportPageBounds();
      const centerX = (bounds as any).center?.x ?? bounds.x + bounds.w / 2;
      const centerY = (bounds as any).center?.y ?? bounds.y + bounds.h / 2;

      currentEditor.createShape({
        type: 'ui-widget',
        x: centerX - item.defaultWidth / 2,
        y: centerY - item.defaultHeight / 2,
        props: {
          w: item.defaultWidth,
          h: item.defaultHeight,
          widgetType: item.type,
          label: item.defaultProps.label || item.name,
          variant: item.defaultProps.variant || '',
          placeholder: item.defaultProps.placeholder || '',
          checked: item.defaultProps.checked ?? false,
          options: item.defaultProps.options || '',
          iconName: item.defaultProps.iconName || '',
          subtext: item.defaultProps.subtext || '',
          value: item.defaultProps.value ?? 0,
          showText: item.defaultProps.showText ?? false,
          altText: item.defaultProps.altText || ''
        }
      });
    } catch (err) {
      console.error('Failed to insert widget:', err);
    }
  };

  const handleSelectTool = (toolId: string) => {
    const current = editorRef.current;
    if (!current) return;
    current.setCurrentTool(toolId);
    setActiveTool(toolId);
  };

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
      <div className={styles.appShell}>
        {/* Top Application Header */}
        <header className={styles.header}>
          <div className={styles.brand}>
            <button
              className={`${styles.iconBtn} ${isPaletteOpen ? styles.iconBtnActive : ''}`}
              onClick={() => setIsPaletteOpen((prev) => !prev)}
              title={isPaletteOpen ? 'Collapse Components (Ctrl+B)' : 'Open Components (Ctrl+B)'}
            >
              {isPaletteOpen ? <PanelLeftClose size={15} strokeWidth={1.5} /> : <PanelLeftOpen size={15} strokeWidth={1.5} />}
            </button>

            <div className={styles.logoBadge}>MD</div>
            <span className={styles.brandTitle}>MarkDraw</span>
            <span className={styles.versionBadge}>v{MARKDRAW_VERSION}</span>

            {/* Document Menu (Task 1 & Task 2) */}
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

          <div className={styles.headerControls}>
            <div className={styles.layoutPresets}>
              <button
                className={`${styles.presetBtn} ${!isRightPanelOpen ? styles.activePreset : ''}`}
                onClick={() => setIsRightPanelOpen(false)}
                title="Canvas Fullscreen Focus"
              >
                Canvas Full
              </button>
              <button
                className={`${styles.presetBtn} ${isRightPanelOpen && Math.round(canvasPercent) === 75 ? styles.activePreset : ''}`}
                onClick={() => {
                  setIsRightPanelOpen(true);
                  setCanvasPercent(75);
                }}
                title="Canvas Focus (75% / 25%)"
              >
                Canvas 75%
              </button>
              <button
                className={`${styles.presetBtn} ${isRightPanelOpen && Math.round(canvasPercent) === 50 ? styles.activePreset : ''}`}
                onClick={() => {
                  setIsRightPanelOpen(true);
                  setCanvasPercent(50);
                }}
                title="Equal Split (50% / 50%)"
              >
                50 / 50
              </button>
              <button
                className={`${styles.presetBtn} ${isRightPanelOpen && Math.round(canvasPercent) === 35 ? styles.activePreset : ''}`}
                onClick={() => {
                  setIsRightPanelOpen(true);
                  setCanvasPercent(35);
                }}
                title="Focus Code (35% / 65%)"
              >
                Code 65%
              </button>
            </div>

            <div className={styles.headerStats}>
              <span>Elements: <strong>{compilation.elementCount}</strong></span>
              {compileDuration !== null && (
                <>
                  <span className={styles.statDivider}>|</span>
                  <span style={{ fontFamily: 'var(--md-font-mono)', fontSize: 11, opacity: 0.85 }} title="Compiler Execution Time">
                    compiled in {compileDuration}ms
                  </span>
                </>
              )}
              <span className={styles.statDivider}>|</span>
              <span>Catalog: <strong>{WIDGET_CATALOG.length} Widgets</strong></span>
            </div>

            <button
              className={styles.iconBtn}
              onClick={() => setIsShortcutsOpen(true)}
              title="Keyboard Shortcuts & Productivity (?)"
            >
              <Keyboard size={15} strokeWidth={1.5} />
            </button>

            <button
              className={styles.iconBtn}
              onClick={() => setIsLegendOpen(true)}
              title="View Semantic Legend"
            >
              <BookOpen size={15} strokeWidth={1.5} />
            </button>

            <button
              className={styles.iconBtn}
              onClick={() => setIsSettingsOpen(true)}
              title="Compiler & Geometry Settings"
            >
              <Sliders size={15} strokeWidth={1.5} />
            </button>

            <button
              className={`${styles.iconBtn} ${isRightPanelOpen ? styles.iconBtnActive : ''}`}
              onClick={() => setIsRightPanelOpen((prev) => !prev)}
              title={isRightPanelOpen ? 'Collapse Output Panel (Ctrl+J)' : 'Open Output Panel (Ctrl+J)'}
            >
              {isRightPanelOpen ? <PanelRightClose size={15} strokeWidth={1.5} /> : <PanelRightOpen size={15} strokeWidth={1.5} />}
            </button>

            <button
              className={styles.iconBtn}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <div className={styles.workspace}>
          {isDragging && <div className={styles.draggingOverlay} />}

          {/* Left Native Component Palette Rail */}
          <ComponentPalette
            isOpen={isPaletteOpen}
            onToggle={() => setIsPaletteOpen((prev) => !prev)}
            onInsertWidget={handleInsertWidget}
          />

          {/* Split Area: Canvas + Resizer + Output */}
          <div className={styles.splitArea} ref={splitAreaRef}>
            {/* Canvas Container with dynamic key per document (Task 1) */}
            <div
              className={`${styles.canvasContainer} ${isDragging ? styles.resizing : ''}`}
              data-show-labels={showLabels}
              style={{
                width: isRightPanelOpen ? `calc(${canvasPercent}% - 4px)` : '100%',
                flex: isRightPanelOpen ? 'none' : '1'
              }}
            >
              <Tldraw
                key={activeDoc.id}
                persistenceKey={activeDoc.persistenceKey}
                shapeUtils={customShapeUtils}
                components={tldrawComponents}
                onMount={handleEditorMount}
              />

              {/* Quick Floating Open Button for Left Palette if closed */}
              {!isPaletteOpen && (
                <button
                  className={`${styles.floatingPanelBtn} ${styles.floatingLeftBtn}`}
                  onClick={() => setIsPaletteOpen(true)}
                  title="Open Components (Ctrl+B)"
                >
                  <PanelLeftOpen size={14} strokeWidth={1.5} />
                  <span>Components</span>
                </button>
              )}

              {/* Quick Floating Open Button for Right Output if closed */}
              {!isRightPanelOpen && (
                <button
                  className={`${styles.floatingPanelBtn} ${styles.floatingRightBtn}`}
                  onClick={() => setIsRightPanelOpen(true)}
                  title="Open Live Output (Ctrl+J)"
                >
                  <PanelRightOpen size={14} strokeWidth={1.5} />
                  <span>Output</span>
                </button>
              )}

              {/* Properties Mini-Panel with Multi-Select support (Task 4) */}
              <div style={{ position: 'absolute', top: !isRightPanelOpen ? 46 : 0, right: 0, zIndex: 400 }}>
                <PropsPanel editor={editor} />
              </div>

              {/* Minimal Floating Canvas Controls */}
              <div className={styles.canvasControlBar}>
                <button
                  className={`${styles.canvasControlBtn} ${activeTool === 'select' ? styles.canvasControlBtnActive : ''}`}
                  onClick={() => handleSelectTool('select')}
                  title="Select Tool (V)"
                >
                  <MousePointer size={14} strokeWidth={1.5} />
                </button>
                <button
                  className={`${styles.canvasControlBtn} ${activeTool === 'hand' ? styles.canvasControlBtnActive : ''}`}
                  onClick={() => handleSelectTool('hand')}
                  title="Hand / Pan Tool (H)"
                >
                  <Hand size={14} strokeWidth={1.5} />
                </button>

                <div className={styles.canvasControlDivider} />

                <button
                  className={styles.canvasControlBtn}
                  onClick={() => editorRef.current?.undo()}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={14} strokeWidth={1.5} />
                </button>
                <button
                  className={styles.canvasControlBtn}
                  onClick={() => editorRef.current?.redo()}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={14} strokeWidth={1.5} />
                </button>

                <div className={styles.canvasControlDivider} />

                <button
                  className={styles.canvasControlBtn}
                  onClick={() => editorRef.current?.zoomIn()}
                  title="Zoom In"
                >
                  <ZoomIn size={14} strokeWidth={1.5} />
                </button>
                <button
                  className={styles.canvasControlBtn}
                  onClick={() => editorRef.current?.zoomOut()}
                  title="Zoom Out"
                >
                  <ZoomOut size={14} strokeWidth={1.5} />
                </button>
                <button
                  className={styles.canvasControlBtn}
                  onClick={() => editorRef.current?.zoomToFit()}
                  title="Zoom to Fit"
                >
                  <Maximize size={14} strokeWidth={1.5} />
                </button>

                <div className={styles.canvasControlDivider} />

                <button
                  className={styles.canvasControlBtn}
                  onClick={() => {
                    const current = editorRef.current;
                    if (!current) return;
                    const selected = current.getSelectedShapeIds();
                    if (selected.length > 0) {
                      current.deleteShapes(selected);
                    }
                  }}
                  title="Delete Selected"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>

                <div className={styles.canvasControlDivider} />

                <button
                  className={`${styles.canvasControlBtn} ${showLabels ? styles.canvasControlBtnActive : ''}`}
                  onClick={toggleLabels}
                  title={showLabels ? 'Hide Component Labels' : 'Show Component Labels'}
                >
                  <Tag size={14} strokeWidth={1.5} />
                  <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 4 }}>Labels</span>
                </button>
              </div>

              {/* Warning Toast */}
              {toastMessage && (
                <div className={styles.toast}>
                  <AlertCircle size={14} />
                  <span>{toastMessage}</span>
                </div>
              )}
            </div>

            {/* Resizer Divider */}
            {isRightPanelOpen && (
              <div
                className={`${styles.resizer} ${isDragging ? styles.resizerActive : ''}`}
                onMouseDown={startResizing}
                onDoubleClick={() => setCanvasPercent(55)}
                title="Drag to resize (Double-click to reset 55/45)"
              >
                <div className={styles.resizerHandle} />
              </div>
            )}

            {/* Right Pane: Live Reactive Output */}
            {isRightPanelOpen && (
              <aside
                className={`${styles.outputContainer} ${isDragging ? styles.resizing : ''}`}
                style={{
                  width: `calc(${100 - canvasPercent}% - 4px)`,
                  flex: 'none'
                }}
              >
                <div className={styles.outputToolbar}>
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tabBtn} ${outputTab === 'spec' ? styles.activeTab : ''}`}
                      onClick={() => setOutputTab('spec')}
                    >
                      <FileText size={14} strokeWidth={1.5} /> Spec Table
                    </button>
                    <button
                      className={`${styles.tabBtn} ${outputTab === 'grid' ? styles.activeTab : ''}`}
                      onClick={() => setOutputTab('grid')}
                    >
                      <LayoutGrid size={14} strokeWidth={1.5} /> Spatial Grid
                    </button>
                    <button
                      className={`${styles.tabBtn} ${outputTab === 'ascii' ? styles.activeTab : ''}`}
                      onClick={() => setOutputTab('ascii')}
                    >
                      <Terminal size={14} strokeWidth={1.5} /> ASCII Layout
                    </button>
                    <button
                      className={`${styles.tabBtn} ${outputTab === 'json' ? styles.activeTab : ''}`}
                      onClick={() => setOutputTab('json')}
                    >
                      <Code size={14} strokeWidth={1.5} /> AST (JSON)
                    </button>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={handleCopy} title="Copy to Clipboard">
                      {copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button className={styles.actionBtn} onClick={handleDownload} title="Download Source">
                      <Download size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setIsRightPanelOpen(false)}
                      title="Collapse Output Panel (Ctrl+J)"
                    >
                      <PanelRightClose size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className={styles.outputViewport}>
                  <pre className={styles.codeBlock}>
                    <code>{getActiveContent()}</code>
                  </pre>
                </div>

                <footer className={styles.outputFooter}>
                  <span>Semantic layout compiled in real time. Paste directly into LLM prompts.</span>
                </footer>
              </aside>
            )}
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
