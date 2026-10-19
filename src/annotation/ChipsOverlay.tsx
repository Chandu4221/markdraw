// src/annotation/ChipsOverlay.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { CanvasDriver } from '../canvas/port/CanvasDriver';
import { CanvasShape, Viewport } from '../canvas/port/CanvasShape';
import { getShapeMeta } from './shapeMeta';
import { getTypeIcon } from './typeIcons';
import { MarkDrawCompiler } from '../core/compiler';
import { canvasShapesToCompilerShapes } from '../hooks/useCompilation';

interface ChipsOverlayProps {
  driver?: CanvasDriver | null;
  showChips?: boolean;
  showUntagged?: boolean;
  onChipClick?: (shapeId: string) => void;
  onCopyContract?: (shapeId: string, contractText: string) => void;
  initialShapes?: CanvasShape[];
}

interface ChipItem {
  shapeId: string;
  type: string | null;
  name: string | null;
  isUnit: boolean;
  isUntagged: boolean;
  isRoot: boolean;
  isSelected: boolean;
  isFlushWithParentTop: boolean;
  screenX: number;
  screenY: number;
}

export const ChipsOverlay: React.FC<ChipsOverlayProps> = ({
  driver,
  showChips = true,
  showUntagged = false,
  onChipClick,
  onCopyContract,
  initialShapes
}) => {
  const [, setTick] = useState<number>(0);
  const [copiedRootId, setCopiedRootId] = useState<string | null>(null);
  const [driverShapes, setDriverShapes] = useState<CanvasShape[]>(initialShapes || []);
  const [driverSelection, setDriverSelection] = useState<string[]>([]);
  const [viewport, setViewport] = useState<Viewport>(() => {
    if (driver) {
      try {
        return driver.getViewport();
      } catch {
        // ignore
      }
    }
    return { x: 0, y: 0, zoom: 1 };
  });
  const [isPointerDown, setIsPointerDown] = useState<boolean>(false);

  useEffect(() => {
    const handleDown = () => setIsPointerDown(true);
    const handleUp = () => setIsPointerDown(false);
    window.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  useEffect(() => {
    if (!driver) return;

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

    const unlistenVp = driver.onViewportChanged?.((vp) => {
      setViewport(vp);
    });

    return () => {
      unlistenShapes();
      unlistenSel();
      unlistenVp?.();
    };
  }, [driver]);

  const selectedShapeIds = useMemo(() => new Set(driverSelection), [driverSelection]);

  const chips = useMemo<ChipItem[]>(() => {
    if (!driver || !showChips) return [];

    const zoom = viewport.zoom;
    const result: ChipItem[] = [];

    for (const shape of driverShapes) {
      if (shape.kind === 'arrow' || shape.kind === 'line') continue;
      const meta = getShapeMeta(shape);
      const shapeType = meta?.type ?? meta?.role ?? null;
      const hasTypeTag = Boolean(shapeType);

      if (!hasTypeTag && !showUntagged) continue;

      let isFlushWithParentTop = false;
      if (shape.parentId) {
        const parentShape = driverShapes.find((s) => s.id === shape.parentId);
        if (parentShape && Math.abs(shape.bounds.y - parentShape.bounds.y) < 14) {
          isFlushWithParentTop = true;
        }
      }

      // Exact screen position formula per §1.2:
      // screenX = worldX * zoom + scrollX
      // screenY = worldY * zoom + scrollY
      const screenX = shape.bounds.x * zoom + viewport.x;
      const screenY = shape.bounds.y * zoom + viewport.y + (isFlushWithParentTop ? 18 : 6);

      const humanName = shape.name || meta?.props?.label || null;

      result.push({
        shapeId: shape.id,
        type: shapeType,
        name: humanName,
        isUnit: Boolean(meta?.unitId),
        isUntagged: !hasTypeTag,
        isRoot: shape.kind === 'frame' || shapeType === 'page',
        isSelected: selectedShapeIds.has(shape.id),
        isFlushWithParentTop,
        screenX,
        screenY
      });
    }

    return result;
  }, [driver, showChips, showUntagged, driverShapes, viewport, selectedShapeIds]);

  const handleCopy = useCallback(
    async (e: React.MouseEvent, shapeId: string) => {
      e.stopPropagation();
      if (!driver) return;
      const compilerShapes = canvasShapesToCompilerShapes(driverShapes);
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
    },
    [driver, driverShapes, onCopyContract]
  );

  if (!driver || !showChips) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden font-sans select-none"
      aria-hidden="true"
    >
      {chips.map((chip) => {
        const TypeIcon = chip.type ? getTypeIcon(chip.type) : null;
        const displayText = chip.name || chip.type || (chip.isUntagged ? '?' : '');

        return (
          <div
            key={chip.shapeId}
            data-shape-id={chip.shapeId}
            // v5-token-exception: computed chip position
            style={{ transform: `translate(${chip.screenX}px, ${chip.screenY}px)` }}
            className="absolute top-0 left-0 pointer-events-auto group z-20"
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await driver.setSelection([chip.shapeId]);
                  onChipClick?.(chip.shapeId);
                }}
                className={`h-5 px-1.5 flex items-center gap-1 text-sm font-medium rounded-sm border cursor-pointer select-none transition-colors ${
                  chip.isUntagged
                    ? 'border-dashed border-[var(--md-line-strong)] bg-[var(--md-surface-1)] text-[var(--md-ink-muted)] hover:text-[var(--md-ink-primary)]'
                    : 'border-[var(--md-line-subtle)] bg-[var(--md-surface-2)] text-[var(--md-ink-primary)] hover:bg-[var(--md-surface-3)]'
                } ${
                  chip.isSelected ? 'ring-2 ring-[var(--md-accent)]' : ''
                }`}
                title={chip.type ? `Type: ${chip.type}` : 'Untagged'}
              >
                {TypeIcon ? (
                  <TypeIcon size={12} className="shrink-0 text-[var(--md-ink-muted)]" />
                ) : chip.type ? (
                  <span className="font-mono text-sm text-[var(--md-ink-muted)]">
                    {chip.type.slice(0, 3)}
                  </span>
                ) : (
                  <span className="font-bold text-sm text-[var(--md-ink-muted)]">?</span>
                )}
                <span className="max-w-20 truncate">{displayText}</span>
              </button>

              {chip.isRoot && !isPointerDown && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, chip.shapeId)}
                  className="hidden group-hover:flex items-center gap-1 h-5 px-1.5 text-sm font-medium rounded-sm border border-[var(--md-line-subtle)] bg-[var(--md-surface-2)] text-[var(--md-ink-secondary)] hover:text-[var(--md-ink-primary)] hover:bg-[var(--md-surface-3)] transition-colors cursor-pointer shadow-sm"
                  title="Copy contract"
                  aria-label="Copy contract"
                >
                  {copiedRootId === chip.shapeId ? (
                    <Check size={11} className="text-[var(--md-success)]" />
                  ) : (
                    <Copy size={11} />
                  )}
                  <span>Copy</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const RoleChipsOverlay = ChipsOverlay;
