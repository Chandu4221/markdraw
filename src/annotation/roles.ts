// src/annotation/roles.ts
import { PlatformProfile } from './profiles/types';

export const ROLE_NAMES = Object.freeze([
  'page',
  'section',
  'card',
  'navbar',
  'sidebar',
  'footer',
  'heading',
  'para',
  'img',
  'video',
  'button',
  'input',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'stepper',
  'table',
  'tabs',
  'avatar',
  'badge',
  'banner',
  'dialog',
  'separator',
  'carousel',
  'stat',
  'steps',
  'nav',
  'group',
  'fab',
  'bottom_sheet',
  'scaffold'
] as const);

export type RoleName = (typeof ROLE_NAMES)[number];
export const ALL_ROLES = ROLE_NAMES;

export type RoleCategory =
  | 'structure'
  | 'content'
  | 'interaction'
  | 'navigation'
  | 'feedback'
  | 'utility'
  | 'platform';

export interface RoleDefinition {
  name: RoleName;
  aliases: string[];
  decisionRule: string;
  category: RoleCategory;
  flags: string[];
}

export const ROLE_DEFINITIONS: Record<RoleName, RoleDefinition> = Object.freeze({
  page: {
    name: 'page',
    aliases: ['screen', 'artboard'],
    decisionRule: 'top-level viewport; one per root frame',
    category: 'structure',
    flags: ['responsive']
  },
  section: {
    name: 'section',
    aliases: ['container', 'band', 'block', 'content'],
    decisionRule: 'page band dividing the artifact vertically',
    category: 'structure',
    flags: ['sticky', 'parallax']
  },
  card: {
    name: 'card',
    aliases: ['tile', 'item', 'post', 'article', 'content-box'],
    decisionRule: 'repeatable content unit',
    category: 'structure',
    flags: ['floating', 'expandable']
  },
  navbar: {
    name: 'navbar',
    aliases: ['appbar', 'topbar', 'navigation menu'],
    decisionRule: 'primary navigation band',
    category: 'navigation',
    flags: ['sticky', 'floating', 'overlay', 'fixed']
  },
  sidebar: {
    name: 'sidebar',
    aliases: ['drawer-rail', 'side panel'],
    decisionRule: 'secondary side navigation',
    category: 'navigation',
    flags: ['sticky', 'collapse:drawer']
  },
  footer: {
    name: 'footer',
    aliases: ['page-footer'],
    decisionRule: 'bottom band',
    category: 'structure',
    flags: ['sticky', 'fixed']
  },
  heading: {
    name: 'heading',
    aliases: ['h1–h6', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title', 'headline', 'header-text'],
    decisionRule: 'text heading ONLY — never a band',
    category: 'content',
    flags: []
  },
  para: {
    name: 'para',
    aliases: ['paragraph', 'body', 'text block'],
    decisionRule: 'body text',
    category: 'content',
    flags: []
  },
  img: {
    name: 'img',
    aliases: ['picture', 'image', 'image_frame', 'thumbnail', 'media'],
    decisionRule: 'static media',
    category: 'content',
    flags: ['parallax']
  },
  video: {
    name: 'video',
    aliases: ['player', 'video_frame'],
    decisionRule: 'motion media',
    category: 'content',
    flags: ['autoplay']
  },
  button: {
    name: 'button',
    aliases: ['btn', 'cta'],
    decisionRule: 'actionable control',
    category: 'interaction',
    flags: ['fixed']
  },
  input: {
    name: 'input',
    aliases: ['field', 'text field', 'form field'],
    decisionRule: 'single-line entry (variants: password, file, date)',
    category: 'interaction',
    flags: []
  },
  textarea: {
    name: 'textarea',
    aliases: ['multiline'],
    decisionRule: 'multi-line entry',
    category: 'interaction',
    flags: []
  },
  select: {
    name: 'select',
    aliases: ['dropdown', 'picker'],
    decisionRule: 'choice from list',
    category: 'interaction',
    flags: []
  },
  checkbox: {
    name: 'checkbox',
    aliases: ['check'],
    decisionRule: 'boolean control',
    category: 'interaction',
    flags: []
  },
  radio: {
    name: 'radio',
    aliases: ['option'],
    decisionRule: 'single choice from set',
    category: 'interaction',
    flags: []
  },
  switch: {
    name: 'switch',
    aliases: ['toggle'],
    decisionRule: 'on/off control',
    category: 'interaction',
    flags: []
  },
  slider: {
    name: 'slider',
    aliases: ['range'],
    decisionRule: 'ranged control',
    category: 'interaction',
    flags: []
  },
  stepper: {
    name: 'stepper',
    aliases: ['number input'],
    decisionRule: '+/- numeric control',
    category: 'interaction',
    flags: []
  },
  table: {
    name: 'table',
    aliases: ['data_table', 'grid'],
    decisionRule: 'tabular data',
    category: 'content',
    flags: []
  },
  tabs: {
    name: 'tabs',
    aliases: ['tab bar'],
    decisionRule: 'sibling view switcher',
    category: 'navigation',
    flags: ['scroll-snap']
  },
  avatar: {
    name: 'avatar',
    aliases: ['profile pic', 'user image'],
    decisionRule: 'person image',
    category: 'content',
    flags: []
  },
  badge: {
    name: 'badge',
    aliases: ['chip', 'tag', 'pill', 'label'],
    decisionRule: 'small status label',
    category: 'feedback',
    flags: []
  },
  banner: {
    name: 'banner',
    aliases: ['alert', 'callout', 'notice'],
    decisionRule: 'inline message strip (never alert)',
    category: 'feedback',
    flags: ['overlay', 'dismissible']
  },
  dialog: {
    name: 'dialog',
    aliases: ['modal', 'popup', 'overlay', 'lightbox'],
    decisionRule: 'floating overlay panel',
    category: 'feedback',
    flags: ['fullscreen', 'draggable']
  },
  separator: {
    name: 'separator',
    aliases: ['divider', 'hr', 'rule'],
    decisionRule: 'structural line',
    category: 'structure',
    flags: []
  },
  carousel: {
    name: 'carousel',
    aliases: ['slider-gallery', 'stories'],
    decisionRule: 'sliding group',
    category: 'content',
    flags: ['autoplay', 'scroll-snap', 'fullscreen']
  },
  stat: {
    name: 'stat',
    aliases: ['kpi', 'metric'],
    decisionRule: 'number + label unit',
    category: 'content',
    flags: []
  },
  steps: {
    name: 'steps',
    aliases: ['wizard'],
    decisionRule: 'sequential progress',
    category: 'navigation',
    flags: []
  },
  nav: {
    name: 'nav',
    aliases: ['link list', 'footer_nav'],
    decisionRule: 'generic link group',
    category: 'navigation',
    flags: []
  },
  group: {
    name: 'group',
    aliases: ['unit wrapper'],
    decisionRule: 'invisible semantic grouping, no visual box',
    category: 'utility',
    flags: []
  },
  fab: {
    name: 'fab',
    aliases: ['floating action button', 'action button'],
    decisionRule: 'floating action button for the primary screen action',
    category: 'platform',
    flags: ['extended']
  },
  bottom_sheet: {
    name: 'bottom_sheet',
    aliases: ['bottom sheet', 'modal sheet', 'sheet'],
    decisionRule: 'bottom-anchored modal sheet',
    category: 'platform',
    flags: ['modal', 'persistent']
  },
  scaffold: {
    name: 'scaffold',
    aliases: ['app scaffold', 'screen scaffold'],
    decisionRule: 'app-level layout skeleton wrapping the page',
    category: 'platform',
    flags: []
  }
});

export const ROLE_LIST: readonly RoleDefinition[] = Object.freeze(
  ROLE_NAMES.map((name) => ROLE_DEFINITIONS[name])
);

export function isValidRole(role: string): role is RoleName {
  return (ROLE_NAMES as readonly string[]).includes(role);
}

export function resolveAliasToRole(query: string, profile?: PlatformProfile): RoleName | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  if (isValidRole(clean)) {
    const def = ROLE_DEFINITIONS[clean];
    if (def.category === 'platform' && !profile?.extraRoles?.[clean]) {
      return null;
    }
    return clean;
  }

  if (profile?.roleAliases) {
    for (const [canonicalRole, alias] of Object.entries(profile.roleAliases)) {
      if (
        alias.toLowerCase() === clean ||
        alias.toLowerCase().replace(/\s+/g, '') === clean.replace(/\s+/g, '')
      ) {
        if (isValidRole(canonicalRole)) return canonicalRole;
      }
    }
  }

  for (const def of ROLE_LIST) {
    if (def.category === 'platform' && !profile?.extraRoles?.[def.name]) {
      continue;
    }
    if (def.name.toLowerCase() === clean) return def.name;
    if (def.aliases.some((a) => a.toLowerCase() === clean)) {
      return def.name;
    }
  }
  return null;
}

export function searchRoles(query: string, profile?: PlatformProfile): RoleDefinition[] {
  const clean = query.trim().toLowerCase();
  const cleanCompact = clean.replace(/\s+/g, '');

  return ROLE_LIST.filter((def) => {
    if (def.category === 'platform') {
      if (!profile?.extraRoles?.[def.name]) {
        return false;
      }
    }

    if (!clean) return true;

    if (def.name.toLowerCase().includes(clean)) return true;
    if (def.aliases.some((a) => a.toLowerCase().includes(clean))) return true;
    if (def.decisionRule.toLowerCase().includes(clean)) return true;

    const platAlias = profile?.roleAliases?.[def.name];
    if (platAlias) {
      if (
        platAlias.toLowerCase().includes(clean) ||
        platAlias.toLowerCase().replace(/\s+/g, '').includes(cleanCompact)
      ) {
        return true;
      }
    }

    const extra = profile?.extraRoles?.[def.name];
    if (extra) {
      if (extra.name.toLowerCase().includes(clean)) return true;
      if (extra.description.toLowerCase().includes(clean)) return true;
    }

    return false;
  });
}

export function isAllowedRoleFlag(role: string, flag: string): boolean {
  if (!isValidRole(role)) return false;
  return ROLE_DEFINITIONS[role].flags.includes(flag);
}
