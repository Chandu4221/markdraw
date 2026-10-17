import { useState, useEffect } from 'react';

export type RenderMode = 'skeleton' | 'annotated' | 'realistic';

const STORAGE_KEY = 'markdraw_render_mode';

let currentRenderMode: RenderMode = 'annotated';
const listeners = new Set<(mode: RenderMode) => void>();

export function getRenderMode(): RenderMode {
  return currentRenderMode;
}

export function setRenderMode(mode: RenderMode): void {
  if (currentRenderMode !== mode) {
    currentRenderMode = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage may fail in sandboxed or private mode
    }
    listeners.forEach((listener) => {
      try {
        listener(mode);
      } catch (err) {
        console.error('[MarkDraw] Error in renderMode listener:', err);
      }
    });
  }
}

export function initRenderMode(): RenderMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'skeleton' || saved === 'annotated' || saved === 'realistic') {
      currentRenderMode = saved;
    }
  } catch {
    // fallback
  }
  return currentRenderMode;
}

export function useRenderMode(): RenderMode {
  const [mode, setMode] = useState<RenderMode>(getRenderMode());

  useEffect(() => {
    listeners.add(setMode);
    return () => {
      listeners.delete(setMode);
    };
  }, []);

  return mode;
}
