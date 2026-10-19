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
    const props = shape.props as Record<string, unknown> | undefined;
    const geo = typeof props?.geo === 'string' ? props.geo : undefined;
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
  const props = shape.props as Record<string, unknown> | undefined;
  let w = typeof props?.w === 'number' ? props.w : 100;
  let h = typeof props?.h === 'number' ? props.h : 100;
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

  const text = typeof props?.text === 'string' ? props.text : null;
  const name =
    typeof props?.name === 'string'
      ? props.name
      : typeof props?.title === 'string'
      ? props.title
      : null;

  let arrowEndpoints: { start: string | null; end: string | null } | null = null;
  if (shape.type === 'arrow') {
    const start = props?.start as Record<string, unknown> | undefined;
    const end = props?.end as Record<string, unknown> | undefined;
    arrowEndpoints = {
      start: typeof start?.boundShapeId === 'string' ? start.boundShapeId : null,
      end: typeof end?.boundShapeId === 'string' ? end.boundShapeId : null
    };
  }

  const meta = (shape.meta as Record<string, unknown>) || {};

  return {
    id: shape.id,
    kind,
    bounds: { x, y, w, h, rotation },
    parentId,
    name,
    text,
    arrowEndpoints,
    meta
  };
}
