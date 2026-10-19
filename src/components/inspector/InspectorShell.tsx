import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tag, Box } from 'lucide-react';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { CompilationOptions } from '../../core/types';
import { UnitDefinition } from '../../annotation/units';
import { getShapeMeta, hasType, updateDriverShapeMeta, MarkDrawMeta } from '../../annotation/shapeMeta';
import { loadPlatformProfile } from '../../annotation/profileLoader';
import { PlatformProfile } from '../../annotation/profiles/types';
import { ModeCanvas } from './ModeCanvas';
import { ModeUntagged } from './ModeUntagged';
import { ModeTagged } from './ModeTagged';
import { ModeTaggedMulti } from './ModeTaggedMulti';
import { Breakpoint } from '../ui/BreakpointSwitch';

export interface InspectorShellProps {
  selectedIds: string[];
  driver: CanvasDriver | null;
  units?: UnitDefinition[];
  onUnitsChange?: (units: UnitDefinition[]) => void;
  options?: Required<CompilationOptions>;
  onOptionsChange?: (options: Required<CompilationOptions>) => void;
  hideHeader?: boolean;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
  breakpoint?: Breakpoint;
  onBreakpointChange?: (bp: Breakpoint) => void;
}

export const InspectorShell: React.FC<InspectorShellProps> = ({
  selectedIds,
  driver,
  units = [],
  onUnitsChange,
  options,
  hideHeader = false,
  breakpoint = 1200,
  onBreakpointChange
}) => {
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [platformProfile, setPlatformProfile] = useState<PlatformProfile | null>(null);
  const [showSaveUnitDialog, setShowSaveUnitDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitBaseRole, setNewUnitBaseRole] = useState('card');

  // Load platform profile when options change
  useEffect(() => {
    let mounted = true;
    const platId = options?.platformId ?? options?.platform ?? 'web';
    loadPlatformProfile(platId).then((p) => {
      if (mounted) setPlatformProfile(p);
    });
    return () => {
      mounted = false;
    };
  }, [options?.platformId, options?.platform]);

  // Synchronize canvas shapes
  const refreshShapes = useCallback(async () => {
    if (!driver) return;
    try {
      const list = await driver.listShapes();
      setShapes(list);
    } catch (err) {
      console.error('Failed to list shapes in InspectorShell', err);
    }
  }, [driver]);

  useEffect(() => {
    if (!driver) return;
    refreshShapes();
    const unsub = driver.onShapesChanged(() => {
      refreshShapes();
    });
    return () => {
      unsub();
    };
  }, [driver, refreshShapes]);

  // Selected shapes
  const selectedShapes = useMemo(() => {
    const idSet = new Set(selectedIds);
    return shapes.filter((s) => idSet.has(s.id));
  }, [shapes, selectedIds]);

  // Update handlers
  const handleUpdateName = async (shapeId: string, name: string) => {
    if (!driver) return;
    try {
      await driver.updateShape(shapeId, { name });
      await updateDriverShapeMeta(driver, [shapeId], {
        props: { label: name || undefined }
      });
      await refreshShapes();
    } catch (err) {
      console.error('Failed to update shape name', err);
    }
  };

  const handleUpdateMeta = async (shapeId: string, patch: Partial<MarkDrawMeta>) => {
    if (!driver) return;
    try {
      await updateDriverShapeMeta(driver, [shapeId], patch);
      await refreshShapes();
    } catch (err) {
      console.error('Failed to update shape meta', err);
    }
  };

  const handleSelectType = async (shapeId: string, type: string | null) => {
    await handleUpdateMeta(shapeId, {
      type,
      role: type
    });
  };

  const handleBulkSelectType = async (type: string | null) => {
    if (!driver) return;
    try {
      await updateDriverShapeMeta(driver, selectedIds, {
        type,
        role: type
      });
      await refreshShapes();
    } catch (err) {
      console.error('Failed to bulk update shape type', err);
    }
  };

  const handleSelectShape = (shapeId: string) => {
    if (!driver) return;
    driver.setSelection([shapeId]);
    driver.panTo(shapeId);
  };

  const handleSaveUnit = () => {
    if (!newUnitName.trim() || selectedIds.length === 0) return;
    const memberRoles = selectedShapes
      .map((s) => getShapeMeta(s)?.type)
      .filter((t): t is string => Boolean(t));
    const now = Date.now();
    const newUnit: UnitDefinition = {
      id: `u_${now}_${Math.random().toString(36).slice(2, 6)}`,
      name: newUnitName.trim(),
      tag: newUnitName.trim(),
      baseRole: newUnitBaseRole,
      memberRoles,
      createdAt: now,
      updatedAt: now
    };
    onUnitsChange?.([...units, newUnit]);
    setShowSaveUnitDialog(false);
    setNewUnitName('');
  };

  const count = selectedIds.length;
  const singleShape = count === 1 ? selectedShapes[0] || shapes.find((s) => s.id === selectedIds[0]) : null;
  const isTagged = singleShape ? hasType(singleShape.meta) : false;

  return (
    <div
      role="complementary"
      aria-label="Inspector and Document Settings"
      className="markdraw-unified-inspector h-full overflow-y-auto font-sans select-none bg-[var(--color-surface-1)] text-sm text-[var(--color-ink-primary)] shrink-0 z-20 flex flex-col w-full"
      data-testid="markdraw-docked-inspector"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header if not hidden */}
      {!hideHeader && (
        <div className="h-9 px-3 border-b border-[var(--color-line-subtle)] flex items-center justify-between bg-[var(--color-surface-1)] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag size={16} className="text-[var(--color-accent)] shrink-0" />
            <span className="text-sm font-semibold text-[var(--color-ink-primary)] truncate">
              {count === 0
                ? 'Inspector & Canvas'
                : count === 1
                ? isTagged
                  ? `${getShapeMeta(singleShape!)?.type || 'Tagged'} (${singleShape?.kind || 'shape'})`
                  : `Untagged (${singleShape?.kind || 'shape'})`
                : `${count} shapes selected`}
            </span>
          </div>
        </div>
      )}

      {/* Mode Matrix (§3.1): Exact 4 states */}
      <div className="flex-1 overflow-y-auto">
        {count === 0 && <ModeCanvas shapes={shapes} driver={driver} onSelectShape={handleSelectShape} />}
        {count === 1 && singleShape && !isTagged && (
          <ModeUntagged
            shape={singleShape}
            onSelectType={(t) => handleSelectType(singleShape.id, t)}
            onUpdateName={(name) => handleUpdateName(singleShape.id, name)}
            platformProfile={platformProfile}
          />
        )}

        {count === 1 && singleShape && isTagged && (
          <ModeTagged
            shape={singleShape}
            allShapes={shapes}
            onSelectType={(t) => handleSelectType(singleShape.id, t)}
            onUpdateName={(name) => handleUpdateName(singleShape.id, name)}
            onUpdateMeta={(patch) => handleUpdateMeta(singleShape.id, patch)}
            platformProfile={platformProfile}
            breakpoint={breakpoint}
            onBreakpointChange={onBreakpointChange}
          />
        )}

        {count > 1 && (
          <ModeTaggedMulti
            shapes={selectedShapes}
            onBulkSelectType={handleBulkSelectType}
            onSaveUnitGesture={() => setShowSaveUnitDialog(true)}
            platformProfile={platformProfile}
          />
        )}
      </div>

      {/* Save Unit Dialog */}
      {showSaveUnitDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            className="w-80 rounded-xl border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
              <div className="flex items-center gap-1.5 font-bold text-sm text-[var(--color-ink-primary)]">
                <Box size={16} className="text-[var(--color-accent)]" />
                <span>Save as Custom Unit</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">Unit Name</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Follow Card, Pricing Tier"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveUnit();
                  if (e.key === 'Escape') setShowSaveUnitDialog(false);
                }}
                className="w-full h-8 px-2.5 rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] text-sm text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">Base Spec Type</label>
              <select
                value={newUnitBaseRole}
                onChange={(e) => setNewUnitBaseRole(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] text-sm text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] cursor-pointer"
              >
                <option value="card">Card (Container)</option>
                <option value="section">Section</option>
                <option value="navbar">Navbar</option>
                <option value="dialog">Dialog / Modal</option>
                <option value="group">Group (Generic)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-line-subtle)]">
              <button
                type="button"
                onClick={() => setShowSaveUnitDialog(false)}
                className="px-3 py-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUnit}
                disabled={!newUnitName.trim()}
                className="px-3 py-1.5 text-sm font-semibold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
              >
                Save Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
