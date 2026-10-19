// src/core/__tests__/v52_sim_nondestructive.test.ts
// Phase 4 Gate: Responsive simulation is strictly non-destructive (§4.3)
import { describe, it, expect, vi } from 'vitest';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { computeReflow } from '../reflow';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ReflowPreview } from '../../components/simulation/ReflowPreview';
import { Breakpoint } from '../../components/ui/BreakpointSwitch';

function createMockDriver(initialShapes: CanvasShape[]): {
  driver: CanvasDriver;
  getRawShapes: () => CanvasShape[];
} {
  let shapes = JSON.parse(JSON.stringify(initialShapes)) as CanvasShape[];

  const driver: CanvasDriver = {
    listShapes: vi.fn(async () => JSON.parse(JSON.stringify(shapes))),
    getShape: vi.fn(async (id: string) => shapes.find((s) => s.id === id) || null),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    createShape: vi.fn(async () => 'new_id'),
    updateShape: vi.fn(async (id, patch) => {
      shapes = shapes.map((s) => (s.id === id ? { ...s, ...patch } : s));
    }),
    deleteShape: vi.fn(async (id) => {
      shapes = shapes.filter((s) => s.id !== id);
    }),
    groupShapes: vi.fn(async () => 'grp_id'),
    onShapesChanged: vi.fn(() => () => {}),
    onSelectionChanged: vi.fn(() => () => {}),
    setSelection: vi.fn(),
    panTo: vi.fn(),
    copyToClipboard: vi.fn(async () => {})
  };

  return { driver, getRawShapes: () => shapes };
}

describe('Phase 4: Responsive Simulation Non-destructive Invariance (§4.3)', () => {
  const initialShapes: CanvasShape[] = [
    {
      id: 'page_1',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 1200, h: 800, rotation: 0 },
      parentId: null,
      name: 'Home Page',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'page',
          role: 'page',
          unitId: null,
          parentId: null,
          responsive: null,
          flags: ['responsive'],
          props: { label: 'Home Page', behaviors: ['responsive'] }
        }
      }
    },
    {
      id: 'card_col_1',
      kind: 'rect',
      bounds: { x: 40, y: 80, w: 540, h: 300, rotation: 0 },
      parentId: 'page_1',
      name: 'Left Card',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'card',
          role: 'card',
          unitId: null,
          parentId: null,
          responsive: {
            order: 1,
            primary: true,
            smVisible: 'visible',
            smFullWidth: true,
            tablet: 'stack'
          },
          props: { label: 'Left Card' }
        }
      }
    },
    {
      id: 'card_col_2',
      kind: 'rect',
      bounds: { x: 620, y: 80, w: 540, h: 300, rotation: 0 },
      parentId: 'page_1',
      name: 'Right Card',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'card',
          role: 'card',
          unitId: null,
          parentId: null,
          responsive: {
            order: 2,
            primary: false,
            smVisible: 'visible',
            smFullWidth: true,
            tablet: 'stack'
          },
          props: { label: 'Right Card' }
        }
      }
    },
    {
      id: 'btn_cta',
      kind: 'rect',
      bounds: { x: 80, y: 200, w: 120, h: 40, rotation: 0 },
      parentId: 'card_col_1',
      name: 'Action Button',
      text: 'Submit',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'button',
          role: 'button',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { label: 'Submit' }
        }
      }
    }
  ];

  it('guarantees computeReflow never mutates input shapes at any breakpoint (1200, 768, 375)', () => {
    const originalSnapshot = JSON.stringify(initialShapes);

    const bpList: Breakpoint[] = [1200, 768, 375, 768, 1200, 375];
    for (const bp of bpList) {
      const result = computeReflow({
        shapes: initialShapes,
        width: bp,
        defaultBreakpoint: 768
      });

      // Reflow must produce nodes for the requested viewport width
      expect(result.nodes.length).toBeGreaterThan(0);

      // Input shapes array must remain completely untouched
      expect(JSON.stringify(initialShapes)).toBe(originalSnapshot);
    }
  });

  it('guarantees driver.listShapes() is deep-equal before and after breakpoint switching', async () => {
    const { driver, getRawShapes } = createMockDriver(initialShapes);

    const beforeShapes = await driver.listShapes();
    expect(beforeShapes).toEqual(initialShapes);

    // Render preview across all 3 breakpoints
    const breakpoints: Breakpoint[] = [1200, 768, 375, 1200];

    for (const bp of breakpoints) {
      const html = renderToStaticMarkup(
        React.createElement(ReflowPreview, {
          rootId: 'page_1',
          driver: driver,
          breakpoint: bp,
          initialShapes: initialShapes
        })
      );

      if (bp === 1200) {
        expect(html).toBe('');
      } else {
        expect(html).toContain('data-testid="reflow-preview"');
        expect(html).toContain(`${bp}`);
      }

      // Assert no driver mutation method was ever called
      expect(driver.updateShape).not.toHaveBeenCalled();
      expect(driver.createShape).not.toHaveBeenCalled();
      expect(driver.deleteShape).not.toHaveBeenCalled();

      // Assert current state in driver is strictly deep-equal
      const currentShapes = await driver.listShapes();
      expect(currentShapes).toEqual(beforeShapes);
      expect(getRawShapes()).toEqual(initialShapes);
    }
  });

  it('guarantees 1200 breakpoint renders nothing (canvas looks stock)', () => {
    const { driver } = createMockDriver(initialShapes);
    const html = renderToStaticMarkup(
      React.createElement(ReflowPreview, {
        rootId: 'page_1',
        driver: driver,
        breakpoint: 1200,
        initialShapes: initialShapes
      })
    );
    expect(html).toBe('');
  });

  it('renders dashed guideline and ghost elements for 768 and 375 breakpoints', () => {
    const { driver } = createMockDriver(initialShapes);

    const htmlTablet = renderToStaticMarkup(
      React.createElement(ReflowPreview, {
        rootId: 'page_1',
        driver: driver,
        breakpoint: 768,
        initialShapes: initialShapes
      })
    );
    expect(htmlTablet).toContain('data-testid="reflow-preview"');
    expect(htmlTablet).toContain('border-dashed');
    expect(htmlTablet).toContain('768');

    const htmlMobile = renderToStaticMarkup(
      React.createElement(ReflowPreview, {
        rootId: 'page_1',
        driver: driver,
        breakpoint: 375,
        initialShapes: initialShapes
      })
    );
    expect(htmlMobile).toContain('data-testid="reflow-preview"');
    expect(htmlMobile).toContain('border-dashed');
    expect(htmlMobile).toContain('375');
  });
});
