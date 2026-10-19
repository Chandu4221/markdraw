# MarkDraw v5.1 — Fix the Wiring, Unify the App, Platform-Aware Tagging, Responsive Simulation
# — Complete Agent Instructions —

**Repo:** `github.com/Chandu4221/markdraw` · **Base branch:** `v5-canvas-adapter` at `5980568` (v5.0.0)
**Working branch:** create `v5.1-fix-integrate` from `v5-canvas-adapter`. **Never commit to `main` or `v5-canvas-adapter`.**

---

## 0. READ THIS FIRST — HOW TO WORK (non-negotiable process rules)

You are implementing a fix-and-extend plan on a codebase that is structurally complete but has **broken integration points**. A previous pass created all the component files but failed to mount some of them in the app. Your #1 job is: **every feature must be visibly working in the running app, verified by manual golden-path checklist, not just present in files.**

### 0.1 Before you write any code
1. Run `npm install` once. Then run `npm test` and `npm run dev` and confirm the app boots. If tests fail before you touch anything, STOP and write `docs/v51-blocker.md` describing the failure. Do not "fix" pre-existing failures without documenting them.
2. Read these files fully before Phase 1: `src/App.tsx` (12KB), `src/canvas/port/CanvasDriver.ts`, `src/canvas/port/CanvasShape.ts`, `src/annotation/roles.ts`, `src/annotation/types.ts`, `src/annotation/profiles/android-material.json`, `src/annotation/profiles/web.json`, `src/theme/tokens.css`.

### 0.2 Commit discipline (STRICT)
- **One small commit per meaningful unit of work.** If your change touches more than ~5 files, it is probably two commits.
- Commit message format: `fix(v5.1): <what> (<phase>.<step>)` — e.g. `fix(v5.1): mount InspectorShell into App render tree (1.2)`.
- **Before every commit:** `npx tsc -b` clean + `npm test` green. NO exceptions. If you cannot make both pass, do not commit; write `docs/v51-blocker.md` instead.
- **Never** leave the repo in a state where `npm run dev` crashes.

### 0.3 Verification discipline (the lesson that created this plan)
- After every phase, perform the **Golden Path checklist** in §0.4 by actually running `npm run dev` and doing the steps. You have a browser available in your environment — use it. Screenshots proving each step go in `docs/v51-verification/<phase>/`.
- **"The file exists" is NOT "the feature works."** A feature is done when: the UI shows it, a test asserts it, AND the golden path demonstrates it.

### 0.4 The Golden Path (memorize this — it is the acceptance bar for EVERY phase)
1. App loads with no console errors.
2. Draw a rectangle with the rectangle tool.
3. Click it → the annotation panel appears, showing the role picker.
4. Assign role `button`, set label `Follow`.
5. A role chip `button` appears on/near the shape on canvas.
6. Compile panel shows the contract containing `Root > #<id>` with `[button "Follow"]`.
7. Copy works (clipboard contains the contract).
8. Refresh the page → the shape, its role, and its chip persist (no data loss).

### 0.5 FORBIDDEN (violating any of these invalidates your work)
1. No new npm dependencies. None. If you believe you need one, stop and write `docs/v51-blocker.md`.
2. No file > 500 lines. No component > 300 lines. If your edit would push a file over, split it first into a separate commit.
3. No `any`, no `as unknown as`, no `@ts-ignore`, no `@ts-expect-error`.
4. No raw hex colors, no arbitrary Tailwind values (`w-[387px]`), no inline `style=` except where §2.3 explicitly permits.
5. Do not modify: `src/core/` compiler output format, contract strings, directive text, `bench/`, or any existing golden test's *expected output* (you may change how a test *constructs* its fixture if instructed).
6. Do not skip a phase gate. On gate failure: stop, write `docs/v51-gate-report.md`, await instructions.
7. Do not work on `main` or `v5-canvas-adapter` directly.

### 0.6 When something is not specified in this document
Implement the minimal version that violates no rule above, and note the decision in your commit message as `NOTE: <decision>`. Do not invent frameworks, patterns, or features.

---

## PHASE 1 — FIX THE WIRING (the mount bug and friends)

**Goal:** every feature that exists as files is actually rendered and reachable in the running app.

### 1.1 Inventory (do this first, produce a report, commit it)
Create `docs/v51-wiring-audit.md`. For each item, grep the ENTIRE `src/` tree and record: which file defines it, which file imports it, and whether it is reachable from the App render tree:
- `InspectorShell` and all `components/inspector/*` sections
- `RolePanel` / role picker with alias search
- `RoleChipsOverlay` (role chips on canvas)
- Coverage indicator (`Tagged N/M shapes`)
- Clickable lint rows
- `OnboardingModal`, starter templates
- Output panel tabs, copy buttons, platform selector, scope toggle
Mark each `WIRED` or `NOT WIRED`. This document is your Phase 1 checklist. Commit: `docs(v5.1): wiring audit (1.1)`.

### 1.2 Mount the Inspector
**Problem:** `src/App.tsx` renders only `AppHeader`, `ExcalidrawCanvas`, `OutputPanel`, and modals. The decomposed inspector (`components/inspector/`) is imported nowhere. Result: selecting a shape shows NO tagging UI. This is the core regression.

**What to build:**
1. In `App.tsx`, add state: `const [selectedIds, setSelectedIds] = useState<string[]>([])`.
2. Subscribe to the driver: where `handleDriverReady` is called (find it in `hooks/useCompilation`), add `driver.onSelectionChanged(setSelectedIds)`. Store the unsubscribe and call it on unmount.
3. Render the inspector: a right-side docked panel (between the canvas and the output panel, or inside the existing right panel area — inspect the current layout components in `components/layout/` and place it where the v4 UI had the inspector; if genuinely ambiguous, place it as the top section of the right panel). It renders `InspectorShell` with props: `selectedIds`, `driver`, `units`, `onUnitsChange`, `options`, `onOptionsChange`.
4. `InspectorShell` (read its current implementation first) must show:
   - No selection → empty state: "Select a shape to tag it" + a small canvas summary (root frames count, untagged count).
   - 1 shape selected → the full annotation UI: role picker with search, label input, hierarchy picker, behavior flags, responsive section (only if root page has responsive — see §1.6), props section, unit actions.
   - N>1 shapes selected → multi-select state: bulk role assign, "Save as unit" button.
5. Every role assignment writes through `driver.updateShape(id, { meta: { markdraw: {...parsed, role} } })` — use the existing `shapeMeta.ts` helpers (`parseMarkDrawMeta`, `serializeMarkDrawMeta` or their actual names — READ the file) for reading/writing meta. Never hand-build the meta object except through those helpers.
6. Unit tests: new file `src/components/inspector/__tests__/inspector_mount.test.tsx` — render `<App/>` with a stub driver (see existing `v50_ports.test.ts` for driver stubbing patterns), fire `onSelectionChanged(['shape_1'])`, assert the role picker is in the document (`getByRole('combobox', { name: /role/i })` or the picker's actual accessible name — match the component's real markup). Also assert the empty state when selection is `[]`.

**Acceptance (gate for 1.2):** Golden Path steps 1–5 pass manually. Commit sequence suggested: (a) selection state wiring, (b) InspectorShell mount, (c) test.

### 1.3 Verify role chips render
1. Read `src/annotation/RoleChipsOverlay.tsx` (10KB). Confirm it: subscribes to `driver.onShapesChanged`, renders one chip per shape with a non-null `meta.markdraw.role`, positions it at shape bounds, and hides on export.
2. Wire `showRoleChips` properly: in `App.tsx` the state is `const [showRoleChips] = useState(...)` — **there is no setter, so the Settings toggle cannot work.** Fix: add the setter, pass both to SettingsModal, persist to localStorage key `markdraw_show_role_chips` on change.
3. Manually verify: tag a shape → chip appears; toggle in settings → chips hide/show; chips persist across reload.
4. Test: `roleChips.test.tsx` — stub driver returns 2 shapes (one tagged `button`, one untagged), assert 1 chip renders with text `button`, and 0 render when `showRoleChips=false`.

### 1.4 Verify coverage indicator and clickable lints
1. Coverage indicator: the compile panel header shows `Tagged N/M shapes`. Trace how it gets its data (grep `coverage` in `components/output/`). If it derives from the compilation result, confirm it updates after tagging a shape. If it's static/wrong, fix it: count = shapes with non-null role / total non-frame shapes in the active root.
2. Clickable lints: lint rows must be buttons. Click → `driver.panTo(shapeId)` + `driver.setSelection([shapeId])`. Verify by hand: create an untagged shape, compile, see the lint, click it — the canvas should pan to and select the shape. If the Excalidraw driver's `panTo`/`setSelection` don't work, FIX THE DRIVER (they are implemented in `ExcalidrawDriver.ts` — test `api.scrollToContent` / element selection APIs; record what you used in the commit message).

### 1.5 Audit the tldraw migration exporter
1. Read `src/canvas/migration/v5-export.tldraw.ts` (865 bytes — suspiciously small) and `shapeMapping.ts`.
2. Write a test `v51_migration_export.test.ts` that takes a realistic v4-format tldraw scene (copy a fixture from existing `v40_migration.test.ts` — DO NOT invent the shape of tldraw data; use what the v4 tests use) and asserts: every shape maps to a `CanvasShape` with correct kind, bounds, parentId, and preserved `meta.markdraw`.
3. If the exporter is a stub that drops shapes or meta, FIX it using the mapping table already present in `src/annotation/migrate.ts` (the §12 widget→role map). If you cannot fix it fully, document exact gaps in `docs/v51-wiring-audit.md` — do not silently ship partial migration.

### 1.6 Verify responsive props survived the port
1. Read `src/annotation/types.ts` — `RoleResponsive` must still exist with: `order: number | 'auto'`, `primary: boolean`, `smVisible` (values: `'visible' | 'hidden' | 'collapse:drawer' | 'collapse:bottom-bar' | 'collapse:hamburger'`), `smFullWidth: boolean`, `tablet` (values: `'stack' | '2-col' | 'maintain'`).
2. Extend the inspector's responsive section (it exists in `components/inspector/` — find `ResponsiveSection`): visible ONLY when an ancestor root has role `page` with the `responsive` behavior flag. When no such root: show disabled helper text exactly: `Enable Responsive on the root page first.`
3. Compile a fixture with responsive props on a shape inside a responsive root → contract contains the `sm:`/`order`/`primary` tokens. Compile with responsive props but NO responsive root → tokens absent + lint emitted (the v4 §13 string: `Responsive props on #{id} but no responsive root page — tokens not emitted.`). Both cases get tests in `v51_responsive_emit.test.ts`.

### 1.7 CI confirmation
Push the branch. Confirm `.github/workflows/ci.yml` runs and is green on the pushed commit (typecheck → test → build → bench → file-size → import checks). If CI was never green on `v5-canvas-adapter`, document what failed and fix only what this plan covers; anything else goes in the blocker doc.

**PHASE 1 GATE:** full Golden Path passes manually (screenshots in `docs/v51-verification/1/`), all tests green, CI green. THEN and only then proceed.

---

## PHASE 2 — ONE APP: INTEGRATE THE TAGGING UI INTO THE EDITOR CHROME

**Goal:** the annotation UI lives INSIDE Excalidraw's docked surface, and the whole app looks like one MarkDraw-designed product — nothing looks like stock Excalidraw.

### 2.1 The integration surface
Excalidraw (v0.18.x) officially supports custom docked UI: the `Sidebar` component (`<Sidebar name="markdraw-inspector" …/>` rendered as a child of `<Excalidraw>` with `excalidrawAPI` access) and `dockSidebar` / ` autoFocus` props. USE THE OFFICIAL `Sidebar` API — do not absolutely-position divs over the canvas.
1. Read `src/canvas/excalidraw/ExcalidrawCanvas.tsx` (2.8KB) — it wraps `<Excalidraw>`.
2. Render `InspectorShell` (from Phase 1) inside an Excalidraw `<Sidebar>`: open when a shape is selected, closed (or showing the empty state) when not. The sidebar header shows the selected shape's chip + short id, e.g. `#a3f · button`.
3. The sidebar must be collapsible via Excalidraw's own collapse affordance so it behaves like a native docked panel. Excalidraw's `theme` prop must follow MarkDraw's theme state (dark/light already managed in App — pass it through).
4. If — and ONLY if — the official Sidebar API fights the design (verify in a spike first, document in commit message), fall back to a MarkDraw-owned docked panel visually matched to the Excalidraw chrome height/edges. But the official API is the default path; try it first.
5. Keep the `onSelectionChanged` wiring from Phase 1 — only the *container* changes.

### 2.2 De-Excalidraw the look (design-system pass)
The bar: **a user must not be able to tell which parts are Excalidraw and which are MarkDraw.** Everything except the canvas itself and its drawing tools must read as one designed application.
1. Read `src/theme/tokens.css` fully. All colors/spacing/radii/fonts come from there — add tokens ONLY if something needed is missing (document each addition in the commit).
2. Excalidraw theming: pass `theme` and use Excalidraw's CSS variables API (`.excalidraw` exposes `--ui-font`, `--color-primary`, etc. — check the pinned version's supported variables) set from `tokens.css` values, so the toolbars/panels follow MarkDraw's palette. Do NOT restyle by overwriting Excalidraw's class rules with `!important` — use their variables. (This is the anti-`tl-overrides.css` lesson: we deleted 12.7KB of that; we do not recreate it for Excalidraw.)
3. App chrome audit — walk every surface and restyle against tokens: `AppHeader` (components/layout/), document menu, settings modal, shortcuts modal, legend modal, onboarding modal, output panel (tabs, toolbar, copy buttons), toast. One consistent treatment: same radius, same spacing scale, same button hierarchy (primary = accent, secondary = surface-2), same focus ring.
4. Output/contract preview identity: `MarkdownPreview` renders the contract in `--font-mono`, with bracket tags visually distinct (accent color for `[role "Label"]` tokens, secondary for props/flags). Implement with a small tokenizer over the existing markdown preview — no new deps; extend what's there.
5. Chip grammar (one component, reused everywhere): role chips (accent-tinted filled), unit chips (name + composition hint), untagged chips (dashed outline), lint badges (semantic colors). Grep for existing chip implementations in panels/legend/lints and consolidate them onto the shared component. Define the role→color mapping ONCE (in tokens.css as CSS variables, e.g. `--color-role-structure`, `--color-role-content`, `--color-role-interaction`, `--color-role-nav`, `--color-role-feedback` — by role CATEGORY, not 31 individual colors) — chips, legend rows, and the Phase 4 simulation all consume it.
6. Tests: extend `v50_tokens.test.ts` — assert zero hex literals outside `tokens.css`, zero inline `style=` without the `// v5-token-exception:` comment. Keep it green.

**PHASE 2 GATE:** Golden Path passes again (now inside the docked sidebar); screenshot the full app (dark + light) into `docs/v51-verification/2/`; a reviewer looking at the screenshot should see ONE app. Tests + CI green.

---

## PHASE 3 — PLATFORM-AWARE TAGGING

**Goal:** the role picker speaks the active platform's vocabulary while storage stays canonical.

### 3.1 The invariant (never break this)
`meta.markdraw.role` ALWAYS stores the canonical name (one of the 31 roles). Platform names (`TopAppBar`, `NavigationBar`…) are presentation and search only — shown in the picker, shown in the legend, NEVER stored. Switching platform after tagging must change nothing in stored data.

### 3.2 Profile loading
1. Create `src/annotation/profileLoader.ts`: `getProfile(platformId: string): PlatformProfile` — reads the JSON from `src/annotation/profiles/` (import the JSON statically — no fetch). Unknown id → throw (do not silently fall back to web; a wrong platform should fail loudly in dev).
2. The active platform id already flows as `platformId` state in App (`'web'` default) through `CompilationOptionsContext` — reuse it. Do not create a second source of truth.

### 3.3 Platform-aware role picker
1. In the role picker (inside the inspector's `RoleSection`), when platform ≠ web:
   - Primary display label for a role = `roleAliases[role] ?? role` (Android: `navbar` shows as `TopAppBar`), with the canonical name as secondary text ("navbar") so users learn the mapping.
   - Search must match BOTH: canonical name + v4 aliases + platform alias + the platform display name. Typing `TopAppBar`, `appbar`, or `navbar` all find `navbar`. Implement by extending the existing search in `roles.ts` (`searchRoles`) to take an optional profile parameter — do not duplicate the search logic.
   - `extraRoles` from the profile join the dropdown in a separate group "Platform roles" — ONLY while that profile is active. Selecting `fab` on Android stores role `fab`.
2. Promote platform extra roles into the canonical vocabulary: add `fab`, `bottom_sheet`, `scaffold` to `ROLE_NAMES` in `roles.ts` (now 34 roles) with category `platform`, flags from the profile, and alias entries. They are valid in the IR everywhere; on the `web` profile they simply never appear in the picker and, if compiled, pass through like any role. Update `v40_roles.test.ts`'s frozen-count assertion accordingly (the ONLY permitted change to that file).
3. Untagged-shape suggestion chips (the "looks like a button" hints): keep them platform-agnostic. Do not spend effort on platform-specific suggestions.
4. Tests `v51_platform_picker.test.ts`: with android profile — searching `TopAppBar` resolves to `navbar`; `scaffold` appears in dropdown; selecting it stores role `scaffold`; with web profile — `scaffold` absent; stored role of a previously-android-tagged shape unchanged when switching to web.

### 3.4 Compile-side confirmation
Legend already applies `roleAliases` (v4 behavior — verify still true on this branch with a test asserting the android legend row for a `navbar` shows `TopAppBar`). Add nothing new to the compiler.

**PHASE 3 GATE:** Golden Path in Android mode: tag a top bar as `TopAppBar` → chip shows `navbar` (canonical, matching the storage invariant) or the platform name — PICK ONE and be consistent: **chips show the canonical role; the picker shows the platform name** (chips are contract-adjacent, the picker is vocabulary-adjacent). Contract + legend show TopAppBar mapping. Tests + CI green.

---

## PHASE 4 — RESPONSIVE SIMULATION MODE

**Goal:** turn on simulation for a responsive root, drag a width slider, and watch the layout reflow exactly as the contract says it will — approximate ghost rendering, non-destructive.

### 4.1 Core: the pure reflow function (in `src/core/`, DOM-free)
New file `src/core/reflow.ts`:
```ts
export interface ReflowInput {
  shapes: CanvasShape[];          // one root's subtree, neutral scene
  width: number;                  // simulated viewport width in px
  defaultBreakpoint: number;      // from compilation options; use 768 unless a root prop exists
}
export interface ReflowResult {
  nodes: Array<{
    shapeId: string; role: string | null;
    x: number; y: number; w: number; h: number;
    state: 'normal' | 'hidden' | 'collapsed';
    collapseKind?: 'drawer' | 'bottom-bar' | 'hamburger';
  }>;
}
export function computeReflow(input: ReflowInput): ReflowResult;
```
**Algorithm (implement in this order, each rule testable):**
1. Build the tree from `parentId` (frame → root).
2. If `width >= breakpoint`: return current bounds, state `normal` (no reflow — desktop is what you drew).
3. If `width < breakpoint`, reflow each container's children top-down:
   - Children sorted: `primary` first, then `order` ascending, then current y/x for `'auto'`.
   - Children that were side-by-side (detect via x-overlap < 50% between siblings, or trust responsive `primary`/`order` when present) stack vertically: full container width (or `w` from `smFullWidth` → 100%), preserving relative heights, packed top-to-bottom with an 8px gap.
   - `smVisible === 'hidden'` → state `hidden`, keep bounds (ghost).
   - `smVisible` starts with `collapse:` → state `collapsed` + kind; the collapsed element occupies a 48px strip at its target (hamburger/bottom-bar → a strip at the frame top/bottom respectively; drawer → 48px rail on the leading edge).
   - Untagged shapes: treat as generic boxes, stack like siblings, no special rules.
   - `role`-based hints ONLY as tie-breakers: `img`/`video` shrink proportionally to fit width; `table` keeps min-width 320 and may overflow its band; `navbar` without explicit collapse hint auto-collapses to hamburger at the top (log this auto-decision in the simulation UI as a suggestion chip, never silently).
4. Deterministic: same input → byte-identical output. No Date/Math.random.
5. Tests `v51_reflow.test.ts` — golden bounds fixtures: (a) two 50% columns → stacked below breakpoint, side-by-side above; (b) `order` respected; (c) hidden ghosting; (d) collapse-to-bottom-bar; (e) untagged generic stacking. Write the expected numbers BY HAND from small integer fixtures (e.g. frame 360×640, children at x=0/180) — do not generate expectations from your own implementation.

### 4.2 The simulation UI
1. **Toggle:** in the inspector, when the selected root frame has role `page` + `responsive` flag, show a `Simulate responsive` switch. ON → simulation view for that root.
2. **Width slider:** a floating control over the root frame (rendered in `ExcalidrawCanvas` as an overlay positioned at the frame's screen bounds): range 375–1200, presets Desktop(1200) / Tablet(768) / Mobile(375). Current width + breakpoint marker on the track.
3. **Ghost renderer:** new component `components/simulation/ReflowPreview.tsx` — absolutely-positioned divs inside the frame's screen rect, one per `ReflowResult.node`:
   - Fill/stroke per role CATEGORY color (the §2.2 token variables — this is why they're defined once).
   - `hidden` → dashed outline, 30% opacity, chip `hidden`.
   - `collapsed` → the strip + chip naming the kind (`hamburger`, `bottom bar`, `drawer`).
   - Text shapes render their actual text (ellipsized); `para` renders 2–3 line placeholders; labels show role chips.
   - Rendered OVER the real shapes (real drawing dims underneath at 15% opacity — so users see both their drawing and the reflow). Click on the overlay = pass-through to canvas (pointer-events: none on the preview, the slider control alone is interactive).
4. **Non-destructive guarantee:** the simulation NEVER calls `driver.updateShape`. Assert this in the test: after running simulation on a fixture, `driver.listShapes()` output is deep-equal to before.
5. Exit: toggle off (or deselect root) → overlay unmounts, drawing fully restored visually (it was never changed).

**PHASE 4 GATE:** Golden Path extended: responsive page with two 50% columns → toggle simulate → slider to 375 → columns stack vertically with chips visible → toggle off → drawing intact → compile → contract's `sm:`/`order` tokens MATCH what the simulation showed (same breakpoint, same order, same hidden set — verify manually and assert in an integration test comparing `computeReflow` ordering vs. compiler emission order for the same fixture). Screenshots in `docs/v51-verification/4/`. CI green.

---

## PHASE 5 — FINAL PASS

1. **CLI parity:** add `v51_cli.test.ts` (§15 of the v5 spec promised `v50_cli.test.ts` — it's missing): export a fixture as `StoredDocument` JSON, run the CLI entry (`src/cli/compile.ts` as a function — refactor its core into a callable if it's script-only), assert output byte-identical to in-app compile of the same scene.
2. **README final pass:** purge remaining tldraw mentions outside `docs/history/` and the migration code; confirm the dependency section says Excalidraw (MIT); add the new features (platform-aware tagging, responsive simulation) described honestly (what it does, not superlatives).
3. **Version:** bump `package.json` to `5.1.0`. Move this instruction file to `docs/history/`.
4. Full repo grep checks: `npx tsc -b` clean · `npm test` · `npm run build` · `npm run bench` (20/20) · file-size check · import-boundary check · `grep -r "tl-overrides" src/` → empty · no `style=` without exception comment.
5. Final verification doc: `docs/v51-verification/FINAL.md` — the complete Golden Path (all phases) with screenshots, test counts, bench score.

**FINAL GATE:** everything green + the final verification doc complete. Report and stop. Do NOT merge to main yourself.

---

## APPENDIX — ORDER OF OPERATIONS SUMMARY

Phase 1 (fix wiring) → Phase 2 (unified chrome) → Phase 3 (platform tagging) → Phase 4 (simulation) → Phase 5 (final pass). Each phase: many small commits → tests → manual Golden Path → screenshots → CI green → only then next phase. When lost: re-read §0.4 (the Golden Path) and §0.6 (minimal + note). When blocked: `docs/v51-blocker.md`, stop, await instructions.