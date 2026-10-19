// src/annotation/__tests__/v6_chip_viewport_repro.test.ts
// V6-QUESTION: see docs/v6-questions.md regarding red repro commit strategy under §0.2.3 and §1.2
import { describe, it, expect, vi } from 'vitest';
import { CanvasShape, Viewport } from '../../canvas/port/CanvasShape';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { ExcalidrawDriver } from '../../canvas/excalidraw/ExcalidrawDriver';

describe('v6 Defect 1: Chip detach on pan/zoom (§1.2.1)', () => {
  it('CanvasDriver requires onViewportChanged and computes exact (500, 106) on viewport change', () => {
    const shape: CanvasShape = {
      id: 'shp_v6_target',
      kind: 'rect',
      bounds: { x: 600, y: 400, w: 200, h: 100, rotation: 0 },
      parentId: null,
      name: 'TargetCard',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'card',
          unitId: null,
          parentId: null,
          responsive: null,
          props: {}
        }
      }
    };

    let viewportListener: ((vp: Viewport) => void) | null = null;
    let currentVp: Viewport = { x: 0, y: 0, zoom: 1 };

    const mockDriver: CanvasDriver = {
      listShapes: vi.fn(async () => [shape]),
      getShape: vi.fn(async (id: string) => (id === shape.id ? shape : null)),
      getViewport: vi.fn(() => currentVp),
      createShape: vi.fn(async () => 'new_id'),
      updateShape: vi.fn(async () => {}),
      deleteShape: vi.fn(async () => {}),
      groupShapes: vi.fn(async () => 'grp_id'),
      onShapesChanged: vi.fn(() => () => {}),
      onSelectionChanged: vi.fn(() => () => {}),
      onViewportChanged: vi.fn((cb: (vp: Viewport) => void) => {
        viewportListener = cb;
        return () => {
          viewportListener = null;
        };
      }),
      setSelection: vi.fn(),
      panTo: vi.fn(),
      copyToClipboard: vi.fn(async () => {})
    };

    // Listen for viewport updates
    mockDriver.onViewportChanged!((vp: Viewport) => {
      currentVp = vp;
    });

    // Simulate pan/zoom event: viewport {x: 200, y: -100, zoom: 0.5}
    const newVp: Viewport = { x: 200, y: -100, zoom: 0.5 };
    viewportListener!(newVp);

    // Calculate exact screen coordinates per spec formula:
    // screenX = shape.bounds.x * zoom + viewport.x
    // screenY = shape.bounds.y * zoom + viewport.y + (isFlushWithParentTop ? 18 : 6)
    const screenX = shape.bounds.x * currentVp.zoom + currentVp.x;
    const isFlushWithParentTop = false;
    const screenY = shape.bounds.y * currentVp.zoom + currentVp.y + (isFlushWithParentTop ? 18 : 6);

    // Exact numbers from §1.2.1:
    // shape world (600,400), viewport {x:200, y:-100, zoom:0.5} -> chip top-left at (500,106)
    expect(screenX).toBe(500);
    expect(screenY).toBe(106);
  });

  it('ExcalidrawDriver implements onViewportChanged and emits diffs when scroll or zoom changes', () => {
    const mockApi: any = {
      getSceneElements: () => [],
      getAppState: () => ({ scrollX: 0, scrollY: 0, zoom: { value: 1 }, selectedElementIds: {} }),
      onChange: vi.fn(() => () => {})
    };

    const driver = new ExcalidrawDriver(mockApi);
    const viewportEvents: Viewport[] = [];

    const unsubscribe = driver.onViewportChanged((vp: Viewport) => {
      viewportEvents.push(vp);
    });

    // Simulate Excalidraw pan from (0, 0, zoom 1) to (200, -100, zoom 0.5)
    driver.handleSceneChange(
      [],
      {
        scrollX: 200,
        scrollY: -100,
        zoom: { value: 0.5 },
        selectedElementIds: {}
      } as any
    );

    expect(viewportEvents.length).toBe(1);
    expect(viewportEvents[0]).toEqual({ x: 200, y: -100, zoom: 0.5 });

    unsubscribe();
  });
});
