import { describe, it, expect, beforeEach } from 'vitest';
import { TLShape, createShapeId } from '@tldraw/tldraw';
import {
  UnitDefinition,
  createUnitDefinition,
  getStoredUnits,
  saveStoredUnit,
  deleteStoredUnit,
  updateStoredUnit,
  stampUnit,
  clearStoredUnitsForTesting
} from '../units';
import { getShapeMeta } from '../shapeMeta';
import { MarkDrawCompiler } from '../../core/compiler';

describe('MarkDraw v4 Custom Units Lifecycle (§11)', () => {
  beforeEach(() => {
    clearStoredUnitsForTesting();
  });

  it('createUnitDefinition orders members top-left to bottom-right and assigns u_ ID', () => {
    const avatarShape: TLShape = {
      id: createShapeId('s1'),
      type: 'geo',
      x: 10,
      y: 10,
      props: { geo: 'ellipse', w: 40, h: 40 },
      meta: { markdraw: { schema: 1, role: 'avatar' } }
    } as unknown as TLShape;

    const headingShape: TLShape = {
      id: createShapeId('s2'),
      type: 'text',
      x: 60,
      y: 10,
      props: { text: 'Title' },
      meta: { markdraw: { schema: 1, role: 'heading' } }
    } as unknown as TLShape;

    const buttonShape: TLShape = {
      id: createShapeId('s3'),
      type: 'geo',
      x: 150,
      y: 10,
      props: { geo: 'rectangle', w: 80, h: 30, text: 'Click' },
      meta: { markdraw: { schema: 1, role: 'button' } }
    } as unknown as TLShape;

    // Pass in reverse order to test sorting
    const unit = createUnitDefinition('Follow Card', 'card', [buttonShape, headingShape, avatarShape]);

    expect(unit.name).toBe('Follow Card');
    expect(unit.baseRole).toBe('card');
    expect(unit.id.startsWith('u_')).toBe(true);
    expect(unit.memberRoles).toEqual(['avatar', 'heading', 'button']);
    expect(unit.memberShapes).toHaveLength(3);
    expect(getShapeMeta(unit.memberShapes![0])?.unitId).toBe(unit.id);
  });

  it('supports unit storage CRUD operations in localStorage', () => {
    const unit: UnitDefinition = {
      id: 'u_test1',
      name: 'User Badge',
      tag: 'User Badge',
      baseRole: 'badge',
      memberRoles: ['avatar', 'heading'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    saveStoredUnit(unit);
    expect(getStoredUnits()).toHaveLength(1);
    expect(getStoredUnits()[0].name).toBe('User Badge');

    updateStoredUnit('u_test1', { name: 'Renamed Badge' });
    expect(getStoredUnits()[0].name).toBe('Renamed Badge');

    deleteStoredUnit('u_test1');
    expect(getStoredUnits()).toHaveLength(0);
  });

  it('compiles stamped unit group as ONE node with baseRole semantics and unit:"Name" prop', () => {
    const followCardUnit: UnitDefinition = {
      id: 'u_fc1',
      name: 'Follow Card',
      tag: 'Follow Card',
      baseRole: 'card',
      memberRoles: ['avatar', 'heading', 'button'],
      createdAt: 1729000000000,
      updatedAt: 1729000000000
    };

    const frameId = createShapeId('frame1');
    const groupId = createShapeId('group1');
    const avatarId = createShapeId('shp_av');
    const headingId = createShapeId('shp_hd');
    const buttonId = createShapeId('shp_btn');

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
      meta: { markdraw: { schema: 1, role: 'avatar', unitId: 'u_fc1' } }
    } as unknown as TLShape;

    const heading: TLShape = {
      id: headingId,
      type: 'text',
      parentId: groupId,
      x: 110,
      y: 60,
      props: { text: 'Alex' },
      meta: { markdraw: { schema: 1, role: 'heading', unitId: 'u_fc1', props: { variant: 'h3' } } }
    } as unknown as TLShape;

    const button: TLShape = {
      id: buttonId,
      type: 'geo',
      parentId: groupId,
      x: 200,
      y: 60,
      props: { geo: 'rectangle', w: 80, h: 30, text: 'Follow' },
      meta: { markdraw: { schema: 1, role: 'button', unitId: 'u_fc1', props: { label: 'Follow' } } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, group, avatar, heading, button], null, {
      units: [followCardUnit],
      includeLegend: true
    });

    // Check spec table:
    expect(res.markdownSpec).toContain('**[Follow Card]**');
    expect(res.markdownSpec).toContain('<Card>');
    expect(res.markdownSpec).toContain('unit:"Follow Card"');
    expect(res.markdownSpec).toContain('avatar, heading, "Follow"');

    // Check two-layer legend contains Custom Units table:
    expect(res.markdownSpec).toContain('#### Custom Units');
    expect(res.markdownSpec).toContain('| [Follow Card] | Card | avatar + heading + button |');
  });

  it('stampUnit creates shapes and native group on tldraw editor mock', () => {
    const createdShapes: any[] = [];
    let groupedIds: any[] = [];
    let groupShape: any = null;

    const editorMock = {
      getViewportPageBounds: () => ({ center: { x: 400, y: 300 } }),
      createShapes: (shapes: any[]) => {
        createdShapes.push(...shapes);
      },
      groupShapes: (ids: any[], opts: any) => {
        groupedIds = ids;
        const grpId = typeof opts === 'object' ? opts?.groupId : opts;
        groupShape = { id: grpId, type: 'group' };
      },
      updateShape: (shape: any) => {
        if (groupShape && shape.id === groupShape.id) {
          groupShape = { ...groupShape, ...shape };
        }
      }
    } as unknown as any;

    const unit: UnitDefinition = {
      id: 'u_stamp_test',
      name: 'Stat Card',
      tag: 'Stat Card',
      baseRole: 'card',
      memberRoles: ['icon', 'heading'],
      memberShapes: [
        {
          id: createShapeId('s1'),
          type: 'geo',
          x: 0,
          y: 0,
          props: { geo: 'rectangle' },
          meta: { markdraw: { schema: 1, role: 'icon' } }
        } as unknown as TLShape,
        {
          id: createShapeId('s2'),
          type: 'text',
          x: 50,
          y: 0,
          props: { text: '12k' },
          meta: { markdraw: { schema: 1, role: 'heading' } }
        } as unknown as TLShape
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const grpId = stampUnit(editorMock, unit, { x: 50, y: 50 });
    expect(grpId).toBeDefined();
    expect(createdShapes).toHaveLength(2);
    expect(groupedIds).toHaveLength(2);
    expect(groupShape.meta.markdraw.unitId).toBe('u_stamp_test');
    expect(groupShape.meta.markdraw.role).toBe('card');
  });
});
