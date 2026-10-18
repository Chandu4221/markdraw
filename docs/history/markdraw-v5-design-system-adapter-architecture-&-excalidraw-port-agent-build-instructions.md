# MarkDraw v5 — Design System · Adapter Architecture · Excalidraw Port — Agent Build Instructions

**Repo:** `github.com/Chandu4221/markdraw` · **Base:** `v4-annotation` branch at `b107d14` (v4.0.0, all tests green)
**Branch:** create `v5-canvas-adapter` from `v4-annotation`. **All work on this branch. Never touch `main`.**

---

## 0. HOW TO READ THIS DOCUMENT (anti-hallucination rules)

This is an exhaustive spec. Anything not specified: implement the minimal version that violates no rule, note the decision in the commit message. Do not invent.

**FORBIDDEN — never:**
1. Add npm dependencies beyond: `@excalidraw/excalidraw`, `esbuild` (CLI, dev-only), and existing deps already in `package.json`. If a task needs anything else: stop, write `docs/v5-blocker.md`, await instructions.
2. Let any tldraw or Excalidraw type appear outside `src/canvas/<vendor>/` or `src/canvas/vendor/`. Check with grep in CI (§14).
3. Create files > 500 lines (rule in §9.4). Existing god files must be DECOMPOSED, not extended.
4. Change compiler output format, directive text, or any `§`-referenced contract strings from v4 (§5.2 lists the only permitted header change).
5. Skip a phase gate. On failure: stop, write `docs/v5-gate-report.md`.
6. Use `any`. Use raw hex colors, arbitrary Tailwind values (`w-[387px]`), inline `style=` (except documented exceptions §8.3), or new raw CSS files outside `src/theme/`.
7. Touch `bench/`, `src/core/__tests__/` assertion semantics, or the v40_* golden outputs.
8. Ship any phase with `tsc -b` errors, failing tests, or a failing build.

**REQUIRED — always:**
- Every phase ends: `npx tsc -b` clean · `npm test` green · `npm run build` succeeds · `npm run bench` passes 20/20 fixtures.
- New modules get unit tests. Every commit message cites the section implemented.
- Exact strings in this document are copied character-for-character.

**One-line thesis:** v5 swaps the editor from tldraw to Excalidraw (MIT) behind a **port/adapter architecture**, unifies all styling under **Tailwind v4 tokens** (killing `tl-overrides.css` and the two styling dialects), decomposes the god components, and adds an **import-boundary enforcement** so the next editor swap is a one-folder change. The compiler, annotation layer, and contract are untouched.

---

## 1. CURRENT STATE (verified at b107d14 — the map you build against)

```
src/
  App.tsx 45KB               — hosts Tldraw editor directly (THE coupling to kill)
  annotation/               — types, roles, units, migrate, shapeMeta, roleDefaults,
                               RoleChipsOverlay.tsx (7.9KB), profiles/{web,android-material}.json — SURVIVES
  components/               — DocumentMenu, ErrorBoundary, LegendModal, MarkdownPreview,
                               RolePanel.tsx 37KB (god file), SettingsModal, ShortcutsModal,
                               UnifiedInspectorPanel.tsx 60KB (god file), ui/ (Radix primitives)
  core/                      — compiler, ir, ids, style, patterns, notation, legend, directive,
                               ascii, documents, compile.worker, types, CompilationOptionsContext — SURVIVES UNTOUCHED
  theme/                     — tokens.css 8.9KB, tl-overrides.css 12.7KB (TO BE DELETED in Phase 3)
  lib/                       — utils (cn)
package.json: tailwindcss ^4.3.3, @tailwindcss/vite, cva, tailwind-merge, radix set, lucide — stack confirmed
```

Verified gaps: no `src/canvas/` layer; no ESLint at all; CI is deploy.yml only; two styling dialects (Tailwind components + tl-overrides.css); 3 UI generations (v2-era modals, v4 panels, tldraw-patched chrome).

---

## 2. TARGET ARCHITECTURE (hexagonal — the destination)

```
src/
  app/                       — React shell, wiring ONLY (composition root)
  components/                — UI components, styled ONLY via Tailwind tokens + ui/ primitives
  domain/                    — annotation/ (roles, units, migrate, shapeMeta), compile services
  canvas/
    port/                    — CanvasDriver.ts, CanvasShape.ts, ports.ts (interfaces ONLY)
    tldraw/                  — Phase 1: the existing editor behind the port (then deleted in Phase 3)
    excalidraw/              — Phase 3: the new editor implementing the same port
  core/                      — untouched deterministic compiler
  theme/                     — tokens.css (the single styling authority); tl-overrides.css dies
```

**Dependency rule (mechanically enforced, §14):** `core` imports nothing external · `canvas/port` imports nothing but types · `canvas/<vendor>` imports `canvas/port` + `core` only · `app`/`components` import everything downward. **Never upward, never sideways.**

---

## 3. THE PORTS (src/canvas/port/ — write these interfaces verbatim)

```ts
// CanvasShape.ts — MARKDRAW'S OWN MODEL. Never a vendor type.
export type ShapeKind = 'frame' | 'group' | 'rect' | 'ellipse' | 'diamond'
  | 'text' | 'arrow' | 'line' | 'path' | 'image';
export interface CanvasShape {
  id: string;
  kind: ShapeKind;
  bounds: { x: number; y: number; w: number; h: number; rotation: number };
  parentId: string | null;
  name: string | null;
  text: string | null;              // for text shapes / labels
  arrowEndpoints: { start: string | null; end: string | null } | null; // arrow only
  meta: Record<string, unknown>;   // OPAQUE — annotation layer owns meta.markdraw parsing
}
export interface Viewport { x: number; y: number; zoom: number }

// CanvasDriver.ts
export interface CanvasDriver {
  // reads
  listShapes(filter?: { ids?: string[]; kinds?: ShapeKind[] }): Promise<CanvasShape[]>;
  getShape(id: string): Promise<CanvasShape | null>;
  getViewport(): Viewport;
  // writes
  createShape(s: Omit<CanvasShape, 'id'> & { id?: string }): Promise<string>;
  updateShape(id: string, patch: Partial<CanvasShape>): Promise<void>;
  deleteShape(id: string): Promise<void>;
  groupShapes(ids: string[]): Promise<string>;          // returns new group id
  // events — granular diffs, the ONLY change channel
  onShapesChanged(cb: (diff: { created: string[]; updated: string[]; deleted: string[] }) => void): Unsubscribe;
  onSelectionChanged(cb: (ids: string[]) => void): Unsubscribe;
  // ui commands
  setSelection(ids: string[]): void;
  panTo(id: string): void;
  copyToClipboard(text: string): Promise<void>;
}
export type Unsubscribe = () => void;

// PersistencePort.ts — abstracts documents.ts storage
export interface PersistencePort {
  loadDocument(id: string): Promise<StoredDocument | null>;
  saveDocument(doc: StoredDocument): Promise<void>;
  listDocuments(): Promise<DocumentMeta[]>;
  exportDocument(id: string): Promise<Blob>;
  importDocument(blob: Blob): Promise<StoredDocument>;
}
```

`StoredDocument` = vendor-neutral scene `{ shapes: CanvasShape[]; units: UnitDefinition[]; docVersion: number; schema: 1 }`. The annotation layer's `shapeMeta.ts` parse/serialize functions are moved to `domain/` and take `CanvasShape`, never vendor shapes.

**Migration note:** v4 documents store tldraw-native shapes. Phase 1 introduces `v5-export.tldraw.ts` inside `canvas/tldraw/` that converts loaded tldraw scenes to `CanvasShape[]` at load time. Phase 3 adds `v5-export.excalidraw.ts`. Both produce the SAME neutral scene; migration tests (§15) run the golden fixture through both.

---

## 4. THE DESIGN SYSTEM (src/theme/ — single authority)

**tokens.css (Tailwind v4 CSS-first config) — restructure to this exact shape:**
```css
@import "tailwindcss";
@theme {
  /* color: one surface scale, 3 semantic hues, 1 accent. NO hex outside this file. */
  --color-surface-0 … --color-surface-4;      /* app chrome → panels → cards → inputs */
  --color-ink-primary / -secondary / -muted;   /* text */
  --color-line-subtle / -strong;               /* borders */
  --color-accent; --color-accent-hover; --color-danger; --color-success;
  --color-role-chip-bg / -text; --color-untagged-chip-bg / -text; /* chips language */
  /* spacing: 4px base scale only: --spacing-1..16 (map to Tailwind's default scale) */
  /* radius: --radius-sm 4, -md 6, -lg 8, -full */
  /* typography: --font-sans, --font-mono (contract preview); sizes 12/14/16/20/24 only */
  /* motion: --duration-fast 120ms, -normal 200ms; one easing */
}
```
**Rules:**
1. `tl-overrides.css` is FROZEN in Phase 1 (no growth), SHRUNK in Phase 2 (replace whatever tokens.css can cover), DELETED in Phase 3 (Excalidraw is styled via its own theming API + tokens).
2. Every component consumes tokens (`bg-surface-1`, `p-3`, `rounded-md`) or `cn()`-composed classes. cva variants for stateful components. NO arbitrary values, NO inline styles — permitted exceptions ONLY: (a) panel resize handles (pixel positions), (b) tldraw/Excalidraw container (z-index/width), (c) role-chip absolute positions (computed). Each exception needs a `// v5-token-exception: <reason>` comment.
3. `ui/` primitives (Button, Dialog, Select, Tabs, Tooltip, Switch, Slider, ScrollArea, Separator from Radix + cva) are the ONLY raw-styling surface. All other components compose them.
4. **Three UI generations → one:** restyle DocumentMenu, SettingsModal, LegendModal, ShortcutsModal to the same tokens/anatomy as RolePanel/inspector. Standard **panel anatomy** (enforced by a shared `Panel` primitive): header (title + actions) → toolbar row → scrollable content → footer; standard **modal anatomy** via ui/Dialog.
5. **Chip grammar (the on-canvas semantic language):** role chips (filled, accent-tinted), unit chips (name + composition icon), untagged chips (dashed outline, muted). One component `RoleChip`, reused everywhere incl. lints and legend rows.
6. **Contract preview identity:** `MarkdownPreview` restyled as the product face — mono font, syntax-colored bracket tags (`[button "Follow"]` tags in accent, props in secondary), copy button with success animation. Same tokens, distinct treatment.

---

## 5. APP DECOUPLING (what App.tsx / panels stop doing)

5.1 **App.tsx 45KB → `app/` composition root ≤ 400 lines.** It builds `{ canvas: CanvasDriver, persistence: PersistencePort, compile: MarkDrawCompiler }` and injects. No component receives a vendor editor handle — only the driver interfaces.

5.2 **UnifiedInspectorPanel.tsx 60KB → decompose** into `components/inspector/` modules, each ≤ 300 lines: `InspectorShell` (accordion container), `RoleSection`, `HierarchySection`, `StyleSection`, `ResponsiveSection`, `PropsSection`, `UnitSection`, `LintSection`. Same UX, smaller pieces.

5.3 **RolePanel.tsx 37KB → decompose** into `components/rolepanel/` (same split). **RoleChipsOverlay.tsx stays one file** (it's cohesive) but re-renders from `CanvasDriver.onShapesChanged`, not vendor events.

5.4 **Compiler binding:** panels call `compile({ scope, platform })` via a thin `CompileService` (existing `CompilationOptionsContext` refactored into it). Compiler internals untouched.

---

## 6. EXCALIDRAW ADAPTER (src/canvas/excalidraw/ — the Phase 3 core)

**Capability audit FIRST (write `docs/v5-excalidraw-audit.md` before coding the adapter):**
- Excalidraw element model (`ExcalidrawElement`: type rect/ellipse/diamond/text/arrow/line/frame + `customData`) — verify `customData` persists through save/load (it does in current versions; TEST IT and record the version pinned).
- **Frames:** confirm frame support + elements-in-frame binding (`frameId` / boundElements). Map frame→our `frame` root semantics.
- **Groups:** Excalidraw groups = `groupId` on elements (no group entity). The driver's `groupShapes` sets a shared `groupId`; `CanvasShape.parentId` for grouped members = the group's *virtual* id (`virtual:<groupId>` — the IR parent-resolution in `shapeMeta` must accept this form).
- **Arrows:** `startBinding`/`endBinding` element ids → `arrowEndpoints`.
- **Rendering React side:** `<Excalidraw excalidrawAPI={api} initialData={...}>` — the driver owns `api`. UI props: minimal chrome, dark mode off, undo/redo ON.
- **Gaps to record honestly:** no native rotation of frames?, text-in-shape behavior, deletion semantics, z-order behavior. Each gap → a lint or UI note, NEVER silently wrong IR.

**Driver mapping rules:**
- `createShape` → `api.updateScene({ elements: [...scene, newElement] })`; every write is a full-scene atomic update (Excalidraw has no single-element mutation API) — keep scenes small; it's fine at wireframe scale (<500 shapes).
- `onShapesChanged` → subscribe `api.onChange((elements, state) => …)` and diff against the last-seen neutral scene; emit only created/updated/deleted id lists.
- `meta` → `customData.markdraw` (typed as our `MarkDrawMeta` at the domain layer; `unknown` at the port layer).
- **Persistence:** Excalidraw's own `.excalidraw` JSON is NEVER the saved format. We save our neutral `StoredDocument`; `initialData` is reconstructed from it on load. This keeps documents editor-agnostic forever.

---

## 7. TLDRAW ADAPTER (src/canvas/tldraw/ — Phase 1, deleted in Phase 3)

Wrap the existing `<Tldraw>` usage: `TldrawDriver implements CanvasDriver` mapping `TLShape`→`CanvasShape` (frame→frame, group→group via `TLParentId`, geo variants→kinds, arrow bindings→`arrowEndpoints`, `shape.meta`→meta). This is mostly re-routing existing code in App.tsx/RoleChipsOverlay into the adapter folder. It MUST pass all existing v40_* and core tests unchanged — that's Phase 1's gate.

---

## 8. CLI (reach item — Phase 4, pure core, no editor)

`src/cli/compile.ts` (esbuild-built to `bin/markdraw`):
- `markdraw compile <file.md.json> --root <id|name>` — file = exported `StoredDocument` JSON; emits the lean contract to stdout. `--platform web|android-material`, `--scope all|<id>`.
- Reuses `MarkDrawCompiler` against neutral scenes — proves the adapter architecture headlessly (no React import in the CLI path).
- Add `pre-commit`/CI check that the CLI compiles the golden fixture byte-identically to the in-app output (same compiler, same determinism).

---

## 9. HARD ARCHITECTURE RULES

9.1 No god objects: no editor handle passed around, no mega-context; DI at `app/` only.
9.2 `CanvasShape` is the only shape type that crosses module boundaries.
9.3 Persistence format is vendor-neutral (`StoredDocument`) — old tldraw docs convert on load via the export in §3; keep the backup-before-migrate behavior from v4.
9.4 **File size rule:** no source file > 500 lines; components ≤ 300. Enforced by a `scripts/check-file-size.mjs` CI step (max 500, warn 400).
9.5 One-way dependencies (§2) enforced by `scripts/check-imports.mjs` (§14).
9.6 Determinism preserved: same neutral scene → byte-identical contract regardless of editor. New test `v50_editor_invariance.test.ts`: golden fixture compiled via tldraw-loaded scene === via excalidraw-loaded scene === via CLI.

---

## 10. TAILWIND / STYLE ENFORCEMENT

10.1 ESLint introduced (Phase 1): `eslint` + `@typescript-eslint` + `eslint-plugin-tailwindcss` (dev-only — this is the one permitted lint-dep addition; if blocked, implement §14 grep checks instead).
10.2 Custom rule set: no arbitrary Tailwind values (`\[[0-9]+px\]` patterns), no raw hex in tsx, no `style=` without the `v5-token-exception` comment, no string-concatenated classNames (must use `cn()`).
10.3 `theme/tokens.css` is the only file with color literals.

---

## 11. UX ADDITIONS (Phase 4, small but user-visible)

- **Coverage indicator** in compile panel header: `Tagged 14/40 shapes` (accent when 100%, muted otherwise). Data from the annotation store.
- **Clickable lints:** lint rows in the compile panel become buttons → `driver.panTo(id)` + `setSelection([id])`.
- **Onboarding overlay** (first-run only, dismissible): 3 steps — Draw → Tag → Copy contract. Reuses ui/Dialog + tokens.
- **Starter templates** (DocumentMenu): 3 neutral-scene JSONs — Web Landing (navbar/hero/cards/footer), Mobile Feed (page+cards+tab nav), Dashboard (sidebar+stats+table). Stamped via `driver.createShape`.

---

## 12. WHAT SURVIVES UNTOUCHED (do not even refactor)

`src/core/*` (all 15 modules) · `src/annotation/roles.ts, units.ts, migrate.ts, roleDefaults.ts, profiles/*` · all v40_* and core test expectations · `bench/` · directive text · contract format · §13 lint strings from v4.

---

## 13. README & LICENSE (Phase 4 final commit)

- Apply the honest README rewrite (separate canvas doc, already written): remove unverified benchmark headline, add attribution, tldraw→Excalidraw dependency update, roadmap checkmarks.
- Add `LICENSE` (MIT) + `LICENSE-NOTICE.md`: "Depends on @excalidraw/excalidraw (MIT)" and note the tldraw removal. Remove the tldraw license caveat section.
- Delete `@tldraw/tldraw` from package.json. Version → 5.0.0.

---

## 14. CI & ENFORCEMENT (Phase 1)

`.github/workflows/ci.yml`: typecheck (`tsc -b`) → test (`vitest run`) → build → `npm run bench` (must pass 20/20) → `node scripts/check-file-size.mjs` → `node scripts/check-imports.mjs` (grep: `from '@tldraw` / `from '@excalidraw` outside `src/canvas/<vendor>/`; `from '../core` inside `canvas/` allowed, the reverse forbidden). CI failing = phase not done.

---

## 15. TESTS TO ADD

- `v50_ports.test.ts` — driver interface conformance (a shared contract-suite run against BOTH adapters).
- `v50_neutral_scene.test.ts` — tldraw-doc → neutral scene → excalidraw-doc round-trip preserves shapes, meta, units.
- `v50_editor_invariance.test.ts` — §9.6 byte-identical contracts.
- `v50_tokens.test.ts` — no hex outside tokens.css (parse check), no `style=` without exception comment.
- `v50_filesize_imports.test.ts` — §9.4/§14 rules as vitest pre-checks.
- `v50_cli.test.ts` — CLI golden-fixture parity with in-app output.
- Update `v40_golden_follow_card.test.ts` ONLY to construct its fixture via the neutral scene (expected OUTPUT stays byte-identical).

---

## 16. PHASES (strict gates; checkbox acceptance; commit per phase)

**Phase 1 — Ports, TldrawDriver, ESLint, file-size/import checks, CI (1–1.5 wks).**
`canvas/port/` + `canvas/tldraw/` + `TldrawDriver` extracted from App.tsx. App.tsx ≤ 400 lines, injects driver. PersistencePort wrapping documents.ts. Frozen tl-overrides.css. ci.yml live. ☐ All v40_* + core tests green unchanged ☐ app contains zero `@tldraw` imports outside `canvas/tldraw/` (CI proves) ☐ bench 20/20.

**Phase 2 — Design system + decomposition (1 wk).**
tokens.css restructure; ui/ primitives completed; 3 modals restyled; Panel anatomy; chip grammar; inspector + RolePanel decomposed ≤300-line modules; contract-preview identity styling; tl-overrides shrunk to irreducible chrome. ☐ v50_tokens green ☐ no file > 500 lines anywhere ☐ visual smoke: every panel/modal/overlay shares one look (attach screenshots to `docs/v5-design-pass.md`).

**Phase 3 — Excalidraw port (1.5–2 wks).**
Audit doc first. `ExcalidrawDriver` + neutral-scene load/save + RoleChipsOverlay via driver events. App chrome restyled via Excalidraw UI props + tokens. DELETE `canvas/tldraw/`, `tl-overrides.css`, `@tldraw/tldraw` dep. ☐ GATE 2: v50_ports contract-suite passes on ExcalidrawDriver ☐ v50_editor_invariance green (golden fixture byte-identical from both scene loaders) ☐ v40_golden_follow_card green ☐ full manual smoke: draw→tag→unit→scope-compile→copy on the new editor ☐ bench 20/20.

**Phase 4 — CLI, UX additions, README/LICENSE, release (1 wk).**
CLI + parity test; coverage indicator; clickable lints; onboarding; templates; README honest rewrite; LICENSE files; version 5.0.0; move this doc to `docs/history/`. ☐ CI green end-to-end ☐ `grep -r "tldraw" src/` returns only migration-export + docs/history references.

---

## 17. TIEBREAKER

When anything is ambiguous: **ports stay narrow, tokens stay single-authority, files stay small, the contract stays byte-stable.** When a capability genuinely doesn't exist in Excalidraw (e.g. some tldraw behavior), surface it as an explicit lint or UI note — never approximate silently, never let the IR guess.