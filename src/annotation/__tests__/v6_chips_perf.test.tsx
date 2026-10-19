import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ChipsOverlay } from '../ChipsOverlay';
import { CanvasDriver, ShapesDiff } from '../../canvas/port/CanvasDriver';
import { CanvasShape } from '../../canvas/port/CanvasShape';

describe('v6 Defect 7: Inspector refresh loop & overlay diffing (§1.2.7)', () => {
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;
  let originalActEnv: typeof globalThis.IS_REACT_ACT_ENVIRONMENT;

  function makeNode(name = 'div') {
    const listeners: Record<string, ((...args: any[]) => void)[]> = {};
    return {
      nodeType: 1,
      nodeName: name.toUpperCase(),
      tagName: name.toUpperCase(),
      style: {},
      childNodes: [] as any[],
      children: [] as any[],
      addEventListener(evt: string, fn: (...args: any[]) => void) {
        (listeners[evt] = listeners[evt] || []).push(fn);
      },
      removeEventListener(evt: string, fn: (...args: any[]) => void) {
        if (listeners[evt]) listeners[evt] = listeners[evt].filter((f) => f !== fn);
      },
      appendChild(c: any) {
        this.childNodes.push(c);
        this.children.push(c);
        return c;
      },
      removeChild(c: any) {
        this.childNodes = this.childNodes.filter((x) => x !== c);
        this.children = this.children.filter((x) => x !== c);
        return c;
      },
      insertBefore(c: any) {
        this.childNodes.push(c);
        this.children.push(c);
        return c;
      },
      setAttribute() {},
      removeAttribute() {},
      getAttribute() {
        return null;
      }
    };
  }

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    originalActEnv = globalThis.IS_REACT_ACT_ENVIRONMENT;

    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    class FakeElement {}
    class FakeIFrame extends FakeElement {}

    globalThis.window = {
      addEventListener() {},
      removeEventListener() {},
      HTMLIFrameElement: FakeIFrame,
      Element: FakeElement,
      HTMLElement: FakeElement,
      Node: FakeElement
    } as any;

    globalThis.document = {
      nodeType: 9,
      defaultView: globalThis.window,
      activeElement: null,
      createElement(tag: string) {
        const n = makeNode(tag);
        (n as any).ownerDocument = globalThis.document;
        return n;
      },
      createElementNS(_ns: string, tag: string) {
        const n = makeNode(tag);
        (n as any).ownerDocument = globalThis.document;
        return n;
      },
      createTextNode(text: string) {
        return { nodeType: 3, textContent: text, ownerDocument: globalThis.document } as any;
      },
      createComment(data: string) {
        return { nodeType: 8, data, ownerDocument: globalThis.document } as any;
      },
      addEventListener() {},
      removeEventListener() {}
    } as any;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnv;
  });

  it.fails(
    'updating 1 shape out of 200 touches only 1 chip and does not re-query listShapes (§1.2.7 RED REPRO)',
    async () => {
      const shapes: CanvasShape[] = [];
      const shapesMap = new Map<string, CanvasShape>();

      for (let i = 0; i < 200; i++) {
        const shape: CanvasShape = {
          id: `shape-${i}`,
          kind: 'rect',
          bounds: { x: (i % 20) * 100, y: Math.floor(i / 20) * 100, w: 80, h: 40, rotation: 0 },
          parentId: null,
          name: `Shape ${i}`,
          text: null,
          arrowEndpoints: null,
          meta: {
            markdraw: {
              schema: 1,
              role: 'button',
              unitId: null,
              parentId: null,
              responsive: null,
              props: {}
            }
          }
        };
        shapes.push(shape);
        shapesMap.set(shape.id, shape);
      }

      let shapesChangedCb: ((diff: ShapesDiff) => void) | null = null;

      const driver: CanvasDriver = {
        listShapes: vi.fn(async () => Array.from(shapesMap.values())),
        getShape: vi.fn(async (id: string) => shapesMap.get(id) || null),
        getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
        createShape: vi.fn(async () => 'new_id'),
        updateShape: vi.fn(async () => {}),
        deleteShape: vi.fn(async () => {}),
        groupShapes: vi.fn(async () => 'group_id'),
        onShapesChanged: vi.fn((cb) => {
          shapesChangedCb = cb;
          return () => {
            shapesChangedCb = null;
          };
        }),
        onSelectionChanged: vi.fn(() => () => {}),
        onViewportChanged: vi.fn(() => () => {}),
        setSelection: vi.fn(),
        panTo: vi.fn(),
        copyToClipboard: vi.fn(async () => {})
      };

      const renderSpy = vi.fn();
      const container = globalThis.document.createElement('div') as any;
      const root = createRoot(container);

      await act(async () => {
        root.render(
          <ChipsOverlay
            driver={driver}
            showChips={true}
            initialShapes={shapes}
            onChipRender={renderSpy}
          />
        );
      });

      // Initial render should have rendered all 200 shapes
      expect(renderSpy).toHaveBeenCalledTimes(200);

      // Clear spy and listShapes mock counts
      renderSpy.mockClear();
      (driver.listShapes as any).mockClear();

      // Update 1 shape in the store
      const updatedShape = {
        ...shapesMap.get('shape-42')!,
        name: 'Updated Shape 42'
      };
      shapesMap.set('shape-42', updatedShape);

      // Fire granular diff onShapesChanged
      await act(async () => {
        shapesChangedCb?.({
          created: [],
          updated: ['shape-42'],
          deleted: []
        });
      });

      // Assert:
      // 1. driver.listShapes was NOT called (we diffed, not re-queried everything)
      expect(driver.listShapes).not.toHaveBeenCalled();

      // 2. Overlay re-render touched only 1 chip (shape-42)
      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(renderSpy).toHaveBeenCalledWith('shape-42');
    }
  );
});
