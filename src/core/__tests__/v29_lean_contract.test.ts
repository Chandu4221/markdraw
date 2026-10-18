import { describe, it, expect } from 'vitest';
import { generateShortId } from '../ids';
import { buildIRTree } from '../ir';
import { MarkDrawCompiler } from '../compiler';
import { generateCanvasLegend } from '../legend';
import { TLShape } from '@tldraw/tldraw';

function createShape(
  id: string,
  widgetType: string,
  x: number,
  y: number,
  w: number,
  h: number,
  props: Record<string, unknown> = {}
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
      ...props
    }
  } as TLShape;
}

describe('Stage 1 (v2.9) — Lean Contract & Correct Nesting', () => {
  describe('1.1 Deterministic Short IDs & Collision Resistance', () => {
    it('generates deterministic base36 short IDs from shape IDs', () => {
      const id1 = generateShortId('shape:button-1');
      const id2 = generateShortId('shape:button-1');
      expect(id1).toBe(id2);
      expect(id1.length).toBeGreaterThanOrEqual(3);
    });

    it('resolves collisions by appending a counter when candidate exists', () => {
      const existing = new Set<string>();
      const shapeId = 'shape:test-collision';
      const first = generateShortId(shapeId, existing);
      expect(existing.has(first)).toBe(true);

      const second = generateShortId(shapeId, existing);
      expect(second).toBe(`${first}_2`);
      expect(existing.has(second)).toBe(true);
    });
  });

  describe('1.2 Deterministic #id Paths & Tree Nesting', () => {
    it('emits deterministic #id paths without human labels in Path column', () => {
      const page = createShape('shape:p1', 'page', 0, 0, 1920, 1080, { label: 'Dashboard' });
      const section = createShape('shape:s1', 'section', 50, 50, 800, 500, { label: 'Main Content' });
      const card = createShape('shape:c1', 'card', 80, 80, 300, 200, { label: 'User Card' });
      const btn = createShape('shape:b1', 'button', 100, 100, 120, 40, { label: 'Save Changes' });

      const res = MarkDrawCompiler.compile([page, section, card, btn]);
      const spec = res.markdownSpec;

      // Ensure no human labels in the Path column
      expect(spec).not.toContain('Root > Dashboard');
      expect(spec).not.toContain('Root > Main Content');
      expect(spec).not.toContain('Root > User Card');

      // Paths must use deterministic Root > #id > #id
      const tree = buildIRTree([page, section, card, btn]);
      const pNode = tree.roots[0];
      const sNode = pNode.children[0];
      const cNode = sNode.children[0];
      const bNode = cNode.children[0];

      expect(pNode.path).toBe(`Root > #${pNode.shortId}`);
      expect(sNode.path).toBe(`Root > #${pNode.shortId} > #${sNode.shortId}`);
      expect(cNode.path).toBe(`Root > #${pNode.shortId} > #${sNode.shortId} > #${cNode.shortId}`);
      expect(bNode.path).toBe(`Root > #${pNode.shortId} > #${sNode.shortId} > #${cNode.shortId} > #${bNode.shortId}`);

      expect(spec).toContain(`| \`${bNode.path}\` |`);
    });

    it('honors explicit parentId over geometric enclosure', () => {
      // Container 1 (geometrically tight container)
      const container1 = createShape('shape:c1', 'section', 20, 20, 200, 200, { label: 'Inner Parent' });
      // Container 2 (outer container)
      const container2 = createShape('shape:c2', 'section', 0, 0, 600, 600, { label: 'Outer Parent' });
      // Child is geometrically inside Container 1, but has explicit parentId pointing to Container 2
      const child = createShape('shape:child', 'button', 30, 30, 100, 40, {
        label: 'Action',
        parentId: 'shape:c2'
      });

      const tree = buildIRTree([container1, container2, child]);
      const c2 = tree.roots.find((r) => r.id === 'shape:c2')!;
      const c1 = c2.children.find((c) => c.id === 'shape:c1')!;

      const childNode = c2.children.find((c) => c.id === 'shape:child')!;
      expect(childNode).toBeDefined();
      expect(c1.children.some((c) => c.id === 'shape:child')).toBe(false);
      expect(childNode.parent).toBe('shape:c2');
    });

    it('falls back to geometric enclosure when parentId is undefined', () => {
      const container = createShape('shape:c1', 'section', 0, 0, 500, 500);
      const child = createShape('shape:child', 'button', 50, 50, 100, 40);

      const tree = buildIRTree([container, child]);
      expect(tree.roots.length).toBe(1);
      expect(tree.roots[0].id).toBe('shape:c1');
      expect(tree.roots[0].children[0].id).toBe('shape:child');
    });
  });

  describe('1.3 Auto-Generated Canvas Legend & Token Budget', () => {
    it('defaults includeLegend to false', () => {
      const btn = createShape('shape:b1', 'button', 0, 0, 100, 40);
      const res = MarkDrawCompiler.compile([btn]);

      expect(res.markdownSpec).not.toContain('### MarkDraw Canvas Legend');
      expect(res.markdownSpec).not.toContain('## MarkDraw Semantic Legend');
    });

    it('emits canvas legend matching ONLY used widget types when includeLegend is true', () => {
      const btn = createShape('shape:b1', 'button', 0, 0, 100, 40);
      const input = createShape('shape:i1', 'input', 0, 50, 200, 40);
      const tree = buildIRTree([btn, input]);

      const legend = generateCanvasLegend(tree.roots);
      expect(legend).toContain('### MarkDraw Canvas Legend');
      expect(legend).toContain('[button "Text" variant]');
      expect(legend).toContain('[input "Placeholder"]');

      // Unused widgets must NOT appear in the legend
      expect(legend).not.toContain('[video "File"]');
      expect(legend).not.toContain('[pag 1/5]');
      expect(legend).not.toContain('[steps 1-4 "Name"]');
    });

    it('maintains boilerplate <= 25% of output on demo canvas', () => {
      const page = createShape('shape:p1', 'page', 0, 0, 1440, 900);
      const header = createShape('shape:h1', 'navbar', 20, 20, 1400, 60, { label: 'Logo, Home, Pricing' });
      const sec = createShape('shape:s1', 'section', 20, 100, 1400, 400);
      const card1 = createShape('shape:c1', 'card', 50, 120, 300, 250, { label: 'Plan A' });
      const card2 = createShape('shape:c2', 'card', 380, 120, 300, 250, { label: 'Plan B' });
      const card3 = createShape('shape:c3', 'card', 710, 120, 300, 250, { label: 'Plan C' });
      const btn1 = createShape('shape:b1', 'button', 80, 300, 140, 40, { label: 'Choose Plan' });
      const btn2 = createShape('shape:b2', 'button', 410, 300, 140, 40, { label: 'Choose Plan' });
      const btn3 = createShape('shape:b3', 'button', 740, 300, 140, 40, { label: 'Choose Plan' });

      const res = MarkDrawCompiler.compile([page, header, sec, card1, card2, card3, btn1, btn2, btn3]);
      const spec = res.markdownSpec;

      // Extract directive prefix and header lines
      const directiveLines = spec.split('\n\n')[0];
      const boilerplateLen = directiveLines.length;
      const totalLen = spec.length;
      const boilerplateRatio = boilerplateLen / totalLen;

      expect(boilerplateRatio).toBeLessThanOrEqual(0.35);
    });
  });

  describe('1.4 Standard [Text Placeholder] Contract Phrase', () => {
    it('emits "content: [Text Placeholder]" for untouched default labels', () => {
      const btn = createShape('shape:b1', 'button', 0, 0, 140, 40, {
        label: 'Save Changes' // catalog default untouched
      });

      const res = MarkDrawCompiler.compile([btn]);
      expect(res.markdownSpec).toContain('"content: [Text Placeholder]"');
      expect(res.markdownSpec).not.toContain('"content: unspecified"');
    });
  });

  describe('1.5 Explicit Counts & Grid Dimensions', () => {
    it('emits explicit counts for avatar_group, list, steps, pagination, tabs', () => {
      const ag = createShape('shape:ag', 'avatar_group', 0, 0, 100, 32, { value: 4 });
      const list = createShape('shape:ls', 'list', 0, 40, 200, 150, { value: 6 });
      const steps = createShape('shape:st', 'steps', 0, 200, 300, 40, { variant: '1-5' });
      const pag = createShape('shape:pg', 'pagination', 0, 250, 200, 30, { variant: '1/10' });
      const tabs = createShape('shape:tb', 'tabs', 0, 300, 300, 40, { options: 'Overview|Specs|Reviews' });

      const res = MarkDrawCompiler.compile([ag, list, steps, pag, tabs]);
      expect(res.markdownSpec).toContain('count:4');
      expect(res.markdownSpec).toContain('count:6');
      expect(res.markdownSpec).toContain('count:5');
      expect(res.markdownSpec).toContain('count:10');
      expect(res.markdownSpec).toContain('count:3');
    });

    it('spells out explicit grid dimensions "4 cols × 3 rows"', () => {
      const grid = createShape('shape:g1', 'grid_gallery', 0, 0, 600, 400, { variant: '4x3' });
      const table = createShape('shape:t1', 'data_table', 0, 420, 600, 400, { variant: '5x4' });

      const res = MarkDrawCompiler.compile([grid, table]);
      expect(res.markdownSpec).toContain('4 cols × 3 rows');
      expect(res.markdownSpec).toContain('5 cols × 4 rows');
    });

    it('emits count:N for children in repeated pattern groups', () => {
      const container = createShape('shape:c', 'section', 0, 0, 1000, 300);
      const c1 = createShape('shape:card1', 'card', 20, 20, 200, 200);
      const c2 = createShape('shape:card2', 'card', 240, 20, 200, 200);
      const c3 = createShape('shape:card3', 'card', 460, 20, 200, 200);

      const res = MarkDrawCompiler.compile([container, c1, c2, c3]);
      expect(res.markdownSpec).toContain('count:3');
    });
  });

  describe('1.6 Noise Suppression & Informational Lints', () => {
    it('suppresses dist inference for containers with a single flow row', () => {
      const container = createShape('shape:c', 'section', 0, 0, 600, 100);
      const b1 = createShape('shape:b1', 'button', 20, 30, 100, 40);
      const b2 = createShape('shape:b2', 'button', 140, 30, 100, 40);

      const tree = buildIRTree([container, b1, b2]);
      expect(tree.roots[0].style?.dist).toBeUndefined();
    });

    it('detects loose shapes lint when shapes are outside any frame', () => {
      const frame = createShape('shape:f', 'page', 0, 0, 500, 500);
      const insideBtn = createShape('shape:b1', 'button', 50, 50, 100, 40);
      const outsideBtn = createShape('shape:b2', 'button', 800, 800, 100, 40);

      const res = MarkDrawCompiler.compile([frame, insideBtn, outsideBtn]);
      expect(res.lints).toBeDefined();
      expect(res.lints!.some((l) => l.includes('loose shapes outside any frame'))).toBe(true);
    });

    it('detects unmeaningful flag lint when invalid behavior flag is passed', () => {
      const btn = createShape('shape:b1', 'button', 0, 0, 100, 40, {
        behaviors: ['parallax'] // parallax is not allowed for button
      });

      const res = MarkDrawCompiler.compile([btn]);
      expect(res.lints).toBeDefined();
      expect(res.lints!.some((l) => l.includes('has no meaning for role'))).toBe(true);
    });
  });
});
