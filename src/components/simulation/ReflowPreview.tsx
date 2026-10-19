// src/components/simulation/ReflowPreview.tsx
// Non-destructive responsive reflow ghost overlay (§4.2)
import React, { useState, useEffect, useMemo } from 'react';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { CanvasShape, Viewport } from '../../canvas/port/CanvasShape';
import { computeReflow } from '../../core/reflow';
import { MarkDrawChip } from '../ui/MarkDrawChip';
import { ROLE_DEFINITIONS, RoleName } from '../../annotation/roles';
import { Smartphone, Tablet, Monitor, X, Lightbulb } from 'lucide-react';

export interface ReflowPreviewProps {
  rootId: string;
  driver?: CanvasDriver | null;
  onClose: () => void;
  defaultBreakpoint?: number;
}

export const ReflowPreview: React.FC<ReflowPreviewProps> = ({
  rootId,
  driver,
  onClose,
  defaultBreakpoint = 768
}) => {
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [simWidth, setSimWidth] = useState<number>(375); // Default mobile 375px

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
    if (subtree.length === 0) return { nodes: [] };
    return computeReflow({
      shapes: subtree,
      width: simWidth,
      defaultBreakpoint
    });
  }, [subtree, simWidth, defaultBreakpoint]);

  if (!driver || !rootShape || subtree.length === 0) {
    return null;
  }

  const zoom = viewport.zoom;
  const rootScreenX = (rootShape.bounds.x + viewport.x) * zoom;
  const rootScreenY = (rootShape.bounds.y + viewport.y) * zoom;
  const rootScreenW = rootShape.bounds.w * zoom;
  const rootScreenH = rootShape.bounds.h * zoom;

  const shapeMap = new Map(subtree.map((s) => [s.id, s]));
  const suggestions = reflowResult.nodes
    .filter((n) => n.suggestion)
    .map((n) => n.suggestion!);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Background Dimmer: Dims canvas behind simulation */}
      <div
        className="absolute transition-all duration-150 pointer-events-none bg-black/75"
        style={{ // v5-token-exception: dynamic viewport rect positioning
          left: rootScreenX,
          top: rootScreenY,
          width: Math.max(rootScreenW, simWidth * zoom),
          height: rootScreenH
        }}
      />

      {/* Floating Simulation Toolbar (Interactive) */}
      <div
        className="absolute pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--md-line-strong)] bg-[var(--md-surface-1)] shadow-2xl backdrop-blur-md transition-all text-xs"
        style={{ // v5-token-exception: dynamic screen bounds positioning
          left: Math.max(16, rootScreenX),
          top: Math.max(16, rootScreenY - 50)
        }}
      >
        <span className="font-semibold text-[var(--md-ink-primary)] flex items-center gap-1">
          <Smartphone size={13} className="text-[var(--md-accent)]" />
          <span>Simulate:</span>
          <span className="font-mono text-xs font-bold text-[var(--md-accent)]">{simWidth}px</span>
        </span>

        {/* Width Slider (375 - 1200) */}
        <input
          type="range"
          min="375"
          max="1200"
          value={simWidth}
          onChange={(e) => setSimWidth(Number(e.target.value))}
          className="w-28 h-1.5 accent-[var(--md-accent)] cursor-ew-resize"
          title={`Simulated width: ${simWidth}px (breakpoint: ${defaultBreakpoint}px)`}
        />

        {/* Preset Buttons */}
        <div className="flex items-center gap-1 border-l border-[var(--md-line-subtle)] pl-2">
          <button
            type="button"
            onClick={() => setSimWidth(375)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              simWidth === 375
                ? 'bg-[var(--md-accent)] text-white'
                : 'bg-[var(--md-surface-2)] text-[var(--md-ink-secondary)] hover:text-[var(--md-ink-primary)]'
            }`}
            title="Mobile (375px)"
          >
            <Smartphone size={11} className="inline mr-0.5" /> 375
          </button>
          <button
            type="button"
            onClick={() => setSimWidth(768)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              simWidth === 768
                ? 'bg-[var(--md-accent)] text-white'
                : 'bg-[var(--md-surface-2)] text-[var(--md-ink-secondary)] hover:text-[var(--md-ink-primary)]'
            }`}
            title="Tablet (768px)"
          >
            <Tablet size={11} className="inline mr-0.5" /> 768
          </button>
          <button
            type="button"
            onClick={() => setSimWidth(1200)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              simWidth === 1200
                ? 'bg-[var(--md-accent)] text-white'
                : 'bg-[var(--md-surface-2)] text-[var(--md-ink-secondary)] hover:text-[var(--md-ink-primary)]'
            }`}
            title="Desktop (1200px)"
          >
            <Monitor size={11} className="inline mr-0.5" /> 1200
          </button>
        </div>

        {/* Suggestions chip */}
        {suggestions.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
            <Lightbulb size={11} />
            <span>{suggestions[0]}</span>
          </span>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-[var(--md-ink-muted)] hover:text-[var(--md-ink-primary)] hover:bg-[var(--md-surface-2)] transition-colors cursor-pointer ml-1"
          title="Exit simulation"
        >
          <X size={14} />
        </button>
      </div>

      {/* Ghost Preview Rectangles */}
      {reflowResult.nodes.map((node) => {
        const isRoot = node.shapeId === rootId;
        const originalShape = shapeMap.get(node.shapeId);
        const role = node.role;
        const roleDef = role ? ROLE_DEFINITIONS[role as RoleName] : null;
        const cat = roleDef?.category || 'utility';

        const screenX = (node.x + viewport.x) * zoom;
        const screenY = (node.y + viewport.y) * zoom;
        const screenW = node.w * zoom;
        const screenH = node.h * zoom;

        if (isRoot) {
          return (
            <div
              key={node.shapeId}
              className="absolute pointer-events-none rounded-[var(--md-radius-md)] border-2 border-[var(--md-accent)] shadow-xl bg-slate-900/40"
              style={{ left: screenX, top: screenY, width: screenW, height: screenH }} // v5-token-exception: dynamic simulation geometry
            >
              <div className="absolute top-1.5 right-2 text-[10px] font-mono font-semibold text-[var(--md-accent)]">
                {simWidth}px viewport
              </div>
            </div>
          );
        }

        if (node.state === 'hidden') {
          return (
            <div
              key={node.shapeId}
              className="absolute pointer-events-none rounded border border-dashed border-[var(--md-line-strong)] opacity-30 flex items-center justify-center p-1 bg-slate-500/10"
              style={{ left: screenX, top: screenY, width: screenW, height: screenH }} // v5-token-exception: dynamic simulation geometry
            >
              <span className="text-[10px] font-mono text-[var(--md-ink-muted)]">[hidden]</span>
            </div>
          );
        }

        if (node.state === 'collapsed') {
          return (
            <div
              key={node.shapeId}
              className="absolute pointer-events-none rounded border border-[var(--md-accent)] bg-[var(--md-surface-2)] shadow-md flex items-center justify-between px-2"
              style={{ left: screenX, top: screenY, width: screenW, height: screenH }} // v5-token-exception: dynamic simulation geometry
            >
              <span className="text-[11px] font-semibold text-[var(--md-accent)]">
                {node.collapseKind === 'hamburger' ? '☰ Menu' : node.collapseKind === 'bottom-bar' ? '⬇ Bottom Bar' : '⊞ Drawer Rail'}
              </span>
              <MarkDrawChip variant="role" role={role || undefined} label={`${role || 'nav'} (${node.collapseKind})`} size="sm" />
            </div>
          );
        }

        // Normal state
        return (
          <div
            key={node.shapeId}
            className="absolute pointer-events-none rounded border transition-all duration-100 flex flex-col justify-between p-1.5 overflow-hidden shadow-xs"
            style={{ // v5-token-exception: dynamic simulation geometry
              left: screenX,
              top: screenY,
              width: screenW,
              height: screenH,
              borderColor: `var(--color-role-${cat})`,
              backgroundColor: `var(--color-role-${cat}-bg)`
            }}
          >
            <div className="flex items-center justify-between gap-1">
              <MarkDrawChip variant={role ? 'role' : 'untagged'} role={role || undefined} category={cat} label={role || 'box'} size="sm" />
              <span className="text-[9px] font-mono text-[var(--md-ink-muted)] truncate max-w-[80px]">#{node.shapeId.slice(0, 5)}</span>
            </div>

            {originalShape?.text ? (
              <div className="text-[11px] font-sans text-[var(--md-ink-primary)] truncate mt-1">{originalShape.text}</div>
            ) : role === 'para' ? (
              <div className="space-y-1 my-auto opacity-40">
                <div className="h-1.5 bg-[var(--md-ink-muted)] rounded w-full" />
                <div className="h-1.5 bg-[var(--md-ink-muted)] rounded w-3/4" />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
