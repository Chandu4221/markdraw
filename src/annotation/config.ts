// src/annotation/config.ts

export const isAnnotationModeActive = (): boolean => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('markdraw_annotation_mode');
      if (stored !== null) return stored === 'true' || stored === '1';
    }
  } catch {
    // ignore
  }
  return (
    import.meta.env.VITE_ANNOTATION_MODE === '1' ||
    import.meta.env.VITE_ANNOTATION_MODE === 'true'
  );
};

export const setAnnotationModeStorage = (active: boolean): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('markdraw_annotation_mode', active ? '1' : '0');
    }
  } catch {
    // ignore
  }
};
