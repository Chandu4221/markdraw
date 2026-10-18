import { describe, it, expect } from 'vitest';
import { MarkDrawCompiler } from '../compiler';
import { buildIRTree } from '../ir';
import { TLShape } from '../types';

function createWidgetShape(
  id: string,
  widgetType: string,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string = ''
): TLShape {
  return {
    id: id as any,
    type: 'ui-widget',
    x,
    y,
    props: {
      w,
      h,
      widgetType,
      label
    }
  } as TLShape;
}

describe('Compiler Hierarchy & Serializers', () => {
  it('correctly creates multi-level hierarchy: Screen -> Card -> Button with shortId paths', () => {
    // Screen: (0, 0, 400, 800)
    // Card: (20, 100, 360, 200) inside Screen
    // Button: (40, 150, 120, 40) inside Card
    const screen = createWidgetShape('shape:screen', 'section', 0, 0, 400, 800, 'MobileFrame');
    const card = createWidgetShape('shape:card', 'card', 20, 100, 360, 200, 'ProfileCard');
    const button = createWidgetShape('shape:button', 'button', 40, 150, 120, 40, 'SaveButton');

    const tree = buildIRTree([screen, card, button]);

    expect(tree.roots.length).toBe(1);
    expect(tree.roots[0].id).toBe('shape:screen');
    expect(tree.roots[0].path).toBe(`Root > #${tree.roots[0].shortId}`);

    expect(tree.roots[0].children.length).toBe(1);
    const cardNode = tree.roots[0].children[0];
    expect(cardNode.id).toBe('shape:card');
    expect(cardNode.parent).toBe('shape:screen');
    expect(cardNode.path).toBe(`${tree.roots[0].path} > #${cardNode.shortId}`);

    expect(cardNode.children.length).toBe(1);
    const buttonNode = cardNode.children[0];
    expect(buttonNode.id).toBe('shape:button');
    expect(buttonNode.parent).toBe('shape:card');
    expect(buttonNode.path).toBe(`${cardNode.path} > #${buttonNode.shortId}`);
  });

  it('infers Column direction for vertically stacked items and sorts by y', () => {
    const parent = createWidgetShape('shape:parent', 'section', 0, 0, 200, 400, 'List');
    const item1 = createWidgetShape('shape:item1', 'input', 20, 200, 160, 40, 'Second');
    const item2 = createWidgetShape('shape:item2', 'input', 20, 50, 160, 40, 'First');

    const tree = buildIRTree([parent, item1, item2]);
    expect(tree.roots[0].direction).toBe('Column');
    expect(tree.roots[0].children[0].id).toBe('shape:item2');
    expect(tree.roots[0].children[1].id).toBe('shape:item1');
  });

  it('infers Row direction for horizontally aligned items and sorts by x', () => {
    const parent = createWidgetShape('shape:parent', 'section', 0, 0, 400, 100, 'Nav');
    const right = createWidgetShape('shape:right', 'button', 250, 20, 80, 40, 'RightBtn');
    const left = createWidgetShape('shape:left', 'button', 30, 20, 80, 40, 'LeftBtn');

    const tree = buildIRTree([parent, right, left]);
    expect(tree.roots[0].direction).toBe('Row');
    expect(tree.roots[0].children[0].id).toBe('shape:left');
    expect(tree.roots[0].children[1].id).toBe('shape:right');
  });

  it('promotes any shape holding >= 2 items to container', () => {
    const box = createWidgetShape('shape:box', 'input', 0, 0, 300, 300, 'Box');
    const child1 = createWidgetShape('shape:c1', 'button', 10, 10, 50, 50, 'B1');
    const child2 = createWidgetShape('shape:c2', 'button', 10, 80, 50, 50, 'B2');

    const tree = buildIRTree([box, child1, child2]);
    expect(tree.roots[0].role).toBe('card');
    expect(tree.roots[0].children.length).toBe(2);
  });

  it('serializes hierarchy table to valid Markdown', () => {
    const screen = createWidgetShape('shape:screen', 'section', 0, 0, 400, 800, 'MobileFrame');
    const button = createWidgetShape('shape:button', 'button', 40, 150, 120, 40, 'SaveButton');
    const tree = buildIRTree([screen, button]);

    const md = MarkDrawCompiler.serializeSpecTable(tree.roots);
    expect(md).toContain('### MarkDraw UI Specification');
    expect(md).toContain('[section "MobileFrame"]');
    expect(md).toContain('[button "SaveButton"]');
  });

  it('serializes spatial grid to tabular Markdown', () => {
    const col1 = createWidgetShape('shape:c1', 'button', 10, 20, 100, 50, 'Header1');
    const col2 = createWidgetShape('shape:c2', 'button', 150, 25, 100, 50, 'Header2');

    const tree = buildIRTree([col1, col2]);
    const grid = MarkDrawCompiler.serializeSpatialGrid(tree.roots);

    expect(grid).toContain('### Spatial Grid Layout Table');
    expect(grid).toContain('| Col 1 | Col 2 |');
  });

  it('infers placement semantics (header, footer, body, nested) relative to page root', () => {
    // Page: 0, 0, 1920, 1080
    // Header Hero: top band (x=100, y=20, w=1500, h=100) -> header
    // Features Section: middle (x=100, y=300, w=1500, h=400) -> body
    // Button inside Section: (x=150, y=350, w=140, h=40) -> nested
    // Footer Nav: bottom band (x=100, y=950, w=1500, h=100) -> footer
    const page = {
      id: 'page-1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 1920, h: 1080, widgetType: 'page', label: 'App' }
    } as any;
    const hero = {
      id: 'hero-1' as any,
      type: 'ui-widget',
      x: 100,
      y: 20,
      props: { w: 1500, h: 100, widgetType: 'hero', label: 'Hero Top' }
    } as any;
    const section = {
      id: 'sec-1' as any,
      type: 'ui-widget',
      x: 100,
      y: 300,
      props: { w: 1500, h: 400, widgetType: 'section', label: 'Features' }
    } as any;
    const btn = {
      id: 'btn-1' as any,
      type: 'ui-widget',
      x: 150,
      y: 350,
      props: { w: 140, h: 40, widgetType: 'button', label: 'Learn More' }
    } as any;
    const footerNav = {
      id: 'foot-1' as any,
      type: 'ui-widget',
      x: 100,
      y: 950,
      props: { w: 1500, h: 100, widgetType: 'footer_nav', label: 'Footer Links' }
    } as any;

    const res = MarkDrawCompiler.compile([page, hero, section, btn, footerNav]);
    const lines = res.markdownSpec.split('\n');

    // Page root gets placement '—'
    const pageRow = lines.find((l) => l.includes('`Root > #') && l.includes('<Page>'));
    expect(pageRow).toContain('| — |');

    // Hero gets placement 'header'
    const heroRow = lines.find((l) => l.includes('**[section "Hero Top"'));
    expect(heroRow).toBeDefined();
    expect(heroRow).toContain('| header |');

    // Features Section gets placement 'body'
    const secRow = lines.find((l) => l.includes('**[section "Features"]**'));
    expect(secRow).toBeDefined();
    expect(secRow).toContain('| body |');

    // Button inside section gets placement 'nested'
    const btnRow = lines.find((l) => l.includes('**[button "Learn More"]**'));
    expect(btnRow).toBeDefined();
    expect(btnRow).toContain('| nested |');

    // Footer nav gets placement 'footer'
    const footRow = lines.find((l) => l.includes('**[nav "Footer Links"]**'));
    expect(footRow).toBeDefined();
    expect(footRow).toContain('| footer |');
  });

  it('omits default-valued props and emits bare tags with content: [Text Placeholder] for untouched widgets', () => {
    // Untouched button with default props
    const btnUntouched = {
      id: 'btn-def' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: {
        w: 140,
        h: 40,
        widgetType: 'button',
        label: 'Save Changes',
        variant: 'solid',
        checked: false,
        showText: false
      }
    } as any;

    const res = MarkDrawCompiler.compile([btnUntouched]);
    expect(res.markdownSpec).toContain('**[button]**');
    expect(res.markdownSpec).toContain('"content: [Text Placeholder]"');
    // Props & Attributes should be '—' since all props match catalog defaults
    expect(res.markdownSpec).toContain('| — | "content: [Text Placeholder]" |');
    // Confirm no noise like checked=false or showText=false anywhere
    expect(res.markdownSpec).not.toContain('checked=false');
    expect(res.markdownSpec).not.toContain('showText=false');

    // JSON AST should also omit default-valued props
    const json = JSON.parse(res.jsonAst);
    expect(json[0].textProps.checked).toBeUndefined();
    expect(json[0].textProps.showText).toBeUndefined();
  });

  it('guarantees byte-for-byte deterministic output on repeated compilations', () => {
    const s1 = {
      id: 'b1' as any,
      type: 'ui-widget',
      x: 10,
      y: 10,
      props: { w: 100, h: 40, widgetType: 'button', label: 'Go' }
    } as any;
    const s2 = {
      id: 'c1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 300, h: 200, widgetType: 'card', label: 'Card' }
    } as any;

    const res1 = MarkDrawCompiler.compile([s1, s2]);
    const res2 = MarkDrawCompiler.compile([s1, s2]);

    expect(res1.markdownSpec).toBe(res2.markdownSpec);
    expect(res1.markdownGrid).toBe(res2.markdownGrid);
    expect(res1.markdownAscii).toBe(res2.markdownAscii);
    expect(res1.jsonAst).toBe(res2.jsonAst);
  });
});
