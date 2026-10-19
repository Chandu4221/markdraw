import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import { CanvasDriver } from '../port/CanvasDriver';
import { ExcalidrawDriver } from './ExcalidrawDriver';
import { ChipsOverlay } from '../../annotation/ChipsOverlay';
import { ReflowPreview } from '../../components/simulation/ReflowPreview';
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
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
  simulationRootId?: string | null;
  onCloseSimulation?: () => void;
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
  isInspectorOpen = true,
  onToggleInspector,
  simulationRootId = null,
  onCloseSimulation
}) => {
  const driverRef = useRef<ExcalidrawDriver | null>(null);
  const [driverState, setDriverState] = useState<CanvasDriver | null>(null);
  const cleanupRef = useRef<(() => void) | void>(undefined);

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

        if (onEditorMount) {
          if (typeof cleanupRef.current === 'function') {
            cleanupRef.current();
          }
          cleanupRef.current = onEditorMount(api);
        }
      }
    },
    [onDriverReady, onEditorMount]
  );

  useEffect(() => {
    return () => {
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
      if (driverRef.current) {
        driverRef.current.dispose();
        driverRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative markdraw-excalidraw-container">
      <Excalidraw
        excalidrawAPI={handleApiReady}
        theme={theme}
        gridModeEnabled={true}
        zenModeEnabled={false}
        viewModeEnabled={false}
        onChange={(elements, appState) => {
          driverRef.current?.handleSceneChange(elements, appState);
        }}
        onPointerUpdate={() => {
          if (driverRef.current?.rawApi) {
            const api = driverRef.current.rawApi;
            driverRef.current.handleSceneChange(api.getSceneElements(), api.getAppState());
          }
        }}
        renderTopRightUI={(_isMobile) => {
          return (
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {onToggleInspector && (
                <button
                  type="button"
                  onClick={onToggleInspector}
                  className={`h-9 px-3 rounded-[var(--md-radius-sm)] border text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isInspectorOpen
                      ? 'bg-[var(--md-accent)] text-white border-[var(--md-accent)]'
                      : 'bg-[var(--md-surface-raised)] text-[var(--md-text)] border-[var(--md-border)] hover:bg-[var(--md-surface-2)] hover:border-[var(--md-border-strong)]'
                  }`}
                  title={isInspectorOpen ? 'Collapse Semantics Inspector (Alt+I)' : 'Open Semantics Inspector (Alt+I)'}
                  aria-label={isInspectorOpen ? 'Collapse Semantics Inspector (Alt+I)' : 'Open Semantics Inspector (Alt+I)'}
                >
                  <Tag size={15} />
                  <span>Inspector</span>
                  {selectedIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-sm font-mono font-bold bg-blue-600 text-white">
                      {selectedIds.length}
                    </span>
                  )}
                </button>
              )}
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
      />
      <ChipsOverlay
        driver={driverState}
        showChips={showRoleChips && !simulationRootId}
        showUntagged={showUntaggedChips && !simulationRootId}
        onChipClick={(shapeId) => {
          if (!isInspectorOpen && onToggleInspector) {
            onToggleInspector();
          }
          onChipClick?.(shapeId);
        }}
        onCopyContract={onCopyContract}
      />
      {simulationRootId && (
        <ReflowPreview
          rootId={simulationRootId}
          driver={driverState}
          onClose={onCloseSimulation || (() => {})}
          defaultBreakpoint={768}
        />
      )}
    </div>
  );
};

