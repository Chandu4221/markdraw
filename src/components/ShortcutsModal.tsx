import React from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUT_GROUPS: { category: string; items: ShortcutItem[] }[] = [
  {
    category: 'Productivity & Editing',
    items: [
      { keys: ['Ctrl', 'D'], description: 'Duplicate selection' },
      { keys: ['↑', '↓', '←', '→'], description: 'Nudge selection 1px' },
      { keys: ['Shift', 'Arrows'], description: 'Nudge selection 10px' },
      { keys: ['Del', 'Backspace'], description: 'Delete selected element(s)' }
    ]
  },
  {
    category: 'Canvas & Selection',
    items: [
      { keys: ['V'], description: 'Select tool' },
      { keys: ['H'], description: 'Hand / Pan tool' },
      { keys: ['Drag'], description: 'Rubber-band multi-select' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' }
    ]
  },
  {
    category: 'Panels & Navigation',
    items: [
      { keys: ['Ctrl', 'J'], description: 'Toggle Output Panel' },
      { keys: ['?'], description: 'Toggle this Shortcuts Cheat Sheet' }
    ]
  }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="h-12 px-4 border-b border-[var(--md-border)] flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-[var(--md-accent)]" />
            <DialogTitle className="text-sm font-semibold text-[var(--md-text-bold)]">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Speed-up wireframing with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--md-text-muted)]">
                {group.category}
              </h4>
              <div className="divide-y divide-[var(--md-border)] rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface-raised)] overflow-hidden">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-[var(--md-text)]">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-mono font-medium rounded border border-[var(--md-border)] bg-[var(--md-surface)] text-[var(--md-text-bold)] shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
