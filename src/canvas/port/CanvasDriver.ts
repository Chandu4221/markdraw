import { CanvasShape, ShapeKind, Viewport } from './CanvasShape';

export type Unsubscribe = () => void;

export interface ShapesDiff {
  created: string[];
  updated: string[];
  deleted: string[];
}

export interface CanvasDriver {
  // reads
  listShapes(filter?: { ids?: string[]; kinds?: ShapeKind[] }): Promise<CanvasShape[]>;
  getShape(id: string): Promise<CanvasShape | null>;
  getViewport(): Viewport;

  // writes
  createShape(s: Omit<CanvasShape, 'id'> & { id?: string }): Promise<string>;
  updateShape(id: string, patch: Partial<CanvasShape>): Promise<void>;
  deleteShape(id: string): Promise<void>;
  groupShapes(ids: string[]): Promise<string>; // returns new group id

  // events — granular diffs, the ONLY change channel
  onShapesChanged(cb: (diff: ShapesDiff) => void): Unsubscribe;
  onSelectionChanged(cb: (ids: string[]) => void): Unsubscribe;
  onViewportChanged(cb: (vp: Viewport) => void): Unsubscribe;

  // ui commands
  setSelection(ids: string[]): void;
  panTo(id: string): void;
  copyToClipboard(text: string): Promise<void>;
}
