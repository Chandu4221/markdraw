import { describe, it, expect } from 'vitest';
import { AsciiSerializer } from '../ascii';
import { LayoutNode } from '../types';

function createNode(
  id: string,
  label: string,
  role: any = 'container',
  direction: 'Row' | 'Column' | 'Leaf' = 'Leaf',
  children: LayoutNode[] = [],
  widgetType?: string
): LayoutNode {
  return {
    id,
    label,
    role,
    direction,
    children,
    parent: null,
    path: 'Root',
    widgetType,
    shape: {
      id,
      type: 'ui-widget',
      role,
      text: label,
      color: 'black',
      isDashed: false,
      bounds: { x: 0, y: 0, w: 100, h: 100 },
      aabb: { x1: 0, y1: 0, x2: 100, y2: 100 }
    }
  };
}

describe('AsciiSerializer', () => {
  it('returns placeholder message when canvas is empty', () => {
    const output = AsciiSerializer.serialize([]);
    expect(output).toContain('_Canvas is empty');
  });

  it('renders single box with box-drawing characters for leaf element', () => {
    const node = createNode('btn-1', 'SaveButton', 'button', 'Leaf', [], 'button');
    const output = AsciiSerializer.serialize([node], 40);

    expect(output).toContain('┌─');
    expect(output).toContain('SaveButton');
    expect(output).toContain('<button>');
    expect(output).toContain('└─');
  });

  it('renders column container enclosing its children', () => {
    const child1 = createNode('in-1', 'NameField', 'input', 'Leaf', [], 'input');
    const child2 = createNode('btn-1', 'Submit', 'button', 'Leaf', [], 'button');
    const parent = createNode('card-1', 'FormCard', 'container', 'Column', [child1, child2], 'card');

    const output = AsciiSerializer.serialize([parent], 60);

    expect(output).toContain('FormCard');
    expect(output).toContain('(Column)');
    expect(output).toContain('NameField');
    expect(output).toContain('Submit');
    expect(output).toContain('┌');
    expect(output).toContain('│');
    expect(output).toContain('┘');
  });

  it('renders row container with side-by-side children', () => {
    const left = createNode('btn-1', 'Cancel', 'button', 'Leaf', [], 'button');
    const right = createNode('btn-2', 'Confirm', 'button', 'Leaf', [], 'button');
    const parent = createNode('nav-1', 'ActionGroup', 'container', 'Row', [left, right], 'section');

    const output = AsciiSerializer.serialize([parent], 70);

    expect(output).toContain('ActionGroup');
    expect(output).toContain('(Row)');
    expect(output).toContain('Cancel');
    expect(output).toContain('Confirm');
  });
});
