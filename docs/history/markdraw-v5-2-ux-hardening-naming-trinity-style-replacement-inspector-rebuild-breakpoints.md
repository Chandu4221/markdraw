# MarkDraw v5.2 — UX Hardening — Complete Agent Instructions

**Repo:** `github.com/Chandu4221/markdraw` · **Base branch:** `v5.1-fix-integrate` (head of its 50 commits, v5.1.0)
**Working branch:** create `v5.2-ux-hardening` from `v5.1-fix-integrate`. **Never commit to `main`, `v5-canvas-adapter`, or `v5.1-fix-integrate`.**

---

## 0. READ THIS FIRST — WHY THIS PLAN EXISTS

The v5.1 pass was structurally correct but experientially wrong. The inspector overwhelmed users, chips detached from shapes, simulation was a floating toolbar instead of a property. This plan fixes UX. You are not adding features. You are removing confusion.

### 0.1 THE CONTROL RULES (you violated these last time — they are now stricter)

1. **Zero assumptions.** If this document does not specify a value, a string, a layout, or a behavior — you do NOT invent one. You write `docs/v52-question.md` with the question, implement everything else in the phase, and leave a `// V52-QUESTION: <question>` comment at the gap. The maintainer answers; then you fill it.
2. **No creative additions.** No new features, no new settings, no "helpful" extras. If a control isn't in the mockups below (§3, §4), it does not exist.
3. **Self-verification honesty.** In `docs/v52-verification/FINAL.md`, you may ONLY claim "X verified" if an automated test proves X AND that test is in CI. "Verified manually" requires a screenshot file named in the doc. A false claim in a verification document invalidates the entire phase.
4. **Commit discipline:** one small commit per unit of work, `<type>(v5.2): <what> (<phase>.<step>)`. Before every commit: `npx tsc -b` clean + `npm test` green. Never commit a broken dev build.
5. **FORBIDDEN:** new npm deps (any need → `docs/v52-blocker.md`); files > 500 lines; components > 300 lines; `any`/`@ts-ignore`; raw hex colors, Tailwind raw palette classes (`bg-purple-600` etc.), arbitrary values (`w-[300px]`), inline `style=` outside the documented exceptions in §2.4; modifying `src/core/` contract output, directive text, or `bench/`.
6. **When blocked on a fact** (Excalidraw API behavior, CSS variable availability in the pinned version): write a 10-line spike test file, run it, record the result in `docs/v52-spike-notes.md`, delete the spike, and proceed with the recorded fact. Never guess an API.

### 0.2 Glossary — THE NAMING TRINITY (finalized by the maintainer; adopt everywhere)

| Term | Meaning | Example | Rules |
|---|---|---|---|
| **ID** | immutable, machine, unique | `shp_a3f9` | Generated at creation, never changes, never user-facing in UI chrome (contract only) |
| **Type** | canonical web vocabulary | `Card`, `Navbar`, `Button`, `Input` | Unknown until tagged. One per shape. Determined ONLY by user tagging |
| **Name** | human label | `FollowCard` | Optional. Shown on canvas. Free text, single line, 40 chars max |

**Codebase renaming (mechanical, Phase 1):** `role` → `type` in: `meta.markdraw` field name, `MarkDrawMeta.type`, `roles.ts` exports renamed semantically (`ROLE_NAMES` → `TYPE_VOCABULARY`, keeping a `@deprecated` alias export so old imports still compile during the rename, removed at phase end), `TypeSection` (was RoleSection), UI strings. The **contract output does NOT change format** — the emitted notation stays exactly as today (the compiler maps `type` back to whatever token it emits today; the markdown spec is byte-identical before/after this rename — that is a hard test, see §1.3). Do not rename concepts beyond this trinity: "unit" stays "unit" (a unit has a Name and a base Type), "chip" stays "chip".

---

## PHASE 1 — NAMING TRINITY + CHIP GEOMETRY FIX (foundations)

### 1.1 Rename role→type (mechanical)
Grep `src/` for `role` (case-insensitive) in identifiers, field names, and prop names; rename per §0.2. UI-visible strings: the picker header becomes `Type` (sentence: none — icon + word only, §3.2). localStorage keys: NEW keys `markdraw_*` stay as-is except any containing `role` → new key name with `type`; write a one-time migration: on load, if old key exists and new doesn't, copy value, keep old key untouched. Test both paths.

### 1.2 Chip overlay rewrite (the detach bug)
**Current bug, verified:** `ExcalidrawDriver.getViewport()` returns Excalidraw's `scrollX/scrollY` (screen-space). The overlay computes `(shape.bounds.x + viewport.x) * zoom` — multiplying a screen-space offset by zoom. Correct screen position is:
```
screenX = worldX * zoom + scrollX
screenY = worldY * zoom + scrollY
```
Read `ExcalidrawDriver.getViewport()` and `RoleChipsOverlay.tsx`; fix every chip position computation to the formula above. Also:
- **Anchor:** chip's top-left corner = shape's top-left corner, offset INSIDE by `(6, 6)` screen px (not floating above). When `isFlushWithParentTop` (existing logic, keep), offset by `(6, 18)` screen px instead (visually below a parent's chip).
- **Scale:** chip does NOT scale with zoom — fixed screen size (max-content width, `text-xs`, one line, ellipsis at 80px).
- **Content:** `[Type icon or first 3 letters]` + `Name` if present. Never the ID. Untagged chip (only when lint active): dashed outline, text `?`.
- **Copy button:** root chips show a copy icon ONLY on chip hover, at the chip's right edge, never while moving/dragging (suppress during pointer-down on canvas).
- **Delete the dead `editor` branch** (the tldraw `else if (editor)` path) and its props — the driver path is the only path.
- Style ONLY with tokens (§2.1) + `cn()`. No inline styles except the position (`// v5-token-exception: computed chip position` on that line only).

### 1.3 Byte-stability test
`v52_rename_contract.test.ts`: compile the golden fixture (from `v40_golden_follow_card.test.ts`) BEFORE your rename (save the output string to the test as a literal) and assert the post-rename compile is byte-identical. Also `v52_chip_geometry.test.ts`: stub driver viewport `{x: 120, y: -40, zoom: 0.6}` with a shape at world `(400, 300)`; assert the chip DOM element's computed transform places it at `400*0.6+120, 300*0.6-40 + 6` (i.e. `360, 146`). Exact numbers — do not adjust the test to fit your code; fix the code to fit the test.

**PHASE 1 GATE:** all tests green incl. the two new ones; chips visually attached at zoom 0.5, 1, 2 (screenshots `docs/v52-verification/1/`); contract byte-identical; CI green.

---

## PHASE 2 — REMOVE EXCALIDRAW'S SKIN (full style replacement)

### 2.1 The token authority
`src/theme/tokens.css` is the ONLY file allowed to contain color literals. Restructure to this exact token set (add what's missing, keep existing names that fit):
- Surfaces: `--color-surface-0..4` · Ink: `--color-ink-primary/secondary/muted` · Lines: `--color-line-subtle/strong` · Accent: `--color-accent/-hover` · Semantic: `--color-danger/-success/-warning` · Type-category tints (used by chips, legend, picker, simulation): `--color-type-structure/-content/-interaction/-navigation/-feedback/-platform`.
- Spacing: Tailwind's default 4px scale ONLY. Radius: `--radius-sm 4px, -md 6px, -lg 8px`. Fonts: `--font-sans`, `--font-mono`. Motion: `--duration-fast 120ms, -normal 200ms`.

### 2.2 Excalidraw variable mapping (the upgrade-safe approach)
Create `src/theme/excalidraw-theme.css`. Do NOT write selectors against Excalidraw's class names and do NOT use `!important`. Instead, in the component that mounts `<Excalidraw>` (`ExcalidrawCanvas.tsx`), pass the `theme` prop (dark/light from App state) and add ONE attribute-wrapped block that sets Excalidraw's own exposed CSS variables on `.excalidraw` to our token values, e.g.:
```css
.excalidraw { /* values = var() from tokens.css, listed explicitly */
  --color-primary: var(--color-accent);
  --ui-font: var(--font-sans);
  /* … map every variable the pinned version exposes … */
}
```
**Spike first (§0.2 rule 6):** create a spike that renders Excalidraw, dumps `getComputedStyle(document.querySelector('.excalidraw'))` filtered to `--` variables, and record the full list in `docs/v52-spike-notes.md`. Map every listed variable that has a token counterpart; leave drawing-surface internals (e.g. `--color-selection`) mapped to accent/ink as fits the token roles. Anything with no clear counterpart: record in spike-notes and leave default — do not invent.

### 2.3 Excalidraw UI suppression
Read the pinned version's `<Excalidraw>` props (already in the repo). Set: `UIOptions` per the version's supported shape to disable Excalidraw's welcome screen, and any branded overlays the version supports disabling. Do NOT hack the DOM to remove things the API doesn't allow — record what you disabled in spike-notes and stop there.

### 2.4 MarkDraw-owned chrome
Every MarkDraw surface (panels, modals, toolbar, chips, output, toasts) uses `components/ui/` primitives + tokens. Inline-style exceptions, ONLY these, each with `// v5-token-exception: <reason>`: chip positions (1.2), simulation overlay positions (4.3), panel-resize handle pixels, Excalidraw container fill/size.
**Enforcement upgrade (this failed in v5.1):** extend the token test to fail on: (a) hex literals in any `src/` file except `tokens.css` + `excalidraw-theme.css`, (b) Tailwind raw palette classes (`bg-purple-600` pattern: `(bg|text|border|from|to)-(red|blue|green|purple|slate|gray|zinc|amber|indigo|emerald|rose|teal|sky|orange|lime|pink|cyan|fuchsia|violet|yellow|stone|neutral)-[0-9]`), (c) arbitrary values `\[[0-9]+(px|rem)\]`, (d) `style=` without the exception comment within 2 lines. The test greps source text — make it actually run on all of `src/`. If it fails on pre-existing v5.1 code, FIX THE CODE, never the test.

**PHASE 2 GATE:** token test green on full `src/`; screenshots dark+light (`docs/v52-verification/2/`) where no surface looks stock-Excalidraw (canvas tools inherit mapped colors); CI green.

---

## PHASE 3 — INSPECTOR REBUILD (three modes, progressive disclosure, icon-first)

**Replace the current inspector UX entirely.** One component tree: `components/inspector/` → `InspectorShell` (mode switcher only) + `ModeUntagged` + `ModeTagged` + `ModeCanvas` (new files; delete `CompilerSettingsSection.tsx` and `StyleSection.tsx` from the inspector — see 3.5).

### 3.1 Mode matrix (exact — no other states exist)

| State | Mode | Visible content (in order) |
|---|---|---|
| Nothing selected | `ModeCanvas` | Coverage gauge; roots list (Name + copy icon); 3-icon storyboard (§3.6) |
| 1 shape, untagged | `ModeUntagged` | Type picker (§3.2) + Name input (optional). NOTHING else |
| 1 shape, tagged | `ModeTagged` | Type row; Name row; 3 icon rows (§3.3) |
| N>1 shapes | `ModeTagged` (multi) | Type picker (bulk-assign) + `Save as unit` button only |

Accordion behavior: `ModeTagged`'s three rows are one-open-at-a-time, ALL CLOSED by default.

### 3.2 Type picker (the "What is this?" moment)
- Full-width button showing current Type's icon + word, e.g. `[▭ Card]` — opens a dropdown panel: search input on top, then Type groups with headers (Structure / Content / Interaction / Navigation / Feedback / Platform), each entry = icon + word (+ platform display name when a non-web profile is active, per v5.1 Phase 3 logic — reuse `profileLoader`, don't rebuild).
- Icons (lucide names — use exactly these, no substitutions): page=`Frame`, section=`SquareStack`, card=`IdCard` (fallback `Rectangle`), navbar=`PanelTop`, sidebar=`PanelLeft`, footer=`PanelBottom`, heading=`Heading1`, para=`Text`, img=`Image`, video=`Video`, button=`MousePointerClick`, input=`TextCursorInput`, textarea=`AlignLeft`, select=`ChevronsUpDown`, checkbox=`SquareCheck`, radio=`CircleDot`, switch=`ToggleLeft`, slider=`SlidersHorizontal`, stepper=`Plus`, table=`Table`, tabs=`Tabs`, avatar=`CircleUser`, badge=`Badge`, banner=`Megaphone`, dialog=`PanelTopOpen`, separator=`Minus`, carousel=`GalleryHorizontal`, stat=`ChartNoAxesColumn`, steps=`Footprints`, nav=`List`, group=`Group`, fab=`CirclePlus`, bottom_sheet=`SquareArrowDown`, scaffold=`LayoutGrid`.
- Search matches: Type word, aliases (existing `searchRoles` logic — reuse), platform display names when profile active. Empty query shows categories collapsed to Structure/Content expanded, rest as group headers.

### 3.3 ModeTagged rows (icon-only, exact spec)
Row anatomy: `[icon] <word>  [current-value-chip]  [chevron]`. Height 36px. One row open at a time:
1. **Responsive** — icon `Smartphone`. Open state = the breakpoint segmented control from §4 (reuse the same component — this and the canvas simulation are ONE control, not two).
2. **Behavior** — icon `Zap`. Open state: chips (toggle pills) for ONLY the current Type's allowed flags (existing allow-list from `roles.ts`→`types.ts`). No flag allow-list → row hidden entirely.
3. **Advanced** — icon `SlidersHorizontal`. Open state: parent override dropdown (default `Automatic`), style note field, variants (if the Type has any). Label the parent dropdown `Parent` with helper text `Automatic — from your frames & groups` (the words AABB/infer are BANNED from all UI text).
**Type change behavior (decided by maintainer — implement exactly):** changing Type clears every flag not on the new Type's allow-list, keeps Name, keeps responsive props, and shows NO confirmation dialog (chips update live).

### 3.4 Ban list for UI copy
In all UI text: no "AABB", "infer", "semantic", "IR", "AST", "widget", "lint", "compiler", "threshold", "scope" (as a noun for compile scope). Plain words: "Show issues" (not lints), "Copy contract" stays (product language), "Parent", "Type", "Name". Audit every string in `components/` and `annotation/RoleChipsOverlay.tsx` (→ rename file `ChipsOverlay.tsx`).

### 3.5 Relocation
`CompilerSettingsSection` (thresholds etc.) moves into `SettingsModal` behind a "Advanced" tab — unchanged controls, new home. `StyleSection` (visual styles): DELETE it; style note lives in Advanced row (3.3). Nothing else absorbs them.

### 3.6 ModeCanvas
Coverage: `[icon Gauge] 14/40 tagged` — accent at 100%, warning < 100%. Roots: Name + copy icon (copies that root's contract — reuse existing copy logic from v5.1). Storyboard: three icons `Pencil`→`Tag`→`Copy` with 2-word captions `Draw`, `Tag it`, `Copy`. No paragraphs of text anywhere.

### 3.7 Tests
`v52_inspector_modes.test.tsx`: (a) untagged selection renders Type picker and NOT the three rows; (b) tagged selection renders 3 rows all closed; (c) multi-select renders bulk picker + Save as unit; (d) nothing selected renders coverage + storyboard; (e) changing Type removes disallowed flags (fixture: dialog→button clears `draggable` if absent from button's list — write the fixture against the real allow-list, don't hardcode assumptions); (f) ban-list words absent from rendered DOM.

**PHASE 3 GATE:** all mode tests green; screenshots of all 4 modes + open rows (`docs/v52-verification/3/`); a person who has never seen the app can tag a shape with ZERO words they don't understand (walk the golden path; list every visible string in the doc — every string must be in this spec or the ban-list-clean vocabulary). CI green.

---

## PHASE 4 — RESPONSIVE = BREAKPOINT CONTROL IN THE INSPECTER (and canvas preview)

### 4.1 The one control (fixed trio — decided by maintainer)
New shared component `components/ui/BreakpointSwitch.tsx` — segmented control, EXACTLY three options: `Monitor` icon `Desktop 1200` / `Tablet` icon `768` / `Smartphone` icon `375`. Icons + numbers only (no word "px" clutter beyond the number). Props: `value: 1200|768|375`, `onChange`, `disabled?`.

### 4.2 Where it lives
- In `ModeTagged` Responsive row (§3.3 row 1) — controlling the **root of the selected shape**.
- It appears ONLY when: selected shape's root frame has Type `page` + `responsive` flag. Otherwise the Responsive row shows disabled text `Turn on Responsive on the page first.` (and the page frame's inspector shows the `responsive` flag as its first Behavior chip).
- **There is no floating toolbar, no separate "Simulate" UI, no width slider.** Delete `components/simulation/` toolbar pieces that implement the floating bar; keep the reflow core (`src/core/reflow.ts`) — it was verified good.

### 4.3 Canvas preview (reuses reflow)
When a breakpoint ≠ 1200 is selected for a root: the existing `ReflowPreview` renders inside that root's bounds at that width (existing component; re-point it at the new control; delete the old slider/trigger code). The root chip shows the current breakpoint icon. Preview stays until the control returns to `Desktop` or the root is deselected. Never mutates shapes (assert in `v52_sim_nondestructive.test.ts`: `listShapes()` deep-equal before/after). Contract unchanged — `sm:`/`order` tokens emit exactly as v5.1 (regression test `v51_responsive_emit.test.ts` must stay green untouched).

**PHASE 4 GATE:** breakpoint trio flips the preview live (screenshots 1200/768/375 of the two-column fixture stacked at 375); no floating simulation UI remains (grep `Simulate` in `components/` → only the disabled-hint string); tests green; CI green.

---

## PHASE 5 — FINAL PASS

1. `docs/v52-verification/FINAL.md` — HONEST: every "verified" claim names its test file or screenshot. Test count, bench 20/20, token test green on full src, the string-audit list from §3.7's walk.
2. README: add v5.2 section describing Type/Name/ID, breakpoint preview, redesigned inspector — plain language, no superlatives, no "revolutionary/eliminates/proven" (ban list from the honest-README rules).
3. Version → `5.2.0`. Move this file to `docs/history/`. Full checks: `tsc -b`, `npm test`, `npm run build`, `npm run bench` (20/20), file-size, import-boundary, token test.
4. STOP. Do not merge. Report the FINAL doc and await review.

---

## APPENDIX — DECISIONS ALREADY MADE (do not re-open)
- Changing Type resets disallowed flags, keeps Name + responsive props, no dialog.
- Breakpoints: fixed 1200/768/375, not user-definable.
- Icons: exactly the lucide names listed in §3.2/§3.3/§3.6/§4.1 — no substitutions.
- Inspector modes: exactly 4 (§3.1 matrix) — nothing else renders.
- Parent override default is Automatic; AABB vocabulary banned.
- Contract format: byte-identical through this entire version.