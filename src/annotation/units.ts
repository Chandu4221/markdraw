// src/annotation/units.ts
import { TLShape, Editor, createShapeId } from '../core/types';
import { generateShortId } from '../core/ids';
import { getShapeMeta } from './shapeMeta';
import { ROLE_SCHEMA_VERSION, MarkDrawMeta } from './types';
import { CanvasShape } from '../canvas/port/CanvasShape';
import { CanvasDriver } from '../canvas/port/CanvasDriver';

export interface UnitDefinition {
  id: string;              // stable, e.g. 'u_fc1' — generateShortId-based
  name: string;            // user-facing: "Follow Card"
  tag: string;             // emitted tag e.g. "Follow Card" (name); legend shows mapping
  baseRole: string;        // MANDATORY one of ROLE_NAMES (§4) — never null
  memberRoles: string[];   // ordered composition, e.g. ['avatar','heading','button']
  memberShapes?: Array<TLShape | CanvasShape>; // optional template shapes for stamping
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'markdraw_custom_units_v4';

let memoryUnits: UnitDefinition[] = [];

export function clearStoredUnitsForTesting(): void {
  memoryUnits = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}

export function getStoredUnits(): UnitDefinition[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return memoryUnits;
}

export function saveStoredUnit(unit: UnitDefinition): void {
  const existing = getStoredUnits().filter((u) => u.id !== unit.id);
  existing.push(unit);
  memoryUnits = existing;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {}
  }
}

export function deleteStoredUnit(unitId: string): void {
  const filtered = getStoredUnits().filter((u) => u.id !== unitId);
  memoryUnits = filtered;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
  }
}

export function updateStoredUnit(unitId: string, patch: Partial<UnitDefinition>): void {
  const units = getStoredUnits();
  const index = units.findIndex((u) => u.id === unitId);
  if (index !== -1) {
    units[index] = {
      ...units[index],
      ...patch,
      updatedAt: Date.now()
    };
    memoryUnits = units;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
      } catch {}
    }
  }
}

/**
 * Creates a new UnitDefinition from a list of annotated shapes.
 * Shapes are ordered top-left to bottom-right by bounds (y, then x).
 */
export function createUnitDefinition(
  name: string,
  baseRole: string,
  memberShapes: Array<TLShape | CanvasShape>
): UnitDefinition {
  const shortHash = generateShortId(`unit_${name}_${Date.now()}`, new Set());
  const id = `u_${shortHash}`;

  const getPos = (s: TLShape | CanvasShape) => {
    if ('bounds' in s && s.bounds) {
      return { x: s.bounds.x, y: s.bounds.y };
    }
    const tl = s as TLShape;
    return { x: tl.x || 0, y: tl.y || 0 };
  };

  // Sort top-left to bottom-right (y first, then x)
  const sorted = [...memberShapes].sort((a, b) => {
    const aP = getPos(a);
    const bP = getPos(b);
    if (Math.abs(aP.y - bP.y) > 8) {
      return aP.y - bP.y;
    }
    return aP.x - bP.x;
  });

  const memberRoles = sorted
    .map((s) => {
      const meta = getShapeMeta(s);
      return meta?.role || 'unknown';
    })
    .filter((r) => r !== 'unknown');

  const now = Date.now();
  return {
    id,
    name: name.trim(),
    tag: name.trim(),
    baseRole,
    memberRoles,
    memberShapes: sorted.map((s) => {
      const cloned = { ...s };
      const currentMeta = getShapeMeta(s) || {
        schema: ROLE_SCHEMA_VERSION,
        role: null,
        unitId: null,
        parentId: null,
        responsive: null,
        props: {}
      };
      cloned.meta = {
        ...s.meta,
        markdraw: {
          ...currentMeta,
          unitId: id
        }
      };
      return cloned;
    }),
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Stamps a unit copy onto the CanvasDriver canvas.
 */
export async function stampUnitWithDriver(
  driver: CanvasDriver,
  unit: UnitDefinition,
  offset: { x: number; y: number } = { x: 0, y: 0 }
): Promise<string | null> {
  if (!unit.memberShapes || unit.memberShapes.length === 0) return null;

  const targetX = 400 + offset.x;
  const targetY = 300 + offset.y;

  const first = unit.memberShapes[0];
  const firstPos = 'bounds' in first && first.bounds ? { x: first.bounds.x, y: first.bounds.y } : { x: (first as TLShape).x || 0, y: (first as TLShape).y || 0 };
  const originX = firstPos.x;
  const originY = firstPos.y;

  const newShapeIds: string[] = [];
  for (const template of unit.memberShapes) {
    const isCanvas = 'bounds' in template && template.bounds;
    const tBounds = isCanvas ? (template as CanvasShape).bounds : {
      x: (template as TLShape).x || 0,
      y: (template as TLShape).y || 0,
      w: typeof (template as TLShape).props?.w === 'number' ? ((template as TLShape).props.w as number) : 100,
      h: typeof (template as TLShape).props?.h === 'number' ? ((template as TLShape).props.h as number) : 100,
      rotation: (template as TLShape).rotation || 0
    };
    const kind = isCanvas ? (template as CanvasShape).kind : ((template as TLShape).type === 'text' ? 'text' : (template as TLShape).type === 'frame' ? 'frame' : 'rect');
    const relX = tBounds.x - originX;
    const relY = tBounds.y - originY;
    const tMeta = getShapeMeta(template);
    const meta: { markdraw: MarkDrawMeta } = {
      markdraw: {
        schema: ROLE_SCHEMA_VERSION,
        role: tMeta?.role || 'card',
        unitId: unit.id,
        parentId: tMeta?.parentId ?? null,
        responsive: tMeta?.responsive ? { ...tMeta.responsive } : null,
        props: { ...(tMeta?.props || {}) }
      }
    };

    const newId = await driver.createShape({
      kind,
      bounds: {
        x: targetX + relX,
        y: targetY + relY,
        w: tBounds.w,
        h: tBounds.h,
        rotation: tBounds.rotation
      },
      parentId: null,
      name: isCanvas ? (template as CanvasShape).name : null,
      text: isCanvas ? (template as CanvasShape).text : (typeof (template as TLShape).props?.text === 'string' ? ((template as TLShape).props.text as string) : null),
      arrowEndpoints: null,
      meta
    });
    newShapeIds.push(newId);
  }

  const groupId = await driver.groupShapes(newShapeIds);
  await driver.updateShape(groupId, {
    meta: {
      markdraw: {
        schema: ROLE_SCHEMA_VERSION,
        role: unit.baseRole,
        unitId: unit.id,
        parentId: null,
        responsive: null,
        props: {
          label: unit.name
        }
      }
    }
  });

  driver.setSelection([groupId]);
  return groupId;
}

/**
 * Stamps a unit copy onto the legacy tldraw canvas.
 */
export function stampUnit(
  editor: Editor,
  unit: UnitDefinition,
  offset: { x: number; y: number } = { x: 0, y: 0 }
): string | null {
  if (!unit.memberShapes || unit.memberShapes.length === 0) return null;

  const center = editor.getViewportPageBounds()?.center || { x: 400, y: 300 };
  const targetX = center.x + offset.x;
  const targetY = center.y + offset.y;

  const first = unit.memberShapes[0];
  const firstPos = 'x' in first ? { x: first.x || 0, y: first.y || 0 } : { x: (first as CanvasShape).bounds.x, y: (first as CanvasShape).bounds.y };
  const originX = firstPos.x;
  const originY = firstPos.y;

  const newShapeIds: any[] = [];
  const shapesToCreate: any[] = [];

  for (const template of unit.memberShapes) {
    const newId = createShapeId();
    newShapeIds.push(newId);

    const tX = 'x' in template ? (template.x || 0) : (template as CanvasShape).bounds.x;
    const tY = 'y' in template ? (template.y || 0) : (template as CanvasShape).bounds.y;
    const relX = tX - originX;
    const relY = tY - originY;

    const tMeta = getShapeMeta(template);
    const meta: { markdraw: MarkDrawMeta } = {
      markdraw: {
        schema: ROLE_SCHEMA_VERSION,
        role: tMeta?.role || 'card',
        unitId: unit.id,
        parentId: tMeta?.parentId ?? null,
        responsive: tMeta?.responsive ? { ...tMeta.responsive } : null,
        props: { ...(tMeta?.props || {}) }
      }
    };

    shapesToCreate.push({
      ...template,
      id: newId,
      x: targetX + relX,
      y: targetY + relY,
      meta
    });
  }

  editor.createShapes(shapesToCreate);

  // Group the stamped shapes
  const groupId = createShapeId();
  editor.groupShapes(newShapeIds, { groupId });

  // Set unit meta on group
  editor.updateShape({
    id: groupId,
    type: 'group',
    meta: {
      markdraw: {
        schema: ROLE_SCHEMA_VERSION,
        role: unit.baseRole,
        unitId: unit.id,
        props: {
          label: unit.name
        }
      }
    }
  });

  return groupId as string;
}
