# MarkDraw v2.5 — Agent Instructions (Wireframe Edition)

**Repo:** `github.com/Chandu4221/markdraw` (existing: React 19 + TS + Vite + @tldraw/tldraw, monochrome token system, ~40 widget catalog, compiler with 4 output tabs, persistence, settings modal)

**Goal:** Make widgets look like lo-fi **wireframes** (line-glyph text, not realistic components), make every widget **directly editable** (inline text + props panel), strip tldraw internals from output via a clean IR, and lock the canvas down to MarkDraw widgets only.

---

## Part 1 — Wireframe Renderer (replaces the current "realistic" component rendering)

Reference style: hand-drawn lo-fi wireframe kits — thin 1.5px monochrome borders, no fills (or faint surface fill), text shown as **line glyphs**, images as boxes with diagonal ✕ crosses.

### 1.1 Rendering rules per element class

- **Container widgets** (Section, Card, Hero, Navbar, Modal, Split Pane, Header, Footer…): border-only rectangle + a small label chip in the top-left corner showing the widget type (e.g. `SECTION`, `CARD`), uppercase, 9px, muted.
- **Text widgets**:
  - **Label / Heading / Button text** (semantic, short): render the **actual editable text**.
  - **Paragraph / body text**: render **line glyphs** — 3–5 horizontal rounded bars, 60–100% of container width, 6px tall, muted fill. Real text lives in the prop; glyphs are just the view. (Chips/labels never glyph.)
  - Per-widget prop `showText` (boolean): when true, render actual text instead of glyphs (default false for paragraphs, always true for headings/labels).
- **Image / Video / Map placeholders**: bordered box with a single diagonal corner-to-corner ✕ cross, label chip `IMG` / `VIDEO` / `MAP`.
- **Icons / Avatars**: circle outline; avatars get a simple head-shoulders line glyph, icons show `⬡` or the chosen lucide glyph at 60% opacity.
- **Buttons**: rounded-rect border only, actual text centered. Variants via border style: solid = default, dashed = ghost/secondary.
- **Inputs**: rect with an underline-style caret glyph `⌐` left side + placeholder text in muted color.
- **Dividers / Separators**: single 1.5px line; dashed variant supported.
- **Line height of glyphs**: 8px bar + 4px gap. Number of glyph bars derived from widget height (`floor(h / 12)`), clamped 1–8.

### 1.2 Implementation

- All wireframe drawing lives in `UIWidgetShapeUtil.component` as SVG using the app's CSS token variables (`stroke: var(--md-text)`, fill `var(--md-surface)` etc.) so dark/light mode works automatically. **No hardcoded colors.**
- Extract a shared `WireframePreview` render function (props: widgetType, props, theme) used by BOTH the canvas shape util and the palette thumbnails, so palette and canvas are pixel-identical.

---

## Part 2 — Direct Editing (the user's core complaint)

### 2.1 Inline text editing

- Implement tldraw's editing contract on the `ui-widget` shape util (`canEdit` / `canEditInReadOnly` flags + `component` editing state): **double-click** a widget → focus a text cursor on its primary text prop (Button label, Heading text, Paragraph text, Input placeholder, Section title, Card title).
- Enter commits; Esc cancels; clicking outside commits. Tab while editing moves to next widget in reading order (stretch goal — nice to have).
- While editing, show **actual text** even for paragraph widgets (temporarily override the glyph view).

### 2.2 Properties mini-panel

- When exactly one widget is selected, show a small floating **props panel** anchored near the shape (or docked right edge of canvas — agent's choice, be consistent): monochrome, token-styled, collapsible.
- Fields per widget (only render fields the widget supports):
  - `label` (text), `placeholder` (text, inputs only), `variant` (dropdown: per-widget list), `iconName` (dropdown of ~20 lucide names), `checked` (toggle), `options` (comma-separated, select/radio/tabs only), `value` (number, slider/progress only), `subtext` (text), `showText` (toggle, paragraph only), `altText` (text, image placeholders).
- Edits apply live via `editor.updateShape`. Multi-select hides the panel.

---

## Part 3 — Clean IR (fixes the "encoded tldraw JSON" leak)

- New module `src/core/ir.ts`: the canonical intermediate representation. Every compile goes **shapes → IR → serializers**; every IR node contains ONLY: `id, widgetType, role, label, textProps (label/placeholder/subtext/altText/options/value/checked/variant/showText), bounds {x,y,w,h}, children[], parent`. **No tldraw fields (type, meta, dash, color enums) ever leave the IR.**
- Rewrite `jsonAst` serializer to emit the IR tree (pretty-printed, deterministic key order — `Object.keys` sorted alphabetically).
- Widgets-only canvas (Part 5) means the LegendEngine color/dash heuristics for hand-drawn shapes become dead code — remove them; role comes from widget type directly.

---

## Part 4 — Semantic Markdown Notation (user chose line-glyphs on canvas + real semantics in markdown)

### 4.1 Notation system

Bracket tags, lowercase, with text in quotes. This is THE contract for AI consumers:

```
[btn "Send"]        button with label
[btn "Send" ghost]  button with variant
[header "About Us"] heading (variants: h1/h2/h3 in textProps)
[para]              paragraph (glyph on canvas; text in Child/Text column)
[input "Email..."]  text input, placeholder shown
[search "Search..."] [password] [date] [file "Upload"] [select "A|B|C"] [slider 50]
[check "Remember me" on] [radio "Option" off] [toggle on]
[nav "Home, About, Contact"]  navbar item list
[link "Read more"]  [chip "New"] [tag "beta"] [tabs "Tab1|Tab2|Tab3"]
[crumb "Home / Docs / API"] [steps 1-4 "Shipping"] [pag 1/5]
[section "Our Portfolio"]   structural band with title
[card "Profile"]   [card "Profile" elevated]  [hero] [modal "Confirm"] 
[split] [grid 3x2] [list 5] [quote] [code "npm install"] [kpi "1.2k"]
[img "hero-banner"] [video "intro.mp4"] [map] [avatar] [icon "settings"]
[divider] [spacer] [progress 60] [skeleton] [toast "Saved!"] [badge "3"]
[empty "No items"] [banner "Heads up" warn] [table 4x3]
```

Rules: no tag → `[unknown]`; escape `|` inside text as `\|`; variants/flags after the quoted text, space-separated.

### 4.2 Output changes

- **Spec table**: `Component` column uses this notation exactly. Legend block at top maps every notation → meaning (generated from the catalog, so it never drifts).
- **ASCII layout tab**: use the notation as box labels, truncated to fit.
- Legend must state the line-glyph convention explicitly, e.g.: `_text shown as ___ lines on canvas; actual text preserved here_`.

---

## Part 5 — Lock Down tldraw

- Hide tldraw's default UI: configure `<Tldraw>` with a minimal, hidden toolbar (or `<TldrawUi>` overrides) — **keep only** select, pan/zoom, undo/redo, delete, and the widget insertion tool. Style whatever remains with our tokens (extend existing `tl-overrides.css`).
- Restrict tools: `editor.updateInstanceState({ isToolLocked: true })` pattern / toolbar config so users cannot create geo/draw/text/arrow shapes. Non-`ui-widget` shapes should be impossible to create; as a safety net, the compiler ignores any non-widget shape and the app shows a one-time toast: "MarkDraw supports wireframe components only."
- Keep `persistenceKey`, grid dots, snap-to-grid ON for widgets (aligned wireframes compile deterministically).

---

## Part 6 — Build order & acceptance

1. Part 3 (IR) — unblocks everything; serializers refactored to consume IR
2. Part 1 (wireframe renderer + shared WireframePreview for palette)
3. Part 2.1 (inline editing), then 2.2 (props panel)
4. Part 4 (notation + regenerated legend)
5. Part 5 (tldraw lockdown)
6. QA: insert every widget → double-click edit its text → verify glyph rendering → verify markdown notation matches Part 4.1 exactly → dark AND light mode → refresh restores canvas (persistence) → JSON tab contains zero tldraw field names.

## Constraints

- Monochrome only; all colors from CSS tokens.
- No new runtime deps (lucide + existing stack only).
- `src/core/` stays DOM-free and pure.
- Deterministic output: identical canvas → byte-identical markdown (no timestamps by default).