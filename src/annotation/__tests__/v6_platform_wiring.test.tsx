// src/annotation/__tests__/v6_platform_wiring.test.tsx
// V6-QUESTION: see docs/v6-questions.md regarding red repro commit strategy under §0.2.3 and §1.2
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { getProfile } from '../profileLoader';
import { searchTypes } from '../roles';
import { resolveRootPlatform } from '../shapeMeta';
import { TypePicker } from '../../components/inspector/TypePicker';
import { ModeTagged } from '../../components/inspector/ModeTagged';

describe('v6 Defect 3: Platform dead wiring & per-root platform resolution (§1.2.3)', () => {
  it('ModeTagged renders Platform segmented control in Advanced row with Web and Android', () => {
    const rootFrame: CanvasShape = {
      id: 'frame_android',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 400, h: 800, rotation: 0 },
      parentId: null,
      name: 'Android Screen',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'page',
          platform: 'android-material'
        }
      }
    };

    const html = renderToStaticMarkup(
      <ModeTagged
        shape={rootFrame}
        allShapes={[rootFrame]}
        onSelectType={() => {}}
        onUpdateName={() => {}}
        onUpdateMeta={() => {}}
        initialOpenRow="advanced"
      />
    );

    // Should render Platform segmented control in Advanced
    expect(html).toContain('aria-label="Platform Selection"');
    expect(html).toContain('Android');
    expect(html).toContain('Web');
  });

  it('reads root platform so android root resolves TopAppBar and shows fab tile, while web root does not', () => {

    const androidRoot: CanvasShape = {
      id: 'frame_android_root',
      kind: 'frame',
      bounds: { x: 0, y: 0, w: 400, h: 800, rotation: 0 },
      parentId: null,
      name: 'Android Root',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'page',
          platform: 'android-material'
        }
      }
    };

    const childButton: CanvasShape = {
      id: 'child_btn',
      kind: 'rect',
      bounds: { x: 20, y: 50, w: 100, h: 40, rotation: 0 },
      parentId: 'frame_android_root',
      name: 'Action',
      text: 'Click',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'button'
        }
      }
    };

    const webRoot: CanvasShape = {
      id: 'frame_web_root',
      kind: 'frame',
      bounds: { x: 500, y: 0, w: 800, h: 600, rotation: 0 },
      parentId: null,
      name: 'Web Root',
      text: null,
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'page',
          platform: 'web'
        }
      }
    };

    const webChild: CanvasShape = {
      id: 'web_btn',
      kind: 'rect',
      bounds: { x: 520, y: 50, w: 100, h: 40, rotation: 0 },
      parentId: 'frame_web_root',
      name: 'Web Button',
      text: 'Click',
      arrowEndpoints: null,
      meta: {
        markdraw: {
          schema: 1,
          type: 'button'
        }
      }
    };

    const allShapes = [androidRoot, childButton, webRoot, webChild];

    // 1. Android root platform resolution
    const androidPlatId = resolveRootPlatform(childButton, allShapes);
    expect(androidPlatId).toBe('android-material');
    const androidProfile = getProfile(androidPlatId);

    // Android: TopAppBar search resolves to navbar
    const androidMatches = searchTypes('TopAppBar', androidProfile);
    expect(androidMatches.some((m) => m.name === 'navbar')).toBe(true);

    // Android: TypePicker rendered with androidProfile has fab tile visible
    const androidPickerHtml = renderToStaticMarkup(
      <TypePicker
        currentType="button"
        onSelectType={() => {}}
        platformProfile={androidProfile}
        defaultOpen={true}
      />
    );
    expect(androidPickerHtml).toContain('fab');

    // 2. Web root platform resolution
    const webPlatId = resolveRootPlatform(webChild, allShapes);
    expect(webPlatId).toBe('web');
    const webProfile = getProfile(webPlatId);

    // Web: TopAppBar search does NOT resolve
    const webMatches = searchTypes('TopAppBar', webProfile);
    expect(webMatches.some((m) => m.name === 'navbar')).toBe(false);

    // Web: TypePicker rendered with webProfile has fab tile ABSENT
    const webPickerHtml = renderToStaticMarkup(
      <TypePicker
        currentType="button"
        onSelectType={() => {}}
        platformProfile={webProfile}
        defaultOpen={true}
      />
    );
    expect(webPickerHtml).not.toContain('fab');
  });
});
