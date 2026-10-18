import { Editor, createShapeId, TLShapeId } from '@tldraw/tldraw';
import { CanvasDriver, ShapesDiff, Unsubscribe } from '../port/CanvasDriver';
import { CanvasShape, ShapeKind, Viewport } from '../port/CanvasShape';
import { tlShapeToCanvasShape } from './shapeMapping';

export class TldrawDriver implements CanvasDriver {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  get rawEditor(): Editor {
    return this.editor;
  }

  async listShapes(filter?: { ids?: string[]; kinds?: ShapeKind[] }): Promise<CanvasShape[]> {
    const tlShapes = this.editor.getCurrentPageShapes();
    let shapes = tlShapes.map((s) => tlShapeToCanvasShape(s, this.editor));

    if (filter?.ids && filter.ids.length > 0) {
      const idSet = new Set(filter.ids);
      shapes = shapes.filter((s) => idSet.has(s.id));
    }

    if (filter?.kinds && filter.kinds.length > 0) {
      const kindSet = new Set(filter.kinds);
      shapes = shapes.filter((s) => kindSet.has(s.kind));
    }

    return shapes;
  }

  async getShape(id: string): Promise<CanvasShape | null> {
    const s = this.editor.getShape(id as TLShapeId);
    if (!s) return null;
    return tlShapeToCanvasShape(s, this.editor);
  }

  getViewport(): Viewport {
    const bounds = this.editor.getViewportPageBounds();
    const zoom = this.editor.getZoomLevel();
    return {
      x: bounds.x,
      y: bounds.y,
      zoom
    };
  }

  async createShape(s: Omit<CanvasShape, 'id'> & { id?: string }): Promise<string> {
    const id = (s.id as TLShapeId) || createShapeId();
    let type = 'geo';
    const props: Record<string, any> = {
      w: s.bounds.w,
      h: s.bounds.h
    };

    if (s.kind === 'frame') {
      type = 'frame';
      if (s.name) props.name = s.name;
    } else if (s.kind === 'text') {
      type = 'text';
      props.text = s.text || s.name || '';
    } else if (s.kind === 'ellipse') {
      type = 'geo';
      props.geo = 'ellipse';
    } else if (s.kind === 'diamond') {
      type = 'geo';
      props.geo = 'diamond';
    } else {
      type = 'geo';
      props.geo = 'rectangle';
    }

    this.editor.createShape({
      id,
      type,
      x: s.bounds.x,
      y: s.bounds.y,
      rotation: s.bounds.rotation,
      parentId: s.parentId ? (s.parentId as TLShapeId) : undefined,
      props,
      meta: s.meta as any
    });

    return id;
  }

  async updateShape(id: string, patch: Partial<CanvasShape>): Promise<void> {
    const existing = this.editor.getShape(id as TLShapeId);
    if (!existing) return;

    const updatePayload: Record<string, any> = {
      id: existing.id,
      type: existing.type
    };

    if (patch.bounds) {
      updatePayload.x = patch.bounds.x;
      updatePayload.y = patch.bounds.y;
      updatePayload.rotation = patch.bounds.rotation;
      updatePayload.props = {
        ...existing.props,
        w: patch.bounds.w,
        h: patch.bounds.h
      };
    }

    if (patch.meta) {
      updatePayload.meta = {
        ...existing.meta,
        ...patch.meta
      };
    }

    if (patch.text !== undefined && existing.type === 'text') {
      updatePayload.props = {
        ...(updatePayload.props || existing.props),
        text: patch.text
      };
    }

    if (patch.name !== undefined && existing.type === 'frame') {
      updatePayload.props = {
        ...(updatePayload.props || existing.props),
        name: patch.name
      };
    }

    if (patch.parentId !== undefined) {
      updatePayload.parentId = patch.parentId ? (patch.parentId as TLShapeId) : undefined;
    }

    this.editor.updateShape(updatePayload as any);
  }

  async deleteShape(id: string): Promise<void> {
    this.editor.deleteShapes([id as TLShapeId]);
  }

  async groupShapes(ids: string[]): Promise<string> {
    this.editor.setSelectedShapes(ids as TLShapeId[]);
    this.editor.groupShapes(ids as TLShapeId[]);
    const selected = this.editor.getSelectedShapes();
    const group = selected.find((s) => s.type === 'group');
    return group ? group.id : ids[0];
  }

  onShapesChanged(cb: (diff: ShapesDiff) => void): Unsubscribe {
    return this.editor.store.listen((entry) => {
      const created: string[] = [];
      const updated: string[] = [];
      const deleted: string[] = [];

      for (const [id, change] of Object.entries(entry.changes.added)) {
        if ((change as any).typeName === 'shape') {
          created.push(id);
        }
      }

      for (const [id, change] of Object.entries(entry.changes.updated)) {
        if ((change[1] as any).typeName === 'shape') {
          updated.push(id);
        }
      }

      for (const [id, record] of Object.entries(entry.changes.removed)) {
        if ((record as any).typeName === 'shape') {
          deleted.push(id);
        }
      }

      if (created.length > 0 || updated.length > 0 || deleted.length > 0) {
        cb({ created, updated, deleted });
      }
    });
  }

  onSelectionChanged(cb: (ids: string[]) => void): Unsubscribe {
    let lastSelectedIds: string[] = this.editor.getSelectedShapeIds();

    return this.editor.store.listen(() => {
      const currentIds = this.editor.getSelectedShapeIds();
      const hasChanged =
        currentIds.length !== lastSelectedIds.length ||
        currentIds.some((id, idx) => id !== lastSelectedIds[idx]);

      if (hasChanged) {
        lastSelectedIds = currentIds;
        cb(currentIds);
      }
    });
  }

  setSelection(ids: string[]): void {
    this.editor.setSelectedShapes(ids as TLShapeId[]);
  }

  panTo(id: string): void {
    const shape = this.editor.getShape(id as TLShapeId);
    if (shape) {
      this.editor.setSelectedShapes([shape.id]);
      try {
        (this.editor as any).zoomToSelection?.({ animation: { duration: 200 } });
      } catch {
        // fallback
      }
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }
}
