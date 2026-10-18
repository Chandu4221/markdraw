import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
  useEditor,
  TLShape,
  useRelevantStyles,
  DefaultStylePanelContent,
  TLUiStylePanelProps,
  usePassThroughWheelEvents
} from '@tldraw/tldraw';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Tag,
  Sparkles,
  Smartphone,
  StickyNote,
  Box,
  Check,
  Trash2,
  Copy,
  Palette,
  Sliders,
  RotateCcw
} from 'lucide-react';
import {
  ROLE_DEFINITIONS,
  RoleName,
  RoleCategory,
  searchRoles
} from '../annotation/roles';
import { getShapeMeta, updateShapeMeta, suggestRoleForShape } from '../annotation/shapeMeta';
import { MarkDrawCompiler } from '../core/compiler';
import {
  UnitDefinition,
  getStoredUnits,
  saveStoredUnit,
  deleteStoredUnit,
  createUnitDefinition,
  stampUnit
} from '../annotation/units';
import { RoleResponsive } from '../annotation/types';
import { useCompilationOptions } from '../core/CompilationOptionsContext';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export const UnifiedInspectorPanel = memo(function UnifiedInspectorPanel({
  isMobile
}: TLUiStylePanelProps) {
  const editor = useEditor();
  const styles = useRelevantStyles();
  const panelRef = useRef<HTMLDivElement>(null);
  usePassThroughWheelEvents(panelRef as any);

  const compilationCtx = useCompilationOptions();
  const options = compilationCtx?.options;
  const setOptions = compilationCtx?.setOptions;

  const [selectedShapes, setSelectedShapes] = useState<TLShape[]>([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [storedUnits, setStoredUnits] = useState<UnitDefinition[]>([]);
  const [showSaveUnitDialog, setShowSaveUnitDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitBaseRole, setNewUnitBaseRole] = useState<RoleName>('card');
  const [stampOffsetCount, setStampOffsetCount] = useState(0);
  const [copiedFrameId, setCopiedFrameId] = useState<string | null>(null);

  // Collapsible section states with localStorage persistence
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('markdraw_inspector_sections');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      semantics: true,
      styles: true,
      settings: false,
      units: true
    };
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('markdraw_inspector_sections', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const refreshUnits = () => {
    setStoredUnits(getStoredUnits());
  };

  useEffect(() => {
    refreshUnits();
  }, []);

  const handlePointerOut = useCallback(() => {
    if (!isMobile && editor) {
      editor.updateInstanceState({ isChangingStyle: false });
    }
  }, [editor, isMobile]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && panelRef.current?.contains(document.activeElement)) {
        event.stopPropagation();
        editor.getContainer().focus();
      }
    }

    const el = panelRef.current;
    el?.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      el?.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [editor]);

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
  const firstShape = selectedShapes[0];
  const firstMeta = firstShape ? getShapeMeta(firstShape) : null;
  const currentRole = firstMeta?.role;
  const currentUnitId = firstMeta?.unitId;

  // Potential parent shapes on the canvas (excluding selected shapes)
  const potentialParents = useMemo(() => {
    if (!editor) return [];
    const all = editor.getCurrentPageShapes();
    const selectedIds = new Set(selectedShapes.map((s) => s.id));
    return all.filter((s) => !selectedIds.has(s.id));
  }, [editor, selectedShapes]);

  // Suggested role for selected shape
  const suggestedRole = useMemo(() => {
    if (count === 1 && firstShape) {
      return suggestRoleForShape(firstShape, editor);
    }
    return null;
  }, [count, firstShape, editor]);

  // Grouped search results for roles
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
    if (!editor || selectedShapes.length === 0) return;
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, { role });
    setIsRoleDropdownOpen(false);
    setRoleSearch('');
  };

  const handleUpdateProp = (key: string, value: any) => {
    if (!editor || selectedShapes.length === 0) return;
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, {
      props: { [key]: value }
    });
  };

  const handleToggleBehavior = (behavior: string) => {
    if (!editor || selectedShapes.length === 0) return;
    const currentFlags: string[] = (firstMeta?.props as any)?.behaviors || [];
    const nextFlags = currentFlags.includes(behavior)
      ? currentFlags.filter((f) => f !== behavior)
      : [...currentFlags, behavior];

    handleUpdateProp('behaviors', nextFlags.length > 0 ? nextFlags : undefined);
  };

  const handleSetParent = (parentId: string | null) => {
    if (!editor || selectedShapes.length === 0) return;
    const shapeIds = selectedShapes.map((s) => s.id);
    updateShapeMeta(editor, shapeIds, { parentId });
  };

  const handleUpdateResponsive = (patch: Partial<RoleResponsive> | null) => {
    if (!editor || count === 0) return;
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

  const handleDeleteUnit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStoredUnit(id);
    refreshUnits();
  };

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
    const frame = editor.getShape(frameId as any);
    const frameName = (frame?.props as any)?.name || 'Page';
    const res = MarkDrawCompiler.compile(all, editor, {
      ...(options || {}),
      scope: { shapeIds: scopeIds, scopeName: frameName }
    });
    navigator.clipboard.writeText(res.markdownSpec);
    setCopiedFrameId(frameId);
    setTimeout(() => setCopiedFrameId(null), 2000);
  };

  // Compiler settings helpers
  const handleUpdateOption = <K extends keyof Required<import('../core/types').CompilationOptions>>(
    key: K,
    value: Required<import('../core/types').CompilationOptions>[K]
  ) => {
    if (!setOptions) return;
    setOptions((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetOptions = () => {
    if (!setOptions) return;
    setOptions((prev) => ({
      ...prev,
      containmentThreshold: 0.85,
      rowClusterThreshold: 16,
      gridBandThreshold: 32,
      sizeBucketTolerance: 2,
      alignTolerance: 3,
      includeTimestamp: false,
      includeLegend: false,
      pageNote: '',
      platform: 'web',
      platformId: 'web'
    }));
  };

  const roleDef = currentRole ? ROLE_DEFINITIONS[currentRole as RoleName] : null;
  const activeFlags: string[] = (firstMeta?.props as any)?.behaviors || [];

  return (
    <div
      ref={panelRef}
      role="complementary"
      aria-label="Inspector and Document Settings"
      className="tlui-style-panel tlui-style-panel__wrapper markdraw-unified-inspector !w-[264px] max-h-[calc(100vh-100px)] overflow-y-auto font-sans select-none bg-[var(--md-surface)] border border-[var(--md-border)] rounded-[var(--md-radius-md)] shadow-[var(--md-shadow-lg)] text-xs text-[var(--md-text)]"
      data-ismobile={isMobile}
      onPointerLeave={handlePointerOut}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Global Inspector Header */}
      <div className="h-9 px-3 border-b border-[var(--md-border)] flex items-center justify-between bg-[var(--md-surface)] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-[var(--md-text-bold)] truncate">
            {count === 0
              ? 'Inspector & Document'
              : count === 1
              ? currentRole
                ? `${currentRole} (${firstShape.type})`
                : `Untagged (${firstShape.type})`
              : `${count} shapes selected`}
          </span>
          {count > 0 && currentUnitId && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-purple-600 text-white rounded">
              UNIT
            </span>
          )}
        </div>
        <button
          type="button"
          className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--md-surface)] transition-colors cursor-pointer"
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
          aria-label={isCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="divide-y divide-[var(--md-border)]">
          {/* ========================================================= */}
          {/* SECTION 1: SEMANTIC ROLE (Displayed when shapes selected) */}
          {/* ========================================================= */}
          {count > 0 && (
            <div>
              <h3>
                <button
                  type="button"
                  id="accordion-header-semantics"
                  onClick={() => toggleSection('semantics')}
                  className="w-full h-8 px-3 flex items-center justify-between text-left hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-inset transition-colors cursor-pointer select-none group"
                  aria-expanded={openSections.semantics}
                  aria-controls="accordion-panel-semantics"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag size={13} className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] shrink-0 transition-colors" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                      Semantic Role
                    </span>
                    {currentRole && (
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-[var(--md-surface-raised)] border border-[var(--md-border)] text-[var(--md-text-bold)] rounded">
                        {currentRole}
                      </span>
                    )}
                  </div>
                  <div className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                    {openSections.semantics ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </div>
                </button>
              </h3>

              {openSections.semantics && (
                <div
                  id="accordion-panel-semantics"
                  role="region"
                  aria-labelledby="accordion-header-semantics"
                  className="p-3 pt-2 space-y-3 bg-[var(--md-surface)]"
                >
                  {/* Current Role & Search Dropdown */}
                  <div className="space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="inspector-role-button"
                        id="label-inspector-role"
                        className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] cursor-pointer"
                      >
                        Role
                      </label>
                      {currentRole && (
                        <button
                          type="button"
                          onClick={() => handleAssignRole(null)}
                          className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded px-1 cursor-pointer"
                          aria-label="Clear assigned semantic role"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      id="inspector-role-button"
                      aria-labelledby="label-inspector-role"
                      aria-haspopup="listbox"
                      aria-expanded={isRoleDropdownOpen}
                      onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                      className="w-full h-8 px-2.5 flex items-center justify-between rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] hover:border-[var(--md-border-strong)] text-left text-xs text-[var(--md-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--md-surface)] transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {currentRole ? (
                          <span className="font-semibold text-[var(--md-text-bold)]">
                            {currentRole}{' '}
                            <span className="font-normal text-[var(--md-text-muted)]">
                              ({roleDef?.category})
                            </span>
                          </span>
                        ) : (
                          <span className="text-[var(--md-text-muted)] italic">
                            Assign a semantic role...
                          </span>
                        )}
                      </span>
                      <ChevronDown size={13} className="text-[var(--md-text-muted)] shrink-0 ml-1" />
                    </button>

                    {/* Role Picker Dropdown Menu */}
                    {isRoleDropdownOpen && (
                      <div
                        role="listbox"
                        aria-label="Select semantic role"
                        className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-[var(--md-shadow-lg)] p-1.5 space-y-1 max-h-64 overflow-y-auto"
                      >
                        <Input
                          type="text"
                          aria-label="Search 31 roles or aliases"
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
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-text-muted)] px-2 pt-1.5">
                                {cat}
                              </div>
                              {roles.map((r) => (
                                <button
                                  key={r.name}
                                  type="button"
                                  role="option"
                                  aria-selected={currentRole === r.name}
                                  onClick={() => handleAssignRole(r.name)}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 text-left rounded-[var(--md-radius-sm)] text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] ${
                                    currentRole === r.name
                                      ? 'bg-[var(--md-accent)] text-white font-semibold'
                                      : 'hover:bg-[var(--md-surface-raised)] text-[var(--md-text)]'
                                  }`}
                                >
                                  <span>{r.name}</span>
                                  {r.aliases.length > 0 && (
                                    <span
                                      className={`text-[10px] truncate max-w-[100px] ${
                                        currentRole === r.name
                                          ? 'text-white/80'
                                          : 'text-[var(--md-text-muted)]'
                                      }`}
                                    >
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

                  {/* Suggestions (A.4) */}
                  {!currentRole && suggestedRole && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-[var(--md-text-muted)] flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500 shrink-0" />
                        <span>Suggested Role</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssignRole(suggestedRole)}
                        aria-label={`Assign suggested role ${suggestedRole}`}
                        className="px-2.5 py-1 text-xs font-semibold rounded-[var(--md-radius-sm)] border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
                      >
                        +{suggestedRole}
                      </button>
                    </div>
                  )}

                  {/* Accessible Label / AccName Input */}
                  <div className="space-y-1">
                    <label
                      htmlFor="inspector-accname-input"
                      className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] cursor-pointer"
                    >
                      Label / AccName
                    </label>
                    <Input
                      id="inspector-accname-input"
                      type="text"
                      aria-label="Accessible label or component name"
                      value={firstMeta?.props?.label || ''}
                      onChange={(e) => handleUpdateProp('label', e.target.value || undefined)}
                      placeholder='e.g. "Submit Form", "Main Navigation"...'
                      className="h-8 text-xs font-sans"
                    />
                  </div>

                  {/* Parent Container Selector */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="inspector-parent-select"
                        className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] cursor-pointer"
                      >
                        Parent Container
                      </label>
                      {firstMeta?.parentId && (
                        <button
                          type="button"
                          onClick={() => handleSetParent(null)}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded px-1 cursor-pointer"
                          aria-label="Reset parent container to automatic geometry inference"
                        >
                          Auto (Geometry)
                        </button>
                      )}
                    </div>
                    <select
                      id="inspector-parent-select"
                      aria-label="Parent Container"
                      value={firstMeta?.parentId || ''}
                      onChange={(e) => handleSetParent(e.target.value || null)}
                      className="markdraw-select w-full h-8 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2.5 text-xs text-[var(--md-text)] hover:border-[var(--md-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--md-surface)] transition-colors cursor-pointer"
                    >
                      <option value="">Auto (Infer from AABB bounds)</option>
                      {potentialParents.map((p) => {
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
                              onClick={() => handleToggleBehavior(flag)}
                              aria-pressed={isActive}
                              className={`px-2 py-1 text-[11px] font-medium rounded-[var(--md-radius-sm)] transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] ${
                                isActive
                                  ? 'bg-[var(--md-accent)] text-white border-[var(--md-accent)]'
                                  : 'bg-[var(--md-surface-raised)] text-[var(--md-text-muted)] border-[var(--md-border)] hover:text-[var(--md-text-bold)] hover:border-[var(--md-border-strong)]'
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
                  <div className="space-y-1.5 pt-1 border-t border-[var(--md-border)]">
                    <label
                      htmlFor="inspector-responsive-select"
                      className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] flex items-center gap-1 cursor-pointer"
                    >
                      <Smartphone size={12} className="text-[var(--md-text-muted)]" />
                      <span>Responsive</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--md-text-muted)]">Mobile:</span>
                      <select
                        id="inspector-responsive-select"
                        aria-label="Mobile Responsive Visibility"
                        value={firstMeta?.responsive?.smVisible || 'visible'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          handleUpdateResponsive(val === 'visible' ? null : { smVisible: val });
                        }}
                        className="markdraw-select flex-1 h-8 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2.5 text-xs text-[var(--md-text)] hover:border-[var(--md-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
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
                  <div className="space-y-1 pt-1 border-t border-[var(--md-border)]">
                    <label
                      htmlFor="inspector-style-note-input"
                      className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] flex items-center gap-1 cursor-pointer"
                    >
                      <StickyNote size={12} className="text-[var(--md-text-muted)]" />
                      <span>Style Note (Non-binding)</span>
                    </label>
                    <textarea
                      id="inspector-style-note-input"
                      aria-label="Style Note (Non-binding)"
                      value={firstMeta?.props?.note || ''}
                      onChange={(e) => handleUpdateProp('note', e.target.value || undefined)}
                      placeholder="e.g. skeleton state on mount, dark card border..."
                      className="w-full h-14 p-2 text-xs rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] hover:border-[var(--md-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] resize-none transition-colors"
                    />
                  </div>

                  {/* Unit Save Gesture (Multi-select) */}
                  {count > 1 && (
                    <div className="pt-2 border-t border-[var(--md-border)]">
                      <button
                        type="button"
                        onClick={() => setShowSaveUnitDialog(true)}
                        aria-label={`Save ${count} selected shapes as a reusable custom unit`}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-[var(--md-radius-sm)] border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors cursor-pointer shadow-xs"
                      >
                        <Box size={14} className="shrink-0" />
                        <span>Save {count} shapes as Unit...</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 2: VISUAL STYLES (tldraw native styling tools)     */}
          {/* ========================================================= */}
          <div>
            <h3>
              <button
                type="button"
                id="accordion-header-styles"
                onClick={() => toggleSection('styles')}
                className="w-full h-8 px-3 flex items-center justify-between text-left hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-inset transition-colors cursor-pointer select-none group"
                aria-expanded={openSections.styles}
                aria-controls="accordion-panel-styles"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Palette size={13} className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] shrink-0 transition-colors" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                    Visual Styles
                  </span>
                </div>
                <div className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                  {openSections.styles ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </div>
              </button>
            </h3>

            {openSections.styles && (
              <div
                id="accordion-panel-styles"
                role="region"
                aria-labelledby="accordion-header-styles"
                className="p-2 space-y-2 bg-[var(--md-surface)]"
              >
                {styles ? (
                  <DefaultStylePanelContent styles={styles} />
                ) : (
                  <div className="p-3 text-center text-xs text-[var(--md-text-muted)] italic">
                    Select a shape on canvas to inspect and edit visual styles.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: COMPILER & DOCUMENT SETTINGS (Direct in Panel) */}
          {/* ========================================================= */}
          <div>
            <h3>
              <button
                type="button"
                id="accordion-header-settings"
                onClick={() => toggleSection('settings')}
                className="w-full h-8 px-3 flex items-center justify-between text-left hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-inset transition-colors cursor-pointer select-none group"
                aria-expanded={openSections.settings}
                aria-controls="accordion-panel-settings"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sliders size={13} className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] shrink-0 transition-colors" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                    Compiler & Settings
                  </span>
                  {options && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-[var(--md-text-muted)] bg-[var(--md-surface-raised)] border border-[var(--md-border)] rounded">
                      {options.platform || 'web'}
                    </span>
                  )}
                </div>
                <div className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                  {openSections.settings ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </div>
              </button>
            </h3>

            {openSections.settings && options && (
              <div
                id="accordion-panel-settings"
                role="region"
                aria-labelledby="accordion-header-settings"
                className="p-3 pt-2 space-y-3 bg-[var(--md-surface)]"
              >
                {/* Target Platform Profile Selector */}
                <div className="space-y-1">
                  <label
                    htmlFor="inspector-platform-select"
                    className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] cursor-pointer"
                  >
                    Target Platform Profile
                  </label>
                  <select
                    id="inspector-platform-select"
                    aria-label="Target Platform Profile"
                    value={options.platform || 'web'}
                    onChange={(e) => {
                      const plat = e.target.value as any;
                      handleUpdateOption('platform', plat);
                      handleUpdateOption('platformId', plat);
                    }}
                    className="markdraw-select w-full h-8 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2.5 text-xs text-[var(--md-text)] hover:border-[var(--md-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--md-surface)] transition-colors cursor-pointer"
                  >
                    <option value="web">Web (Standard HTML / Tailwind)</option>
                    <option value="android-material">Android (Compose / Material 3)</option>
                  </select>
                </div>

                {/* Containment Threshold Slider matching tldraw slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label
                      htmlFor="inspector-containment-slider"
                      className="font-semibold uppercase tracking-wider text-[11px] text-[var(--md-text-muted)] cursor-pointer"
                    >
                      Containment Overlap
                    </label>
                    <span
                      id="containment-value-display"
                      className="font-mono text-xs font-semibold text-[var(--md-text-bold)]"
                    >
                      {Math.round((options.containmentThreshold ?? 0.85) * 100)}%
                    </span>
                  </div>

                  <div className="py-1">
                    <input
                      id="inspector-containment-slider"
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      aria-label="Containment Overlap"
                      aria-valuemin={50}
                      aria-valuemax={100}
                      aria-valuenow={Math.round((options.containmentThreshold ?? 0.85) * 100)}
                      aria-valuetext={`${Math.round((options.containmentThreshold ?? 0.85) * 100)}%`}
                      aria-describedby="containment-helptext"
                      value={options.containmentThreshold ?? 0.85}
                      onChange={(e) =>
                        handleUpdateOption('containmentThreshold', parseFloat(e.target.value))
                      }
                      className="markdraw-slider"
                    />
                  </div>

                  <div id="containment-helptext" className="text-[11px] text-[var(--md-text-muted)] leading-normal">
                    Minimum AABB overlap required to infer parent-child hierarchy.
                  </div>
                </div>

                {/* Snapping Tolerances Grid */}
                <div className="space-y-1 pt-1.5 border-t border-[var(--md-border)]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] block">
                    Tolerances (A.5)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="tolerance-width-bucket"
                        className="text-[11px] text-[var(--md-text-muted)] block cursor-pointer"
                      >
                        Width Bucket (±%)
                      </label>
                      <Input
                        id="tolerance-width-bucket"
                        type="number"
                        min="0"
                        max="10"
                        aria-label="Width Bucket tolerance percentage"
                        value={options.sizeBucketTolerance ?? 2}
                        onChange={(e) =>
                          handleUpdateOption(
                            'sizeBucketTolerance',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="tolerance-alignment"
                        className="text-[11px] text-[var(--md-text-muted)] block cursor-pointer"
                      >
                        Alignment (±%)
                      </label>
                      <Input
                        id="tolerance-alignment"
                        type="number"
                        min="0"
                        max="10"
                        aria-label="Alignment tolerance percentage"
                        value={options.alignTolerance ?? 3}
                        onChange={(e) =>
                          handleUpdateOption('alignTolerance', parseInt(e.target.value, 10) || 0)
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Output Toggles */}
                <div className="space-y-2 pt-1.5 border-t border-[var(--md-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="inspector-legend-switch"
                        id="label-legend-switch"
                        className="text-xs font-medium text-[var(--md-text)] block cursor-pointer select-none"
                      >
                        Include Semantic Legend
                      </label>
                      <span className="text-[11px] text-[var(--md-text-muted)] block">
                        Append bracket-tag spec reference
                      </span>
                    </div>
                    <Switch
                      id="inspector-legend-switch"
                      aria-labelledby="label-legend-switch"
                      aria-label="Include Semantic Legend"
                      checked={options.includeLegend ?? false}
                      onCheckedChange={(checked) => handleUpdateOption('includeLegend', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="inspector-timestamp-switch"
                        id="label-timestamp-switch"
                        className="text-xs font-medium text-[var(--md-text)] block cursor-pointer select-none"
                      >
                        Include Timestamp
                      </label>
                      <span className="text-[11px] text-[var(--md-text-muted)] block">
                        Append compile date (non-deterministic)
                      </span>
                    </div>
                    <Switch
                      id="inspector-timestamp-switch"
                      aria-labelledby="label-timestamp-switch"
                      aria-label="Include Timestamp"
                      checked={options.includeTimestamp ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdateOption('includeTimestamp', checked)
                      }
                    />
                  </div>
                </div>

                {/* Document Header Note */}
                <div className="space-y-1 pt-1.5 border-t border-[var(--md-border)]">
                  <label
                    htmlFor="inspector-page-note"
                    className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)] cursor-pointer"
                  >
                    Document Header Note
                  </label>
                  <Input
                    id="inspector-page-note"
                    type="text"
                    aria-label="Document Header Note"
                    value={options.pageNote || ''}
                    onChange={(e) => handleUpdateOption('pageNote', e.target.value || '')}
                    placeholder="e.g. Design review v1, Mobile auth flow..."
                    className="h-8 text-xs font-sans"
                  />
                </div>

                {/* Reset to Defaults */}
                <div className="pt-2 border-t border-[var(--md-border)] flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetOptions}
                    aria-label="Reset compiler settings to default values"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] rounded-[var(--md-radius-sm)] transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} className="shrink-0" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: CANVAS & UNITS                                  */}
          {/* ========================================================= */}
          <div>
            <h3>
              <button
                type="button"
                id="accordion-header-units"
                onClick={() => toggleSection('units')}
                className="w-full h-8 px-3 flex items-center justify-between text-left hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-inset transition-colors cursor-pointer select-none group"
                aria-expanded={openSections.units}
                aria-controls="accordion-panel-units"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Box size={13} className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] shrink-0 transition-colors" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                    Canvas & Units
                  </span>
                  {storedUnits.length > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-[var(--md-text-muted)] bg-[var(--md-surface-raised)] border border-[var(--md-border)] rounded">
                      {storedUnits.length}
                    </span>
                  )}
                </div>
                <div className="text-[var(--md-text-muted)] group-hover:text-[var(--md-text-bold)] transition-colors">
                  {openSections.units ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </div>
              </button>
            </h3>

            {openSections.units && (
              <div
                id="accordion-panel-units"
                role="region"
                aria-labelledby="accordion-header-units"
                className="p-3 pt-2 space-y-3 bg-[var(--md-surface)]"
              >
                {/* Stats */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--md-text-muted)]">Tagged Elements:</span>
                    <span className="font-mono font-semibold text-[var(--md-text-bold)]">
                      {editor.getCurrentPageShapes().filter((s) => Boolean(getShapeMeta(s)?.role)).length}{' '}
                      / {editor.getCurrentPageShapes().length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--md-text-muted)]">Root Frames:</span>
                    <span className="font-mono font-semibold text-[var(--md-text-bold)]">
                      {editor.getCurrentPageShapes().filter((s) => s.type === 'frame').length}
                    </span>
                  </div>
                </div>

                {/* Root frames list */}
                {editor.getCurrentPageShapes().filter((s) => s.type === 'frame').length > 0 && (
                  <div className="space-y-1 pt-1.5 border-t border-[var(--md-border)]">
                    <span className="text-[11px] uppercase font-semibold text-[var(--md-text-muted)] tracking-wider block">
                      Root Frames
                    </span>
                    <div className="space-y-1">
                      {editor.getCurrentPageShapes().filter((s) => s.type === 'frame').map((f) => {
                        const meta = getShapeMeta(f);
                        const name = (f.props as any)?.name || meta?.props?.label || 'Page';
                        return (
                          <div
                            key={f.id}
                            onClick={() => editor.setSelectedShapes([f.id])}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--md-radius-sm)] bg-[var(--md-surface-raised)] hover:bg-[var(--md-border)]/40 cursor-pointer text-xs group transition-colors"
                          >
                            <span className="font-medium text-[var(--md-text)] truncate">{name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-[var(--md-text-muted)] font-mono">
                                {meta?.role || 'page'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyFrameContract(f.id);
                                }}
                                aria-label={`Copy contract for frame ${name}`}
                                className="p-1 rounded text-[var(--md-text-muted)] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-[var(--md-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
                                title={`Copy contract for ${name}`}
                              >
                                {copiedFrameId === f.id ? (
                                  <Check size={12} className="text-green-600 dark:text-green-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stored Custom Units Library (§10) */}
                <div className="space-y-1.5 pt-1.5 border-t border-[var(--md-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-semibold text-[var(--md-text-muted)] tracking-wider flex items-center gap-1">
                      <Box size={12} className="text-[var(--md-text-muted)]" />
                      <span>Custom Units</span>
                    </span>
                    <span className="text-[10px] font-mono font-medium text-[var(--md-text-muted)]">
                      {storedUnits.length}
                    </span>
                  </div>

                  {storedUnits.length === 0 ? (
                    <div className="text-[11px] text-[var(--md-text-muted)] italic py-1 leading-normal">
                      Multi-select shapes on canvas to save them as reusable units.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {storedUnits.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface-raised)] hover:bg-[var(--md-surface-hover)] transition-colors text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-[var(--md-text-bold)] truncate">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-[var(--md-text-muted)] font-mono">
                              Base: {u.baseRole} • {u.memberRoles?.length || 0} items
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStampUnit(u)}
                              aria-label={`Stamp copy of ${u.name} unit onto canvas`}
                              className="px-2.5 py-1 text-xs font-semibold rounded-[var(--md-radius-sm)] bg-purple-600 text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-colors cursor-pointer"
                              title="Stamp copy onto canvas"
                            >
                              Stamp
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteUnit(u.id, e)}
                              aria-label={`Delete unit ${u.name}`}
                              className="p-1 rounded text-[var(--md-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-[var(--md-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors cursor-pointer"
                              title={`Delete unit ${u.name}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Unit Dialog Modal */}
      {showSaveUnitDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-unit-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            className="w-80 rounded-xl border border-[var(--md-border)] bg-[var(--md-surface)] p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--md-border)] pb-2">
              <div id="dialog-unit-title" className="flex items-center gap-1.5 font-bold text-xs text-[var(--md-text-bold)]">
                <Box size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Save as Custom Unit</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveUnitDialog(false)}
                aria-label="Close dialog"
                className="p-1 rounded text-xs text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="dialog-new-unit-name"
                className="text-[11px] font-semibold text-[var(--md-text-muted)] cursor-pointer"
              >
                Unit Name
              </label>
              <Input
                id="dialog-new-unit-name"
                type="text"
                aria-label="Unit Name"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="e.g. follow-card, metric-tile"
                className="h-8 text-xs font-sans"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="dialog-new-unit-role"
                className="text-[11px] font-semibold text-[var(--md-text-muted)] cursor-pointer"
              >
                Base Role (§10 fallback)
              </label>
              <select
                id="dialog-new-unit-role"
                aria-label="Base Role fallback"
                value={newUnitBaseRole}
                onChange={(e) => setNewUnitBaseRole(e.target.value as RoleName)}
                className="markdraw-select w-full h-8 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2.5 text-xs text-[var(--md-text)] hover:border-[var(--md-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] cursor-pointer"
              >
                {Object.values(ROLE_DEFINITIONS).map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-[var(--md-text-muted)] bg-[var(--md-surface-raised)] p-2 rounded-[var(--md-radius-sm)] leading-normal">
              Members: {count} shapes ({selectedShapes.map((s) => getShapeMeta(s)?.role || s.type).join(', ')})
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-[var(--md-border)]">
              <button
                type="button"
                onClick={() => setShowSaveUnitDialog(false)}
                aria-label="Cancel unit creation"
                className="px-3 py-1.5 text-xs rounded-[var(--md-radius-sm)] border border-[var(--md-border)] hover:bg-[var(--md-surface-hover)] hover:border-[var(--md-border-strong)] hover:text-[var(--md-text-bold)] text-[var(--md-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newUnitName.trim()}
                onClick={handleSaveUnit}
                aria-label="Save Unit"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-[var(--md-radius-sm)] bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 cursor-pointer transition-colors shadow-xs"
              >
                Save Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
