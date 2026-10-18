import { useEffect } from 'react';
import { Editor } from '../core/types';

export interface UseGlobalShortcutsProps {
  editorRef: React.MutableRefObject<Editor | null>;
  setIsRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (msg: string) => void;
}

export function useGlobalShortcuts({
  editorRef,
  setIsRightPanelOpen,
  setIsShortcutsOpen,
  showToast
}: UseGlobalShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Panel toggle (Ctrl/Cmd + J)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsRightPanelOpen((prev) => !prev);
      }
      // Shortcuts modal (?)
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
            selected.map((s: any) => ({
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
  }, [editorRef, setIsRightPanelOpen, setIsShortcutsOpen, showToast]);
}
