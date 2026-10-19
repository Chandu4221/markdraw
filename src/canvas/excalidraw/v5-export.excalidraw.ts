import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { CanvasShape } from '../port/CanvasShape';
import { StoredDocument, StoredUnitDefinition } from '../port/PersistencePort';
import { excalidrawElementToCanvasShape, canvasShapeToPartialExcalidrawElement } from './shapeMapping';
import { getStoredUnits, UnitDefinition } from '../../annotation/units';

/**
 * Converts an Excalidraw element array into a vendor-neutral StoredDocument.
 * Accurately synthesizes virtual group containers from Excalidraw groupIds (§6).
 */
export function excalidrawSceneToStoredDocument(
  elements: readonly ExcalidrawElement[],
  units?: UnitDefinition[]
): StoredDocument {
  const nonDeleted = elements.filter((el) => !el.isDeleted);
  const neutralShapes: CanvasShape[] = [];

  // 1. Group membership map: groupId -> member elements
  const groupMembers = new Map<string, ExcalidrawElement[]>();
  for (const el of nonDeleted) {
    if (el.groupIds && el.groupIds.length > 0) {
      const primaryGroupId = el.groupIds[0];
      if (!groupMembers.has(primaryGroupId)) {
        groupMembers.set(primaryGroupId, []);
      }
      groupMembers.get(primaryGroupId)!.push(el);
    }
  }

  // 2. Synthesize virtual group CanvasShapes (§6)
  const groupShapesMap = new Map<string, CanvasShape>();
  for (const [rawGroupId, members] of groupMembers) {
    // Check if any member carries persisted group metadata
    let preservedGroupData: any = null;
    for (const m of members) {
      if (m.customData?._markdraw_group_meta) {
        preservedGroupData = m.customData._markdraw_group_meta;
        break;
      }
    }

    const groupIdKey = preservedGroupData?.id || (rawGroupId.startsWith('shape:') ? rawGroupId : `virtual:${rawGroupId}`);

    // Compute enclosing bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const m of members) {
      minX = Math.min(minX, m.x);
      minY = Math.min(minY, m.y);
      maxX = Math.max(maxX, m.x + m.width);
      maxY = Math.max(maxY, m.y + m.height);
    }

    const bounds = preservedGroupData?.bounds || {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      rotation: 0
    };

    const groupShape: CanvasShape = {
      id: groupIdKey,
      kind: 'group',
      bounds,
      parentId: members[0].frameId || null,
      name: preservedGroupData?.name || null,
      text: null,
      arrowEndpoints: null,
      meta: preservedGroupData?.meta || {}
    };

    groupShapesMap.set(rawGroupId, groupShape);
    neutralShapes.push(groupShape);
  }

  // 3. Convert normal elements
  for (const el of nonDeleted) {
    const shape = excalidrawElementToCanvasShape(el, nonDeleted);
    // If element belongs to a group, ensure parentId points to that group
    if (el.groupIds && el.groupIds.length > 0) {
      const gShape = groupShapesMap.get(el.groupIds[0]);
      if (gShape) {
        shape.parentId = gShape.id;
      }
    }
    neutralShapes.push(shape);
  }

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

/**
 * Converts a neutral StoredDocument into native Excalidraw elements for scene initialization.
 */
export function storedDocumentToExcalidrawElements(
  doc: StoredDocument
): Record<string, any>[] {
  const groupShapes = doc.shapes.filter((s) => s.kind === 'group');
  const groupMap = new Map<string, CanvasShape>();
  for (const g of groupShapes) {
    groupMap.set(g.id, g);
  }

  // Filter out group entities from Excalidraw element list
  const nonGroupShapes = doc.shapes.filter((s) => s.kind !== 'group');

  return nonGroupShapes.map((s, index) => {
    const partial = canvasShapeToPartialExcalidrawElement(s);

    let groupIds = partial.groupIds || [];
    let frameId = partial.frameId || null;
    let customData = partial.customData || {};

    // If shape's parent is a group entity, wire groupIds and frameId
    if (s.parentId && groupMap.has(s.parentId)) {
      const parentGroup = groupMap.get(s.parentId)!;
      const rawGroupId = parentGroup.id.startsWith('virtual:')
        ? parentGroup.id.replace('virtual:', '')
        : parentGroup.id;

      groupIds = [rawGroupId, ...groupIds];
      frameId = parentGroup.parentId || null;

      // Stash group metadata so round-trip preserves group identity and units
      customData = {
        ...customData,
        _markdraw_group_meta: {
          id: parentGroup.id,
          name: parentGroup.name,
          bounds: parentGroup.bounds,
          meta: parentGroup.meta
        }
      };
    }

    return {
      // v5-token-exception: excalidraw export element default stroke
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      index: String(index),
      ...partial,
      groupIds,
      frameId,
      customData
    };
  });
}
