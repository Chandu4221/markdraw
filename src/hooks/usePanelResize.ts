import { useState, useCallback, useEffect, useRef } from 'react';

export function usePanelResize(initialPercent = 55, minRightPx = 380) {
  const [canvasPercent, setCanvasPercent] = useState<number>(initialPercent);
  const [activeDrag, setActiveDrag] = useState<'right' | null>(null);
  const splitAreaRef = useRef<HTMLDivElement | null>(null);

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
  }, [activeDrag, minRightPx]);

  return {
    canvasPercent,
    setCanvasPercent,
    activeDrag,
    splitAreaRef,
    startResizingRight
  };
}
