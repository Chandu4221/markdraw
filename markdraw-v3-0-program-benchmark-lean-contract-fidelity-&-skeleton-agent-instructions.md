# MarkDraw v3.0 Program — Agent Instructions

**Repo:** `github.com/Chandu4221/markdraw` (current state: v2.8 — style axes, behavior flags, AI directive, Tailwind/shadcn UI, all tests green)

**Program summary (5 stages, in this order — do NOT reorder):**

| Stage | Version | Theme | Why here |
|---|---|---|---|
| 1 | v2.9 | Lean contract & correct nesting | Fixes 79% boilerplate + fragile hierarchy — prerequisite for a fair benchmark |
| 2 | v2.10 | Preview fidelity (end-user visuals) | lorem/SVG previews + `[Text Placeholder]` — makes the tool usable by non-creators |
| 3 | v3.0 | Benchmark harness | Validate the core claim BEFORE building integration — decision gate |
| 4 | v3.1 | Skeleton exporter (HTML+Tailwind) | Makes compliance machine-checkable; insurance against vision-model improvements |
| 5 | v3.2 | Round-trip + schema + MCP | Closes the loop; distribution channel |

**Hard rule:** Stage 3's decision gate must run before Stage 4/5 work begins. If the benchmark fails, stop after Stage 3.

---

## STAGE 1 — v2.9: Lean Contract & Correct Nesting

### 1.1 Legend: auto-generated from canvas, OFF by default
- **Auto-generation:** the legend is derived from the widgets actually present on canvas (union of widget types used + flags actually set + style axes actually emitted). A canvas with 9 widget types emits a 9-row legend, not all ~54. Legend only documents what the AI will actually encounter in THIS document.
- **Off by default:** the spec tab emits directive + spec only. New "Copy full contract" button (next to existing copy) = directive + full auto-legend + spec. Settings toggle `includeLegend` (default false).
- Directive shrinks to two lines:
  > This is a binding layout contract from MarkDraw v2.9. Follow every tag, id, count, placement, width, align, and flag EXACTLY; render positions relative to the parent even if unconventional. `[Text Placeholder]` means you MUST generate content (only sanctioned improvisation); everything unspecified (colors, type, imagery) is your freedom — if the contract is impossible, say so instead of deviating.
- Token budget: boilerplate ≤ 25% of total output on the demo canvas (verify with a test that counts chars).

### 1.2 Stable node IDs & strict nesting
- Every IR node gets a short stable ID (`w-a3f` style: hash of tldraw shape id, base36, collision-checked). Emitted in the spec table as a `#id` column entry merged into the Path column: `Root > #k2p > #m8x`.
- Paths stop using labels entirely — label collisions can no longer produce ambiguous paths.
- **Explicit parent binding:** shapes gain an optional `parentId` prop (set when created inside a container, editable in PropsPanel as a dropdown of candidate ancestor shapes). Containment algorithm becomes: explicit `parentId` first; geometric enclosure (0.85 threshold) only as fallback for shapes without it.
- **Depth is unlimited and explicit:** Parent → Child → Grandchild → Great-grandchild renders as nested rows with the tree visible in Path indentation. Add a compile lint when any non-page widget is deeper than 3 levels (informational only, not an error).
- Containment edge lint: when geometric fallback assigns a child whose enclosure is < 0.92, emit a canvas warning badge "loosely contained — drag fully inside or set parent explicitly."

### 1.3 Explicit counts & dims
- `avatar_group`, `list`, `steps`, pagination, tabs: emit required item counts explicitly (`[list 5]` stays, but props column gains `count:5`; groups detected by pattern emit `count:N` per child too).
- Grids always spell out: `4 cols × 3 rows` in props (keep `[grid 4x3]` tag).
- Directive gains the binding-counts line: `N × [pattern] and all counts are binding, not suggestions.`

### 1.4 `[Text Placeholder]` contract phrase
- Replace `"content: unspecified"` everywhere with `"content: [Text Placeholder]"`.
- Legend row (auto-gen): `| [Text Placeholder] | placeholder content should be filled with dummy data | — |`
- Directive references the same token (already in 1.1's wording).

### 1.5 Noise suppression & lints
- Suppress `dist` inference on containers with a single flow row (no information).
- Suppress width tokens when all siblings in a parent share the same bucket.
- Lint: "N cards directly under page — consider grouping in a section" (informational banner in output pane, not in contract).

### 1.6 Hygiene (all in this stage)
- Delete legacy `buildHierarchy` from `compiler.ts` (v2.5 dead code) and the stale `LegendEngine` heuristic resolver in `legend.ts`.
- Replace O(n²) containment with a simple sweep-line / sort-by-area spatial pass.
- Remove `any` casts in `src/core/` (introduce precise types; `unknown` + narrowing).
- Unify versions: single `MARKDRAW_VERSION = '3.0.0'` constant, package.json → 3.0.0, README badge reads from it.
- Move all `markdraw-v2-*.md` instruction files to `docs/history/`.
- CI: typecheck + test + build workflow (exists in `.github` — extend with build step).

**Tests:** nesting via explicit parentId (incl. overrides and missing-parent fallback), ID stability/collision, legend auto-gen from used widgets, lean-output token budget, `[Text Placeholder]` emission, count/dim emission, lint triggers. All existing tests stay green (update fixtures for the new phrases).

---

## STAGE 2 — v2.10: Preview Fidelity (end-user visual feedback)

### 2.1 Render modes (canvas toolbar toggle, persisted in settings)
- **Skeleton** — current: glyphs, empty boxes.
- **Annotated** (new default) — lorem ghost text + SVG image fills + chips.
- **Realistic** — same as Annotated plus `note` hints visualized (e.g. parallax hero shows motion-hint hatch) and richer sample chrome per widget.

### 2.2 Lorem ghost text (no new deps)
- One static lorem paragraph constant. Per widget, slice by stable offset derived from shape-id hash (`lorem.slice(off, off + n)`), so neighbors differ and re-renders are identical.
- Applied per widget type: `[para]` → 2–3 lines; `[card]` → title + 2 lines; `[input]`/`[search]` → plausible-ish placeholder text (static dictionary: "you@example.com", "Search…"); `[kpi]` → "1.2k"-style static samples; `[nav]`/`[tabs]` → "Home, About, Docs".
- **Ghost only:** text renders in the preview but is NEVER stored in props — compile output contains `[Text Placeholder]`, not lorem. Compile is mode-invariant (test asserts identical output across all three modes).

### 2.3 SVG image fills (no network, no URLs)
- `image_frame`, `img`, `video_frame`, `carousel` slides: seeded-by-shape-id local SVG pattern (soft diagonal hatch / cross-hatch / simple scene shapes), muted token colors, plus small "IMG" glyph. Deterministic: same shape → same fill.

### 2.4 Affordance additions
- Palette thumbnails render in Annotated mode (shared WireframePreview host — thumbnails now visually distinguish card/section/split).
- Hover tooltip on canvas widgets: name + tag + key props (`Card — [card] — variant: elevated`).
- Settings: default render mode.

**Tests:** mode invariance of compile; lorem slicing stability; SVG seed determinism. QA: both themes, worker compile unaffected.

---

## STAGE 3 — v3.0: Benchmark Harness (THE DECISION GATE)

### 3.1 Fixture corpus
- `bench/corpus/`: 20 wireframe documents as JSON fixtures (tldraw shape arrays, same schema as documents.ts): 5 conventional pages, 5 unconventional layouts (floating nav, asymmetric splits, 50% bands), 5 form/dashboard-heavy, 5 mobile-width pages.
- Each fixture has a `contract.json`: the ground-truth assertions (expected widget types, counts, nesting, placement, widths, flags).

### 3.2 Harness (`bench/runner.ts`, runnable via `npm run bench`)
- For each fixture, produce three prompt payloads: (a) screenshot-style description (render ASCII tab as the "image proxy" baseline PLUS an actual PNG export if feasible via tldraw `toImage`), (b) lean markdown spec, (c) JSON AST.
- Prompt template asks the model to produce a single-file HTML+Tailwind page implementing the wireframe.
- **Automated scoring** (no vision judging): parse returned HTML (use a lightweight parser dep, allowed here) and assert against `contract.json`: element counts by widget type, hierarchy (nav contains links, section contains cards), sticky/fixed flags → `position: sticky/fixed` present, width buckets → element width classes, order of sections. Score = % assertions passed, plus token cost measured.
- Model + key configurable via env (`BENCH_MODEL`); results written to `bench/results/<date>.json` and a summary table printed.

### 3.3 Decision rule
- Run with the patched directive. Spec must beat the screenshot baseline by ≥ 15 points average across the corpus AND win on token cost. Record results honestly.
- **If it wins:** proceed to Stage 4. **If not:** stop, write up findings in `bench/REPORT.md`, treat the project as portfolio-grade.

**Tests:** contract-assertion functions are pure unit-tested code. Harness determinism (same outputs → same prompts).

---

## STAGE 4 — v3.1: Deterministic Skeleton Exporter

### 4.1 Compiler output: HTML + Tailwind, no LLM
- New serializer `src/core/skeleton.ts` (pure, DOM-free — emits a string): IR tree → semantic HTML (`<nav>`, `<header>`, `<main>`, `<section>`, `<footer>`, `<button>`, `<ul>`, `<figure>`) with Tailwind utility classes.
- Style axes map to real CSS: `width:50%` → `w-1/2`; `align:center` → `mx-auto`; `dist:space-between` → flex `justify-between`; `sticky` → `position: sticky; top: 0` (inline style block); `fixed`, `overlay`, `fullscreen` similarly literal.
- `[Text Placeholder]` renders as visible placeholder markup (`<p class="...">[Text Placeholder]</p>` or Tailwind skeleton blocks).
- Fifth output tab "Skeleton" + copy/download (`<docname>.html`); generated file is standalone-viewable (CDN Tailwind or minimal inline CSS).

### 4.2 Polish prompt companion
- "Copy polish prompt" button: a short prompt containing the skeleton + spec with the directive, instructing an LLM to decorate without changing structure.
- Compliance checker `src/core/checkSkeleton.ts`: given skeleton HTML, assert every contract flag appears as real CSS — this is the programmatic compliance test that also feeds Stage 3's scoring.

**Tests:** per-widget golden skeleton outputs (small fixtures → exact HTML strings); flag→CSS mapping table fully covered.

---

## STAGE 5 — v3.2: Round-Trip, Schema, MCP

### 5.1 Markdown → canvas importer (close the loop)
- `src/core/importSpec.ts`: parse the lean spec markdown (IDs make node addressing deterministic) back into shape updates; UI: paste into a new "Import spec" dialog → diff view (added/changed/removed nodes highlighted) → apply/reject per node. AI edits become reviewable diffs.

### 5.2 JSON schema
- Publish `schema/markdraw-ast.schema.json` for the JSON AST (generated from `types.ts` types via a type→schema step, or hand-written + type-tested). Output lints against it in CI.

### 5.3 MCP server
- `mcp/` (separate package in repo): stdio MCP server exposing `list_documents`, `get_wireframe` (returns lean spec / JSON / skeleton), `update_node` (applies spec edits via 5.1 logic), `render_ascii`. Requires the app running with a local bridge endpoint; document setup for Claude Code/Cursor in README.

**Tests:** importer round-trip (export → import → identical compile), schema validation of all fixtures, MCP tool smoke tests.

---

## Global Constraints (all stages)

- No new runtime deps except: an HTML parser for `bench/` scoring (dev-only), and Tailwind/shadcn (already present). No faker, no network image URLs, ever.
- `src/core/` stays pure/DOM-free; every new core module is unit-tested; compile output remains deterministic and now mode-invariant.
- Closed vocabulary: flags/axes fixed lists; `[Text Placeholder]` and `note:"..."` are the only free-text constructs, both explicitly non-binding for content but the structure remains binding.
- Do not touch the 6-column spec layout except: Path column gains IDs, Props gains `count`/dims — no new columns.
- Stage order is contractual: 1 → 2 → 3 → (gate) → 4 → 5. Commit per stage; update README + single version constant per stage (2.9.0, 2.10.0, 3.0.0, 3.1.0, 3.2.0).