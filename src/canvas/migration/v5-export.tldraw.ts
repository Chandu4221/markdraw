import { TLShape, Editor } from '../../core/types';
import { CanvasShape } from '../port/CanvasShape';
import { StoredDocument } from '../port/PersistencePort';
import { tlShapeToCanvasShape } from './shapeMapping';
import { getStoredUnits, UnitDefinition } from '../../annotation/units';
import { migrateShapes, isV3Widget } from '../../annotation/migrate';

/**
 * Converts a legacy tldraw scene (records / shapes) into a vendor-neutral StoredDocument.
 * This is the migration-export retained for migrating legacy v4 documents.
 */
export function tldrawSceneToStoredDocument(
  shapes: TLShape[],
  units?: UnitDefinition[],
  editor?: Editor
): StoredDocument {
  // If legacy v3 widgets are present, upgrade them to v4 semantic shapes first
  const hasV3Widgets = shapes.some(isV3Widget);
  const normalizedShapes = hasV3Widgets ? migrateShapes(shapes).shapes : shapes;

  const neutralShapes: CanvasShape[] = normalizedShapes.map((s) => tlShapeToCanvasShape(s, editor));
  const activeUnits: UnitDefinition[] = units || getStoredUnits();

  return {
    schema: 1,
    docVersion: 1,
    shapes: neutralShapes,
    units: activeUnits.map((u) => ({
      id: u.id,
      name: u.name,
      tag: u.tag,
      baseRole: u.baseRole,
      memberRoles: u.memberRoles,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }))
  };
}
