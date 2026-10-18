import { describe, it, expect } from 'vitest';
import { MarkDrawCompiler } from '../../../core/compiler';
import { tldrawSceneToStoredDocument } from '../../tldraw/v5-export.tldraw';
import {
  excalidrawSceneToStoredDocument,
  storedDocumentToExcalidrawElements
} from '../../excalidraw/v5-export.excalidraw';
import { UnitDefinition } from '../../../annotation/units';

describe('v5.0 Editor Invariance (§9.6, §15)', () => {
  it('produces byte-identical contracts from scenes roundtripped through Excalidraw and tldraw', () => {
    const followCardUnit: UnitDefinition = {
      id: 'u_fc1',
      name: 'Follow Card',
      tag: 'Follow Card',
      baseRole: 'card',
      memberRoles: ['avatar', 'heading', 'button'],
      createdAt: 1729000000000,
      updatedAt: 1729000000000
    };

    const goldenTldrawShapes: any[] = [
      {
        id: 'shape:shape_268221',
        type: 'frame',
        x: 0,
        y: 0,
        parentId: 'page:canvas',
        props: { name: 'Feed Page', w: 800, h: 600 },
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
        type: 'group',
        parentId: 'shape:shape_268221',
        x: 50,
        y: 50,
        props: { name: 'Follow Card', w: 200, h: 74 },
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
        type: 'geo',
        parentId: 'shape:shape_227597',
        x: 60,
        y: 60,
        props: { geo: 'ellipse', w: 40, h: 40 },
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
        type: 'geo',
        parentId: 'shape:shape_227597',
        x: 110,
        y: 65,
        props: { geo: 'rectangle', w: 90, h: 20, text: 'Jane Doe' },
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
        type: 'geo',
        parentId: 'shape:shape_227597',
        x: 110,
        y: 90,
        props: { geo: 'rectangle', w: 80, h: 24, text: 'Follow' },
        meta: {
          markdraw: {
            schema: 1,
            role: 'button',
            props: { label: 'Follow Button' }
          }
        }
      }
    ];

    // 1. Direct compilation from original tldraw scene
    const directResult = MarkDrawCompiler.compile(goldenTldrawShapes, null, {
      units: [followCardUnit]
    });

    // 2. Export to neutral document
    const neutralDoc = tldrawSceneToStoredDocument(goldenTldrawShapes, [followCardUnit]);

    // 3. Roundtrip through Excalidraw element representation
    const excalElements = storedDocumentToExcalidrawElements(neutralDoc);
    const restoredNeutralDoc = excalidrawSceneToStoredDocument(excalElements as any, [followCardUnit]);

    // 4. Convert neutral document shapes into compiler-compatible shapes
    const compiledFromExcalidrawShapes: any[] = restoredNeutralDoc.shapes.map((s) => ({
      id: s.id,
      type: s.kind === 'frame' ? 'frame' : s.kind === 'group' ? 'group' : 'geo',
      x: s.bounds.x,
      y: s.bounds.y,
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

    const excalidrawCompiledResult = MarkDrawCompiler.compile(
      compiledFromExcalidrawShapes,
      null,
      { units: [followCardUnit] }
    );

    // 5. Assert byte-identical spec output (§9.6)
    expect(excalidrawCompiledResult.markdownSpec).toBe(directResult.markdownSpec);
    expect(excalidrawCompiledResult.elementCount).toBe(directResult.elementCount);
  });
});
