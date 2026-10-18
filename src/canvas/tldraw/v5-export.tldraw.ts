import { TLShape, Editor } from '@tldraw/tldraw';
import { CanvasShape } from '../port/CanvasShape';
import { StoredDocument, StoredUnitDefinition } from '../port/PersistencePort';
import { tlShapeToCanvasShape } from './shapeMapping';
import { getStoredUnits, UnitDefinition } from '../../annotation/units';

/**
 * Converts a tldraw scene (records / shapes) into a vendor-neutral StoredDocument.
 */
export function tldrawSceneToStoredDocument(
  shapes: TLShape[],
  units?: UnitDefinition[],
  editor?: Editor
): StoredDocument {
  const neutralShapes: CanvasShape[] = shapes.map((s) => tlShapeToCanvasShape(s, editor));
  const activeUnits: UnitDefinition[] = units || getStoredUnits();

  const neutralUnits: StoredUnitDefinition[] = activeUnits.map((u) => ({
    id: u.id,
    name: u.name,
    tag: u.tag,
    baseRole: u.baseRole,
    memberRoles: u.memberRoles,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));

  return {
    shapes: neutralShapes,
    units: neutralUnits,
    docVersion: 1,
    schema: 1
  };
}
