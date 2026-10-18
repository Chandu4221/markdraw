// src/annotation/units.ts
export interface UnitDefinition {
  id: string;              // stable, e.g. 'u_fc1' — generateShortId-based
  name: string;            // user-facing: "Follow Card"
  tag: string;             // emitted tag e.g. "Follow Card" (name); legend shows mapping
  baseRole: string;        // MANDATORY one of ROLE_NAMES (§4) — never null
  memberRoles: string[];   // ordered composition, e.g. ['avatar','heading','button']
  createdAt: number;
  updatedAt: number;
}
