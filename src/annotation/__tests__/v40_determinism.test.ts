// src/annotation/__tests__/v40_determinism.test.ts
import { describe, it, expect } from 'vitest';
import { TLShape, createShapeId } from '@tldraw/tldraw';
import { MarkDrawCompiler } from '../../core/compiler';

describe('MarkDraw v4 Determinism and Invariance (§14)', () => {
  const createTestShapes = (): TLShape[] => [
    {
      id: createShapeId('frame1'),
      type: 'frame',
      x: 0,
      y: 0,
      props: { w: 800, h: 600, name: 'Main Frame' },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape,
    {
      id: createShapeId('nav1'),
      type: 'geo',
      x: 20,
      y: 20,
      parentId: createShapeId('frame1'),
      props: { geo: 'rectangle', w: 760, h: 60, text: 'Navbar' },
      meta: { markdraw: { schema: 1, role: 'navbar', props: { label: 'Top Navigation' } } }
    } as unknown as TLShape,
    {
      id: createShapeId('hero1'),
      type: 'geo',
      x: 20,
      y: 100,
      parentId: createShapeId('frame1'),
      props: { geo: 'rectangle', w: 760, h: 200, text: 'Hero' },
      meta: { markdraw: { schema: 1, role: 'section', props: { label: 'Hero Banner', variant: 'hero' } } }
    } as unknown as TLShape,
    {
      id: createShapeId('btn1'),
      type: 'geo',
      x: 50,
      y: 220,
      parentId: createShapeId('hero1'),
      props: { geo: 'rectangle', w: 120, h: 40, text: 'CTA' },
      meta: { markdraw: { schema: 1, role: 'button', props: { label: 'Get Started' } } }
    } as unknown as TLShape
  ];

  it('produces byte-identical markdownSpec across multiple sequential compilations', () => {
    const shapes = createTestShapes();

    const run1 = MarkDrawCompiler.compile(shapes, null, { annotationMode: true });
    const run2 = MarkDrawCompiler.compile(shapes, null, { annotationMode: true });
    const run3 = MarkDrawCompiler.compile(shapes, null, { annotationMode: true });

    expect(run1.markdownSpec).toBe(run2.markdownSpec);
    expect(run2.markdownSpec).toBe(run3.markdownSpec);

    expect(run1.markdownGrid).toBe(run2.markdownGrid);
    expect(run2.markdownGrid).toBe(run3.markdownGrid);

    expect(run1.markdownAscii).toBe(run2.markdownAscii);
    expect(run2.markdownAscii).toBe(run3.markdownAscii);

    expect(run1.jsonAst).toBe(run2.jsonAst);
  });

  it('is invariant to shape array input permutations (canonical spatial sorting)', () => {
    const shapes = createTestShapes();
    const shuffled = [shapes[3], shapes[1], shapes[0], shapes[2]];

    const canonicalResult = MarkDrawCompiler.compile(shapes, null, { annotationMode: true });
    const shuffledResult = MarkDrawCompiler.compile(shuffled, null, { annotationMode: true });

    expect(canonicalResult.markdownSpec).toBe(shuffledResult.markdownSpec);
    expect(canonicalResult.jsonAst).toBe(shuffledResult.jsonAst);
  });

  it('is invariant to editor selection when full canvas compile is requested', () => {
    const shapes = createTestShapes();

    // Mock editor with selection on button
    const editorWithButtonSelected = {
      getSelectedShapes: () => [shapes[3]],
      getSelectedShapeIds: () => [shapes[3].id],
      getShapePageBounds: () => null
    } as any;

    // Mock editor with selection on frame
    const editorWithFrameSelected = {
      getSelectedShapes: () => [shapes[0]],
      getSelectedShapeIds: () => [shapes[0].id],
      getShapePageBounds: () => null
    } as any;

    const noSelectResult = MarkDrawCompiler.compile(shapes, null, { annotationMode: true });
    const buttonSelectResult = MarkDrawCompiler.compile(shapes, editorWithButtonSelected, {
      annotationMode: true
    });
    const frameSelectResult = MarkDrawCompiler.compile(shapes, editorWithFrameSelected, {
      annotationMode: true
    });

    expect(noSelectResult.markdownSpec).toBe(buttonSelectResult.markdownSpec);
    expect(noSelectResult.markdownSpec).toBe(frameSelectResult.markdownSpec);
  });
});
