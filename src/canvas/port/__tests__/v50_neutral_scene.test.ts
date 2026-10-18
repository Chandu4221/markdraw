import { describe, it, expect } from 'vitest';
import { tldrawSceneToStoredDocument } from '../../tldraw/v5-export.tldraw';
import {
  excalidrawSceneToStoredDocument,
  storedDocumentToExcalidrawElements
} from '../../excalidraw/v5-export.excalidraw';

describe('v5.0 Neutral Scene Roundtrip (§15)', () => {
  it('preserves shapes, meta, and units across tldraw -> neutral -> excalidraw -> neutral pipeline', () => {
    // 1. Initial tldraw scene
    const initialTldrawShapes: any[] = [
      {
        id: 'shape:page_root',
        type: 'frame',
        x: 0,
        y: 0,
        parentId: 'page:canvas',
        props: { name: 'Dashboard Page', w: 1200, h: 900 },
        meta: {
          markdraw: {
            schema: 1,
            role: 'page',
            props: { title: 'User Dashboard' }
          }
        }
      },
      {
        id: 'shape:card1',
        type: 'geo',
        x: 100,
        y: 120,
        parentId: 'shape:page_root',
        props: {
          geo: 'rectangle',
          w: 360,
          h: 240,
          text: 'Stats Card'
        },
        meta: {
          markdraw: {
            schema: 1,
            role: 'card',
            props: { elevation: 2 }
          }
        }
      },
      {
        id: 'shape:btn_submit',
        type: 'geo',
        x: 140,
        y: 280,
        parentId: 'shape:card1',
        props: {
          geo: 'rectangle',
          w: 120,
          h: 40,
          text: 'Confirm'
        },
        meta: {
          markdraw: {
            schema: 1,
            role: 'button',
            props: { variant: 'primary' }
          }
        }
      }
    ];

    const initialUnits = [
      {
        id: 'unit_summary',
        name: 'Summary Card Unit',
        tag: 'Summary Card Unit',
        baseRole: 'card',
        memberRoles: ['button', 'text'],
        createdAt: 1000,
        updatedAt: 2000
      }
    ];

    // 2. Export tldraw to vendor-neutral StoredDocument
    const neutralDoc1 = tldrawSceneToStoredDocument(initialTldrawShapes, initialUnits);
    expect(neutralDoc1.schema).toBe(1);
    expect(neutralDoc1.shapes.length).toBe(3);
    expect(neutralDoc1.units.length).toBe(1);

    // 3. Restore into Excalidraw native elements
    const excalidrawElements = storedDocumentToExcalidrawElements(neutralDoc1);
    expect(excalidrawElements.length).toBe(3);

    const rootEl = excalidrawElements.find((e) => e.id === 'shape:page_root');
    expect(rootEl).toBeDefined();
    expect(rootEl!.type).toBe('frame');
    expect(rootEl!.customData.markdraw.role).toBe('page');

    const cardEl = excalidrawElements.find((e) => e.id === 'shape:card1');
    expect(cardEl).toBeDefined();
    expect(cardEl!.type).toBe('rectangle');
    expect(cardEl!.frameId).toBe('shape:page_root');
    expect(cardEl!.customData.markdraw.role).toBe('card');

    // 4. Re-export Excalidraw scene to vendor-neutral StoredDocument
    const neutralDoc2 = excalidrawSceneToStoredDocument(excalidrawElements as any, initialUnits);
    expect(neutralDoc2.shapes.length).toBe(3);
    expect(neutralDoc2.units.length).toBe(1);

    // 5. Invariance verification: shapes match across formats
    const originalCard = neutralDoc1.shapes.find((s) => s.id === 'shape:card1');
    const roundtrippedCard = neutralDoc2.shapes.find((s) => s.id === 'shape:card1');

    expect(roundtrippedCard?.kind).toBe(originalCard?.kind);
    expect(roundtrippedCard?.bounds).toEqual(originalCard?.bounds);
    expect(roundtrippedCard?.parentId).toBe(originalCard?.parentId);
    expect(roundtrippedCard?.meta).toEqual(originalCard?.meta);
    expect(neutralDoc2.units).toEqual(neutralDoc1.units);
  });
});
