import { IRNode } from './ir';
import { formatSemanticNotation } from './notation';

export function getWidgetTagName(widgetType: string): string {
  switch (widgetType) {
    case 'button':
      return 'btn';
    case 'heading':
      return 'header';
    case 'paragraph':
      return 'para';
    case 'image_frame':
      return 'img';
    case 'video_frame':
      return 'video';
    case 'checkbox':
      return 'check';
    case 'radio':
      return 'radio';
    case 'toggle':
      return 'toggle';
    case 'select':
      return 'select';
    case 'slider':
      return 'slider';
    case 'date_picker':
      return 'date';
    case 'file_upload':
      return 'file';
    case 'navigation':
    case 'navbar':
    case 'footer_nav':
      return 'nav';
    case 'breadcrumbs':
      return 'crumb';
    case 'pagination':
      return 'pag';
    case 'steps':
      return 'steps';
    case 'progress_bar':
      return 'progress';
    case 'code_block':
      return 'code';
    case 'stat_kpi':
      return 'kpi';
    case 'split_pane':
      return 'split';
    case 'grid_gallery':
      return 'grid';
    case 'data_table':
    case 'table':
      return 'table';
    case 'icon':
      return 'icon';
    case 'avatar':
      return 'avatar';
    case 'divider':
      return 'divider';
    case 'spacer':
      return 'spacer';
    case 'toast':
      return 'toast';
    case 'tooltip':
      return 'tooltip';
    case 'empty_state':
      return 'empty';
    case 'banner':
      return 'banner';
    default:
      return widgetType.replace(/_/g, '-');
  }
}

/**
 * Checks if array a matches array b
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Checks if pattern P can be reduced to a smaller repeating sub-pattern
 */
function isPrimitivePattern(p: string[]): boolean {
  const len = p.length;
  for (let subLen = 1; subLen <= Math.floor(len / 2); subLen++) {
    if (len % subLen === 0) {
      const sub = p.slice(0, subLen);
      let allMatch = true;
      for (let j = subLen; j < len; j += subLen) {
        if (!arraysEqual(sub, p.slice(j, j + subLen))) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return false;
    }
  }
  return true;
}

/**
 * Scans direct children of a container to detect k >= 2 consecutive identical widget-type sequences.
 * Returns formatted Children summary string for the Spec Table.
 */
export function detectSiblingPatterns(children: IRNode[]): string {
  if (!children || children.length === 0) {
    return '—';
  }
  if (children.length === 1) {
    return formatSemanticNotation(children[0]);
  }

  const types = children.map((c) => c.widgetType || 'unknown');
  const n = types.length;
  const segments: string[] = [];

  let i = 0;
  while (i < n) {
    let bestL = 0;
    let bestK = 0;
    let bestScore = 0;

    // Check candidate pattern lengths L from 1 to 4
    for (let L = 1; L <= 4; L++) {
      if (i + L > n) continue;
      const pattern = types.slice(i, i + L);
      if (!isPrimitivePattern(pattern)) continue;

      let k = 1;
      while (i + (k + 1) * L <= n) {
        const nextSlice = types.slice(i + k * L, i + (k + 1) * L);
        if (arraysEqual(pattern, nextSlice)) {
          k++;
        } else {
          break;
        }
      }

      if (k >= 2) {
        const score = k * L;
        if (score > bestScore) {
          bestScore = score;
          bestL = L;
          bestK = k;
        }
      }
    }

    if (bestK >= 2 && bestL > 0) {
      const patternTypes = types.slice(i, i + bestL);
      const patternTags = patternTypes.map(getWidgetTagName).join(', ');
      segments.push(`${bestK} × [${patternTags}] (repeated group — likely card/list items)`);
      for (let pIdx = i; pIdx < i + bestK * bestL; pIdx++) {
        children[pIdx].patternCount = bestK;
      }
      i += bestK * bestL;
    } else {
      segments.push(formatSemanticNotation(children[i]));
      i++;
    }
  }

  return segments.join(', ');
}

/**
 * Annotates children with patternCount if they participate in repeated pattern groups.
 */
export function annotateSiblingPatterns(children: IRNode[]): void {
  detectSiblingPatterns(children);
}

