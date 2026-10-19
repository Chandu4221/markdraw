import React, { useState } from 'react';
import { Gauge, Pencil, Tag, Copy, Check, ArrowRight } from 'lucide-react';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { getShapeMeta, hasType } from '../../annotation/shapeMeta';
import { cn } from '@/lib/utils';

export interface ModeCanvasProps {
  shapes: CanvasShape[];
  driver: CanvasDriver | null;
  onCopyRootContract?: (rootId: string) => void;
  onSelectShape?: (shapeId: string) => void;
}

export const ModeCanvas: React.FC<ModeCanvasProps> = ({
  shapes,
  driver,
  onCopyRootContract,
  onSelectShape
}) => {
  const [copiedRootId, setCopiedRootId] = useState<string | null>(null);

  const taggedCount = shapes.filter((s) => hasType(s)).length;
  const totalCount = shapes.length;
  const isFullyTagged = totalCount > 0 && taggedCount === totalCount;

  // Root elements (e.g. frames or unparented pages/containers)
  const roots = shapes.filter((s) => {
    if (s.parentId) return false;
    if (s.kind === 'frame') return true;
    const m = getShapeMeta(s);
    return m?.type === 'page' || m?.type === 'section';
  });

  const handleCopy = async (rootId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopyRootContract) {
      onCopyRootContract(rootId);
      setCopiedRootId(rootId);
      setTimeout(() => setCopiedRootId(null), 1500);
    } else if (driver) {
      // Scoped compile fallback
      try {
        const { MarkDrawCompiler } = await import('../../core/compiler');
        const res = MarkDrawCompiler.compile(shapes as any, null, {
          scope: { shapeIds: [rootId] }
        });
        await driver.copyToClipboard(res.markdownSpec);
        setCopiedRootId(rootId);
        setTimeout(() => setCopiedRootId(null), 1500);
      } catch (err) {
        console.error('Failed to copy root contract', err);
      }
    }
  };

  return (
    <div className="p-3 space-y-4 font-sans select-none" data-testid="mode-canvas">
      {/* 1. Coverage Gauge (§3.6) */}
      <div className="flex items-center gap-2 p-3 bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] rounded-md">
        <Gauge
          size={18}
          className={cn(
            'shrink-0',
            isFullyTagged ? 'text-[var(--color-accent)]' : 'text-[var(--color-warning)]'
          )}
        />
        <span className="text-sm font-semibold text-[var(--color-ink-primary)]">
          {taggedCount}/{totalCount} tagged
        </span>
      </div>

      {/* 2. Roots List (§3.6) */}
      {roots.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Roots
          </div>
          <div className="space-y-1">
            {roots.map((root) => {
              const meta = getShapeMeta(root);
              const name = root.name || (meta?.props?.label as string) || 'Page';
              const isCopied = copiedRootId === root.id;

              return (
                <div
                  key={root.id}
                  onClick={() => onSelectShape?.(root.id)}
                  className="flex items-center justify-between p-2 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] hover:border-[var(--color-line-strong)] transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-[var(--color-ink-primary)] truncate">
                    {name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(root.id, e)}
                    aria-label={`Copy contract for ${name}`}
                    className="p-1 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer shrink-0"
                  >
                    {isCopied ? (
                      <Check size={14} className="text-[var(--color-success)]" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Three-Icon Storyboard (§3.6): Pencil -> Tag -> Copy (2-word captions) */}
      <div className="pt-2 border-t border-[var(--color-line-subtle)]">
        <div className="flex items-center justify-between p-3 bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] rounded-md">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <Pencil size={20} className="text-[var(--color-ink-muted)]" />
            <span className="text-sm font-medium text-[var(--color-ink-secondary)]">Draw</span>
          </div>
          <ArrowRight size={14} className="text-[var(--color-line-strong)] shrink-0" />
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <Tag size={20} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium text-[var(--color-ink-secondary)]">Tag it</span>
          </div>
          <ArrowRight size={14} className="text-[var(--color-line-strong)] shrink-0" />
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <Copy size={20} className="text-[var(--color-ink-muted)]" />
            <span className="text-sm font-medium text-[var(--color-ink-secondary)]">Copy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
