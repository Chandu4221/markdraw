import React, { useCallback } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import { CanvasDriver } from '../port/CanvasDriver';
import { TldrawDriver } from './TldrawDriver';
import { UnifiedInspectorPanel } from '../../components/UnifiedInspectorPanel';
import { RoleChipsOverlay } from '../../annotation/RoleChipsOverlay';
import { LegacyWidgetShapeUtil } from '../../annotation/legacyShapeUtil';

const TRANSITIONAL_SHAPE_UTILS = [LegacyWidgetShapeUtil];

export interface TldrawCanvasProps {
  persistenceKey: string;
  onDriverReady: (driver: CanvasDriver, rawEditor: Editor) => void;
  showRoleChips?: boolean;
  showUntaggedChips?: boolean;
  onChipClick?: (shapeId: string) => void;
  onCopyContract?: (shapeId: string, contractText: string) => void;
  onEditorMount?: (editor: Editor) => (() => void) | void;
}

export const TldrawCanvas: React.FC<TldrawCanvasProps> = ({
  persistenceKey,
  onDriverReady,
  showRoleChips = true,
  showUntaggedChips = false,
  onChipClick,
  onCopyContract,
  onEditorMount
}) => {
  const [editorInstance, setEditorInstance] = React.useState<Editor | null>(null);

  const handleMount = useCallback(
    (editor: Editor) => {
      setEditorInstance(editor);
      const driver = new TldrawDriver(editor);
      onDriverReady(driver, editor);
      if (onEditorMount) {
        return onEditorMount(editor);
      }
    },
    [onDriverReady, onEditorMount]
  );

  return (
    <Tldraw
      persistenceKey={persistenceKey}
      onMount={handleMount}
      components={{
        StylePanel: UnifiedInspectorPanel
      }}
      shapeUtils={TRANSITIONAL_SHAPE_UTILS}
    >
      <RoleChipsOverlay
        editor={editorInstance}
        showChips={showRoleChips}
        showUntagged={showUntaggedChips}
        onChipClick={onChipClick}
        onCopyContract={onCopyContract}
      />
    </Tldraw>
  );
};
