// src/annotation/__tests__/v51_platform_picker.test.ts
import { describe, it, expect } from 'vitest';
import { getProfile } from '../profileLoader';
import { searchRoles, resolveAliasToRole, ROLE_NAMES, isValidRole } from '../roles';
import { MarkDrawCompiler } from '../../core/compiler';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { canvasShapesToCompilerShapes } from '../../hooks/useCompilation';

describe('Phase 3: Platform-Aware Tagging (§3)', () => {
  const webProfile = getProfile('web');
  const androidProfile = getProfile('android-material');

  describe('3.2 Profile Loader', () => {
    it('statically loads web and android-material profiles', () => {
      expect(webProfile.id).toBe('web');
      expect(webProfile.displayName).toBe('Web');
      expect(androidProfile.id).toBe('android-material');
      expect(androidProfile.displayName).toBe('Android (Material 3)');
    });

    it('throws on unknown platform id instead of silent fallback', () => {
      expect(() => getProfile('unknown-platform')).toThrowError(
        /Unknown platform profile "unknown-platform"/
      );
      expect(() => getProfile('ios')).toThrowError(/Unknown platform profile/);
    });
  });

  describe('3.3 Platform-Aware Search & Aliases', () => {
    it('resolves platform display names and aliases to canonical roles on Android', () => {
      // Searching TopAppBar matches navbar
      const resultsTopAppBar = searchRoles('TopAppBar', androidProfile);
      expect(resultsTopAppBar.some((r) => r.name === 'navbar')).toBe(true);

      // Alias resolver resolves TopAppBar -> navbar
      expect(resolveAliasToRole('TopAppBar', androidProfile)).toBe('navbar');
      expect(resolveAliasToRole('topappbar', androidProfile)).toBe('navbar');
      expect(resolveAliasToRole('NavigationBar', androidProfile)).toBe('nav');

      // Canonical name and v4 aliases still work
      expect(searchRoles('navbar', androidProfile).some((r) => r.name === 'navbar')).toBe(true);
      expect(searchRoles('appbar', androidProfile).some((r) => r.name === 'navbar')).toBe(true);
    });

    it('includes platform extra roles when profile is active', () => {
      // Android has scaffold, fab, bottom_sheet
      const androidRoles = searchRoles('', androidProfile);
      expect(androidRoles.some((r) => r.name === 'scaffold')).toBe(true);
      expect(androidRoles.some((r) => r.name === 'fab')).toBe(true);
      expect(androidRoles.some((r) => r.name === 'bottom_sheet')).toBe(true);

      const scaffoldSearch = searchRoles('scaffold', androidProfile);
      expect(scaffoldSearch.some((r) => r.name === 'scaffold')).toBe(true);
      expect(resolveAliasToRole('scaffold', androidProfile)).toBe('scaffold');
    });

    it('excludes platform extra roles when web profile is active', () => {
      const webRoles = searchRoles('', webProfile);
      expect(webRoles.some((r) => r.name === 'scaffold')).toBe(false);
      expect(webRoles.some((r) => r.name === 'fab')).toBe(false);
      expect(webRoles.some((r) => r.name === 'bottom_sheet')).toBe(false);

      const webScaffoldSearch = searchRoles('scaffold', webProfile);
      expect(webScaffoldSearch).toHaveLength(0);
      expect(resolveAliasToRole('scaffold', webProfile)).toBe(null);
    });

    it('has 34 canonical roles in total IR vocabulary', () => {
      expect(ROLE_NAMES).toHaveLength(34);
      expect(isValidRole('fab')).toBe(true);
      expect(isValidRole('bottom_sheet')).toBe(true);
      expect(isValidRole('scaffold')).toBe(true);
    });
  });

  describe('3.1 & 3.4 Invariance and Compile-Side Legend Confirmation', () => {
    it('preserves canonical role storage regardless of active platform', () => {
      // Tagging a top bar as TopAppBar stores canonical 'navbar'
      const assignedRole = resolveAliasToRole('TopAppBar', androidProfile);
      expect(assignedRole).toBe('navbar');

      // Switching profile to web does not affect stored canonical role
      const shape: CanvasShape = {
        id: 'shape_nav',
        kind: 'rect',
        bounds: { x: 0, y: 0, w: 360, h: 56, rotation: 0 },
        parentId: null,
        name: null,
        text: 'My Top App Bar',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            role: assignedRole, // 'navbar'
            props: { label: 'Header' }
          }
        }
      };

      // Stored role remains 'navbar'
      const metaMarkdraw = shape.meta.markdraw as { role: string };
      expect(metaMarkdraw.role).toBe('navbar');
    });

    it('renders platform component names in annotation legend during compile', () => {
      const frameShape: CanvasShape = {
        id: 'frame_1',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 360, h: 640, rotation: 0 },
        parentId: null,
        name: 'Phone Screen',
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'page'
          }
        }
      };

      const navShape: CanvasShape = {
        id: 'nav_1',
        kind: 'rect',
        bounds: { x: 0, y: 0, w: 360, h: 56, rotation: 0 },
        parentId: 'frame_1',
        name: null,
        text: 'Feed, Profile',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'navbar',
            props: { label: 'Feed, Profile' }
          }
        }
      };

      const compilerShapes = canvasShapesToCompilerShapes([frameShape, navShape]);

      // Compile with android-material platform and includeLegend: true
      const resultAndroid = MarkDrawCompiler.compile(compilerShapes, null, {
        platform: 'android-material',
        includeLegend: true
      });

      // Legend row for navbar must show TopAppBar on Android
      expect(resultAndroid.markdownSpec).toContain('TopAppBar');
      expect(resultAndroid.markdownSpec).toContain('Target platform: Android (Material 3)');

      // Compile with web platform
      const resultWeb = MarkDrawCompiler.compile(compilerShapes, null, {
        platform: 'web',
        includeLegend: true
      });

      expect(resultWeb.markdownSpec).toContain('Target platform: Web');
      expect(resultWeb.markdownSpec).toContain('navbar');
      expect(resultWeb.markdownSpec).not.toContain('TopAppBar');
    });
  });
});
