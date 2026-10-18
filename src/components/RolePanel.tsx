// src/components/RolePanel.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Editor, TLShape } from '@tldraw/tldraw';
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
  Smartphone,
  Layers,
  StickyNote,
  Box,
  Check
} from 'lucide-react';
import {
  ROLE_DEFINITIONS,
  RoleName,
  RoleDefinition,
  RoleCategory,
  searchRoles
} from '../annotation/roles';
import { getShapeMeta, updateShapeMeta, suggestRoleForShape } from '../annotation/shapeMeta';
import { MarkDrawMeta, RoleResponsive } from '../annotation/types';
import { Input } from '@/components/ui/input';

interface RolePanelProps {
  editor: Editor | null;
  onSaveAsUnit?: (shapeIds: string[]) => void;
}

export const RolePanel: React.FC<RolePanelProps> = ({ editor, onSaveAsUnit }) => {
  const [selectedShapes, setSelectedShapes] = useState<TLShape[]>([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const selected = editor.getSelectedShapes();
      setSelectedShapes(selected);
      setIsRoleDropdownOpen(false);
    };

    updateSelection();

    const unlisten = editor.store.listen(() => {
      updateSelection();
    });

    return () => {
      unlisten();
    };
  }, [editor]);

  const count = selectedShapes.length;

  // Candidate parent shapes on the canvas (frames, groups, or containers)
  const candidateParents = useMemo(() => {
    if (!editor || count === 0) return [];
    const selIds = new Set(selectedShapes.map((s) => s.id));
    const all = editor.getCurrentPageShapes();
    return all.filter((s) => {
      if (selIds.has(s.id)) return false;
      if (s.type === 'frame' || s.type === 'group') return true;
      const meta = getShapeMeta(s);
      if (meta && ['page', 'section', 'card', 'hero', 'dialog'].includes(meta.role || '')) {
        return true;
      }
      return false;
    });
  }, [editor, selectedShapes, count]);

  // Primary shape metadata
  const firstShape = selectedShapes[0];
  const firstMeta: MarkDrawMeta | null = firstShape ? getShapeMeta(firstShape) : null;
  const currentRole = firstMeta?.role || null;
  const currentUnitId = firstMeta?.unitId || null;

  // Filtered roles by search query (name, alias, decision rule)
  const filteredRoles = useMemo(() => searchRoles(roleSearch), [roleSearch]);

  // Group roles by category
  const groupedRoles = useMemo(() => {
    const map: Record<RoleCategory, RoleDefinition[]> = {
      structure: [],
      content: [],
      interaction: [],
      navigation: [],
      feedback: [],
      utility: []
    };
    for (const r of filteredRoles) {
      if (map[r.category]) {
        map[r.category].push(r);
      }
    }
    return map;
  }, [filteredRoles]);

  // Suggestion for current shape
  const suggestedRole = useMemo(() => {
    if (count === 1 && firstShape) {
      return suggestRoleForShape(firstShape, editor);
    }
    return null;
  }, [count, firstShape, editor]);

  // Check if ancestor root is responsive
  const hasResponsiveRoot = useMemo(() => {
    if (!editor || !firstShape) return false;
    let curr: TLShape | undefined = firstShape;
    while (curr) {
      const meta = getShapeMeta(curr);
      if (meta?.role === 'page' && meta?.responsive) {
        return true;
      }
      if (!curr.parentId || curr.parentId === editor.getCurrentPageId()) break;
      curr = editor.getShape(curr.parentId);
    }
    return false;
  }, [editor, firstShape]);

  // Handlers
  const handleAssignRole = (role: RoleName | null) => {
    if (!editor || count === 0) return;
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, { role });
    setIsRoleDropdownOpen(false);
    setRoleSearch('');
  };

  const handleUpdateProp = (key: string, value: any) => {
    if (!editor || count === 0) return;
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, {
      props: { [key]: value }
    });
  };

  const handleUpdateResponsive = (patch: Partial<RoleResponsive> | null) => {
    if (!editor || count === 0) return;
    const shapeIds = selectedShapes.map((s) => s.id);
    if (patch === null) {
      updateShapeMeta(editor, shapeIds, { responsive: null });
    } else {
      const existing = firstMeta?.responsive || {
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

  const handleToggleFlag = (flag: string) => {
    if (!editor || count === 0 || !currentRole) return;
    const currentFlags = (firstMeta?.props as any)?.behaviors || [];
    const nextFlags = currentFlags.includes(flag)
      ? currentFlags.filter((f: string) => f !== flag)
      : [...currentFlags, flag];
    handleUpdateProp('behaviors', nextFlags);
  };

  const handleSetParentId = (parentId: string | null) => {
    if (!editor || count === 0) return;
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, { parentId });
  };

  if (!editor) return null;

  // Empty selection: show canvas overview info
  if (count === 0) {
    const frames = editor.getCurrentPageShapes().filter((s) => s.type === 'frame');
    const taggedCount = editor.getCurrentPageShapes().filter((s) => Boolean(getShapeMeta(s)?.role)).length;
    const totalCount = editor.getCurrentPageShapes().length;

    return (
      <div
        className="absolute top-3 right-3 w-72 rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-[var(--md-shadow-lg)] z-30 overflow-hidden font-sans select-none text-xs"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-9 px-3 border-b border-[var(--md-border)] flex items-center justify-between bg-[var(--md-surface-raised)]">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--md-text-bold)]">
            <Layers size={13} className="text-blue-500" />
            <span>Canvas Overview</span>
          </div>
        </div>
        <div className="p-3 space-y-3 text-[var(--md-text)]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--md-text-muted)]">Tagged Elements:</span>
            <span className="font-mono font-semibold">{taggedCount} / {totalCount}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--md-text-muted)]">Roots (Frames):</span>
            <span className="font-mono font-semibold">{frames.length}</span>
          </div>
          <p className="text-[11px] text-[var(--md-text-subtle)] leading-relaxed pt-1 border-t border-[var(--md-border)]">
            Select any shape on canvas to assign its semantic role, label, and hierarchy.
          </p>
        </div>
      </div>
    );
  }

  const roleDef = currentRole ? ROLE_DEFINITIONS[currentRole as RoleName] : null;
  const activeFlags: string[] = (firstMeta?.props as any)?.behaviors || [];

  return (
    <div
      className="absolute top-3 right-3 w-72 rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-[var(--md-shadow-lg)] z-30 overflow-hidden font-sans select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="h-9 px-3 border-b border-[var(--md-border)] flex items-center justify-between bg-[var(--md-surface)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sliders size={13} className="text-blue-500 shrink-0" />
          <span className="text-xs font-semibold text-[var(--md-text-bold)] truncate">
            {count === 1
              ? currentRole
                ? `${currentRole} (${firstShape.type})`
                : `Untagged (${firstShape.type})`
              : `${count} shapes selected`}
          </span>
          {currentUnitId && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-purple-600 text-white rounded">
              UNIT
            </span>
          )}
        </div>
        <button
          className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] transition-colors cursor-pointer"
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          aria-label={isCollapsed ? 'Expand Role Panel' : 'Collapse Role Panel'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* 1. ROLE PICKER */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] flex items-center gap-1">
                <Tag size={11} className="text-blue-500" />
                <span>Semantic Role</span>
              </label>
              {currentRole && (
                <button
                  type="button"
                  onClick={() => handleAssignRole(null)}
                  className="text-[10px] text-red-500 hover:underline cursor-pointer"
                >
                  Clear role
                </button>
              )}
            </div>

            {/* Suggestion chip if geometry suggests something */}
            {suggestedRole && !currentRole && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => handleAssignRole(suggestedRole)}
                  className="w-full flex items-center justify-between gap-1 px-2 py-1 text-[11px] font-medium rounded border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>Looks like <strong>{suggestedRole}</strong></span>
                  </span>
                  <span className="text-[10px] underline">Assign?</span>
                </button>
              </div>
            )}

            {/* Dropdown trigger */}
            <div className="relative pt-0.5">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                className="w-full h-8 px-2.5 flex items-center justify-between rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] text-xs font-medium text-[var(--md-text)] hover:border-[var(--md-border-strong)] transition-colors cursor-pointer"
              >
                <span className="truncate">
                  {currentRole ? (
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      [{currentRole}]
                    </span>
                  ) : (
                    <span className="text-[var(--md-text-muted)]">— Select Role —</span>
                  )}
                </span>
                <ChevronDown size={13} className="text-[var(--md-text-muted)]" />
              </button>

              {/* Dropdown popup */}
              {isRoleDropdownOpen && (
                <div className="absolute top-9 left-0 right-0 z-50 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-[var(--md-shadow-lg)] p-2 space-y-2 max-h-64 overflow-y-auto">
                  <Input
                    type="text"
                    placeholder="Search roles or aliases (e.g. popup, cta)..."
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                  />

                  {(Object.keys(groupedRoles) as RoleCategory[]).map((cat) => {
                    const items = groupedRoles[cat];
                    if (items.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-text-subtle)] px-1">
                          {cat}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {items.map((r) => (
                            <button
                              key={r.name}
                              type="button"
                              onClick={() => handleAssignRole(r.name)}
                              className={`px-2 py-1 text-left text-xs rounded transition-colors cursor-pointer flex items-center justify-between ${
                                currentRole === r.name
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'hover:bg-[var(--md-surface-raised)] text-[var(--md-text)]'
                              }`}
                              title={r.decisionRule}
                            >
                              <span className="font-mono">{r.name}</span>
                              {currentRole === r.name && <Check size={11} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Decision rule helper text */}
            {roleDef && (
              <p className="text-[10px] text-[var(--md-text-subtle)] italic leading-tight pt-0.5 px-0.5">
                {roleDef.decisionRule}
              </p>
            )}
          </div>

          {/* 2. LABEL */}
          <div className="space-y-1 pt-1 border-t border-[var(--md-border)]">
            <label className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
              <span>Label / Text</span>
              <span className="text-[10px] text-[var(--md-text-subtle)]">
                {firstMeta?.props?.label ? 'binding literal' : 'auto placeholder'}
              </span>
            </label>
            <Input
              type="text"
              value={firstMeta?.props?.label || ''}
              onChange={(e) => handleUpdateProp('label', e.target.value || undefined)}
              placeholder="e.g. Follow, Alex, Profile..."
              className="h-7 text-xs"
            />
          </div>

          {/* 3. HIERARCHY / PARENT PICKER */}
          <div className="space-y-1 pt-1 border-t border-[var(--md-border)]">
            <label className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
              <span>Parent Container</span>
              {firstMeta?.parentId ? (
                <span className="text-[10px] text-blue-500 font-medium">explicit override</span>
              ) : (
                <span className="text-[10px] text-[var(--md-text-subtle)]">auto (frame/group)</span>
              )}
            </label>
            <select
              value={firstMeta?.parentId || ''}
              onChange={(e) => handleSetParentId(e.target.value || null)}
              className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
            >
              <option value="">— auto (implied membership) —</option>
              {candidateParents.map((p) => {
                const meta = getShapeMeta(p);
                const tag = meta?.role ? `[${meta.role}]` : `(${p.type})`;
                const name = (p.props as any)?.name || (p.props as any)?.text || meta?.props?.label || p.id;
                return (
                  <option key={p.id} value={p.id}>
                    {tag} {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 4. BEHAVIOR FLAGS (§4 allow-list) */}
          {roleDef && roleDef.flags.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-[var(--md-border)]">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)]">
                Behaviors
              </label>
              <div className="flex flex-wrap gap-1">
                {roleDef.flags.map((flag) => {
                  const isActive = activeFlags.includes(flag);
                  return (
                    <button
                      key={flag}
                      type="button"
                      onClick={() => handleToggleFlag(flag)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-700 font-bold'
                          : 'bg-[var(--md-surface)] text-[var(--md-text-muted)] border-[var(--md-border)] hover:bg-[var(--md-surface-raised)]'
                      }`}
                    >
                      {flag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. RESPONSIVE PROPS (Visible only if root is responsive) */}
          <div className="pt-1 border-t border-[var(--md-border)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] flex items-center gap-1">
                <Smartphone size={11} className="text-purple-500" />
                <span>Responsive</span>
              </span>
              {!hasResponsiveRoot && (
                <span className="text-[9px] text-[var(--md-text-subtle)] italic">
                  Root page not responsive
                </span>
              )}
            </div>

            {hasResponsiveRoot ? (
              <div className="pl-2 border-l-2 border-purple-500/40 space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--md-text)]">Mobile visibility</label>
                  <select
                    value={firstMeta?.responsive?.smVisible || 'visible'}
                    onChange={(e) => handleUpdateResponsive({ smVisible: e.target.value as any })}
                    className="h-6 rounded border border-[var(--md-border)] bg-[var(--md-surface)] px-1.5 text-[11px]"
                  >
                    <option value="visible">Visible</option>
                    <option value="hidden">Hide on mobile</option>
                    <option value="collapse:drawer">Collapse to Drawer</option>
                    <option value="collapse:hamburger">Collapse to Menu</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--md-text)]">Mobile order</label>
                  <Input
                    type="number"
                    value={firstMeta?.responsive?.order === 'auto' ? '' : (firstMeta?.responsive?.order ?? '')}
                    onChange={(e) =>
                      handleUpdateResponsive({
                        order: e.target.value === '' ? 'auto' : parseInt(e.target.value, 10)
                      })
                    }
                    placeholder="auto"
                    className="h-6 w-20 text-[11px]"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-[var(--md-text-subtle)]">
                Enable Responsive flag on the root page frame to activate per-shape responsive tokens.
              </p>
            )}
          </div>

          {/* 6. PROPS & STYLE NOTE */}
          <div className="pt-1 border-t border-[var(--md-border)] space-y-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] flex items-center gap-1">
                <StickyNote size={11} />
                <span>Style Note (Non-binding)</span>
              </label>
              <textarea
                value={firstMeta?.props?.note || ''}
                onChange={(e) => handleUpdateProp('note', e.target.value || undefined)}
                placeholder="e.g. skeleton state on mount, dark card border..."
                className="w-full h-12 p-1.5 text-xs rounded border border-[var(--md-border)] bg-[var(--md-surface)] resize-none"
              />
            </div>
          </div>

          {/* 7. UNIT ACTIONS (Multi-select) */}
          {count > 1 && onSaveAsUnit && (
            <div className="pt-2 border-t border-[var(--md-border)]">
              <button
                type="button"
                onClick={() => onSaveAsUnit(selectedShapes.map((s) => s.id))}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-semibold rounded border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer shadow-xs"
              >
                <Box size={12} />
                <span>Save {count} shapes as Unit...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
