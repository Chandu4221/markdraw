# MarkDraw v5.1 Wiring Audit (§1.1)

This audit documents which components exist, their definitions and import paths, and whether they are currently reachable in the running `App.tsx` render tree.

---

## Component Wiring Status

| Component / Feature | Defining File | Imported By | App Reachability | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`InspectorShell`** | `src/components/inspector/InspectorShell.tsx` | `UnifiedInspectorPanel.tsx`, `index.ts` | **None** — not rendered in `App.tsx` or `ExcalidrawCanvas.tsx` | ❌ **NOT WIRED** |
| **`CanvasOverviewSection`** | `src/components/inspector/CanvasOverviewSection.tsx` | `InspectorShell.tsx` | Not reachable (child of `InspectorShell`) | ❌ **NOT WIRED** |
| **`RoleSection`** | `src/components/inspector/RoleSection.tsx` | `InspectorShell.tsx` | Not reachable (child of `InspectorShell`) | ❌ **NOT WIRED** |
| **`StyleSection`** | `src/components/inspector/StyleSection.tsx` | `InspectorShell.tsx` | Not reachable (child of `InspectorShell`) | ❌ **NOT WIRED** |
| **`RolePanel`** | `src/components/RolePanel.tsx` | None | Deprecated alias of `UnifiedInspectorPanel` | ❌ **NOT WIRED** |
| **`RoleChipsOverlay`** | `src/annotation/RoleChipsOverlay.tsx` | `ExcalidrawCanvas.tsx` | Rendered inside `ExcalidrawCanvas`, but `showRoleChips` setter missing in `App.tsx` | ⚠️ **PARTIALLY WIRED** (Chips render, toggle broken) |
| **Coverage Indicator** | `src/components/output/OutputPanel.tsx` | `App.tsx` | Rendered in `OutputPanel` compile header; calculated in `useCompilation.ts` | ✅ **WIRED** |
| **Clickable Lint Rows** | `src/components/output/OutputPanel.tsx` | `App.tsx` | Rendered in `OutputPanel`; triggers `panTo` and `setSelection` via `handleLintClick` | ✅ **WIRED** |
| **`OnboardingModal`** | `src/components/modals/OnboardingModal.tsx` | `App.tsx` | Rendered in `App.tsx`; triggers on first load & header button | ✅ **WIRED** |
| **Starter Templates** | `src/canvas/templates/starterTemplates.ts` | `DocumentMenu.tsx`, `App.tsx` | Rendered in `DocumentMenu` dropdown; stamped via `handleSelectTemplate` | ✅ **WIRED** |
| **Output Panel Tabs** | `src/components/output/OutputPanel.tsx` | `App.tsx` | Rendered in `OutputPanel` (spec, grid, ascii, json) | ✅ **WIRED** |
| **Copy Buttons** | `src/components/output/OutputPanel.tsx` | `App.tsx` | Copy active & Copy full contract wired to `useCompilation` | ✅ **WIRED** |
| **Platform Selector** | `src/components/output/OutputPanel.tsx` | `App.tsx` | Platform switcher (Web, Android Material 3) wired in `OutputPanel` | ✅ **WIRED** |
| **Scope Toggle** | `src/components/output/OutputPanel.tsx` | `App.tsx` | Selection scope toggle (all vs selection) wired in `OutputPanel` | ✅ **WIRED** |

---

## Action Items for Phase 1

1. **Mount Inspector**: Wire selection listener `driver.onSelectionChanged(setSelectedIds)` into `App.tsx` and mount `InspectorShell` into the docked workspace layout (or Excalidraw sidebar).
2. **Role Chips Toggle**: Add `setShowRoleChips` to `App.tsx`, wire into `SettingsModal`, and persist to `localStorage` key `markdraw_show_role_chips`.
3. **Verify Coverage & Lints**: Ensure dynamic updates of `Tagged N/M shapes` and verify `panTo` / `setSelection` behavior on canvas shapes.
4. **Migration Exporter Test**: Audit `v5-export.tldraw.ts` and verify with `v51_migration_export.test.ts`.
5. **Responsive Props Invariant**: Enforce that responsive props in the inspector require an ancestor `page` with `responsive` behavior flag.
