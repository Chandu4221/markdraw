import { TLShape, Editor } from '@tldraw/tldraw';
import {
  NormalizedShape,
  LayoutNode,
  CompilationResult,
  CompilationOptions,
  SemanticRole
} from './types';
import { computeAABB, isEnclosed, sanitizeMarkdown } from './geometry';
import { LegendEngine } from './legend';
import { AsciiSerializer } from './ascii';

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const SEMANTIC_LEGEND_MARKDOWN = `## MarkDraw Semantic Legend
| Notation | Meaning |
| :--- | :--- |
| \`[Section]\` | Page-level structural band |
| \`[Card]\` | Grouped content container (variants: outline/elevated/flat) |
| \`[Button]\` | Interactive click target |
| \`<Input>\` | Form input (kinds: text/search/password/date/file) |
| \`(Icon)\` | Graphical node; name in parentheses |
| \`---\` | Divider |
| \`>\` direction | Row / Column layout of container children |`;

export class MarkDrawCompiler {
  public static compile(
    shapes: TLShape[],
    editor?: Editor | null,
    options?: CompilationOptions
  ): CompilationResult {
    const opts: Required<CompilationOptions> = {
      containmentThreshold: options?.containmentThreshold ?? 0.85,
      rowClusterThreshold: options?.rowClusterThreshold ?? 16,
      gridBandThreshold: options?.gridBandThreshold ?? 32,
      includeTimestamp: options?.includeTimestamp ?? false,
      includeLegend: options?.includeLegend ?? true
    };

    const normalized = this.normalize(shapes, editor);
    const tree = this.buildHierarchy(normalized, opts.containmentThreshold);

    const specBody = this.serializeSpecTable(tree, opts);
    const gridBody = this.serializeSpatialGrid(tree, opts.gridBandThreshold);
    const asciiBody = AsciiSerializer.serialize(tree);

    const legendPrefix = opts.includeLegend ? `${SEMANTIC_LEGEND_MARKDOWN}\n\n---\n\n` : '';

    return {
      markdownSpec: `${legendPrefix}${specBody}`,
      markdownGrid: `${legendPrefix}${gridBody}`,
      markdownAscii: `${legendPrefix}${asciiBody}`,
      jsonAst: JSON.stringify(tree, null, 2),
      timestamp: new Date().toISOString(),
      elementCount: normalized.length
    };
  }

  public static normalize(shapes: TLShape[], editor?: Editor | null): NormalizedShape[] {
    const results: NormalizedShape[] = [];

    for (const s of shapes) {
      const props = (s.props || {}) as Record<string, any>;
      const rawText = (props.text || props.name || props.label || '') as string;
      const text = sanitizeMarkdown(rawText);

      // Filter out empty text boxes
      if (s.type === 'text' && text.trim().length === 0) {
        continue;
      }

      // Determine dimensions: preference to editor.getShapePageBounds for accurate page-space AABB
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

      // Filter out accidental micro-dots / ghost elements (< 6px)
      if (s.type !== 'text' && (w < 6 || h < 6)) {
        continue;
      }

      const bounds = { x, y, w, h };
      const aabb = computeAABB(bounds);
      const color = props.color || 'black';
      const isDashed = props.dash === 'dashed' || props.dash === 'dotted';
      const userMetaRole = (s.meta as any)?.markdrawRole;

      let role: SemanticRole = 'unknown';
      const widgetType = props.widgetType as string | undefined;
      let widgetProps: Record<string, any> | undefined = undefined;

      if (s.type === 'ui-widget' && widgetType) {
        widgetProps = {
          variant: props.variant,
          placeholder: props.placeholder,
          checked: props.checked,
          options: props.options,
          iconName: props.iconName,
          subtext: props.subtext,
          value: props.value
        };

        switch (widgetType) {
          // Containers
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
            role = 'container';
            break;

          // Buttons
          case 'button':
            role = 'button';
            break;

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
            role = 'input';
            break;

          // Icons & Media
          case 'avatar':
          case 'avatar_group':
          case 'thumbnail_strip':
          case 'badge':
          case 'icon':
          case 'stat_kpi':
          case 'image_frame':
          case 'video_frame':
            role = 'icon_avatar';
            break;

          // Dividers & Spacers
          case 'divider':
          case 'spacer':
            role = 'divider';
            break;

          // Typography & Content
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
            role = 'text';
            break;

          default:
            role = 'unknown';
        }
      } else {
        role = LegendEngine.resolveRole({
          type: s.type,
          color,
          dash: props.dash || 'draw',
          text,
          userMetaRole,
          geo: props.geo
        });
      }

      results.push({
        id: s.id,
        type: s.type,
        bounds,
        aabb,
        color,
        isDashed,
        text,
        role,
        widgetType,
        widgetProps
      });
    }

    return results;
  }

  public static buildHierarchy(
    shapes: NormalizedShape[],
    containmentThreshold: number = 0.85
  ): LayoutNode[] {
    if (shapes.length === 0) return [];

    const sortedByAreaDesc = [...shapes].sort(
      (a, b) => b.bounds.w * b.bounds.h - a.bounds.w * a.bounds.h
    );

    const nodeRegistry = new Map<string, LayoutNode>();
    for (const shape of shapes) {
      const fallbackLabel = shape.widgetType
        ? `${capitalize(shape.widgetType)}_${shape.id.slice(-4)}`
        : `${shape.type}_${shape.id.slice(-4)}`;

      const label = shape.text || fallbackLabel;

      const node: LayoutNode = {
        id: shape.id,
        shape,
        role: shape.role,
        label,
        path: 'Root',
        direction: 'Leaf',
        children: [],
        parent: null,
        widgetType: shape.widgetType,
        widgetProps: shape.widgetProps
      };
      nodeRegistry.set(shape.id, node);
    }

    const roots: LayoutNode[] = [];

    // Assign each shape to its smallest enclosing parent
    for (const shape of sortedByAreaDesc) {
      const node = nodeRegistry.get(shape.id)!;
      let immediateParent: LayoutNode | null = null;
      let minParentArea = Infinity;

      for (const candidate of shapes) {
        if (candidate.id === shape.id) continue;
        const candidateArea = candidate.bounds.w * candidate.bounds.h;
        const childArea = shape.bounds.w * shape.bounds.h;

        if (
          candidateArea > childArea &&
          isEnclosed(shape.aabb, candidate.aabb, containmentThreshold)
        ) {
          if (candidateArea < minParentArea) {
            minParentArea = candidateArea;
            immediateParent = nodeRegistry.get(candidate.id) || null;
          }
        }
      }

      if (immediateParent) {
        immediateParent.children.push(node);
        node.parent = immediateParent.id;
      } else {
        roots.push(node);
      }
    }

    // Container Promotion Rule: any shape containing >= 2 children is promoted to 'container'
    for (const node of nodeRegistry.values()) {
      if (node.children.length >= 2 && node.role !== 'container') {
        node.role = 'container';
      }
    }

    // Top-down pass to assign layout paths, directions, and sort children spatially
    const processSubtree = (node: LayoutNode, currentPath: string) => {
      node.path = currentPath;
      if (node.children.length > 0) {
        node.direction = this.inferDirection(node.children);
        this.sortChildren(node.children, node.direction);
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

    return roots;
  }

  public static inferDirection(children: LayoutNode[]): 'Row' | 'Column' {
    if (children.length <= 1) return 'Row';

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const child of children) {
      const cx = child.shape.bounds.x + child.shape.bounds.w / 2;
      const cy = child.shape.bounds.y + child.shape.bounds.h / 2;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
    }

    const spanX = maxX - minX;
    const spanY = maxY - minY;

    return spanY > spanX ? 'Column' : 'Row';
  }

  public static sortChildren(children: LayoutNode[], direction: 'Row' | 'Column'): void {
    if (direction === 'Row') {
      children.sort((a, b) => a.shape.bounds.x - b.shape.bounds.x);
    } else {
      children.sort((a, b) => a.shape.bounds.y - b.shape.bounds.y);
    }
  }

  public static formatProps(node: LayoutNode): string {
    const p = node.widgetProps;
    if (!p) {
      if (node.shape.color && node.shape.color !== 'black') {
        return `color="${node.shape.color}"`;
      }
      return '—';
    }

    const pairs: string[] = [];
    if (p.variant) pairs.push(`variant="${p.variant}"`);
    if (p.placeholder) pairs.push(`placeholder="${p.placeholder}"`);
    if (typeof p.checked === 'boolean') pairs.push(`checked=${p.checked}`);
    if (p.options) pairs.push(`options=[${p.options}]`);
    if (typeof p.value === 'number' && p.value > 0) pairs.push(`value=${p.value}`);
    if (p.iconName) pairs.push(`icon="${p.iconName}"`);
    if (p.subtext) pairs.push(`subtext="${p.subtext}"`);

    return pairs.length > 0 ? pairs.join(', ') : '—';
  }

  public static serializeSpecTable(
    roots: LayoutNode[],
    options?: { includeTimestamp?: boolean }
  ): string {
    if (roots.length === 0) {
      return '_Canvas is empty. Draw shapes or drop UI components to generate the specification._';
    }

    const rows: string[] = [];
    rows.push('### MarkDraw UI Specification');
    if (options?.includeTimestamp) {
      rows.push(`**Generated:** ${new Date().toISOString()}  `);
    }
    rows.push(`**Roots Detected:** ${roots.length} view(s)\n`);
    rows.push('#### Semantic Hierarchy Table');
    rows.push('| Path | Component | Semantics | Layout Flow | Props & Attributes | Children / Content |');
    rows.push('| :--- | :--- | :--- | :--- | :--- | :--- |');

    const walk = (node: LayoutNode) => {
      const childBadges =
        node.children.length > 0
          ? node.children
              .map((c) => {
                if (c.widgetType) {
                  return `<${capitalize(c.widgetType)}: "${c.label}">`;
                }
                return LegendEngine.getBadgeSymbol(c.role, c.label);
              })
              .join(', ')
          : node.shape.text
            ? `"${node.shape.text}"`
            : '—';

      const semanticsBadge = node.widgetType
        ? `<${capitalize(node.widgetType)}>`
        : LegendEngine.getBadgeSymbol(node.role, '').replace(/:\s*Untitled|\s*Untitled/, '').trim() ||
          node.role;

      const propsStr = this.formatProps(node);

      rows.push(
        `| \`${node.path}\` | **${node.label}** | ${semanticsBadge} | ${node.direction} | ${propsStr} | ${childBadges} |`
      );
      for (const child of node.children) {
        walk(child);
      }
    };

    for (const root of roots) {
      walk(root);
    }

    return rows.join('\n');
  }

  public static serializeSpatialGrid(roots: LayoutNode[], gridBandThreshold: number = 32): string {
    if (roots.length === 0) return '_Canvas is empty._';

    const lines: string[] = [];
    lines.push('### Spatial Grid Layout Table\n');

    const rowClustered: LayoutNode[][] = [];
    const sortedRoots = [...roots].sort((a, b) => a.shape.bounds.y - b.shape.bounds.y);

    for (const node of sortedRoots) {
      let placed = false;
      for (const cluster of rowClustered) {
        const clusterY = cluster[0].shape.bounds.y;
        if (Math.abs(node.shape.bounds.y - clusterY) <= gridBandThreshold) {
          cluster.push(node);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rowClustered.push([node]);
      }
    }

    let maxCols = 0;
    for (const cluster of rowClustered) {
      cluster.sort((a, b) => a.shape.bounds.x - b.shape.bounds.x);
      maxCols = Math.max(maxCols, cluster.length);
    }

    if (maxCols === 0) return '_No spatial cells formed._';

    const headers = Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`);
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${headers.map(() => ':---').join(' | ')} |`);

    for (const cluster of rowClustered) {
      const cellValues = cluster.map((n) => {
        if (n.widgetType) {
          return `[${capitalize(n.widgetType)}: "${n.label}"]`;
        }
        return LegendEngine.getBadgeSymbol(n.role, n.label);
      });
      while (cellValues.length < maxCols) {
        cellValues.push('—');
      }
      lines.push(`| ${cellValues.join(' | ')} |`);
    }

    return lines.join('\n');
  }
}
