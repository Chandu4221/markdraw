import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { CanvasDriver } from '../canvas/port/CanvasDriver';
import { CanvasShape } from '../canvas/port/CanvasShape';
import { MarkDrawChip } from '../components/ui/MarkDrawChip';
import { getShapeMeta } from './shapeMeta';
import { MarkDrawCompiler } from '../core/compiler';
import { canvasShapesToCompilerShapes } from '../hooks/useCompilation';
import { Editor } from '../core/types';

interface RoleChipsOverlayProps {
  driver?: CanvasDriver | null;
  editor?: Editor | null;
  showChips?: boolean;
  showUntagged?: boolean;
  onChipClick?: (shapeId: string) => void;
  onCopyContract?: (shapeId: string, contractText: string) => void;
  initialShapes?: CanvasShape[];
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
  driver,
  editor,
  showChips = true,
  showUntagged = false,
  onChipClick,
  onCopyContract,
  initialShapes
}) => {
  const [, setTick] = useState(0);
  const [copiedRootId, setCopiedRootId] = useState<string | null>(null);
  const [driverShapes, setDriverShapes] = useState<CanvasShape[]>(initialShapes || []);
  const [driverSelection, setDriverSelection] = useState<string[]>([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

  useEffect(() => {
    if (driver) {
      const updateFromDriver = async () => {
        try {
          const shapes = await driver.listShapes();
          const vp = driver.getViewport();
          setDriverShapes(shapes);
          setViewport(vp);
        } catch {
          // ignore
        }
      };
      updateFromDriver();

      const unlistenShapes = driver.onShapesChanged(() => {
        updateFromDriver();
        setTick((t) => (t + 1) % 1000000);
      });

      const unlistenSel = driver.onSelectionChanged((sel) => {
        setDriverSelection(sel);
      });

      return () => {
        unlistenShapes();
        unlistenSel();
      };
    } else if (editor) {
      const unlisten = editor.store.listen(() => {
        setTick((t) => (t + 1) % 1000000);
      });
      return () => {
        unlisten();
      };
    }
  }, [driver, editor]);

  if ((!driver && !editor) || !showChips) return null;

  const zoom = driver ? viewport.zoom : editor.getZoomLevel();
  if (zoom < 0.25) return null;

  const selectedShapeIds = new Set(
    driver ? driverSelection : (editor.getSelectedShapeIds() as string[])
  );
  const chips: ChipItem[] = [];

  if (driver) {
    for (const shape of driverShapes) {
      if (shape.kind === 'arrow' || shape.kind === 'line') continue;
      const meta = getShapeMeta(shape);
      const hasRole = Boolean(meta && meta.role);
      if (!hasRole && !showUntagged) continue;

      const screenX = (shape.bounds.x + viewport.x) * zoom;
      const screenY = (shape.bounds.y + viewport.y) * zoom;
      const screenW = shape.bounds.w * zoom;
      const screenH = shape.bounds.h * zoom;

      let isFlushWithParentTop = false;
      if (shape.parentId) {
        const parentShape = driverShapes.find((s) => s.id === shape.parentId);
        if (parentShape && Math.abs(shape.bounds.y - parentShape.bounds.y) < 14) {
          isFlushWithParentTop = true;
        }
      }

      chips.push({
        shapeId: shape.id,
        label: meta?.role || (shape.kind === 'frame' ? shape.name || 'page' : 'untagged'),
        isUnit: Boolean(meta?.unitId),
        isUntagged: !hasRole,
        isRoot: shape.kind === 'frame' || meta?.role === 'page',
        isSelected: selectedShapeIds.has(shape.id),
        isFlushWithParentTop,
        x: screenX,
        y: screenY,
        w: screenW,
        h: screenH,
        zoom
      });
    }
  } else if (editor) {
    const shapes = editor.getCurrentPageShapes();
    for (const shape of shapes) {
      if (shape.type === 'arrow' || shape.type === 'line') continue;

      const meta = getShapeMeta(shape);
      const hasRole = Boolean(meta && meta.role);

      if (!hasRole && !showUntagged) continue;

      const bounds = editor.getShapePageBounds(shape);
      if (!bounds || bounds.w < 10 || bounds.h < 10) continue;

      const screenPoint = editor.pageToViewport({ x: bounds.x, y: bounds.y });

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
  }

  const handleCopyContract = async (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    let compilerShapes: Parameters<typeof MarkDrawCompiler.compile>[0] = [];
    if (driver) {
      compilerShapes = canvasShapesToCompilerShapes(driverShapes);
    } else if (editor) {
      compilerShapes = editor.getCurrentPageShapes();
    }
    const res = MarkDrawCompiler.compile(compilerShapes, null, {
      annotationMode: true,
      scope: { shapeIds: [shapeId] }
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(res.markdownSpec);
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
                onClick={async (e) => {
                  e.stopPropagation();
                  if (driver) {
                    await driver.setSelection([chip.shapeId]);
                  } else if (editor) {
                    editor.setSelectedShapes([chip.shapeId]);
                  }
                  onChipClick?.(chip.shapeId);
                }}
                className={`transition-all cursor-pointer rounded-[3px] ${
                  chip.isSelected
                    ? 'ring-2 ring-[var(--md-primary)] font-bold opacity-100 scale-105'
                    : 'opacity-85 hover:opacity-100'
                }`}
                title={`Role: ${chip.label} (click to configure)`}
              >
                <MarkDrawChip
                  variant={chip.isUnit ? 'unit' : chip.isUntagged ? 'untagged' : 'role'}
                  role={chip.isUntagged || chip.isUnit ? undefined : chip.label}
                  label={chip.label}
                  size="sm"
                />
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
                  className="px-2 py-0.5 text-sm font-semibold bg-[var(--md-surface-raised)] border border-[var(--md-border-strong)] text-[var(--md-text)] rounded-[3px] hover:bg-blue-600 hover:text-white hover:border-blue-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Copy lean contract for this root frame"
                  aria-label="Copy lean contract for this root frame"
                >
                  {copiedRootId === chip.shapeId ? (
                    <Check size={12} className="text-green-500" />
                  ) : (
                    <Copy size={12} />
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
