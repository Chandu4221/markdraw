import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowDown,
  Layers,
  Tag,
  Monitor,
  Smartphone
} from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

type ParsedBlock =
  | { type: 'quote'; lines: string[] }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'meta'; pairs: { label: string; value: string }[] }
  | { type: 'table'; table: ParsedTable }
  | { type: 'p'; text: string }
  | { type: 'hr' };

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  if (!content || content.trim() === '' || content.startsWith('_Canvas is empty')) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--md-text-muted)] select-none">
        <Layers size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">Canvas is empty</p>
        <p className="text-xs text-[var(--md-text-subtle)] mt-1 max-w-xs">
          Draw shapes or drop UI widgets onto the canvas to generate the live specification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs text-[var(--md-text)] pb-6 select-text">
      {/* Viewport Simulation Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-[var(--md-border)] bg-[var(--md-surface-raised)] select-none">
        <div className="flex items-center gap-1.5 text-xs text-[var(--md-text-muted)] font-medium">
          <span>Viewport Simulation:</span>
          {viewportMode === 'mobile' && (
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-semibold">
              (mobile stack active)
            </span>
          )}
        </div>
        <div role="group" aria-label="Viewport Mode" className="flex items-center gap-0.5 p-0.5 bg-[var(--md-surface)] border border-[var(--md-border)] rounded-[var(--md-radius-sm)]">
          <button
            type="button"
            aria-pressed={viewportMode === 'desktop'}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
              viewportMode === 'desktop'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
            }`}
            onClick={() => setViewportMode('desktop')}
          >
            <Monitor size={12} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            aria-pressed={viewportMode === 'mobile'}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
              viewportMode === 'mobile'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
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
                    <p key={lIdx}>
                      {renderInlineFormatting(line)}
                    </p>
                  ))}
                </div>
              </div>
            );

          case 'h3':
            return (
              <h3
                key={idx}
                className="text-sm font-bold text-[var(--md-text-bold)] pt-2 pb-1 border-b border-[var(--md-border)] flex items-center gap-2"
              >
                <span>{block.text}</span>
              </h3>
            );

          case 'h4':
            return (
              <h4
                key={idx}
                className="text-xs font-bold text-[var(--md-text-muted)] uppercase tracking-wider pt-2 flex items-center gap-1.5"
              >
                <Tag size={12} className="text-[var(--md-accent)]" />
                <span>{block.text}</span>
              </h4>
            );

          case 'meta':
            return (
              <div key={idx} className="flex flex-wrap gap-2 text-xs select-none">
                {block.pairs.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--md-radius-sm)] bg-[var(--md-surface-raised)] border border-[var(--md-border)] text-[var(--md-text-muted)] text-[11px]"
                  >
                    <span className="font-semibold text-[var(--md-text)]">{p.label}:</span>
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
                className="overflow-x-auto rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-xs"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--md-surface-raised)] border-b border-[var(--md-border)] text-[var(--md-text-muted)] sticky top-0 z-10 select-none">
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
                  <tbody className="divide-y divide-[var(--md-border)] font-mono text-[11px]">
                    {processedRows.map(({ row, isHiddenOnMobile }, rIdx) => (
                      <tr
                        key={rIdx}
                        className={`hover:bg-[var(--md-surface-raised)]/50 transition-colors ${
                          viewportMode === 'mobile' && isHiddenOnMobile
                            ? 'opacity-40 bg-amber-500/5'
                            : ''
                        }`}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2 whitespace-nowrap align-middle"
                          >
                            {renderFormattedCell(cell, block.table.headers[cIdx])}
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
            return <hr key={idx} className="border-[var(--md-border)] my-3" />;

          case 'p':
            return (
              <p
                key={idx}
                className="text-xs text-[var(--md-text-muted)] leading-relaxed"
              >
                {renderInlineFormatting(block.text)}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

/**
 * Formats a single table cell depending on its column header and content.
 */
function renderFormattedCell(cell: string, header: string = ''): React.ReactNode {
  const trimmed = cell.trim();
  if (trimmed === '—' || trimmed === '-' || trimmed === '') {
    return <span className="text-[var(--md-text-subtle)]">—</span>;
  }

  const hLower = header.toLowerCase();

  // 1. Path Column (e.g. `Root > #8ac > #fbi`)
  if (hLower.includes('path') || trimmed.startsWith('`Root')) {
    const cleanPath = trimmed.replace(/^`|`$/g, '');
    const segments = cleanPath.split(/\s*>\s*/);
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {segments.map((seg, sIdx) => {
          const isRoot = seg === 'Root';
          const isId = seg.startsWith('#');
          return (
            <React.Fragment key={sIdx}>
              {sIdx > 0 && <span className="text-[var(--md-text-subtle)] text-[10px]">›</span>}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                  isRoot
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    : isId
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {seg}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // 2. Component Bracket Notation (e.g. **[header "MarkDraw SaaS"]**)
  if (hLower.includes('component') || trimmed.includes('[')) {
    const clean = trimmed.replace(/^\*\*|\*\*$/g, '');
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-semibold text-[11px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
        {clean}
      </span>
    );
  }

  // 3. Semantics Column (e.g. <Header>, <Page>, <Button>)
  if (hLower.includes('semantics') || (trimmed.startsWith('<') && trimmed.endsWith('>'))) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
        {trimmed}
      </span>
    );
  }

  // 4. Placement Column
  if (hLower.includes('placement')) {
    let colorClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    if (trimmed === 'header') colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    if (trimmed === 'body') colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (trimmed === 'footer') colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    if (trimmed === 'nested') colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
        {trimmed}
      </span>
    );
  }

  // 5. Layout Flow Column (Row vs Column)
  if (hLower.includes('flow') || trimmed === 'Row' || trimmed === 'Column') {
    const isRow = trimmed.includes('Row');
    const isCol = trimmed.includes('Column');
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--md-surface-raised)] border border-[var(--md-border)] text-[var(--md-text)]">
        {isRow && <ArrowRight size={10} className="text-blue-500" />}
        {isCol && <ArrowDown size={10} className="text-emerald-500" />}
        <span>{trimmed}</span>
      </span>
    );
  }

  // 6. Props & Attributes Column
  if (hLower.includes('props') || hLower.includes('attributes')) {
    // Split tokens by comma or whitespace while preserving quoted strings
    const tokens = trimmed.split(/,\s*|\s+/).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1 max-w-sm">
        {tokens.map((tok, tIdx) => {
          const isBehavior =
            tok === 'sticky' || tok === 'fixed' || tok === 'overlay' || tok === 'fullscreen';
          const isResponsive = tok.startsWith('responsive:') || tok.startsWith('tablet:');
          const isMobileOrder = tok.startsWith('sm:order-');
          const isHidden = tok === 'sm:hidden';
          const isCols = tok.startsWith('cols:');
          const isWidth =
            tok.includes('w-') || tok.includes('full-width') || tok.includes('width:') || tok.includes('(sm:full)');
          const isAlign = tok.includes('align') || tok.includes('dist:');

          let badgeColor = 'bg-[var(--md-surface-raised)] border-[var(--md-border)] text-[var(--md-text-muted)]';
          if (isBehavior) {
            badgeColor = 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold';
          } else if (isResponsive) {
            badgeColor = 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold';
          } else if (isMobileOrder) {
            badgeColor = 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300 font-semibold';
          } else if (isHidden) {
            badgeColor = 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold';
          } else if (isCols) {
            badgeColor = 'bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-400 font-semibold';
          } else if (isWidth) {
            badgeColor = 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400';
          } else if (isAlign) {
            badgeColor = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';
          }

          return (
            <span
              key={tIdx}
              className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${badgeColor}`}
            >
              {tok}
            </span>
          );
        })}
      </div>
    );
  }

  // Default fallback formatting
  return <span>{renderInlineFormatting(trimmed)}</span>;
}

interface ViewportRowItem {
  row: string[];
  isHiddenOnMobile: boolean;
}

/**
 * Reorders rows based on mobile order and flags elements hidden on mobile.
 */
function processTableRowsForViewport(
  rows: string[][],
  headers: string[],
  mode: 'desktop' | 'mobile'
): ViewportRowItem[] {
  const propsIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('props') || h.toLowerCase().includes('attributes')
  );

  const mapped: ViewportRowItem[] = rows.map((r) => {
    const propsCell = propsIdx >= 0 ? r[propsIdx] || '' : '';
    const isHiddenOnMobile = propsCell.includes('sm:hidden');
    return { row: r, isHiddenOnMobile };
  });

  if (mode === 'desktop') {
    return mapped;
  }

  const pathIdx = headers.findIndex((h) => h.toLowerCase().includes('path'));
  if (pathIdx < 0) return mapped;

  // Extract parent container responsive flags
  const containerResponsiveMap = new Map<string, string>();
  for (const item of mapped) {
    const rawPath = item.row[pathIdx].replace(/^`|`$/g, '').trim();
    const propsCell = propsIdx >= 0 ? item.row[propsIdx] || '' : '';
    if (propsCell.includes('responsive:')) {
      const match = propsCell.match(/responsive:(\w+)/);
      if (match) {
        containerResponsiveMap.set(rawPath, match[1]);
      }
    }
  }

  // Attach metadata for sorting
  const itemsWithMeta = mapped.map((item, originalIndex) => {
    const rawPath = item.row[pathIdx].replace(/^`|`$/g, '').trim();
    const segs = rawPath.split(/\s*>\s*/);
    const parentPath = segs.slice(0, -1).join(' > ');
    const propsCell = propsIdx >= 0 ? item.row[propsIdx] || '' : '';

    let order = 50;
    const orderMatch = propsCell.match(/sm:order-(\d+)/);
    if (orderMatch) {
      order = parseInt(orderMatch[1], 10);
    } else {
      const parentBehavior = containerResponsiveMap.get(parentPath);
      if (parentBehavior === 'reverse') {
        order = 100 - originalIndex;
      } else {
        order = originalIndex;
      }
    }

    return {
      ...item,
      parentPath,
      order,
      originalIndex
    };
  });

  // Reorder siblings under same parent
  const result: ViewportRowItem[] = [];
  const processedParents = new Set<string>();

  for (let i = 0; i < itemsWithMeta.length; i++) {
    const current = itemsWithMeta[i];
    if (processedParents.has(current.parentPath)) continue;

    const siblings = itemsWithMeta.filter((it) => it.parentPath === current.parentPath);
    processedParents.add(current.parentPath);

    siblings.sort((a, b) => a.order - b.order || a.originalIndex - b.originalIndex);

    for (const sib of siblings) {
      result.push({ row: sib.row, isHiddenOnMobile: sib.isHiddenOnMobile });
    }
  }

  return result.length === mapped.length ? result : mapped;
}

/**
 * Handles bold `**`, italics `*`, and code backticks `` ` `` within regular text.
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Simple regex parser for `code` and **bold**
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1 py-0.5 rounded bg-[var(--md-surface-raised)] border border-[var(--md-border)] text-[var(--md-accent)] font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[var(--md-text-bold)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Parses raw markdown into structured blocks (quotes, headings, metadata, tables, paragraphs).
 */
function parseMarkdownBlocks(raw: string): ParsedBlock[] {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote (> ...)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: trimmed.slice(5) });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) });
      i++;
      continue;
    }

    // Table detection: line starts with | and next line has | :---
    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      const headerLine = trimmed;
      const separatorLine = lines[i + 1].trim();

      if (separatorLine.includes('---')) {
        const headers = headerLine
          .split('|')
          .slice(1, -1)
          .map((h) => h.trim());
        const rows: string[][] = [];
        i += 2; // skip header and separator

        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const rowCells = lines[i]
            .trim()
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          rows.push(rowCells);
          i++;
        }

        blocks.push({
          type: 'table',
          table: { headers, rows }
        });
        continue;
      }
    }

    // Key-value metadata lines (e.g. **Roots Detected:** 1 view(s))
    if (trimmed.startsWith('**') && trimmed.includes(':**')) {
      const metaPairs: { label: string; value: string }[] = [];
      while (i < lines.length && lines[i].trim().startsWith('**') && lines[i].trim().includes(':**')) {
        const l = lines[i].trim();
        const colonIdx = l.indexOf(':**');
        if (colonIdx !== -1) {
          const label = l.slice(2, colonIdx);
          const value = l.slice(colonIdx + 3).trim();
          metaPairs.push({ label, value });
        }
        i++;
      }
      blocks.push({ type: 'meta', pairs: metaPairs });
      continue;
    }

    // Regular paragraph
    blocks.push({ type: 'p', text: trimmed });
    i++;
  }

  return blocks;
}
