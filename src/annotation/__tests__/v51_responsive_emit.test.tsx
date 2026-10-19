import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResponsiveSection } from '../../components/inspector/ResponsiveSection';
import { RoleSection } from '../../components/inspector/RoleSection';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { MarkDrawCompiler } from '../../core/compiler';
import { canvasShapesToCompilerShapes } from '../../hooks/useCompilation';

function createMockDriver(shapes: CanvasShape[]): CanvasDriver {
  return {
    listShapes: vi.fn(async () => shapes),
    getShape: vi.fn(async (id: string) => shapes.find((s) => s.id === id) || null),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    createShape: vi.fn(async () => 'new_id'),
    updateShape: vi.fn(async () => {}),
    deleteShape: vi.fn(async () => {}),
    groupShapes: vi.fn(async () => 'group_id'),
    onShapesChanged: vi.fn(() => () => {}),
    onSelectionChanged: vi.fn(() => () => {}),
    onViewportChanged: vi.fn(() => () => {}),
    setSelection: vi.fn(),
    panTo: vi.fn(),
    copyToClipboard: vi.fn(async () => {})
  };
}

describe('Responsive Props Verification & Emission (§1.6)', () => {
  it('renders disabled helper text when hasResponsiveRoot is false', () => {
    const html = renderToStaticMarkup(
      <ResponsiveSection
        firstMeta={null}
        hasResponsiveRoot={false}
        onUpdateResponsive={vi.fn()}
      />
    );

    expect(html).toContain('Enable Responsive on the root page first.');
    expect(html).not.toContain('<select');
  });

  it('renders interactive responsive controls when hasResponsiveRoot is true', () => {
    const html = renderToStaticMarkup(
      <ResponsiveSection
        firstMeta={{
          schema: 1,
          role: 'button',
          unitId: null,
          parentId: null,
          responsive: {
            order: 1,
            primary: true,
            smVisible: 'collapse:hamburger',
            smFullWidth: true,
            tablet: 'stack'
          },
          props: {}
        }}
        hasResponsiveRoot={true}
        onUpdateResponsive={vi.fn()}
      />
    );

    expect(html).not.toContain('Enable Responsive on the root page first.');
    expect(html).toContain('Collapse to Hamburger');
    expect(html).toContain('Stack Vertically');
    expect(html).toContain('Primary');
    expect(html).toContain('Full Width (Mobile)');
  });

  it('RoleSection detects ancestor responsive page and enables responsive section', () => {
    const responsiveFrame: CanvasShape = {
      id: 'frame_resp',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 1000, h: 800, rotation: 0 },
      parentId: null,
      name: 'Main Page',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'page',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { behaviors: ['responsive'] }
        }
      }
    };

    const childButton: CanvasShape = {
      id: 'btn_child',
      kind: 'rect',
      bounds: { x: 50, y: 50, w: 120, h: 40, rotation: 0 },
      parentId: 'frame_resp',
      name: null,
      text: 'Search',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'button',
          unitId: null,
          parentId: 'frame_resp',
          responsive: {
            order: 'auto',
            primary: false,
            smVisible: 'visible',
            smFullWidth: false,
            tablet: 'maintain'
          },
          props: { label: 'Search' }
        }
      }
    };

    const driver = createMockDriver([responsiveFrame, childButton]);
    const html = renderToStaticMarkup(
      <RoleSection
        selectedShapes={[childButton]}
        allShapes={[responsiveFrame, childButton]}
        driver={driver}
        isOpen={true}
        onToggle={vi.fn()}
        onSaveUnitGesture={vi.fn()}
      />
    );

    // Responsive controls must be active, not showing the disabled message
    expect(html).not.toContain('Enable Responsive on the root page first.');
    expect(html).toContain('Visible on Mobile');
  });

  it('compiler emits responsive tokens when root page has responsive behavior', () => {
    const responsivePage: CanvasShape = {
      id: 'f_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 800, h: 600, rotation: 0 },
      parentId: null,
      name: 'Root Page',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'page',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { label: 'Root Page', behaviors: ['responsive'] }
        }
      }
    };

    const navShape: CanvasShape = {
      id: 'nav_item',
      kind: 'rect',
      bounds: { x: 10, y: 10, w: 780, h: 60, rotation: 0 },
      parentId: 'f_root',
      name: null,
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'navbar',
          unitId: null,
          parentId: 'f_root',
          responsive: {
            order: 1,
            primary: true,
            smVisible: 'hidden',
            smFullWidth: true,
            tablet: 'stack'
          },
          props: { label: 'Navigation' }
        }
      }
    };

    const compilerShapes = canvasShapesToCompilerShapes([responsivePage, navShape]);
    const res = MarkDrawCompiler.compile(compilerShapes);

    expect(res.lints?.some((l) => l.includes('but no responsive root page — tokens not emitted.'))).toBeFalsy();
    expect(res.markdownSpec).toContain('sm:hidden');
    expect(res.markdownSpec).toContain('sm:order-1');
  });

  it('compiler suppresses responsive tokens and emits lint when root page is not responsive', () => {
    const nonResponsivePage: CanvasShape = {
      id: 'f_static',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 800, h: 600, rotation: 0 },
      parentId: null,
      name: 'Static Page',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'page',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { label: 'Static Page' } // no responsive behavior!
        }
      }
    };

    const navShape: CanvasShape = {
      id: 'nav_static',
      kind: 'rect',
      bounds: { x: 10, y: 10, w: 780, h: 60, rotation: 0 },
      parentId: 'f_static',
      name: null,
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'navbar',
          unitId: null,
          parentId: 'f_static',
          responsive: {
            order: 1,
            primary: true,
            smVisible: 'hidden',
            smFullWidth: true,
            tablet: 'stack'
          },
          props: { label: 'Navigation' }
        }
      }
    };

    const compilerShapes = canvasShapesToCompilerShapes([nonResponsivePage, navShape]);
    const res = MarkDrawCompiler.compile(compilerShapes);

    const lint = (res.lints ?? []).find((l) => l.includes('but no responsive root page — tokens not emitted.'));
    expect(lint).toBeDefined();
    expect(lint).toMatch(/^Responsive props on #[a-z0-9_]+ but no responsive root page — tokens not emitted\.$/);
    expect(res.markdownSpec).not.toContain('sm:hidden');
  });
});
