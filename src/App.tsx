import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { MarkDrawCompiler } from './core/compiler';
import { CompilationResult } from './core/types';
import { UIWidgetShapeUtil } from './core/widgets/UIWidgetShapeUtil';
import { ComponentPalette } from './components/ComponentPalette';
import { WidgetCatalogItem } from './core/widgets/types';
import { Copy, Download, Check, Code, LayoutGrid, FileText, Sparkles } from 'lucide-react';
import styles from './App.module.css';

const customShapeUtils = [UIWidgetShapeUtil];

export const App: React.FC = () => {
  const [outputTab, setOutputTab] = useState<'spec' | 'grid' | 'json'>('spec');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(true);
  const [canvasPercent, setCanvasPercent] = useState<number>(55);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [compilation, setCompilation] = useState<CompilationResult>({
    markdownSpec: 'Draw elements on the canvas or pick UI components from the library to generate the specification.',
    markdownGrid: '',
    jsonAst: '{}',
    timestamp: '',
    elementCount: 0
  });

  const editorRef = useRef<Editor | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const handleEditorMount = useCallback((editor: Editor) => {
    editorRef.current = editor;

    const triggerCompile = () => {
      try {
        const shapes = editor.getCurrentPageShapes();
        const result = MarkDrawCompiler.compile(shapes, editor);
        setCompilation(result);
      } catch (err) {
        console.error('MarkDraw compilation error:', err);
      }
    };

    // Initial compile
    triggerCompile();

    // Listen to all shape changes and debounce compilation
    const dispose = editor.store.listen(() => {
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
  }, []);

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
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const bounds = editor.getViewportPageBounds();
      const centerX = (bounds as any).center?.x ?? (bounds.x + bounds.w / 2);
      const centerY = (bounds as any).center?.y ?? (bounds.y + bounds.h / 2);

      editor.createShape({
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
          value: item.defaultProps.value ?? 0
        }
      });
    } catch (err) {
      console.error('Failed to insert widget:', err);
    }
  };

  const getActiveContent = (): string => {
    switch (outputTab) {
      case 'spec': return compilation.markdownSpec;
      case 'grid': return compilation.markdownGrid;
      case 'json': return compilation.jsonAst;
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
    const ext = outputTab === 'json' ? 'json' : 'md';
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
          <span className={styles.versionBadge}>v1.1 (Semantic UI Compiler)</span>
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8' }}>
              <Sparkles size={13} />
              <span>21 UI Widgets</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className={styles.workspace}>
        {isDragging && <div className={styles.draggingOverlay} />}

        {/* Left Pane: Infinite Canvas with Component Palette Overlay */}
        <div
          className={styles.canvasContainer}
          style={{ width: `${canvasPercent}%`, flex: 'none' }}
        >
          <ComponentPalette
            isOpen={isPaletteOpen}
            onToggle={() => setIsPaletteOpen((prev) => !prev)}
            onInsertWidget={handleInsertWidget}
          />
          <Tldraw shapeUtils={customShapeUtils} onMount={handleEditorMount} />
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

        {/* Right Pane: Live Reactive Markdown Output */}
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
                <FileText size={15} /> Spec Table
              </button>
              <button
                className={`${styles.tabBtn} ${outputTab === 'grid' ? styles.activeTab : ''}`}
                onClick={() => setOutputTab('grid')}
              >
                <LayoutGrid size={15} /> Spatial Grid
              </button>
              <button
                className={`${styles.tabBtn} ${outputTab === 'json' ? styles.activeTab : ''}`}
                onClick={() => setOutputTab('json')}
              >
                <Code size={15} /> AST (JSON)
              </button>
            </div>
            <div className={styles.actions}>
              <button className={styles.actionBtn} onClick={handleCopy} title="Copy to Clipboard">
                {copied ? <Check size={16} className={styles.greenIcon} /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className={styles.actionBtn} onClick={handleDownload} title="Download Source">
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className={styles.outputViewport}>
            <pre className={styles.codeBlock}>
              <code>{getActiveContent()}</code>
            </pre>
          </div>

          <footer className={styles.outputFooter}>
            <span>Semantic component tree compiled in real time. Paste directly into your LLM prompt.</span>
          </footer>
        </aside>
      </div>
    </div>
  );
};
