import { IRNode } from './ir';

interface LegendEntry {
  notation: string;
  meaning: string;
  example: string;
}

const WIDGET_LEGEND_MAP: Record<string, LegendEntry> = {
  button: {
    notation: '[btn "Text" variant]',
    meaning: 'Button (variants: solid, ghost)',
    example: '[btn "Send" ghost]'
  },
  heading: {
    notation: '[header "Title" h1]',
    meaning: 'Heading (levels: h1, h2, h3)',
    example: '[header "About Us" h1]'
  },
  paragraph: {
    notation: '[para]',
    meaning: 'Body paragraph (line glyph on canvas)',
    example: '[para]'
  },
  input: {
    notation: '[input "Placeholder"]',
    meaning: 'Text / form input field',
    example: '[input "Email..."]'
  },
  search: {
    notation: '[search "Query"]',
    meaning: 'Search input',
    example: '[search "Search..."]'
  },
  password: {
    notation: '[password "Placeholder"]',
    meaning: 'Password input',
    example: '[password]'
  },
  textarea: {
    notation: '[textarea "Placeholder"]',
    meaning: 'Multi-line text input',
    example: '[textarea "Notes..."]'
  },
  checkbox: {
    notation: '[check "Label" on/off]',
    meaning: 'Checkbox with state',
    example: '[check "Remember me" on]'
  },
  radio: {
    notation: '[radio "Label" on/off]',
    meaning: 'Radio button with state',
    example: '[radio "Option" off]'
  },
  toggle: {
    notation: '[toggle on/off]',
    meaning: 'Switch toggle with state',
    example: '[toggle on]'
  },
  select: {
    notation: '[select "A|B|C"]',
    meaning: 'Select dropdown with choices',
    example: '[select "Option 1|Option 2"]'
  },
  slider: {
    notation: '[slider N]',
    meaning: 'Range slider',
    example: '[slider 50]'
  },
  stepper: {
    notation: '[stepper N]',
    meaning: 'Numeric stepper',
    example: '[stepper 3]'
  },
  color_swatch: {
    notation: '[color]',
    meaning: 'Color picker / swatch',
    example: '[color]'
  },
  date_picker: {
    notation: '[date "Placeholder"]',
    meaning: 'Date picker input',
    example: '[date "2026-10-17"]'
  },
  file_upload: {
    notation: '[upload "Label"]',
    meaning: 'File upload dropzone',
    example: '[upload "Upload CV"]'
  },
  navbar: {
    notation: '[nav "A, B, C"]',
    meaning: 'Navigation bar items',
    example: '[nav "Home, About, Docs"]'
  },
  menubar: {
    notation: '[menubar "File|Edit"]',
    meaning: 'Application menu bar',
    example: '[menubar "File|Edit|View"]'
  },
  sidebar: {
    notation: '[sidebar "Title"]',
    meaning: 'Collapsible side navigation',
    example: '[sidebar "Dashboard"]'
  },
  footer_nav: {
    notation: '[footer_nav "A, B"]',
    meaning: 'Footer navigation links',
    example: '[footer_nav "Terms, Privacy"]'
  },
  tabs: {
    notation: '[tabs "A|B|C"]',
    meaning: 'Tab navigation group',
    example: '[tabs "Overview|Specs"]'
  },
  breadcrumbs: {
    notation: '[crumb "Path"]',
    meaning: 'Breadcrumb navigation',
    example: '[crumb "Home / Docs / API"]'
  },
  steps: {
    notation: '[steps 1-4 "Name"]',
    meaning: 'Multi-step progress flow',
    example: '[steps 1-4 "Shipping"]'
  },
  pagination: {
    notation: '[pag 1/5]',
    meaning: 'Pagination indicator',
    example: '[pag 1/5]'
  },
  page: {
    notation: '[page "Title"]',
    meaning: 'Top-level viewport / canvas boundary',
    example: '[page "Main Dashboard"]'
  },
  section: {
    notation: '[section "Title"]',
    meaning: 'Page structural band',
    example: '[section "Portfolio"]'
  },
  card: {
    notation: '[card "Title" variant]',
    meaning: 'Content card container',
    example: '[card "Profile" elevated]'
  },
  carousel: {
    notation: '[carousel "Title"]',
    meaning: 'Carousel / media slider container',
    example: '[carousel "Hero" autoplay]'
  },
  hero: {
    notation: '[hero]',
    meaning: 'Hero banner container',
    example: '[hero]'
  },
  modal: {
    notation: '[modal "Title"]',
    meaning: 'Dialog / modal window',
    example: '[modal "Confirm"]'
  },
  split_pane: {
    notation: '[split]',
    meaning: 'Split-pane container',
    example: '[split]'
  },
  grid_gallery: {
    notation: '[grid 3x2]',
    meaning: 'Grid container',
    example: '[grid 3x2]'
  },
  data_table: {
    notation: '[table 4x3]',
    meaning: 'Data table rows x cols',
    example: '[table 4x3]'
  },
  table: {
    notation: '[table 4x3]',
    meaning: 'Data table rows x cols',
    example: '[table 4x3]'
  },
  list: {
    notation: '[list N]',
    meaning: 'Vertical list of items',
    example: '[list 5]'
  },
  blockquote: {
    notation: '[quote]',
    meaning: 'Blockquote text',
    example: '[quote]'
  },
  code_block: {
    notation: '[code "Cmd"]',
    meaning: 'Monospaced code block',
    example: '[code "npm install"]'
  },
  link: {
    notation: '[link "Label"]',
    meaning: 'Hyperlink',
    example: '[link "Learn more"]'
  },
  chip: {
    notation: '[chip "Label"]',
    meaning: 'Tag or chip badge',
    example: '[chip "React"]'
  },
  stat_kpi: {
    notation: '[kpi "1.2k"]',
    meaning: 'KPI metric with label',
    example: '[kpi "1.2k"]'
  },
  image_frame: {
    notation: '[img "Alt"]',
    meaning: 'Media placeholder with ✕ cross',
    example: '[img "hero-banner"]'
  },
  video_frame: {
    notation: '[video "File"]',
    meaning: 'Video player placeholder',
    example: '[video "intro.mp4"]'
  },
  avatar: {
    notation: '[avatar]',
    meaning: 'Avatar placeholder',
    example: '[avatar]'
  },
  avatar_group: {
    notation: '[avatar_group]',
    meaning: 'Overlapping avatar group',
    example: '[avatar_group]'
  },
  thumbnail_strip: {
    notation: '[thumbnails]',
    meaning: 'Horizontal thumbnail gallery',
    example: '[thumbnails]'
  },
  badge: {
    notation: '[badge "Label"]',
    meaning: 'Status or notification badge',
    example: '[badge "New"]'
  },
  icon: {
    notation: '[icon "Name"]',
    meaning: 'Named iconography placeholder',
    example: '[icon "settings"]'
  },
  divider: {
    notation: '[divider]',
    meaning: 'Visual separator',
    example: '[divider]'
  },
  spacer: {
    notation: '[spacer]',
    meaning: 'Layout spacing block',
    example: '[spacer]'
  },
  progress_bar: {
    notation: '[progress N]',
    meaning: 'Progress bar indicator',
    example: '[progress 60]'
  },
  skeleton: {
    notation: '[skeleton]',
    meaning: 'Content loading placeholder',
    example: '[skeleton]'
  },
  tooltip: {
    notation: '[tooltip "Text"]',
    meaning: 'Floating tooltip hint',
    example: '[tooltip "Help info"]'
  },
  toast: {
    notation: '[toast "Text"]',
    meaning: 'Ephemeral toast alert',
    example: '[toast "Saved!"]'
  },
  empty_state: {
    notation: '[empty "Text"]',
    meaning: 'Zero-data empty state',
    example: '[empty "No projects found"]'
  },
  banner: {
    notation: '[banner "Text" variant]',
    meaning: 'Warning or alert banner',
    example: '[banner "Warning" warn]'
  },
  header: {
    notation: '[header]',
    meaning: 'Header region container',
    example: '[header]'
  },
  footer: {
    notation: '[footer]',
    meaning: 'Footer region container',
    example: '[footer]'
  }
};

const BEHAVIOR_DESCRIPTIONS: Record<string, string> = {
  sticky: 'Fixes position to viewport edge during scroll',
  floating: 'Elevated floating element above document flow',
  overlay: 'Backdrop modal or drawer overlaying screen',
  fixed: 'Strict fixed viewport position',
  fullscreen: 'Expands across the entire viewport',
  autoplay: 'Automatically loops / plays media or slider',
  parallax: 'Scroll-linked differential speed effect',
  expandable: 'Collapsible accordion or dropdown section',
  draggable: 'Supports pointer drag interactions',
  'scroll-snap': 'Snaps child containers into view on scroll'
};

/**
 * Extracts all unique widget types, active behavior flags, and style axes from an IR tree.
 */
function collectCanvasFeatures(roots: IRNode[]): {
  widgetTypes: Set<string>;
  behaviors: Set<string>;
  styles: {
    hasWidth: boolean;
    hasAlign: boolean;
    hasDist: boolean;
    hasRel: boolean;
    hasNote: boolean;
  };
} {
  const widgetTypes = new Set<string>();
  const behaviors = new Set<string>();
  const styles = {
    hasWidth: false,
    hasAlign: false,
    hasDist: false,
    hasRel: false,
    hasNote: false
  };

  const visit = (node: IRNode) => {
    if (node.widgetType) {
      widgetTypes.add(node.widgetType);
    }

    const nodeBehaviors = node.textProps?.behaviors || node.style?.behaviors;
    if (Array.isArray(nodeBehaviors)) {
      for (const b of nodeBehaviors) {
        behaviors.add(b);
      }
    }

    if (node.style) {
      if (node.style.widthToken || typeof node.style.widthPct === 'number') {
        styles.hasWidth = true;
      }
      if (node.style.align || node.style.alignY) {
        styles.hasAlign = true;
      }
      if (node.style.dist) {
        styles.hasDist = true;
      }
      if (node.style.rel) {
        styles.hasRel = true;
      }
      if (node.style.note || (typeof node.textProps?.note === 'string' && node.textProps.note.trim() !== '')) {
        styles.hasNote = true;
      }
    }

    for (const child of node.children) {
      visit(child);
    }
  };

  for (const root of roots) {
    visit(root);
  }

  return { widgetTypes, behaviors, styles };
}

/**
 * Generates an auto-derived, lean markdown legend documented ONLY for elements and styles present on the canvas.
 */
export function generateCanvasLegend(roots: IRNode[]): string {
  if (!roots || roots.length === 0) {
    return '';
  }

  const { widgetTypes, behaviors, styles } = collectCanvasFeatures(roots);

  const lines: string[] = [];
  lines.push('### MarkDraw Canvas Legend');
  lines.push('_Auto-generated contract legend for widgets and styles present on this canvas._\n');
  lines.push('| Notation | Meaning | Example |');
  lines.push('| :--- | :--- | :--- |');

  // Mandatory Text Placeholder row (Stage 1 contract standard)
  lines.push('| `[Text Placeholder]` | placeholder content should be filled with dummy data | — |');

  // Sort widget types alphabetically for deterministic output
  const sortedTypes = Array.from(widgetTypes).sort();

  for (const type of sortedTypes) {
    const entry = WIDGET_LEGEND_MAP[type] || {
      notation: `[${type}]`,
      meaning: `${type} widget`,
      example: `[${type}]`
    };
    lines.push(`| \`${entry.notation}\` | ${entry.meaning} | \`${entry.example}\` |`);
  }

  // Active Style & Behavior Semantics (only if used on canvas)
  const styleRows: string[] = [];

  if (styles.hasWidth) {
    styleRows.push('| `width:50%` / `full-width` / `overflow` | measured span relative to parent | `width:50%` |');
  }
  if (styles.hasAlign) {
    styleRows.push('| `align:left\\|center\\|right`, `align-y` | position within parent (default: stretch/left) | `align:center` |');
  }
  if (styles.hasDist) {
    styleRows.push('| `dist:grid\\|wrap` | distribution arrangement along layout flow | `dist:grid cols:2 rows:2` |');
  }
  if (styles.hasRel) {
    styleRows.push('| `rel:overflow\\|overlap\\|inset` | spatial relationship to parent or sibling boundary | `rel:overflow` |');
  }
  if (styles.hasNote) {
    styleRows.push('| `note:"..."` | free-text styling or state hint (non-binding) | `note:"sticky header"` |');
  }

  const sortedBehaviors = Array.from(behaviors).sort();
  for (const b of sortedBehaviors) {
    const desc = BEHAVIOR_DESCRIPTIONS[b] || 'user-declared behavior flag; implement literally';
    styleRows.push(`| \`${b}\` | ${desc} | \`[card ${b}]\` |`);
  }

  if (styleRows.length > 0) {
    lines.push('');
    lines.push('**Active Style & Behavior Semantics**');
    lines.push('| Axis / Flag | Meaning | Example |');
    lines.push('| :--- | :--- | :--- |');
    lines.push(...styleRows);
  }

  return lines.join('\n');
}

export class CanvasLegendEngine {
  public static generate(roots: IRNode[]): string {
    return generateCanvasLegend(roots);
  }
}
