import { describe, it, expect } from 'vitest';
import { buildIRTree, serializeIRToJsonAst } from '../ir';
import { TLShape } from '../types';

function makeWidget(id: string, widgetType: string, x: number, y: number, w: number, h: number, props: any = {}): TLShape {
  return {
    id: id as any,
    typeName: 'shape',
    type: 'ui-widget',
    x,
    y,
    rotation: 0,
    index: 'a1' as any,
    parentId: 'page:page' as any,
    isLocked: false,
    opacity: 1,
    meta: { internalField: 'secret' },
    props: {
      w,
      h,
      widgetType,
      label: props.label || widgetType,
      variant: props.variant || 'solid',
      placeholder: props.placeholder || '',
      checked: props.checked ?? false,
      options: props.options || '',
      iconName: props.iconName || '',
      subtext: props.subtext || '',
      value: props.value ?? 0,
      showText: props.showText ?? false,
      altText: props.altText || '',
      dash: 'dashed',
      color: 'blue'
    }
  } as unknown as TLShape;
}

describe('Clean Intermediate Representation (IR)', () => {
  it('strips all tldraw internals from IR and JSON AST', () => {
    const card = makeWidget('card-1', 'card', 0, 0, 400, 300, { label: 'Card' });
    const btn = makeWidget('btn-1', 'button', 20, 50, 120, 40, { label: 'Click' });

    const ir = buildIRTree([card, btn]);
    expect(ir.elementCount).toBe(2);
    expect(ir.roots.length).toBe(1);

    const root = ir.roots[0];
    // Check IRNode fields
    expect(root.id).toBe('card-1');
    expect(root.widgetType).toBe('card');
    expect(root.role).toBe('card');
    expect((root as any).typeName).toBeUndefined();
    expect((root as any).meta).toBeUndefined();
    expect((root as any).dash).toBeUndefined();
    expect((root as any).color).toBeUndefined();

    // Check JSON AST serialization
    const json = serializeIRToJsonAst(ir);
    const parsed = JSON.parse(json);

    expect(parsed[0].id).toBe('card-1');
    expect(parsed[0].children[0].id).toBe('btn-1');

    // Confirm tldraw internals never appear anywhere in the JSON
    expect(json).not.toContain('typeName');
    expect(json).not.toContain('isLocked');
    expect(json).not.toContain('internalField');
    expect(json).not.toContain('page:page');
  });

  it('guarantees deterministic alphabetical key ordering in JSON AST', () => {
    const btn = makeWidget('btn-1', 'button', 10, 10, 100, 40, { label: 'Save', variant: 'ghost' });
    const ir = buildIRTree([btn]);
    const json = serializeIRToJsonAst(ir);

    const parsed = JSON.parse(json)[0];
    const keys = Object.keys(parsed);
    const sortedKeys = [...keys].sort();
    expect(keys).toEqual(sortedKeys);

    // textProps keys should also be sorted
    const textPropKeys = Object.keys(parsed.textProps);
    const sortedTextPropKeys = [...textPropKeys].sort();
    expect(textPropKeys).toEqual(sortedTextPropKeys);
  });

  it('ignores non-ui-widget shapes', () => {
    const drawShape = {
      id: 'draw-1' as any,
      type: 'draw',
      x: 0,
      y: 0,
      props: {}
    } as TLShape;

    const btn = makeWidget('btn-1', 'button', 10, 10, 100, 40, { label: 'Go' });
    const ir = buildIRTree([drawShape, btn]);

    expect(ir.elementCount).toBe(1);
    expect(ir.roots[0].id).toBe('btn-1');
  });
});
