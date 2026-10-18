import React from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import { getShapeMeta } from '../../annotation/shapeMeta';
import { Editor, TLShape } from '../../canvas/tldraw';

interface CanvasOverviewSectionProps {
  editor: Editor;
  onCopyFrameContract: (frameId: string) => void;
  copiedFrameId: string | null;
}

export const CanvasOverviewSection: React.FC<CanvasOverviewSectionProps> = ({
  editor,
  onCopyFrameContract,
  copiedFrameId
}) => {
  const allShapes = editor.getCurrentPageShapes();
  const taggedCount = allShapes.filter((s: TLShape) => Boolean(getShapeMeta(s)?.role)).length;
  const rootFrames = allShapes.filter((s: TLShape) => s.type === 'frame');

  return (
    <div className="p-3 space-y-3 bg-[var(--md-surface-1)]">
      {/* Stats Summary */}
      <div className="flex items-center justify-between p-2.5 rounded-[var(--md-radius-sm)] bg-[var(--md-surface-2)] border border-[var(--md-line-subtle)] text-xs">
        <div className="flex items-center gap-1.5 text-[var(--md-ink-primary)] font-medium">
          <Tag size={13} className="text-[var(--md-accent)]" />
          <span>Tagged Coverage:</span>
        </div>
        <span className="font-mono font-bold text-[var(--md-ink-primary)]">
          {taggedCount} / {allShapes.length}
        </span>
      </div>

      {/* Root frames list */}
      {rootFrames.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-[var(--md-line-subtle)]">
          <span className="text-[11px] uppercase font-semibold text-[var(--md-ink-muted)] tracking-wider block">
            Root Frames ({rootFrames.length})
          </span>
          <div className="space-y-1">
            {rootFrames.map((f: TLShape) => {
              const meta = getShapeMeta(f);
              const name = (f.props as any)?.name || meta?.props?.label || 'Page';
              return (
                <div
                  key={f.id}
                  onClick={() => editor.setSelectedShapes([f.id])}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--md-radius-sm)] bg-[var(--md-surface-2)] hover:bg-[var(--md-surface-3)] cursor-pointer text-xs group transition-colors"
                >
                  <span className="font-medium text-[var(--md-ink-primary)] truncate">{name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-[var(--md-ink-muted)] font-mono">
                      {meta?.role || 'page'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyFrameContract(f.id);
                      }}
                      aria-label={`Copy contract for ${name}`}
                      className="p-1 rounded text-[var(--md-ink-muted)] hover:text-[var(--md-accent)] hover:bg-[var(--md-surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
                    >
                      {copiedFrameId === f.id ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
