import { Editor } from '../core/types';
import { MarkDrawMeta, ROLE_SCHEMA_VERSION, createDefaultMarkDrawMeta } from './types';
import { RoleName } from './roles';
import { CanvasDriver } from '../canvas/port/CanvasDriver';

export interface ShapeLike {
  id?: string;
  kind?: string;
  type?: string;
  name?: string | null;
  text?: string | null;
  props?: Record<string, unknown>;
  bounds?: { x?: number; y?: number; w: number; h: number; rotation?: number };
  meta?: Record<string, unknown>;
}

export function getShapeMeta(shape: { meta?: Record<string, unknown> }): MarkDrawMeta | null {
  const meta = (shape.meta as Record<string, unknown> | undefined)?.markdraw;
  if (!meta || typeof meta !== 'object') return null;
  const m = meta as Partial<MarkDrawMeta>;
  if (m.schema !== ROLE_SCHEMA_VERSION) return null;
  return meta as MarkDrawMeta;
}

export function parseMarkDrawMeta(shape?: { meta?: Record<string, unknown> } | null): MarkDrawMeta {
  if (!shape) return createDefaultMarkDrawMeta();
  return getShapeMeta(shape) || createDefaultMarkDrawMeta();
}

export function serializeMarkDrawMeta(
  patch: Partial<MarkDrawMeta>,
  currentMeta?: MarkDrawMeta | null
): MarkDrawMeta {
  const base = currentMeta || createDefaultMarkDrawMeta();
  return {
    ...base,
    ...patch,
    schema: ROLE_SCHEMA_VERSION,
    props: {
      ...base.props,
      ...(patch.props || {})
    }
  };
}

export async function updateDriverShapeMeta(
  driver: CanvasDriver,
  shapeIds: string[],
  patch: Partial<MarkDrawMeta>
): Promise<void> {
  for (const id of shapeIds) {
    const shape = await driver.getShape(id);
    if (!shape) continue;

    const currentMeta = parseMarkDrawMeta(shape);
    const updatedMeta = serializeMarkDrawMeta(patch, currentMeta);

    await driver.updateShape(id, {
      meta: {
        ...shape.meta,
        markdraw: updatedMeta
      }
    });
  }
}

export function hasRole(shape: { meta?: Record<string, unknown> }): boolean {
  const meta = getShapeMeta(shape);
  return Boolean(meta && meta.role);
}

export function updateShapeMeta(
  editor: Editor,
  shapeIds: string[],
  patch: Partial<MarkDrawMeta>
): void {
  const updates: Array<{ id: string; type: string; meta: Record<string, unknown> }> = [];

  for (const id of shapeIds) {
    const shape = editor.getShape(id as string);
    if (!shape) continue;

    const currentMeta = getShapeMeta(shape) || createDefaultMarkDrawMeta();
    const updatedMeta: MarkDrawMeta = {
      ...currentMeta,
      ...patch,
      schema: ROLE_SCHEMA_VERSION,
      props: {
        ...currentMeta.props,
        ...(patch.props || {})
      }
    };

    updates.push({
      id: shape.id,
      type: shape.type,
      meta: {
        ...shape.meta,
        markdraw: updatedMeta
      }
    });
  }

  if (updates.length > 0) {
    editor.updateShapes(updates);
  }
}

/**
 * Geometric heuristic suggestion for shapes (§5 section 1).
 * "Suggestion != assignment. The suggestion NEVER auto-assigns."
 */
export function suggestRoleForShape(
  shape: ShapeLike,
  editor?: Editor | null
): RoleName | null {
  if (hasRole(shape)) return null;

  let w = 100;
  let h = 100;
  if (shape.bounds && typeof shape.bounds.w === 'number' && typeof shape.bounds.h === 'number') {
    w = shape.bounds.w;
    h = shape.bounds.h;
  } else if (editor && typeof editor.getShapePageBounds === 'function') {
    const b = editor.getShapePageBounds(shape);
    if (b) {
      w = b.w;
      h = b.h;
    }
  } else if (shape.props && typeof shape.props.w === 'number' && typeof shape.props.h === 'number') {
    w = shape.props.w;
    h = shape.props.h;
  }

  // Frame shape
  if (shape.kind === 'frame' || shape.type === 'frame') {
    return 'page';
  }

  // Text shape
  if (shape.kind === 'text' || shape.type === 'text') {
    const text = typeof shape.text === 'string'
      ? shape.text.trim()
      : typeof shape.props?.text === 'string'
      ? shape.props.text.trim()
      : '';
    const size = typeof shape.props?.size === 'string' ? shape.props.size : 'm';
    if (size === 'xl' || size === 'l' || text.length < 30) {
      return 'heading';
    }
    return 'para';
  }

  const isEllipse =
    shape.kind === 'ellipse' ||
    (shape.type === 'geo' && shape.props?.geo === 'ellipse');

  if (isEllipse) {
    const aspect = w / (h || 1);
    if (aspect >= 0.8 && aspect <= 1.25 && w <= 120) {
      return 'avatar';
    }
    return 'badge';
  }

  const isRectangle =
    shape.kind === 'rect' ||
    (shape.type === 'geo' && (shape.props?.geo === 'rectangle' || !shape.props?.geo));

  if (isRectangle) {
    if (h >= 28 && h <= 58 && w >= 60 && w <= 260) {
      return 'button';
    }
    if (w >= 300 && h >= 160) {
      return 'card';
    }
    if (w >= 600 && h <= 80) {
      return 'navbar';
    }
  }

  return null;
}
