import { TLShape, Editor } from '../../core/types';
import { CanvasShape, ShapeKind } from '../port/CanvasShape';

export function mapTlShapeTypeToKind(shape: TLShape): ShapeKind {
  const type = shape.type;
  if (type === 'frame') return 'frame';
  if (type === 'group') return 'group';
  if (type === 'text') return 'text';
  if (type === 'arrow') return 'arrow';
  if (type === 'line') return 'line';
  if (type === 'draw') return 'path';
  if (type === 'image') return 'image';
  if (type === 'geo') {
    const geo = (shape.props as any)?.geo;
    if (geo === 'ellipse' || geo === 'oval') return 'ellipse';
    if (geo === 'diamond' || geo === 'rhombus') return 'diamond';
    return 'rect';
  }
  return 'rect';
}

export function tlShapeToCanvasShape(shape: TLShape, editor?: Editor): CanvasShape {
  const kind = mapTlShapeTypeToKind(shape);

  let x = shape.x;
  let y = shape.y;
  let w = (shape.props as any)?.w ?? 100;
  let h = (shape.props as any)?.h ?? 100;
  const rotation = shape.rotation ?? 0;

  if (editor) {
    try {
      const pageBounds = editor.getShapePageBounds(shape.id);
      if (pageBounds) {
        x = pageBounds.x;
        y = pageBounds.y;
        w = pageBounds.w;
        h = pageBounds.h;
      }
    } catch {
      // fallback to shape coordinate properties
    }
  }

  const parentId =
    !shape.parentId || shape.parentId.startsWith('page:')
      ? null
      : shape.parentId;

  const text = (shape.props as any)?.text ?? null;
  const name = (shape.props as any)?.name ?? (shape.props as any)?.title ?? null;

  let arrowEndpoints: { start: string | null; end: string | null } | null = null;
  if (shape.type === 'arrow') {
    const start = (shape.props as any)?.start;
    const end = (shape.props as any)?.end;
    arrowEndpoints = {
      start: start?.boundShapeId ?? null,
      end: end?.boundShapeId ?? null
    };
  }

  return {
    id: shape.id,
    kind,
    bounds: { x, y, w, h, rotation },
    parentId,
    name,
    text,
    arrowEndpoints,
    meta: (shape.meta as Record<string, unknown>) || {}
  };
}
