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
  Check,
  Trash2,
  Copy,
  PanelLeft,
  PanelRight
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
import { MarkDrawCompiler } from '../core/compiler';
import {
  UnitDefinition,
  getStoredUnits,
  saveStoredUnit,
  deleteStoredUnit,
  createUnitDefinition,
  stampUnit
} from '../annotation/units';
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
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false);
  const [panelSide, setPanelSide] = useState<'left' | 'right'>(() => {
    try {
      const saved = localStorage.getItem('markdraw_role_panel_side');
      return saved === 'right' ? 'right' : 'left';
    } catch {
      return 'left';
    }
  });

  const togglePanelSide = () => {
    setPanelSide((prev) => {
      const next = prev === 'left' ? 'right' : 'left';
      try {
        localStorage.setItem('markdraw_role_panel_side', next);
      } catch {}
      return next;
    });
  };

  const positionClass = panelSide === 'left' ? 'top-14 left-3' : 'top-3 right-[168px]';

  const [storedUnits, setStoredUnits] = useState<UnitDefinition[]>([]);
  const [showSaveUnitDialog, setShowSaveUnitDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitBaseRole, setNewUnitBaseRole] = useState<RoleName>('card');
  const [stampOffsetCount, setStampOffsetCount] = useState(0);

  const refreshUnits = () => {
    setStoredUnits(getStoredUnits());
  };

  useEffect(() => {
    refreshUnits();
  }, []);

  const handleSaveUnit = () => {
    if (!editor || !newUnitName.trim() || selectedShapes.length === 0) return;
    const unit = createUnitDefinition(newUnitName.trim(), newUnitBaseRole, selectedShapes);
    saveStoredUnit(unit);
    refreshUnits();

    const ids = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, ids, { unitId: unit.id });

    setShowSaveUnitDialog(false);
    setNewUnitName('');
  };

  const handleStampUnit = (unit: UnitDefinition) => {
    if (!editor) return;
    const offset = { x: stampOffsetCount * 20, y: stampOffsetCount * 20 };
    setStampOffsetCount((prev) => (prev + 1) % 10);
    const groupId = stampUnit(editor, unit, offset);
    if (groupId) {
      editor.setSelectedShapes([groupId as any]);
    }
  };

  const handleDeleteUnit = (id: string) => {
    deleteStoredUnit(id);
    refreshUnits();
  };

  const [copiedFrameId, setCopiedFrameId] = useState<string | null>(null);

  const handleCopyFrameContract = (frameId: string) => {
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
    findChildren(frameId);
    const scopeIds = [frameId, ...descendants];
    const res = MarkDrawCompiler.compile(all, editor, {
      annotationMode: true,
      scope: { shapeIds: scopeIds }
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(res.markdownSpec);
    }
    setCopiedFrameId(frameId);
    setTimeout(() => setCopiedFrameId(null), 2000);
  };

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
        className={`absolute ${positionClass} w-72 rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-[var(--md-shadow-lg)] z-30 overflow-hidden font-sans select-none text-xs transition-all duration-150`}
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
              onClick={togglePanelSide}
              title={panelSide === 'left' ? 'Dock to Right (beside styles)' : 'Dock to Left'}
              aria-label={panelSide === 'left' ? 'Dock to Right' : 'Dock to Left'}
            >
              {panelSide === 'left' ? <PanelRight size={13} /> : <PanelLeft size={13} />}
            </button>
            <button
              type="button"
              className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
              onClick={() => setIsOverviewCollapsed((prev) => !prev)}
              title={isOverviewCollapsed ? 'Expand Overview' : 'Collapse Overview'}
              aria-label={isOverviewCollapsed ? 'Expand Overview' : 'Collapse Overview'}
            >
              {isOverviewCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>
        {!isOverviewCollapsed && (
          <div className="p-3 space-y-3 text-[var(--md-text)]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--md-text-muted)]">Tagged Elements:</span>
              <span className="font-mono font-semibold">{taggedCount} / {totalCount}</span>
            </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--md-text-muted)]">Roots (Frames):</span>
            <span className="font-mono font-semibold">{frames.length}</span>
          </div>

          {/* Root frames list */}
          {frames.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-[var(--md-border)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--md-text-muted)] tracking-wider">
                Root Frames
              </span>
              <div className="space-y-0.5">
                {frames.map((f) => {
                  const meta = getShapeMeta(f);
                  const name = (f.props as any)?.name || meta?.props?.label || 'Page';
                  return (
                    <div
                      key={f.id}
                      onClick={() => editor.setSelectedShapes([f.id])}
                      className="flex items-center justify-between px-2 py-1 rounded bg-[var(--md-surface-raised)] hover:bg-[var(--md-surface-hover)] cursor-pointer text-[11px] group"
                    >
                      <span className="font-medium truncate">{name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-[var(--md-text-subtle)] font-mono">
                          {meta?.role || 'page'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyFrameContract(f.id);
                          }}
                          className="p-1 rounded hover:bg-[var(--md-surface)] text-[var(--md-text-muted)] hover:text-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors cursor-pointer"
                          title="Copy contract for this frame"
                        >
                          {copiedFrameId === f.id ? (
                            <Check size={11} className="text-green-500" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* My units list */}
          <div className="space-y-1.5 pt-1.5 border-t border-[var(--md-border)]">
            <span className="text-[10px] uppercase font-semibold text-[var(--md-text-muted)] tracking-wider flex items-center justify-between">
              <span>My Units ({storedUnits.length})</span>
            </span>
            {storedUnits.length === 0 ? (
              <p className="text-[10px] text-[var(--md-text-subtle)] italic">
                No custom units saved yet. Multi-select shapes to create one.
              </p>
            ) : (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {storedUnits.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-2 py-1 rounded border border-[var(--md-border)] bg-[var(--md-surface)] text-[11px]"
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-semibold truncate">{u.name}</div>
                      <div className="text-[9px] text-[var(--md-text-subtle)] truncate">
                        {u.baseRole} • {u.memberRoles.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStampUnit(u)}
                        className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 transition-colors cursor-pointer"
                        title="Stamp copy onto canvas"
                      >
                        Stamp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUnit(u.id)}
                        className="p-1 rounded text-[var(--md-text-subtle)] hover:text-red-500 hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 transition-colors cursor-pointer"
                        title="Delete unit"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-[var(--md-text-subtle)] leading-relaxed pt-1 border-t border-[var(--md-border)]">
            Select any shape on canvas to assign its semantic role, label, and hierarchy.
          </p>
        </div>
        )}
      </div>
    );
  }

  const roleDef = currentRole ? ROLE_DEFINITIONS[currentRole as RoleName] : null;
  const activeFlags: string[] = (firstMeta?.props as any)?.behaviors || [];

  return (
    <div
      className={`absolute ${positionClass} w-72 rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-[var(--md-shadow-lg)] z-30 overflow-hidden font-sans select-none transition-all duration-150`}
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
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
            onClick={togglePanelSide}
            title={panelSide === 'left' ? 'Dock to Right (beside styles)' : 'Dock to Left'}
            aria-label={panelSide === 'left' ? 'Dock to Right' : 'Dock to Left'}
          >
            {panelSide === 'left' ? <PanelRight size={13} /> : <PanelLeft size={13} />}
          </button>
          <button
            type="button"
            className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            aria-label={isCollapsed ? 'Expand Role Panel' : 'Collapse Role Panel'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
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
                  className="text-[10px] text-red-500 hover:text-red-400 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded px-0.5 cursor-pointer"
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
                  className="w-full flex items-center justify-between gap-1 px-2 py-1 text-[11px] font-medium rounded border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer shadow-xs"
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
                className="w-full h-8 px-2.5 flex items-center justify-between rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] text-xs font-medium text-[var(--md-text)] hover:border-[var(--md-border-strong)] hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent-ring)] transition-colors cursor-pointer"
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
                              className={`px-2 py-1 text-left text-xs rounded transition-colors cursor-pointer flex items-center justify-between focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                currentRole === r.name
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] text-[var(--md-text)]'
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
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-700 font-bold hover:bg-blue-700'
                          : 'bg-[var(--md-surface)] text-[var(--md-text-muted)] border-[var(--md-border)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] hover:border-[var(--md-border-strong)]'
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
          {count > 1 && (
            <div className="pt-2 border-t border-[var(--md-border)]">
              <button
                type="button"
                onClick={() => {
                  if (onSaveAsUnit) {
                    onSaveAsUnit(selectedShapes.map((s) => s.id));
                  }
                  setShowSaveUnitDialog(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors cursor-pointer shadow-xs"
              >
                <Box size={13} />
                <span>Save {count} shapes as Unit...</span>
              </button>
            </div>
          )}

          {/* Save Unit Dialog Modal */}
          {showSaveUnitDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div
                className="w-80 rounded-xl border border-[var(--md-border)] bg-[var(--md-surface)] p-4 shadow-2xl space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--md-border)] pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--md-text)]">
                    <Box size={14} className="text-purple-500" />
                    <span>Save as Custom Unit</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSaveUnitDialog(false)}
                    className="p-1 rounded text-xs text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)] cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--md-text-muted)]">
                    Unit Name
                  </label>
                  <Input
                    type="text"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="e.g. follow-card, metric-tile"
                    className="h-7 text-xs"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--md-text-muted)]">
                    Base Role (§10 fallback)
                  </label>
                  <select
                    value={newUnitBaseRole}
                    onChange={(e) => setNewUnitBaseRole(e.target.value as RoleName)}
                    className="w-full h-7 rounded border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)]"
                  >
                    {Object.values(ROLE_DEFINITIONS).map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name} ({r.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[10px] text-[var(--md-text-subtle)] bg-[var(--md-surface-raised)] p-2 rounded">
                  Members: {count} shapes ({selectedShapes.map((s) => getShapeMeta(s)?.role || s.type).join(', ')})
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-[var(--md-border)]">
                  <button
                    type="button"
                    onClick={() => setShowSaveUnitDialog(false)}
                    className="px-2.5 py-1 text-xs rounded border border-[var(--md-border)] hover:bg-[var(--md-surface-hover)] hover:border-[var(--md-border-strong)] hover:text-[var(--md-text-bold)] text-[var(--md-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newUnitName.trim()}
                    onClick={handleSaveUnit}
                    className="px-3 py-1 text-xs font-semibold rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 cursor-pointer transition-colors"
                  >
                    Save Unit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
