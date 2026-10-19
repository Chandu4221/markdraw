// src/components/simulation/ReflowPreview.tsx
// Non-destructive responsive reflow ghost overlay (§4.2, §4.3)
import React, { useState, useEffect, useMemo } from 'react';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { CanvasShape, Viewport } from '../../canvas/port/CanvasShape';
import { computeReflow } from '../../core/reflow';
import { MarkDrawChip } from '../ui/MarkDrawChip';
import { Breakpoint } from '../ui/BreakpointSwitch';

export interface ReflowPreviewProps {
  rootId: string;
  driver?: CanvasDriver | null;
  breakpoint: Breakpoint;
  initialShapes?: CanvasShape[];
}

export const ReflowPreview: React.FC<ReflowPreviewProps> = ({
  rootId,
  driver,
  breakpoint,
  initialShapes
}) => {
  const [shapes, setShapes] = useState<CanvasShape[]>(initialShapes || []);
  const [viewport, setViewport] = useState<Viewport>(() => {
    if (driver) {
      try {
        return driver.getViewport();
      } catch {}
    }
    return { x: 0, y: 0, zoom: 1 };
  });

  useEffect(() => {
    if (!driver) return;
    let active = true;

    const fetchState = async () => {
      try {
        const list = await driver.listShapes();
        const vp = driver.getViewport();
        if (active) {
          setShapes(list);
          setViewport(vp);
        }
      } catch {}
    };

    fetchState();
    const unlistenShapes = driver.onShapesChanged(fetchState);
    return () => {
      active = false;
      unlistenShapes();
    };
  }, [driver]);

  // Find root shape and all descendants
  const subtree = useMemo(() => {
    const root = shapes.find((s) => s.id === rootId);
    if (!root) return [];
    const result: CanvasShape[] = [root];
    const queue = [rootId];
    while (queue.length > 0) {
      const parentId = queue.shift()!;
      for (const s of shapes) {
        if (s.parentId === parentId) {
          result.push(s);
          queue.push(s.id);
        }
      }
    }
    return result;
  }, [shapes, rootId]);

  const rootShape = useMemo(() => shapes.find((s) => s.id === rootId), [shapes, rootId]);

  // Compute pure reflow
  const reflowResult = useMemo(() => {
    if (subtree.length === 0 || breakpoint === 1200) return { nodes: [] };
    return computeReflow({
      shapes: subtree,
      width: breakpoint,
      defaultBreakpoint: 768
    });
  }, [subtree, breakpoint]);

  if (!driver || !rootShape || subtree.length === 0 || breakpoint === 1200) {
    return null;
  }

  const zoom = viewport.zoom;
  const rootScreenX = rootShape.bounds.x * zoom + viewport.x;
  const rootScreenY = rootShape.bounds.y * zoom + viewport.y;
  const rootScreenW = rootShape.bounds.w * zoom;
  const rootScreenH = rootShape.bounds.h * zoom;
  const breakpointScreenW = breakpoint * zoom;

  const shapeMap = new Map(subtree.map((s) => [s.id, s]));

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden font-sans select-none" data-testid="reflow-preview">
      {/* Root Container Tint and Dashed Guideline at Breakpoint Width (§4.3) */}
      <div
        className="absolute pointer-events-none overflow-hidden"
        style={{ // v5-token-exception: simulation overlay positions (4.3)
          left: rootScreenX,
          top: rootScreenY,
          width: rootScreenW,
          height: rootScreenH
        }}
      >
        <div
          className="absolute top-0 bottom-0 left-0 bg-[var(--color-accent)]/10 border-r-2 border-dashed border-[var(--color-accent)] pointer-events-none transition-all duration-150"
          style={{ // v5-token-exception: simulation overlay positions (4.3)
            width: breakpointScreenW
          }}
        >
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[var(--color-surface-1)] border border-[var(--color-line-subtle)] text-sm font-mono font-semibold text-[var(--color-accent)] shadow-xs">
            {breakpoint}
          </div>
        </div>
      </div>

      {/* Ghost Preview Rectangles for Reflowed Elements (§4.3) */}
      {reflowResult.nodes.map((node) => {
        if (node.shapeId === rootId) return null;
        const originalShape = shapeMap.get(node.shapeId);
        const role = node.role;

        const nodeScreenX = node.x * zoom + viewport.x;
        const nodeScreenY = node.y * zoom + viewport.y;
        const nodeScreenW = node.w * zoom;
        const nodeScreenH = node.h * zoom;

        if (node.state === 'hidden') {
          return (
            <div
              key={node.shapeId}
              className="absolute pointer-events-none rounded border border-dashed border-[var(--color-line-strong)] opacity-40 flex items-center justify-center p-1 bg-[var(--color-surface-2)]/60"
              style={{ // v5-token-exception: simulation overlay positions (4.3)
                left: nodeScreenX,
                top: nodeScreenY,
                width: nodeScreenW,
                height: nodeScreenH
              }}
            >
              <span className="text-sm font-mono text-[var(--color-ink-muted)]">[hidden]</span>
            </div>
          );
        }

        if (node.state === 'collapsed') {
          return (
            <div
              key={node.shapeId}
              className="absolute pointer-events-none rounded border border-[var(--color-accent)] bg-[var(--color-surface-1)] shadow-md flex items-center justify-between px-2"
              style={{ // v5-token-exception: simulation overlay positions (4.3)
                left: nodeScreenX,
                top: nodeScreenY,
                width: nodeScreenW,
                height: nodeScreenH
              }}
            >
              <span className="text-sm font-semibold text-[var(--color-accent)]">
                {node.collapseKind === 'hamburger' ? '☰ Menu' : node.collapseKind === 'bottom-bar' ? '⬇ Bottom Bar' : '⊞ Drawer Rail'}
              </span>
              <MarkDrawChip variant="role" role={role || undefined} label={`${role || 'nav'} (${node.collapseKind})`} size="sm" />
            </div>
          );
        }

        // Normal reflowed / wrapped node
        return (
          <div
            key={node.shapeId}
            className="absolute pointer-events-none rounded border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] transition-all duration-100 flex flex-col justify-between p-1.5 overflow-hidden shadow-xs"
            style={{ // v5-token-exception: simulation overlay positions (4.3)
              left: nodeScreenX,
              top: nodeScreenY,
              width: nodeScreenW,
              height: nodeScreenH
            }}
          >
            <div className="flex items-center justify-between gap-1">
              <MarkDrawChip variant={role ? 'role' : 'untagged'} role={role || undefined} label={role || 'box'} size="sm" />
              <span className="text-sm font-mono text-[var(--color-ink-muted)] truncate max-w-20">#{node.shapeId.slice(0, 5)}</span>
            </div>
            {originalShape?.text && (
              <div className="text-sm font-sans text-[var(--color-ink-primary)] truncate mt-1">{originalShape.text}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
