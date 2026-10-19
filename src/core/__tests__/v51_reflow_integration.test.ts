// src/core/__tests__/v51_reflow_integration.test.ts
// Integration test: computeReflow simulation order vs compiler emission order (§4 Gate)
import { describe, it, expect } from 'vitest';
import { computeReflow } from '../reflow';
import { MarkDrawCompiler } from '../compiler';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { canvasShapesToCompilerShapes } from '../../hooks/useCompilation';

describe('Phase 4 Gate: Reflow Simulation vs Compiler Emission Parity', () => {
  it('guarantees computeReflow ordering, breakpoint, and hidden set match compiler output', () => {
    const frame: CanvasShape = {
      id: 'frame_resp',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 800, h: 600, rotation: 0 },
      parentId: null,
      name: 'Dashboard',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'page',
          props: { label: 'Dashboard', behaviors: ['responsive'] }
        }
      }
    };

    // Col A: primary / order 1
    const colA: CanvasShape = {
      id: 'col_a',
      kind: 'rect',
      bounds: { x: 0, y: 50, w: 400, h: 250, rotation: 0 },
      parentId: 'frame_resp',
      name: 'Summary Card',
      text: 'Summary KPI',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          responsive: {
            order: 1,
            primary: true,
            smVisible: 'visible',
            smFullWidth: true,
            tablet: 'stack'
          },
          props: { label: 'Summary KPI' }
        }
      }
    };

    // Col B: secondary / order 2
    const colB: CanvasShape = {
      id: 'col_b',
      kind: 'rect',
      bounds: { x: 400, y: 50, w: 400, h: 250, rotation: 0 },
      parentId: 'frame_resp',
      name: 'Details Card',
      text: 'Detailed Chart',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          responsive: {
            order: 2,
            primary: false,
            smVisible: 'visible',
            smFullWidth: true,
            tablet: 'stack'
          },
          props: { label: 'Detailed Chart' }
        }
      }
    };

    // Sidebar: hidden on mobile
    const sidebar: CanvasShape = {
      id: 'sidebar_nav',
      kind: 'rect',
      bounds: { x: 0, y: 310, w: 200, h: 200, rotation: 0 },
      parentId: 'frame_resp',
      name: 'Navigation Rail',
      text: 'Nav Rail',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'sidebar',
          responsive: {
            order: 'auto',
            primary: false,
            smVisible: 'hidden',
            smFullWidth: false,
            tablet: 'stack'
          },
          props: { label: 'Nav Rail' }
        }
      }
    };

    const shapes = [frame, colA, colB, sidebar];

    // 1. Run simulation reflow at 375px
    const simResult = computeReflow({
      shapes,
      width: 375,
      defaultBreakpoint: 768
    });

    // Verify simulation output
    const normalNodes = simResult.nodes.filter(
      (n) => n.shapeId !== 'frame_resp' && n.state === 'normal'
    );
    const hiddenNodes = simResult.nodes.filter((n) => n.state === 'hidden');

    expect(normalNodes[0].shapeId).toBe('col_a');
    expect(normalNodes[1].shapeId).toBe('col_b');
    expect(hiddenNodes.map((n) => n.shapeId)).toEqual(['sidebar_nav']);

    // 2. Compile contract
    const compilerShapes = canvasShapesToCompilerShapes(shapes);
    const compiled = MarkDrawCompiler.compile(compilerShapes, null, {
      platform: 'web'
    });

    // 3. Parity Assertions
    // Contract contains responsive binding note
    expect(compiled.markdownSpec).toContain(
      '> Responsive: this page must adapt to mobile widths; per-shape sm:* tokens are binding.'
    );

    // Contract has Col A with primary / sm:order-1
    expect(compiled.markdownSpec).toContain('sm:order-1');
    expect(compiled.markdownSpec).toContain('sm:full');

    // Contract has Col B with sm:order-2
    expect(compiled.markdownSpec).toContain('sm:order-2');

    // Contract has sidebar with sm:hidden
    expect(compiled.markdownSpec).toContain('sm:hidden');

    // Order of occurrence in Markdown spec: col_a occurs before col_b
    const idxA = compiled.markdownSpec.indexOf('[card "Summary KPI"]');
    const idxB = compiled.markdownSpec.indexOf('[card "Detailed Chart"]');
    expect(idxA).toBeGreaterThan(-1);
    expect(idxB).toBeGreaterThan(-1);
    expect(idxA).toBeLessThan(idxB);
  });
});
