# MarkDraw v4 — The Annotation Layer — Complete Agent Build Instructions

**Repo:** `github.com/Chandu4221/markdraw` · **Base:** current `main` at v3.0.0 (all tests green, CI passing)
**Branch:** create `v4-annotation` from `main`. **All work happens on this branch. Never commit to `main`.**

---

## 0. HOW TO READ THIS DOCUMENT (anti-hallucination rules)

These instructions are exhaustive. If something is not specified here, **do not invent it** — implement the minimal version that does not violate any rule, and note the decision in the commit message.

**FORBIDDEN — you must never:**
1. Create a new npm dependency (runtime or dev). Zero new deps. If a task seems to require one, stop and report instead.
2. Modify the *output format* of the existing serializers (spec table columns, ASCII layout, JSON AST shape) except where this document says so explicitly.
3. Delete any file listed in §1.2 SURVIVES before Phase 4.
4. Add, rename, or remove any role in the vocabulary table (§4) beyond what is written there.
5. Change the directive text except by adding the exact lines specified in §8.2.
6. Invent framework-specific component names in the core (e.g. `Drawer`, `CardHeader`, `TopAppBar` in `src/core/`). Framework names exist ONLY inside profile JSON files (§10).
7. Touch `bench/` corpus or scoring logic. The v4 output must be comparable against it.
8. Skip a phase gate. If a gate fails, stop, write `docs/v4-gate-report.md` with the failure, and await instructions.
9. Use `any` casts in new code. Use precise types or `unknown` + narrowing.
10. Add network calls, telemetry, or analytics.

**REQUIRED — always:**
- `npx tsc -b` clean, `npm test` green, `vite build` succeeds at the end of EVERY phase.
- Every new module under `src/` has unit tests in `src/**/__tests__/`.
- Every commit message states which numbered section of this document it implements.
- When this document gives an exact string (directive lines, lint messages, legend rows, scoped-compile header), copy it character-for-character. Do not paraphrase.

---

## 1. CURRENT REPO MAP (source of truth — verify against this, do not guess)

```
src/
  App.tsx (62KB)              — hosts Tldraw editor, compile panel, tabs, modals, lockdown config
  core/
    compiler.ts               — MarkDrawCompiler.compile() → CompilationResult
    ir.ts                     — buildIRTree(), IRNode, IRTree, serializeIRToJsonAst, pruneDefaultProps
    ids.ts                    — generateShortId()
    geometry.ts               — computeAABB, getEnclosureRatio, sanitizeMarkdown
    style.ts                  — inferNodeStyle(): widthPct, align, alignY, dist, rel, behaviors, note
    patterns.ts               — detectSiblingPatterns(), annotateSiblingPatterns() → "N × [pattern]"
    notation.ts               — formatSemanticNotation(), DYNAMIC_LEGEND_MARKDOWN
    legend.ts                 — generateCanvasLegend()
    directive.ts              — AI_DIRECTIVE_HEADER
    ascii.ts                  — AsciiSerializer
    documents.ts              — doc registry (localStorage/IndexedDB), demo shapes, file import/export
    compile.worker.ts         — web worker wrapper
    types.ts                  — CompilationOptions, CompilationResult, AABB, UIWidgetProps
    renderMode.ts, lorem.ts, svgPatterns.tsx   — v2.10 preview machinery (DELETABLE, Phase 4)
    widgets/                  — widgetCatalog.ts (54 widgets), UIWidgetShapeUtil, WireframePreview (DELETABLE, Phase 4)
    __tests__/                — 14 test files, all must stay green through Phase 3
  components/                 — ComponentPalette (DELETABLE), PropsPanel (REPLACED), LegendModal,
                                SettingsModal, ShortcutsModal, DocumentMenu, MarkdownPreview, ErrorBoundary, ui/
bench/                        — 20-wireframe corpus + runner.ts + contract assertions (DO NOT TOUCH)
docs/history/                 — old instruction files
```

**v4 adds exactly one new top-level directory:** `src/annotation/`.

---

## 2. THE THESIS (all decisions defer to this)

MarkDraw v4 = **tldraw restored as a fully native freeform editor + MarkDraw as a semantic annotation layer on top.** The user draws anything (web page, ad, pamphlet, diagram, card — medium-blind) and *declares* what each shape means by assigning a role from a fixed ~28-role web-standard vocabulary. The compiler emits a deterministic markdown/JSON contract for AI consumption. No custom widget shapes. No 54-component palette. No inference as authority — **geometry may suggest, only the user's declaration decides.**

---

## 3. DATA MODEL (exact — implement these interfaces verbatim)

### 3.1 Role annotation (stored on every tldraw shape)

```ts
// src/annotation/types.ts
export const ROLE_SCHEMA_VERSION = 1;

export interface MarkDrawMeta {
  schema: 1;                     // literal 1
  role: string | null;           // one of ROLE_NAMES (§4) — null = untagged
  unitId: string | null;        // custom unit this shape was stamped from, else null
  parentId: string | null;      // explicit parent override (shape id); null = use frame/group membership
  responsive: RoleResponsive | null;
  props: RoleProps;
}
export interface RoleResponsive {
  order: number | 'auto';
  primary: boolean;
  smVisible: 'visible' | 'hidden' | 'collapse:drawer' | 'collapse:bottom-bar' | 'collapse:hamburger';
  smFullWidth: boolean;
  tablet: 'stack' | '2-col' | 'maintain';
}
export interface RoleProps {
  label?: string;          // user-edited label; untouched labels compile as [Text Placeholder]
  placeholder?: string;    // input/search/textarea only
  count?: number;          // parent of a repeated group: exact child count is binding
  options?: string;        // select/tabs: comma list
  note?: string;           // free-text hint to AI — NON-BINDING, always emitted as note:"..."
  variant?: string;        // role-specific variant (e.g. card: elevated|outline|ghost)
}
```

Persist as tldraw shape meta: `shape.meta.markdown` → NO. **Persist at `shape.meta.markdraw = MarkDrawMeta`** (tldraw persists `meta` natively; test round-trip through documents.ts).

### 3.2 Custom unit definitions

```ts
// src/annotation/units.ts
export interface UnitDefinition {
  id: string;              // stable, e.g. 'u_fc1' — generateShortId-based
  name: string;            // user-facing: "Follow Card"
  tag: string;             // emitted tag e.g. "Follow Card" (name); legend shows mapping
  baseRole: string;        // MANDATORY one of ROLE_NAMES (§4) — never null
  memberRoles: string[];   // ordered composition, e.g. ['avatar','heading','button']
  createdAt: number; updatedAt: number;
}
```
Stored in the document registry alongside shapes (documents.ts gains `units: UnitDefinition[]`).

### 3.3 IR changes (ir.ts — surgical, do not rewrite the file)

`IRNode` gains/changes exactly these fields:
```diff
- widgetType: string;
+ role: string;              // canonical role name (§4)
+ unitId?: string;           // set when the node is/comes-from a custom unit
```
Everywhere `node.widgetType` is read inside `src/core/`, read `node.role` instead. `resolveWidgetRole()` is DELETED at Phase 4 (kept compiling until then). `getCatalogDefaultProps`/`isUntouchedLabel` move from `widgets/widgetCatalog.ts` into `src/annotation/roleDefaults.ts` re-keyed by role; their behavior is unchanged.

### 3.4 Platform profile packs

```ts
// src/annotation/profiles/types.ts
export interface PlatformProfile {
  id: string;                       // 'web' | 'android-material' | future ids
  displayName: string;
  directiveLines: string[];         // 1–3 sentences appended to the directive (§8.2)
  roleAliases: Record<string, string>;    // canonical role → platform component name, ONLY for legend/notation display
  extraRoles: Record<string, { name: string; description: string; flags?: string[] }>;  // offered in role panel ONLY when profile active
  conventions: string[];            // emitted as bullet lines under "Platform Conventions"
}
```
Shipped files: `src/annotation/profiles/web.json`, `src/annotation/profiles/android-material.json` (content in §10). Others are out of scope.

---

## 4. THE ROLE VOCABULARY (closed set — 28 roles, copy exactly)

Each role: `name | aliases (search) | decision rule (tooltip) | allowed behavior flags`.

| # | name | aliases | decision rule | flags |
|---|---|---|---|---|
| 1 | `page` | screen, artboard | top-level viewport; one per root frame | responsive |
| 2 | `section` | container, band, block, content | page band dividing the artifact vertically | sticky, parallax |
| 3 | `card` | tile, item, post, article, content-box | repeatable content unit | floating, expandable |
| 4 | `navbar` | appbar, topbar, navigation menu | primary navigation band | sticky, floating, overlay, fixed |
| 5 | `sidebar` | drawer-rail, side panel | secondary side navigation | sticky, collapse:drawer |
| 6 | `footer` | page-footer | bottom band | sticky, fixed |
| 7 | `heading` | h1–h6, title, headline, header-text | text heading ONLY — never a band | — |
| 8 | `para` | paragraph, body, text block | body text | — |
| 9 | `img` | picture, image, image_frame, thumbnail, media | static media | parallax |
| 10 | `video` | player, video_frame | motion media | autoplay |
| 11 | `button` | btn, cta | actionable control | fixed |
| 12 | `input` | field, text field, form field | single-line entry (variants: password, file, date) | — |
| 13 | `textarea` | multiline | multi-line entry | — |
| 14 | `select` | dropdown, picker | choice from list | — |
| 15 | `checkbox` | check | boolean control | — |
| 16 | `radio` | option | single choice from set | — |
| 17 | `switch` | toggle | on/off control | — |
| 18 | `slider` | range | ranged control | — |
| 19 | `stepper` | number input | +/- numeric control | — |
| 20 | `table` | data_table, grid | tabular data | — |
| 21 | `tabs` | tab bar | sibling view switcher | scroll-snap |
| 22 | `avatar` | profile pic, user image | person image | — |
| 23 | `badge` | chip, tag, pill, label | small status label | — |
| 24 | `banner` | alert, callout, notice | inline message strip (never `alert`) | overlay, dismissible |
| 25 | `dialog` | modal, popup, overlay, lightbox | floating overlay panel | fullscreen, draggable |
| 26 | `separator` | divider, hr, rule | structural line | — |
| 27 | `carousel` | slider-gallery, stories | sliding group | autoplay, scroll-snap, fullscreen |
| 28 | `stat` | kpi, metric | number + label unit | — |
| 29 | `steps` | wizard | sequential progress | — |
| 30 | `nav` | link list, footer_nav | generic link group | — |
| 31 | `group` | unit wrapper | invisible semantic grouping, no visual box | — |

(28 core + `group` utility + `fab` provided ONLY by the android profile — §10.)

`ROLE_NAMES` is a frozen `const` array in `src/annotation/roles.ts` with the alias map, decision rules, and flag allow-lists. The role panel search matches name + aliases (substring, case-insensitive).

**Rename resolution for v3 migration (§12) uses this table.** For new code: if the user types an alias in search, they get the canonical role. The alias NEVER appears in output.

---

## 5. ROLE PANEL (new component — exact behavior)

File: `src/components/RolePanel.tsx` (replaces PropsPanel in Phase 4; coexists until then).

**Visibility:** docked right panel; shows content ONLY when exactly the current selection state is: 1+ selected shapes. Empty selection → shows canvas-level info (root frames list, unit list, lints summary).

**Sections, top to bottom:**
1. **Role** — searchable dropdown (grouped: Structure / Content / Interaction / Navigation / Feedback). Search input accepts aliases (§4). Below the dropdown: the role's decision rule as helper text. If the shape's geometry *suggests* a role (e.g. small rounded rect ~ button; wide top band ~ navbar), show a one-click suggestion chip: `Looks like a button — assign?` — clicking assigns; **the suggestion NEVER auto-assigns.**
2. **Label** — text input. Empty/untouched → compiles as `[Text Placeholder]`. Edited → binding literal text.
3. **Hierarchy** — dropdown listing candidate parents: enclosing frame first, enclosing group second, then any ancestor frames/groups, then `— none (root level) —`. Value stored to `meta.markdraw.parentId` ONLY when the user actively changes it; otherwise null (membership implied).
4. **Behavior flags** — checkbox chips; only flags from the role's allow-list (§4) render. Unknown flags are never shown or emitted.
5. **Responsive** — collapsible; visible ONLY if an ancestor root has role `page` with `responsive` flag. Fields per §3.1. If no ancestor root is responsive, show disabled hint: `Enable Responsive on the root page first.`
6. **Props** — role-appropriate: placeholder (input/textarea/select), options (select/tabs), count (any role that is a parent of a repeated group), variant, note.
7. **Unit actions** — multi-select only: `Save as unit…` (§11 flow).

**Canvas chips:** each shape with `meta.markdraw.role != null` renders a small chip near its top-left via tldraw shape component wrapper: role name in lowercase mono, or unit name for stamped shapes (`Follow Card`). Opacity 60%, pointer-events none, hidden in export/PNG, global toggle in Settings (`showRoleChips`, default on). Untagged shapes render a dashed gray `untagged` chip ONLY while the lint banner is expanded.

---

## 6. CANVAS MODEL — FRAMES AS ROOTS, GROUPS AS UNITS

1. **Restore native tldraw completely.** In `App.tsx` delete the `tldrawComponents` lockdown object and its usage. Toolbar, style panel, tools, camera, undo, copy/paste all operate natively. Register NO custom shape utils (remove `customShapeUtils`).
2. **Frame = artifact root.** A tldraw frame compiles as a root node. If the frame (or its first child annotation) has role `page`, it is the root `[page]`. A frame without any annotated children is skipped with lint `Frame "<name>" has no tagged shapes — skipped.`
3. **Group = unit of movement.** Native groups move children — no custom translate-sync code. IR parentage: a shape's parent is resolved in this priority order:
   1. `meta.markdraw.parentId` if set (validate the target exists and is an ancestor-by-geometry within tolerance 0.5; if not, lint `#<id> has stale parentId "<target>" — clear it or move the shape back inside.`, treat as null);
   2. enclosing native group;
   3. enclosing frame;
   4. root level under its frame.
   Geometric enclosure (0.85) is NEVER an authority in v4. It is used only for the "Looks like…" suggestion chips and stale-parentId detection.
5. **Arrows = relations.** A tldraw arrow shape with both endpoints bound to annotated shapes emits one line after the spec table:
   `Relations: #a3 → #m8x (flow)` — arrow label (if any) becomes the parenthetical. Endpoints on untagged shapes → lint, line omitted.
6. **Loose shapes** (outside any frame) compile ONLY via explicit selection scope (§9) or emit lint `N loose shapes outside any frame — move into a frame or select to compile.`

---

## 7. COMPILER — EXACT CHANGES

`MarkDrawCompiler.compile(shapes, editor, options)` signature UNCHANGED. `CompilationOptions` gains:

```ts
platform?: 'web' | 'android-material';       // default 'web'
scope?: { shapeIds: string[] } | null;        // null = whole canvas (all roots)
```

Behavior:
- Filters shapes by scope; resolves roots per §6; builds IR via `buildIRTree` with role-based parenting (§6.4 priority order).
- Emits the SAME four serializers, SAME spec-table columns: `| Path | Component | Semantics | Placement | Layout Flow | Props & Attributes | Children / Content |`.
- `Path` = `Root > #<shortId> > …` — IDs only, no labels (v2.9 rule).
- `count:N` appears ONLY on the parent row's props (e.g. `count:11` on the carousel) — NOT repeated per child. This fixes the v3 redundancy; update affected fixtures in tests (tests may change; bench corpus may NOT).
- Untagged shapes: skipped, listed once in lints: `Skipped 3 untagged shapes: #x1, #y2, #z3 — assign roles or delete.`
- Determinism: identical shapes+meta → byte-identical output (add regression test).
- Mode-invariance: chips on/off, camera, selection do NOT affect output (test).

---

## 8. DIRECTIVE, LEGEND, OUTPUT — EXACT STRINGS

### 8.1 Base directive (verbatim — this is the v2.9 header, do not alter a word)

> This is a binding layout contract from MarkDraw v4.0. Follow every tag, id, count, placement, width, align, and flag EXACTLY; render positions relative to the parent even if unconventional. `[Text Placeholder]` means you MUST generate content (only sanctioned improvisation); everything unspecified (colors, type, imagery) is your freedom — if the contract is impossible, say so instead of deviating.
> N × [pattern] and all counts are binding, not suggestions.

(Version string changes to v4.0 in Phase 4 only; until then keep reading from `MARKDRAW_VERSION`.)

### 8.2 Platform + responsive lines (appended, exact formats)

- Platform (always, after base directive): `Target platform: {displayName}. {directiveLines joined by space}`
- Responsive (only when a root `page` has the `responsive` flag): `Responsive: this page must adapt to mobile widths; per-shape sm:* tokens are binding.`
- If no responsive root and any shape carries responsive meta → lint (§13), tokens NOT emitted.

### 8.3 Two-layer legend (legend.ts extension)

```markdown
### MarkDraw Canvas Legend

#### Custom Units
| Notation | Meaning | Composition |
| :--- | :--- | :--- |
| [Follow Card] | Card | avatar + heading + button |

#### Standard Roles
| Notation | Meaning | Example |
| :--- | :--- | :--- |
| [button "Text" variant] | Button (variants: solid, ghost) | [button "Send" ghost] |
| ... (only roles + flags actually used on this canvas — v2.9 auto-gen rule)
```

Platform profiles rewrite the Notation column via `roleAliases` (display only; the IR is untouched).

### 8.4 Golden example — the Follow Card (use as a test fixture; output must match this shape)

Canvas: one frame `Feed Page` (role page, responsive). Inside: one group of three shapes: ellipse → `avatar`, text "Alex" → `heading`, rounded rect "Follow" → `button`. Unit saved as `Follow Card` (base role `card`).

Spec (scoped compile of the group):

```
_Scoped compile: "Follow Card" — 1 unit, 3 nodes (of 4 in "Feed Page")_

### MarkDraw UI Specification
**Roots Detected:** 1 view(s)

#### Semantic Hierarchy Table
| Path | Component | Semantics | Placement | Layout Flow | Props & Attributes | Children / Content |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Root > #8ac` | **[page "Feed Page"]** | <Page> | — | Row | responsive | 1 × [Follow Card] |
| `Root > #8ac > #a3f` | **[Follow Card]** | <Card> | nested | Row | unit:"Follow Card" | avatar, heading, "Follow" |
| `Root > #8ac > #a3f > #k2p` | **[avatar]** | <Avatar> | nested | — | | "content: [Text Placeholder]" |
| `Root > #8ac > #a3f > #m8x` | **[heading "Alex" h3]** | <Heading> | nested | — | variant="h3" | "Alex" |
| `Root > #8ac > #a3f > #q1b` | **[button "Follow"]** | <Button> | nested | — | | "Follow" |
```

---

## 9. SCOPED COMPILE & OUTPUT UX (three gestures)

1. **Selection-scoped (RolePanel/compile panel):** compile `scope = { shapeIds: selection ∪ ancestors ∪ all descendants }`. Header line, exact format:
   `_Scoped compile: "{scopeName}" — {unitCount} unit(s), {nodeCount} nodes (of {totalNodes} in "{rootName}")_`
   Paths stay absolute. Lints filtered to the subtree.
2. **Per-root copy button:** hovering a frame or its chip shows a `Copy contract` button (and right-click context menu entry) → copies that root's lean contract (directive + legend-if-enabled + spec) to clipboard.
3. **Compile panel:** unchanged tabs (spec/grid/ASCII/JSON), plus a `Platform` select (web/android-material) and a `Scope: Selection | Whole canvas` toggle.

All three share one legend + directive (never re-emit per copy). Boilerplate ≤ 25% of any copy (port the v2.9 budget test).

---

## 10. PLATFORM PROFILE CONTENT (ship these two JSON files exactly)

**web.json:** `displayName: "Web"`, `directiveLines: ["Use semantic HTML and a utility-first CSS approach.", "Prefer responsive utility classes over custom media queries."]`, `roleAliases: {}` (identity), `extraRoles: {}`, `conventions: ["Single-column stacking on mobile unless sm tokens say otherwise."]`

**android-material.json:** `displayName: "Android (Material 3)"`, `directiveLines: ["Use Material 3 components and a Scaffold-based layout structure.", "Prefer bottom navigation for top-level navigation on mobile."]`, `roleAliases: { "navbar": "TopAppBar", "nav": "NavigationBar", "banner": "Snackbar (inline)", "dialog": "Dialog", "switch": "Switch" }`, `extraRoles: { "fab": { name: "fab", description: "Floating action button for the primary action", flags: ["extended"] }, "bottom_sheet": { name: "bottom_sheet", description: "Bottom-anchored modal sheet" }, "scaffold": { name: "scaffold", description: "App-level layout skeleton wrapping the page" } }`, `conventions: ["Top-level nav maps to bottom NavigationBar; secondary nav maps to a NavigationDrawer.", "FAB for the single primary action of a screen."]`

Alias names appear ONLY in the legend's Notation column and the conventions/directive lines. The spec table's Component column keeps the canonical role tag.

---

## 11. CUSTOM UNITS — EXACT LIFECYCLE

1. **Create:** multi-select annotated shapes → RolePanel `Save as unit…` → dialog: Name (required, e.g. `Follow Card`), Base role (dropdown of the 28, MANDATORY — cannot save without one), auto-id `u_<short>`. Members' roles recorded in order (top-left → bottom-right by bounds).
2. **Stamp/reuse:** unit appears in RolePanel section `My units`; clicking stamps a native tldraw group copy with all member shapes pre-annotated (`meta.markdraw.unitId = u_<id>`), positioned at the viewport center, offset if stamping repeatedly.
3. **Emit:** a shape-group whose members' `unitId` matches a unit compiles as ONE node: Component = `[Follow Card]` (the unit name), Semantics = `<Card>` (base role), props gain `unit:"Follow Card"`, children = the member roles. Legend layer-1 row added (§8.3).
4. **Edit:** rename in customization panel → updates `name`; contracts reference the name so renames flow forward (pasted old contracts are the AI's context problem, not ours). Changing base role re-grounds the unit.
5. **Delete:** unit removed from registry; stamped shapes keep their annotations (they were copies).

---

## 12. MIGRATION — v3 WIDGET → v4 ROLE (run once on document load; exact map)

`src/annotation/migrate.ts`: for each shape with a `widgetType` prop, set `meta.markdraw` using this map (widgetType → role), carry `label`→`props.label`, flags→flags where the role allows, else drop with lint `Flag "<flag>" has no meaning for role "<role>" — dropped.`:

```
page→page  section→section  card→card  navbar→navbar  sidebar→sidebar  footer→footer
header→heading (text headings)  menubar→navbar  footer_nav→nav  nav→nav
hero→section (variant:hero)  split_pane→section (variant:split)  grid_gallery→section (variant:grid)
modal→dialog  carousel→carousel  steps→steps  tabs→tabs
heading→heading  para→para  text→para  label→para
image_frame→img  img→img  thumbnail_strip→img (variant:strip)  video_frame→video
avatar→avatar  avatar_group→avatar (count from members)  icon→badge (variant:icon)
stat_kpi→stat  kpi→stat  badge→badge  banner→banner
button→button  input→input  search→input (variant:search)  password→input (variant:password)
textarea→textarea  select→select  checkbox→checkbox  radio→radio  toggle→switch
slider→slider  stepper→stepper  file_upload→input (variant:file)  date_picker→input (variant:date)
color_swatch→badge (variant:swatch)  table→table  data_table→table
divider→separator  spacer→group  progress→stat (variant:progress)
```
Mark migrated docs `docVersion: 4` after writing; never mutate without an IndexedDB backup copy. Test with demo doc + the Instagram feed doc; assert compile output equivalence class (same tree shape, role names instead of widget names).

---

## 13. LINT SET (exact strings — compile lints are informational, never block)

```
Skipped {n} untagged shapes: {ids} — assign roles or delete.
Frame "{name}" has no tagged shapes — skipped.
{looseCount} loose shapes outside any frame — move into a frame or select to compile.
#{id} has stale parentId "{target}" — clear it or move the shape back inside.
Responsive props on #{id} but no responsive root page — tokens not emitted.
Unit "{name}" has no base role — fix in the customization panel.
Arrow endpoint untagged — relation omitted.
Identical literal labels "{text}" across {n} repeated siblings — consider one template (legend rule: vary per item).
Flag "{flag}" has no meaning for role "{role}" — dropped.
```

---

## 14. TESTS TO ADD (named; place in `src/**/__tests__/`)

- `v40_roles.test.ts` — vocabulary frozen (28+group), alias resolution, flag allow-lists.
- `v40_annotation_store.test.ts` — meta round-trip through documents.ts save/load.
- `v40_parenting.test.ts` — priority order parentId > group > frame > root; stale-parentId lint.
- `v40_units.test.ts` — create/stamp/emit; golden Follow Card output matches §8.4.
- `v40_scoped_compile.test.ts` — header format, absolute paths, lint filtering.
- `v40_platform_profiles.test.ts` — web identity; android aliases only touch legend display.
- `v40_migration.test.ts` — §12 map on fixture docs.
- `v40_determinism.test.ts` — byte-identical recompiles; chips/selection invariance.
- `v40_lints.test.ts` — every §13 string emitted in the right condition.

Existing 14 test files stay green through Phase 3 (widget mode untouched behind flag `ANNOTATION_MODE`).

---

## 15. PHASES (strict gates; commit per phase; checkbox acceptance)

**Phase 0 — Setup (½ day).** Branch `v4-annotation`. Add `src/annotation/` skeleton with types from §3. `ANNOTATION_MODE` flag in `App.tsx` (env `VITE_ANNOTATION_MODE=1`), default off. ☐ tsc clean ☐ all tests green ☐ main untouched.

**Phase 1 — Annotation core (the prototype gate).** Native tldraw restored (§6.1). Role store + RolePanel (§5 sections 1–3) + chips. Parenting rules (§6.4). Selection-scoped compile. Web profile only. ☐ Follow Card golden test (§8.4) passes ☐ draw freehand: ellipse+text+rect in a group, tag 3 roles, compile scoped — output correct ☐ **GATE 1: run `npm run bench` with v4 mode; v4 must score ≥ v3 on all 20 fixtures. If not: stop, write `docs/v4-gate-report.md`.**

**Phase 2 — Vocabulary, responsive, units, lints.** Full role table + search aliases (§4). Flags, responsive model + gate rule (§8.2), custom units full lifecycle (§11), all §13 lints, two-layer legend (§8.3). ☐ v40 roles/units/parenting/lints tests green.

**Phase 3 — Output UX, profiles, migration.** Platform selector + android profile (§10). Per-root copy button + context menu (§9.2). Migration (§12). ☐ migration on demo + Instagram docs clean ☐ platform legend displays aliases, IR untouched ☐ scoped compile tests green.

**Phase 4 — Deletion & promotion.** Delete §1.1 files (`widgets/`, ComponentPalette, PropsPanel widget form, renderMode/lorem/svgPatterns, lockdown remnants, `resolveWidgetRole`). Remove the flag. Version → 4.0.0 (single `MARKDRAW_VERSION` + package.json + README). README repositioning: *"MarkDraw — the semantic layer between human visual intent and AI generation."* Move this instruction file to `docs/history/`. ☐ tsc clean ☐ tests green ☐ build green ☐ README updated.

---

## 16. HARD CONSTRAINTS (recap — violating any of these invalidates the phase)

- Zero new npm dependencies. No network. No inference as authority. Closed vocabulary. Exact strings as written. Core stays pure/DOM-free. Never touch `main`. Never touch `bench/`. Widget path lives until Phase 4. Boilerplate ≤ 25%. No `any`.
- When in doubt: **user declaration over inference, standard vocabulary underneath, deterministic output, minimal tokens.**