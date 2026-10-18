import { TLShape, Editor } from '../../core/types';
import { CanvasShape } from '../port/CanvasShape';
import { StoredDocument } from '../port/PersistencePort';
import { tlShapeToCanvasShape } from './shapeMapping';
import { getStoredUnits, UnitDefinition } from '../../annotation/units';

/**
 * Converts a legacy tldraw scene (records / shapes) into a vendor-neutral StoredDocument.
 * This is the migration-export retained for migrating legacy v4 documents.
 */
export function tldrawSceneToStoredDocument(
  shapes: TLShape[],
  units?: UnitDefinition[],
  editor?: Editor
): StoredDocument {
  const neutralShapes: CanvasShape[] = shapes.map((s) => tlShapeToCanvasShape(s, editor));
  const activeUnits: UnitDefinition[] = units || getStoredUnits();

  return {
    schema: 1,
    docVersion: 1,
    shapes: neutralShapes,
    units: activeUnits as any
  };
}
