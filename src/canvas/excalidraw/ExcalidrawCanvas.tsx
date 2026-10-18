import React, { useCallback, useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import { CanvasDriver } from '../port/CanvasDriver';
import { ExcalidrawDriver } from './ExcalidrawDriver';

export interface ExcalidrawCanvasProps {
  persistenceKey: string;
  onDriverReady: (driver: CanvasDriver, rawApi: ExcalidrawImperativeAPI) => void;
  showRoleChips?: boolean;
  showUntaggedChips?: boolean;
  onChipClick?: (shapeId: string) => void;
  onCopyContract?: (shapeId: string, contractText: string) => void;
  onEditorMount?: (api: ExcalidrawImperativeAPI) => (() => void) | void;
  theme?: 'light' | 'dark';
}

export const ExcalidrawCanvas: React.FC<ExcalidrawCanvasProps> = ({
  onDriverReady,
  onEditorMount,
  theme = 'dark'
}) => {
  const driverRef = useRef<ExcalidrawDriver | null>(null);
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
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            toggleTheme: false,
            saveAsImage: false
          }
        }}
      />
    </div>
  );
};
