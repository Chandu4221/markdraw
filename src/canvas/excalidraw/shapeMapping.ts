import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { CanvasShape, ShapeKind } from '../port/CanvasShape';

export function excalidrawTypeToShapeKind(type: string): ShapeKind {
  switch (type) {
    case 'frame':
    case 'magicframe':
      return 'frame';
    case 'ellipse':
      return 'ellipse';
    case 'diamond':
      return 'diamond';
    case 'arrow':
      return 'arrow';
    case 'line':
      return 'line';
    case 'text':
      return 'text';
    case 'image':
      return 'image';
    case 'rectangle':
    default:
      return 'rect';
  }
}

export function shapeKindToExcalidrawType(kind: ShapeKind): string {
  switch (kind) {
    case 'frame':
      return 'frame';
    case 'ellipse':
      return 'ellipse';
    case 'diamond':
      return 'diamond';
    case 'arrow':
      return 'arrow';
    case 'line':
      return 'line';
    case 'text':
      return 'text';
    case 'image':
      return 'image';
    case 'rect':
    case 'group':
    default:
      return 'rectangle';
  }
}

export function excalidrawElementToCanvasShape(
  el: ExcalidrawElement,
  allElements?: readonly ExcalidrawElement[]
): CanvasShape {
  const anyEl = el as any;

  // Resolve parentId (§6: frameId or virtual:<groupId>, with meta.markdraw.parentOverride winning)
  let parentId: string | null = null;
  const markdrawMeta = anyEl.customData?.markdraw;
  if (markdrawMeta?.parentOverride !== undefined) {
    parentId = markdrawMeta.parentOverride;
  } else if (el.frameId) {
    parentId = el.frameId;
  } else if (el.groupIds && el.groupIds.length > 0) {
    parentId = `virtual:${el.groupIds[0]}`;
  }

  // Resolve text / label
  let text: string | null = null;
  if (el.type === 'text') {
    text = anyEl.text || null;
  } else if (allElements && anyEl.boundElements) {
    const textBinding = anyEl.boundElements.find((b: any) => b.type === 'text');
    if (textBinding) {
      const boundTextEl = allElements.find((e) => e.id === textBinding.id) as any;
      if (boundTextEl?.text) {
        text = boundTextEl.text;
      }
    }
  }

  // Resolve arrow endpoints
  let arrowEndpoints: { start: string | null; end: string | null } | null = null;
  if (el.type === 'arrow') {
    arrowEndpoints = {
      start: anyEl.startBinding?.elementId || null,
      end: anyEl.endBinding?.elementId || null
    };
  }

  // Extract meta (symmetrical with CanvasShape.meta)
  let meta: Record<string, unknown> = {};
  if (el.customData) {
    meta = { ...el.customData };
  }

  // Extract name (frames often have a name)
  const name: string | null = anyEl.name || (el.type === 'frame' ? anyEl.label || null : null);

  return {
    id: el.id,
    kind: excalidrawTypeToShapeKind(el.type),
    bounds: {
      x: el.x,
      y: el.y,
      w: el.width,
      h: el.height,
      rotation: el.angle || 0
    },
    parentId,
    name,
    text,
    arrowEndpoints,
    meta
  };
}

export function canvasShapeToPartialExcalidrawElement(
  s: CanvasShape
): Partial<ExcalidrawElement> & Record<string, any> {
  const type = shapeKindToExcalidrawType(s.kind);

  let frameId: string | null = null;
  const groupIds: string[] = [];

  if (s.parentId) {
    if (s.parentId.startsWith('virtual:')) {
      groupIds.push(s.parentId.replace('virtual:', ''));
    } else {
      frameId = s.parentId;
    }
  }

  // Ensure customData preserves markdraw cleanly
  const customData: Record<string, any> = {
    ...s.meta
  };
  if (!customData.markdraw && Object.keys(s.meta).length > 0) {
    customData.markdraw = { ...s.meta };
  }

  const partial: Record<string, any> = {
    id: s.id,
    type,
    x: s.bounds.x,
    y: s.bounds.y,
    width: s.bounds.w,
    height: s.bounds.h,
    angle: s.bounds.rotation || 0,
    frameId,
    groupIds,
    customData
  };

  if (s.kind === 'text') {
    partial.text = s.text || s.name || '';
  }

  if (s.name && s.kind === 'frame') {
    partial.name = s.name;
  }

  return partial;
}
