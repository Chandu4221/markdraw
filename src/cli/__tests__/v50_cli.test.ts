import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { compileStoredDocument } from '../compile';
import { StoredDocument } from '../../canvas/port/PersistencePort';
import { UnitDefinition } from '../../annotation/units';
import { MarkDrawCompiler } from '../../core/compiler';

describe('v5.0 Headless CLI (§8, §15)', () => {
  const followCardUnit: UnitDefinition = {
    id: 'u_fc1',
    name: 'Follow Card',
    tag: 'Follow Card',
    baseRole: 'card',
    memberRoles: ['avatar', 'heading', 'button'],
    createdAt: 1729000000000,
    updatedAt: 1729000000000
  };

  const goldenDoc: StoredDocument = {
    schema: 1,
    docVersion: 1,
    units: [followCardUnit],
    shapes: [
      {
        id: 'shape:shape_268221',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 800, h: 600, rotation: 0 },
        parentId: null,
        name: 'Feed Page',
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'page',
            props: { label: 'Feed Page' }
          }
        }
      },
      {
        id: 'shape:shape_227597',
        kind: 'group',
        bounds: { x: 50, y: 50, w: 200, h: 74, rotation: 0 },
        parentId: 'shape:shape_268221',
        name: 'Follow Card',
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'card',
            props: { label: 'Follow Card' }
          }
        }
      },
      {
        id: 'shape:shape_852441',
        kind: 'ellipse',
        bounds: { x: 60, y: 60, w: 40, h: 40, rotation: 0 },
        parentId: 'shape:shape_227597',
        name: null,
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'avatar',
            props: { label: 'User Avatar' }
          }
        }
      },
      {
        id: 'shape:shape_836750',
        kind: 'rect',
        bounds: { x: 110, y: 65, w: 90, h: 20, rotation: 0 },
        parentId: 'shape:shape_227597',
        name: null,
        text: 'Jane Doe',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'heading',
            props: { label: 'User Name' }
          }
        }
      },
      {
        id: 'shape:shape_651230',
        kind: 'rect',
        bounds: { x: 110, y: 90, w: 80, h: 24, rotation: 0 },
        parentId: 'shape:shape_227597',
        name: null,
        text: 'Follow',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'button',
            props: { label: 'Follow Button' }
          }
        }
      }
    ]
  };

  const tempFilePath = path.resolve(process.cwd(), 'scratch_test_doc.md.json');
  const binPath = path.resolve(process.cwd(), 'bin/markdraw');

  beforeAll(() => {
    fs.writeFileSync(tempFilePath, JSON.stringify(goldenDoc, null, 2), 'utf-8');
  });

  afterAll(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it('compiles stored document programmatically with full determinism', () => {
    const cliOutput = compileStoredDocument(goldenDoc);

    const compilerShapes = goldenDoc.shapes.map((s) => ({
      id: s.id,
      type: s.kind === 'frame' ? 'frame' : s.kind === 'group' ? 'group' : 'geo',
      x: s.bounds.x,
      y: s.bounds.y,
      rotation: s.bounds.rotation,
      parentId: s.parentId,
      props: {
        geo: s.kind === 'ellipse' ? 'ellipse' : 'rectangle',
        w: s.bounds.w,
        h: s.bounds.h,
        text: s.text,
        name: s.name
      },
      meta: s.meta
    }));

    const directResult = MarkDrawCompiler.compile(compilerShapes, null, {
      units: [followCardUnit]
    });

    expect(cliOutput).toBe(directResult.markdownSpec);
  });

  it('compiles via CLI process execution byte-identically to in-app compiler', () => {
    const stdout = execFileSync(binPath, ['compile', tempFilePath], {
      encoding: 'utf-8'
    });

    const expected = compileStoredDocument(goldenDoc);
    expect(stdout.trim()).toBe(expected.trim());
  });

  it('supports --root scoping via CLI process', () => {
    const stdout = execFileSync(binPath, ['compile', tempFilePath, '--root', 'Feed Page'], {
      encoding: 'utf-8'
    });

    expect(stdout).toContain('Scoped compile: "Feed Page"');
    expect(stdout).toContain('[Follow Card]');
  });

  it('supports --platform android-material', () => {
    const stdout = execFileSync(
      binPath,
      ['compile', tempFilePath, '--platform', 'android-material'],
      { encoding: 'utf-8' }
    );

    expect(stdout).toContain('Material 3');
  });

  it('handles errors gracefully when file or root is missing', () => {
    expect(() => {
      execFileSync(binPath, ['compile', 'non_existent_file.json'], {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    }).toThrow();

    expect(() => {
      execFileSync(binPath, ['compile', tempFilePath, '--root', 'InvalidRoot'], {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    }).toThrow();
  });
});
