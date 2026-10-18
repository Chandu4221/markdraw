import { describe, it, expect } from 'vitest';
import { MarkDrawCompiler } from '../compiler';
import { TLShape } from '../types';

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

describe('Responsive Column Splitting & Mobile Stacking Engine', () => {
  describe('1. Container Column Splitting', () => {
    it('emits cols:2 when columns=2 with equal split', () => {
      const section = createShape('s1', 'section', 0, 0, 800, 300, {
        columns: 2,
        columnSplit: 'equal'
      });
      const result = MarkDrawCompiler.compile([section]);
      expect(result.markdownSpec).toContain('cols:2');
    });

    it('emits cols:2 (70/30) when asymmetric 70/30 ratio is selected', () => {
      const section = createShape('s1', 'section', 0, 0, 800, 300, {
        columns: 2,
        columnSplit: '70/30'
      });
      const result = MarkDrawCompiler.compile([section]);
      expect(result.markdownSpec).toContain('cols:2 (70/30)');
    });

    it('emits cols:3 (25/50/25) for three-column holy grail split', () => {
      const section = createShape('s1', 'section', 0, 0, 900, 300, {
        columns: 3,
        columnSplit: '25/50/25'
      });
      const result = MarkDrawCompiler.compile([section]);
      expect(result.markdownSpec).toContain('cols:3 (25/50/25)');
    });

    it('emits cols:4 for four-column card container', () => {
      const section = createShape('s1', 'section', 0, 0, 1000, 250, {
        columns: 4
      });
      const result = MarkDrawCompiler.compile([section]);
      expect(result.markdownSpec).toContain('cols:4');
    });
  });

  describe('2. Make it Responsive (Container Stacking & Breakpoints)', () => {
    it('emits responsive:stack when isResponsive=true with default stack', () => {
      const section = createShape('s1', 'section', 0, 0, 800, 300, {
        columns: 2,
        isResponsive: true
      });
      const result = MarkDrawCompiler.compile([section]);
      expect(result.markdownSpec).toContain('responsive:stack');
    });

    it('emits responsive:reverse when mobileStack is set to reverse', () => {
      const section = createShape('s1', 'section', 0, 0, 800, 300, {
        columns: 2,
        isResponsive: true,
        mobileStack: 'reverse'
      });
      const result = MarkDrawCompiler.compile([section]);
      expect(result.markdownSpec).toContain('responsive:reverse');
    });

    it('emits tablet:2-col when tabletLayout is configured', () => {
      const section = createShape('s1', 'section', 0, 0, 1000, 300, {
        columns: 4,
        isResponsive: true,
        tabletLayout: '2-col'
      });
      const result = MarkDrawCompiler.compile([section]);
      expect(result.markdownSpec).toContain('responsive:stack');
      expect(result.markdownSpec).toContain('tablet:2-col');
    });
  });

  describe('3. Child Responsive Tokens (sm:order and sm:hidden)', () => {
    it('emits sm:order-1 and sm:order-2 for children with explicit mobile ordering', () => {
      const section = createShape('s1', 'section', 0, 0, 800, 400, {
        columns: 2,
        isResponsive: true,
        mobileStack: 'reverse'
      });
      // Left form card (order 2)
      const formCard = createShape('c1', 'card', 20, 20, 520, 360, {
        parentId: 's1',
        label: 'Checkout Form',
        mobileOrder: 2
      });
      // Right summary card (order 1)
      const summaryCard = createShape('c2', 'card', 560, 20, 220, 360, {
        parentId: 's1',
        label: 'Order Summary',
        mobileOrder: 1
      });

      const result = MarkDrawCompiler.compile([section, formCard, summaryCard]);
      expect(result.markdownSpec).toContain('sm:order-2');
      expect(result.markdownSpec).toContain('sm:order-1');
    });

    it('emits sm:hidden when hideOnMobile is true', () => {
      const card = createShape('c1', 'card', 0, 0, 300, 200, {
        hideOnMobile: true
      });
      const result = MarkDrawCompiler.compile([card]);
      expect(result.markdownSpec).toContain('sm:hidden');
    });

    it('appends (sm:full) to child width token when inside a responsive container', () => {
      const section = createShape('s1', 'section', 0, 0, 900, 400, {
        columns: 2,
        columnSplit: '70/30',
        isResponsive: true
      });
      const mainCol = createShape('c1', 'card', 10, 10, 600, 380, {
        parentId: 's1'
      });
      const sideCol = createShape('c2', 'card', 620, 10, 270, 380, {
        parentId: 's1'
      });

      const result = MarkDrawCompiler.compile([section, mainCol, sideCol]);
      expect(result.markdownSpec).toContain('(sm:full)');
    });
  });
});
