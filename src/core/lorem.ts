import { fnv1a32 } from './ids';
import { UIWidgetProps } from './types';
import { isUntouchedLabel } from './widgets/widgetCatalog';

export const LOREM_PARAGRAPH =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ' +
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ' +
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.';

const SAMPLE_INPUTS = [
  'you@example.com',
  'Jane Doe',
  'Acme Corporation',
  'San Francisco, CA',
  'https://markdraw.dev',
  'Product Designer'
];

const SAMPLE_SEARCHES = [
  'Search documentation...',
  'Search orders or users...',
  'Filter by keyword...',
  'Quick search (press /)...'
];

const SAMPLE_KPIS = [
  { val: '$24.8k', sub: '+14% vs last month' },
  { val: '99.9%', sub: 'System uptime' },
  { val: '1,420', sub: 'Active sessions' },
  { val: '4.9 ★', sub: 'Average rating' },
  { val: '182ms', sub: 'Avg response time' }
];

const SAMPLE_CARD_TITLES = [
  'Analytics Overview',
  'User Profile',
  'System Performance',
  'Billing & Plans',
  'Security Settings',
  'Recent Activity'
];

const SAMPLE_HEADINGS = [
  'Dashboard & Reports',
  'Customer Lifecycle',
  'Developer Settings',
  'Platform Architecture',
  'Features & Integration'
];

/**
 * Deterministically extracts a sliced string from LOREM_PARAGRAPH using seed hash.
 */
export function getLoremSlice(seed: string, minLen: number = 30, maxLen: number = 80): string {
  const hash = fnv1a32(seed);
  const total = LOREM_PARAGRAPH.length;
  const start = hash % (total - maxLen - 1);
  const raw = LOREM_PARAGRAPH.slice(start, start + maxLen);

  // Clean edges to word boundaries
  const firstSpace = raw.indexOf(' ');
  const lastSpace = raw.lastIndexOf(' ');
  const clean =
    firstSpace !== -1 && lastSpace > firstSpace
      ? raw.slice(firstSpace + 1, lastSpace).trim()
      : raw.trim();

  return clean.length >= minLen ? clean : raw.trim();
}

/**
 * Generates 2-3 lines of deterministic ghost text for paragraphs or card bodies.
 */
export function getLoremLines(seed: string, count: number = 2): string[] {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const lineSeed = `${seed}:line:${i}`;
    lines.push(getLoremSlice(lineSeed, 25, 60));
  }
  return lines;
}

export interface GhostPreviewResult {
  isGhost: boolean;
  primary: string;
  subtext?: string;
  lines?: string[];
  placeholder?: string;
}

/**
 * Derives visual ghost preview text without mutating any props or compiler outputs.
 */
export function getGhostPreview(
  widgetType: string,
  shapeId: string = 'default',
  props: Partial<UIWidgetProps> = {}
): GhostPreviewResult {
  const hash = fnv1a32(shapeId);
  const rawLabel = props.label || '';
  const isLabelUntouched = isUntouchedLabel(widgetType, rawLabel);

  switch (widgetType) {
    case 'paragraph':
    case 'blockquote': {
      if (!isLabelUntouched && rawLabel) {
        return { isGhost: false, primary: rawLabel };
      }
      return {
        isGhost: true,
        primary: '',
        lines: getLoremLines(shapeId, 3)
      };
    }

    case 'card': {
      const primary = isLabelUntouched
        ? SAMPLE_CARD_TITLES[hash % SAMPLE_CARD_TITLES.length]
        : rawLabel;
      return {
        isGhost: isLabelUntouched,
        primary,
        subtext: props.subtext || (isLabelUntouched ? getLoremSlice(`${shapeId}:sub`, 30, 70) : undefined),
        lines: getLoremLines(shapeId, 2)
      };
    }

    case 'input': {
      const p = props.placeholder;
      if (p && p.trim() !== '') {
        return { isGhost: false, primary: rawLabel, placeholder: p };
      }
      return {
        isGhost: isLabelUntouched,
        primary: rawLabel,
        placeholder: SAMPLE_INPUTS[hash % SAMPLE_INPUTS.length]
      };
    }

    case 'search': {
      const p = props.placeholder;
      if (p && p.trim() !== '') {
        return { isGhost: false, primary: rawLabel, placeholder: p };
      }
      return {
        isGhost: true,
        primary: rawLabel,
        placeholder: SAMPLE_SEARCHES[hash % SAMPLE_SEARCHES.length]
      };
    }

    case 'password': {
      return {
        isGhost: isLabelUntouched,
        primary: rawLabel,
        placeholder: '••••••••••••'
      };
    }

    case 'textarea': {
      const p = props.placeholder;
      if (p && p.trim() !== '') {
        return { isGhost: false, primary: rawLabel, placeholder: p };
      }
      return {
        isGhost: true,
        primary: rawLabel,
        placeholder: getLoremSlice(shapeId, 40, 90)
      };
    }

    case 'stat_kpi': {
      if (!isLabelUntouched && rawLabel) {
        return { isGhost: false, primary: rawLabel, subtext: props.subtext };
      }
      const sample = SAMPLE_KPIS[hash % SAMPLE_KPIS.length];
      return {
        isGhost: true,
        primary: sample.val,
        subtext: props.subtext || sample.sub
      };
    }

    case 'heading': {
      if (!isLabelUntouched && rawLabel) {
        return { isGhost: false, primary: rawLabel };
      }
      return {
        isGhost: true,
        primary: SAMPLE_HEADINGS[hash % SAMPLE_HEADINGS.length]
      };
    }

    case 'navbar': {
      const opts = props.options;
      if (opts && opts.trim() !== '') {
        return { isGhost: false, primary: opts };
      }
      return {
        isGhost: true,
        primary: 'Home, About, Docs, Pricing'
      };
    }

    case 'tabs': {
      const opts = props.options;
      if (opts && opts.trim() !== '') {
        return { isGhost: false, primary: opts };
      }
      return {
        isGhost: true,
        primary: 'Overview|Analytics|Settings'
      };
    }

    default:
      return {
        isGhost: isLabelUntouched,
        primary: rawLabel
      };
  }
}
