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
          width: 520,
          maxHeight: '80vh',
          background: 'var(--md-surface)',
          border: '1px solid var(--md-border-strong)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
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
            borderBottom: '1px solid var(--md-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--md-surface-raised)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
            <BookOpen size={16} strokeWidth={1.5} />
            <span>MarkDraw Semantic Legend</span>
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
            This semantic legend is automatically prepended to exported markdown so receiving Large Language Models
            parse layout hierarchies, flex flows, and widget contracts without ambiguity.
          </p>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              border: '1px solid var(--md-border)'
            }}
          >
            <thead>
              <tr style={{ background: 'var(--md-surface-raised)', borderBottom: '1px solid var(--md-border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Notation</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                { notation: '[Section]', meaning: 'Page-level structural band' },
                { notation: '[Card]', meaning: 'Grouped content container (variants: outline/elevated/flat)' },
                { notation: '[Button]', meaning: 'Interactive click target' },
                { notation: '<Input>', meaning: 'Form input (kinds: text/search/password/date/file)' },
                { notation: '(Icon)', meaning: 'Graphical node; name in parentheses' },
                { notation: '---', meaning: 'Divider / Separator' },
                { notation: '> direction', meaning: 'Row / Column layout of container children' }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--md-border)' }}>
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--md-font-mono)', fontWeight: 600 }}>
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
            borderTop: '1px solid var(--md-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'var(--md-surface-raised)'
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--md-radius-md)',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-border-strong)',
              color: 'var(--md-text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
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
