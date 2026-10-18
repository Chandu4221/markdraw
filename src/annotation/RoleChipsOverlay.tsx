// src/annotation/RoleChipsOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Editor } from '@tldraw/tldraw';
import { getShapeMeta } from './shapeMeta';

interface RoleChipsOverlayProps {
  editor: Editor | null;
  showChips?: boolean;
  showUntagged?: boolean;
  onChipClick?: (shapeId: string) => void;
}

interface ChipItem {
  shapeId: string;
  label: string;
  isUnit: boolean;
  isUntagged: boolean;
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
  onChipClick
}) => {
  const [, setTick] = useState(0);

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

    chips.push({
      shapeId: shape.id,
      label: meta?.props?.label || meta?.role || 'untagged',
      isUnit: Boolean(meta?.unitId),
      isUntagged: !hasRole,
      x: screenPoint.x,
      y: screenPoint.y,
      w: bounds.w * zoom,
      h: bounds.h * zoom,
      zoom
    });
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden font-sans select-none"
      aria-hidden="true"
    >
      {chips.map((chip) => {
        const chipTop = Math.max(0, chip.y - 18);
        const chipLeft = chip.x;

        return (
          <div
            key={chip.shapeId}
            style={{
              position: 'absolute',
              left: `${chipLeft}px`,
              top: `${chipTop}px`,
              transformOrigin: 'top left'
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
              className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-t-[3px] border shadow-xs transition-opacity cursor-pointer ${
                chip.isUnit
                  ? 'bg-purple-600 text-white border-purple-700 opacity-80 hover:opacity-100'
                  : chip.isUntagged
                  ? 'bg-[var(--md-surface)] text-[var(--md-text-subtle)] border-dashed border-[var(--md-border)] opacity-60 hover:opacity-100'
                  : 'bg-blue-600 text-white border-blue-700 opacity-75 hover:opacity-100'
              }`}
              title={`Role: ${chip.label} (click to configure)`}
            >
              {chip.isUnit ? `[#${chip.label}]` : chip.label}
            </button>
          </div>
        );
      })}
    </div>
  );
};
