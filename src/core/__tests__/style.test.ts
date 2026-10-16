import { describe, it, expect } from 'vitest';
import {
  getWidthBucket,
  inferDistribution,
  inferNodeStyle
} from '../style';
import { IRNode } from '../ir';

function mockNode(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  widgetType: string = 'card',
  textProps: any = {},
  children: IRNode[] = []
): IRNode {
  return {
    id,
    bounds: { x, y, w, h },
    children,
    direction: 'Leaf',
    label: id,
    parent: null,
    path: 'Root',
    role: 'container',
    textProps: { label: id, ...textProps },
    widgetType
  };
}

describe('Part A — Geometric Style Inference (src/core/style.ts)', () => {
  const parent = mockNode('parent', 0, 0, 1000, 1000, 'section');

  describe('A1. Size (Width & Height Buckets)', () => {
    it('buckets 95-100% as full-width', () => {
      const n1 = mockNode('n1', 0, 0, 980, 100);
      expect(getWidthBucket(n1, parent)).toBe('full-width');
      const n2 = mockNode('n2', 0, 0, 1000, 100);
      expect(getWidthBucket(n2, parent)).toBe('full-width');
    });

    it('buckets 75% with tolerance', () => {
      const n = mockNode('n', 0, 0, 740, 100);
      expect(getWidthBucket(n, parent, 2)).toBe('75%');
    });

    it('buckets 2/3 (66/67%) with tolerance', () => {
      const n = mockNode('n', 0, 0, 666, 100);
      expect(getWidthBucket(n, parent, 2)).toBe('2/3');
    });

    it('buckets 50% with tolerance', () => {
      const n = mockNode('n', 0, 0, 510, 100);
      expect(getWidthBucket(n, parent, 2)).toBe('50%');
    });

    it('buckets 1/3 (33/34%) with tolerance', () => {
      const n = mockNode('n', 0, 0, 333, 100);
      expect(getWidthBucket(n, parent, 2)).toBe('1/3');
    });

    it('buckets 25% with tolerance', () => {
      const n = mockNode('n', 0, 0, 245, 100);
      expect(getWidthBucket(n, parent, 2)).toBe('25%');
    });

    it('buckets >100% as overflow:NN%', () => {
      const n = mockNode('n', 0, 0, 1200, 100);
      expect(getWidthBucket(n, parent)).toBe('overflow:120%');
    });

    it('buckets un-bucketed percentage as raw NN%', () => {
      const n = mockNode('n', 0, 0, 700, 100);
      expect(getWidthBucket(n, parent)).toBe('70%');
    });

    it('noise rule: omits width when all siblings share the exact same bucket', () => {
      const s1 = mockNode('s1', 10, 10, 300, 100); // 30%
      const s2 = mockNode('s2', 330, 10, 300, 100); // 30%
      const s3 = mockNode('s3', 650, 10, 300, 100); // 30%
      const siblings = [s1, s2, s3];

      const style = inferNodeStyle(s1, parent, siblings);
      expect(style.widthToken).toBeUndefined();
    });

    it('does not omit width when siblings have different buckets', () => {
      const s1 = mockNode('s1', 0, 0, 250, 100); // 25%
      const s2 = mockNode('s2', 260, 0, 740, 100); // 75%
      const siblings = [s1, s2];

      const style1 = inferNodeStyle(s1, parent, siblings);
      const style2 = inferNodeStyle(s2, parent, siblings);
      expect(style1.widthToken).toBe('width:25%');
      expect(style2.widthToken).toBe('width:75%');
    });

    it('identifies height bands: short (<10%) and compact (<35%)', () => {
      const shortNode = mockNode('short', 0, 0, 500, 60); // 6%
      const compactNode = mockNode('compact', 0, 0, 500, 250); // 25%
      const normalNode = mockNode('normal', 0, 0, 500, 500); // 50%

      expect(inferNodeStyle(shortNode, parent).heightToken).toBe('short');
      expect(inferNodeStyle(compactNode, parent).heightToken).toBe('compact');
      expect(inferNodeStyle(normalNode, parent).heightToken).toBeUndefined();
    });
  });

  describe('A2. Alignment (align & align-y)', () => {
    it('infers align:center when child center-x matches parent center-x within tolerance', () => {
      // Parent: x=0, w=1000 -> center=500
      // Child: x=250, w=500 -> center=500
      const centerNode = mockNode('center', 250, 200, 500, 200);
      const style = inferNodeStyle(centerNode, parent);
      expect(style.align).toBe('center');
    });

    it('infers align:right when child is in right third of parent', () => {
      // Child in right third: x=750, w=200
      const rightNode = mockNode('right', 750, 200, 200, 200);
      const style = inferNodeStyle(rightNode, parent);
      expect(style.align).toBe('right');
    });

    it('omits align when child spans full parent width (stretch default)', () => {
      const stretchNode = mockNode('stretch', 0, 100, 980, 200);
      const style = inferNodeStyle(stretchNode, parent);
      expect(style.align).toBeUndefined();
    });

    it('omits align when child is on the left (default)', () => {
      const leftNode = mockNode('left', 20, 100, 200, 200);
      const style = inferNodeStyle(leftNode, parent);
      expect(style.align).toBeUndefined();
    });

    it('infers align-y:top, align-y:middle, align-y:bottom when child is much shorter than parent', () => {
      const topNode = mockNode('top', 100, 40, 500, 60); // y=40 (top 4%)
      const midNode = mockNode('mid', 100, 470, 500, 60); // center=500 (middle)
      const botNode = mockNode('bot', 100, 900, 500, 60); // y=900 (bottom 10%)

      expect(inferNodeStyle(topNode, parent).alignY).toBe('top');
      expect(inferNodeStyle(midNode, parent).alignY).toBe('middle');
      expect(inferNodeStyle(botNode, parent).alignY).toBe('bottom');
    });
  });

  describe('A3. Distribution (dist)', () => {
    it('infers dist:grid cols:N rows:M for uniform 2D grid', () => {
      const c1 = mockNode('c1', 10, 10, 200, 100);
      const c2 = mockNode('c2', 230, 10, 200, 100);
      const c3 = mockNode('c3', 10, 130, 200, 100);
      const c4 = mockNode('c4', 230, 130, 200, 100);

      const dist = inferDistribution([c1, c2, c3, c4]);
      expect(dist).toBe('dist:grid cols:2 rows:2');
    });

    it('infers dist:wrap for irregular multi-row arrangements', () => {
      const c1 = mockNode('c1', 10, 10, 200, 100);
      const c2 = mockNode('c2', 230, 10, 200, 100);
      const c3 = mockNode('c3', 450, 10, 200, 100);
      const c4 = mockNode('c4', 10, 130, 200, 100); // 3 on top, 1 below

      const dist = inferDistribution([c1, c2, c3, c4]);
      expect(dist).toBe('dist:wrap');
    });

    it('infers dist:space-between for evenly spaced 1D items', () => {
      const c1 = mockNode('c1', 20, 50, 100, 40);
      const c2 = mockNode('c2', 200, 50, 100, 40);
      const c3 = mockNode('c3', 380, 50, 100, 40);

      const dist = inferDistribution([c1, c2, c3]);
      expect(dist).toBe('dist:space-between');
    });
  });

  describe('A4. Relationship (rel)', () => {
    it('infers rel:overflow when child extends beyond parent bounds by > 5%', () => {
      const overflowNode = mockNode('ov', 100, 100, 1100, 200); // extends 200px past parent w=1000 (20%)
      const style = inferNodeStyle(overflowNode, parent);
      expect(style.rel).toBe('overflow');
    });

    it('infers rel:overlap on the later sibling when overlapping 15-60%', () => {
      const s1 = mockNode('s1', 100, 100, 200, 200);
      const s2 = mockNode('s2', 200, 100, 200, 200); // 50% overlap horizontally
      const siblings = [s1, s2];

      const style1 = inferNodeStyle(s1, parent, siblings);
      const style2 = inferNodeStyle(s2, parent, siblings);
      expect(style1.rel).toBeUndefined();
      expect(style2.rel).toBe('overlap');
    });

    it('infers rel:inset when large equal inset > 15% each side', () => {
      // Parent: x=0, w=1000
      // Inset: 200px on left, 200px on right (w=600)
      const insetNode = mockNode('inset', 200, 200, 600, 200);
      const style = inferNodeStyle(insetNode, parent);
      expect(style.rel).toBe('inset');
    });
  });
});
