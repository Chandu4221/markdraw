import { describe, it, expect } from 'vitest';
import { MarkDrawCompiler } from '../compiler';
import { ALL_BEHAVIOR_FLAGS, DYNAMIC_LEGEND_MARKDOWN } from '../notation';

describe('Part G — MarkDraw v2.8 Core & Fixture Regressions', () => {
  it('fixture regression: floating navbar (70% width, centered, top)', () => {
    // Page: (0, 0, 1000, 2000)
    // Navbar: 70% width (700px), centered (x=150), top band (y=50, h=60)
    const page = {
      id: 'p1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 1000, h: 2000, widgetType: 'page', label: 'Home' }
    } as any;

    const nav = {
      id: 'n1' as any,
      type: 'ui-widget',
      x: 150,
      y: 50,
      props: {
        w: 700,
        h: 60,
        widgetType: 'navbar',
        label: 'Home, About, Contact',
        behaviors: ['floating']
      }
    } as any;

    const res = MarkDrawCompiler.compile([page, nav]);
    const lines = res.markdownSpec.split('\n');
    const navLine = lines.find((l) => l.includes('**[navbar "Home, About, Contact" floating]**'));
    expect(navLine).toBeDefined();

    // Assert exact spec strings and semantics
    expect(navLine).toContain('**[navbar "Home, About, Contact" floating]**');
    expect(navLine).toContain('| <Navbar> |');
    expect(navLine).toContain('| header |');
    expect(navLine).toContain('width:70%');
    expect(navLine).toContain('align:center');
    expect(navLine).toContain('align-y:top');
    expect(navLine).toContain('floating');
  });

  it('fixture regression: 50% centered testimonials', () => {
    // Page: (0, 0, 1000, 2000)
    // Card: 50% width (500px), centered (x=250), mid body (y=800, h=400)
    const page = {
      id: 'p1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 1000, h: 2000, widgetType: 'page', label: 'Home' }
    } as any;

    const testimonial = {
      id: 't1' as any,
      type: 'ui-widget',
      x: 250,
      y: 800,
      props: {
        w: 500,
        h: 400,
        widgetType: 'card',
        label: 'Testimonials'
      }
    } as any;

    const res = MarkDrawCompiler.compile([page, testimonial]);
    const lines = res.markdownSpec.split('\n');
    const testLine = lines.find((l) => l.includes('**[card "Testimonials"]**'));
    expect(testLine).toBeDefined();

    expect(testLine).toContain('**[card "Testimonials"]**');
    expect(testLine).toContain('| <Card> |');
    expect(testLine).toContain('| body |');
    expect(testLine).toContain('width:50%');
    expect(testLine).toContain('align:center');
  });

  it('fixture regression: sticky footer', () => {
    // Page: (0, 0, 1000, 2000)
    // Footer widget at y=1900, w=1000, h=100 with sticky behavior
    const page = {
      id: 'p1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 1000, h: 2000, widgetType: 'page', label: 'Home' }
    } as any;

    const footer = {
      id: 'f1' as any,
      type: 'ui-widget',
      x: 0,
      y: 1900,
      props: {
        w: 1000,
        h: 100,
        widgetType: 'footer',
        label: 'Footer Content',
        behaviors: ['sticky']
      }
    } as any;

    const res = MarkDrawCompiler.compile([page, footer]);
    const lines = res.markdownSpec.split('\n');
    const footerLine = lines.find((l) => l.includes('**[footer "Footer Content" sticky]**'));
    expect(footerLine).toBeDefined();

    expect(footerLine).toContain('**[footer "Footer Content" sticky]**');
    expect(footerLine).toContain('| <Footer> |');
    expect(footerLine).toContain('| footer |');
    expect(footerLine).toContain('sticky');
  });

  it('placement override: widget TYPE wins regardless of arbitrary coordinate offsets', () => {
    const page = {
      id: 'p1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 1000, h: 2000, widgetType: 'page', label: 'Home' }
    } as any;

    // Navbar placed unusually low (e.g. y=800) still emits placement: header
    const nav = {
      id: 'n1' as any,
      type: 'ui-widget',
      x: 50,
      y: 800,
      props: { w: 900, h: 80, widgetType: 'navbar', label: 'Nav' }
    } as any;

    // Footer placed unusually high (e.g. y=300) still emits placement: footer
    const footer = {
      id: 'f1' as any,
      type: 'ui-widget',
      x: 50,
      y: 300,
      props: { w: 900, h: 100, widgetType: 'footer', label: 'Foot' }
    } as any;

    const res = MarkDrawCompiler.compile([page, nav, footer]);
    const lines = res.markdownSpec.split('\n');

    const navLine = lines.find((l) => l.includes('**[navbar "Nav"]**'));
    expect(navLine).toBeDefined();
    expect(navLine).toContain('| header |');

    const footLine = lines.find((l) => l.includes('**[footer "Foot"]**'));
    expect(footLine).toBeDefined();
    expect(footLine).toContain('| footer |');
  });

  it('supports carousel widget with autoplay and scroll-snap behaviors', () => {
    const page = {
      id: 'p1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 1000, h: 1000, widgetType: 'page', label: 'Home' }
    } as any;

    const carousel = {
      id: 'c1' as any,
      type: 'ui-widget',
      x: 0,
      y: 200,
      props: {
        w: 1000,
        h: 400,
        widgetType: 'carousel',
        label: 'Hero Slides',
        behaviors: ['autoplay', 'scroll-snap']
      }
    } as any;

    const res = MarkDrawCompiler.compile([page, carousel]);
    expect(res.markdownSpec).toContain('**[carousel "Hero Slides" autoplay scroll-snap]**');
    expect(res.markdownSpec).toContain('| <Carousel> |');
    expect(res.markdownSpec).toContain('full-width');
    expect(res.markdownSpec).toContain('autoplay scroll-snap');
  });

  it('emits non-binding style note and page-level note in header', () => {
    const page = {
      id: 'p1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: {
        w: 1000,
        h: 1000,
        widgetType: 'page',
        label: 'Home',
        note: 'E-commerce landing flow'
      }
    } as any;

    const btn = {
      id: 'b1' as any,
      type: 'ui-widget',
      x: 100,
      y: 200,
      props: {
        w: 200,
        h: 50,
        widgetType: 'button',
        label: 'CTA',
        note: 'Pill shape with micro-glow'
      }
    } as any;

    const res = MarkDrawCompiler.compile([page, btn]);
    expect(res.markdownSpec).toContain('**Page note:** E-commerce landing flow');
    expect(res.markdownSpec).toContain('note:"Pill shape with micro-glow"');
  });

  it('legend completeness: every behavior flag is documented in the style semantics section', () => {
    for (const flag of ALL_BEHAVIOR_FLAGS) {
      expect(DYNAMIC_LEGEND_MARKDOWN).toContain(flag);
    }
    expect(DYNAMIC_LEGEND_MARKDOWN).toContain('Style semantics');
    expect(DYNAMIC_LEGEND_MARKDOWN).toContain('width:50%');
    expect(DYNAMIC_LEGEND_MARKDOWN).toContain('dist:space-between');
    expect(DYNAMIC_LEGEND_MARKDOWN).toContain('rel:overflow');
    expect(DYNAMIC_LEGEND_MARKDOWN).toContain('note:"..."');
  });
});
