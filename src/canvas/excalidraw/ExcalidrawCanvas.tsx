import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Excalidraw, Sidebar } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import { CanvasDriver } from '../port/CanvasDriver';
import { CanvasShape } from '../port/CanvasShape';
import { ExcalidrawDriver } from './ExcalidrawDriver';
import { RoleChipsOverlay } from '../../annotation/RoleChipsOverlay';
import { InspectorShell } from '../../components/inspector/InspectorShell';
import { MarkDrawChip } from '../../components/ui/MarkDrawChip';
import { ReflowPreview } from '../../components/simulation/ReflowPreview';
import { getShapeMeta } from '../../annotation/shapeMeta';
import { CompilationOptions } from '../../core/types';
import { UnitDefinition } from '../../annotation/units';
import { Tag } from 'lucide-react';

export interface ExcalidrawCanvasProps {
  persistenceKey: string;
  onDriverReady: (driver: CanvasDriver, rawApi: ExcalidrawImperativeAPI) => void;
  showRoleChips?: boolean;
  showUntaggedChips?: boolean;
  onChipClick?: (shapeId: string) => void;
  onCopyContract?: (shapeId: string, contractText: string) => void;
  onEditorMount?: (api: ExcalidrawImperativeAPI) => (() => void) | void;
  theme?: 'light' | 'dark';
  selectedIds?: string[];
  options?: Required<CompilationOptions>;
  onOptionsChange?: (
    newOptsOrUpdater:
      | Required<CompilationOptions>
      | ((prev: Required<CompilationOptions>) => Required<CompilationOptions>)
  ) => void;
  units?: UnitDefinition[];
  onUnitsChange?: (units: UnitDefinition[]) => void;
}

export const ExcalidrawCanvas: React.FC<ExcalidrawCanvasProps> = ({
  onDriverReady,
  onEditorMount,
  showRoleChips = true,
  showUntaggedChips = false,
  onChipClick,
  onCopyContract,
  theme = 'dark',
  selectedIds = [],
  options,
  onOptionsChange,
  units,
  onUnitsChange
}) => {
  const driverRef = useRef<ExcalidrawDriver | null>(null);
  const [driverState, setDriverState] = useState<CanvasDriver | null>(null);
  const cleanupRef = useRef<(() => void) | void>(undefined);
  const [selectedShapes, setSelectedShapes] = useState<CanvasShape[]>([]);
  const prevSelectedIdsRef = useRef<string[]>([]);
  const [simulationRootId, setSimulationRootId] = useState<string | null>(null);

  const responsiveRootShape = useMemo(() => {
    for (const shape of selectedShapes) {
      const meta = getShapeMeta(shape);
      if (meta?.role === 'page' && meta.props?.behaviors?.includes('responsive')) {
        return shape;
      }
    }
    return null;
  }, [selectedShapes]);

  useEffect(() => {
    if (!responsiveRootShape && simulationRootId) {
      setSimulationRootId(null);
    }
  }, [responsiveRootShape, simulationRootId]);

  const handleToggleSimulate = useCallback(() => {
    if (responsiveRootShape) {
      setSimulationRootId((prev) => (prev ? null : responsiveRootShape.id));
    }
  }, [responsiveRootShape]);

  const [isDocked, setIsDocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('markdraw_sidebar_docked');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleDock = (docked: boolean) => {
    setIsDocked(docked);
    try {
      localStorage.setItem('markdraw_sidebar_docked', String(docked));
    } catch {}
  };

  const handleApiReady = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      if (!api) return;

      if (!driverRef.current || driverRef.current.rawApi !== api) {
        if (driverRef.current) {
          driverRef.current.dispose();
        }
        const driver = new ExcalidrawDriver(api);
        driverRef.current = driver;
        setDriverState(driver);
        onDriverReady(driver, api);

        // Open docked inspector on start if preferred
        if (isDocked) {
          api.toggleSidebar({ name: 'markdraw-inspector', force: true });
        }

        if (onEditorMount) {
          if (typeof cleanupRef.current === 'function') {
            cleanupRef.current();
          }
          cleanupRef.current = onEditorMount(api);
        }
      }
    },
    [onDriverReady, onEditorMount, isDocked]
  );

  // Update selected shapes when driver or selection changes
  const refreshSelectedShapes = useCallback(async () => {
    if (!driverState || selectedIds.length === 0) {
      setSelectedShapes([]);
      return;
    }
    const shapes = await Promise.all(selectedIds.map((id) => driverState.getShape(id)));
    setSelectedShapes(shapes.filter((s): s is CanvasShape => s !== null));
  }, [driverState, selectedIds]);

  useEffect(() => {
    void refreshSelectedShapes();
    if (!driverState) return;
    const unsub = driverState.onShapesChanged(() => {
      void refreshSelectedShapes();
    });
    return unsub;
  }, [driverState, refreshSelectedShapes]);

  // Open sidebar when selection becomes non-empty or changes
  useEffect(() => {
    if (!driverRef.current?.rawApi) return;
    const prev = prevSelectedIdsRef.current;
    prevSelectedIdsRef.current = selectedIds;

    if (selectedIds.length > 0) {
      const isDifferent =
        prev.length !== selectedIds.length ||
        prev.some((id, idx) => id !== selectedIds[idx]);
      if (isDifferent) {
        driverRef.current.rawApi.toggleSidebar({ name: 'markdraw-inspector', force: true });
      }
    }
  }, [selectedIds]);

  useEffect(() => {
    return () => {
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
      if (driverRef.current) {
        driverRef.current.dispose();
      }
    };
  }, []);

  const firstSelected = selectedShapes[0];
  const firstMeta = firstSelected ? getShapeMeta(firstSelected) : null;
  const shortId = firstSelected
    ? firstSelected.id.length <= 6
      ? firstSelected.id
      : firstSelected.id.slice(0, 5)
    : '';

  return (
    <div className="w-full h-full relative markdraw-excalidraw-container">
      <Excalidraw
        excalidrawAPI={handleApiReady}
        theme={theme}
        gridModeEnabled={true}
        zenModeEnabled={false}
        viewModeEnabled={false}
        renderTopRightUI={(_isMobile, appState) => {
          const isOpen = appState?.openSidebar?.name === 'markdraw-inspector';
          return (
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  driverRef.current?.rawApi?.toggleSidebar({
                    name: 'markdraw-inspector',
                    force: !isOpen
                  });
                }}
                className={`h-9 px-3 rounded-[var(--md-radius-sm)] border text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isOpen
                    ? 'bg-[var(--md-accent)] text-white border-[var(--md-accent)]'
                    : 'bg-[var(--md-surface-raised)] text-[var(--md-text)] border-[var(--md-border)] hover:bg-[var(--md-surface-2)] hover:border-[var(--md-border-strong)]'
                }`}
                title="Toggle MarkDraw Semantics Inspector"
                aria-label="Toggle MarkDraw Semantics Inspector"
              >
                <Tag size={15} />
                <span>Inspector</span>
                {selectedIds.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-sm font-mono font-bold bg-blue-600 text-white">
                    {selectedIds.length}
                  </span>
                )}
              </button>
            </div>
          );
        }}
        UIOptions={{
          dockedSidebarBreakpoint: 0,
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            toggleTheme: false,
            saveAsImage: false
          }
        }}
      >
        <Sidebar
          name="markdraw-inspector"
          docked={isDocked}
          onDock={handleDock}
          className="markdraw-inspector-sidebar"
        >
          <Sidebar.Header className="markdraw-sidebar-header">
            <div className="flex items-center gap-2 min-w-0 font-mono text-sm">
              {selectedShapes.length === 0 ? (
                <span className="font-semibold font-sans text-[var(--md-ink-primary)]">
                  Canvas Overview
                </span>
              ) : selectedShapes.length === 1 ? (
                <>
                  <span className="font-bold text-[var(--md-ink-primary)]">#{shortId}</span>
                  <span className="text-[var(--md-ink-muted)]">·</span>
                  <MarkDrawChip
                    variant={firstMeta?.role ? 'role' : 'untagged'}
                    role={firstMeta?.role || undefined}
                    label={firstMeta?.role || 'untagged'}
                    size="sm"
                  />
                </>
              ) : (
                <span className="font-semibold font-sans text-[var(--md-ink-primary)]">
                  Inspector · {selectedShapes.length} selected
                </span>
              )}
            </div>
          </Sidebar.Header>
          <InspectorShell
            selectedIds={selectedIds}
            driver={driverState}
            units={units}
            onUnitsChange={onUnitsChange}
            options={options}
            onOptionsChange={onOptionsChange}
            hideHeader={true}
            isSimulating={Boolean(simulationRootId)}
            onToggleSimulate={responsiveRootShape ? handleToggleSimulate : undefined}
          />
        </Sidebar>
      </Excalidraw>
      <RoleChipsOverlay
        driver={driverState}
        showChips={showRoleChips && !simulationRootId}
        showUntagged={showUntaggedChips && !simulationRootId}
        onChipClick={(shapeId) => {
          driverRef.current?.rawApi?.toggleSidebar({
            name: 'markdraw-inspector',
            force: true
          });
          onChipClick?.(shapeId);
        }}
        onCopyContract={onCopyContract}
      />
      {simulationRootId && (
        <ReflowPreview
          rootId={simulationRootId}
          driver={driverState}
          onClose={() => setSimulationRootId(null)}
          defaultBreakpoint={768}
        />
      )}
    </div>
  );
};

