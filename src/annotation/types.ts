// src/annotation/types.ts
export const ROLE_SCHEMA_VERSION = 1 as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue | undefined };

export interface MarkDrawMeta {
  [key: string]: JsonValue | undefined;
  schema: 1;                     // literal 1
  role: string | null;           // one of ROLE_NAMES (§4) — null = untagged
  unitId: string | null;         // custom unit this shape was stamped from, else null
  parentId: string | null;       // explicit parent override (shape id); null = use frame/group membership
  responsive: RoleResponsive | null;
  props: RoleProps;
}

export interface RoleResponsive {
  [key: string]: JsonValue | undefined;
  order: number | 'auto';
  primary: boolean;
  smVisible: 'visible' | 'hidden' | 'collapse:drawer' | 'collapse:bottom-bar' | 'collapse:hamburger';
  smFullWidth: boolean;
  tablet: 'stack' | '2-col' | 'maintain';
}

export interface RoleProps {
  [key: string]: JsonValue | undefined;
  label?: string;          // user-edited label; untouched labels compile as [Text Placeholder]
  placeholder?: string;    // input/search/textarea only
  count?: number;          // parent of a repeated group: exact child count is binding
  options?: string;        // select/tabs: comma list
  note?: string;           // free-text hint to AI — NON-BINDING, always emitted as note:"..."
  variant?: string;        // role-specific variant (e.g. card: elevated|outline|ghost)
  behaviors?: string[];    // role behavior flags (§4 allow-list)
}

export function createDefaultMarkDrawMeta(role: string | null = null): MarkDrawMeta {
  return {
    schema: ROLE_SCHEMA_VERSION,
    role,
    unitId: null,
    parentId: null,
    responsive: null,
    props: {}
  };
}
