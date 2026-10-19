import { describe, it, expect } from 'vitest';
import { TLShape, createShapeId } from '../../../core/types';
import { tldrawSceneToStoredDocument } from '../v5-export.tldraw';
import { UnitDefinition } from '../../../annotation/units';

describe('tldraw to Neutral StoredDocument Migration Export (§1.5)', () => {
  it('converts realistic v4 tldraw shapes preserving kind, bounds, parentId, and meta.markdraw', () => {
    const followCardUnit: UnitDefinition = {
      id: 'u_fc1',
      name: 'Follow Card',
      tag: 'Follow Card',
      baseRole: 'card',
      memberRoles: ['avatar', 'heading', 'button'],
      createdAt: 1729000000000,
      updatedAt: 1729000000000
    };

    // Frame "Feed Page"
    const frame: TLShape = {
      id: createShapeId('frame_feed'),
      type: 'frame',
      x: 0,
      y: 0,
      props: {
        name: 'Feed Page',
        w: 800,
        h: 600
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'page',
          responsive: {
            order: 'auto',
            primary: false,
            smVisible: 'visible',
            smFullWidth: false,
            tablet: 'maintain'
          },
          props: {
            label: 'Feed Page',
            behaviors: ['responsive']
          }
        }
      }
    };

    // Group "Follow Card" inside frame
    const group: TLShape = {
      id: createShapeId('group_fc'),
      type: 'group',
      parentId: frame.id,
      x: 50,
      y: 50,
      props: {
        name: 'Follow Card'
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          unitId: 'u_fc1',
          props: {
            label: 'Follow Card'
          }
        }
      }
    };

    // Ellipse avatar inside group
    const avatar: TLShape = {
      id: createShapeId('avatar_1'),
      type: 'geo',
      parentId: group.id,
      x: 60,
      y: 60,
      props: {
        geo: 'ellipse',
        w: 48,
        h: 48
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'avatar',
          props: {
            label: 'User Avatar'
          }
        }
      }
    };

    // Text heading inside group
    const heading: TLShape = {
      id: createShapeId('heading_1'),
      type: 'text',
      parentId: group.id,
      x: 120,
      y: 60,
      props: {
        text: 'Alex Johnson',
        w: 150,
        h: 24
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'heading',
          props: {
            label: 'User Name'
          }
        }
      }
    };

    // Geo rect button inside group
    const button: TLShape = {
      id: createShapeId('btn_1'),
      type: 'geo',
      parentId: group.id,
      x: 120,
      y: 90,
      props: {
        geo: 'rectangle',
        text: 'Follow',
        w: 80,
        h: 32
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'button',
          props: {
            label: 'Follow'
          }
        }
      }
    };

    const doc = tldrawSceneToStoredDocument(
      [frame, group, avatar, heading, button],
      [followCardUnit]
    );

    expect(doc.schema).toBe(1);
    expect(doc.docVersion).toBe(1);
    expect(doc.shapes).toHaveLength(5);
    expect(doc.units).toHaveLength(1);
    expect(doc.units[0].id).toBe('u_fc1');

    // 1. Frame check
    const mappedFrame = doc.shapes.find((s) => s.id === frame.id);
    expect(mappedFrame).toBeDefined();
    expect(mappedFrame?.kind).toBe('frame');
    expect(mappedFrame?.name).toBe('Feed Page');
    expect(mappedFrame?.parentId).toBeNull();
    expect(mappedFrame?.bounds).toEqual({ x: 0, y: 0, w: 800, h: 600, rotation: 0 });
    expect(mappedFrame?.meta.markdraw).toMatchObject({
      schema: 1,
      role: 'page',
      props: { label: 'Feed Page', behaviors: ['responsive'] }
    });

    // 2. Group check
    const mappedGroup = doc.shapes.find((s) => s.id === group.id);
    expect(mappedGroup).toBeDefined();
    expect(mappedGroup?.kind).toBe('group');
    expect(mappedGroup?.parentId).toBe(frame.id);
    expect(mappedGroup?.meta.markdraw).toMatchObject({
      schema: 1,
      role: 'card',
      unitId: 'u_fc1'
    });

    // 3. Avatar ellipse check
    const mappedAvatar = doc.shapes.find((s) => s.id === avatar.id);
    expect(mappedAvatar).toBeDefined();
    expect(mappedAvatar?.kind).toBe('ellipse');
    expect(mappedAvatar?.bounds).toEqual({ x: 60, y: 60, w: 48, h: 48, rotation: 0 });
    expect(mappedAvatar?.parentId).toBe(group.id);
    expect(mappedAvatar?.meta.markdraw).toMatchObject({
      schema: 1,
      role: 'avatar'
    });

    // 4. Heading text check
    const mappedHeading = doc.shapes.find((s) => s.id === heading.id);
    expect(mappedHeading).toBeDefined();
    expect(mappedHeading?.kind).toBe('text');
    expect(mappedHeading?.text).toBe('Alex Johnson');
    expect(mappedHeading?.bounds).toEqual({ x: 120, y: 60, w: 150, h: 24, rotation: 0 });
    expect(mappedHeading?.parentId).toBe(group.id);
    expect(mappedHeading?.meta.markdraw).toMatchObject({
      schema: 1,
      role: 'heading'
    });

    // 5. Button rectangle check
    const mappedButton = doc.shapes.find((s) => s.id === button.id);
    expect(mappedButton).toBeDefined();
    expect(mappedButton?.kind).toBe('rect');
    expect(mappedButton?.text).toBe('Follow');
    expect(mappedButton?.bounds).toEqual({ x: 120, y: 90, w: 80, h: 32, rotation: 0 });
    expect(mappedButton?.parentId).toBe(group.id);
    expect(mappedButton?.meta.markdraw).toMatchObject({
      schema: 1,
      role: 'button'
    });
  });

  it('upgrades legacy v3 widgets during export without dropping shapes', () => {
    const v3Card: TLShape = {
      id: createShapeId('v3_card'),
      type: 'ui-widget',
      x: 100,
      y: 100,
      props: {
        widgetType: 'card',
        label: 'Product Card',
        w: 300,
        h: 200
      }
    };

    const doc = tldrawSceneToStoredDocument([v3Card]);
    expect(doc.shapes).toHaveLength(1);
    const mapped = doc.shapes[0];
    expect(mapped.kind).toBe('rect');
    expect(mapped.bounds.w).toBe(300);
    expect(mapped.bounds.h).toBe(200);
    expect(mapped.meta.markdraw).toMatchObject({
      schema: 1,
      role: 'card',
      props: { label: 'Product Card' }
    });
  });
});
