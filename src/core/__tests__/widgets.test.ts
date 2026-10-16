import { describe, it, expect } from 'vitest';
import { MarkDrawCompiler } from '../compiler';
import { TLShape } from '@tldraw/tldraw';

function createWidgetShape(
  id: string,
  widgetType: string,
  x: number,
  y: number,
  w: number,
  h: number,
  extraProps: Record<string, any> = {}
): TLShape {
  return {
    id,
    type: 'ui-widget',
    x,
    y,
    rotation: 0,
    index: 'a1',
    parentId: 'page:page',
    isLocked: false,
    opacity: 1,
    meta: {},
    props: {
      w,
      h,
      widgetType,
      label: extraProps.label || widgetType,
      variant: extraProps.variant || '',
      placeholder: extraProps.placeholder || '',
      checked: extraProps.checked ?? false,
      options: extraProps.options || '',
      iconName: extraProps.iconName || '',
      subtext: extraProps.subtext || '',
      value: extraProps.value ?? 0,
      ...extraProps
    }
  } as any;
}

describe('Custom UI Widgets System', () => {
  it('normalizes custom widgets with exact widgetType and props', () => {
    const btnShape = createWidgetShape('btn-1', 'button', 10, 10, 140, 40, {
      label: 'Submit Order',
      variant: 'primary',
      iconName: 'ArrowRight'
    });

    const normalized = MarkDrawCompiler.normalize([btnShape]);
    expect(normalized.length).toBe(1);
    expect(normalized[0].widgetType).toBe('button');
    expect(normalized[0].role).toBe('button');
    expect(normalized[0].widgetProps?.variant).toBe('primary');
    expect(normalized[0].widgetProps?.iconName).toBe('ArrowRight');
  });

  it('correctly maps form controls to input role', () => {
    const inputShape = createWidgetShape('in-1', 'input', 0, 0, 200, 60, {
      label: 'Email',
      placeholder: 'you@domain.com'
    });
    const checkShape = createWidgetShape('chk-1', 'checkbox', 0, 70, 180, 30, {
      label: 'Remember Me',
      checked: true
    });
    const toggleShape = createWidgetShape('tog-1', 'toggle', 0, 110, 180, 30, {
      label: 'Dark Mode',
      checked: false
    });

    const normalized = MarkDrawCompiler.normalize([inputShape, checkShape, toggleShape]);
    expect(normalized[0].role).toBe('input');
    expect(normalized[1].role).toBe('input');
    expect(normalized[2].role).toBe('input');
    expect(normalized[1].widgetProps?.checked).toBe(true);
  });

  it('correctly builds containment hierarchy with Card and child widgets', () => {
    // Card: (0, 0, 400, 300)
    // Email Input: (20, 40, 360, 60) inside Card
    // Submit Button: (20, 120, 140, 40) inside Card
    const card = createWidgetShape('card-1', 'card', 0, 0, 400, 300, {
      label: 'LoginFormCard'
    });
    const email = createWidgetShape('input-1', 'input', 20, 40, 360, 60, {
      label: 'EmailField',
      placeholder: 'user@example.com'
    });
    const submit = createWidgetShape('btn-1', 'button', 20, 120, 140, 40, {
      label: 'SignInBtn',
      variant: 'primary'
    });

    const result = MarkDrawCompiler.compile([card, email, submit]);
    const ast = JSON.parse(result.jsonAst);

    expect(ast.length).toBe(1);
    expect(ast[0].id).toBe('card-1');
    expect(ast[0].widgetType).toBe('card');
    expect(ast[0].role).toBe('container');
    expect(ast[0].children.length).toBe(2);

    expect(ast[0].children[0].id).toBe('input-1');
    expect(ast[0].children[0].parent).toBe('card-1');
    expect(ast[0].children[1].id).toBe('btn-1');
    expect(ast[0].children[1].parent).toBe('card-1');
  });

  it('outputs rich props in Markdown Spec Table', () => {
    const modal = createWidgetShape('modal-1', 'modal', 0, 0, 500, 400, {
      label: 'AuthDialog'
    });
    const check = createWidgetShape('chk-1', 'checkbox', 30, 80, 200, 30, {
      label: 'AcceptTerms',
      checked: true
    });
    const btn = createWidgetShape('btn-1', 'button', 30, 150, 160, 40, {
      label: 'ContinueBtn',
      variant: 'primary',
      iconName: 'ArrowRight'
    });

    const result = MarkDrawCompiler.compile([modal, check, btn]);
    const md = result.markdownSpec;

    expect(md).toContain('### MarkDraw UI Specification');
    expect(md).toContain('<Modal>');
    expect(md).toContain('<Checkbox>');
    expect(md).toContain('<Button>');
    expect(md).toContain('checked=true');
    expect(md).toContain('variant="primary"');
    expect(md).toContain('icon="ArrowRight"');
  });

  it('formats custom widgets properly in spatial grid table', () => {
    const nav = createWidgetShape('nav-1', 'navbar', 10, 10, 600, 50, {
      label: 'TopNavigation'
    });
    const btn = createWidgetShape('btn-1', 'button', 10, 80, 140, 40, {
      label: 'ActionBtn'
    });

    const result = MarkDrawCompiler.compile([nav, btn]);
    expect(result.markdownGrid).toContain('### Spatial Grid Layout Table');
    expect(result.markdownGrid).toContain('[Navbar: "TopNavigation"]');
    expect(result.markdownGrid).toContain('[Button: "ActionBtn"]');
  });
});
