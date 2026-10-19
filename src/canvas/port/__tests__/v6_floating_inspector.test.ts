import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { useGlobalShortcuts } from '../../../hooks/useGlobalShortcuts';

vi.mock('react', () => ({
  useEffect: (cb: () => void | (() => void)) => {
    cb();
  }
}));

describe('v6 Defect 5: Floating Inspector button removal (§1.2.5)', () => {
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it('ExcalidrawCanvas source does not contain renderTopRightUI (§1.2.5)', () => {
    const canvasFilePath = path.resolve(__dirname, '../../excalidraw/ExcalidrawCanvas.tsx');
    const source = fs.readFileSync(canvasFilePath, 'utf-8');
    expect(source.includes('renderTopRightUI')).toBe(false);
  });

  it('Alt+I global shortcut toggles inspector state (§1.2.5)', () => {
    const listeners: Record<string, ((e: any) => void)[]> = {};
    (globalThis as any).window = {
      addEventListener: (evt: string, cb: (e: any) => void) => {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(cb);
      },
      removeEventListener: (evt: string, cb: (e: any) => void) => {
        if (listeners[evt]) {
          listeners[evt] = listeners[evt].filter((l) => l !== cb);
        }
      }
    };
    (globalThis as any).document = {
      activeElement: null
    };

    const setIsInspectorOpen = vi.fn();
    const setIsRightPanelOpen = vi.fn();
    const setIsShortcutsOpen = vi.fn();
    const showToast = vi.fn();
    const editorRef = { current: null };

    useGlobalShortcuts({
      editorRef,
      setIsInspectorOpen,
      setIsRightPanelOpen,
      setIsShortcutsOpen,
      showToast
    });

    const preventDefault = vi.fn();
    const keydownListeners = listeners['keydown'] || [];
    expect(keydownListeners.length).toBeGreaterThan(0);

    for (const listener of keydownListeners) {
      listener({
        key: 'i',
        altKey: true,
        preventDefault
      });
    }

    expect(setIsInspectorOpen).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();
  });
});
