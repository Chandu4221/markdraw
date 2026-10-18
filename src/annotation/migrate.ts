// src/annotation/migrate.ts
import { TLShape, createShapeId } from '../core/types';
import { ROLE_DEFINITIONS, RoleName } from './roles';
import { MarkDrawMeta, ROLE_SCHEMA_VERSION, RoleProps, RoleResponsive } from './types';

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

  const helperBounds = (s: TLShape) => {
    const p = (s.props || {}) as Record<string, unknown>;
    return {
      x: s.x || 0,
      y: s.y || 0,
      w: (typeof p.w === 'number' && p.w) || 100,
      h: (typeof p.h === 'number' && p.h) || 50
    };
  };

  const promotedContainerIds = new Set<string>();
  for (const s of shapes) {
    const b = helperBounds(s);
    let count = 0;
    for (const other of shapes) {
      if (other.id === s.id) continue;
      const ob = helperBounds(other);
      if (b.w >= ob.w && b.h >= ob.h) {
        const ix1 = Math.max(b.x, ob.x);
        const iy1 = Math.max(b.y, ob.y);
        const ix2 = Math.min(b.x + b.w, ob.x + ob.w);
        const iy2 = Math.min(b.y + b.h, ob.y + ob.h);
        if (ix2 > ix1 && iy2 > iy1) {
          const intersect = (ix2 - ix1) * (iy2 - iy1);
          if (intersect / (ob.w * ob.h) >= 0.5) {
            count++;
          }
        }
      }
    }
    if (count >= 2) {
      promotedContainerIds.add(s.id);
    }
  }

  for (const shape of shapes) {
    if (!isV3Widget(shape)) {
      migratedShapes.push(shape);
      continue;
    }

    const rawProps = (shape.props || {}) as Record<string, unknown>;
    const widgetType = typeof rawProps.widgetType === 'string' ? rawProps.widgetType : 'card';
    const rule = V3_WIDGET_TO_V4_ROLE_MAP[widgetType] || { targetRole: 'card' as RoleName };
    let targetRole = rule.targetRole;
    if (promotedContainerIds.has(shape.id) && targetRole !== 'page' && targetRole !== 'section') {
      targetRole = 'card';
    }
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
    if (typeof rawProps.variant === 'string' && rawProps.variant !== 'default' && rawProps.variant !== 'solid') {
      props.variant = rawProps.variant;
    } else if (rule.variant) {
      props.variant = rule.variant;
    }
    if (typeof rawProps.placeholder === 'string') props.placeholder = rawProps.placeholder;
    if (typeof rawProps.options === 'string') props.options = rawProps.options;
    if (typeof rawProps.count === 'number') props.count = rawProps.count;
    if (typeof rawProps.note === 'string') props.note = rawProps.note;
    if (typeof rawProps.value === 'number') (props as any).value = rawProps.value;
    if (typeof rawProps.columns === 'number') (props as any).columns = rawProps.columns;
    if (typeof rawProps.columnSplit === 'string') (props as any).columnSplit = rawProps.columnSplit;
    if (typeof rawProps.isResponsive === 'boolean') (props as any).isResponsive = rawProps.isResponsive;
    if (typeof rawProps.mobileStack === 'string') (props as any).mobileStack = rawProps.mobileStack;
    if (typeof rawProps.tabletLayout === 'string') (props as any).tabletLayout = rawProps.tabletLayout;
    if (typeof rawProps.mobileOrder === 'number') (props as any).mobileOrder = rawProps.mobileOrder;
    if (typeof rawProps.hideOnMobile === 'boolean') (props as any).hideOnMobile = rawProps.hideOnMobile;
    if (validBehaviors.length > 0) props.behaviors = validBehaviors;

    // 4. Build meta.markdraw
    let parentId =
      typeof rawProps.parentId === 'string'
        ? rawProps.parentId
        : shape.parentId && shape.parentId.startsWith('shape:')
        ? (shape.parentId as string)
        : null;

    if (!parentId && targetRole !== 'page') {
      const candidates = shapes.filter((c) => {
        if (c.id === shape.id) return false;
        const cProps = (c.props || {}) as Record<string, unknown>;
        const cType = typeof cProps.widgetType === 'string' ? cProps.widgetType : '';
        const cRule = V3_WIDGET_TO_V4_ROLE_MAP[cType];
        const cRole = promotedContainerIds.has(c.id)
          ? 'card'
          : cRule?.targetRole || (cProps.role as string);
        return cRole === 'page' || cRole === 'section' || cRole === 'card' || cRole === 'dialog';
      });

      candidates.sort((a, b) => {
        const aProps = (a.props || {}) as Record<string, unknown>;
        const bProps = (b.props || {}) as Record<string, unknown>;
        const aArea = ((aProps.w as number) || 100) * ((aProps.h as number) || 100);
        const bArea = ((bProps.w as number) || 100) * ((bProps.h as number) || 100);
        return aArea - bArea;
      });

      const sBounds = {
        x: shape.x || 0,
        y: shape.y || 0,
        w: (typeof rawProps.w === 'number' && rawProps.w) || 100,
        h: (typeof rawProps.h === 'number' && rawProps.h) || 50
      };
      const sAABB = { minX: sBounds.x, minY: sBounds.y, maxX: sBounds.x + sBounds.w, maxY: sBounds.y + sBounds.h };

      for (const cand of candidates) {
        const cProps = (cand.props || {}) as Record<string, unknown>;
        const cBounds = {
          x: cand.x || 0,
          y: cand.y || 0,
          w: (typeof cProps.w === 'number' && cProps.w) || 100,
          h: (typeof cProps.h === 'number' && cProps.h) || 100
        };
        const cAABB = { minX: cBounds.x, minY: cBounds.y, maxX: cBounds.x + cBounds.w, maxY: cBounds.y + cBounds.h };
        if (cBounds.w >= sBounds.w && cBounds.h >= sBounds.h) {
          const ix1 = Math.max(sAABB.minX, cAABB.minX);
          const iy1 = Math.max(sAABB.minY, cAABB.minY);
          const ix2 = Math.min(sAABB.maxX, cAABB.maxX);
          const iy2 = Math.min(sAABB.maxY, cAABB.maxY);
          if (ix2 > ix1 && iy2 > iy1) {
            const intersectArea = (ix2 - ix1) * (iy2 - iy1);
            const childArea = sBounds.w * sBounds.h;
            if (childArea > 0 && intersectArea / childArea >= 0.5) {
              parentId = cand.id;
              break;
            }
          }
        }
      }
    }

    const responsive: RoleResponsive | null =
      rawProps.isResponsive || rawProps.hideOnMobile || typeof rawProps.mobileOrder === 'number'
        ? {
            order: typeof rawProps.mobileOrder === 'number' ? rawProps.mobileOrder : 'auto',
            primary: false,
            smVisible: rawProps.hideOnMobile ? 'hidden' : 'visible',
            smFullWidth: false,
            tablet: (rawProps.tabletLayout as any) || 'maintain'
          }
        : null;

    const markdrawMeta: MarkDrawMeta = {
      schema: ROLE_SCHEMA_VERSION,
      role: targetRole,
      unitId: null,
      parentId,
      responsive,
      props,
      v3WidgetType: widgetType
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
