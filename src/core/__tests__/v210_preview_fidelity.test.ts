import { describe, it, expect, beforeEach } from 'vitest';
import { MarkDrawCompiler } from '../compiler';
import { getRenderMode, setRenderMode, initRenderMode } from '../renderMode';
import { getLoremSlice, getLoremLines, getGhostPreview, LOREM_PARAGRAPH } from '../lorem';
import { fnv1a32 } from '../ids';
import { isUntouchedLabel } from '../widgets/widgetCatalog';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe('v2.10 Preview Fidelity & Lean Contract Invariance', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MockStorage();
    setRenderMode('annotated');
  });

  describe('1. Strict Compile Mode Invariance', () => {
    it('produces 100% byte-for-byte identical compiler output regardless of active render mode', () => {
      const shapes: any[] = [
        {
          id: 'shape:page-1',
          type: 'ui-widget',
          x: 0,
          y: 0,
          props: {
            w: 1280,
            h: 800,
            widgetType: 'page',
            label: 'Home Page',
            variant: 'hd'
          }
        },
        {
          id: 'shape:card-1',
          type: 'ui-widget',
          x: 40,
          y: 100,
          props: {
            w: 320,
            h: 220,
            widgetType: 'card',
            label: 'Feature Card',
            variant: 'outline'
          }
        },
        {
          id: 'shape:para-1',
          type: 'ui-widget',
          x: 60,
          y: 160,
          props: {
            w: 280,
            h: 80,
            widgetType: 'paragraph',
            label: 'Paragraph text...',
            variant: 'default'
          }
        },
        {
          id: 'shape:img-1',
          type: 'ui-widget',
          x: 400,
          y: 100,
          props: {
            w: 300,
            h: 200,
            widgetType: 'image_frame',
            label: 'Image Frame',
            variant: 'default'
          }
        },
        {
          id: 'shape:search-1',
          type: 'ui-widget',
          x: 40,
          y: 360,
          props: {
            w: 240,
            h: 40,
            widgetType: 'search',
            label: '',
            placeholder: '',
            variant: 'default'
          }
        },
        {
          id: 'shape:kpi-1',
          type: 'ui-widget',
          x: 320,
          y: 360,
          props: {
            w: 200,
            h: 90,
            widgetType: 'stat_kpi',
            label: 'KPI',
            variant: 'default'
          }
        }
      ];

      // Compile under Skeleton mode
      setRenderMode('skeleton');
      const skeletonResult = MarkDrawCompiler.compile(shapes);

      // Compile under Annotated mode
      setRenderMode('annotated');
      const annotatedResult = MarkDrawCompiler.compile(shapes);

      // Compile under Realistic mode
      setRenderMode('realistic');
      const realisticResult = MarkDrawCompiler.compile(shapes);

      // Byte-for-byte exact matches
      expect(annotatedResult.markdownSpec).toBe(skeletonResult.markdownSpec);
      expect(realisticResult.markdownSpec).toBe(skeletonResult.markdownSpec);
      expect(annotatedResult.markdownGrid).toBe(skeletonResult.markdownGrid);
      expect(realisticResult.markdownGrid).toBe(skeletonResult.markdownGrid);
      expect(annotatedResult.jsonAst).toBe(skeletonResult.jsonAst);
      expect(realisticResult.jsonAst).toBe(skeletonResult.jsonAst);

      // Assert that ghost previews never leak into compiled output
      expect(skeletonResult.markdownSpec).not.toContain('Lorem ipsum');
      expect(skeletonResult.markdownSpec).not.toContain('Jane Doe');
      expect(skeletonResult.markdownSpec).not.toContain('$24.8k');
      expect(skeletonResult.markdownSpec).toContain('[Text Placeholder]');
    });
  });

  describe('2. Deterministic Lorem & Slicing', () => {
    it('generates consistent, deterministic slices from the same seed', () => {
      const seed = 'shape:widget-test-123';
      const slice1 = getLoremSlice(seed, 30, 80);
      const slice2 = getLoremSlice(seed, 30, 80);
      expect(slice1).toBe(slice2);
      expect(slice1.length).toBeGreaterThanOrEqual(20);
      expect(LOREM_PARAGRAPH).toContain(slice1.slice(5, 20));
    });

    it('generates different slices for different seeds', () => {
      const sliceA = getLoremSlice('seed-alpha-1', 30, 70);
      const sliceB = getLoremSlice('seed-beta-2', 30, 70);
      expect(sliceA).not.toBe(sliceB);
    });

    it('generates reproducible multi-line lorem lines', () => {
      const lines1 = getLoremLines('card-seed-xyz', 3);
      const lines2 = getLoremLines('card-seed-xyz', 3);
      expect(lines1).toEqual(lines2);
      expect(lines1.length).toBe(3);
      expect(lines1[0]).not.toBe(lines1[1]);
    });
  });

  describe('3. Ghost Preview Pure Function & Zero Props Mutation', () => {
    it('does not mutate shape props when deriving ghost preview (immutability check)', () => {
      const frozenProps = Object.freeze({
        w: 320,
        h: 220,
        widgetType: 'card' as const,
        label: 'Feature Card',
        variant: 'outline',
        placeholder: '',
        checked: false,
        options: '',
        iconName: '',
        subtext: '',
        value: 0
      });

      // Should not throw frozen object error
      expect(() => {
        getGhostPreview('card', 'shape:test-frozen', frozenProps);
      }).not.toThrow();

      const ghost = getGhostPreview('card', 'shape:test-frozen', frozenProps);
      expect(ghost.isGhost).toBe(true);
      expect(ghost.primary.length).toBeGreaterThan(0);
      expect(ghost.lines?.length).toBe(2);
    });

    it('respects user customizations and marks isGhost: false when touched', () => {
      const touchedProps = {
        label: 'Custom User Card Title',
        placeholder: 'Custom input placeholder'
      };

      const ghostCard = getGhostPreview('card', 'shape:custom-card', touchedProps);
      expect(ghostCard.isGhost).toBe(false);
      expect(ghostCard.primary).toBe('Custom User Card Title');

      const ghostInput = getGhostPreview('input', 'shape:custom-input', touchedProps);
      expect(ghostInput.isGhost).toBe(false);
      expect(ghostInput.placeholder).toBe('Custom input placeholder');
    });

    it('correctly detects untouched vs touched catalog labels', () => {
      expect(isUntouchedLabel('button', 'Button')).toBe(true);
      expect(isUntouchedLabel('card', 'Feature Card')).toBe(true);
      expect(isUntouchedLabel('card', 'card')).toBe(true);
      expect(isUntouchedLabel('card', '')).toBe(true);
      expect(isUntouchedLabel('paragraph', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.')).toBe(true);

      expect(isUntouchedLabel('button', 'Submit Order')).toBe(false);
      expect(isUntouchedLabel('card', 'My Custom Pricing Card')).toBe(false);
      expect(isUntouchedLabel('paragraph', 'Custom description text')).toBe(false);
    });
  });

  describe('4. Render Mode Reactive Store', () => {
    it('defaults to annotated mode and persists to localStorage', () => {
      expect(getRenderMode()).toBe('annotated');

      setRenderMode('skeleton');
      expect(getRenderMode()).toBe('skeleton');
      expect(localStorage.getItem('markdraw_render_mode')).toBe('skeleton');

      setRenderMode('realistic');
      expect(getRenderMode()).toBe('realistic');
      expect(localStorage.getItem('markdraw_render_mode')).toBe('realistic');
    });

    it('initializes and restores from storage', () => {
      setRenderMode('skeleton');
      localStorage.setItem('markdraw_render_mode', 'realistic');
      const mode = initRenderMode();
      expect(mode).toBe('realistic');
    });
  });

  describe('5. SVG Pattern Determinism', () => {
    it('computes deterministic pattern types via fnv1a32', () => {
      const id1 = 'shape:media-photo-1';
      const id2 = 'shape:media-video-2';
      const type1 = fnv1a32(id1) % 4;
      const type2 = fnv1a32(id2) % 4;

      expect(typeof type1).toBe('number');
      expect(type1).toBeGreaterThanOrEqual(0);
      expect(type1).toBeLessThanOrEqual(3);

      expect(fnv1a32(id1) % 4).toBe(type1);
      expect(fnv1a32(id2) % 4).toBe(type2);
    });
  });
});
