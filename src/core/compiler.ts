import { TLShape, Editor } from '@tldraw/tldraw';
import {
  CompilationResult,
  CompilationOptions,
  LayoutNode,
  NormalizedShape,
  SemanticRole
} from './types';
import {
  IRNode,
  IRTree,
  buildIRTree,
  serializeIRToJsonAst
} from './ir';
import {
  formatSemanticNotation,
  DYNAMIC_LEGEND_MARKDOWN
} from './notation';
import { generateCanvasLegend } from './legend';
import { AsciiSerializer } from './ascii';
import { computeAABB, sanitizeMarkdown } from './geometry';
import { getRoleDefaultProps, isUntouchedRoleLabel } from '../annotation/roleDefaults';
import { getShapeMeta } from '../annotation/shapeMeta';
import { V3_WIDGET_TO_V4_ROLE_MAP } from '../annotation/migrate';
import { detectSiblingPatterns } from './patterns';
import { AI_DIRECTIVE_HEADER } from './directive';
import { getPlatformProfile } from '../annotation/profiles';

export const MARKDRAW_VERSION = '4.0.0';

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const SEMANTIC_LEGEND_MARKDOWN = DYNAMIC_LEGEND_MARKDOWN;

export function inferPlacement(
  node: IRNode,
  parent: IRNode | null
): 'header' | 'body' | 'footer' | 'nested' | '—' {
  if (!parent) {
    if (node.widgetType === 'page' || node.role === 'page') {
      return '—';
    }
    if (node.widgetType === 'navbar' || node.widgetType === 'header' || node.role === 'navbar') {
      return 'header';
    }
    if (node.widgetType === 'footer' || node.role === 'footer') {
      return 'footer';
    }
    return 'body';
  }

  // Widget TYPE / ROLE wins: footer/navbar widgets emit placement:type, never contradicted
  if (node.widgetType === 'navbar' || node.widgetType === 'header' || node.role === 'navbar') {
    return 'header';
  }
  if (node.widgetType === 'footer' || node.role === 'footer') {
    return 'footer';
  }

  // If direct child of a [page] root, infer from geometry relative to the page box
  if (parent.widgetType === 'page' || parent.role === 'page') {
    if (node.isUnit) {
      return 'nested';
    }

    const pageBounds = parent.bounds;
    const pageH = pageBounds.h;
    const pageW = pageBounds.w;

    const relTop = node.bounds.y - pageBounds.y;
    const widthRatio = pageW > 0 ? node.bounds.w / pageW : 0;
    const isWideEnough = widthRatio >= 0.70;

    // Top 15% band
    if (relTop <= 0.15 * pageH && isWideEnough) {
      return 'header';
    }

    // Geometric footer: last top-level band AND top edge within bottom 35% of page
    const isBottom35 = node.bounds.y >= pageBounds.y + 0.65 * pageH;
    if (isBottom35 && isWideEnough) {
      const hasSiblingBelow = parent.children.some(
        (sib) => sib.id !== node.id && sib.bounds.y > node.bounds.y + 20
      );
      if (!hasSiblingBelow) {
        return 'footer';
      }
    }

    return 'body';
  }

  // All shapes inside another container get 'nested'
  return 'nested';
}

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
      sizeBucketTolerance: options?.sizeBucketTolerance ?? 2,
      alignTolerance: options?.alignTolerance ?? 3,
      includeTimestamp: options?.includeTimestamp ?? false,
      includeLegend: options?.includeLegend ?? false,
      pageNote: options?.pageNote ?? '',
      platform: options?.platform ?? (options?.platformId === 'android-material' ? 'android-material' : 'web'),
      platformId: options?.platformId ?? options?.platform ?? 'web',
      scope: options?.scope ?? null,
      units: options?.units ?? [],
      annotationMode: options?.annotationMode ?? false
    };

    // All compilation flows strictly Shapes -> IR -> Serializers
    const ir: IRTree = buildIRTree(shapes, editor, opts.containmentThreshold, options);

    let specBody = this.serializeSpecTable(ir.roots, opts);
    if (ir.relations && ir.relations.length > 0) {
      specBody += `\n\n${ir.relations.join('\n')}`;
    }

    const gridBody = this.serializeSpatialGrid(ir.roots, opts.gridBandThreshold);
    const asciiBody = AsciiSerializer.serialize(ir.roots);
    const jsonAst = serializeIRToJsonAst(ir.roots);

    let directivePrefix = `${AI_DIRECTIVE_HEADER}\n\n`;
    if (ir.scopedMeta) {
      const uCount = ir.scopedMeta.unitCount;
      const nCount = ir.scopedMeta.nodeCount;
      const uStr = `${uCount} unit${uCount === 1 ? '' : 's'}`;
      const nStr = `${nCount} node${nCount === 1 ? '' : 's'}`;
      directivePrefix = `_Scoped compile: "${ir.scopedMeta.scopeName}" — ${uStr}, ${nStr} (of ${ir.scopedMeta.totalNodes} in "${ir.scopedMeta.rootName}")_\n\n`;
    } else if (ir.roots.some((r) => r.isAnnotationNode)) {
      const profile = getPlatformProfile(opts.platform);
      const platLine = `Target platform: ${profile.displayName}. ${profile.directiveLines.join(' ')}`;
      const hasRespPage = ir.roots.some(
        (r) =>
          r.role === 'page' &&
          (r.textProps?.isResponsive || r.textProps?.behaviors?.includes('responsive'))
      );
      const respLine = hasRespPage
        ? '\n> Responsive: this page must adapt to mobile widths; per-shape sm:* tokens are binding.'
        : '';
      directivePrefix = `${AI_DIRECTIVE_HEADER}\n> ${platLine}${respLine}\n\n`;
    }

    const legendPrefix = opts.includeLegend ? `${generateCanvasLegend(ir.roots, opts)}\n\n---\n\n` : '';
    const warningSuffix =
      ir.skippedShapes && ir.skippedShapes > 0
        ? `\n\n_Warning: ${ir.skippedShapes} shape(s) skipped due to processing errors._`
        : '';

    return {
      markdownSpec: `${directivePrefix}${legendPrefix}${specBody}${warningSuffix}`,
      markdownGrid: `${legendPrefix}${gridBody}`,
      markdownAscii: `${legendPrefix}${asciiBody}`,
      jsonAst,
      timestamp: opts.includeTimestamp ? new Date().toISOString() : '',
      elementCount: ir.elementCount,
      lints: ir.lints || []
    };
  }

  public static normalize(shapes: TLShape[], editor?: Editor | null): NormalizedShape[] {
    const results: NormalizedShape[] = [];

    for (const s of shapes) {
      const props = (s.props || {}) as Record<string, unknown>;
      const rawText = (props.text || props.name || props.label || '') as string;
      const text = sanitizeMarkdown(rawText);

      let x = s.x;
      let y = s.y;
      let w = typeof props.w === 'number' ? props.w : 100;
      let h = typeof props.h === 'number' ? props.h : 100;

      if (editor && typeof editor.getShapePageBounds === 'function') {
        const pageBounds = editor.getShapePageBounds(s);
        if (pageBounds) {
          x = pageBounds.x;
          y = pageBounds.y;
          w = pageBounds.w;
          h = pageBounds.h;
        }
      }

      if (w < 4 || h < 4) continue;

      const bounds = { x, y, w, h };
      const aabb = computeAABB(bounds);
      const widgetType = (props.widgetType as string) || undefined;
      const meta = getShapeMeta(s);
      const role = (meta?.role || (widgetType ? (V3_WIDGET_TO_V4_ROLE_MAP[widgetType]?.targetRole || widgetType) : 'unknown')) as SemanticRole;

      results.push({
        id: s.id,
        type: s.type,
        bounds,
        aabb,
        color: (props.color as string) || 'black',
        isDashed: props.dash === 'dashed',
        text,
        role,
        widgetType,
        widgetProps: props
      });
    }

    return results;
  }

  public static formatProps(
    node: IRNode | LayoutNode,
    parent?: IRNode | LayoutNode | null
  ): string {
    const p = (node as IRNode).textProps || (node as LayoutNode).widgetProps;
    const style = node.style;
    if (!p && !style) return '—';

    const type = node.widgetType || (node as any).role || '';
    const defaults = getRoleDefaultProps(type);
    const propsPairs: string[] = [];

    if ((node as IRNode).isUnit && (node as IRNode).unitName) {
      propsPairs.push(`unit:"${(node as IRNode).unitName}"`);
    }

    const isPage = (node as any).role === 'page' || node.widgetType === 'page';
    if (isPage && (p?.isResponsive || style?.isResponsive)) {
      propsPairs.push('responsive');
    }

    if (p) {
      if (
        p.variant &&
        p.variant !== defaults.variant &&
        p.variant !== 'default' &&
        p.variant !== 'solid' &&
        type !== 'grid_gallery' &&
        type !== 'data_table' &&
        type !== 'table'
      ) {
        propsPairs.push(`variant="${p.variant}"`);
      }
      if (p.placeholder && p.placeholder !== defaults.placeholder) {
        propsPairs.push(`placeholder="${p.placeholder}"`);
      }
      if (
        typeof p.checked === 'boolean' &&
        p.checked === true &&
        p.checked !== defaults.checked
      ) {
        propsPairs.push(`checked=${p.checked}`);
      }
      if (p.options && p.options !== defaults.options && type !== 'tabs') {
        propsPairs.push(`options=[${p.options}]`);
      }
      if (
        typeof p.value === 'number' &&
        p.value > 0 &&
        p.value !== defaults.value &&
        type !== 'list' &&
        type !== 'avatar_group' &&
        type !== 'steps' &&
        type !== 'pagination'
      ) {
        propsPairs.push(`value=${p.value}`);
      }
      if (p.iconName && p.iconName !== defaults.iconName) {
        propsPairs.push(`icon="${p.iconName}"`);
      }
      if (p.subtext && p.subtext !== defaults.subtext) {
        propsPairs.push(`subtext="${p.subtext}"`);
      }
      if (p.altText && p.altText !== defaults.altText) {
        propsPairs.push(`alt="${p.altText}"`);
      }
      if (
        typeof p.showText === 'boolean' &&
        p.showText === true &&
        p.showText !== defaults.showText
      ) {
        propsPairs.push(`showText=${p.showText}`);
      }
    }

    // Section 1.3: Explicit counts & dims
    if (type === 'avatar_group') {
      const count = typeof p?.value === 'number' && p.value > 0 ? p.value : 3;
      propsPairs.push(`count:${count}`);
    } else if (type === 'list') {
      const count = typeof p?.value === 'number' && p.value > 0 ? p.value : 5;
      propsPairs.push(`count:${count}`);
    } else if (type === 'steps') {
      let count = 4;
      if (typeof p?.value === 'number' && p.value > 0) {
        count = p.value;
      } else if (p?.variant) {
        const m = p.variant.match(/\d+-(\d+)/);
        if (m) count = parseInt(m[1], 10);
      }
      propsPairs.push(`count:${count}`);
    } else if (type === 'pagination') {
      let count = 5;
      if (typeof p?.value === 'number' && p.value > 0) {
        count = p.value;
      } else if (p?.variant) {
        const m = p.variant.match(/\d+\/(\d+)/);
        if (m) count = parseInt(m[1], 10);
      }
      propsPairs.push(`count:${count}`);
    } else if (type === 'tabs') {
      let count = 3;
      if (typeof p?.value === 'number' && p.value > 0) {
        count = p.value;
      } else if (p?.options) {
        const opts = p.options.split(/[|,]/).filter(Boolean);
        if (opts.length > 0) count = opts.length;
      }
      propsPairs.push(`count:${count}`);
    }

    // Pattern group repeated child counts
    if (
      typeof (node as IRNode).patternCount === 'number' &&
      (node as IRNode).patternCount! >= 2
    ) {
      propsPairs.push(`count:${(node as IRNode).patternCount}`);
    }

    // Grids: always spell out "4 cols × 3 rows"
    if (type === 'grid_gallery' || type === 'data_table' || type === 'table' || (node as any).role === 'table' || (p?.variant && /^\d+x\d+$/.test(p.variant))) {
      const v = p?.variant || (type === 'grid_gallery' ? '3x2' : '4x3');
      const m = v.match(/^(\d+)x(\d+)$/);
      if (m) {
        propsPairs.push(`${m[1]} cols × ${m[2]} rows`);
      }
    }

    // Columns & Responsive Layout (Containers)
    const columns = p?.columns ?? style?.columns;
    if (typeof columns === 'number' && columns > 1) {
      const split = p?.columnSplit ?? style?.columnSplit;
      propsPairs.push(`cols:${columns}${split && split !== 'equal' ? ` (${split})` : ''}`);
    }

    const isResponsive = !isPage && (p?.isResponsive ?? style?.isResponsive);
    if (isResponsive) {
      const mobileStack = p?.mobileStack ?? style?.mobileStack ?? 'stack';
      propsPairs.push(`responsive:${mobileStack}`);
      const tabletLayout = p?.tabletLayout ?? style?.tabletLayout;
      if (tabletLayout && tabletLayout !== 'maintain') {
        propsPairs.push(`tablet:${tabletLayout}`);
      }
    }

    const styleTokens: string[] = [];

    if (style) {
      if (style.widthToken) {
        const parentProps = parent
          ? (parent as IRNode).textProps || (parent as LayoutNode).widgetProps
          : null;
        const parentResponsive = parentProps?.isResponsive ?? parent?.style?.isResponsive;
        if (
          parentResponsive &&
          style.widthToken !== 'full-width' &&
          !style.widthToken.includes('sm:')
        ) {
          styleTokens.push(`${style.widthToken} (sm:full)`);
        } else {
          styleTokens.push(style.widthToken);
        }
      }
      if (style.heightToken) {
        styleTokens.push(`height:${style.heightToken}`);
      }
      if (style.align) {
        styleTokens.push(`align:${style.align}`);
      }
      if (style.alignY) {
        styleTokens.push(`align-y:${style.alignY}`);
      }
      if (style.dist) {
        styleTokens.push(style.dist);
      }
      if (style.rel) {
        styleTokens.push(`rel:${style.rel}`);
      }
      if (Array.isArray(style.behaviors) && style.behaviors.length > 0) {
        for (const b of style.behaviors) {
          if (b === 'responsive' && isPage) continue;
          if (!propsPairs.includes(b) && !styleTokens.includes(b)) {
            styleTokens.push(b);
          }
        }
      }
      if (style.note) {
        styleTokens.push(`note:"${style.note}"`);
      }
    } else if (p) {
      if (Array.isArray(p.behaviors) && p.behaviors.length > 0) {
        for (const b of p.behaviors) {
          if (b === 'responsive' && isPage) continue;
          if (!propsPairs.includes(b) && !styleTokens.includes(b)) {
            styleTokens.push(b);
          }
        }
      }
      if (typeof p.note === 'string' && p.note.trim() !== '') {
        styleTokens.push(`note:"${p.note.trim()}"`);
      }
    }

    // Child responsive overrides
    const mobileOrder = typeof p?.mobileOrder === 'number' ? p.mobileOrder : style?.mobileOrder;
    if (typeof mobileOrder === 'number') {
      styleTokens.push(`sm:order-${mobileOrder}`);
    }

    const hideOnMobile = p?.hideOnMobile ?? style?.hideOnMobile;
    if (hideOnMobile) {
      styleTokens.push('sm:hidden');
    }

    const inUnit = Boolean(
      (node as IRNode).isUnit ||
      (node as IRNode).unitId ||
      (parent as IRNode)?.isUnit ||
      (parent as IRNode)?.unitId
    );

    if (inUnit) {
      return propsPairs.join(', ');
    }

    const propsStr = propsPairs.join(', ');
    const styleStr = styleTokens.join(' ');

    if (propsStr && styleStr) {
      return `${propsStr} ${styleStr}`;
    }
    if (propsStr) return propsStr;
    if (styleStr) return styleStr;
    return '—';
  }

  private static toIRNode(node: IRNode | LayoutNode): IRNode {
    if ('bounds' in node && 'textProps' in node) {
      return node as IRNode;
    }
    const ln = node as LayoutNode;
    return {
      id: ln.id,
      shortId: ln.id.slice(-4),
      widgetType:
        ln.widgetType ||
        (ln.role === 'container' ? 'section' : ln.role === 'button' ? 'button' : 'heading'),
      role: ln.role,
      label: ln.label,
      textProps: (ln.widgetProps as unknown as IRNode['textProps']) || {
        label: ln.shape?.text || ln.label
      },
      bounds: ln.shape?.bounds || { x: 0, y: 0, w: 100, h: 40 },
      children: (ln.children || []).map((c) => this.toIRNode(c)),
      parent: ln.parent,
      direction: ln.direction,
      path: ln.path,
      style: ln.style
    };
  }

  public static serializeSpecTable(
    roots: (IRNode | LayoutNode)[],
    options?: CompilationOptions
  ): string {
    if (!roots || roots.length === 0) {
      return '_Canvas is empty. Draw shapes or drop UI components to generate the specification._';
    }

    const irRoots = roots.map((r) => this.toIRNode(r));
    const rows: string[] = [];
    rows.push('### MarkDraw UI Specification');
    if (options?.includeTimestamp) {
      rows.push(`**Generated:** ${new Date().toISOString()}  `);
    }

    const rootPage = irRoots.find((r) => r.role === 'page' || r.widgetType === 'page');
    const effectivePageNote =
      options?.pageNote || rootPage?.textProps?.note || rootPage?.style?.note;
    if (effectivePageNote) {
      rows.push(`**Page note:** ${effectivePageNote}  `);
    }

    rows.push(`**Roots Detected:** ${irRoots.length} view(s)\n`);
    rows.push('#### Semantic Hierarchy Table');
    rows.push(
      '| Path | Component | Semantics | Placement | Layout Flow | Props & Attributes | Children / Content |'
    );
    rows.push(
      '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
    );

    const walk = (node: IRNode, parent: IRNode | null) => {
      const notation = formatSemanticNotation(node);

      let childBadges = '—';
      if (node.isUnit && node.children.length > 0) {
        childBadges = node.children
          .map((c) => {
            const raw = c.textProps?.label || c.label;
            const hasLit = !isUntouchedRoleLabel(c.role, raw);
            if (c.role === 'button' && hasLit) {
              return `"${raw}"`;
            }
            return c.role;
          })
          .join(', ');
      } else if (node.children.length === 1 && node.children[0].isUnit) {
        childBadges = `1 × [${node.children[0].unitName || node.children[0].label}]`;
      } else if (node.children.length > 0) {
        childBadges = detectSiblingPatterns(node.children);
      } else {
        const rawLabel = node.textProps?.label || node.label;
        const isUntouched = isUntouchedRoleLabel(node.role, rawLabel);

        if (isUntouched) {
          childBadges = '"content: [Text Placeholder]"';
        } else if (rawLabel) {
          childBadges = `"${rawLabel}"`;
        } else {
          childBadges = '—';
        }
      }

      const semanticsBadge = `<${capitalize(node.role)}>`;
      const placement = inferPlacement(node, parent);
      const layoutFlow =
        node.children.length > 0
          ? node.direction === 'Leaf'
            ? 'Column'
            : node.direction
          : '—';
      const propsStr = this.formatProps(node, parent);
      const propsCol = propsStr ? ` ${propsStr} ` : ' ';

      rows.push(
        `| \`${node.path}\` | **${notation}** | ${semanticsBadge} | ${placement} | ${layoutFlow} |${propsCol}| ${childBadges} |`
      );
      for (const child of node.children) {
        walk(child, node);
      }
    };

    for (const root of irRoots) {
      walk(root, null);
    }

    return rows.join('\n');
  }

  public static serializeSpatialGrid(
    roots: (IRNode | LayoutNode)[],
    gridBandThreshold: number = 32
  ): string {
    if (!roots || roots.length === 0) return '_Canvas is empty._';

    const irRoots = roots.map((r) => this.toIRNode(r));
    const lines: string[] = [];
    lines.push('### Spatial Grid Layout Table\n');

    const rowClustered: IRNode[][] = [];
    const sortedRoots = [...irRoots].sort((a, b) => a.bounds.y - b.bounds.y);

    for (const node of sortedRoots) {
      let placed = false;
      for (const cluster of rowClustered) {
        const clusterY = cluster[0].bounds.y;
        if (Math.abs(node.bounds.y - clusterY) <= gridBandThreshold) {
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
      cluster.sort((a, b) => a.bounds.x - b.bounds.x);
      maxCols = Math.max(maxCols, cluster.length);
    }

    if (maxCols === 0) return '_No spatial cells formed._';

    const headers = Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`);
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${headers.map(() => ':---').join(' | ')} |`);

    for (const cluster of rowClustered) {
      const cellValues = cluster.map((n) => formatSemanticNotation(n));
      while (cellValues.length < maxCols) {
        cellValues.push('—');
      }
      lines.push(`| ${cellValues.join(' | ')} |`);
    }

    return lines.join('\n');
  }
}
