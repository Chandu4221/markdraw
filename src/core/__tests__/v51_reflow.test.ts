// src/core/__tests__/v51_reflow.test.ts
import { describe, it, expect } from 'vitest';
import { computeReflow, ReflowInput } from '../reflow';
import { CanvasShape } from '../../canvas/port/CanvasShape';

describe('Phase 4: Responsive Simulation Reflow Engine (§4.1)', () => {
  it('fixture (a): two 50% columns stay side-by-side above breakpoint and stack vertically below', () => {
    const frame: CanvasShape = {
      id: 'frame_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
      parentId: null,
      name: 'Root Frame',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'page' } }
    };

    const colA: CanvasShape = {
      id: 'col_a',
      kind: 'rect',
      bounds: { x: 0, y: 0, w: 180, h: 200, rotation: 0 },
      parentId: 'frame_root',
      name: 'Column A',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'card' } }
    };

    const colB: CanvasShape = {
      id: 'col_b',
      kind: 'rect',
      bounds: { x: 180, y: 0, w: 180, h: 200, rotation: 0 },
      parentId: 'frame_root',
      name: 'Column B',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'card' } }
    };

    const shapes = [frame, colA, colB];

    // 1. Above breakpoint (desktop: width 1024 >= 768)
    const aboveResult = computeReflow({
      shapes,
      width: 1024,
      defaultBreakpoint: 768
    });

    const nodeAAbove = aboveResult.nodes.find((n) => n.shapeId === 'col_a');
    const nodeBAbove = aboveResult.nodes.find((n) => n.shapeId === 'col_b');

    expect(nodeAAbove).toBeDefined();
    expect(nodeBAbove).toBeDefined();
    // Side by side, original bounds
    expect(nodeAAbove?.x).toBe(0);
    expect(nodeAAbove?.y).toBe(0);
    expect(nodeAAbove?.w).toBe(180);
    expect(nodeAAbove?.h).toBe(200);
    expect(nodeAAbove?.state).toBe('normal');

    expect(nodeBAbove?.x).toBe(180);
    expect(nodeBAbove?.y).toBe(0);
    expect(nodeBAbove?.w).toBe(180);
    expect(nodeBAbove?.h).toBe(200);
    expect(nodeBAbove?.state).toBe('normal');

    // 2. Below breakpoint (mobile: width 360 < 768)
    const belowResult = computeReflow({
      shapes,
      width: 360,
      defaultBreakpoint: 768
    });

    const nodeABelow = belowResult.nodes.find((n) => n.shapeId === 'col_a');
    const nodeBBelow = belowResult.nodes.find((n) => n.shapeId === 'col_b');

    expect(nodeABelow).toBeDefined();
    expect(nodeBBelow).toBeDefined();

    // Hand-calculated numbers:
    // colA: x = 0, y = 0, w = 360, h = 200
    expect(nodeABelow?.x).toBe(0);
    expect(nodeABelow?.y).toBe(0);
    expect(nodeABelow?.w).toBe(360);
    expect(nodeABelow?.h).toBe(200);

    // colB stacks below with 8px gap: y = 200 + 8 = 208, w = 360, h = 200
    expect(nodeBBelow?.x).toBe(0);
    expect(nodeBBelow?.y).toBe(208);
    expect(nodeBBelow?.w).toBe(360);
    expect(nodeBBelow?.h).toBe(200);
  });

  it('fixture (b): order respected (primary and explicit numeric order override spatial placement)', () => {
    const frame: CanvasShape = {
      id: 'frame_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
      parentId: null,
      name: 'Root Frame',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'page' } }
    };

    // Item 1 is spatially first (x=0) but has order: 2
    const item1: CanvasShape = {
      id: 'item_1',
      kind: 'rect',
      bounds: { x: 0, y: 0, w: 180, h: 100, rotation: 0 },
      parentId: 'frame_root',
      name: 'Item 1',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          responsive: { order: 2, primary: false, smVisible: 'visible', smFullWidth: true, tablet: 'stack' }
        }
      }
    };

    // Item 2 is spatially second (x=180) but has order: 1
    const item2: CanvasShape = {
      id: 'item_2',
      kind: 'rect',
      bounds: { x: 180, y: 0, w: 180, h: 100, rotation: 0 },
      parentId: 'frame_root',
      name: 'Item 2',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          responsive: { order: 1, primary: false, smVisible: 'visible', smFullWidth: true, tablet: 'stack' }
        }
      }
    };

    const result = computeReflow({
      shapes: [frame, item1, item2],
      width: 360,
      defaultBreakpoint: 768
    });

    const node1 = result.nodes.find((n) => n.shapeId === 'item_1');
    const node2 = result.nodes.find((n) => n.shapeId === 'item_2');

    // Hand-calculated:
    // Item 2 (order 1) stacks first: x=0, y=0, w=360, h=100
    expect(node2?.x).toBe(0);
    expect(node2?.y).toBe(0);
    expect(node2?.w).toBe(360);
    expect(node2?.h).toBe(100);

    // Item 1 (order 2) stacks second: x=0, y=100 + 8 = 108, w=360, h=100
    expect(node1?.x).toBe(0);
    expect(node1?.y).toBe(108);
    expect(node1?.w).toBe(360);
    expect(node1?.h).toBe(100);
  });

  it('fixture (c): hidden ghosting preserves original bounds without advancing stacking offset', () => {
    const frame: CanvasShape = {
      id: 'frame_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
      parentId: null,
      name: 'Root Frame',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'page' } }
    };

    const hero: CanvasShape = {
      id: 'hero',
      kind: 'rect',
      bounds: { x: 0, y: 0, w: 360, h: 150, rotation: 0 },
      parentId: 'frame_root',
      name: 'Hero',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'card' } }
    };

    const sidebar: CanvasShape = {
      id: 'sidebar',
      kind: 'rect',
      bounds: { x: 0, y: 160, w: 100, h: 200, rotation: 0 },
      parentId: 'frame_root',
      name: 'Sidebar',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'sidebar',
          responsive: { order: 'auto', primary: false, smVisible: 'hidden', smFullWidth: true, tablet: 'stack' }
        }
      }
    };

    const content: CanvasShape = {
      id: 'content',
      kind: 'rect',
      bounds: { x: 110, y: 160, w: 250, h: 200, rotation: 0 },
      parentId: 'frame_root',
      name: 'Content',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'card' } }
    };

    const result = computeReflow({
      shapes: [frame, hero, sidebar, content],
      width: 360,
      defaultBreakpoint: 768
    });

    const heroNode = result.nodes.find((n) => n.shapeId === 'hero');
    const sidebarNode = result.nodes.find((n) => n.shapeId === 'sidebar');
    const contentNode = result.nodes.find((n) => n.shapeId === 'content');

    // Hero: normal, y=0, h=150
    expect(heroNode?.state).toBe('normal');
    expect(heroNode?.y).toBe(0);

    // Sidebar: hidden, retains bounds
    expect(sidebarNode?.state).toBe('hidden');
    expect(sidebarNode?.x).toBe(0);
    expect(sidebarNode?.y).toBe(160);
    expect(sidebarNode?.w).toBe(100);
    expect(sidebarNode?.h).toBe(200);

    // Content: normal, stacked immediately after Hero (150 + 8 = 158)
    expect(contentNode?.state).toBe('normal');
    expect(contentNode?.y).toBe(158);
    expect(contentNode?.w).toBe(360);
    expect(contentNode?.h).toBe(200);
  });

  it('fixture (d): collapse-to-bottom-bar collapses element to a 48px strip at frame bottom', () => {
    const frame: CanvasShape = {
      id: 'frame_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
      parentId: null,
      name: 'Root Frame',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'page' } }
    };

    const nav: CanvasShape = {
      id: 'nav_bar',
      kind: 'rect',
      bounds: { x: 0, y: 0, w: 360, h: 60, rotation: 0 },
      parentId: 'frame_root',
      name: 'Nav',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'nav',
          responsive: { order: 'auto', primary: false, smVisible: 'collapse:bottom-bar', smFullWidth: true, tablet: 'stack' }
        }
      }
    };

    const main: CanvasShape = {
      id: 'main_content',
      kind: 'rect',
      bounds: { x: 0, y: 70, w: 360, h: 300, rotation: 0 },
      parentId: 'frame_root',
      name: 'Main',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'section' } }
    };

    const result = computeReflow({
      shapes: [frame, nav, main],
      width: 360,
      defaultBreakpoint: 768
    });

    const navNode = result.nodes.find((n) => n.shapeId === 'nav_bar');
    const mainNode = result.nodes.find((n) => n.shapeId === 'main_content');

    expect(mainNode?.state).toBe('normal');
    expect(mainNode?.y).toBe(0);
    expect(mainNode?.h).toBe(300);

    // Nav collapsed to bottom-bar: 48px high, anchored at frame bottom (640 - 48 = 592)
    expect(navNode?.state).toBe('collapsed');
    expect(navNode?.collapseKind).toBe('bottom-bar');
    expect(navNode?.w).toBe(360);
    expect(navNode?.h).toBe(48);
    expect(navNode?.y).toBe(592);
  });

  it('fixture (e): untagged shapes are treated as generic boxes and stacked cleanly', () => {
    const frame: CanvasShape = {
      id: 'frame_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
      parentId: null,
      name: 'Root Frame',
      text: null,
      arrowEndpoints: null,
      meta: {} // No markdraw meta
    };

    const box1: CanvasShape = {
      id: 'box_1',
      kind: 'rect',
      bounds: { x: 0, y: 10, w: 170, h: 80, rotation: 0 },
      parentId: 'frame_root',
      name: 'Box 1',
      text: null,
      arrowEndpoints: null,
      meta: {}
    };

    const box2: CanvasShape = {
      id: 'box_2',
      kind: 'rect',
      bounds: { x: 190, y: 10, w: 170, h: 80, rotation: 0 },
      parentId: 'frame_root',
      name: 'Box 2',
      text: null,
      arrowEndpoints: null,
      meta: {}
    };

    const result = computeReflow({
      shapes: [frame, box1, box2],
      width: 360,
      defaultBreakpoint: 768
    });

    const b1 = result.nodes.find((n) => n.shapeId === 'box_1');
    const b2 = result.nodes.find((n) => n.shapeId === 'box_2');

    expect(b1?.role).toBe(null);
    expect(b2?.role).toBe(null);

    // Box 1 stacked at top: x=0, y=0, w=360, h=80
    expect(b1?.x).toBe(0);
    expect(b1?.y).toBe(0);
    expect(b1?.w).toBe(360);
    expect(b1?.h).toBe(80);

    // Box 2 stacked next: x=0, y=88 (80 + 8), w=360, h=80
    expect(b2?.x).toBe(0);
    expect(b2?.y).toBe(88);
    expect(b2?.w).toBe(360);
    expect(b2?.h).toBe(80);
  });

  it('guarantees deterministic, byte-identical output across repeated invocations', () => {
    const frame: CanvasShape = {
      id: 'frame_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
      parentId: null,
      name: 'Root Frame',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'page' } }
    };
    const colA: CanvasShape = {
      id: 'col_a',
      kind: 'rect',
      bounds: { x: 0, y: 0, w: 180, h: 200, rotation: 0 },
      parentId: 'frame_root',
      name: 'Column A',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'card' } }
    };

    const input: ReflowInput = {
      shapes: [frame, colA],
      width: 360,
      defaultBreakpoint: 768
    };

    const res1 = computeReflow(input);
    const res2 = computeReflow(input);

    expect(JSON.stringify(res1)).toBe(JSON.stringify(res2));
  });

  it('preserves non-destructive guarantee: input shapes are unmodified', () => {
    const frame: CanvasShape = {
      id: 'frame_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
      parentId: null,
      name: 'Root Frame',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'page' } }
    };
    const colA: CanvasShape = {
      id: 'col_a',
      kind: 'rect',
      bounds: { x: 0, y: 0, w: 180, h: 200, rotation: 0 },
      parentId: 'frame_root',
      name: 'Column A',
      text: null,
      arrowEndpoints: null,
      meta: { markdraw: { schema: 1, role: 'card' } }
    };

    const shapes = [frame, colA];
    const originalClone = JSON.parse(JSON.stringify(shapes));

    computeReflow({
      shapes,
      width: 360,
      defaultBreakpoint: 768
    });

    expect(shapes).toEqual(originalClone);
  });
});
