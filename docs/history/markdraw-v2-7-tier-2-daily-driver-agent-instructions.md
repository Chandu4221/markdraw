# MarkDraw v2.7 — Agent Instructions (Tier 2 — Daily-Driver)

**Repo:** `github.com/Chandu4221/markdraw` (current state: v2.6 — output hygiene, placement semantics, pattern grouping, panel transitions, chip consistency, version/determinism)

**Goal:** Make MarkDraw *usable daily*: multiple documents, crash-proofing, faster editing (multi-select, shortcuts, duplicate), and shareable files. No new widget types. Architecture unchanged.

---

## Task 1 — Multi-Document Support (the big one)

**Problem:** tldraw's `persistenceKey="markdraw"` holds exactly one document. Users can't start a new wireframe without destroying the old one.

**Fix — document management layer:**

1. **Document registry** in `localStorage` (key `markdraw_docs`): `{ docs: [{ id, name, createdAt, updatedAt, persistenceKey }], activeDocId }`. Each document gets its own tldraw persistence key (`markdraw_doc_<id>`), so each canvas is a separate tldraw store.
2. **Document menu** in the header (dropdown next to the brand): New, Open (list with names + dates, rename + delete), Duplicate, Rename current.
3. Switching documents: unmount/remount `<Tldraw>` with the new `persistenceKey` (React key change forces a fresh editor instance — verify store re-subscription in `handleEditorMount` handles this; the dispose cleanup already exists).
4. Document name shown in the header, editable inline (double-click).
5. Migrate on first load: if the old `markdraw` persistence key has data, import it as document "Untitled" and mark it active (one-time migration, guarded by a `markdraw_migrated_v27` flag).
6. New document seeds a minimal demo canvas (page + hero + section + footer) so the canvas is never an empty void.

**Acceptance:** create 2 docs, draw in each, switch back and forth — content persists per document; rename/delete work; migration preserves the existing drawing.

---

## Task 2 — Export/Import `.markdraw.json` (shareable files)

1. Header menu: **Export File** — downloads `{ formatVersion: 1, markdrawVersion, doc: { name, shapes: <tldraw snapshot> } }` where the snapshot comes from `editor.getCurrentPageShapes()` (full shape records) — file name `<docname>.markdraw.json`.
2. **Import File** — file picker, validates `formatVersion` + shape types (all must be `ui-widget`; reject/report others), then writes the shapes into a NEW document (never overwrite silently) named from the file.
3. Import/export must round-trip: export → delete → import → identical compile output.

**Acceptance:** export, wipe browser storage, import — the canvas and markdown output match the original exactly.

---

## Task 3 — Error Boundary & Compiler Crash Recovery

**Problem:** One malformed shape or serializer crash can blank the whole app.

1. React error boundary wrapping the whole workspace (`ErrorBoundary.tsx`): monochrome fallback screen with "Reload" + "Export recovery file" buttons (the export path dumps the raw tldraw store snapshot from IndexedDB via `editor.store` if reachable, else the last successful compile result).
2. `try/catch` inside the compile pipeline: on serializer failure, keep the LAST successful compilation in the output pane and show a toast "Compile error — showing last valid output" (never blank the panel).
3. Per-shape isolation: if a single shape's normalization throws, skip it, count it as `skippedShapes`, and append a warning line at the end of the spec output: `_Warning: N shapes skipped due to processing errors._`

**Acceptance:** manually inject a corrupt shape into the store via console → app stays alive, toast appears, output shows last valid result + warning.

---

## Task 4 — Multi-Select Editing in Props Panel

**Problem:** Changing 5 buttons' variant means 5 separate edits.

1. When **multiple widgets of the same type** are selected: props panel shows the shared prop fields; editing applies to ALL selected via `editor.updateShapes` (batch).
2. Mixed-type multi-select: show only common fields (label, showText where applicable) + a count ("4 widgets selected").
3. Empty the label field when selected widgets have different labels (placeholder: "— mixed —"); typing replaces all.

**Acceptance:** select 4 buttons, switch variant to ghost once — all 4 change; undo (Ctrl+Z) reverts all 4 in one step.

---

## Task 5 — Editing Productivity Pack

1. **Duplicate:** Ctrl/Cmd+D duplicates selection offset by (+24, +24)px, preserving props.
2. **Nudge:** arrow keys move selection by 1px (Shift: 10px).
3. **Delete:** Del/Backspace deletes selection (tldraw default — verify it works with widgets).
4. **Quick-insert:** keyboard `/` opens palette search (exists) — extend: Enter inserts the highlighted widget at viewport center; arrow keys navigate results.
5. **Alignment guides:** when dragging a widget, show a dashed center-line guide when the widget's center aligns (±2px) with a sibling's center (x or y). Pure overlay SVG rendered in the shape util's indicator layer — no snapping behavior change, visual aid only. (If tldraw's built-in snap already covers this adequately with `snapToGrid`, verify and document instead of building.)
6. Multi-select via rubber-band drag — tldraw default, verify with widgets.

**Acceptance:** all shortcuts listed in a "?" shortcuts modal (new: `?` toggles a monochrome shortcuts overlay).

---

## Task 6 — Compile Performance Guard

1. Move compilation to a **Web Worker** when shape count > 300 (`src/core/compile.worker.ts`); below that, keep synchronous. The worker receives a plain JSON payload of IR-ready shapes (no tldraw class instances — serialize AABB + props only) and returns the four outputs.
2. Debounce stays at 35ms; worker results replace state via a monotonically increasing compile ID (ignore stale worker responses after rapid edits).
3. Header stat shows compile time (ms) when > 50ms, as a subtle hint ("compiled in 84ms").

**Acceptance:** paste 500 widgets (script it for the test) — UI stays responsive while dragging; output updates within ~150ms of drag end.

---

## Build Order

1. Task 3 (error boundary) — safety net before touching document plumbing
2. Task 1 (multi-doc) — includes migration; riskiest, do with the safety net in place
3. Task 2 (export/import) — builds on the doc model
4. Task 4 (multi-select props)
5. Task 5 (productivity pack; verify tldraw defaults first, build only what's missing)
6. Task 6 (worker compile)
7. QA: multi-doc switching under error conditions; export/import round-trip; all shortcuts; 500-shape canvas; both themes; all tests green.

## Constraints

- No new runtime deps (Web Worker is native; vite handles `?worker` imports).
- No new widget types; no serializer contract changes from v2.6 (spec column layout stays identical — only additive warning lines allowed).
- `src/core/` stays pure; worker file lives in `src/core/` but imports nothing DOM-side.
- Monochrome tokens; keyboard shortcuts must not fire while a text field has focus (check `activeElement`).
- Keep tests green; add tests for: doc registry logic, import validation, pattern-isolation, and the stale-compile-ID logic (pure parts).