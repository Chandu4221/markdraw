import { IRNode } from './ir';

function escapeNotation(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
    .trim();
}

/**
 * Formats an IRNode into MarkDraw v2.5 bracket-tag semantic notation.
 * e.g. [btn "Send"], [card "Profile" elevated], [para], [input "Email..."]
 */
export function formatSemanticNotation(node: IRNode): string {
  const type = node.widgetType;
  const p = node.textProps || {};
  const primaryLabel = p.label || node.label || '';

  switch (type) {
    case 'button': {
      const txt = primaryLabel;
      const v = p.variant;
      const varSuffix = v && v !== 'solid' && v !== 'default' ? ` ${v}` : '';
      return txt ? `[btn "${escapeNotation(txt)}"${varSuffix}]` : `[btn${varSuffix}]`;
    }

    case 'heading': {
      const v = p.variant;
      const varSuffix = v && v !== 'default' ? ` ${v}` : '';
      return `[header "${escapeNotation(primaryLabel || 'Heading')}"${varSuffix}]`;
    }

    case 'paragraph':
      return '[para]';

    case 'input': {
      const placeholder = p.placeholder || primaryLabel || '';
      return placeholder ? `[input "${escapeNotation(placeholder)}"]` : '[input]';
    }

    case 'search': {
      const placeholder = p.placeholder || primaryLabel || 'Search...';
      return `[search "${escapeNotation(placeholder)}"]`;
    }

    case 'password': {
      const placeholder = p.placeholder;
      return placeholder ? `[password "${escapeNotation(placeholder)}"]` : '[password]';
    }

    case 'textarea': {
      const placeholder = p.placeholder || primaryLabel || '';
      return placeholder ? `[textarea "${escapeNotation(placeholder)}"]` : '[textarea]';
    }

    case 'date_picker': {
      const placeholder = p.placeholder || primaryLabel;
      return placeholder ? `[date "${escapeNotation(placeholder)}"]` : '[date]';
    }

    case 'file_upload': {
      const txt = primaryLabel || 'Upload';
      return `[file "${escapeNotation(txt)}"]`;
    }

    case 'select': {
      const opts = p.options || p.placeholder || 'A|B|C';
      return `[select "${escapeNotation(opts)}"]`;
    }

    case 'slider': {
      const val = typeof p.value === 'number' ? p.value : 50;
      return `[slider ${val}]`;
    }

    case 'stepper': {
      const val = typeof p.value === 'number' ? p.value : 1;
      return `[stepper ${val}]`;
    }

    case 'color_swatch': {
      const v = p.variant || primaryLabel || '#000000';
      return `[color "${escapeNotation(v)}"]`;
    }

    case 'checkbox': {
      const txt = primaryLabel || 'Option';
      const flag = p.checked ? 'on' : 'off';
      return `[check "${escapeNotation(txt)}" ${flag}]`;
    }

    case 'radio': {
      const txt = primaryLabel || 'Option';
      const flag = p.checked ? 'on' : 'off';
      return `[radio "${escapeNotation(txt)}" ${flag}]`;
    }

    case 'toggle': {
      const flag = p.checked ? 'on' : 'off';
      return `[toggle ${flag}]`;
    }

    case 'navbar':
    case 'menubar': {
      const items = p.options || primaryLabel || 'Home, About, Contact';
      return `[nav "${escapeNotation(items)}"]`;
    }

    case 'sidebar': {
      const items = p.options || primaryLabel || 'Dashboard';
      return `[sidebar "${escapeNotation(items)}"]`;
    }

    case 'footer_nav': {
      const items = p.options || primaryLabel || 'Privacy, Terms';
      return `[footer_nav "${escapeNotation(items)}"]`;
    }

    case 'link': {
      const txt = primaryLabel || 'Read more';
      return `[link "${escapeNotation(txt)}"]`;
    }

    case 'chip': {
      const txt = primaryLabel || 'New';
      return `[chip "${escapeNotation(txt)}"]`;
    }

    case 'badge': {
      const txt = primaryLabel || '3';
      return `[badge "${escapeNotation(txt)}"]`;
    }

    case 'tabs': {
      const opts = p.options || 'Tab1|Tab2|Tab3';
      return `[tabs "${escapeNotation(opts)}"]`;
    }

    case 'breadcrumbs': {
      const pathStr = p.options || primaryLabel || 'Home / Docs / API';
      return `[crumb "${escapeNotation(pathStr)}"]`;
    }

    case 'steps': {
      const range = p.variant || '1-4';
      const txt = primaryLabel || 'Shipping';
      return `[steps ${range} "${escapeNotation(txt)}"]`;
    }

    case 'pagination': {
      const val = p.variant || '1/5';
      return `[pag ${val}]`;
    }

    case 'section': {
      const txt = primaryLabel && primaryLabel !== 'section' ? primaryLabel : '';
      return txt ? `[section "${escapeNotation(txt)}"]` : '[section]';
    }

    case 'header': {
      const txt = primaryLabel && primaryLabel !== 'header' ? primaryLabel : '';
      return txt ? `[header "${escapeNotation(txt)}"]` : '[header]';
    }

    case 'footer': {
      const txt = primaryLabel && primaryLabel !== 'footer' ? primaryLabel : '';
      return txt ? `[footer "${escapeNotation(txt)}"]` : '[footer]';
    }

    case 'card': {
      const txt = primaryLabel && primaryLabel !== 'card' ? primaryLabel : 'Card';
      const v = p.variant;
      const varSuffix = v && v !== 'default' && v !== 'outline' && v !== 'solid' ? ` ${v}` : '';
      return `[card "${escapeNotation(txt)}"${varSuffix}]`;
    }

    case 'hero': {
      const txt = primaryLabel && primaryLabel !== 'hero' ? primaryLabel : '';
      return txt ? `[hero "${escapeNotation(txt)}"]` : '[hero]';
    }

    case 'modal': {
      const txt = primaryLabel && primaryLabel !== 'modal' ? primaryLabel : 'Confirm';
      return `[modal "${escapeNotation(txt)}"]`;
    }

    case 'split_pane':
      return '[split]';

    case 'grid_gallery': {
      const v = p.variant || '3x2';
      return `[grid ${v}]`;
    }

    case 'list': {
      const count = typeof p.value === 'number' && p.value > 0 ? p.value : 5;
      return `[list ${count}]`;
    }

    case 'blockquote':
      return '[quote]';

    case 'code_block': {
      const code = primaryLabel || 'npm install';
      return `[code "${escapeNotation(code)}"]`;
    }

    case 'stat_kpi': {
      const kpi = primaryLabel || '1.2k';
      return `[kpi "${escapeNotation(kpi)}"]`;
    }

    case 'image_frame': {
      const alt = p.altText || primaryLabel || 'hero-banner';
      return `[img "${escapeNotation(alt)}"]`;
    }

    case 'video_frame': {
      const src = primaryLabel || 'intro.mp4';
      return `[video "${escapeNotation(src)}"]`;
    }

    case 'avatar':
      return '[avatar]';

    case 'avatar_group':
      return '[avatar_group]';

    case 'thumbnail_strip':
      return '[thumbnails]';

    case 'icon': {
      const name = p.iconName || primaryLabel || 'settings';
      return `[icon "${escapeNotation(name)}"]`;
    }

    case 'divider':
      return '[divider]';

    case 'spacer':
      return '[spacer]';

    case 'progress_bar': {
      const val = typeof p.value === 'number' ? p.value : 60;
      return `[progress ${val}]`;
    }

    case 'skeleton':
      return '[skeleton]';

    case 'tooltip': {
      const txt = primaryLabel || 'Help text';
      return `[tooltip "${escapeNotation(txt)}"]`;
    }

    case 'toast': {
      const txt = primaryLabel || 'Saved!';
      return `[toast "${escapeNotation(txt)}"]`;
    }

    case 'empty_state': {
      const txt = primaryLabel || 'No items';
      return `[empty "${escapeNotation(txt)}"]`;
    }

    case 'banner': {
      const txt = primaryLabel || 'Heads up';
      const v = p.variant || 'warn';
      return `[banner "${escapeNotation(txt)}" ${v}]`;
    }

    case 'data_table': {
      const v = p.variant || '4x3';
      return `[table ${v}]`;
    }

    default:
      return type ? `[${type}]` : '[unknown]';
  }
}

export const DYNAMIC_LEGEND_MARKDOWN = `## MarkDraw Semantic Legend
_Text shown as \`───\` lines on canvas; actual text preserved here._

| Notation | Meaning | Example |
| :--- | :--- | :--- |
| \`[btn "Text" variant]\` | Button (variants: solid, ghost) | \`[btn "Send" ghost]\` |
| \`[header "Title" h1]\` | Heading (levels: h1, h2, h3) | \`[header "About Us" h1]\` |
| \`[para]\` | Body paragraph (line glyph on canvas) | \`[para]\` |
| \`[input "Placeholder"]\` | Text / form input field | \`[input "Email..."]\` |
| \`[search "Query"]\` | Search input | \`[search "Search..."]\` |
| \`[check "Label" on/off]\` | Checkbox with state | \`[check "Remember me" on]\` |
| \`[radio "Label" on/off]\` | Radio button with state | \`[radio "Option" off]\` |
| \`[toggle on/off]\` | Switch toggle with state | \`[toggle on]\` |
| \`[select "A\\|B\\|C"]\` | Select dropdown with choices | \`[select "Option 1\\|Option 2"]\` |
| \`[slider N]\` / \`[progress N]\` | Range slider or progress bar | \`[slider 50]\`, \`[progress 60]\` |
| \`[nav "A, B, C"]\` | Navigation bar items | \`[nav "Home, About, Docs"]\` |
| \`[tabs "A\\|B\\|C"]\` | Tab navigation group | \`[tabs "Overview\\|Specs"]\` |
| \`[crumb "Path"]\` | Breadcrumb navigation | \`[crumb "Home / Docs / API"]\` |
| \`[steps 1-4 "Name"]\` | Multi-step progress flow | \`[steps 1-4 "Shipping"]\` |
| \`[pag 1/5]\` | Pagination indicator | \`[pag 1/5]\` |
| \`[section "Title"]\` | Page structural band | \`[section "Portfolio"]\` |
| \`[card "Title" variant]\` | Content card container | \`[card "Profile" elevated]\` |
| \`[hero]\` / \`[modal "Title"]\` | Hero banner or dialog modal | \`[hero]\`, \`[modal "Confirm"]\` |
| \`[split]\` / \`[grid 3x2]\` | Split-pane or grid container | \`[split]\`, \`[grid 3x2]\` |
| \`[table 4x3]\` | Data table rows x cols | \`[table 4x3]\` |
| \`[list N]\` | Vertical list of items | \`[list 5]\` |
| \`[img "Alt"]\` / \`[video "File"]\` | Media placeholders with ✕ cross | \`[img "hero-banner"]\` |
| \`[icon "Name"]\` / \`[avatar]\` | Icons or avatar placeholders | \`[icon "settings"]\`, \`[avatar]\` |
| \`[divider]\` / \`[spacer]\` | Visual separator or layout spacer | \`[divider]\` |
| \`[toast "Text"]\` / \`[banner]\` | Feedback toast or warning banner | \`[toast "Saved!"]\` |
| \`[code "Cmd"]\` / \`[kpi "1.2k"]\` | Monospaced code block or KPI stat | \`[code "npm install"]\` |
| \`[unknown]\` | Fallback / unmapped widget | \`[unknown]\` |`;
