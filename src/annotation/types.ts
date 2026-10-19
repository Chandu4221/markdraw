// src/annotation/types.ts
export const ROLE_SCHEMA_VERSION = 1 as const;
export const TYPE_SCHEMA_VERSION = 1 as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue | undefined };

export interface MarkDrawMeta {
  [key: string]: JsonValue | undefined;
  schema: 1;                     // literal 1
  type?: string | null;          // one of TYPE_VOCABULARY (§4) — null = untagged
  role?: string | null;          // backward compat alias for transition
  unitId: string | null;         // custom unit this shape was stamped from, else null
  parentId: string | null;       // explicit parent override (shape id); null = use frame/group membership
  responsive: RoleResponsive | null;
  props: RoleProps;
  flags?: string[];
}

export interface RoleResponsive {
  [key: string]: JsonValue | undefined;
  order: number | 'auto';
  primary: boolean;
  smVisible: 'visible' | 'hidden' | 'collapse:drawer' | 'collapse:bottom-bar' | 'collapse:hamburger';
  smFullWidth: boolean;
  tablet: 'stack' | '2-col' | 'maintain';
}

export type TypeResponsive = RoleResponsive;

export interface RoleProps {
  [key: string]: JsonValue | undefined;
  label?: string;          // user-edited label; untouched labels compile as [Text Placeholder]
  placeholder?: string;    // input/search/textarea only
  count?: number;          // parent of a repeated group: exact child count is binding
  options?: string;        // select/tabs: comma list
  note?: string;           // free-text hint to AI — NON-BINDING, always emitted as note:"..."
  styleNote?: string;      // visual style hint (e.g. rounded-xl, primary color)
  variant?: string;        // role-specific variant (e.g. card: elevated|outline|ghost)
  behaviors?: string[];    // role behavior flags (§4 allow-list)
}

export type TypeProps = RoleProps;

export function createDefaultMarkDrawMeta(type: string | null = null): MarkDrawMeta {
  return {
    schema: ROLE_SCHEMA_VERSION,
    type,
    role: type,
    unitId: null,
    parentId: null,
    responsive: null,
    props: {}
  };
}
