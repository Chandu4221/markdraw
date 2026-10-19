// src/annotation/__tests__/v52_chip_geometry.test.ts
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { ChipsOverlay } from '../ChipsOverlay';
import { CanvasDriver } from '../../canvas/port/CanvasDriver';
import { CanvasShape } from '../../canvas/port/CanvasShape';

describe('v5.2 Chip Geometry & Positioning (§1.2, §1.3)', () => {
  it('computes exact screen transform (360, 146) for world (400, 300) with viewport {x: 120, y: -40, zoom: 0.6}', () => {
    const shape: CanvasShape = {
      id: 'shape_test_1',
      kind: 'rect',
      bounds: { x: 400, y: 300, w: 200, h: 100, rotation: 0 },
      parentId: null,
      name: 'FollowBtn',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'button',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { label: 'Follow' }
        }
      }
    };

    const mockDriver: CanvasDriver = {
      listShapes: vi.fn(async () => [shape]),
      getShape: vi.fn(async (id: string) => (id === shape.id ? shape : null)),
      getViewport: vi.fn(() => ({ x: 120, y: -40, zoom: 0.6 })),
      createShape: vi.fn(async () => 'new_id'),
      updateShape: vi.fn(async () => {}),
      deleteShape: vi.fn(async () => {}),
      groupShapes: vi.fn(async () => 'grp_id'),
      onShapesChanged: vi.fn(() => () => {}),
      onSelectionChanged: vi.fn(() => () => {}),
      setSelection: vi.fn(),
      panTo: vi.fn(),
      copyToClipboard: vi.fn(async () => {})
    };

    const html = renderToStaticMarkup(
      React.createElement(ChipsOverlay, {
        driver: mockDriver,
        showChips: true,
        showUntagged: false,
        initialShapes: [shape]
      })
    );

    const root = parse(html);
    const chipWrapper = root.querySelector('[data-shape-id="shape_test_1"]');
    expect(chipWrapper).not.toBeNull();

    const style = chipWrapper?.getAttribute('style') || '';
    // Expected transform: translate(360px, 146px) because:
    // screenX = 400 * 0.6 + 120 = 360
    // screenY = 300 * 0.6 - 40 + 6 = 146
    expect(style).toContain('translate(360px, 146px)');
  });

  it('keeps chip attached at zoom 0.5, 1.0, and 2.0 without detachment', () => {
    const shape: CanvasShape = {
      id: 'shape_test_zoom',
      kind: 'rect',
      bounds: { x: 400, y: 300, w: 200, h: 100, rotation: 0 },
      parentId: null,
      name: 'ZoomCard',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'card',
          unitId: null,
          parentId: null,
          responsive: null,
          props: { label: 'Card' }
        }
      }
    };

    const zoomLevels = [
      { zoom: 0.5, expectedX: 200, expectedY: 156 },
      { zoom: 1.0, expectedX: 400, expectedY: 306 },
      { zoom: 2.0, expectedX: 800, expectedY: 606 }
    ];

    for (const { zoom, expectedX, expectedY } of zoomLevels) {
      const mockDriver: CanvasDriver = {
        listShapes: vi.fn(async () => [shape]),
        getShape: vi.fn(async (id: string) => (id === shape.id ? shape : null)),
        getViewport: vi.fn(() => ({ x: 0, y: 0, zoom })),
        createShape: vi.fn(async () => 'new_id'),
        updateShape: vi.fn(async () => {}),
        deleteShape: vi.fn(async () => {}),
        groupShapes: vi.fn(async () => 'grp_id'),
        onShapesChanged: vi.fn(() => () => {}),
        onSelectionChanged: vi.fn(() => () => {}),
        setSelection: vi.fn(),
        panTo: vi.fn(),
        copyToClipboard: vi.fn(async () => {})
      };

      const html = renderToStaticMarkup(
        React.createElement(ChipsOverlay, {
          driver: mockDriver,
          showChips: true,
          showUntagged: false,
          initialShapes: [shape]
        })
      );

      const root = parse(html);
      const chipWrapper = root.querySelector('[data-shape-id="shape_test_zoom"]');
      const style = chipWrapper?.getAttribute('style') || '';
      expect(style).toContain(`translate(${expectedX}px, ${expectedY}px)`);
    }
  });
});
