// src/annotation/units.ts
import { TLShape, Editor, createShapeId } from '../core/types';
import { generateShortId } from '../core/ids';
import { getShapeMeta } from './shapeMeta';
import { ROLE_SCHEMA_VERSION, MarkDrawMeta } from './types';

export interface UnitDefinition {
  id: string;              // stable, e.g. 'u_fc1' — generateShortId-based
  name: string;            // user-facing: "Follow Card"
  tag: string;             // emitted tag e.g. "Follow Card" (name); legend shows mapping
  baseRole: string;        // MANDATORY one of ROLE_NAMES (§4) — never null
  memberRoles: string[];   // ordered composition, e.g. ['avatar','heading','button']
  memberShapes?: TLShape[];// optional template shapes for stamping
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
  memberShapes: TLShape[]
): UnitDefinition {
  const shortHash = generateShortId(`unit_${name}_${Date.now()}`, new Set());
  const id = `u_${shortHash}`;

  // Sort top-left to bottom-right (y first, then x)
  const sorted = [...memberShapes].sort((a, b) => {
    const aY = a.y || 0;
    const bY = b.y || 0;
    if (Math.abs(aY - bY) > 8) {
      return aY - bY;
    }
    return (a.x || 0) - (b.x || 0);
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
      return cloned as TLShape;
    }),
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Stamps a unit copy onto the tldraw canvas.
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
  const originX = first.x || 0;
  const originY = first.y || 0;

  const newShapeIds: any[] = [];
  const shapesToCreate: any[] = [];

  for (const template of unit.memberShapes) {
    const newId = createShapeId();
    newShapeIds.push(newId);

    const relX = (template.x || 0) - originX;
    const relY = (template.y || 0) - originY;

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
