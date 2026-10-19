import type { ExcalidrawImperativeAPI, AppState } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { CanvasDriver, ShapesDiff, Unsubscribe } from '../port/CanvasDriver';
import { CanvasShape, ShapeKind, Viewport } from '../port/CanvasShape';
import {
  excalidrawElementToCanvasShape,
  canvasShapeToPartialExcalidrawElement
} from './shapeMapping';

export class ExcalidrawDriver implements CanvasDriver {
  private api: ExcalidrawImperativeAPI;
  private shapeListeners: ((diff: ShapesDiff) => void)[] = [];
  private selectionListeners: ((ids: string[]) => void)[] = [];
  private previousElements: Map<string, ExcalidrawElement> = new Map();
  private previousSelectedIds: Set<string> = new Set();
  private unsubscribeOnChange: Unsubscribe | null = null;

  constructor(api: ExcalidrawImperativeAPI) {
    this.api = api;
    this.initializeSnapshot();
    this.bindOnChange();
  }

  get rawApi(): ExcalidrawImperativeAPI {
    return this.api;
  }

  private initializeSnapshot(): void {
    const current = this.api.getSceneElements();
    this.previousElements.clear();
    for (const el of current) {
      if (!el.isDeleted) {
        this.previousElements.set(el.id, el);
      }
    }

    const state = this.api.getAppState();
    this.previousSelectedIds = new Set(
      Object.keys(state.selectedElementIds || {}).filter((id) => state.selectedElementIds[id])
    );
  }

  private bindOnChange(): void {
    this.unsubscribeOnChange = this.api.onChange((elements, state) => {
      this.handleSceneChange(elements, state);
    });
  }

  public dispose(): void {
    if (this.unsubscribeOnChange) {
      this.unsubscribeOnChange();
      this.unsubscribeOnChange = null;
    }
    this.shapeListeners = [];
    this.selectionListeners = [];
  }

  public handleSceneChange(
    elements: readonly ExcalidrawElement[],
    state?: AppState
  ): void {
    const currentNonDeleted = new Map<string, ExcalidrawElement>();
    for (const el of elements) {
      if (!el.isDeleted) {
        currentNonDeleted.set(el.id, el);
      }
    }

    const created: string[] = [];
    const updated: string[] = [];
    const deleted: string[] = [];

    // Check for created and updated
    for (const [id, el] of currentNonDeleted) {
      const prev = this.previousElements.get(id);
      if (!prev) {
        created.push(id);
      } else if (
        prev.version !== el.version ||
        prev.x !== el.x ||
        prev.y !== el.y ||
        prev.width !== el.width ||
        prev.height !== el.height ||
        prev.angle !== el.angle ||
        prev.frameId !== el.frameId ||
        prev.customData !== el.customData
      ) {
        updated.push(id);
      }
    }

    // Check for deleted
    for (const [id] of this.previousElements) {
      if (!currentNonDeleted.has(id)) {
        deleted.push(id);
      }
    }

    this.previousElements = currentNonDeleted;

    if (created.length > 0 || updated.length > 0 || deleted.length > 0) {
      const diff: ShapesDiff = { created, updated, deleted };
      this.shapeListeners.forEach((cb) => {
        try {
          cb(diff);
        } catch (err) {
          console.error('[ExcalidrawDriver] Error in shape listener:', err);
        }
      });
    }

    // Selection changes
    const selectedMap = state?.selectedElementIds ?? this.api.getAppState()?.selectedElementIds ?? {};
    const currentSelected = new Set(
      Object.keys(selectedMap).filter((id) => selectedMap[id])
    );

    let selectionChanged = currentSelected.size !== this.previousSelectedIds.size;
    if (!selectionChanged) {
      for (const id of currentSelected) {
        if (!this.previousSelectedIds.has(id)) {
          selectionChanged = true;
          break;
        }
      }
    }

    if (selectionChanged) {
      this.previousSelectedIds = currentSelected;
      const selectedList = Array.from(currentSelected);
      this.selectionListeners.forEach((cb) => {
        try {
          cb(selectedList);
        } catch (err) {
          console.error('[ExcalidrawDriver] Error in selection listener:', err);
        }
      });
    }
  }

  async listShapes(filter?: { ids?: string[]; kinds?: ShapeKind[] }): Promise<CanvasShape[]> {
    const rawElements = this.api.getSceneElements();
    let shapes = rawElements
      .filter((el) => !el.isDeleted)
      .map((el) => excalidrawElementToCanvasShape(el, rawElements));

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
    const rawElements = this.api.getSceneElements();
    const el = rawElements.find((e) => e.id === id && !e.isDeleted);
    if (!el) return null;
    return excalidrawElementToCanvasShape(el, rawElements);
  }

  getViewport(): Viewport {
    const state = this.api.getAppState();
    return {
      x: state.scrollX,
      y: state.scrollY,
      zoom: state.zoom.value
    };
  }

  async createShape(s: Omit<CanvasShape, 'id'> & { id?: string }): Promise<string> {
    const id = s.id || `shape_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fullShape: CanvasShape = { ...s, id };
    const partial = canvasShapeToPartialExcalidrawElement(fullShape);

    const newElement: any = {
      // v5-token-exception: excalidraw element default stroke
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      ...partial
    };

    const current = this.api.getSceneElements();
    this.api.updateScene({
      elements: [...current, newElement]
    });

    return id;
  }

  async updateShape(id: string, patch: Partial<CanvasShape>): Promise<void> {
    const current = this.api.getSceneElements();
    let found = false;

    const nextElements = current.map((el) => {
      if (el.id !== id || el.isDeleted) return el;
      found = true;

      const currentShape = excalidrawElementToCanvasShape(el, current);
      const mergedShape: CanvasShape = {
        ...currentShape,
        ...patch,
        bounds: patch.bounds ? { ...currentShape.bounds, ...patch.bounds } : currentShape.bounds,
        meta: patch.meta ? { ...currentShape.meta, ...patch.meta } : currentShape.meta
      };

      const partial = canvasShapeToPartialExcalidrawElement(mergedShape);
      return {
        ...el,
        ...partial,
        version: el.version + 1,
        versionNonce: Math.floor(Math.random() * 100000),
        updated: Date.now()
      };
    });

    if (found) {
      this.api.updateScene({ elements: nextElements as any });
    }
  }

  async deleteShape(id: string): Promise<void> {
    const current = this.api.getSceneElements();
    const nextElements = current.map((el) => {
      if (el.id === id) {
        return {
          ...el,
          isDeleted: true,
          updated: Date.now(),
          version: el.version + 1
        };
      }
      return el;
    });

    this.api.updateScene({ elements: nextElements as any });
  }

  async groupShapes(ids: string[]): Promise<string> {
    const idSet = new Set(ids);
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const current = this.api.getSceneElements();

    const nextElements = current.map((el) => {
      if (idSet.has(el.id)) {
        return {
          ...el,
          groupIds: [groupId, ...el.groupIds],
          version: el.version + 1,
          updated: Date.now()
        };
      }
      return el;
    });

    this.api.updateScene({ elements: nextElements as any });
    return `virtual:${groupId}`;
  }

  onShapesChanged(cb: (diff: ShapesDiff) => void): Unsubscribe {
    this.shapeListeners.push(cb);
    return () => {
      this.shapeListeners = this.shapeListeners.filter((l) => l !== cb);
    };
  }

  onSelectionChanged(cb: (ids: string[]) => void): Unsubscribe {
    this.selectionListeners.push(cb);
    try {
      const state = this.api.getAppState();
      const current = Object.keys(state?.selectedElementIds || {}).filter(
        (id) => state.selectedElementIds[id]
      );
      cb(current);
    } catch {}
    return () => {
      this.selectionListeners = this.selectionListeners.filter((l) => l !== cb);
    };
  }

  setSelection(ids: string[]): void {
    const selectedElementIds: Record<string, true> = {};
    for (const id of ids) {
      selectedElementIds[id] = true;
    }
    this.api.updateScene({
      appState: {
        selectedElementIds
      }
    });
  }

  panTo(id: string): void {
    const current = this.api.getSceneElements();
    const el = current.find((e) => e.id === id && !e.isDeleted);
    if (!el) return;
    this.api.scrollToContent([el]);
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }
}
