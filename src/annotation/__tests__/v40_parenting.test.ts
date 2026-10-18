import { describe, it, expect } from 'vitest';
import { TLShape, createShapeId } from '@tldraw/tldraw';
import { MarkDrawCompiler } from '../../core/compiler';

describe('MarkDraw v4 Hierarchy & Parenting (§6.3)', () => {
  it('priority 1: meta.markdraw.parentId overrides native group and frame when geometrically valid', () => {
    const frameId = createShapeId('frame1');
    const groupId = createShapeId('group1');
    const targetCardId = createShapeId('card1');
    const buttonId = createShapeId('btn1');

    const shapes: TLShape[] = [
      {
        id: frameId,
        type: 'frame',
        x: 0,
        y: 0,
        props: { name: 'Main Frame', w: 800, h: 600 },
        meta: { markdraw: { schema: 1, role: 'page' } }
      } as unknown as TLShape,
      {
        id: targetCardId,
        type: 'geo',
        parentId: frameId,
        x: 50,
        y: 50,
        props: { geo: 'rectangle', w: 300, h: 300 },
        meta: { markdraw: { schema: 1, role: 'card' } }
      } as unknown as TLShape,
      {
        id: groupId,
        type: 'group',
        parentId: frameId,
        x: 0,
        y: 0,
        props: {},
        meta: {}
      } as unknown as TLShape,
      {
        id: buttonId,
        type: 'geo',
        parentId: groupId,
        x: 60,
        y: 60,
        props: { geo: 'rectangle', w: 100, h: 40, text: 'Click' },
        meta: { markdraw: { schema: 1, role: 'button', parentId: targetCardId } }
      } as unknown as TLShape
    ];

    const res = MarkDrawCompiler.compile(shapes);
    expect((res.lints ?? []).filter((l) => l.includes('stale parentId'))).toHaveLength(0);

    const ast = JSON.parse(res.jsonAst);
    const root = ast[0];
    expect(root).toBeDefined();
    const cardNode = root.children?.find((c: any) => c.id === targetCardId);
    expect(cardNode).toBeDefined();
    const buttonChild = cardNode?.children?.find((c: any) => c.id === buttonId);
    expect(buttonChild).toBeDefined();
  });

  it('detects stale parentId when target does not exist and falls back to enclosing group/frame', () => {
    const frameId = createShapeId('frame1');
    const buttonId = createShapeId('btn1');
    const nonexistentId = createShapeId('missing_card');

    const shapes: TLShape[] = [
      {
        id: frameId,
        type: 'frame',
        x: 0,
        y: 0,
        props: { name: 'Main Frame', w: 800, h: 600 },
        meta: { markdraw: { schema: 1, role: 'page' } }
      } as unknown as TLShape,
      {
        id: buttonId,
        type: 'geo',
        parentId: frameId,
        x: 50,
        y: 50,
        props: { geo: 'rectangle', w: 100, h: 40, text: 'Click' },
        meta: { markdraw: { schema: 1, role: 'button', parentId: nonexistentId } }
      } as unknown as TLShape
    ];

    const res = MarkDrawCompiler.compile(shapes);
    expect((res.lints ?? []).some((l) => l.includes('stale parentId') && l.includes(nonexistentId))).toBe(true);

    const ast = JSON.parse(res.jsonAst);
    const root = ast[0];
    expect(root.children?.some((c: any) => c.id === buttonId)).toBe(true);
  });

  it('detects stale parentId when target is not an ancestor-by-geometry (enclosure < 0.5)', () => {
    const frameId = createShapeId('frame1');
    const cardId = createShapeId('card1');
    const buttonId = createShapeId('btn1');

    const shapes: TLShape[] = [
      {
        id: frameId,
        type: 'frame',
        x: 0,
        y: 0,
        props: { name: 'Main Frame', w: 800, h: 600 },
        meta: { markdraw: { schema: 1, role: 'page' } }
      } as unknown as TLShape,
      {
        id: cardId,
        type: 'geo',
        parentId: frameId,
        x: 50,
        y: 50,
        props: { geo: 'rectangle', w: 100, h: 100 },
        meta: { markdraw: { schema: 1, role: 'card' } }
      } as unknown as TLShape,
      {
        id: buttonId,
        type: 'geo',
        parentId: frameId,
        x: 400,
        y: 400,
        props: { geo: 'rectangle', w: 100, h: 40, text: 'Click' },
        meta: { markdraw: { schema: 1, role: 'button', parentId: cardId } }
      } as unknown as TLShape
    ];

    const res = MarkDrawCompiler.compile(shapes);
    expect((res.lints ?? []).some((l) => l.includes('has stale parentId'))).toBe(true);

    const ast = JSON.parse(res.jsonAst);
    const root = ast[0];
    expect(root.children?.some((c: any) => c.id === buttonId)).toBe(true);
    const card = root.children?.find((c: any) => c.id === cardId);
    expect(card?.children?.some((c: any) => c.id === buttonId)).toBeFalsy();
  });

  it('priority 2: enclosing native group is parent when parentId is null', () => {
    const frameId = createShapeId('frame1');
    const groupId = createShapeId('group1');
    const buttonId = createShapeId('btn1');

    const shapes: TLShape[] = [
      {
        id: frameId,
        type: 'frame',
        x: 0,
        y: 0,
        props: { name: 'Main Frame', w: 800, h: 600 },
        meta: { markdraw: { schema: 1, role: 'page' } }
      } as unknown as TLShape,
      {
        id: groupId,
        type: 'group',
        parentId: frameId,
        x: 100,
        y: 100,
        props: {},
        meta: { markdraw: { schema: 1, role: 'card' } }
      } as unknown as TLShape,
      {
        id: buttonId,
        type: 'geo',
        parentId: groupId,
        x: 110,
        y: 110,
        props: { geo: 'rectangle', w: 80, h: 30, text: 'Inside Group' },
        meta: { markdraw: { schema: 1, role: 'button' } }
      } as unknown as TLShape
    ];

    const res = MarkDrawCompiler.compile(shapes);
    const ast = JSON.parse(res.jsonAst);
    const root = ast[0];
    const groupNode = root.children?.find((c: any) => c.id === groupId);
    expect(groupNode).toBeDefined();
    expect(groupNode?.children?.some((c: any) => c.id === buttonId)).toBe(true);
  });

  it('priority 3: enclosing frame is parent when neither parentId nor group is present', () => {
    const frameId = createShapeId('frame1');
    const headingId = createShapeId('h1');

    const shapes: TLShape[] = [
      {
        id: frameId,
        type: 'frame',
        x: 0,
        y: 0,
        props: { name: 'Feed', w: 600, h: 400 },
        meta: { markdraw: { schema: 1, role: 'page' } }
      } as unknown as TLShape,
      {
        id: headingId,
        type: 'text',
        parentId: frameId,
        x: 20,
        y: 20,
        props: { text: 'Welcome' },
        meta: { markdraw: { schema: 1, role: 'heading' } }
      } as unknown as TLShape
    ];

    const res = MarkDrawCompiler.compile(shapes);
    const ast = JSON.parse(res.jsonAst);
    const root = ast[0];
    expect(root.id).toBe(frameId);
    expect(root.children?.some((c: any) => c.id === headingId)).toBe(true);
  });

  it('loose shapes outside any frame emit loose shapes lint on full canvas compile', () => {
    const looseButton = {
      id: createShapeId('btn_loose'),
      type: 'geo',
      x: 800,
      y: 800,
      props: { geo: 'rectangle', w: 100, h: 40, text: 'Loose' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    const frameId = createShapeId('frame1');
    const framedHeading = {
      id: createShapeId('heading1'),
      type: 'text',
      parentId: frameId,
      x: 20,
      y: 20,
      props: { text: 'Title' },
      meta: { markdraw: { schema: 1, role: 'heading' } }
    } as unknown as TLShape;

    const frame = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Home', w: 400, h: 400 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, framedHeading, looseButton]);
    expect((res.lints ?? []).some((l) => l.includes('loose shapes outside any frame'))).toBe(true);
  });
});
