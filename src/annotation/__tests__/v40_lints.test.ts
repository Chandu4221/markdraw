import { describe, it, expect } from 'vitest';
import { TLShape, createShapeId } from '../../core/types';
import { MarkDrawCompiler } from '../../core/compiler';
import { UnitDefinition } from '../units';

describe('MarkDraw v4 Lint Set (§13)', () => {
  it('1. emits: Skipped {n} untagged shapes: {ids} — assign roles or delete.', () => {
    const fId = createShapeId('f1');
    const u1 = createShapeId('u1');
    const u2 = createShapeId('u2');

    const frame: TLShape = {
      id: fId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Screen', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const taggedBtn: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: fId,
      x: 10,
      y: 10,
      props: { geo: 'rectangle', text: 'OK' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    const untagged1: TLShape = {
      id: u1,
      type: 'geo',
      parentId: fId,
      x: 100,
      y: 100,
      props: { geo: 'rectangle' },
      meta: {}
    } as unknown as TLShape;

    const untagged2: TLShape = {
      id: u2,
      type: 'text',
      parentId: fId,
      x: 200,
      y: 100,
      props: { text: 'Some text' },
      meta: {}
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, taggedBtn, untagged1, untagged2]);
    const lint = (res.lints ?? []).find((l) => l.startsWith('Skipped 2 untagged shapes:'));
    expect(lint).toBeDefined();
    expect(lint).toMatch(/^Skipped 2 untagged shapes: #[a-z0-9_]+, #[a-z0-9_]+ — assign roles or delete\.$/);
  });

  it('2. emits: Frame "{name}" has no tagged shapes — skipped.', () => {
    const f1 = createShapeId('f1');
    const f2 = createShapeId('f2');

    const emptyFrame: TLShape = {
      id: f1,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Empty Canvas', w: 400, h: 400 },
      meta: {}
    } as unknown as TLShape;

    const validFrame: TLShape = {
      id: f2,
      type: 'frame',
      x: 500,
      y: 0,
      props: { name: 'Active View', w: 400, h: 400 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const btn: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: f2,
      x: 520,
      y: 20,
      props: { geo: 'rectangle', text: 'Go' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([emptyFrame, validFrame, btn]);
    expect((res.lints ?? [])).toContain('Frame "Empty Canvas" has no tagged shapes — skipped.');
  });

  it('3. emits: {looseCount} loose shapes outside any frame — move into a frame or select to compile.', () => {
    const frameId = createShapeId('f1');
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Home', w: 400, h: 400 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const framedShape: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: frameId,
      x: 20,
      y: 20,
      props: { geo: 'rectangle', text: 'Framed' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    const loose1: TLShape = {
      id: createShapeId('l1'),
      type: 'geo',
      x: 800,
      y: 800,
      props: { geo: 'rectangle', w: 100, h: 40, text: 'Loose 1' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    const loose2: TLShape = {
      id: createShapeId('l2'),
      type: 'geo',
      x: 800,
      y: 900,
      props: { geo: 'rectangle', w: 100, h: 40, text: 'Loose 2' },
      meta: { markdraw: { schema: 1, role: 'card' } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, framedShape, loose1, loose2]);
    expect((res.lints ?? [])).toContain('2 loose shapes outside any frame — move into a frame or select to compile.');
  });

  it('4. emits: #{id} has stale parentId "{target}" — clear it or move the shape back inside.', () => {
    const frameId = createShapeId('f1');
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Page', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const btn: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: frameId,
      x: 50,
      y: 50,
      props: { geo: 'rectangle', text: 'Test' },
      meta: { markdraw: { schema: 1, role: 'button', parentId: createShapeId('nonexistent') } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, btn]);
    const lint = (res.lints ?? []).find((l) => l.includes('has stale parentId "shape:nonexistent"'));
    expect(lint).toBeDefined();
    expect(lint).toMatch(/^#[a-z0-9_]+ has stale parentId "shape:nonexistent" — clear it or move the shape back inside\.$/);
  });

  it('5. emits: Responsive props on #{id} but no responsive root page — tokens not emitted.', () => {
    const frameId = createShapeId('f1');
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Non-responsive Page', w: 800, h: 600 },
      // Not responsive
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const btn: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: frameId,
      x: 50,
      y: 50,
      props: { geo: 'rectangle', text: 'Responsive Btn' },
      meta: {
        markdraw: {
          schema: 1,
          role: 'button',
          responsive: {
            order: 2,
            primary: false,
            smVisible: 'hidden',
            smFullWidth: false,
            tablet: 'maintain'
          }
        }
      }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, btn]);
    const lint = (res.lints ?? []).find((l) => l.includes('but no responsive root page — tokens not emitted.'));
    expect(lint).toBeDefined();
    expect(lint).toMatch(/^Responsive props on #[a-z0-9_]+ but no responsive root page — tokens not emitted\.$/);
    // Tokens not emitted
    expect(res.markdownSpec).not.toContain('sm:hidden');
  });

  it('6. emits: Unit "{name}" has no base role — fix in the customization panel.', () => {
    const invalidUnit: UnitDefinition = {
      id: 'u_inv',
      name: 'Broken Unit',
      tag: 'Broken Unit',
      baseRole: '', // missing base role
      memberRoles: ['button'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const frameId = createShapeId('f1');
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Page', w: 600, h: 400 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const btn: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: frameId,
      x: 20,
      y: 20,
      props: { geo: 'rectangle', text: 'Click' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, btn], null, {
      units: [invalidUnit]
    });

    expect((res.lints ?? [])).toContain('Unit "Broken Unit" has no base role — fix in the customization panel.');
  });

  it('7. emits: Arrow endpoint untagged — relation omitted.', () => {
    const frameId = createShapeId('f1');
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Page', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const taggedBtn: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: frameId,
      x: 50,
      y: 50,
      props: { geo: 'rectangle', text: 'A' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    const untaggedCard: TLShape = {
      id: createShapeId('c1'),
      type: 'geo',
      parentId: frameId,
      x: 250,
      y: 50,
      props: { geo: 'rectangle', text: 'B' },
      meta: {} // untagged
    } as unknown as TLShape;

    const arrow: TLShape = {
      id: createShapeId('arr1'),
      type: 'arrow',
      parentId: frameId,
      props: {
        start: { boundShapeId: taggedBtn.id },
        end: { boundShapeId: untaggedCard.id },
        text: 'submits to'
      }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, taggedBtn, untaggedCard, arrow]);
    expect((res.lints ?? [])).toContain('Arrow endpoint untagged — relation omitted.');
    expect(res.markdownSpec).not.toContain('Relations:');
  });

  it('8. emits: Identical literal labels "{text}" across {n} repeated siblings — consider one template (legend rule: vary per item).', () => {
    const frameId = createShapeId('f1');
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Page', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    // 3 sibling buttons with identical literal text "Buy Now"
    const btn1: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: frameId,
      x: 20,
      y: 20,
      props: { geo: 'rectangle', text: 'Buy Now' },
      meta: { markdraw: { schema: 1, role: 'button', props: { label: 'Buy Now' } } }
    } as unknown as TLShape;

    const btn2: TLShape = {
      id: createShapeId('b2'),
      type: 'geo',
      parentId: frameId,
      x: 20,
      y: 80,
      props: { geo: 'rectangle', text: 'Buy Now' },
      meta: { markdraw: { schema: 1, role: 'button', props: { label: 'Buy Now' } } }
    } as unknown as TLShape;

    const btn3: TLShape = {
      id: createShapeId('b3'),
      type: 'geo',
      parentId: frameId,
      x: 20,
      y: 140,
      props: { geo: 'rectangle', text: 'Buy Now' },
      meta: { markdraw: { schema: 1, role: 'button', props: { label: 'Buy Now' } } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, btn1, btn2, btn3]);
    expect((res.lints ?? [])).toContain(
      'Identical literal labels "Buy Now" across 3 repeated siblings — consider one template (legend rule: vary per item).'
    );
  });

  it('9. emits: Flag "{flag}" has no meaning for role "{role}" — dropped.', () => {
    const frameId = createShapeId('f1');
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Page', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const btn: TLShape = {
      id: createShapeId('b1'),
      type: 'geo',
      parentId: frameId,
      x: 20,
      y: 20,
      props: { geo: 'rectangle', text: 'Click' },
      // "sticky" is valid for navbar/header/banner, NOT button
      meta: { markdraw: { schema: 1, role: 'button', props: { behaviors: ['sticky' as any] } } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, btn]);
    expect((res.lints ?? [])).toContain('Flag "sticky" has no meaning for role "button" — dropped.');
  });
});
