import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tldraw, Editor, TLUiComponents } from '@tldraw/tldraw';
import { MarkDrawCompiler } from './core/compiler';
import { CompilationResult, CompilationOptions } from './core/types';
import { UIWidgetShapeUtil } from './core/widgets/UIWidgetShapeUtil';
import { ComponentPalette } from './components/ComponentPalette';
import { PropsPanel } from './components/PropsPanel';
import { WidgetCatalogItem } from './core/widgets/types';
import { WIDGET_CATALOG } from './core/widgets/widgetCatalog';
import { LegendModal } from './components/LegendModal';
import { SettingsModal } from './components/SettingsModal';
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
  AlertCircle
} from 'lucide-react';
import styles from './App.module.css';

const customShapeUtils = [UIWidgetShapeUtil];

// Part 5: Lockdown default tldraw UI
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
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [canvasPercent, setCanvasPercent] = useState<number>(55);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Canvas tool state & editor state
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

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

  const triggerCompile = useCallback(() => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    try {
      const shapes = currentEditor.getCurrentPageShapes();
      const result = MarkDrawCompiler.compile(shapes, currentEditor, options);
      setCompilation(result);
    } catch (err) {
      console.error('MarkDraw compilation error:', err);
    }
  }, [options]);

  const handleEditorMount = useCallback(
    (mountedEditor: Editor) => {
      editorRef.current = mountedEditor;
      setEditor(mountedEditor);

      // Part 5: Restrict tools and lock instance state to wireframe shapes
      try {
        mountedEditor.updateInstanceState({ isToolLocked: true, isGridMode: true });
      } catch (err) {
        console.error('Lockdown configuration error:', err);
      }

      // Safety net: check for any non-ui-widget shapes and remove them
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
    [triggerCompile, showToast]
  );

  // Re-compile when settings change
  useEffect(() => {
    triggerCompile();
  }, [triggerCompile]);

  // Panel Resizing logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPercent = (e.clientX / window.innerWidth) * 100;
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
    if (!editorRef.current) return;
    try {
      editorRef.current.setCurrentTool(toolId);
      setActiveTool(toolId);
    } catch (e) {
      console.error(e);
    }
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

  return (
    <div className={styles.appShell}>
      {/* Top Application Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoBadge}>MD</div>
          <span className={styles.brandTitle}>MarkDraw</span>
          <span className={styles.versionBadge}>v2.5</span>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.layoutPresets}>
            <button
              className={`${styles.presetBtn} ${Math.round(canvasPercent) === 75 ? styles.activePreset : ''}`}
              onClick={() => setCanvasPercent(75)}
              title="Focus Canvas (75% / 25%)"
            >
              Canvas Focus
            </button>
            <button
              className={`${styles.presetBtn} ${Math.round(canvasPercent) === 50 ? styles.activePreset : ''}`}
              onClick={() => setCanvasPercent(50)}
              title="Equal Split (50% / 50%)"
            >
              50 / 50
            </button>
            <button
              className={`${styles.presetBtn} ${Math.round(canvasPercent) === 35 ? styles.activePreset : ''}`}
              onClick={() => setCanvasPercent(35)}
              title="Focus Code (35% / 65%)"
            >
              Code Focus
            </button>
          </div>

          <div className={styles.headerStats}>
            <span>Elements: <strong>{compilation.elementCount}</strong></span>
            <span className={styles.statDivider}>|</span>
            <span>Catalog: <strong>{WIDGET_CATALOG.length} Widgets</strong></span>
          </div>

          <button
            className={styles.iconBtn}
            onClick={() => setIsLegendOpen(true)}
            title="View Semantic Legend (Part 4)"
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
            className={styles.iconBtn}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className={styles.workspace}>
        {isDragging && <div className={styles.draggingOverlay} />}

        {/* Left Native Component Palette Rail */}
        <ComponentPalette
          isOpen={isPaletteOpen}
          onToggle={() => setIsPaletteOpen((prev) => !prev)}
          onInsertWidget={handleInsertWidget}
        />

        {/* Canvas Container */}
        <div
          className={styles.canvasContainer}
          style={{ width: `${canvasPercent}%`, flex: 'none' }}
        >
          <Tldraw
            persistenceKey="markdraw"
            shapeUtils={customShapeUtils}
            components={tldrawComponents}
            onMount={handleEditorMount}
          />

          {/* Properties Mini-Panel (Part 2.2) */}
          <PropsPanel editor={editor} />

          {/* Minimal Floating Canvas Controls (Part 5) */}
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
          </div>

          {/* Non-widget Warning Toast (Part 5) */}
          {toastMessage && (
            <div className={styles.toast}>
              <AlertCircle size={14} />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* Resizer Divider */}
        <div
          className={`${styles.resizer} ${isDragging ? styles.resizerActive : ''}`}
          onMouseDown={startResizing}
          onDoubleClick={() => setCanvasPercent(55)}
          title="Drag to resize panels (Double-click to reset)"
        >
          <div className={styles.resizerHandle} />
        </div>

        {/* Right Pane: Live Reactive Output */}
        <aside
          className={styles.outputContainer}
          style={{ width: `calc(${100 - canvasPercent}% - 8px)`, flex: 'none' }}
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
      </div>

      {/* In-App Modals */}
      <LegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onChange={handleOptionsChange}
      />
    </div>
  );
};
