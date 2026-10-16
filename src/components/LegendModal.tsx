import React, { useState } from 'react';
import { X, Copy, Check, BookOpen } from 'lucide-react';
import { SEMANTIC_LEGEND_MARKDOWN } from '../core/compiler';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SEMANTIC_LEGEND_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          width: 580,
          maxHeight: '85vh',
          background: 'var(--md-surface)',
          border: '1.5px solid var(--md-border-strong)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
            <BookOpen size={16} strokeWidth={1.5} />
            <span>MarkDraw Semantic Legend (v2.6)</span>
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

        <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--md-text-muted)', lineHeight: 1.5 }}>
            This semantic notation is automatically prepended to exported markdown so receiving AI agents
            parse layout hierarchies and widget contracts without ambiguity.
          </p>
          <div
            style={{
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--md-accent)',
              padding: '6px 10px',
              background: 'var(--md-accent-subtle)',
              borderRadius: 4,
              border: '1.5px solid var(--md-border)'
            }}
          >
            Line-glyph convention: text is rendered as ─── horizontal lines on canvas; actual text is preserved in markdown.
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              border: '1.5px solid var(--md-border)'
            }}
          >
            <thead>
              <tr style={{ background: 'var(--md-surface-raised)', borderBottom: '1.5px solid var(--md-border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Notation</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                { notation: '[btn "Text" variant]', meaning: 'Button (solid, ghost, dashed)' },
                { notation: '[header "Title" h1]', meaning: 'Heading typography (h1, h2, h3)' },
                { notation: '[para]', meaning: 'Body paragraph (line glyph on canvas)' },
                { notation: '[input "Placeholder"]', meaning: 'Text / form input field' },
                { notation: '[search "Query"]', meaning: 'Search input with caret glyph' },
                { notation: '[check "Label" on/off]', meaning: 'Checkbox with active state' },
                { notation: '[radio "Label" on/off]', meaning: 'Radio button with active state' },
                { notation: '[toggle on/off]', meaning: 'Switch toggle with state' },
                { notation: '[select "A\\|B\\|C"]', meaning: 'Dropdown select options' },
                { notation: '[slider N]', meaning: 'Range slider with value N' },
                { notation: '[nav "A, B, C"]', meaning: 'Navbar navigation list' },
                { notation: '[tabs "A\\|B\\|C"]', meaning: 'Tab selection group' },
                { notation: '[section "Title"]', meaning: 'Structural container band' },
                { notation: '[card "Title" variant]', meaning: 'Card container (outline, elevated)' },
                { notation: '[hero]', meaning: 'Hero marketing banner' },
                { notation: '[modal "Title"]', meaning: 'Dialog modal window' },
                { notation: '[split]', meaning: 'Split-pane container' },
                { notation: '[grid 3x2]', meaning: 'Grid gallery container' },
                { notation: '[table 4x3]', meaning: 'Tabular data grid' },
                { notation: '[img "Alt"]', meaning: 'Image placeholder with ✕ cross' },
                { notation: '[video "File"]', meaning: 'Video player placeholder with ✕ cross' },
                { notation: '[avatar]', meaning: 'Line-art avatar circle' },
                { notation: '[divider]', meaning: 'Horizontal divider line' },
                { notation: '[toast "Text"]', meaning: 'Notification toast' }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1.5px solid var(--md-border)' }}>
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--md-font-mono)', fontWeight: 600, color: 'var(--md-text)' }}>
                    {row.notation}
                  </td>
                  <td style={{ padding: '6px 10px', color: 'var(--md-text-muted)' }}>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            height: 48,
            padding: '0 16px',
            borderTop: '1.5px solid var(--md-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: 'var(--md-surface-raised)',
            gap: 8
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'var(--md-surface)',
              border: '1.5px solid var(--md-border-strong)',
              borderRadius: 'var(--md-radius-sm)',
              color: 'var(--md-text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--md-shadow-interactive)'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Legend Markdown'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
