# MarkDraw v2.6 — Agent Instructions (Tier 1 Polish)

**Repo:** `github.com/Chandu4221/markdraw` (current state: v2.5 — clean IR, wireframe renderer, props panel, ~40 widget catalog, 4 output tabs, tests, monochrome tokens)

**Goal:** Output hygiene, placement semantics, and UI polish. This is a focused quality patch — NO new widget types, NO architecture changes.

---

## Task 1 — Output Hygiene (spec table serializer)

**Problem:** Every row currently emits `checked=false, showText=false` etc. — default-valued props are noise that dilutes AI signal.

**Fix in the Spec Table serializer (`src/core/`):**

1. Compute each widget's **default prop set** from `widgetCatalog.ts` (each catalog item already declares `defaultProps`).
2. Emit a prop in the `Props & Attributes` column **only if** its value differs from the catalog default. Empty column when all props are default → render as `—`.
3. Same rule for the JSON AST tab: omit default-valued props.
4. Untouched labels: if a widget's `label` equals its catalog default (user never edited it), emit the bare notation — `[btn]` not `[btn "Save Changes"]` — and in the `Children / Content` column write `"content: unspecified"`. This explicitly signals the AI should invent content, instead of leaking misleading defaults like "hero-banner" and "Lorem ipsum".
5. The legend block gains one line: `_bare tags (e.g. [btn]) mean the user left the content unspecified — generate appropriate content._`

**Acceptance:** compiling the default demo canvas produces rows with `—` prop columns and bare tags; no `checked=false` anywhere; both markdown tabs deterministic (byte-identical on recompile).

---

## Task 2 — Placement Semantics (fixes "navbar appeared from nowhere")

**Problem:** The AI receiving markdown inferred footer nav = header navbar, because placement is not explicit.

**Fix — add an inferred `Placement` column to the spec table:**

1. After the containment tree is built, for each **top-level child of a `[page]` root**, infer placement from geometry relative to the page box:
   - Vertical band at top (top edge within top 15% of page height, width ≥ 70% of page) → `header`
   - Bottom band (analogous) → `footer`
   - Otherwise → `body`
2. Add column `Placement` with values `header | body | footer | nested` (all non-top-level shapes get `nested`).
3. The widget type stays as-is (`footer_nav` in a `header` placement is the user's choice; the AI sees both signals).
4. Legend gains: `Placement: header/body/footer = position band within the page; nested = inside another container.`
5. Also emit `Layout Flow` for ALL containers consistently — currently some leaves show `Leaf` inconsistently; standardize: containers get `Row|Column`, leaves get `—`.

**Acceptance:** the demo canvas (footer_nav at bottom, hero at top) compiles with `Placement: footer` on the footer_nav row.

---

## Task 3 — Sibling Pattern Grouping (the "4 cards" inference)

**Problem:** A section containing `para, img, btn` × 4 renders as a flat 12-element list; the AI had to guess grouping.

**Fix — pattern detection in the spec serializer (not the tree):**

1. For each container, scan its direct children in order; detect **k ≥ 2 consecutive identical widget-type sequences** (same types, same length 2–4, e.g. the repeating `[para, img, btn]` triple).
2. When detected, emit the children column as: `4 × [para, img, btn] (repeated group — likely card/list items)` instead of the flat list.
3. Keep the detailed per-child rows in the table (paths unchanged) — only the parent's `Children / Content` summary changes.
4. Add to legend: `N × [pattern] = N visually repeated sibling groups; treat as list/grid items with per-item content variation.`
5. Make the detection a pure function with unit tests (sequences of 1, 2, mixed, and no-pattern cases).

**Acceptance:** the demo features section emits `4 × [para, img, btn] (repeated group — likely card/list items)`.

---

## Task 4 — Panel Transition Smoothness

**Problem:** Left palette animates smoothly; right output pane and canvas snap instantly during/after resize.

**Fix in `App.tsx` + `App.module.css`:**

1. Add `transition: width 0.18s ease` to `.canvasContainer` and `.outputContainer`.
2. Add a class `.resizing` (applied to both while `isDragging` is true) that sets `transition: none !important` — so live dragging tracks the mouse 1:1.
3. Remove the transition on mount/first paint only if it causes a visible flash (test both themes).
4. The resizer drag overlay (`draggingOverlay`) stays as-is; ensure `outputContainer` keeps `min-width: 250px`.

**Acceptance:** preset buttons (Canvas Focus / 50/50 / Code Focus) animate both panes smoothly; manual drag has no transition lag and no snap on release.

---

## Task 5 — Semantic Chip Consistency (WireframePreview)

**Problem:** Some components show a corner label chip (`SECTION`, `HERO`, `FOOTER NAV`, `FOOTER`), others don't — inconsistent.

**Fix — one uniform rule in `WireframePreview.tsx`:**

1. **Containers** (any widget whose role is `container`: section, card, hero, modal, navbar, sidebar, header, footer, split, grid, table-container, alert, tabs, breadcrumb, pagination): render the chip — widget type uppercase, 9px, muted, top-left.
2. **Leaf widgets** (button, input, text, icon, img, divider…): no chip — their rendering self-describes.
3. Extract chip rendering into a single shared `Chip` element inside WireframePreview so all containers use identical styling/position.
4. Add a canvas-level toggle in the control bar: **"Labels"** on/off (persisted in localStorage with the settings), which hides/shows all chips at once.

**Acceptance:** every container widget shows an identical-style chip; no leaf has one; toggle works and persists.

---

## Task 6 — Version & Determinism Verification

1. Add a `MARKDRAW_VERSION` constant (`2.6`) emitted in the legend header: `**MarkDraw v2.6 — Semantic Layout**` so downstream AI/agents know which notation contract they received.
2. Verify: no timestamp in any output tab by default (settings toggle already exists — confirm it applies to all four tabs including JSON).
3. Verify determinism: run compile twice on the same canvas, diff outputs — must be byte-identical.

---

## Build Order

1. Task 1 (output hygiene) — serializer + catalog defaults
2. Task 2 (placement) — geometry inference + new column
3. Task 3 (pattern grouping) — pure function + tests first
4. Task 4 (transitions) — CSS + drag class
5. Task 5 (chips) — WireframePreview + toggle
6. Task 6 (version/determinism) — constant + verification pass
7. Full QA: both themes, both preset transitions, recompile diff, all 6 test files green, demo canvas end-to-end.

## Constraints

- No new runtime dependencies.
- No new widget types.
- `src/core/` stays pure/DOM-free; all new core logic gets unit tests.
- Monochrome tokens only; no hardcoded colors.
- Keep all existing tests passing; extend, don't rewrite, serializers.