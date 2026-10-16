import React from 'react';
import { X, Keyboard } from 'lucide-react';

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
      { keys: ['Ctrl', 'D'], description: 'Duplicate selection (offset +24px)' },
      { keys: ['↑', '↓', '←', '→'], description: 'Nudge selection 1px' },
      { keys: ['Shift', 'Arrows'], description: 'Nudge selection 10px' },
      { keys: ['Del', 'Backspace'], description: 'Delete selected widget(s)' },
      { keys: ['/'], description: 'Focus quick-insert search (↑↓ navigate, Enter inserts)' }
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
      { keys: ['Ctrl', 'B'], description: 'Toggle Component Palette' },
      { keys: ['Ctrl', 'J'], description: 'Toggle Output Panel' },
      { keys: ['?'], description: 'Toggle this Shortcuts Cheat Sheet' }
    ]
  }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 520,
          maxHeight: '85vh',
          background: 'var(--md-surface)',
          border: '1.5px solid var(--md-border-strong)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--md-font-sans)',
          color: 'var(--md-text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            height: 48,
            padding: '0 16px',
            borderBottom: '1.5px solid var(--md-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--md-surface-raised)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: 'var(--md-text-bold)' }}>
            <Keyboard size={16} strokeWidth={1.5} />
            <span>Keyboard Shortcuts & Productivity</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--md-text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--md-text-muted)'
                }}
              >
                {group.category}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  background: 'var(--md-surface-raised)',
                  border: '1.5px solid var(--md-border)',
                  borderRadius: 'var(--md-radius-md)',
                  padding: '6px 10px'
                }}
              >
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: idx < group.items.length - 1 ? '1px solid var(--md-border)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--md-text)' }}>{item.description}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          style={{
                            fontFamily: 'var(--md-font-mono, monospace)',
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'var(--md-bg)',
                            color: 'var(--md-text-bold)',
                            border: '1.5px solid var(--md-border-strong)',
                            borderRadius: 'var(--md-radius-sm, 4px)',
                            padding: '2px 6px',
                            boxShadow: '1px 1px 0px var(--md-border-strong)'
                          }}
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

        <div
          style={{
            height: 44,
            padding: '0 16px',
            borderTop: '1.5px solid var(--md-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: 'var(--md-surface-raised)'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--md-radius-sm)',
              background: 'var(--md-text)',
              border: '1.5px solid var(--md-text)',
              color: 'var(--md-bg)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--md-shadow-interactive)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
