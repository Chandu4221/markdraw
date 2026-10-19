import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CanvasShape } from '../../../canvas/port/CanvasShape';
import { CanvasDriver } from '../../../canvas/port/CanvasDriver';
import { ModeCanvas } from '../ModeCanvas';
import { ModeUntagged } from '../ModeUntagged';
import { ModeTagged } from '../ModeTagged';
import { ModeTaggedMulti } from '../ModeTaggedMulti';
import { TYPE_DEFINITIONS, isAllowedTypeFlag } from '../../../annotation/roles';

function createMockDriver(shapes: CanvasShape[]): CanvasDriver {
  const store = new Map<string, CanvasShape>(shapes.map((s) => [s.id, { ...s }]));
  return {
    listShapes: vi.fn(async () => Array.from(store.values())),
    getShape: vi.fn(async (id: string) => store.get(id) || null),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    createShape: vi.fn(async () => 'new_id'),
    updateShape: vi.fn(async (id, patch) => {
      const existing = store.get(id);
      if (existing) store.set(id, { ...existing, ...patch });
    }),
    deleteShape: vi.fn(async () => {}),
    groupShapes: vi.fn(async () => 'group_id'),
    onShapesChanged: vi.fn(() => () => {}),
    onSelectionChanged: vi.fn(() => () => {}),
    setSelection: vi.fn(),
    panTo: vi.fn(),
    copyToClipboard: vi.fn(async () => {})
  };
}

describe('v5.2 Inspector Rebuild — Four Progressive Modes (§3.1 - §3.7)', () => {
  const untaggedShape: CanvasShape = {
    id: 'shape-untagged',
    kind: 'rect',
    bounds: { x: 100, y: 100, w: 200, h: 100, rotation: 0 },
    parentId: null,
    name: 'My Card',
    text: null,
    arrowEndpoints: null,
    meta: {}
  };

  const taggedShape: CanvasShape = {
    id: 'shape-tagged',
    kind: 'rect',
    bounds: { x: 100, y: 100, w: 200, h: 100, rotation: 0 },
    parentId: null,
    name: 'Card Container',
    text: null,
    arrowEndpoints: null,
    meta: {
      markdraw: {
        schema: 1,
        type: 'card',
        role: 'card',
        unitId: null,
        parentId: null,
        responsive: null,
        flags: ['floating'],
        props: { label: 'Card Container' }
      }
    }
  };

  it('(a) untagged selection renders Type picker and NOT the three rows', () => {
    const html = renderToStaticMarkup(
      <ModeUntagged
        shape={untaggedShape}
        onSelectType={vi.fn()}
        onUpdateName={vi.fn()}
      />
    );

    // Has Type picker and Name input
    expect(html).toContain('Type');
    expect(html).toContain('Select Type...');
    expect(html).toContain('Name');
    expect(html).toContain('My Card');

    // Does NOT render the three rows (Responsive, Behavior, Advanced)
    expect(html).not.toContain('Responsive');
    expect(html).not.toContain('Behavior');
    expect(html).not.toContain('Advanced');
  });

  it('(b) tagged selection renders 3 rows all closed by default', () => {
    const html = renderToStaticMarkup(
      <ModeTagged
        shape={taggedShape}
        allShapes={[taggedShape]}
        onSelectType={vi.fn()}
        onUpdateName={vi.fn()}
        onUpdateMeta={vi.fn()}
      />
    );

    // Has Type row and Name row
    expect(html).toContain('Type');
    expect(html).toContain('card');
    expect(html).toContain('Name');

    // Renders the 3 rows
    expect(html).toContain('Responsive');
    expect(html).toContain('Behavior');
    expect(html).toContain('Advanced');

    // All rows are closed by default (accordions closed: no open body)
    expect(html).not.toContain('Turn on Responsive on the page first.');
    expect(html).not.toContain('Automatic — from your frames &amp; groups');
    expect(html).not.toContain('Breakpoint Viewport:');
  });

  it('(c) multi-select renders bulk picker + Save as unit only', () => {
    const shape2: CanvasShape = {
      id: 'shape-2',
      kind: 'rect',
      bounds: { x: 300, y: 100, w: 100, h: 40, rotation: 0 },
      parentId: null,
      name: 'Button',
      text: null,
      arrowEndpoints: null,
      meta: {}
    };

    const html = renderToStaticMarkup(
      <ModeTaggedMulti
        shapes={[untaggedShape, shape2]}
        onBulkSelectType={vi.fn()}
        onSaveUnitGesture={vi.fn()}
      />
    );

    // Bulk type picker + Save as unit button
    expect(html).toContain('Type');
    expect(html).toContain('Save as unit');

    // NOTHING else (no Name row, no Responsive, no Behavior, no Advanced)
    expect(html).not.toContain('Responsive');
    expect(html).not.toContain('Behavior');
    expect(html).not.toContain('Advanced');
  });

  it('(d) nothing selected renders coverage + roots list + storyboard', () => {
    const driver = createMockDriver([taggedShape]);
    const html = renderToStaticMarkup(
      <ModeCanvas
        shapes={[taggedShape]}
        driver={driver}
      />
    );

    // Coverage gauge
    expect(html).toContain('1/1 tagged');

    // Storyboard with exact 2-word captions
    expect(html).toContain('Draw');
    expect(html).toContain('Tag it');
    expect(html).toContain('Copy');
  });

  it('(e) changing Type removes disallowed flags using real allow-list', () => {
    // Dialog has flags ['fullscreen', 'draggable'] in TYPE_DEFINITIONS
    expect(TYPE_DEFINITIONS.dialog.flags).toContain('draggable');
    expect(TYPE_DEFINITIONS.dialog.flags).toContain('fullscreen');

    // Button does NOT have 'draggable' or 'fullscreen'
    expect(TYPE_DEFINITIONS.button.flags).not.toContain('draggable');
    expect(TYPE_DEFINITIONS.button.flags).not.toContain('fullscreen');

    const dialogFlags = ['fullscreen', 'draggable'];
    const newType = 'button';

    // Changing Type clears every flag not on the new Type's allow-list
    const filteredFlags = dialogFlags.filter((f) => isAllowedTypeFlag(newType, f));

    expect(filteredFlags).toEqual([]);
    expect(filteredFlags).not.toContain('draggable');
    expect(filteredFlags).not.toContain('fullscreen');
  });

  it('(f) ban-list words are absent from rendered inspector DOM', () => {
    const driver = createMockDriver([taggedShape]);

    const canvasHtml = renderToStaticMarkup(
      <ModeCanvas shapes={[taggedShape]} driver={driver} />
    );
    const untaggedHtml = renderToStaticMarkup(
      <ModeUntagged shape={untaggedShape} onSelectType={vi.fn()} onUpdateName={vi.fn()} />
    );
    const taggedHtml = renderToStaticMarkup(
      <ModeTagged
        shape={taggedShape}
        allShapes={[taggedShape]}
        onSelectType={vi.fn()}
        onUpdateName={vi.fn()}
        onUpdateMeta={vi.fn()}
      />
    );
    const multiHtml = renderToStaticMarkup(
      <ModeTaggedMulti shapes={[taggedShape, untaggedShape]} onBulkSelectType={vi.fn()} onSaveUnitGesture={vi.fn()} />
    );

    const allInspectorHtml = `${canvasHtml} ${untaggedHtml} ${taggedHtml} ${multiHtml}`;

    const bannedWords = [
      'AABB',
      'infer',
      'semantic',
      'IR',
      'AST',
      'widget',
      'compiler',
      'threshold'
    ];

    for (const word of bannedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      expect(allInspectorHtml).not.toMatch(regex);
    }
  });
});
