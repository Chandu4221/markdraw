import { describe, it, expect } from 'vitest';
import { TLShape, createShapeId } from '@tldraw/tldraw';
import { MarkDrawCompiler } from '../../core/compiler';
import { UnitDefinition } from '../units';

describe('MarkDraw v4 Scoped Compile (§9.1)', () => {
  const followCardUnit: UnitDefinition = {
    id: 'u_fc1',
    name: 'Follow Card',
    tag: 'Follow Card',
    baseRole: 'card',
    memberRoles: ['avatar', 'heading', 'button'],
    createdAt: 1729000000000,
    updatedAt: 1729000000000
  };

  const frameId = createShapeId('frame_feed');
  const groupId = createShapeId('grp_card');
  const avatarId = createShapeId('shp_avatar');
  const headingId = createShapeId('shp_heading');
  const buttonId = createShapeId('shp_button');

  // Outside shape that is untagged or has lint
  const outsideShapeId = createShapeId('shp_outside');
  const untaggedOutsideId = createShapeId('shp_untagged');

  const setupCanvas = () => {
    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Feed Page', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const group: TLShape = {
      id: groupId,
      type: 'group',
      parentId: frameId,
      x: 50,
      y: 50,
      props: { name: 'Follow Card' },
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          unitId: 'u_fc1',
          props: { label: 'Follow Card' }
        }
      }
    } as unknown as TLShape;

    const avatar: TLShape = {
      id: avatarId,
      type: 'geo',
      parentId: groupId,
      x: 60,
      y: 60,
      props: { geo: 'ellipse', w: 40, h: 40 },
      meta: { markdraw: { schema: 1, role: 'avatar' } }
    } as unknown as TLShape;

    const heading: TLShape = {
      id: headingId,
      type: 'text',
      parentId: groupId,
      x: 110,
      y: 60,
      props: { text: 'Alex' },
      meta: { markdraw: { schema: 1, role: 'heading', props: { variant: 'h3' } } }
    } as unknown as TLShape;

    const button: TLShape = {
      id: buttonId,
      type: 'geo',
      parentId: groupId,
      x: 200,
      y: 60,
      props: { geo: 'rectangle', w: 80, h: 30, text: 'Follow' },
      // Intentionally give button an invalid flag for its role to test subtree lint preservation
      meta: {
        markdraw: {
          schema: 1,
          role: 'button',
          props: { label: 'Follow', behaviors: ['invalid_flag_xyz' as any] }
        }
      }
    } as unknown as TLShape;

    // Unrelated sibling card under frame with stale parentId to test lint filtering
    const outsideCard: TLShape = {
      id: outsideShapeId,
      type: 'geo',
      parentId: frameId,
      x: 50,
      y: 400,
      props: { geo: 'rectangle', w: 200, h: 100 },
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          parentId: createShapeId('missing_parent')
        }
      }
    } as unknown as TLShape;

    // Untagged shape on canvas
    const untaggedOutside: TLShape = {
      id: untaggedOutsideId,
      type: 'geo',
      parentId: frameId,
      x: 300,
      y: 400,
      props: { geo: 'rectangle', w: 100, h: 50 },
      meta: {}
    } as unknown as TLShape;

    return [frame, group, avatar, heading, button, outsideCard, untaggedOutside];
  };

  it('formats header line exactly: _Scoped compile: "{scopeName}" — {unitCount} unit(s), {nodeCount} nodes (of {totalNodes} in "{rootName}")_', () => {
    const shapes = setupCanvas();
    const res = MarkDrawCompiler.compile(shapes, null, {
      scope: { shapeIds: [groupId] },
      units: [followCardUnit]
    });

    const firstLine = res.markdownSpec.split('\n')[0];
    expect(firstLine).toMatch(/^_Scoped compile: "Follow Card" — 1 unit, 3 nodes \(of \d+ in "Feed Page"\)_$/);
  });

  it('keeps paths absolute in scoped compile (Root > #rootId > #groupId > #childId)', () => {
    const shapes = setupCanvas();
    const res = MarkDrawCompiler.compile(shapes, null, {
      scope: { shapeIds: [groupId] },
      units: [followCardUnit]
    });

    expect(res.markdownSpec).toContain('| `Root > #');
    // Button row path must have 3 levels: Root > rootFrame > group > button
    const lines = res.markdownSpec.split('\n');
    const buttonLine = lines.find((l) => l.includes('[button "Follow"]'));
    expect(buttonLine).toBeDefined();
    // Verify it contains two ">" separators after Root (3 levels deep)
    const pathCol = buttonLine!.split('|')[1].trim();
    const parts = pathCol.replace(/`/g, '').split(' > ');
    expect(parts.length).toBe(4); // ['Root', '#frame', '#group', '#button']
  });

  it('filters lints to only the scoped subtree', () => {
    const shapes = setupCanvas();

    // 1) Full canvas compile should have both outsideCard lint, untagged lint, AND button invalid flag lint
    const fullRes = MarkDrawCompiler.compile(shapes, null, {
      units: [followCardUnit]
    });
    expect((fullRes.lints ?? []).some((l) => l.includes('stale parentId'))).toBe(true);
    expect((fullRes.lints ?? []).some((l) => l.includes('untagged'))).toBe(true);
    expect((fullRes.lints ?? []).some((l) => l.includes('invalid_flag_xyz'))).toBe(true);

    // 2) Scoped compile of groupId: should ONLY have button's lint, NOT the outside lints
    const scopedRes = MarkDrawCompiler.compile(shapes, null, {
      scope: { shapeIds: [groupId] },
      units: [followCardUnit]
    });

    expect((scopedRes.lints ?? []).some((l) => l.includes('invalid_flag_xyz'))).toBe(true);
    expect((scopedRes.lints ?? []).some((l) => l.includes('stale parentId'))).toBe(false);
    expect((scopedRes.lints ?? []).some((l) => l.includes('untagged'))).toBe(false);
  });

  it('expands scope to include descendants and ancestors when child is selected', () => {
    const shapes = setupCanvas();
    // Scope only buttonId: compiler expands to ancestors (groupId, frameId) and keeps buttonId
    const res = MarkDrawCompiler.compile(shapes, null, {
      scope: { shapeIds: [buttonId] },
      units: [followCardUnit]
    });

    expect(res.markdownSpec).toContain('[button "Follow"]');
    expect(res.markdownSpec).toContain('[page "Feed Page"]');
    // Outside card is not in scope
    expect(res.markdownSpec).not.toContain(outsideShapeId);
  });
});
