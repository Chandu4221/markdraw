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
    const pageRow = lines.find((l) => l.includes('`Root`') && l.includes('page'));
    expect(pageRow).toContain('| — |');

    // Hero gets placement 'header'
    const heroRow = lines.find((l) => l.includes('**[hero "Hero Top"]**'));
    expect(heroRow).toContain('| header |');

    // Features Section gets placement 'body'
    const secRow = lines.find((l) => l.includes('**[section "Features"]**'));
    expect(secRow).toContain('| body |');

    // Button inside section gets placement 'nested'
    const btnRow = lines.find((l) => l.includes('**[btn "Learn More"]**'));
    expect(btnRow).toContain('| nested |');

    // Footer nav gets placement 'footer'
    const footRow = lines.find((l) => l.includes('**[footer_nav "Footer Links"]**'));
    expect(footRow).toContain('| footer |');
  });

  it('omits default-valued props and emits bare tags with content: unspecified for untouched widgets', () => {
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
    expect(res.markdownSpec).toContain('**[btn]**');
    expect(res.markdownSpec).toContain('"content: unspecified"');
    // Props & Attributes should be '—' since all props match catalog defaults
    expect(res.markdownSpec).toContain('| — | "content: unspecified" |');
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

