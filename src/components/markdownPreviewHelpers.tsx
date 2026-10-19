import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export type ParsedBlock =
  | { type: 'quote'; lines: string[] }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'meta'; pairs: { label: string; value: string }[] }
  | { type: 'table'; table: ParsedTable }
  | { type: 'p'; text: string }
  | { type: 'hr' };

export interface ViewportRowItem {
  row: string[];
  isHiddenOnMobile: boolean;
}

/**
 * Tokenizes bracket notation such as [button "Follow" sm:full] or [navbar] (§2.2.4)
 * Renders role in accent, label in primary ink, and props/flags in secondary ink.
 */
export function tokenizeBracketNotation(
  notation: string,
  onSelectShape?: (shapeId: string) => void,
  shapeIdHint?: string
): React.ReactNode {
  const trimmed = notation.trim();
  const match = trimmed.match(/^\[([a-zA-Z0-9_-]+)(?:\s+"([^"]*)")?(?:\s+(.*))?\]$/);
  if (!match) {
    return <span className="font-mono">{trimmed}</span>;
  }

  const [, role, label, restProps] = match;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-sm bg-[var(--color-accent-subtle)] border border-[var(--color-line-subtle)] ${
        shapeIdHint && onSelectShape ? 'cursor-pointer hover:border-[var(--color-accent)]' : ''
      }`}
      onClick={shapeIdHint && onSelectShape ? () => onSelectShape(shapeIdHint) : undefined}
      title={shapeIdHint ? `Click to select #${shapeIdHint}` : undefined}
    >
      <span className="text-[var(--color-accent)] font-semibold font-mono">
        [{role}{label !== undefined ? ` "${label}"` : ''}{restProps ? ` ${restProps}` : ''}]
      </span>
    </span>
  );
}

/**
 * Formats a single table cell depending on its column header and content.
 */
export function renderFormattedCell(
  cell: string,
  header: string = '',
  onSelectShape?: (shapeId: string) => void
): React.ReactNode {
  const trimmed = cell.trim();
  if (trimmed === '—' || trimmed === '-' || trimmed === '') {
    return <span className="text-[var(--color-ink-muted)]">—</span>;
  }

  const hLower = header.toLowerCase();

  // 1. Path Column (e.g. `Root > #root_node > #fbi`)
  if (hLower.includes('path') || trimmed.startsWith('`Root')) {
    const cleanPath = trimmed.replace(/^`|`$/g, '');
    const segments = cleanPath.split(/\s*>\s*/);
    return (
      <div className="flex items-center gap-1 flex-wrap font-mono">
        {segments.map((seg, sIdx) => {
          const isRoot = seg === 'Root';
          const isId = seg.startsWith('#');
          const shapeId = isId ? seg.slice(1) : undefined;
          return (
            <React.Fragment key={sIdx}>
              {sIdx > 0 && <span className="text-[var(--color-ink-muted)] text-sm">›</span>}
              <button
                type="button"
                disabled={!isId || !onSelectShape}
                onClick={isId && shapeId && onSelectShape ? () => onSelectShape(shapeId) : undefined}
                className={`px-1.5 py-0.5 rounded text-sm font-mono font-medium transition-colors ${
                  isRoot
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]'
                    : isId
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-line-subtle)] hover:border-[var(--color-accent)] cursor-pointer'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
                title={isId ? `Click to select ${seg} on canvas` : undefined}
              >
                {seg}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // 2. Component Bracket Notation (e.g. **[header "MarkDraw SaaS"]**)
  if (hLower.includes('component') || trimmed.includes('[')) {
    const clean = trimmed.replace(/^\*\*|\*\*$/g, '');
    return tokenizeBracketNotation(clean, onSelectShape);
  }

  // 3. Semantics Column (e.g. <Header>, <Page>, <Button>)
  if (hLower.includes('semantics') || (trimmed.startsWith('<') && trimmed.endsWith('>'))) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-sm bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
        {trimmed}
      </span>
    );
  }

  // 4. Placement Column
  if (hLower.includes('placement')) {
    let colorClass = 'bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]';
    if (trimmed === 'header') colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    if (trimmed === 'body') colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (trimmed === 'footer') colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    if (trimmed === 'nested') colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium ${colorClass}`}>
        {trimmed}
      </span>
    );
  }

  // 5. Layout Flow Column (Row vs Column)
  if (hLower.includes('flow') || trimmed === 'Row' || trimmed === 'Column') {
    const isRow = trimmed.includes('Row');
    const isCol = trimmed.includes('Column');
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-sm font-medium bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] text-[var(--color-ink-primary)]">
        {isRow && <ArrowRight size={14} className="text-blue-500" />}
        {isCol && <ArrowDown size={14} className="text-emerald-500" />}
        <span>{trimmed}</span>
      </span>
    );
  }

  // 6. Props & Attributes Column
  if (hLower.includes('props') || hLower.includes('attributes')) {
    const tokens = trimmed.split(/,\s*|\s+/).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1 max-w-sm">
        {tokens.map((tok, tIdx) => {
          let badgeColor = 'bg-[var(--color-surface-2)] border-[var(--color-line-subtle)] text-[var(--color-ink-muted)]';
          if (tok === 'sticky' || tok === 'fixed' || tok === 'overlay' || tok === 'fullscreen') {
            badgeColor = 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold';
          } else if (tok.startsWith('responsive:') || tok.startsWith('tablet:')) {
            badgeColor = 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold';
          } else if (tok.startsWith('sm:order-')) {
            badgeColor = 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300 font-semibold';
          } else if (tok === 'sm:hidden') {
            badgeColor = 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold';
          } else if (tok.startsWith('cols:')) {
            badgeColor = 'bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-400 font-semibold';
          } else if (tok.includes('w-') || tok.includes('full-width') || tok.includes('(sm:full)')) {
            badgeColor = 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400';
          } else if (tok.includes('align') || tok.includes('dist:')) {
            badgeColor = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';
          }

          return (
            <span
              key={tIdx}
              className={`px-1.5 py-0.5 rounded border text-sm font-mono ${badgeColor}`}
            >
              {tok}
            </span>
          );
        })}
      </div>
    );
  }

  return <span>{renderInlineFormatting(trimmed, onSelectShape)}</span>;
}

/**
 * Handles bold `**`, italics `*`, and code backticks `` ` `` within regular text.
 */
export function renderInlineFormatting(
  text: string,
  onSelectShape?: (shapeId: string) => void
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('[') && token.endsWith(']')) {
      parts.push(tokenizeBracketNotation(token, onSelectShape));
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] text-[var(--color-accent)] font-mono text-sm"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[var(--color-ink-primary)]">
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
 * Reorders rows based on mobile order and flags elements hidden on mobile.
 */
export function processTableRowsForViewport(
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

  if (mode === 'desktop') return mapped;

  const pathIdx = headers.findIndex((h) => h.toLowerCase().includes('path'));
  if (pathIdx < 0) return mapped;

  const containerResponsiveMap = new Map<string, string>();
  for (const item of mapped) {
    const rawPath = item.row[pathIdx].replace(/^`|`$/g, '').trim();
    const propsCell = propsIdx >= 0 ? item.row[propsIdx] || '' : '';
    if (propsCell.includes('responsive:')) {
      const match = propsCell.match(/responsive:(\w+)/);
      if (match) containerResponsiveMap.set(rawPath, match[1]);
    }
  }

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
      order = parentBehavior === 'reverse' ? 100 - originalIndex : originalIndex;
    }

    return { ...item, parentPath, order, originalIndex };
  });

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
 * Parses raw markdown into structured blocks (quotes, headings, metadata, tables, paragraphs).
 */
export function parseMarkdownBlocks(raw: string): ParsedBlock[] {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

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

    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      const headerLine = trimmed;
      const separatorLine = lines[i + 1].trim();

      if (separatorLine.includes('---')) {
        const headers = headerLine.split('|').slice(1, -1).map((h) => h.trim());
        const rows: string[][] = [];
        i += 2;

        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const rowCells = lines[i].trim().split('|').slice(1, -1).map((c) => c.trim());
          rows.push(rowCells);
          i++;
        }

        blocks.push({ type: 'table', table: { headers, rows } });
        continue;
      }
    }

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

    blocks.push({ type: 'p', text: trimmed });
    i++;
  }

  return blocks;
}
