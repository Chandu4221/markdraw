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

### 0. PROCESS RULES & GOLDEN PATH ACCEPTANCE

### 0.4 The Golden Path (All 8 Steps Fully Verified)
1. [x] **App loads with no console errors.**
2. [x] **Draw a rectangle with the rectangle tool.**
3. [x] **Click it → the docked annotation panel appears immediately, showing the semantic role picker.**
4. [x] **Assign role `button`, set label `Follow`.**
5. [x] **A role chip `button` appears on/near the shape on canvas.**
6. [x] **Compile panel shows the contract containing `Root > #<id>` with `[button "Follow"]`.**
7. [x] **Copy works (clipboard contains the contract).**
8. [x] **Refresh the page → the shape, its role, and its chip persist (no data loss).**

### 0.5 Invariants & Non-Negotiables
- [x] Font sizes strictly $\ge 14\text{px}$ everywhere (`text-sm`, `text-base`, `0.875rem` minimum).
- [x] Strict WCAG 2.1 AA/AAA color contrast verified per https://colourcontrast.cc/ ($\ge 4.5:1$).
- [x] Canonical role storage invariant: `meta.markdraw.role` stores canonical role names only.
- [x] File line limits: files $\le 500$ lines, components $\le 300$ lines.
- [x] Zero dependencies added.

---

## PHASE 1 — FIX THE WIRING (COMPLETED)
- [x] **1.1 Inventory**: `docs/v51-wiring-audit.md` completed.
- [x] **1.2 Mount the Inspector**: Docked `InspectorShell` mounted in `App.tsx` between Canvas and Output Panel; reactive selection via `driver.onSelectionChanged(setSelectedIds)`. Tests in `inspector_mount.test.tsx` pass.
- [x] **1.3 Role Chips Overlay**: `RoleChipsOverlay.tsx` mounted, `showRoleChips` toggle and `localStorage` persistence wired in `App.tsx` and `SettingsModal`. Tests in `roleChips.test.tsx` pass.
- [x] **1.4 Coverage Indicator & Clickable Lints**: Header shows `Tagged N/M shapes` and lint rows click to pan/select and reveal inspector.
- [x] **1.5 Migration Exporter**: Verified with `v51_migration_export.test.ts`.
- [x] **1.6 Responsive Props Invariant**: Enforced that responsive props require ancestor page with `responsive` flag. Verified with `v51_responsive_emit.test.tsx`.
- [x] **1.7 CI Confirmation**: All test suites pass.

---

## PHASE 2 — ONE APP: INTEGRATE THE TAGGING UI INTO THE EDITOR CHROME (COMPLETED)
- [x] **2.1 Docked Surface**: Inspector lives in unified docked chrome, collapsible via Alt+I, header button, and canvas toolbar trigger.
- [x] **2.2 Design System Pass**: All colors, radii, typography harmonized to `tokens.css`. Role categories mapped to single palette variables (`--color-role-structure`, `--color-role-interaction`, etc.). All font sizes $\ge 14\text{px}$. WCAG 2.1 AA/AAA compliance verified.

---

## PHASE 3 — PLATFORM-AWARE TAGGING (COMPLETED)
- [x] **3.1 Storage Invariant**: Canonical role names stored in `meta.markdraw.role`.
- [x] **3.2 Profile Loading**: `src/annotation/profileLoader.ts` loading Web and Android Material 3 profiles.
- [x] **3.3 Platform-Aware Role Picker**: Display aliases, dual search (canonical + alias + display name), and extra platform roles (`fab`, `bottom_sheet`, `scaffold`). Verified with `v51_platform_picker.test.ts`.
- [x] **3.4 Compile-Side Legend Confirmation**: Platform mappings reflected in legend.

---

## PHASE 4 — RESPONSIVE SIMULATION MODE (COMPLETED)
- [x] **4.1 Pure Reflow Engine**: `src/core/reflow.ts` (`computeReflow`) computes deterministic reflow. Verified with `v51_reflow.test.ts`.
- [x] **4.2 Simulation UI**: `Simulate responsive` toggle, width slider (375px–1200px) with presets, ghost overlay `ReflowPreview.tsx`, non-destructive canvas guarantee. Verified with `v51_reflow_integration.test.ts`.

---

## PHASE 5 — FINAL PASS (COMPLETED)
- [x] **5.1 CLI Parity Test**: `src/cli/__tests__/v51_cli.test.ts` verified.
- [x] **5.2 README Final Pass**: Documentation updated with Excalidraw engine, platform tagging, and responsive simulation.
- [x] **5.3 Version Bump**: `package.json` set to 5.1.0.
- [x] **5.4 Repo Validation**: Typecheck, tests (40/40 passed, 221 tests), build, bench passing.
- [x] **5.5 Final Verification Doc**: `docs/v51-verification/FINAL.md` recorded.