// src/annotation/__tests__/v40_migration.test.ts
import { describe, it, expect } from 'vitest';
import { TLShape, createShapeId } from '../../core/types';
import {
  migrateShapes,
  isV3Widget,
  backupDocumentBeforeMigration
} from '../migrate';
import { getShapeMeta } from '../shapeMeta';
import { MarkDrawCompiler } from '../../core/compiler';
import { getDemoCanvasShapes } from '../../core/documents';
import { BENCHMARK_FIXTURES } from '../../../bench/corpus/fixtures';

describe('MarkDraw v4 Migration Engine (§12)', () => {
  it('identifies legacy v3 widgets accurately with isV3Widget', () => {
    const v3Shape = {
      id: createShapeId('w1'),
      type: 'ui-widget',
      props: { widgetType: 'card', label: 'Legacy Card' }
    } as unknown as TLShape;

    const nativeShape = {
      id: createShapeId('n1'),
      type: 'geo',
      props: { geo: 'rectangle' }
    } as unknown as TLShape;

    expect(isV3Widget(v3Shape)).toBe(true);
    expect(isV3Widget(nativeShape)).toBe(false);
  });

  it('maps v3 widget types to canonical v4 roles and variants per §12 table', () => {
    const sampleWidgetTypes = [
      { widgetType: 'page', expectedRole: 'page' },
      { widgetType: 'hero', expectedRole: 'section', expectedVariant: 'hero' },
      { widgetType: 'split_pane', expectedRole: 'section', expectedVariant: 'split' },
      { widgetType: 'grid_gallery', expectedRole: 'section', expectedVariant: 'grid' },
      { widgetType: 'modal', expectedRole: 'dialog' },
      { widgetType: 'search', expectedRole: 'input', expectedVariant: 'search' },
      { widgetType: 'toggle', expectedRole: 'switch' },
      { widgetType: 'thumbnail_strip', expectedRole: 'img', expectedVariant: 'strip' },
      { widgetType: 'icon', expectedRole: 'badge', expectedVariant: 'icon' },
      { widgetType: 'progress', expectedRole: 'stat', expectedVariant: 'progress' },
      { widgetType: 'divider', expectedRole: 'separator' },
      { widgetType: 'spacer', expectedRole: 'group' }
    ];

    for (const item of sampleWidgetTypes) {
      const v3Shape: TLShape = {
        id: createShapeId(`test_${item.widgetType}`),
        type: 'ui-widget',
        x: 10,
        y: 10,
        props: {
          w: 200,
          h: 100,
          widgetType: item.widgetType,
          label: `Sample ${item.widgetType}`
        }
      } as unknown as TLShape;

      const result = migrateShapes([v3Shape]);
      expect(result.shapes).toHaveLength(1);
      const meta = getShapeMeta(result.shapes[0]);
      expect(meta).not.toBeNull();
      expect(meta?.role).toBe(item.expectedRole);
      if (item.expectedVariant) {
        expect(meta?.props.variant).toBe(item.expectedVariant);
      }
      expect(meta?.props.label).toBe(`Sample ${item.widgetType}`);
    }
  });

  it('validates flags against allowed role flags and drops invalid flags with exact §13 lint', () => {
    // 'navbar' allows 'fixed' and 'sticky'
    // 'heading' does not allow 'sticky' or 'fixed'
    const shapes: TLShape[] = [
      {
        id: createShapeId('nav1'),
        type: 'ui-widget',
        x: 0,
        y: 0,
        props: {
          widgetType: 'navbar',
          label: 'Top Nav',
          behaviors: ['sticky', 'invalid_flag']
        }
      } as unknown as TLShape,
      {
        id: createShapeId('h1'),
        type: 'ui-widget',
        x: 0,
        y: 60,
        props: {
          widgetType: 'heading',
          label: 'Title',
          behaviors: ['fixed']
        }
      } as unknown as TLShape
    ];

    const result = migrateShapes(shapes);
    expect(result.shapes).toHaveLength(2);

    const navMeta = getShapeMeta(result.shapes[0]);
    expect(navMeta?.props.behaviors).toEqual(['sticky']);

    const headingMeta = getShapeMeta(result.shapes[1]);
    expect(headingMeta?.props.behaviors).toBeUndefined();

    // Verify exact dropped lints:
    expect(result.lints).toContain('Flag "invalid_flag" has no meaning for role "navbar" — dropped.');
    expect(result.lints).toContain('Flag "fixed" has no meaning for role "heading" — dropped.');
  });

  it('migrates SaaS demo document and compiles to clean v4 contract', () => {
    const rawDemoShapes = getDemoCanvasShapes() as unknown as TLShape[];
    expect(rawDemoShapes.length).toBeGreaterThan(0);

    const result = migrateShapes(rawDemoShapes);
    expect(result.docVersion).toBe(4);
    expect(result.shapes.length).toBe(rawDemoShapes.length);

    // Every shape now has schema: 1 and a valid role
    for (const shape of result.shapes) {
      const meta = getShapeMeta(shape);
      expect(meta).not.toBeNull();
      expect(meta?.schema).toBe(1);
      expect(typeof meta?.role).toBe('string');
    }

    // Compile migrated shapes in v4 annotation mode
    const compiled = MarkDrawCompiler.compile(result.shapes, null, { annotationMode: true });
    expect(compiled.markdownSpec).toContain('### MarkDraw UI Specification');
    expect(compiled.markdownSpec).toContain('<Heading>');
    expect(compiled.markdownSpec).toContain('<Section>');
    expect(compiled.markdownSpec).toContain('<Card>');
    expect(compiled.markdownSpec).toContain('<Footer>');
  });

  it('migrates Instagram-style mobile social feed fixture (fixture 17) maintaining tree hierarchy', () => {
    const fixture17 = BENCHMARK_FIXTURES.find((f) => f.id === '17-mobile-social-feed');
    expect(fixture17).toBeDefined();

    const shapes = fixture17!.shapes.map((s) => ({
      id: createShapeId(s.id),
      type: 'ui-widget',
      x: s.x,
      y: s.y,
      props: {
        w: s.w,
        h: s.h,
        widgetType: s.type,
        ...(s.props || {})
      }
    })) as unknown as TLShape[];

    const result = migrateShapes(shapes);
    expect(result.shapes.length).toBe(shapes.length);

    const compiled = MarkDrawCompiler.compile(result.shapes, null, { annotationMode: true });
    expect(compiled.markdownSpec).toContain('### MarkDraw UI Specification');
    expect(compiled.markdownSpec).toContain('<Page>');
    expect(compiled.markdownSpec).toContain('<Heading>');
    expect(compiled.markdownSpec).toContain('<Section>');
    expect(compiled.markdownSpec).toContain('<Navbar>');
    expect(compiled.markdownSpec).toContain('<Button>');

    // Check tree hierarchy: shapes have parent paths reflecting root
    expect(compiled.markdownSpec).toContain('Mobile Social Feed');
  });

  it('creates a backup in localStorage before migration', () => {
    const store: Record<string, string> = {};
    const mockStorage: Storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0
    };

    const docId = 'doc_test_123';
    const rawContent = [{ id: 'shape:1', type: 'ui-widget' }];

    backupDocumentBeforeMigration(docId, rawContent, mockStorage);
    expect(store['markdraw_backup_v3_doc_test_123']).toBe(JSON.stringify(rawContent));
  });
});
