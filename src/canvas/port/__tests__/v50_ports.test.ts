import { describe, it, expect, vi } from 'vitest';
import { CanvasDriver, ShapesDiff } from '../CanvasDriver';
import { CanvasShape } from '../CanvasShape';
import { tldrawSceneToStoredDocument } from '../../tldraw/v5-export.tldraw';
import { tlShapeToCanvasShape } from '../../tldraw/shapeMapping';

class MockDriver implements CanvasDriver {
  shapes: Map<string, CanvasShape> = new Map();
  selectedIds: string[] = [];
  changeListeners: ((diff: ShapesDiff) => void)[] = [];
  selectionListeners: ((ids: string[]) => void)[] = [];

  async listShapes(filter?: { ids?: string[]; kinds?: any[] }): Promise<CanvasShape[]> {
    let list = Array.from(this.shapes.values());
    if (filter?.ids) {
      const set = new Set(filter.ids);
      list = list.filter((s) => set.has(s.id));
    }
    if (filter?.kinds) {
      const set = new Set(filter.kinds);
      list = list.filter((s) => set.has(s.kind));
    }
    return list;
  }

  async getShape(id: string): Promise<CanvasShape | null> {
    return this.shapes.get(id) || null;
  }

  getViewport() {
    return { x: 0, y: 0, zoom: 1 };
  }

  async createShape(s: Omit<CanvasShape, 'id'> & { id?: string }): Promise<string> {
    const id = s.id || `shape_${Date.now()}_${Math.random()}`;
    const shape: CanvasShape = { ...s, id };
    this.shapes.set(id, shape);
    this.changeListeners.forEach((cb) =>
      cb({ created: [id], updated: [], deleted: [] })
    );
    return id;
  }

  async updateShape(id: string, patch: Partial<CanvasShape>): Promise<void> {
    const existing = this.shapes.get(id);
    if (existing) {
      this.shapes.set(id, { ...existing, ...patch });
      this.changeListeners.forEach((cb) =>
        cb({ created: [], updated: [id], deleted: [] })
      );
    }
  }

  async deleteShape(id: string): Promise<void> {
    if (this.shapes.has(id)) {
      this.shapes.delete(id);
      this.changeListeners.forEach((cb) =>
        cb({ created: [], updated: [], deleted: [id] })
      );
    }
  }

  async groupShapes(ids: string[]): Promise<string> {
    const groupId = `group_${Date.now()}`;
    for (const id of ids) {
      const s = this.shapes.get(id);
      if (s) {
        this.shapes.set(id, { ...s, parentId: groupId });
      }
    }
    return groupId;
  }

  onShapesChanged(cb: (diff: ShapesDiff) => void) {
    this.changeListeners.push(cb);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== cb);
    };
  }

  onSelectionChanged(cb: (ids: string[]) => void) {
    this.selectionListeners.push(cb);
    return () => {
      this.selectionListeners = this.selectionListeners.filter((l) => l !== cb);
    };
  }

  setSelection(ids: string[]): void {
    this.selectedIds = ids;
    this.selectionListeners.forEach((cb) => cb(ids));
  }

  panTo(_id: string): void {}

  async copyToClipboard(_text: string): Promise<void> {}
}

describe('v5.0 Ports & Adapter Architecture (§3)', () => {
  it('conforms to CanvasDriver contract for CRUD operations', async () => {
    const driver = new MockDriver();

    const shapeId = await driver.createShape({
      kind: 'frame',
      bounds: { x: 10, y: 20, w: 400, h: 300, rotation: 0 },
      parentId: null,
      name: 'Test Page',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'page' } }
    });

    expect(shapeId).toBeDefined();

    const shape = await driver.getShape(shapeId);
    expect(shape).not.toBeNull();
    expect(shape?.kind).toBe('frame');
    expect(shape?.name).toBe('Test Page');
    expect(shape?.bounds.w).toBe(400);

    // Update shape
    await driver.updateShape(shapeId, { name: 'Renamed Page' });
    const updated = await driver.getShape(shapeId);
    expect(updated?.name).toBe('Renamed Page');

    // List shapes with filters
    const all = await driver.listShapes();
    expect(all.length).toBe(1);

    const filtered = await driver.listShapes({ kinds: ['rect'] });
    expect(filtered.length).toBe(0);

    const matchFilter = await driver.listShapes({ kinds: ['frame'] });
    expect(matchFilter.length).toBe(1);

    // Delete shape
    await driver.deleteShape(shapeId);
    const deleted = await driver.getShape(shapeId);
    expect(deleted).toBeNull();
  });

  it('notifies listeners on shape changes with granular diffs', async () => {
    const driver = new MockDriver();
    const diffLog: ShapesDiff[] = [];

    driver.onShapesChanged((diff) => {
      diffLog.push(diff);
    });

    const s1 = await driver.createShape({
      kind: 'rect',
      bounds: { x: 0, y: 0, w: 100, h: 50, rotation: 0 },
      parentId: null,
      name: null,
      text: null,
      arrowEndpoints: null,
      meta: {}
    });

    await driver.updateShape(s1, { bounds: { x: 5, y: 5, w: 100, h: 50, rotation: 0 } });
    await driver.deleteShape(s1);

    expect(diffLog.length).toBe(3);
    expect(diffLog[0].created).toEqual([s1]);
    expect(diffLog[1].updated).toEqual([s1]);
    expect(diffLog[2].deleted).toEqual([s1]);
  });

  it('notifies listeners on selection changes', () => {
    const driver = new MockDriver();
    const selectionSpy = vi.fn();

    driver.onSelectionChanged(selectionSpy);
    driver.setSelection(['shape:1', 'shape:2']);

    expect(selectionSpy).toHaveBeenCalledWith(['shape:1', 'shape:2']);
  });

  it('correctly maps tldraw shapes to neutral CanvasShape', () => {
    const mockTlShape: any = {
      id: 'shape:box1',
      type: 'geo',
      x: 100,
      y: 150,
      parentId: 'shape:parent_frame',
      props: {
        geo: 'rectangle',
        w: 240,
        h: 80,
        text: 'Action Button'
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'button',
          props: { variant: 'solid' }
        }
      }
    };

    const canvasShape = tlShapeToCanvasShape(mockTlShape);
    expect(canvasShape.id).toBe('shape:box1');
    expect(canvasShape.kind).toBe('rect');
    expect(canvasShape.parentId).toBe('shape:parent_frame');
    expect(canvasShape.bounds).toEqual({ x: 100, y: 150, w: 240, h: 80, rotation: 0 });
    expect(canvasShape.text).toBe('Action Button');
    expect(canvasShape.meta).toHaveProperty('markdraw');
  });

  it('converts tldraw scenes to vendor-neutral StoredDocument format', () => {
    const mockShapes: any[] = [
      {
        id: 'shape:page',
        type: 'frame',
        x: 0,
        y: 0,
        parentId: 'page:home',
        props: { name: 'Home Viewport', w: 1200, h: 800 },
        meta: { markdraw: { schema: 1, role: 'page' } }
      },
      {
        id: 'shape:btn',
        type: 'geo',
        x: 50,
        y: 50,
        parentId: 'shape:page',
        props: { geo: 'rectangle', w: 120, h: 40, text: 'Login' },
        meta: { markdraw: { schema: 1, role: 'button' } }
      }
    ];

    const storedDoc = tldrawSceneToStoredDocument(mockShapes, [
      {
        id: 'u_nav',
        name: 'Navbar Unit',
        tag: 'Navbar Unit',
        baseRole: 'navbar',
        memberRoles: ['button'],
        createdAt: 1000,
        updatedAt: 2000
      }
    ]);

    expect(storedDoc.schema).toBe(1);
    expect(storedDoc.docVersion).toBe(1);
    expect(storedDoc.shapes.length).toBe(2);
    expect(storedDoc.shapes[0].kind).toBe('frame');
    expect(storedDoc.shapes[0].parentId).toBeNull(); // page:home stripped to null
    expect(storedDoc.shapes[1].kind).toBe('rect');
    expect(storedDoc.shapes[1].parentId).toBe('shape:page');
    expect(storedDoc.units.length).toBe(1);
    expect(storedDoc.units[0].name).toBe('Navbar Unit');
  });
});
