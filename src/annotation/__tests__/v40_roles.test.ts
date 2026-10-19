// src/annotation/__tests__/v40_roles.test.ts
import { describe, it, expect } from 'vitest';
import {
  ROLE_NAMES,
  ROLE_DEFINITIONS,
  ROLE_LIST,
  isValidRole,
  resolveAliasToRole,
  searchRoles,
  isAllowedRoleFlag
} from '../roles';

describe('MarkDraw v4 Role Vocabulary (§4)', () => {
  it('has exactly 34 frozen canonical roles (31 standard + 3 platform roles)', () => {
    expect(ROLE_NAMES).toHaveLength(34);
    expect(Object.isFrozen(ROLE_NAMES)).toBe(true);
    expect(ROLE_LIST).toHaveLength(34);
    expect(Object.isFrozen(ROLE_DEFINITIONS)).toBe(true);
  });

  it('contains all core roles mandated by §4', () => {
    const required = [
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
      'group'
    ];

    for (const r of required) {
      expect(isValidRole(r)).toBe(true);
      expect(ROLE_DEFINITIONS[r as keyof typeof ROLE_DEFINITIONS]).toBeDefined();
      expect(ROLE_DEFINITIONS[r as keyof typeof ROLE_DEFINITIONS].decisionRule).toBeTruthy();
    }
  });

  it('resolves aliases correctly to canonical roles', () => {
    expect(resolveAliasToRole('popup')).toBe('dialog');
    expect(resolveAliasToRole('modal')).toBe('dialog');
    expect(resolveAliasToRole('cta')).toBe('button');
    expect(resolveAliasToRole('btn')).toBe('button');
    expect(resolveAliasToRole('screen')).toBe('page');
    expect(resolveAliasToRole('container')).toBe('section');
    expect(resolveAliasToRole('tile')).toBe('card');
    expect(resolveAliasToRole('appbar')).toBe('navbar');
    expect(resolveAliasToRole('toggle')).toBe('switch');
    expect(resolveAliasToRole('divider')).toBe('separator');
    expect(resolveAliasToRole('kpi')).toBe('stat');
    expect(resolveAliasToRole('field')).toBe('input');
    expect(resolveAliasToRole('picture')).toBe('img');
  });

  it('returns null for unknown aliases', () => {
    expect(resolveAliasToRole('nonexistent_widget_xyz')).toBe(null);
    expect(resolveAliasToRole('')).toBe(null);
  });

  it('searches roles by name, alias, and decision rule', () => {
    const dialogMatches = searchRoles('modal');
    expect(dialogMatches.some((r) => r.name === 'dialog')).toBe(true);

    const buttonMatches = searchRoles('actionable');
    expect(buttonMatches.some((r) => r.name === 'button')).toBe(true);

    const allMatches = searchRoles('');
    expect(allMatches).toHaveLength(31);
  });

  it('enforces flag allow-lists per role', () => {
    expect(isAllowedRoleFlag('page', 'responsive')).toBe(true);
    expect(isAllowedRoleFlag('page', 'sticky')).toBe(false);

    expect(isAllowedRoleFlag('navbar', 'sticky')).toBe(true);
    expect(isAllowedRoleFlag('navbar', 'floating')).toBe(true);
    expect(isAllowedRoleFlag('navbar', 'overlay')).toBe(true);
    expect(isAllowedRoleFlag('navbar', 'fixed')).toBe(true);
    expect(isAllowedRoleFlag('navbar', 'autoplay')).toBe(false);

    expect(isAllowedRoleFlag('carousel', 'autoplay')).toBe(true);
    expect(isAllowedRoleFlag('carousel', 'scroll-snap')).toBe(true);
    expect(isAllowedRoleFlag('carousel', 'fullscreen')).toBe(true);
    expect(isAllowedRoleFlag('carousel', 'sticky')).toBe(false);

    expect(isAllowedRoleFlag('heading', 'sticky')).toBe(false);
  });
});
