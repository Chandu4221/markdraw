import { IRNode } from './ir';
import { isUntouchedLabel, getCatalogDefaultProps } from './widgets/widgetCatalog';

function escapeNotation(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function getEffectiveLabel(type: string, label?: string): string {
  if (isUntouchedLabel(type, label)) {
    return '';
  }
  return label || '';
}

function getEffectiveProp(type: string, key: string, val?: any): any {
  if (val === undefined || val === null || val === '') return '';
  const defaults = getCatalogDefaultProps(type);
  if (defaults[key] !== undefined && defaults[key] === val) {
    return '';
  }
  return val;
}

/**
 * Formats an IRNode into MarkDraw v2.7 bracket-tag semantic notation.
 * e.g. [btn "Send"], [card "Profile" elevated], [para], [input "Email..."]
 * When label/content is untouched default, emits bare tag e.g. [btn], [card], [img]
 */
export function formatSemanticNotation(node: IRNode): string {
  const type = node.widgetType;
  const p = node.textProps || {};
  const primaryLabel = getEffectiveLabel(type, p.label || node.label);

  switch (type) {
    case 'button': {
      const txt = primaryLabel;
      const v = getEffectiveProp('button', 'variant', p.variant);
      const varSuffix = v && v !== 'solid' && v !== 'default' ? ` ${v}` : '';
      return txt ? `[btn "${escapeNotation(txt)}"${varSuffix}]` : `[btn${varSuffix}]`;
    }

    case 'heading': {
      const v = p.variant;
      const varSuffix = v && v !== 'default' ? ` ${v}` : '';
      return primaryLabel
        ? `[header "${escapeNotation(primaryLabel)}"${varSuffix}]`
        : varSuffix
          ? `[header${varSuffix}]`
          : '[header]';
    }

    case 'paragraph':
      return '[para]';

    case 'input': {
      const placeholder =
        getEffectiveProp('input', 'placeholder', p.placeholder) || primaryLabel;
      return placeholder ? `[input "${escapeNotation(placeholder)}"]` : '[input]';
    }

    case 'search': {
      const placeholder =
        getEffectiveProp('search', 'placeholder', p.placeholder) || primaryLabel;
      return placeholder ? `[search "${escapeNotation(placeholder)}"]` : '[search]';
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
      const opts =
        getEffectiveProp('select', 'options', p.options) ||
        getEffectiveProp('select', 'placeholder', p.placeholder);
      return opts ? `[select "${escapeNotation(opts)}"]` : '[select]';
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
      const v = p.variant || primaryLabel;
      return v ? `[color "${escapeNotation(v)}"]` : '[color]';
    }

    case 'checkbox': {
      const txt = primaryLabel;
      const flag = p.checked ? 'on' : 'off';
      return txt ? `[check "${escapeNotation(txt)}" ${flag}]` : `[check ${flag}]`;
    }

    case 'radio': {
      const txt = primaryLabel;
      const flag = p.checked ? 'on' : 'off';
      return txt ? `[radio "${escapeNotation(txt)}" ${flag}]` : `[radio ${flag}]`;
    }

    case 'toggle': {
      const flag = p.checked ? 'on' : 'off';
      return `[toggle ${flag}]`;
    }

    case 'navbar':
    case 'menubar': {
      const items =
        getEffectiveProp(type, 'options', p.options) || primaryLabel;
      return items ? `[nav "${escapeNotation(items)}"]` : '[navbar]';
    }

    case 'sidebar': {
      const items =
        getEffectiveProp('sidebar', 'options', p.options) || primaryLabel;
      return items ? `[sidebar "${escapeNotation(items)}"]` : '[sidebar]';
    }

    case 'footer_nav': {
      const items =
        getEffectiveProp('footer_nav', 'options', p.options) || primaryLabel;
      return items ? `[footer_nav "${escapeNotation(items)}"]` : '[footer_nav]';
    }

    case 'link': {
      const txt = primaryLabel;
      return txt ? `[link "${escapeNotation(txt)}"]` : '[link]';
    }

    case 'chip': {
      const txt = primaryLabel;
      return txt ? `[chip "${escapeNotation(txt)}"]` : '[chip]';
    }

    case 'badge': {
      const txt = primaryLabel;
      return txt ? `[badge "${escapeNotation(txt)}"]` : '[badge]';
    }

    case 'tabs': {
      const opts = getEffectiveProp('tabs', 'options', p.options);
      return opts ? `[tabs "${escapeNotation(opts)}"]` : '[tabs]';
    }

    case 'breadcrumbs': {
      const pathStr =
        getEffectiveProp('breadcrumbs', 'options', p.options) || primaryLabel;
      return pathStr ? `[crumb "${escapeNotation(pathStr)}"]` : '[crumb]';
    }

    case 'steps': {
      const range = p.variant || '1-4';
      const txt = primaryLabel;
      return txt ? `[steps ${range} "${escapeNotation(txt)}"]` : `[steps ${range}]`;
    }

    case 'pagination': {
      const val = p.variant || '1/5';
      return `[pag ${val}]`;
    }

    case 'page': {
      const txt = primaryLabel;
      const v = p.variant;
      const varSuffix = v && v !== 'default' ? ` ${v}` : '';
      return txt ? `[page "${escapeNotation(txt)}"${varSuffix}]` : (varSuffix ? `[page${varSuffix}]` : '[page]');
    }

    case 'section': {
      const txt = primaryLabel;
      return txt ? `[section "${escapeNotation(txt)}"]` : '[section]';
    }

    case 'header': {
      const txt = primaryLabel;
      return txt ? `[header "${escapeNotation(txt)}"]` : '[header]';
    }

    case 'footer': {
      const txt = primaryLabel;
      return txt ? `[footer "${escapeNotation(txt)}"]` : '[footer]';
    }

    case 'card': {
      const txt = primaryLabel;
      const v = p.variant;
      const varSuffix = v && v !== 'default' && v !== 'outline' && v !== 'solid' ? ` ${v}` : '';
      return txt ? `[card "${escapeNotation(txt)}"${varSuffix}]` : (varSuffix ? `[card${varSuffix}]` : '[card]');
    }

    case 'hero': {
      const txt = primaryLabel;
      return txt ? `[hero "${escapeNotation(txt)}"]` : '[hero]';
    }

    case 'modal': {
      const txt = primaryLabel;
      return txt ? `[modal "${escapeNotation(txt)}"]` : '[modal]';
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
      const code = primaryLabel;
      return code ? `[code "${escapeNotation(code)}"]` : '[code]';
    }

    case 'stat_kpi': {
      const kpi = primaryLabel;
      return kpi ? `[kpi "${escapeNotation(kpi)}"]` : '[kpi]';
    }

    case 'image_frame': {
      const alt =
        getEffectiveProp('image_frame', 'altText', p.altText) || primaryLabel;
      return alt ? `[img "${escapeNotation(alt)}"]` : '[img]';
    }

    case 'video_frame': {
      const src = primaryLabel;
      return src ? `[video "${escapeNotation(src)}"]` : '[video]';
    }

    case 'avatar':
      return '[avatar]';

    case 'avatar_group':
      return '[avatar_group]';

    case 'thumbnail_strip':
      return '[thumbnails]';

    case 'icon': {
      const name =
        getEffectiveProp('icon', 'iconName', p.iconName) || primaryLabel;
      return name ? `[icon "${escapeNotation(name)}"]` : '[icon]';
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
      const txt = primaryLabel;
      return txt ? `[tooltip "${escapeNotation(txt)}"]` : '[tooltip]';
    }

    case 'toast': {
      const txt = primaryLabel;
      return txt ? `[toast "${escapeNotation(txt)}"]` : '[toast]';
    }

    case 'empty_state': {
      const txt = primaryLabel;
      return txt ? `[empty "${escapeNotation(txt)}"]` : '[empty]';
    }

    case 'banner': {
      const txt = primaryLabel;
      const v = p.variant || 'warn';
      return txt ? `[banner "${escapeNotation(txt)}" ${v}]` : `[banner ${v}]`;
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
**MarkDraw v2.7 — Semantic Layout**
_Text shown as \`───\` lines on canvas; actual text preserved here._
_bare tags (e.g. [btn]) mean the user left the content unspecified — generate appropriate content._
_Placement: header/body/footer = position band within the page; nested = inside another container._
_N × [pattern] = N visually repeated sibling groups; treat as list/grid items with per-item content variation._

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

