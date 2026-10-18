import React, { useState, useMemo } from 'react';
import {
  Tag,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Smartphone,
  StickyNote,
  Box
} from 'lucide-react';
import {
  ROLE_DEFINITIONS,
  RoleName,
  RoleCategory,
  searchRoles
} from '../../annotation/roles';
import { getShapeMeta, updateShapeMeta, suggestRoleForShape } from '../../annotation/shapeMeta';
import { RoleResponsive } from '../../annotation/types';
import { Editor, TLShape } from '../../core/types';
import { Input } from '@/components/ui/input';

interface RoleSectionProps {
  selectedShapes: TLShape[];
  editor: Editor;
  isOpen: boolean;
  onToggle: () => void;
  onSaveUnitGesture: () => void;
}

export const RoleSection: React.FC<RoleSectionProps> = ({
  selectedShapes,
  editor,
  isOpen,
  onToggle,
  onSaveUnitGesture
}) => {
  const [roleSearch, setRoleSearch] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const count = selectedShapes.length;
  const firstShape = selectedShapes[0];
  const firstMeta = firstShape ? getShapeMeta(firstShape) : null;
  const currentRole = firstMeta?.role;

  const potentialParents = useMemo(() => {
    const all = editor.getCurrentPageShapes();
    const selectedIds = new Set(selectedShapes.map((s) => s.id));
    return all.filter((s: TLShape) => !selectedIds.has(s.id));
  }, [editor, selectedShapes]);

  const suggestedRole = useMemo(() => {
    if (count === 1 && firstShape) {
      return suggestRoleForShape(firstShape, editor);
    }
    return null;
  }, [count, firstShape, editor]);

  const filteredGroupedRoles = useMemo(() => {
    const matched = searchRoles(roleSearch);
    const groups: Record<RoleCategory, typeof matched> = {
      structure: [],
      content: [],
      interaction: [],
      navigation: [],
      feedback: [],
      utility: []
    };
    matched.forEach((r) => {
      if (groups[r.category]) {
        groups[r.category].push(r);
      }
    });
    return groups;
  }, [roleSearch]);

  const handleAssignRole = (role: RoleName | null) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, { role });
    setIsRoleDropdownOpen(false);
    setRoleSearch('');
  };

  const handleUpdateProp = (key: string, value: any) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, {
      props: { [key]: value }
    });
  };

  const handleToggleBehavior = (behavior: string) => {
    const currentFlags: string[] = (firstMeta?.props as any)?.behaviors || [];
    const nextFlags = currentFlags.includes(behavior)
      ? currentFlags.filter((f) => f !== behavior)
      : [...currentFlags, behavior];

    handleUpdateProp('behaviors', nextFlags.length > 0 ? nextFlags : undefined);
  };

  const handleSetParent = (parentId: string | null) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, { parentId });
  };

  const handleUpdateResponsive = (patch: Partial<RoleResponsive> | null) => {
    const shapeIds = selectedShapes.map((s) => s.id);
    if (patch === null) {
      updateShapeMeta(editor, shapeIds, { responsive: null });
    } else {
      const existing: RoleResponsive = firstMeta?.responsive || {
        order: 'auto',
        primary: false,
        smVisible: 'visible',
        smFullWidth: false,
        tablet: 'maintain'
      };
      updateShapeMeta(editor, shapeIds, {
        responsive: { ...existing, ...patch }
      });
    }
  };

  const roleDef = currentRole ? ROLE_DEFINITIONS[currentRole as RoleName] : null;
  const activeFlags: string[] = (firstMeta?.props as any)?.behaviors || [];

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
          <Tag size={13} className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] shrink-0 transition-colors" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors whitespace-nowrap shrink-0">
            Semantic Role
          </span>
          {currentRole && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-[var(--md-surface-2)] border border-[var(--md-line-subtle)] text-[var(--md-ink-primary)] rounded truncate max-w-[100px]">
              {currentRole}
            </span>
          )}
        </div>
        <div className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors shrink-0">
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 pt-2 space-y-3 bg-[var(--md-surface-1)]">
          {/* Current Role & Search Dropdown */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer">
                Role
              </label>
              {currentRole && (
                <button
                  type="button"
                  onClick={() => handleAssignRole(null)}
                  className="text-[11px] font-medium text-red-500 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
              className="w-full h-8 px-2.5 flex items-center justify-between rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] hover:border-[var(--md-line-strong)] text-left text-xs text-[var(--md-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
            >
              <span className="truncate">
                {currentRole ? (
                  <span className="font-semibold text-[var(--md-ink-primary)]">
                    {currentRole}{' '}
                    <span className="font-normal text-[var(--md-ink-muted)]">
                      ({roleDef?.category})
                    </span>
                  </span>
                ) : (
                  <span className="text-[var(--md-ink-muted)] italic">
                    Assign a semantic role...
                  </span>
                )}
              </span>
              <ChevronDown size={13} className="text-[var(--md-ink-muted)] shrink-0 ml-1" />
            </button>

            {/* Role Picker Dropdown Menu */}
            {isRoleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[var(--md-radius-md)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] shadow-xl p-1.5 space-y-1 max-h-64 overflow-y-auto">
                <Input
                  type="text"
                  placeholder="Search 31 roles or aliases..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="h-7 text-xs mb-1"
                  autoFocus
                />

                {Object.entries(filteredGroupedRoles).map(([cat, roles]) => {
                  if (roles.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-ink-muted)] px-2 pt-1.5">
                        {cat}
                      </div>
                      {roles.map((r) => (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => handleAssignRole(r.name)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 text-left rounded-[var(--md-radius-sm)] text-xs transition-colors cursor-pointer ${
                            currentRole === r.name
                              ? 'bg-[var(--md-accent)] text-white font-semibold'
                              : 'hover:bg-[var(--md-surface-2)] text-[var(--md-ink-primary)]'
                          }`}
                        >
                          <span>{r.name}</span>
                          {r.aliases.length > 0 && (
                            <span className={`text-[10px] truncate max-w-[100px] ${currentRole === r.name ? 'text-white/80' : 'text-[var(--md-ink-muted)]'}`}>
                              {r.aliases.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {!currentRole && suggestedRole && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[var(--md-ink-muted)] flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500 shrink-0" />
                <span>Suggested Role</span>
              </div>
              <button
                type="button"
                onClick={() => handleAssignRole(suggestedRole)}
                className="px-2.5 py-1 text-xs font-semibold rounded-[var(--md-radius-sm)] border border-blue-500/40 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
              >
                +{suggestedRole}
              </button>
            </div>
          )}

          {/* Accessible Label / AccName Input */}
          <div className="space-y-1">
            <label htmlFor="inspector-accname-input" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer">
              Label / AccName
            </label>
            <Input
              id="inspector-accname-input"
              type="text"
              value={firstMeta?.props?.label || ''}
              onChange={(e) => handleUpdateProp('label', e.target.value || undefined)}
              placeholder='e.g. "Submit Form", "Main Navigation"...'
              className="h-8 text-xs font-sans"
            />
          </div>

          {/* Parent Container Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="inspector-parent-select" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer">
                Parent Container
              </label>
              {firstMeta?.parentId && (
                <button
                  type="button"
                  onClick={() => handleSetParent(null)}
                  className="text-[11px] font-medium text-blue-500 hover:underline cursor-pointer"
                >
                  Auto (Geometry)
                </button>
              )}
            </div>
            <select
              id="inspector-parent-select"
              value={firstMeta?.parentId || ''}
              onChange={(e) => handleSetParent(e.target.value || null)}
              className="w-full h-8 rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] px-2.5 text-xs text-[var(--md-ink-primary)] hover:border-[var(--md-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
            >
              <option value="">Auto (Infer from AABB bounds)</option>
              {potentialParents.map((p: TLShape) => {
                const meta = getShapeMeta(p);
                const role = meta?.role || p.type;
                const label = (p.props as any)?.name || meta?.props?.label || p.id.slice(-6);
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
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-ink-muted)]">
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
                      className={`px-2 py-1 text-[11px] font-medium rounded-[var(--md-radius-sm)] transition-colors cursor-pointer border ${
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

          {/* Responsive Props */}
          <div className="space-y-1.5 pt-1 border-t border-[var(--md-line-subtle)]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] flex items-center gap-1 cursor-pointer">
              <Smartphone size={12} className="text-[var(--md-ink-muted)]" />
              <span>Responsive</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--md-ink-muted)]">Mobile:</span>
              <select
                value={firstMeta?.responsive?.smVisible || 'visible'}
                onChange={(e) => {
                  const val = e.target.value as any;
                  handleUpdateResponsive(val === 'visible' ? null : { smVisible: val });
                }}
                className="flex-1 h-8 rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] px-2.5 text-xs text-[var(--md-ink-primary)] hover:border-[var(--md-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
              >
                <option value="visible">Visible on Mobile</option>
                <option value="hidden">Hidden on Mobile</option>
                <option value="collapse:drawer">Collapse to Drawer</option>
                <option value="collapse:bottom-bar">Collapse to Bottom Bar</option>
                <option value="collapse:hamburger">Collapse to Hamburger</option>
              </select>
            </div>
          </div>

          {/* Style Note */}
          <div className="space-y-1 pt-1 border-t border-[var(--md-line-subtle)]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] flex items-center gap-1 cursor-pointer">
              <StickyNote size={12} className="text-[var(--md-ink-muted)]" />
              <span>Style Note (Non-binding)</span>
            </label>
            <textarea
              value={firstMeta?.props?.note || ''}
              onChange={(e) => handleUpdateProp('note', e.target.value || undefined)}
              placeholder="e.g. skeleton state on mount, dark card border..."
              className="w-full h-14 p-2 text-xs rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] hover:border-[var(--md-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] resize-none transition-colors"
            />
          </div>

          {/* Unit Save Gesture (Multi-select) */}
          {count > 1 && (
            <div className="pt-2 border-t border-[var(--md-line-subtle)]">
              <button
                type="button"
                onClick={onSaveUnitGesture}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-[var(--md-radius-sm)] border border-purple-500/40 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors cursor-pointer"
              >
                <Box size={14} className="shrink-0" />
                <span>Save {count} shapes as Unit...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
