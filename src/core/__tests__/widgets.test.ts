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
    expect(result.markdownGrid).toContain('[nav "TopNavigation"]');
    expect(result.markdownGrid).toContain('[btn "ActionBtn"]');
  });

  it('prepends semantic legend table when includeLegend is true', () => {
    const btn = createWidgetShape('btn-1', 'button', 10, 10, 100, 40, { label: 'Click' });
    const result = MarkDrawCompiler.compile([btn], null, { includeLegend: true });

    expect(result.markdownSpec).toContain('### MarkDraw Canvas Legend');
    expect(result.markdownSpec).toContain('[btn "Text" variant]');
    expect(result.markdownSpec).toContain('[Text Placeholder]');
    expect(result.markdownGrid).toContain('### MarkDraw Canvas Legend');
  });

  it('ensures byte-for-byte deterministic output when includeTimestamp is false', () => {
    const btn = createWidgetShape('btn-1', 'button', 10, 10, 100, 40, { label: 'Click' });
    const result1 = MarkDrawCompiler.compile([btn], null, { includeTimestamp: false });
    const result2 = MarkDrawCompiler.compile([btn], null, { includeTimestamp: false });

    expect(result1.markdownSpec).toBe(result2.markdownSpec);
    expect(result1.markdownSpec).not.toContain('**Generated:**');
  });

  it('correctly categorizes structural widgets as containers', () => {
    const section = createWidgetShape('sec-1', 'section', 0, 0, 600, 200, { label: 'HeroSec' });
    const hero = createWidgetShape('hero-1', 'hero', 0, 0, 600, 200, { label: 'Hero' });
    const gallery = createWidgetShape('gal-1', 'grid_gallery', 0, 0, 400, 200, { label: 'Grid' });
    const page = createWidgetShape('page-1', 'page', 0, 0, 1920, 1080, { label: 'App Shell', variant: 'fullhd' });

    const normalized = MarkDrawCompiler.normalize([section, hero, gallery, page]);
    expect(normalized[0].role).toBe('container');
    expect(normalized[1].role).toBe('container');
    expect(normalized[2].role).toBe('container');
    expect(normalized[3].role).toBe('container');
    expect(normalized[3].widgetType).toBe('page');
  });

  it('correctly builds containment hierarchy for Page frame with nested content', () => {
    const page = createWidgetShape('page-1', 'page', 0, 0, 1920, 1080, {
      label: 'Dashboard Page',
      variant: 'fullhd'
    });
    const header = createWidgetShape('head-1', 'heading', 60, 60, 400, 50, {
      label: 'Main Dashboard',
      variant: 'h1'
    });
    const actionBtn = createWidgetShape('btn-1', 'button', 60, 140, 140, 40, {
      label: 'Create Project'
    });

    const result = MarkDrawCompiler.compile([page, header, actionBtn]);
    const ast = JSON.parse(result.jsonAst);

    expect(ast.length).toBe(1);
    expect(ast[0].id).toBe('page-1');
    expect(ast[0].widgetType).toBe('page');
    expect(ast[0].role).toBe('container');
    expect(ast[0].children.length).toBe(2);
    expect(ast[0].children[0].id).toBe('head-1');
    expect(ast[0].children[1].id).toBe('btn-1');

    expect(result.markdownGrid).toContain('[page "Dashboard Page" fullhd]');
  });
});
