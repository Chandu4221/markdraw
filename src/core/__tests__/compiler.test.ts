import { describe, it, expect } from 'vitest';
import { MarkDrawCompiler } from '../compiler';
import { NormalizedShape } from '../types';
import { computeAABB } from '../geometry';

function createShape(
  id: string,
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  role: any = 'container',
  text: string = ''
): NormalizedShape {
  const bounds = { x, y, w, h };
  return {
    id,
    type,
    bounds,
    aabb: computeAABB(bounds),
    role,
    text,
    color: 'black',
    isDashed: false
  };
}

describe('Compiler Hierarchy & Serializers', () => {
  it('correctly creates multi-level hierarchy: Screen -> Card -> Button', () => {
    // Screen: (0, 0, 400, 800)
    // Card: (20, 100, 360, 200) inside Screen
    // Button: (40, 150, 120, 40) inside Card
    const screen = createShape('screen', 'geo', 0, 0, 400, 800, 'container', 'MobileFrame');
    const card = createShape('card', 'geo', 20, 100, 360, 200, 'container', 'ProfileCard');
    const button = createShape('button', 'geo', 40, 150, 120, 40, 'button', 'SaveButton');

    const roots = MarkDrawCompiler.buildHierarchy([screen, card, button]);

    expect(roots.length).toBe(1);
    expect(roots[0].id).toBe('screen');
    expect(roots[0].path).toBe('Root');

    expect(roots[0].children.length).toBe(1);
    const cardNode = roots[0].children[0];
    expect(cardNode.id).toBe('card');
    expect(cardNode.parent).toBe('screen');
    expect(cardNode.path).toBe('Root > MobileFrame');

    expect(cardNode.children.length).toBe(1);
    const buttonNode = cardNode.children[0];
    expect(buttonNode.id).toBe('button');
    expect(buttonNode.parent).toBe('card');
    expect(buttonNode.path).toBe('Root > MobileFrame > ProfileCard');
  });

  it('infers Column direction for vertically stacked items and sorts by y', () => {
    const parent = createShape('parent', 'geo', 0, 0, 200, 400, 'container', 'List');
    const item1 = createShape('item1', 'geo', 20, 200, 160, 40, 'input', 'Second');
    const item2 = createShape('item2', 'geo', 20, 50, 160, 40, 'input', 'First');

    const roots = MarkDrawCompiler.buildHierarchy([parent, item1, item2]);
    expect(roots[0].direction).toBe('Column');
    expect(roots[0].children[0].id).toBe('item2');
    expect(roots[0].children[1].id).toBe('item1');
  });

  it('infers Row direction for horizontally aligned items and sorts by x', () => {
    const parent = createShape('parent', 'geo', 0, 0, 400, 100, 'container', 'Nav');
    const right = createShape('right', 'geo', 250, 20, 80, 40, 'button', 'RightBtn');
    const left = createShape('left', 'geo', 30, 20, 80, 40, 'button', 'LeftBtn');

    const roots = MarkDrawCompiler.buildHierarchy([parent, right, left]);
    expect(roots[0].direction).toBe('Row');
    expect(roots[0].children[0].id).toBe('left');
    expect(roots[0].children[1].id).toBe('right');
  });

  it('promotes any shape holding >= 2 items to container', () => {
    const box = createShape('box', 'geo', 0, 0, 300, 300, 'input', 'Box');
    const child1 = createShape('c1', 'geo', 10, 10, 50, 50, 'button', 'B1');
    const child2 = createShape('c2', 'geo', 10, 80, 50, 50, 'button', 'B2');

    const roots = MarkDrawCompiler.buildHierarchy([box, child1, child2]);
    expect(roots[0].role).toBe('container');
  });

  it('serializes hierarchy table to valid Markdown', () => {
    const screen = createShape('screen', 'geo', 0, 0, 400, 800, 'container', 'MobileFrame');
    const button = createShape('button', 'geo', 40, 150, 120, 40, 'button', 'SaveButton');
    const roots = MarkDrawCompiler.buildHierarchy([screen, button]);

    const md = MarkDrawCompiler.serializeSpecTable(roots);
    expect(md).toContain('### MarkDraw UI Specification');
    expect(md).toContain('[section "MobileFrame"]');
    expect(md).toContain('[btn "SaveButton"]');
  });

  it('serializes spatial grid to tabular Markdown', () => {
    const col1 = createShape('c1', 'geo', 10, 20, 100, 50, 'button', 'Header1');
    const col2 = createShape('c2', 'geo', 150, 25, 100, 50, 'button', 'Header2');

    const roots = MarkDrawCompiler.buildHierarchy([col1, col2]);
    const grid = MarkDrawCompiler.serializeSpatialGrid(roots);

    expect(grid).toContain('### Spatial Grid Layout Table');
    expect(grid).toContain('| Col 1 | Col 2 |');
  });
});
