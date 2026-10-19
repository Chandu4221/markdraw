import React, { useMemo } from 'react';
import { Tag, ChevronDown, ChevronRight, StickyNote, Box } from 'lucide-react';
import { ROLE_DEFINITIONS, RoleName } from '../../annotation/roles';
import {
  getShapeMeta,
  updateDriverShapeMeta,
  suggestRoleForShape
} from '../../annotation/shapeMeta';
import { RoleResponsive, JsonValue } from '../../annotation/types';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { Input } from '@/components/ui/input';
import { ResponsiveSection } from './ResponsiveSection';
import { RolePickerDropdown } from './RolePickerDropdown';

interface RoleSectionProps {
  selectedShapes: CanvasShape[];
  allShapes: CanvasShape[];
  driver: CanvasDriver;
  isOpen: boolean;
  onToggle: () => void;
  onSaveUnitGesture: () => void;
  platformId?: string;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
}

export const RoleSection: React.FC<RoleSectionProps> = ({
  selectedShapes,
  allShapes,
  driver,
  isOpen,
  onToggle,
  onSaveUnitGesture,
  platformId,
  isSimulating,
  onToggleSimulate
}) => {
  const count = selectedShapes.length;
  const firstShape = selectedShapes[0];
  const firstMeta = firstShape ? getShapeMeta(firstShape) : null;
  const currentRole = firstMeta?.role;

  const potentialParents = useMemo(() => {
    const selectedIds = new Set(selectedShapes.map((s) => s.id));
    return allShapes.filter((s) => !selectedIds.has(s.id));
  }, [allShapes, selectedShapes]);

  const suggestedRole = useMemo(() => {
    if (count === 1 && firstShape) {
      return suggestRoleForShape(firstShape);
    }
    return null;
  }, [count, firstShape]);

  const hasResponsiveRoot = useMemo(() => {
    if (!firstShape) return false;

    const isResponsivePage = (s: CanvasShape): boolean => {
      const meta = getShapeMeta(s);
      if (!meta || meta.role !== 'page') return false;
      const behaviors = meta.props?.behaviors || [];
      return behaviors.includes('responsive');
    };

    if (isResponsivePage(firstShape)) return true;

    // Follow parentId chain
    let currentParentId = firstMeta?.parentId || firstShape.parentId;
    const visited = new Set<string>();
    if (firstShape.id) visited.add(firstShape.id);

    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      const parentShape = allShapes.find((s) => s.id === currentParentId);
      if (!parentShape) break;
      if (isResponsivePage(parentShape)) return true;
      const pMeta = getShapeMeta(parentShape);
      currentParentId = pMeta?.parentId || parentShape.parentId;
    }

    // Geometric fallback
    const { x, y, w, h } = firstShape.bounds;
    for (const s of allShapes) {
      if (s.id !== firstShape.id && isResponsivePage(s)) {
        const sb = s.bounds;
        if (x >= sb.x && y >= sb.y && x + w <= sb.x + sb.w && y + h <= sb.y + sb.h) {
          return true;
        }
      }
    }

    return false;
  }, [firstShape, firstMeta, allShapes]);

  const handleAssignRole = (role: RoleName | null) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    void updateDriverShapeMeta(driver, shapeIds, { role });
  };

  const handleUpdateProp = (key: string, value: JsonValue | undefined) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    void updateDriverShapeMeta(driver, shapeIds, {
      props: { [key]: value }
    });
  };

  const handleToggleBehavior = (behavior: string) => {
    const currentFlags: string[] = firstMeta?.props?.behaviors || [];
    const nextFlags = currentFlags.includes(behavior)
      ? currentFlags.filter((f) => f !== behavior)
      : [...currentFlags, behavior];

    handleUpdateProp('behaviors', nextFlags.length > 0 ? nextFlags : undefined);
  };

  const handleSetParent = (parentId: string | null) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    void updateDriverShapeMeta(driver, shapeIds, { parentId });
  };

  const handleUpdateResponsive = (patch: Partial<RoleResponsive> | null) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    if (patch === null) {
      void updateDriverShapeMeta(driver, shapeIds, { responsive: null });
    } else {
      const existing: RoleResponsive = firstMeta?.responsive || {
        order: 'auto',
        primary: false,
        smVisible: 'visible',
        smFullWidth: false,
        tablet: 'maintain'
      };
      void updateDriverShapeMeta(driver, shapeIds, {
        responsive: { ...existing, ...patch }
      });
    }
  };

  const roleDef = currentRole ? ROLE_DEFINITIONS[currentRole as RoleName] : null;
  const activeFlags: string[] = firstMeta?.props?.behaviors || [];

  return (
    <div>
      <button
        type="button"
        id="accordion-header-semantics"
        onClick={onToggle}
        className="w-full h-8 px-3 flex items-center justify-between text-left hover:bg-[var(--md-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-inset transition-colors cursor-pointer select-none group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Tag size={15} className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] shrink-0 transition-colors" />
          <span className="text-sm font-semibold tracking-wider uppercase text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors whitespace-nowrap shrink-0">
            Semantic Role
          </span>
          {currentRole && (
            <span className="px-2 py-0.5 text-sm font-mono font-semibold bg-[var(--md-surface-2)] border border-[var(--md-line-subtle)] text-[var(--md-ink-primary)] rounded truncate max-w-24">
              {currentRole}
            </span>
          )}
        </div>
        <div className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors shrink-0">
          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 pt-2 space-y-3 bg-[var(--md-surface-1)]">
          {/* Current Role & Search Dropdown */}
          <RolePickerDropdown
            currentRole={currentRole}
            roleDef={roleDef}
            suggestedRole={suggestedRole}
            onAssignRole={handleAssignRole}
            platformId={platformId}
          />

          {/* Accessible Label / AccName Input */}
          <div className="space-y-1">
            <label htmlFor="inspector-accname-input" className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer">
              Label / AccName
            </label>
            <Input
              id="inspector-accname-input"
              type="text"
              value={firstMeta?.props?.label || ''}
              onChange={(e) => handleUpdateProp('label', e.target.value || undefined)}
              placeholder='e.g. "Submit Form", "Main Navigation"...'
              className="h-8 text-sm font-sans"
            />
          </div>

          {/* Parent Container Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="inspector-parent-select" className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer">
                Parent Container
              </label>
              {firstMeta?.parentId && (
                <button
                  type="button"
                  onClick={() => handleSetParent(null)}
                  className="text-sm font-medium text-[var(--color-accent)] hover:underline cursor-pointer"
                >
                  Auto (Geometry)
                </button>
              )}
            </div>
            <select
              id="inspector-parent-select"
              value={firstMeta?.parentId || ''}
              onChange={(e) => handleSetParent(e.target.value || null)}
              className="w-full h-8 rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] px-2.5 text-sm text-[var(--md-ink-primary)] hover:border-[var(--md-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
            >
              <option value="">Auto (Infer from AABB bounds)</option>
              {potentialParents.map((p) => {
                const meta = getShapeMeta(p);
                const role = meta?.role || p.kind;
                const label = p.name || meta?.props?.label || p.id.slice(-6);
                return (
                  <option key={p.id} value={p.id}>
                    {role} — &quot;{label}&quot;
                  </option>
                );
              })}
            </select>
          </div>

          {/* Allowed Behavior Flags */}
          {roleDef && roleDef.flags && roleDef.flags.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-[var(--md-line-subtle)]">
              <label className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)]">
                Behaviors
              </label>
              <div className="flex flex-wrap gap-1">
                {roleDef.flags.map((flag) => {
                  const isActive = activeFlags.includes(flag);
                  return (
                    <button
                      key={flag}
                      type="button"
                      onClick={() => handleToggleBehavior(flag)}
                      className={`px-2 py-1 text-sm font-medium rounded-[var(--md-radius-sm)] transition-colors cursor-pointer border ${
                        isActive
                          ? 'bg-[var(--md-accent)] text-white border-[var(--md-accent)]'
                          : 'bg-[var(--md-surface-2)] text-[var(--md-ink-muted)] border-[var(--md-line-subtle)] hover:text-[var(--md-ink-primary)]'
                      }`}
                    >
                      {isActive ? '✓ ' : ''}
                      {flag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Responsive Props Section */}
          <ResponsiveSection
            firstMeta={firstMeta}
            hasResponsiveRoot={hasResponsiveRoot}
            onUpdateResponsive={handleUpdateResponsive}
            isSimulating={isSimulating}
            onToggleSimulate={onToggleSimulate}
          />

          {/* Style Note */}
          <div className="space-y-1 pt-1 border-t border-[var(--md-line-subtle)]">
            <label className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] flex items-center gap-1 cursor-pointer">
              <StickyNote size={14} className="text-[var(--md-ink-muted)]" />
              <span>Style Note (Non-binding)</span>
            </label>
            <textarea
              value={firstMeta?.props?.note || ''}
              onChange={(e) => handleUpdateProp('note', e.target.value || undefined)}
              placeholder="e.g. skeleton state on mount, dark card border..."
              className="w-full h-14 p-2 text-sm rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] hover:border-[var(--md-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] resize-none transition-colors"
            />
          </div>

          {/* Unit Save Gesture (Multi-select) */}
          {count > 1 && (
            <div className="pt-2 border-t border-[var(--md-line-subtle)]">
              <button
                type="button"
                onClick={onSaveUnitGesture}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-sm font-semibold rounded-[var(--md-radius-sm)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors cursor-pointer"
              >
                <Box size={15} className="shrink-0" />
                <span>Save {count} shapes as Unit...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
