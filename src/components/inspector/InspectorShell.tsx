import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  useEditor,
  TLShape,
  useRelevantStyles,
  TLUiStylePanelProps,
  usePassThroughWheelEvents
} from '../../canvas/tldraw';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getShapeMeta } from '../../annotation/shapeMeta';
import { MarkDrawCompiler } from '../../core/compiler';
import {
  UnitDefinition,
  getStoredUnits,
  saveStoredUnit,
  deleteStoredUnit,
  createUnitDefinition,
  stampUnit
} from '../../annotation/units';
import { RoleName } from '../../annotation/roles';
import { useCompilationOptions } from '../../core/CompilationOptionsContext';
import { RoleSection } from './RoleSection';
import { StyleSection } from './StyleSection';
import { CompilerSettingsSection } from './CompilerSettingsSection';
import { UnitSection } from './UnitSection';
import { CanvasOverviewSection } from './CanvasOverviewSection';

export const InspectorShell = memo(function InspectorShell({ isMobile }: TLUiStylePanelProps) {
  const editor = useEditor();
  const styles = useRelevantStyles();
  const panelRef = useRef<HTMLDivElement>(null);
  usePassThroughWheelEvents(panelRef as any);

  const compilationCtx = useCompilationOptions();
  const options = compilationCtx?.options;
  const setOptions = compilationCtx?.setOptions;

  const [selectedShapes, setSelectedShapes] = useState<TLShape[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [storedUnits, setStoredUnits] = useState<UnitDefinition[]>([]);
  const [showSaveUnitDialog, setShowSaveUnitDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitBaseRole, setNewUnitBaseRole] = useState<RoleName>('card');
  const [stampOffsetCount, setStampOffsetCount] = useState(0);
  const [copiedFrameId, setCopiedFrameId] = useState<string | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('markdraw_inspector_sections');
      if (saved) return JSON.parse(saved);
    } catch {}
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
      } catch {}
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
      setSelectedShapes(editor.getSelectedShapes());
    };
    updateSelection();
    return editor.store.listen(updateSelection);
  }, [editor]);

  const count = selectedShapes.length;
  const firstShape = selectedShapes[0];
  const firstMeta = firstShape ? getShapeMeta(firstShape) : null;
  const currentRole = firstMeta?.role;
  const currentUnitId = firstMeta?.unitId;

  const handleSaveUnit = () => {
    if (!editor || !newUnitName.trim() || selectedShapes.length === 0) return;
    const unit = createUnitDefinition(newUnitName.trim(), newUnitBaseRole, selectedShapes);
    saveStoredUnit(unit);
    refreshUnits();
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

  const handleUpdateOption = (key: any, value: any) => {
    if (!setOptions) return;
    setOptions((prev) => ({ ...prev, [key]: value }));
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

  return (
    <div
      ref={panelRef}
      role="complementary"
      aria-label="Inspector and Document Settings"
      className="tlui-style-panel tlui-style-panel__wrapper markdraw-unified-inspector !w-[300px] max-h-[calc(100vh-100px)] overflow-y-auto font-sans select-none bg-[var(--md-surface-1)] border border-[var(--md-line-subtle)] rounded-[var(--md-radius-md)] shadow-[var(--md-shadow-lg)] text-xs text-[var(--md-ink-primary)]"
      data-ismobile={isMobile}
      onPointerLeave={handlePointerOut}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Global Header */}
      <div className="h-9 px-3 border-b border-[var(--md-line-subtle)] flex items-center justify-between bg-[var(--md-surface-1)] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-[var(--md-ink-primary)] truncate">
            {count === 0
              ? 'Inspector & Canvas'
              : count === 1
              ? currentRole
                ? `${currentRole} (${firstShape.type})`
                : `Untagged (${firstShape.type})`
              : `${count} shapes selected`}
          </span>
          {count > 0 && currentUnitId && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-purple-600 text-white rounded shrink-0">
              UNIT
            </span>
          )}
        </div>
        <button
          type="button"
          className="p-1 rounded text-[var(--md-ink-muted)] hover:text-[var(--md-ink-primary)] hover:bg-[var(--md-surface-2)] transition-colors cursor-pointer shrink-0"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="divide-y divide-[var(--md-line-subtle)]">
          {count > 0 ? (
            <RoleSection
              selectedShapes={selectedShapes}
              editor={editor}
              isOpen={openSections.semantics}
              onToggle={() => toggleSection('semantics')}
              onSaveUnitGesture={() => setShowSaveUnitDialog(true)}
            />
          ) : (
            <CanvasOverviewSection
              editor={editor}
              onCopyFrameContract={handleCopyFrameContract}
              copiedFrameId={copiedFrameId}
            />
          )}

          <StyleSection
            isOpen={openSections.styles}
            onToggle={() => toggleSection('styles')}
            styles={styles}
          />

          <CompilerSettingsSection
            isOpen={openSections.settings}
            onToggle={() => toggleSection('settings')}
            options={options}
            onUpdateOption={handleUpdateOption}
            onResetOptions={handleResetOptions}
          />

          <UnitSection
            isOpen={openSections.units}
            onToggle={() => toggleSection('units')}
            units={storedUnits}
            onStampUnit={handleStampUnit}
            onDeleteUnit={handleDeleteUnit}
            showSaveDialog={showSaveUnitDialog}
            onCloseSaveDialog={() => setShowSaveUnitDialog(false)}
            onSaveUnit={handleSaveUnit}
            newUnitName={newUnitName}
            onNewUnitNameChange={setNewUnitName}
            newUnitBaseRole={newUnitBaseRole}
            onNewUnitBaseRoleChange={setNewUnitBaseRole}
          />
        </div>
      )}
    </div>
  );
});
