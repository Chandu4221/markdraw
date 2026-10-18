// src/annotation/shapeMeta.ts
import { TLShape, Editor } from '../core/types';
import { MarkDrawMeta, ROLE_SCHEMA_VERSION, createDefaultMarkDrawMeta } from './types';
import { RoleName } from './roles';

export function getShapeMeta(shape: TLShape): MarkDrawMeta | null {
  const meta = (shape.meta as Record<string, unknown> | undefined)?.markdraw;
  if (!meta || typeof meta !== 'object') return null;
  const m = meta as Partial<MarkDrawMeta>;
  if (m.schema !== ROLE_SCHEMA_VERSION) return null;
  return meta as MarkDrawMeta;
}

export function hasRole(shape: TLShape): boolean {
  const meta = getShapeMeta(shape);
  return Boolean(meta && meta.role);
}

export function updateShapeMeta(
  editor: Editor,
  shapeIds: string[],
  patch: Partial<MarkDrawMeta>
): void {
  const updates: any[] = [];

  for (const id of shapeIds) {
    const shape = editor.getShape(id as any);
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
  shape: TLShape,
  editor?: Editor | null
): RoleName | null {
  if (hasRole(shape)) return null;

  let w = 100;
  let h = 100;
  if (editor && typeof editor.getShapePageBounds === 'function') {
    const b = editor.getShapePageBounds(shape);
    if (b) {
      w = b.w;
      h = b.h;
    }
  } else if ((shape.props as any)?.w && (shape.props as any)?.h) {
    w = (shape.props as any).w;
    h = (shape.props as any).h;
  }

  // Frame shape
  if (shape.type === 'frame') {
    return 'page';
  }

  // Text shape
  if (shape.type === 'text') {
    const text = ((shape.props as any)?.text || '').trim();
    const size = (shape.props as any)?.size || 'm';
    if (size === 'xl' || size === 'l' || text.length < 30) {
      return 'heading';
    }
    return 'para';
  }

  // Ellipse / circle
  if (shape.type === 'geo' && (shape.props as any)?.geo === 'ellipse') {
    const aspect = w / (h || 1);
    if (aspect >= 0.8 && aspect <= 1.25 && w <= 120) {
      return 'avatar';
    }
    return 'badge';
  }

  // Small button-like rectangle
  if (shape.type === 'geo' && (shape.props as any)?.geo === 'rectangle') {
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
