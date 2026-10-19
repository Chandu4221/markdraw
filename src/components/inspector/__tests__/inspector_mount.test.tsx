import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InspectorShell } from '../InspectorShell';
import { CanvasOverviewSection } from '../CanvasOverviewSection';
import { RoleSection } from '../RoleSection';
import { CanvasDriver } from '../../../canvas/port/CanvasDriver';
import { CanvasShape } from '../../../canvas/port/CanvasShape';
import { updateDriverShapeMeta } from '../../../annotation/shapeMeta';

function createMockDriver(shapes: CanvasShape[]): {
  driver: CanvasDriver;
  updateShapeMock: ReturnType<typeof vi.fn>;
} {
  const store = new Map<string, CanvasShape>(shapes.map((s) => [s.id, { ...s }]));
  const updateShapeMock = vi.fn(async (id: string, patch: Partial<CanvasShape>) => {
    const existing = store.get(id);
    if (existing) {
      store.set(id, { ...existing, ...patch });
    }
  });

  const driver: CanvasDriver = {
    listShapes: vi.fn(async () => Array.from(store.values())),
    getShape: vi.fn(async (id: string) => store.get(id) || null),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    createShape: vi.fn(async () => 'new_id'),
    updateShape: updateShapeMock,
    deleteShape: vi.fn(async () => {}),
    groupShapes: vi.fn(async () => 'group_id'),
    onShapesChanged: vi.fn(() => () => {}),
    onSelectionChanged: vi.fn(() => () => {}),
    setSelection: vi.fn(),
    panTo: vi.fn(),
    copyToClipboard: vi.fn(async () => {})
  };

  return { driver, updateShapeMock };
}

describe('Inspector Mount & Wiring (§1.2)', () => {
  it('renders empty state when 0 shapes are selected', () => {
    const shapes: CanvasShape[] = [
      {
        id: 'frame-1',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 800, h: 600, rotation: 0 },
        parentId: null,
        name: 'Main Page',
        text: null,
        arrowEndpoints: null,
        meta: {}
      }
    ];
    const { driver } = createMockDriver(shapes);

    const html = renderToStaticMarkup(
      <InspectorShell selectedIds={[]} driver={driver} />
    );

    expect(html).toContain('Select a shape to tag it');
    expect(html).toContain('Tagged Coverage:');
    expect(html).toContain('Inspector &amp; Canvas');
  });

  it('CanvasOverviewSection displays tagged vs untagged counts and root frames', () => {
    const shapes: CanvasShape[] = [
      {
        id: 'f1',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 1000, h: 800, rotation: 0 },
        parentId: null,
        name: 'Dashboard',
        text: null,
        arrowEndpoints: null,
        meta: { markdraw: { schema: 1, role: 'page', unitId: null, parentId: null, responsive: null, props: {} } }
      },
      {
        id: 's1',
        kind: 'rect',
        bounds: { x: 10, y: 10, w: 100, h: 40, rotation: 0 },
        parentId: 'f1',
        name: null,
        text: 'Save',
        arrowEndpoints: null,
        meta: {}
      }
    ];
    const { driver } = createMockDriver(shapes);

    const html = renderToStaticMarkup(
      <CanvasOverviewSection
        shapes={shapes}
        driver={driver}
        onCopyFrameContract={vi.fn()}
        copiedFrameId={null}
      />
    );

    expect(html).toContain('Select a shape to tag it');
    expect(html).toContain('1 / 2');
    expect(html).toContain('(1 untagged)');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Root Frames (1)');
  });

  it('RoleSection renders semantic role picker, label, and parent container for selected shape', () => {
    const shape: CanvasShape = {
      id: 'btn-1',
      kind: 'rect',
      bounds: { x: 50, y: 50, w: 120, h: 40, rotation: 0 },
      parentId: null,
      name: null,
      text: 'Submit',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          role: 'button',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { label: 'Submit Form' }
        }
      }
    };
    const { driver } = createMockDriver([shape]);

    const html = renderToStaticMarkup(
      <RoleSection
        selectedShapes={[shape]}
        allShapes={[shape]}
        driver={driver}
        isOpen={true}
        onToggle={vi.fn()}
        onSaveUnitGesture={vi.fn()}
      />
    );

    expect(html).toContain('Semantic Role');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-label="Semantic role selection"');
    expect(html).toContain('button');
    expect(html).toContain('Submit Form');
    expect(html).toContain('Parent Container');
    expect(html).toContain('Enable Responsive on the root page first.');
  });

  it('updateDriverShapeMeta writes meta.markdraw via driver.updateShape', async () => {
    const shape: CanvasShape = {
      id: 'rect-1',
      kind: 'rect',
      bounds: { x: 100, y: 100, w: 200, h: 80, rotation: 0 },
      parentId: null,
      name: null,
      text: null,
      arrowEndpoints: null,
      meta: {}
    };
    const { driver, updateShapeMock } = createMockDriver([shape]);

    await updateDriverShapeMeta(driver, ['rect-1'], {
      role: 'card',
      props: { label: 'Featured Article' }
    });

    expect(updateShapeMock).toHaveBeenCalledTimes(1);
    expect(updateShapeMock).toHaveBeenCalledWith('rect-1', {
      meta: {
        markdraw: {
          schema: 1,
          type: 'card',
          role: 'card',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { label: 'Featured Article' }
        }
      }
    });
  });
});
