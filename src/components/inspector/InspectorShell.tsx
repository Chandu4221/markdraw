import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getShapeMeta } from '../../annotation/shapeMeta';
import { MarkDrawCompiler } from '../../core/compiler';
import {
  UnitDefinition,
  getStoredUnits,
  saveStoredUnit,
  deleteStoredUnit,
  createUnitDefinition,
  stampUnitWithDriver
} from '../../annotation/units';
import { RoleName } from '../../annotation/roles';
import { useCompilationOptions } from '../../core/CompilationOptionsContext';
import { CompilationOptions } from '../../core/types';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { canvasShapesToCompilerShapes } from '../../hooks/useCompilation';
import { RoleSection } from './RoleSection';
import { StyleSection } from './StyleSection';
import { CompilerSettingsSection } from './CompilerSettingsSection';
import { UnitSection } from './UnitSection';
import { CanvasOverviewSection } from './CanvasOverviewSection';

export interface InspectorShellProps {
  selectedIds?: string[];
  driver?: CanvasDriver | null;
  units?: UnitDefinition[];
  onUnitsChange?: (units: UnitDefinition[]) => void;
  options?: Required<CompilationOptions>;
  onOptionsChange?: (
    newOptsOrUpdater:
      | Required<CompilationOptions>
      | ((prev: Required<CompilationOptions>) => Required<CompilationOptions>)
  ) => void;
  isMobile?: boolean;
}

export const InspectorShell = memo(function InspectorShell({
  selectedIds,
  driver = null,
  units,
  onUnitsChange,
  options: propOptions,
  onOptionsChange: propOnOptionsChange,
  isMobile
}: InspectorShellProps = {}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const compilationCtx = useCompilationOptions();
  const effectiveOptions = propOptions || compilationCtx?.options;
  const effectiveSetOptions = propOnOptionsChange || compilationCtx?.setOptions;

  const [allShapes, setAllShapes] = useState<CanvasShape[]>([]);
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [storedUnits, setStoredUnits] = useState<UnitDefinition[]>(() => units || getStoredUnits());
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

  const refreshShapes = useCallback(async () => {
    if (!driver) {
      setAllShapes([]);
      return;
    }
    const s = await driver.listShapes();
    setAllShapes(s);
  }, [driver]);

  useEffect(() => {
    void refreshShapes();
    if (!driver) return;
    const unsub = driver.onShapesChanged(() => {
      void refreshShapes();
    });
    return unsub;
  }, [driver, refreshShapes]);

  useEffect(() => {
    if (!driver) return;
    const unsub = driver.onSelectionChanged((ids) => {
      setInternalSelectedIds(ids);
    });
    return unsub;
  }, [driver]);

  useEffect(() => {
    if (units) setStoredUnits(units);
  }, [units]);

  const activeSelectedIds = selectedIds !== undefined ? selectedIds : internalSelectedIds;

  const selectedShapes = useMemo(() => {
    if (activeSelectedIds.length === 0) return [];
    const idSet = new Set(activeSelectedIds);
    return allShapes.filter((s) => idSet.has(s.id));
  }, [allShapes, activeSelectedIds]);

  const count = activeSelectedIds.length;
  const firstShape = selectedShapes[0];
  const firstMeta = firstShape ? getShapeMeta(firstShape) : null;
  const currentRole = firstMeta?.role;
  const currentUnitId = firstMeta?.unitId;

  const handleSaveUnit = () => {
    if (!newUnitName.trim() || selectedShapes.length === 0) return;
    const unit = createUnitDefinition(newUnitName.trim(), newUnitBaseRole, selectedShapes);
    saveStoredUnit(unit);
    const updated = getStoredUnits();
    setStoredUnits(updated);
    onUnitsChange?.(updated);
    setShowSaveUnitDialog(false);
    setNewUnitName('');
  };

  const handleStampUnit = async (unit: UnitDefinition) => {
    if (!driver) return;
    const offset = { x: stampOffsetCount * 20, y: stampOffsetCount * 20 };
    setStampOffsetCount((prev) => (prev + 1) % 10);
    await stampUnitWithDriver(driver, unit, offset);
  };

  const handleDeleteUnit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStoredUnit(id);
    const updated = getStoredUnits();
    setStoredUnits(updated);
    onUnitsChange?.(updated);
  };

  const handleCopyFrameContract = async (frameId: string) => {
    if (!driver) return;
    const all = await driver.listShapes();
    const descendants: string[] = [];
    const findChildren = (pid: string) => {
      for (const s of all) {
        const meta = getShapeMeta(s);
        if (s.parentId === pid || meta?.parentId === pid) {
          descendants.push(s.id);
          findChildren(s.id);
        }
      }
    };
    findChildren(frameId);
    const scopeIds = [frameId, ...descendants];
    const frame = all.find((s) => s.id === frameId);
    const frameName = frame?.name || getShapeMeta(frame || {})?.props?.label || 'Page';
    const compilerShapes = canvasShapesToCompilerShapes(all);
    const res = MarkDrawCompiler.compile(compilerShapes, null, {
      ...(effectiveOptions || {}),
      scope: { shapeIds: scopeIds, scopeName: frameName }
    });
    await navigator.clipboard.writeText(res.markdownSpec);
    setCopiedFrameId(frameId);
    setTimeout(() => setCopiedFrameId(null), 2000);
  };

  const handleUpdateOption = (key: keyof CompilationOptions, value: unknown) => {
    if (!effectiveSetOptions) return;
    effectiveSetOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetOptions = () => {
    if (!effectiveSetOptions) return;
    effectiveSetOptions((prev) => ({
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
      className="markdraw-unified-inspector w-[300px] h-full overflow-y-auto font-sans select-none bg-[var(--md-surface-1)] border-l border-[var(--md-line-subtle)] text-xs text-[var(--md-ink-primary)] shrink-0 z-20 flex flex-col"
      data-ismobile={isMobile}
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
                ? `${currentRole} (${firstShape?.kind || 'shape'})`
                : `Untagged (${firstShape?.kind || 'shape'})`
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
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--md-line-subtle)]">
          {count > 0 && driver ? (
            <RoleSection
              selectedShapes={selectedShapes}
              allShapes={allShapes}
              driver={driver}
              isOpen={openSections.semantics}
              onToggle={() => toggleSection('semantics')}
              onSaveUnitGesture={() => setShowSaveUnitDialog(true)}
            />
          ) : (
            <CanvasOverviewSection
              shapes={allShapes}
              driver={driver}
              onCopyFrameContract={handleCopyFrameContract}
              copiedFrameId={copiedFrameId}
            />
          )}

          <StyleSection
            isOpen={openSections.styles}
            onToggle={() => toggleSection('styles')}
          />

          <CompilerSettingsSection
            isOpen={openSections.settings}
            onToggle={() => toggleSection('settings')}
            options={effectiveOptions}
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
