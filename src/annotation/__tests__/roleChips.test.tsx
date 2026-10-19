import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChipsOverlay } from '../ChipsOverlay';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { CanvasShape } from '../../canvas/port/CanvasShape';

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
    setSelection: vi.fn(),
    panTo: vi.fn(),
    copyToClipboard: vi.fn(async () => {})
  };
}

describe('Role Chips Verification & Toggle (§1.3)', () => {
  const shapes: CanvasShape[] = [
    {
      id: 'shape-btn',
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
          props: { label: 'Submit' }
        }
      }
    },
    {
      id: 'shape-untagged',
      kind: 'rect',
      bounds: { x: 200, y: 50, w: 100, h: 100, rotation: 0 },
      parentId: null,
      name: null,
      text: null,
      arrowEndpoints: null,
      meta: {}
    }
  ];

  it('renders 1 chip with text "button" when showChips is true', () => {
    const driver = createMockDriver(shapes);
    const html = renderToStaticMarkup(
      <ChipsOverlay driver={driver} showChips={true} showUntagged={false} initialShapes={shapes} />
    );

    expect(html).toContain('button');
    expect(html).not.toContain('shape-untagged');
  });

  it('renders 0 chips when showChips is false', () => {
    const driver = createMockDriver(shapes);
    const html = renderToStaticMarkup(
      <ChipsOverlay driver={driver} showChips={false} showUntagged={false} initialShapes={shapes} />
    );

    expect(html).toBe('');
  });
});
