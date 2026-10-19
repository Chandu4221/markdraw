import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  Tag,
  Monitor,
  Smartphone
} from 'lucide-react';
import {
  parseMarkdownBlocks,
  processTableRowsForViewport,
  renderFormattedCell,
  renderInlineFormatting
} from './markdownPreviewHelpers';

export interface MarkdownPreviewProps {
  content: string;
  onSelectShape?: (shapeId: string) => void;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  onSelectShape
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  if (!content || content.trim() === '' || content.startsWith('_Canvas is empty')) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--color-ink-muted)] select-none">
        <Layers size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-medium text-[var(--color-ink-primary)]">Canvas is empty</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1 max-w-xs">
          Draw shapes or drop UI widgets onto the canvas to generate the live specification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs text-[var(--color-ink-secondary)] pb-6 select-text">
      {/* Viewport Simulation Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] select-none">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] font-medium">
          <span>Viewport Simulation:</span>
          {viewportMode === 'mobile' && (
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-semibold">
              (mobile stack active)
            </span>
          )}
        </div>
        <div
          role="group"
          aria-label="Viewport Mode"
          className="flex items-center gap-0.5 p-0.5 bg-[var(--color-surface-1)] border border-[var(--color-line-subtle)] rounded-[var(--radius-sm)]"
        >
          <button
            type="button"
            aria-pressed={viewportMode === 'desktop'}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] ${
              viewportMode === 'desktop'
                ? 'bg-[var(--color-accent)] text-white shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)]'
            }`}
            onClick={() => setViewportMode('desktop')}
          >
            <Monitor size={12} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            aria-pressed={viewportMode === 'mobile'}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 ${
              viewportMode === 'mobile'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)]'
            }`}
            onClick={() => setViewportMode('mobile')}
          >
            <Smartphone size={12} />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'quote':
            return (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-blue-500/25 bg-blue-500/8 dark:bg-blue-950/20 text-xs shadow-xs"
              >
                <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300 mb-1.5 select-none">
                  <Sparkles size={13} className="text-blue-500" />
                  <span>AI Layout Directive (Binding Contract)</span>
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {block.lines.map((line, lIdx) => (
                    <p key={lIdx}>{renderInlineFormatting(line, onSelectShape)}</p>
                  ))}
                </div>
              </div>
            );

          case 'h3':
            return (
              <h3
                key={idx}
                className="text-sm font-bold text-[var(--color-ink-primary)] pt-2 pb-1 border-b border-[var(--color-line-subtle)] flex items-center gap-2"
              >
                <span>{block.text}</span>
              </h3>
            );

          case 'h4':
            return (
              <h4
                key={idx}
                className="text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-wider pt-2 flex items-center gap-1.5"
              >
                <Tag size={12} className="text-[var(--color-accent)]" />
                <span>{block.text}</span>
              </h4>
            );

          case 'meta':
            return (
              <div key={idx} className="flex flex-wrap gap-2 text-xs select-none">
                {block.pairs.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] text-[var(--color-ink-muted)] text-[11px]"
                  >
                    <span className="font-semibold text-[var(--color-ink-primary)]">{p.label}:</span>
                    <span>{p.value}</span>
                  </span>
                ))}
              </div>
            );

          case 'table': {
            const processedRows = processTableRowsForViewport(
              block.table.rows,
              block.table.headers,
              viewportMode
            );

            return (
              <div
                key={idx}
                className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] shadow-xs"
              >
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-line-subtle)] text-[var(--color-ink-muted)] sticky top-0 z-10 select-none">
                    <tr>
                      {block.table.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="px-3 py-2 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-line-subtle)] font-mono text-[11px]">
                    {processedRows.map(({ row, isHiddenOnMobile }, rIdx) => (
                      <tr
                        key={rIdx}
                        className={`hover:bg-[var(--color-surface-2)]/50 transition-colors ${
                          viewportMode === 'mobile' && isHiddenOnMobile
                            ? 'opacity-40 bg-amber-500/5'
                            : ''
                        }`}
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap align-middle">
                            {renderFormattedCell(cell, block.table.headers[cIdx], onSelectShape)}
                            {viewportMode === 'mobile' && isHiddenOnMobile && cIdx === 0 && (
                              <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-sans font-medium bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                hidden on mobile
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'hr':
            return <hr key={idx} className="border-[var(--color-line-subtle)] my-3" />;

          case 'p':
            return (
              <p key={idx} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                {renderInlineFormatting(block.text, onSelectShape)}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
