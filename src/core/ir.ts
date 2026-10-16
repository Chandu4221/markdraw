import { TLShape, Editor } from '@tldraw/tldraw';
import { computeAABB, isEnclosed, sanitizeMarkdown } from './geometry';
import { AABB, CompilationOptions } from './types';
import { getCatalogDefaultProps, isUntouchedLabel } from './widgets/widgetCatalog';
import { InferredStyle, inferNodeStyle } from './style';
import { AI_DIRECTIVE_HEADER } from './directive';

export interface IRBounds {
  h: number;
  w: number;
  x: number;
  y: number;
}

export interface IRTextProps {
  altText?: string;
  behaviors?: string[];
  checked?: boolean;
  iconName?: string;
  label?: string;
  note?: string;
  options?: string;
  placeholder?: string;
  showText?: boolean;
  subtext?: string;
  value?: number;
  variant?: string;
}

export interface IRNode {
  aiDirective?: string;
  bounds: IRBounds;
  children: IRNode[];
  direction: 'Column' | 'Leaf' | 'Row';
  id: string;
  label: string;
  parent: string | null;
  path: string;
  role: string;
  style?: InferredStyle;
  textProps: IRTextProps;
  widgetType: string;
}

export interface IRTree {
  elementCount: number;
  roots: IRNode[];
  skippedShapes?: number;
}

export function resolveWidgetRole(widgetType: string): string {
  switch (widgetType) {
    // Containers
    case 'page':
    case 'section':
    case 'card':
    case 'hero':
    case 'header':
    case 'footer':
    case 'grid_gallery':
    case 'split_pane':
    case 'modal':
    case 'data_table':
    case 'table':
    case 'tabs':
    case 'footer_nav':
    case 'steps':
    case 'menubar':
    case 'sidebar':
      return 'container';

    // Buttons
    case 'button':
      return 'button';

    // Inputs
    case 'input':
    case 'search':
    case 'password':
    case 'textarea':
    case 'checkbox':
    case 'radio':
    case 'toggle':
    case 'select':
    case 'slider':
    case 'file_upload':
    case 'date_picker':
    case 'stepper':
    case 'color_swatch':
      return 'input';

    // Media & Icons
    case 'avatar':
    case 'avatar_group':
    case 'thumbnail_strip':
    case 'badge':
    case 'icon':
    case 'stat_kpi':
    case 'image_frame':
    case 'video_frame':
      return 'icon_avatar';

    // Dividers
    case 'divider':
    case 'spacer':
      return 'divider';

    // Content / Text
    case 'heading':
    case 'paragraph':
    case 'list':
    case 'blockquote':
    case 'code_block':
    case 'link':
    case 'chip':
    case 'breadcrumbs':
    case 'pagination':
    case 'tooltip':
    case 'toast':
    case 'empty_state':
    case 'banner':
    case 'progress_bar':
    case 'skeleton':
      return 'text';

    default:
      return 'unknown';
  }
}

function inferDirection(children: { bounds: IRBounds }[]): 'Column' | 'Row' {
  if (children.length <= 1) return 'Row';

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const child of children) {
    const cx = child.bounds.x + child.bounds.w / 2;
    const cy = child.bounds.y + child.bounds.h / 2;
    if (cx < minX) minX = cx;
    if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy;
    if (cy > maxY) maxY = cy;
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;

  return spanY > spanX ? 'Column' : 'Row';
}

function sortChildren(children: IRNode[], direction: 'Column' | 'Row'): void {
  if (direction === 'Row') {
    children.sort((a, b) => a.bounds.x - b.bounds.x);
  } else {
    children.sort((a, b) => a.bounds.y - b.bounds.y);
  }
}

interface IntermediateItem {
  aabb: AABB;
  area: number;
  node: IRNode;
}

export function buildIRTree(
  shapes: TLShape[],
  editor?: Editor | null,
  containmentThreshold: number = 0.85,
  options?: CompilationOptions
): IRTree {
  // Only process ui-widget shapes; ignore everything else
  const widgetShapes = shapes.filter((s) => s.type === 'ui-widget');
  if (widgetShapes.length === 0) {
    return { elementCount: 0, roots: [] };
  }

  const items: IntermediateItem[] = [];
  let skippedShapes = 0;

  for (const s of widgetShapes) {
    try {
      const props = (s.props || {}) as Record<string, any>;
      const widgetType = (props.widgetType as string) || 'unknown';

      let x = s.x;
      let y = s.y;
      let w = typeof props.w === 'number' ? props.w : 100;
      let h = typeof props.h === 'number' ? props.h : 100;

      if (editor && typeof (editor as any).getShapePageBounds === 'function') {
        const pageBounds = (editor as any).getShapePageBounds(s);
        if (pageBounds) {
          x = pageBounds.x;
          y = pageBounds.y;
          w = pageBounds.w;
          h = pageBounds.h;
        }
      }

      // Filter micro-dots / ghost elements (< 4px)
      if (w < 4 || h < 4) continue;

      const bounds: IRBounds = { x, y, w, h };
      const aabb = computeAABB(bounds);
      const rawLabel = (props.label || props.placeholder || widgetType || '') as string;
      const label = sanitizeMarkdown(rawLabel);

      const textProps: IRTextProps = {};
      if (props.label !== undefined && props.label !== '') textProps.label = props.label;
      if (props.placeholder !== undefined && props.placeholder !== '') textProps.placeholder = props.placeholder;
      if (props.subtext !== undefined && props.subtext !== '') textProps.subtext = props.subtext;
      if (props.altText !== undefined && props.altText !== '') textProps.altText = props.altText;
      if (props.options !== undefined && props.options !== '') textProps.options = props.options;
      if (typeof props.value === 'number') textProps.value = props.value;
      if (typeof props.checked === 'boolean') textProps.checked = props.checked;
      if (props.variant !== undefined && props.variant !== '') textProps.variant = props.variant;
      if (typeof props.showText === 'boolean') textProps.showText = props.showText;
      if (props.iconName !== undefined && props.iconName !== '') textProps.iconName = props.iconName;
      if (Array.isArray(props.behaviors) && props.behaviors.length > 0) {
        textProps.behaviors = [...props.behaviors];
      }
      if (typeof props.note === 'string' && props.note.trim() !== '') {
        textProps.note = props.note.trim();
      }

      const role = resolveWidgetRole(widgetType);

      const node: IRNode = {
        bounds,
        children: [],
        direction: 'Leaf',
        id: s.id,
        label: label || `${widgetType}_${s.id.slice(-4)}`,
        parent: null,
        path: 'Root',
        role,
        textProps,
        widgetType
      };

      items.push({
        aabb,
        area: w * h,
        node
      });
    } catch (err) {
      console.warn(`[MarkDraw] Skipped corrupt shape ${s?.id}:`, err);
      skippedShapes++;
    }
  }

  // Sort descending by area to establish containment hierarchy
  items.sort((a, b) => b.area - a.area);

  const roots: IRNode[] = [];

  for (const item of items) {
    let immediateParent: IRNode | null = null;
    let minParentArea = Infinity;

    for (const candidate of items) {
      if (candidate.node.id === item.node.id) continue;

      if (
        candidate.area > item.area &&
        isEnclosed(item.aabb, candidate.aabb, containmentThreshold)
      ) {
        if (candidate.area < minParentArea) {
          minParentArea = candidate.area;
          immediateParent = candidate.node;
        }
      }
    }

    if (immediateParent) {
      immediateParent.children.push(item.node);
      item.node.parent = immediateParent.id;
    } else {
      roots.push(item.node);
    }
  }

  // Container promotion rule: any node with >= 2 children becomes container
  for (const item of items) {
    if (item.node.children.length >= 2 && item.node.role !== 'container') {
      item.node.role = 'container';
    }
  }

  // Process layout flow direction and paths top-down
  const processSubtree = (node: IRNode, currentPath: string) => {
    node.path = currentPath;
    if (node.children.length > 0) {
      node.direction = inferDirection(node.children);
      sortChildren(node.children, node.direction);
      const nextPath = `${currentPath} > ${node.label}`;
      for (const child of node.children) {
        processSubtree(child, nextPath);
      }
    } else {
      node.direction = 'Leaf';
    }
  };

  for (const root of roots) {
    processSubtree(root, 'Root');
  }

  // Attach computed styles (Part A) to every node
  const attachStyles = (curr: IRNode, parent: IRNode | null, siblings: IRNode[]) => {
    curr.style = inferNodeStyle(curr, parent, siblings, options);
    for (const child of curr.children) {
      attachStyles(child, curr, curr.children);
    }
  };

  for (const root of roots) {
    attachStyles(root, null, roots);
  }

  return {
    elementCount: items.length,
    roots,
    skippedShapes
  };
}

/**
 * Deterministically sorts object keys alphabetically (recursively)
 */
export function sortKeysAlphabetically<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map(sortKeysAlphabetically) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const sortedObj: Record<string, any> = {};
    const keys = Object.keys(val).sort();
    for (const k of keys) {
      sortedObj[k] = sortKeysAlphabetically((val as any)[k]);
    }
    return sortedObj as T;
  }
  return val;
}

export function pruneDefaultProps(node: IRNode): IRNode {
  const defaults = getCatalogDefaultProps(node.widgetType);
  const cleanProps: Record<string, any> = {};

  if (node.textProps) {
    for (const [k, v] of Object.entries(node.textProps)) {
      if (v === undefined || v === null || v === '') continue;
      if (k === 'checked' && (v === false || v === defaults.checked)) continue;
      if (k === 'showText' && (v === false || v === defaults.showText)) continue;
      if (k === 'value' && (v === 0 || v === defaults.value)) continue;
      if (k === 'label' && isUntouchedLabel(node.widgetType, v as string)) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (defaults[k] !== undefined && defaults[k] === v) continue;
      cleanProps[k] = v;
    }
  }

  const result: any = {
    ...node,
    textProps: cleanProps as any,
    children: node.children.map(pruneDefaultProps)
  };

  if (node.style) {
    const cleanStyle: Record<string, any> = {};
    if (typeof node.style.widthPct === 'number') cleanStyle.widthPct = node.style.widthPct;
    if (node.style.align) cleanStyle.align = node.style.align;
    if (node.style.alignY) cleanStyle.alignY = node.style.alignY;
    if (node.style.dist) {
      cleanStyle.dist = node.style.dist.replace(/^dist:/, '');
    }
    if (node.style.rel) cleanStyle.rel = node.style.rel;
    if (Array.isArray(node.style.behaviors) && node.style.behaviors.length > 0) {
      cleanStyle.behaviors = node.style.behaviors;
    }
    if (node.style.note) cleanStyle.note = node.style.note;

    if (Object.keys(cleanStyle).length > 0) {
      result.style = cleanStyle;
    } else {
      delete result.style;
    }
  }

  return result as IRNode;
}

export function serializeIRToJsonAst(ir: IRTree | IRNode[]): string {
  const data = Array.isArray(ir) ? ir : ir.roots;
  const pruned = data.map((rootNode) => {
    const p = pruneDefaultProps(rootNode);
    return {
      aiDirective: AI_DIRECTIVE_HEADER,
      ...p
    };
  });
  const sorted = sortKeysAlphabetically(pruned);
  return JSON.stringify(sorted, null, 2);
}
