// src/cli/__tests__/v51_cli.test.ts
// CLI parity test for v5.1 (§15, Phase 5.1)
import { describe, it, expect } from 'vitest';
import { compileStoredDocument, canvasShapesToCompilerShapes } from '../compile';
import { StoredDocument } from '../../canvas/port/PersistencePort';
import { MarkDrawCompiler } from '../../core/compiler';

describe('Phase 5.1: CLI Parity (§15, Phase 5)', () => {
  const v51FixtureDoc: StoredDocument = {
    schema: 1,
    docVersion: 1,
    units: [],
    shapes: [
      {
        id: 'frame_1',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
        parentId: null,
        name: 'Mobile App',
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'page',
            props: { label: 'Mobile App', behaviors: ['responsive'] }
          }
        }
      },
      {
        id: 'nav_1',
        kind: 'rect',
        bounds: { x: 0, y: 0, w: 360, h: 56, rotation: 0 },
        parentId: 'frame_1',
        name: null,
        text: 'Top Bar',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'navbar',
            props: { label: 'Top Bar' },
            responsive: {
              order: 1,
              primary: true,
              smVisible: 'visible',
              smFullWidth: true,
              tablet: 'maintain'
            }
          }
        }
      },
      {
        id: 'content_1',
        kind: 'rect',
        bounds: { x: 10, y: 70, w: 340, h: 200, rotation: 0 },
        parentId: 'frame_1',
        name: null,
        text: 'Main Card',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'card',
            props: { label: 'Main Card' },
            responsive: {
              order: 2,
              primary: false,
              smVisible: 'visible',
              smFullWidth: true,
              tablet: 'stack'
            }
          }
        }
      }
    ]
  };

  it('compiles StoredDocument byte-identically via CLI entry and in-app compiler', () => {
    // 1. Run via CLI callable
    const cliOutput = compileStoredDocument(v51FixtureDoc, {
      platform: 'web'
    });

    // 2. Run via in-app compile
    const compilerShapes = canvasShapesToCompilerShapes(v51FixtureDoc.shapes);
    const inAppResult = MarkDrawCompiler.compile(compilerShapes, null, {
      platform: 'web',
      platformId: 'web',
      units: []
    });

    expect(cliOutput).toBe(inAppResult.markdownSpec);
  });

  it('compiles with android-material platform byte-identically to in-app compiler', () => {
    // 1. Run via CLI callable with android platform
    const cliOutput = compileStoredDocument(v51FixtureDoc, {
      platform: 'android-material'
    });

    // 2. Run via in-app compile
    const compilerShapes = canvasShapesToCompilerShapes(v51FixtureDoc.shapes);
    const inAppResult = MarkDrawCompiler.compile(compilerShapes, null, {
      platform: 'android-material',
      platformId: 'android-material',
      units: []
    });

    expect(cliOutput).toBe(inAppResult.markdownSpec);
    expect(cliOutput).toContain('Target platform: Android (Material 3)');
  });

  it('supports JSON AST export parity with in-app compile', () => {
    const cliJson = compileStoredDocument(v51FixtureDoc, {
      json: true
    });

    const compilerShapes = canvasShapesToCompilerShapes(v51FixtureDoc.shapes);
    const inAppResult = MarkDrawCompiler.compile(compilerShapes, null, {
      platform: 'web',
      platformId: 'web'
    });

    expect(cliJson).toBe(inAppResult.jsonAst);
    const parsed = JSON.parse(cliJson);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].role).toBe('page');
  });
});
