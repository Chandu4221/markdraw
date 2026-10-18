// CanvasShape.ts — MARKDRAW'S OWN MODEL. Never a vendor type.
export type ShapeKind =
  | 'frame'
  | 'group'
  | 'rect'
  | 'ellipse'
  | 'diamond'
  | 'text'
  | 'arrow'
  | 'line'
  | 'path'
  | 'image';

export interface CanvasShape {
  id: string;
  kind: ShapeKind;
  bounds: { x: number; y: number; w: number; h: number; rotation: number };
  parentId: string | null;
  name: string | null;
  text: string | null; // for text shapes / labels
  arrowEndpoints: { start: string | null; end: string | null } | null; // arrow only
  meta: Record<string, unknown>; // OPAQUE — annotation layer owns meta.markdraw parsing
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
