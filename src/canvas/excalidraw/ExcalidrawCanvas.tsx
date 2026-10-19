import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import '../../theme/excalidraw-theme.css';
import { CanvasDriver } from '../port/CanvasDriver';
import { ExcalidrawDriver } from './ExcalidrawDriver';
import { ChipsOverlay } from '../../annotation/ChipsOverlay';
import { ReflowPreview } from '../../components/simulation/ReflowPreview';
import { Breakpoint } from '../../components/ui/BreakpointSwitch';

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
  breakpoint?: Breakpoint;
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
  isInspectorOpen = true,
  onToggleInspector,
  breakpoint = 1200,
  simulationRootId = null
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
        showChips={showRoleChips && breakpoint === 1200}
        showUntagged={showUntaggedChips && breakpoint === 1200}
        onChipClick={(shapeId) => {
          if (!isInspectorOpen && onToggleInspector) {
            onToggleInspector();
          }
          onChipClick?.(shapeId);
        }}
        onCopyContract={onCopyContract}
      />
      {simulationRootId && breakpoint !== 1200 && (
        <ReflowPreview
          rootId={simulationRootId}
          driver={driverState}
          breakpoint={breakpoint}
        />
      )}
    </div>
  );
};

