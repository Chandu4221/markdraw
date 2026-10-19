# MarkDraw v6.0 — Production-Grade Hardening — Complete Agent Instructions

**Repo:** `github.com/Chandu4221/markdraw` · **Base:** `main` at `fb9faf0` (v5.2.0)
**Working branch:** create `v6-production` from `main`. **Never commit to `main`. Phases in order. A phase with a failed exit criterion STOPS ALL WORK.**

---

## 0. MASTER RULES (apply to every phase; violating any = phase failed)

### 0.1 The Three Strikes history
v5.1 drifted (unmounted features), v5.2 drifted (dropped parenting, dead platform wiring, dropdown-heavy UX), both self-verified "complete" falsely. This plan assumes NOTHING works until a test or walkthrough proves it. That is not distrust — it is the process.

### 0.2 Control rules
1. **Zero assumptions.** Unspecified value/string/behavior → log in `docs/v6-questions.md`, leave `// V6-QUESTION:` comment, continue elsewhere. Never invent, never silently resolve conflicts — a conflict between two rules is ITSELF a question to log.
2. **API facts** (Excalidraw, browser, IndexedDB behaviors): 10-line spike → record result in `docs/v6-spike-notes.md` → delete spike. Never guess.
3. **Small commits:** one unit of work per commit, `type(v6): what (phase.step)`. `npx tsc -b` + `npm test` green before EVERY commit. No commit > ~5 files without splitting.
4. **Honest verification:** any "verified" claim in `docs/v6-verification/` MUST cite a test file path or a walkthrough screenshot path. One uncited claim = redo the phase.
5. **Walkthrough gates:** each phase has numbered walkthrough steps HERE. Perform each in the running app, screenshot to `docs/v6-verification/<phase>/step-N.png`. A step that fails as described = exit criterion failed = STOP.
6. **FORBIDDEN:** deps not listed in §0.3 · files > 500 lines · components > 300 · `any`/`@ts-ignore`/`as unknown as` · hex outside `tokens.css` · Tailwind raw palette classes · arbitrary values (`w-[300px]`) · inline `style=` outside documented exceptions (chip/preview positioning, resize handles) · dropdowns for ≤5-option choices (segmented controls only; Type picker = popover grid; exceptions: none) · modifying `src/core/` compiler OUTPUT or `bench/` semantics.
7. **Golden contract invariant:** for every phase, `v40_golden_follow_card.test.ts` and the v5.2 rename byte-stability test must stay green UNTOUCHED. Compiler INPUT wiring may change (parent override, platform) — output format never.

### 0.3 Approved new deps (the ONLY additions permitted, all dev-only)
`@playwright/test`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react-hooks`, `eslint-plugin-import`. Runtime deps: NONE.

### 0.4 Definition of Done (per phase — all four or the phase is not done)
(a) all phase tests green · (b) walkthrough screenshots complete · (c) CI pipeline green on the branch · (d) `docs/v6-verification/<phase>/REPORT.md` written with per-criterion pass/fail + evidence paths.

---

## PHASE 1 — BUG KILL & FOUNDATION LOCKS (nothing else until this exits)

**Goal: every known defect has a red→green repro test, and the quality machinery exists so drift is mechanically detectable.** No UX redesign in this phase.

### 1.1 Quality machinery first (so later commits are policed)
- ESLint with `@typescript-eslint` + `react-hooks` + `import` plugins. `.eslintrc` rules: `no-restricted-imports` enforcing the boundaries (`src/core` imports nothing app-level; `@excalidraw` only inside `src/canvas/excalidraw/`; components may not import `src/canvas/excalidraw/*` directly — only `src/canvas/port`). `npm run lint` script; add to CI.
- `scripts/check-file-size.mjs` (max 500, warn 400) and `scripts/check-imports.mjs` (grep-based boundary checks) added to CI if not present.
- Playwright scaffolding: `playwright.config.ts`, `e2e/smoke.spec.ts` (app loads, no console errors). CI job runs it. Do NOT write the full E2E suite yet — Phase 2 does.

### 1.2 The seven verified defects (each: write the failing repro test FIRST, commit it, then fix, then green — separate commits)
1. **Chip detach on pan/zoom:** add `onViewportChanged(cb)` to `CanvasDriver` port; `ExcalidrawDriver` implements via `api.onChange` appState scroll/zoom diff; `ChipsOverlay` consumes it + `onShapesChanged`. Test with exact numbers: shape world (600,400), viewport {x:200, y:-100, zoom:0.5} → chip top-left at (500,106). Fix code to fit test, never reverse.
2. **Parent/reparent missing:** restore parent control in inspector Advanced: segmented `Auto` + enclosing frames (≤4). Override stored in `meta.markdraw.parentOverride`; driver parent resolution honors it; compiler consumes it as INPUT wiring (golden contract byte-stable for non-override fixtures). Test `v6_reparent.test.ts` incl. override wins over geometry + compile reflects it.
3. **Platform dead wiring:** per-root platform stored on root meta (`meta.markdraw.platform`), segmented in inspector Advanced; Type picker + search + platform Type tiles read the ROOT's platform. Tests: android root → `TopAppBar` search resolves, `fab` tile visible; web root → absent.
4. **Token dialect split:** grep `--md-` → migrate all to the `--color-*` token names; token test extended to fail on any `--md-` usage.
5. **Floating Inspector button:** delete `renderTopRightUI` trigger. Inspector visibility handled in Phase 2 (until then: inspector stays where it is, minus the floating button; Alt+I must keep working).
6. **Chips hidden during simulation:** `showChips={... && breakpoint===1200}` — chips must render at ALL breakpoints (they label the reflow). Fix + test.
7. **Inspector refresh loop:** `ChipsOverlay` re-queries all shapes on every event; diff `onShapesChanged` payloads instead of full refetch (driver emits created/updated/deleted ids — use them). Perf test: 200-shape stub, one update → overlay re-render touches only 1 shape's chip (assert via render count spy).

### 1.3 Edge-case battery for existing features (write tests; fix what fails; log questions where behavior is undefined)
- Empty document: compile, coverage, legend, export — no crashes, sane empty states.
- 500 shapes: initial load < 2s in test harness, no render storms (document numbers in REPORT).
- Untagged + tagged mix; shape inside no frame; frame inside frame; unit stamped onto root frame; deleting a shape that has a parent override; renaming a doc mid-compile; localStorage disabled (private mode) — every feature must degrade with one toast, not crash.
- Undo/redo through the driver: does undo restore `meta.markdraw`? Test; if broken, fix in driver.

**EXIT CRITERIA (all or STOP):**
- [ ] 7 repro tests red→green, committed separately
- [ ] `npm run lint` clean; file-size + import checks pass on whole repo
- [ ] CI pipeline (typecheck → lint → test → build → bench 20/20 → Playwright smoke) green
- [ ] Walkthrough 1: 1) draw+tag a shape, 2) pan & zoom hard — chip glued at 0.4/1/2 zoom (3 screenshots), 3) set a parent override, move shape out of frame, reload — persists, 4) android root → picker shows TopAppBar, 5) simulate mobile — chips still visible on preview, 6) zero console errors through all steps.
- [ ] REPORT.md with evidence paths.

---

## PHASE 2 — UNIFIED PRODUCT UX (v5.3 folded: standalone inspector, segmented-first, product identity)

**Goal: one app identity; the inspector is a standalone MarkDraw panel; a non-technical user can tag without help.**

### 2.1 Standalone inspector + appbar layout control
- Inspector OUT of Excalidraw's component tree: sibling panel. `ExcalidrawCanvas` renders only Excalidraw + ChipsOverlay + ReflowPreview.
- Layout: canvas always center; output docks right always; inspector docks left OR right (outside output when right) via appbar segmented `[PanelLeft | PanelRight | X]`, icons only, tooltips, Alt+I toggles, side persisted (`markdraw_inspector_side`).

### 2.2 Segmented-first inspector (modes unchanged: canvas overview / untagged / tagged / multi)
- Header: Type icon+word · ID chip right (`shp_a3f9`, mono, copy icon, tooltip "ID — never edit").
- Name: inline-editable row (40 chars).
- Rows (icon-led, one open at a time, closed default): Responsive (`Smartphone`), Behavior (`Zap`, chips for allowed flags only), Advanced (`SlidersHorizontal`).
- Advanced: Parent segmented · Platform segmented (per-root) · style note input.
- Responsive: `BreakpointSwitch` 1200/768/375 (persisted on root meta, NOT selection-gated) · Mobile visibility segmented `Eye Visible / EyeOff Hidden / Layers Collapse` + 3 collapse-kind sub-chips (`Sidebar drawer`, `PanelBottom bottom-bar`, `Menu hamburger`) · Tablet segmented `Stack / 2-col / Keep` · `Primary` chip + order stepper 0–9.
- `components/ui/SegmentedControl.tsx` primitive (tokens only) used by ALL of the above. Grep every remaining ≤5-option select/dropdown in `src/` and convert.
- TypePicker popover: search top + icon-tile grid (3 cols), category headers, platform tiles per root platform, keyboard nav.
- ModeCanvas: coverage gauge (`14/40 tagged`), roots list with copy, Legend button (`BookOpen` → existing LegendModal), 3-icon storyboard Draw→Tag→Copy. No paragraphs.

### 2.3 De-Excalidraw identity (finish the job)
- Excalidraw CSS variables mapped 1:1 from `tokens.css` via the `.excalidraw` variable block (spike-record the full variable list first). No `!important`, no class overrides.
- `UIOptions`: suppress everything suppressible (per spike). Zero Excalidraw branding visible.
- Full a11y pass: keyboard reachability of every inspector control, focus rings from tokens, contrast check (min 4.5:1) — record numbers in REPORT.

### 2.4 Playwright E2E suite + visual regression (the full bar)
- `e2e/golden-path.spec.ts`: draw frame → tag page + Name + responsive → two tagged cards → mobile breakpoint → stacked preview → save unit from multi-select → copy contract → reload → persists. One flowing spec, screenshots per step.
- `e2e/inspector-modes.spec.ts`, `e2e/layout.spec.ts` (segmented side switching + persistence), `e2e/legend.spec.ts`.
- Visual regression: baseline snapshots (dark + light) of the four inspector modes, appbar, output panel; `--update-snapshots` only via explicit command, never silently in CI.

**EXIT CRITERIA:**
- [ ] Zero `<select>`/combos in inspector (grep proof in REPORT); zero dropdowns for ≤5-option choices repo-wide
- [ ] E2E suite green in CI (headed run locally for walkthrough screenshots)
- [ ] Visual baselines committed; CI compares
- [ ] Walkthrough 2: tag a shape using ONLY the mouse, never reading a paragraph of help text (screenshot each mode + open row); flip inspector L→R→off→Alt+I; reload — side persists; no surface resembles stock Excalidraw (full-window screenshots dark+light)
- [ ] Non-technical-user test: every visible inspector string enumerated in REPORT and passed the plain-language ban list (no AABB/infer/scope/lint/compiler jargon)
- [ ] REPORT.md + CI green.

---

## PHASE 3 — DATA SAFETY & EDGE-CASE HARDENING (users must never lose work)

**Goal: nothing a user can do — or the browser can do — loses a document.**

### 3.1 Persistence hardening
- IndexedDB schema versioned (`docVersion` + migration table); migration tests for EVERY historical version path (v3 widget docs → v4 → v5 neutral scene → current). Test each with real fixtures from old test files, never invented ones.
- Crash recovery: on load, if an autosave document is newer than the last user action timestamp, offer a restore toast with `Restore` / `Discard` (both explicit). Test: simulate crash (kill mid-session in Playwright by reloading during an edit) → restore works.
- Export/import: JSON file round-trip test (export → wipe storage → import → deep-equal scene); corrupted-import error path (toast, no crash); file-size sanity (10k shapes export < 5MB, note the number).
- Visible "Saved" state in the appbar: `Check` icon + `Saving…` during writes; test both states render.

### 3.2 Edge cases (test-first; log unknowns as questions)
- Undo/redo across: tagging, parenting override, unit stamping, template load. Each: undo restores meta exactly; redo restores.
- Deleting: a shape referenced by unit definitions, a parent whose children carry overrides (children revert to Auto — test), a doc while it's the active one.
- Storage limits: localStorage quota exceeded (simulate small quota) → graceful toast; IndexedDB unavailable → in-memory mode + warning banner.
- Rapid interaction: tag while dragging, compile while switching docs, double-click template load — no state corruption (race tests with fake timers).
- Browser matrix: Playwright projects chromium + firefox + webkit; record pass/fail per browser in REPORT; fix crashes, log rendering diffs as questions if minor.

**EXIT CRITERIA:**
- [ ] Migration path tests for all historical doc versions green
- [ ] Crash-recovery Playwright spec green
- [ ] Undo/redo meta tests green; all 3.2 battery tests green or explicitly question-logged
- [ ] Walkthrough 3: 1) edit mid-session, force-reload, restore offered and works, 2) export → clear storage (devtools) → import → everything back incl. chips, 3) undo a tagging → chip disappears, redo → returns, 4) firefox + webkit walkthrough of golden path (screenshots).
- [ ] REPORT.md + CI green (E2E on all 3 browsers).

---

## PHASE 4 — RETURNING USERS: onboarding, templates, hosted demo

**Goal: a first-time user reaches the "copy contract" moment within 2 minutes, and there is a URL to share.**

### 4.1 First-run experience
- Onboarding modal (first run only, dismissible, never re-shows; reset button in Settings): 3 steps with icons — Draw / Tag / Copy — plus one button `Start from a template`. No text paragraphs.
- Starter templates (existing 3): verify each opens, tags intact, compiles, and looks good at 375 breakpoint. Screenshot each.
- Empty state: ModeCanvas storyboard + one primary button `Load a template`.

### 4.2 Docs & honesty
- README rewrite for v6: honest benchmark section (unchanged from honest-README rules), quickstart for local-first (`npm run dev`), the walkthrough GIF/screenshots from `docs/v6-verification/` embedded, feature list in plain language.
- `docs/GETTING-STARTED.md`: 5-step guide with the golden path.

### 4.3 Hosted demo (sequenced after local-first is solid — per maintainer decision)
- Static build (`vite build`) deployed to GitHub Pages via the existing deploy workflow extended: build → upload Pages artifact. Demo banner: `Demo — data stays in your browser`. No backend, no accounts, no telemetry.
- Demo hygiene: default document is a pre-tagged showcase fixture (a Feed Page with 6 tagged shapes + 1 unit) so the first 10 seconds show chips, contract, and simulation working.

**EXIT CRITERIA:**
- [ ] Fresh browser profile walkthrough 4: open demo URL → onboarding → template → tag one shape → copy contract — under 2 minutes, screenshots each step
- [ ] Templates verified at all 3 breakpoints; README + GETTING-STARTED reviewed (no superlatives, claims cite tests)
- [ ] Deploy workflow green; demo URL loads the showcase fixture; REPORT.md.

---

## PHASE 5 — RELEASE

1. Full regression: `tsc -b` · `npm test` · `npm run build` · `npm run bench` 20/20 · lint · file-size · imports · token test · E2E 3 browsers.
2. `LICENSE` (MIT) + dependency notice (Excalidraw MIT — confirm pinned version's license text), version → `6.0.0`, tag `v6.0.0`.
3. `docs/v6-verification/FINAL.md`: every claim → evidence path; known-issues list (anything question-logged and unresolved, stated plainly).
4. STOP. Do not merge. Report and await maintainer review.

---

## APPENDIX — CLOSED DECISIONS (do not re-open)
- Ship order: local-first app first, hosted demo second (Phase 4). No backend/accounts/telemetry ever in v6.
- Bugs → UX → data-safety → retention: strict phase order; no parallel phase work.
- Full testing bar: Playwright + visual regression approved; baselines never silently updated.
- v5.3's standalone inspector + segmented-first design = Phase 2 (unchanged from its spec; superseded by this doc where they conflict — log the conflict, don't resolve it).
- Golden contract output byte-stable through every phase.
- Walkthrough screenshots are the only accepted manual evidence; file-existence is never evidence.