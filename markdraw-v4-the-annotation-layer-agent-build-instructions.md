# MarkDraw v4 — The Annotation Layer — Agent Build Instructions

**Repo:** `github.com/Chandu4221/markdraw` · **Base:** current `main` (v3.0.0, all tests green) · **Branch:** `v4-annotation` (create it; do NOT work on main)

**Read this entire document before writing any code.** This is a re-architecture, not a feature. The strategy is "strangler fig": build the new annotation layer alongside the widget system, flip behind a flag, delete the widget path only at the end.

---

## 0. The One-Sentence Thesis

MarkDraw v4 = **tldraw restored as the freeform editor + MarkDraw as a semantic annotation layer on top** — the user draws anything and declares what each thing *means*; the compiler emits a deterministic, web-standard-grounded, AI-ready markdown contract. No custom widget shapes. No palette of 54 components. Medium-blind core (web pages, ads, pamphlets, cards, email, diagrams — anything), platform-tweakable at the output boundary.

**Everything below serves this sentence.** If a design decision isn't covered here, choose the option that keeps: user declaration over inference, standard vocabulary underneath, deterministic output, minimal token cost.

---

## 1. What Dies, What Survives, What Is New

### 1.1 DELETE (on the branch, Phase 4 only — until then keep compiling)
- `src/core/widgets/widgetCatalog.ts` (the 54-widget catalog)
- `src/core/widgets/UIWidgetShapeUtil.tsx` (the custom `ui-widget` shape)
- `src/core/widgets/WireframePreview.tsx`, `WidgetPreview.tsx`
- The tldraw UI lockdown config in `App.tsx` (`Toolbar: null, StylePanel: null, ...` — all of it)
- `ComponentPalette.tsx`
- `PropsPanel.tsx` in its widget-prop form (replaced by the Role Panel)
- `resolveWidgetRole` and any widgetType→role mapping tables in `ir.ts` (roles become first-class)
- The old v2.5 legacy: `LegendEngine` heuristics if any remain

### 1.2 SURVIVE UNCHANGED OR LIGHTLY ADAPTED (the crown jewels — do not rewrite)
- `ir.ts` (IRNode/IRTree — re-keyed: `role` + custom unit info instead of `widgetType`), `compiler.ts`, `ids.ts` (stable short IDs), `style.ts` (width/align/dist/rel axes, tolerance buckets), `patterns.ts` (repeated-group detection, `count:N`), `notation.ts`, `legend.ts` (two-layer mode added), `directive.ts` (v2.9 directive + platform line), `ascii.ts`, `documents.ts`, `compile.worker.ts`, all serializers (spec table / spatial grid / ASCII / JSON)
- The v2.9 contract semantics: `[Text Placeholder]`, binding counts line, lean output, legend auto-generation from used vocabulary, boilerplate ≤ 25% budget
- All tests, `bench/` harness + corpus, CI, `docs/history/`

### 1.3 NEW
- `src/annotation/` — role store, role panel UI, custom units, two-layer legend, platform profiles, scoped compile
- Role annotations persisted as tldraw shape metadata (`shape.meta.markdraw = { role, unitId, ... }`)

---

## 2. The Standard Semantic Vocabulary (~28 roles)

The core fixed vocabulary. **Web-standard names only — no framework-specific component names.** This list is closed; the legend, notation, and role panel all derive from it. Do not add roles without explicit instruction.

| Role | Absorbs (search aliases) | Decision rule |
|---|---|---|
| `page` | screen, artboard, frame-root | top-level viewport; one per root |
| `section` | container, band, block, content | page band; divides the artifact vertically |
| `card` | tile, item, post, content-box, article | repeatable content unit |
| `navbar` | appbar, topbar, navigation menu, navigation | primary navigation band |
| `sidebar` | drawer-rail, side panel | secondary side navigation |
| `footer` | page-footer | bottom band |
| `heading` | header(text!), h1–h6, title, headline | text heading ONLY (never a band) |
| `para` | paragraph, text block, body | body text |
| `img` | picture, image, image_frame, thumbnail, media | static media |
| `video` | video_frame, player | motion media |
| `button` | btn, cta | actionable control |
| `input` | field, text field, form field (variants: password, file, date via props) | single-line entry |
| `textarea` | multiline | multi-line entry |
| `select` | dropdown, picker | choice from list |
| `checkbox` / `radio` / `switch` (shadcn name; absorbs toggle) | | boolean/choice controls |
| `slider` / `stepper` | range, number input | ranged controls |
| `table` | data_table, grid | tabular data |
| `tabs` | tab bar | sibling view switcher |
| `avatar` | profile pic, user image | person image |
| `badge` | chip, tag, pill, label | small status label |
| `banner` | alert, callout, notice | inline message strip (NOT `alert` — collides with JS) |
| `dialog` (shadcn name; absorbs modal, popup, overlay, lightbox) | | floating overlay panel |
| `separator` (absorbs divider, hr, rule) | | structural line |
| `carousel` | slider-gallery, stories | sliding media/list group |
| `stat` (absorbs kpi, metric) | | number + label unit |
| `steps` | wizard, breadcrumbs-adjacent (keep `breadcrumb` separate if needed) | sequential progress |
| `nav` (link list; generic — navbar/sidebar are specializations) | link list, footer_nav | generic link group |
| `fab` | — (platform-pack only; see §7) | floating action button |
| `group` | unit wrapper | invisible semantic grouping (no visual box) |

Rules:
- **One term per concept.** Size/urgency variants are props (`variant:`), never new roles.
- Search box in the role panel resolves aliases → canonical role (user can type "popup", gets `dialog`).
- Every role gets: canonical name, alias list, one-line decision rule (shown as tooltip), behavior flag allow-list, default props.

---

## 3. Annotation Layer (the heart of v4)

### 3.1 Role Panel (contextual, appears on selection)
- **Role picker:** searchable dropdown of the ~28 roles (grouped: Structure / Content / Interaction / Navigation / Feedback). Geometric heuristic may *suggest* ("this small rounded rect looks like a button — confirm?") but the user's declaration is the only authority. Suggestion ≠ assignment.
- **Behavior flags:** per-role allow-list from the v2.8 `BEHAVIOR_FLAG_MAP`, re-keyed to roles (sticky, floating, overlay, autoplay, fixed, collapse-to:drawer/bottom-bar/hamburger, etc.).
- **Props:** label, placeholder, count (for repeated groups), options, note (free-text hint, non-binding).
- **Hierarchy:** parent picker (dropdown of enclosing frames/groups/units). **Membership by declaration:** native tldraw frames and groups ARE the primary hierarchy (see §4); the picker exists to override/declare when shapes are loose.
- **Responsive props (per-role):** `sm:visible|hidden|collapse-to:<kind>`, `order:N|auto`, `primary` flag, `sm:full` width, `tablet:stack|2-col|maintain`. Emitted ONLY when the root has `responsive` set (gate rule, §5.3).

### 3.2 Role chips on canvas (toggleable)
- Each tagged shape shows a small chip: the role name, or for custom units the user's unit name (`#fc1 Follow Card`).
- Chips are subtle (low-opacity pill at top-left), never block interaction, excluded from PNG/export, individually hideable. Global toggle in UI. Untagged shapes show a faint dashed chip ("untagged") only when lint is active.

### 3.3 Untagged shapes policy
- Compile: **lint + skip** ("3 untagged shapes skipped — assign roles or delete"). Never emit unannotated geometry into the contract. List skipped shapes by short ID in the lint.

---

## 4. Canvas Model — Frames as Roots, Groups as Units

- **Restore native tldraw fully:** toolbar, style panel, draw/rectangle/ellipse/text/line/arrow tools, camera, undo, copy/paste. No lockdown overrides.
- **Frame = declared root/artifact.** Each top-level frame compiles as one root (`page` role assigned via frame annotation or frame name). A canvas may hold many artifacts (web page + ad mockup + pamphlet coexisting).
- **Group = movable unit.** Native `Ctrl+G`. Moving a group moves children — free, via tldraw. Group membership feeds the IR as parentage (declaration), geometry (enclosure ratio) is ONLY a suggestion mechanism with a confirm prompt, never silent authority.
- **Arrows = relations.** An arrow between two tagged shapes emits a relation line in the spec (`#a3 → #m8x : flow/navigate`) — the basis for future flow/interaction semantics. Keep emission minimal for now (one line per arrow, lint if endpoint untagged).
- **Canvas is NOT a root.** Loose shapes outside any frame compile only when explicitly selected (scoped compile, §8) or lint as orphans.

---

## 5. Compiler & Contract (continuity is mandatory)

### 5.1 Re-keyed IR
`IRNode`: replace `widgetType` with `role` + optional `unit` (custom unit reference). Everything else (bounds, children, path, shortId, direction, style, textProps) stays. Serializers unchanged in output shape — the benchmark corpus must still score comparably.

### 5.2 Two-layer legend
- **Layer 1 — custom units first:** one row per unit on canvas: `| [#fc1] Follow Card | Card: avatar + heading + button | example tag |`
- **Layer 2 — standard roles:** auto-generated from roles actually used (v2.9 behavior: union of used roles + flags actually set). No unused rows.
- Legend OFF by default in output; "Copy full contract" includes it. Same lean budget as v2.9.

### 5.3 Directive (emitted on every copy)
The v2.9 directive verbatim plus:
- Platform line (§7): `Target platform: <web|android-material|ios|flutter|email|print>. <2–3 convention sentences.>`
- Responsive line when root has `responsive`: counts/roles/order/collapse rules are binding.
- Gate rule: no `responsive` on root → NO responsive tokens emitted at all, lint if any shape carries responsive props.

### 5.4 Paths, IDs, counts
- Stable short IDs everywhere (`Root > #k2p > #m8x`), absolute paths even in scoped output, `[Text Placeholder]` for untouched labels, binding counts (`N × [role]`), `count:N` on parent row only (not per-child — fix the v2.9 redundancy).

### 5.5 Compile lints (informational, listed, never block)
- untagged shapes (with IDs) · orphan loose shapes · responsive props without root gate · custom unit with no base role · child declared under a parent it isn't inside (stale binding) · arrows with untagged endpoints · duplicate label texts inside a repeated group (suggest template rule: identical literal text across N siblings = one template, vary per item)

### 5.6 Determinism & invariance
Same shapes + annotations → byte-identical output. Chips/render state never affect output. Port the v2.10 mode-invariance test pattern. Add: compile identical whether shapes are inside native groups or explicit-parented equivalently.

---

## 6. Custom Units (user-defined components)

- **Create:** multi-select → "Save as unit" → name (`Follow Card`), optional custom id (`#fc1`, auto-generated if blank), base role from the ~28 (mandatory — a unit must ground to a standard semantic), member list.
- **Reuse:** the unit appears in a "My units" section of the role panel and can be stamped (drops a pre-tagged copy of the group).
- **Emit:** unit children compile as the base role with the unit's composition; legend layer-1 row carries the user's name. Spec tag shows the user's name, e.g. `[Follow Card]`, resolved in legend to `Card: avatar + heading + button`.
- IDs stable, names editable, renames never break contracts.

---

## 7. Platform Profiles (pure data, output boundary only)

- `src/annotation/profiles/*.json` — per platform: alias table (role → platform component name, e.g. `navbar`→`TopAppBar` android / `TabBar` ios), extra roles offered only when active (`fab`, `bottom_sheet`, `scaffold` for android-material; `sheet`, `tab_bar` for ios), convention sentences for the directive, mapping rules (e.g. "top-level nav on mobile → bottom navigation bar").
- UI: platform selector in compile panel (Auto=web default). The IR and annotation layer are 100% platform-agnostic — profiles translate at emit time only.
- Ship Phase 1 with `web` + `android-material`; others later.

---

## 8. Scoped Compile & Output UX

Three gestures, one contract:
1. **Selection-scoped:** panel shows the selected subtree's spec. Header: `_Scoped compile: "Follow Card" — 1 unit, 12 nodes (of 60 in "Feed Page")_`. Absolute paths retained.
2. **Per-root copy button:** hover a frame/root (or its role chip) → "Copy contract" button → that artifact's full lean contract. Also in right-click context menu.
3. **Whole canvas / format choice:** the compile panel with spec / grid / ASCII / JSON tabs (and Skeleton later — out of scope here).

Shared legend + directive across all scopes (one canvas, one vocabulary). All copies respect the lean token budget.

---

## 9. Saved Document Migration

One-time migration on load for v3 docs: map each stored widgetType → role via the alias table (§2); widget labels → labels; flags carry over. Write `docVersion: 4` after migration; never mutate in place without backup in IndexedDB. Test with the demo doc + Instagram feed doc.

---

## 10. Build Phases (strangler fig — commit per phase)

**Phase 1 — Annotation core (the prototype gate).**
Branch created. Native tldraw restored. Role store + role panel + role chips + hierarchy via frames/groups. IR re-keyed behind a flag (`ANNOTATION_MODE`); compiler accepts role-based input. Scoped compile for selection. Web profile only. **Existing tests still pass in widget mode.**
**GATE 1:** draw the Follow Card (avatar+heading+button in a group) freehand, tag it, save as unit, compile → contract equals or beats the v3 widget-mode output for the same drawing. Use the benchmark corpus: v4 mode must score ≥ v3 mode on all 20 fixtures (automated where possible).

**Phase 2 — Vocabulary & responsive.** Full role table with aliases, behavior flags re-keyed, responsive column model + gate rule + lints, two-layer legend, custom units full lifecycle.

**Phase 3 — Output UX & platform packs.** Scoped compile polish, per-root copy, platform profiles (web + android-material), context menu, migration script.

**Phase 4 — Deletion & promotion.** Delete §1.1 items, remove the flag, v4 is the only mode. Update README (new positioning: "the semantic layer between human visual intent and AI generation"), bump to 4.0.0, move these instructions to `docs/history/`.

Only proceed past each phase if its gate passes. If GATE 1 fails, stop and report — do not force the architecture through.

---

## 11. Hard Rules

- No new runtime deps. No network. No inference as authority — geometry suggests, user declares, always.
- Closed vocabulary: the ~28 roles; platform packs may add roles only within their own profile.
- `src/core/` stays pure/DOM-free. Every phase ends with `tsc` clean + all tests green + CI passing.
- Contract output is sacred: lean, deterministic, grounded in standard semantics, `[Text Placeholder]` and binding counts preserved verbatim.
- Token budget: boilerplate ≤ 25% of any copy.
- Do not delete the widget system before Phase 4. Do not work on `main`.