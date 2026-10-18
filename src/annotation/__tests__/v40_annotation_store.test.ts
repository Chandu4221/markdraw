// src/annotation/__tests__/v40_annotation_store.test.ts
import { describe, it, expect } from 'vitest';
import {
  ROLE_SCHEMA_VERSION,
  MarkDrawMeta,
  createDefaultMarkDrawMeta
} from '../types';

describe('MarkDraw v4 Annotation Store & Metadata (§3.1)', () => {
  it('creates default metadata conforming to MarkDrawMeta schema', () => {
    const meta: MarkDrawMeta = createDefaultMarkDrawMeta('card');
    expect(meta.schema).toBe(ROLE_SCHEMA_VERSION);
    expect(meta.role).toBe('card');
    expect(meta.unitId).toBe(null);
    expect(meta.parentId).toBe(null);
    expect(meta.responsive).toBe(null);
    expect(meta.props).toEqual({});
  });

  it('supports full responsive and role props', () => {
    const meta: MarkDrawMeta = {
      schema: 1,
      role: 'button',
      unitId: 'u_fc1',
      parentId: 'shape:parent-1',
      responsive: {
        order: 1,
        primary: true,
        smVisible: 'visible',
        smFullWidth: true,
        tablet: 'maintain'
      },
      props: {
        label: 'Follow',
        note: 'Click to follow user',
        variant: 'solid'
      }
    };

    // Serialize and deserialize (simulating tldraw shape persistence / IndexedDB)
    const json = JSON.stringify(meta);
    const parsed: MarkDrawMeta = JSON.parse(json);

    expect(parsed.schema).toBe(1);
    expect(parsed.role).toBe('button');
    expect(parsed.unitId).toBe('u_fc1');
    expect(parsed.parentId).toBe('shape:parent-1');
    expect(parsed.responsive?.order).toBe(1);
    expect(parsed.responsive?.primary).toBe(true);
    expect(parsed.props.label).toBe('Follow');
  });
});
