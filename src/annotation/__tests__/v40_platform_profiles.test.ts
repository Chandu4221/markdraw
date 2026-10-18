import { describe, it, expect } from 'vitest';
import { TLShape, createShapeId } from '../../core/types';
import { MarkDrawCompiler } from '../../core/compiler';
import { getPlatformProfile } from '../profiles';

describe('MarkDraw v4 Platform Profiles (§10, §8.2, §8.3)', () => {
  it('loads Web profile as default identity profile', () => {
    const profile = getPlatformProfile('web');
    expect(profile.id).toBe('web');
    expect(profile.displayName).toBe('Web');
    expect(profile.directiveLines).toEqual([
      'Use semantic HTML and a utility-first CSS approach.',
      'Prefer responsive utility classes over custom media queries.'
    ]);
    expect(profile.roleAliases).toEqual({});
  });

  it('loads Android Material profile with exact aliases and extra roles', () => {
    const profile = getPlatformProfile('android-material');
    expect(profile.id).toBe('android-material');
    expect(profile.displayName).toBe('Android (Material 3)');
    expect(profile.roleAliases).toEqual({
      navbar: 'TopAppBar',
      nav: 'NavigationBar',
      banner: 'Snackbar (inline)',
      dialog: 'Dialog',
      switch: 'Switch'
    });
    expect(profile.extraRoles.fab).toBeDefined();
    expect(profile.extraRoles.fab.name).toBe('fab');
    expect(profile.extraRoles.bottom_sheet).toBeDefined();
    expect(profile.extraRoles.scaffold).toBeDefined();
  });

  it('emits Web platform directive line in markdownSpec', () => {
    const frameId = createShapeId('f1');
    const btnId = createShapeId('b1');

    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'Home', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const btn: TLShape = {
      id: btnId,
      type: 'geo',
      parentId: frameId,
      x: 10,
      y: 10,
      props: { geo: 'rectangle', text: 'Submit' },
      meta: { markdraw: { schema: 1, role: 'button', props: { label: 'Submit' } } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, btn], null, { platform: 'web' });
    expect(res.markdownSpec).toContain(
      '> Target platform: Web. Use semantic HTML and a utility-first CSS approach. Prefer responsive utility classes over custom media queries.'
    );
  });

  it('emits Android Material platform directive and aliases only touch legend display', () => {
    const frameId = createShapeId('f1');
    const navId = createShapeId('nav1');

    const frame: TLShape = {
      id: frameId,
      type: 'frame',
      x: 0,
      y: 0,
      props: { name: 'App Screen', w: 800, h: 600 },
      meta: { markdraw: { schema: 1, role: 'page' } }
    } as unknown as TLShape;

    const navbar: TLShape = {
      id: navId,
      type: 'geo',
      parentId: frameId,
      x: 0,
      y: 0,
      props: { geo: 'rectangle', w: 800, h: 56, text: 'Feed, Profile' },
      meta: { markdraw: { schema: 1, role: 'navbar', props: { label: 'Feed, Profile' } } }
    } as unknown as TLShape;

    const res = MarkDrawCompiler.compile([frame, navbar], null, {
      platform: 'android-material',
      includeLegend: true
    });

    // 1) Directive has Android Material
    expect(res.markdownSpec).toContain(
      '> Target platform: Android (Material 3). Use Material 3 components and a Scaffold-based layout structure. Prefer bottom navigation for top-level navigation on mobile.'
    );

    // 2) Legend Notation column displays the alias "TopAppBar" instead of "navbar"
    expect(res.markdownSpec).toContain('| [TopAppBar "A, B, C"] | Top navigation bar |');

    // 3) Spec table retains canonical [navbar ...] notation and <Navbar> semantics
    expect(res.markdownSpec).toContain('**[navbar "Feed, Profile"]**');
    expect(res.markdownSpec).toContain('<Navbar>');
  });
});
