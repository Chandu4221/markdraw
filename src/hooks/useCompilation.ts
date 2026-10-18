import { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '../canvas/tldraw';
import { CanvasDriver } from '../canvas/port/CanvasDriver';
import { CanvasShape } from '../canvas/port/CanvasShape';
import { MarkDrawCompiler } from '../core/compiler';
import { CompilationResult, CompilationOptions } from '../core/types';
import { migrateShapes, isV3Widget, backupDocumentBeforeMigration } from '../annotation/migrate';
import { touchDocument, getDemoCanvasShapes, MarkDrawDocMeta } from '../core/documents';
import { OutputTab } from '../components/output';

export function canvasShapesToCompilerShapes(canvasShapes: CanvasShape[]): any[] {
  return canvasShapes.map((s) => ({
    id: s.id,
    type: s.kind === 'frame' ? 'frame' : s.kind === 'group' ? 'group' : 'geo',
    x: s.bounds.x,
    y: s.bounds.y,
    rotation: s.bounds.rotation || 0,
    parentId: s.parentId,
    props: {
      geo: s.kind === 'ellipse' ? 'ellipse' : s.kind === 'diamond' ? 'diamond' : 'rectangle',
      w: s.bounds.w,
      h: s.bounds.h,
      text: s.text,
      name: s.name
    },
    meta: s.meta
  }));
}

export interface UseCompilationProps {
  options: Required<CompilationOptions>;
  platformId: string;
  compileScopeMode: 'all' | 'selection';
  activeDoc: MarkDrawDocMeta;
  pendingShapesRef: React.MutableRefObject<any[] | null>;
  editorRef?: React.MutableRefObject<Editor | null>;
  driverRef?: React.MutableRefObject<CanvasDriver | null>;
  setEditor?: React.Dispatch<React.SetStateAction<Editor | null>>;
  showToast: (msg: string) => void;
  outputTab: OutputTab;
}

export function useCompilation({
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
}: UseCompilationProps) {
  const [compilation, setCompilation] = useState<CompilationResult>({
    markdownSpec: 'Draw elements on the canvas or pick UI components to compile.',
    markdownGrid: '',
    markdownAscii: '',
    jsonAst: '[]',
    timestamp: '',
    elementCount: 0
  });

  const [compileDuration, setCompileDuration] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);

  const debounceTimerRef = useRef<number | null>(null);
  const compileIdRef = useRef<number>(0);

  // Compile Trigger with Crash Recovery
  const triggerCompile = useCallback(async () => {
    try {
      let shapes: any[] = [];
      let selectedIds: string[] = [];

      if (driverRef?.current) {
        const canvasShapes = await driverRef.current.listShapes();
        shapes = canvasShapesToCompilerShapes(canvasShapes);
      } else if (editorRef?.current) {
        shapes = editorRef.current.getCurrentPageShapes();
        selectedIds = editorRef.current.getSelectedShapeIds().map((id) => id as string);
      } else {
        return;
      }

      compileIdRef.current += 1;

      const compileOpts: CompilationOptions = {
        ...options,
        platformId,
        scope:
          compileScopeMode === 'selection' && selectedIds.length > 0
            ? { shapeIds: selectedIds }
            : null
      };

      const start = performance.now();
      const result = MarkDrawCompiler.compile(shapes, editorRef?.current || null, compileOpts);
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
  }, [options, platformId, compileScopeMode, showToast, editorRef, driverRef]);

  const handleDriverReady = useCallback(
    (driver: CanvasDriver) => {
      if (driverRef) {
        driverRef.current = driver;
      }

      triggerCompile();

      const unlisten = driver.onShapesChanged(() => {
        touchDocument(activeDoc.id);

        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = window.setTimeout(triggerCompile, 35);
      });

      return unlisten;
    },
    [driverRef, triggerCompile, activeDoc.id]
  );

  const handleEditorMount = useCallback(
    (mountedEditor: Editor) => {
      if (editorRef) {
        editorRef.current = mountedEditor;
      }
      if (setEditor) {
        setEditor(mountedEditor);
      }

      try {
        mountedEditor.updateInstanceState({ isToolLocked: false, isGridMode: true });
      } catch (err) {
        console.error('Editor configuration error:', err);
      }

      // Check if we have pending shapes to create
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
        const currentShapes = mountedEditor.getCurrentPageShapes();
        if (currentShapes.length === 0) {
          try {
            const demo = getDemoCanvasShapes();
            mountedEditor.createShapes(demo);
          } catch (err) {
            console.error('[MarkDraw] Failed to seed demo shapes:', err);
          }
        } else {
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

      triggerCompile();

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
    [triggerCompile, showToast, activeDoc.id, pendingShapesRef, editorRef, setEditor]
  );

  // Re-compile when settings change
  useEffect(() => {
    triggerCompile();
  }, [triggerCompile]);

  const getActiveContent = useCallback((): string => {
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
  }, [outputTab, compilation]);

  const handleCopy = useCallback(async () => {
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
  }, [getActiveContent]);

  const handleCopyFullContract = useCallback(async () => {
    let shapes: any[] = [];
    if (driverRef?.current) {
      const canvasShapes = await driverRef.current.listShapes();
      shapes = canvasShapesToCompilerShapes(canvasShapes);
    } else if (editorRef?.current) {
      shapes = editorRef.current.getCurrentPageShapes();
    }
    const fullRes = MarkDrawCompiler.compile(shapes, editorRef?.current || null, {
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
  }, [editorRef, driverRef, options]);

  const handleDownload = useCallback(() => {
    const ext = outputTab === 'json' ? 'json' : outputTab === 'ascii' ? 'txt' : 'md';
    const blob = new Blob([getActiveContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdraw-export-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [outputTab, getActiveContent]);

  return {
    compilation,
    compileDuration,
    copied,
    copiedFull,
    triggerCompile,
    handleEditorMount,
    handleDriverReady,
    getActiveContent,
    handleCopy,
    handleCopyFullContract,
    handleDownload
  };
}
