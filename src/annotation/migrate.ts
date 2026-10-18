// src/annotation/migrate.ts
import { TLShape, createShapeId } from '@tldraw/tldraw';
import { ROLE_DEFINITIONS, RoleName } from './roles';
import { MarkDrawMeta, ROLE_SCHEMA_VERSION, RoleProps } from './types';

export interface MigrationRule {
  targetRole: RoleName;
  variant?: string;
}

/**
 * Exact v3 widget -> v4 role mapping table defined in §12.
 */
export const V3_WIDGET_TO_V4_ROLE_MAP: Record<string, MigrationRule> = Object.freeze({
  // Structure
  page: { targetRole: 'page' },
  section: { targetRole: 'section' },
  card: { targetRole: 'card' },
  navbar: { targetRole: 'navbar' },
  sidebar: { targetRole: 'sidebar' },
  footer: { targetRole: 'footer' },
  header: { targetRole: 'heading' },
  menubar: { targetRole: 'navbar' },
  footer_nav: { targetRole: 'nav' },
  nav: { targetRole: 'nav' },
  hero: { targetRole: 'section', variant: 'hero' },
  split_pane: { targetRole: 'section', variant: 'split' },
  grid_gallery: { targetRole: 'section', variant: 'grid' },
  modal: { targetRole: 'dialog' },
  carousel: { targetRole: 'carousel' },
  steps: { targetRole: 'steps' },
  tabs: { targetRole: 'tabs' },

  // Content
  heading: { targetRole: 'heading' },
  para: { targetRole: 'para' },
  text: { targetRole: 'para' },
  label: { targetRole: 'para' },
  image_frame: { targetRole: 'img' },
  img: { targetRole: 'img' },
  thumbnail_strip: { targetRole: 'img', variant: 'strip' },
  video_frame: { targetRole: 'video' },
  avatar: { targetRole: 'avatar' },
  avatar_group: { targetRole: 'avatar' },
  icon: { targetRole: 'badge', variant: 'icon' },

  // Feedback & Utility
  stat_kpi: { targetRole: 'stat' },
  kpi: { targetRole: 'stat' },
  badge: { targetRole: 'badge' },
  banner: { targetRole: 'banner' },
  button: { targetRole: 'button' },
  input: { targetRole: 'input' },
  search: { targetRole: 'input', variant: 'search' },
  password: { targetRole: 'input', variant: 'password' },
  textarea: { targetRole: 'textarea' },
  select: { targetRole: 'select' },
  checkbox: { targetRole: 'checkbox' },
  radio: { targetRole: 'radio' },
  toggle: { targetRole: 'switch' },
  slider: { targetRole: 'slider' },
  stepper: { targetRole: 'stepper' },
  file_upload: { targetRole: 'input', variant: 'file' },
  date_picker: { targetRole: 'input', variant: 'date' },
  color_swatch: { targetRole: 'badge', variant: 'swatch' },
  table: { targetRole: 'table' },
  data_table: { targetRole: 'table' },
  divider: { targetRole: 'separator' },
  spacer: { targetRole: 'group' },
  progress: { targetRole: 'stat', variant: 'progress' }
});

export interface MigrationResult {
  shapes: TLShape[];
  lints: string[];
  docVersion: number;
}

/**
 * Checks whether a shape is a legacy v3 widget needing migration.
 */
export function isV3Widget(shape: TLShape): boolean {
  if (shape.type === 'ui-widget') return true;
  const props = shape.props as Record<string, unknown> | undefined;
  if (props && typeof props.widgetType === 'string') return true;
  return false;
}

/**
 * Migrates a list of shapes from v3 widget representation to v4 semantic annotation layer (§12).
 */
export function migrateShapes(shapes: TLShape[]): MigrationResult {
  const lints: string[] = [];
  const migratedShapes: TLShape[] = [];

  for (const shape of shapes) {
    if (!isV3Widget(shape)) {
      migratedShapes.push(shape);
      continue;
    }

    const rawProps = (shape.props || {}) as Record<string, unknown>;
    const widgetType = typeof rawProps.widgetType === 'string' ? rawProps.widgetType : 'card';
    const rule = V3_WIDGET_TO_V4_ROLE_MAP[widgetType] || { targetRole: 'card' as RoleName };
    const targetRole = rule.targetRole;
    const roleDef = ROLE_DEFINITIONS[targetRole];
    const allowedFlags = new Set(roleDef ? roleDef.flags : []);

    // 1. Label extraction
    const label =
      (typeof rawProps.label === 'string' && rawProps.label.trim()) ||
      (typeof rawProps.text === 'string' && rawProps.text.trim()) ||
      (typeof rawProps.name === 'string' && rawProps.name.trim()) ||
      undefined;

    // 2. Flags / Behaviors validation
    const incomingFlags = Array.isArray(rawProps.behaviors)
      ? (rawProps.behaviors as string[])
      : Array.isArray(rawProps.flags)
      ? (rawProps.flags as string[])
      : [];

    const validBehaviors: string[] = [];
    for (const flag of incomingFlags) {
      if (allowedFlags.has(flag)) {
        validBehaviors.push(flag);
      } else {
        lints.push(`Flag "${flag}" has no meaning for role "${targetRole}" — dropped.`);
      }
    }

    // 3. Assemble RoleProps
    const props: RoleProps = {};
    if (label) props.label = label;
    if (rule.variant) {
      props.variant = rule.variant;
    } else if (typeof rawProps.variant === 'string') {
      props.variant = rawProps.variant;
    }
    if (typeof rawProps.placeholder === 'string') props.placeholder = rawProps.placeholder;
    if (typeof rawProps.options === 'string') props.options = rawProps.options;
    if (typeof rawProps.count === 'number') props.count = rawProps.count;
    if (typeof rawProps.note === 'string') props.note = rawProps.note;
    if (validBehaviors.length > 0) props.behaviors = validBehaviors;

    // 4. Build meta.markdraw
    const parentId =
      typeof rawProps.parentId === 'string'
        ? rawProps.parentId
        : shape.parentId && shape.parentId.startsWith('shape:')
        ? (shape.parentId as string)
        : null;

    const markdrawMeta: MarkDrawMeta = {
      schema: ROLE_SCHEMA_VERSION,
      role: targetRole,
      unitId: null,
      parentId,
      responsive: null,
      props
    };

    // 5. Convert shape to native representation
    const w = (typeof rawProps.w === 'number' && rawProps.w) || 100;
    const h = (typeof rawProps.h === 'number' && rawProps.h) || 50;

    let targetType = shape.type;
    let targetShapeProps: Record<string, unknown> = { ...rawProps };

    if (shape.type === 'ui-widget') {
      if (targetRole === 'page') {
        targetType = 'frame';
        targetShapeProps = {
          w,
          h,
          name: label || 'Page'
        };
      } else if (targetRole === 'group') {
        targetType = 'group';
        targetShapeProps = {};
      } else {
        targetType = 'geo';
        targetShapeProps = {
          geo: 'rectangle',
          w,
          h,
          text: label || ''
        };
      }
    }

    const id = shape.id || createShapeId();

    const migratedShape: TLShape = {
      ...shape,
      id,
      type: targetType as any,
      props: targetShapeProps as any,
      meta: {
        ...(shape.meta || {}),
        markdraw: markdrawMeta
      }
    } as TLShape;

    migratedShapes.push(migratedShape);
  }

  return {
    shapes: migratedShapes,
    lints,
    docVersion: 4
  };
}

/**
 * Creates a backup of a document before migration in local storage.
 */
export function backupDocumentBeforeMigration(
  docId: string,
  rawContent: unknown,
  storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null
): void {
  if (!storage) return;
  try {
    const backupKey = `markdraw_backup_v3_${docId}`;
    storage.setItem(backupKey, JSON.stringify(rawContent));
  } catch (e) {
    console.warn('[MarkDraw] Failed to create v3 document backup:', e);
  }
}
