# MarkDraw v2 — Agent Instructions

**Repo:** `github.com/Chandu4221/markdraw` (existing codebase: React 19 + TS + Vite + @tldraw/tldraw)
**Goal:** Transform MarkDraw from "tldraw with a plugin" into a unified, monochrome, standalone design-tool-feeling app with an expanded semantic component system.

---

## Mission

MarkDraw is a freeform wireframing canvas that compiles drawings into AI-ready markdown (spec tables, spatial grids, ASCII layout, JSON AST). The current build has two problems this task fixes:

1. **Visual inconsistency** — the app chrome is native tldraw UI, while the component palette and widgets look like a foreign library bolted on. The app must feel like ONE coherent product.
2. **Incomplete semantic catalog** — missing structural components (sections, cards already partial, plus more).

---

## Part 1 — Unified Monochrome Design System

### 1.1 Design tokens (single source of truth)

Create `src/theme/tokens.css` defining CSS custom properties. **No component may hardcode a color.**

- Neutral ramp (10 steps): `--md-neutral-0` (page bg) through `--md-neutral-9` (max contrast text). Single hue (pure gray or very slight cool tint).
- Accent: exactly ONE accent token `--md-accent` (mid-gray in monochrome mode; used only for selection, focus, active states).
- Semantic tokens map onto neutrals: `--md-bg`, `--md-surface`, `--md-border`, `--md-text`, `--md-text-muted`, `--md-accent`, `--md-danger`.
- Spacing scale (4px base), radius scale (4/6/8/12), one font family for UI, one monospace for code output.
- Dark/light: define both themes via `[data-theme='dark']` / `[data-theme='light']` on `<html>`, defaulting to `prefers-color-scheme`. Every token flips in one block. **Because the palette is monochrome, theme = inverting the neutral ramp + swapping text/bg. No per-component theme work allowed.**

### 1.2 Restyle the tldraw canvas to match

Override tldraw's CSS variables (`--tl-color-*`, background, grid dots, selection handles, toolbar) in a `tl-overrides.css` so the canvas surface, grid, selection rings, and tldraw UI all use our tokens. The tldraw toolbar/menu should read as OUR toolbar: same neutrals, same accent, same radii. Remove any tldraw default blue from selections — use `--md-accent`.

### 1.3 Redesign the component palette (left overlay)

Current palette feels like an external widget library. Rebuild it as a **unified native panel**:

- Collapsible left rail, part of the app chrome (same surface color as header, hairline border, token-based).
- Widget thumbnails are rendered **from the same shape renderer used on canvas** (single render path: `WidgetPreview` component used by both canvas ShapeUtil and palette). No separate "library" look.
- Monochrome line-art icons, 1.5px stroke, one size (18px), drawn from the same icon set as the app chrome.
- Group widgets by category with small uppercase muted labels: Layout, Content, Forms, Navigation, Feedback, Media.
- Search/filter input at top (keyboard: `/` to focus).
- Click or drag to insert (drag = preview ghost on canvas before drop).

### 1.4 App chrome consistency pass

Header, output pane, tabs, resizer, buttons, toasts must all consume the same tokens, same button component (`<MdButton>` with variants: solid/ghost/icon), same focus ring. Delete any inline `style={{...}}` colors found in the current `App.tsx` and CSS modules.

**Acceptance test:** Screenshot dark and light mode; a new user should not be able to tell tldraw is inside the app. Exactly one accent visible. No blue anywhere (except hyperlinks in output preview).

---

## Part 2 — Expanded Semantic Component Catalog

Extend `widgetCatalog.ts` from 21 to a full UI-vocabulary set. Every widget: (a) has a monochrome line rendering, (b) maps to a SemanticRole, (c) contributes to the markdown legend.

### 2.1 New structural components (priority)

| Widget | Role | Notes |
|---|---|---|
| **Section** | container | Full-width band with label header; distinct from Card by `variant` |
| **Card** | container | Reuse existing, add variants: `outline`, `elevated`, `flat` |
| **Hero** | container | Large banner: heading + subtext + CTA slot |
| **Header / Footer** | container | Page-level chrome bands |
| **Grid Gallery** | container | Container that auto-renders child slots in a mini-grid |
| **Split Pane** | container | Two labeled halves |

### 2.2 Additional widgets to add

- **Forms:** Search, Password field, File upload, Date picker, Stepper, Color swatch
- **Navigation:** Menu bar, Footer nav, Link, Chip/Tag, Steps indicator, Tab bar (exists: extend)
- **Content:** Heading (H1/H2/H3 variants), Paragraph, List (ordered/unordered/icon variants), Table (data variant distinct from container "table"), Blockquote, Code block, Divider (exists), Spacer, Image frame, Video frame, Badge, Stat/KPI block
- **Feedback:** Progress bar, Skeleton loader, Tooltip, Snackbar/Toast, Empty state, Banner (info/success/warn variants — monochrome: use border style + icon, not color)
- **Media:** Avatar group, Thumbnail strip

Target: **~40 widgets**. All monochrome; variant differences expressed through border style (solid/dashed/dotted), fill (none/surface), weight, and icons — never hue.

### 2.3 Component props model (per widget)

Keep the existing `ui-widget` shape util but formalize props:

```
type WidgetProps = { label, variant?, placeholder?, options?, iconName?, subtext?, checked?, value? }
```

Keep tldraw inline text editing for labels. Double-click → edit label. Role assignment for hand-drawn shapes stays via `meta.markdrawRole` + right-click menu.

---

## Part 3 — Legend output (required, was missing)

Every output (all tabs) must begin with a **Semantic Legend** block the receiving AI can parse:

```markdown
## MarkDraw Semantic Legend
| Notation | Meaning |
|---|---|
| `[Section]` | Page-level structural band |
| `[Card]` | Grouped content container (variants: outline/elevated/flat) |
| `[Button]` | Interactive click target |
| `<Input>` | Form input (kinds: text/search/password/date/file) |
| `(Icon)` | Graphical node; name in parentheses |
| `---` | Divider |
| `>` direction | Row / Column layout of container children |
```

Also show the legend **in-app** as a collapsible panel (the user's original idea: the legend helps the AI tool; make it visible, editable, and exported).

---

## Part 4 — ASCII layout serializer (new 4th tab)

Add `AsciiSerializer` to `src/core/`:

- Walks the containment tree, renders nested boxes with `┌ ─ ┐ │ └ ┘`, labels inside.
- Widths derived from AABB proportions, clamped 40–120 cols.
- Same visitor pattern as existing serializers; pure function `LayoutNode[] → string`.
- Output tab order: **Spec Table | Spatial Grid | ASCII Layout | JSON AST**.

---

## Part 5 — Fixes carried from review (do together)

1. **Persistence:** add `persistenceKey="markdraw"` to `<Tldraw>` so drawings survive refresh.
2. **Determinism:** remove the `Generated: <timestamp>` line from spec output (or behind a user toggle). Identical canvas → byte-identical output.
3. **Config:** expose containment tolerance (85%), row-cluster threshold (16px), grid band (32px) in a Settings popover; store in localStorage.
4. **README:** write a proper README (what it is, screenshot, quickstart, output example, legend explanation, GH Pages URL).
5. **Hardcoded stats:** header "21 UI Widgets" must derive from catalog length, not a literal.
6. **Deploy:** ensure GitHub Actions builds `dist` and publishes to GitHub Pages with `base: '/markdraw/'`.

---

## Part 6 — Build order

1. Tokens + theme flip + app chrome restyle (Part 1.1, 1.4)
2. tldraw CSS overrides (1.2)
3. Palette rebuild with shared renderer (1.3)
4. Widget catalog expansion + monochrome renderings (Part 2)
5. Legend engine: in-app panel + output block (Part 3)
6. ASCII serializer + tab (Part 4)
7. Fixes bundle (Part 5)
8. Visual QA: both themes, both modes, insert every widget, compile all 4 outputs

## Constraints

- Monochrome ONLY (neutrals + one accent). No hue anywhere in UI.
- No new runtime deps beyond existing set; icons may be inline SVG or lucide (already present).
- Keep the compiler core pure (no DOM imports in `src/core/`).
- Keep everything client-side; deploy target is GitHub Pages.