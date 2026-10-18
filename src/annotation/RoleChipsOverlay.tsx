import React, { useState, useEffect } from 'react';
import { Editor } from '@tldraw/tldraw';
import { Copy, Check } from 'lucide-react';
import { getShapeMeta } from './shapeMeta';
import { MarkDrawCompiler } from '../core/compiler';

interface RoleChipsOverlayProps {
  editor: Editor | null;
  showChips?: boolean;
  showUntagged?: boolean;
  onChipClick?: (shapeId: string) => void;
  onCopyContract?: (shapeId: string, contractText: string) => void;
}

interface ChipItem {
  shapeId: string;
  label: string;
  isUnit: boolean;
  isUntagged: boolean;
  isRoot: boolean;
  isSelected: boolean;
  isFlushWithParentTop: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  zoom: number;
}

export const RoleChipsOverlay: React.FC<RoleChipsOverlayProps> = ({
  editor,
  showChips = true,
  showUntagged = false,
  onChipClick,
  onCopyContract
}) => {
  const [, setTick] = useState(0);
  const [copiedRootId, setCopiedRootId] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;

    // Listen to camera movements, zooms, and shape changes
    const unlisten = editor.store.listen(() => {
      setTick((t) => (t + 1) % 1000000);
    });

    return () => {
      unlisten();
    };
  }, [editor]);

  if (!editor || !showChips) return null;

  const shapes = editor.getCurrentPageShapes();
  const zoom = editor.getZoomLevel();

  // If zoomed out too far (< 0.25), hide chips for readability
  if (zoom < 0.25) return null;

  const selectedShapeIds = new Set(editor.getSelectedShapeIds() as string[]);
  const chips: ChipItem[] = [];

  for (const shape of shapes) {
    if (shape.type === 'arrow' || shape.type === 'line') continue;

    const meta = getShapeMeta(shape);
    const hasRole = Boolean(meta && meta.role);

    if (!hasRole && !showUntagged) continue;

    const bounds = editor.getShapePageBounds(shape);
    if (!bounds || bounds.w < 10 || bounds.h < 10) continue;

    // Convert page coordinates to viewport pixel coordinates
    const screenPoint = editor.pageToViewport({ x: bounds.x, y: bounds.y });

    // Check if flush with parent frame top
    let isFlushWithParentTop = false;
    const parentId = shape.parentId || meta?.parentId;
    if (parentId && parentId !== editor.getCurrentPageId()) {
      const parentShape = editor.getShape(parentId as any);
      if (parentShape) {
        const parentBounds = editor.getShapePageBounds(parentShape);
        if (parentBounds && Math.abs(bounds.y - parentBounds.y) < 14) {
          isFlushWithParentTop = true;
        }
      }
    }

    chips.push({
      shapeId: shape.id,
      label: meta?.props?.label || meta?.role || 'untagged',
      isUnit: Boolean(meta?.unitId),
      isUntagged: !hasRole,
      isRoot: shape.type === 'frame' || meta?.role === 'page',
      isSelected: selectedShapeIds.has(shape.id),
      isFlushWithParentTop,
      x: screenPoint.x,
      y: screenPoint.y,
      w: bounds.w * zoom,
      h: bounds.h * zoom,
      zoom
    });
  }

  const handleCopyContract = (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    if (!editor) return;
    const all = editor.getCurrentPageShapes();
    const descendants: string[] = [];
    const findChildren = (pid: string) => {
      for (const s of all) {
        if (s.parentId === pid || getShapeMeta(s)?.parentId === pid) {
          descendants.push(s.id);
          findChildren(s.id);
        }
      }
    };
    findChildren(shapeId);
    const scopeIds = [shapeId, ...descendants];
    const res = MarkDrawCompiler.compile(all, editor, {
      annotationMode: true,
      scope: { shapeIds: scopeIds }
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(res.markdownSpec);
    }
    setCopiedRootId(shapeId);
    setTimeout(() => setCopiedRootId(null), 2000);
    onCopyContract?.(shapeId, res.markdownSpec);
  };

  // Track placed chip locations to prevent visual overlaps
  const placedPills: { x: number; y: number; w: number; h: number }[] = [];

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden font-sans select-none"
      aria-hidden="true"
    >
      {chips.map((chip) => {
        // Child flush with container top goes inside to avoid collision with container chip
        let chipTop = chip.isFlushWithParentTop ? chip.y + 4 : Math.max(0, chip.y - 18);
        let chipLeft = chip.isFlushWithParentTop ? chip.x + 4 : chip.x;
        const approxWidth = Math.max(48, chip.label.length * 7 + 16);

        // Collision avoidance: if overlapping an already placed chip, shift horizontally
        for (const placed of placedPills) {
          if (
            Math.abs(chipTop - placed.y) < 16 &&
            chipLeft < placed.x + placed.w &&
            chipLeft + approxWidth > placed.x
          ) {
            chipLeft = placed.x + placed.w + 4;
          }
        }
        placedPills.push({ x: chipLeft, y: chipTop, w: approxWidth, h: 18 });

        return (
          <React.Fragment key={chip.shapeId}>
            {/* Shape Role Badge */}
            <div
              style={{
                position: 'absolute',
                left: `${chipLeft}px`,
                top: `${chipTop}px`,
                transformOrigin: 'top left',
                zIndex: chip.isSelected ? 30 : 20
              }}
              className="pointer-events-auto"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.setSelectedShapes([chip.shapeId as any]);
                  onChipClick?.(chip.shapeId);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-[3px] border shadow-xs transition-all cursor-pointer ${
                  chip.isSelected
                    ? 'ring-2 ring-blue-500 font-bold opacity-100 scale-105'
                    : 'opacity-80 hover:opacity-100'
                } ${
                  chip.isUnit
                    ? 'bg-purple-600 text-white border-purple-700'
                    : chip.isUntagged
                    ? 'bg-[var(--md-surface)] text-[var(--md-text-subtle)] border-dashed border-[var(--md-border)]'
                    : 'bg-blue-600 text-white border-blue-700'
                }`}
                title={`Role: ${chip.label} (click to configure)`}
              >
                {chip.isUnit ? `[#${chip.label}]` : chip.label}
              </button>
            </div>

            {/* Root Frame Copy Contract Button (Anchored cleanly at Top-Right of Root Frame) */}
            {chip.isRoot && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.max(chip.x + 60, chip.x + chip.w - 56)}px`,
                  top: `${Math.max(0, chip.y - 18)}px`,
                  transformOrigin: 'top right',
                  zIndex: 25
                }}
                className="pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={(e) => handleCopyContract(e, chip.shapeId)}
                  className="px-1.5 py-0.5 text-[9px] font-semibold bg-[var(--md-surface-raised)] border border-[var(--md-border-strong)] text-[var(--md-text)] rounded-[3px] hover:bg-blue-600 hover:text-white hover:border-blue-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Copy lean contract for this root frame"
                >
                  {copiedRootId === chip.shapeId ? (
                    <Check size={10} className="text-green-500" />
                  ) : (
                    <Copy size={10} />
                  )}
                  <span>Copy</span>
                </button>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
