// src/annotation/__tests__/v6_reparent.test.ts
// V6-QUESTION: see docs/v6-questions.md regarding red repro commit strategy under §0.2.3 and §1.2
import { describe, it, expect } from 'vitest';
import { TLShape } from '../../core/types';
import { MarkDrawCompiler } from '../../core/compiler';
import { excalidrawElementToCanvasShape } from '../../canvas/excalidraw/shapeMapping';

describe('v6 Defect 2: Parent/reparent missing & override wins over geometry (§1.2.2)', () => {
  it.fails('driver parent resolution honors meta.markdraw.parentOverride (RED REPRO)', () => {
    const el: any = {
      id: 'btn_outside',
      type: 'rectangle',
      x: 1000,
      y: 1000,
      width: 100,
      height: 40,
      frameId: null,
      customData: {
        markdraw: {
          schema: 1,
          type: 'button',
          parentOverride: 'frame_hero'
        }
      }
    };

    const canvasShape = excalidrawElementToCanvasShape(el);
    // Should honor parentOverride even when frameId is null
    expect(canvasShape.parentId).toBe('frame_hero');
  });

  it.fails('compiler hierarchy honors parentOverride over geometry when shape is outside frame (RED REPRO)', () => {
    const frameId = 'frame_hero';
    const childBtnId = 'btn_remote';

    const shapes: TLShape[] = [
      {
        id: frameId,
        type: 'frame',
        x: 0,
        y: 0,
        props: { name: 'HeroSection', w: 500, h: 400 },
        meta: {
          markdraw: {
            schema: 1,
            type: 'section',
            name: 'HeroSection'
          }
        }
      } as any,
      {
        id: childBtnId,
        type: 'geo',
        // Geometrically WAY outside the frame (1200, 800) vs (0..500, 0..400)
        x: 1200,
        y: 800,
        props: { geo: 'rectangle', w: 120, h: 44, text: 'ActionBtn' },
        meta: {
          markdraw: {
            schema: 1,
            type: 'button',
            name: 'ActionBtn',
            parentOverride: frameId
          }
        }
      } as any
    ];

    const res = MarkDrawCompiler.compile(shapes);
    const ast = JSON.parse(res.jsonAst);

    // Frame node should contain childBtn as its child in the compiled AST
    const rootNode = ast[0];
    expect(rootNode).toBeDefined();
    expect(rootNode.id).toBe(frameId);

    const childInFrame = rootNode.children?.find((c: any) => c.id === childBtnId);
    expect(childInFrame).toBeDefined();
  });
});
