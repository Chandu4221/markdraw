# MarkDraw v3.0 📐

> **Canvas-to-Markdown Spatial Compiler for Large Language Models**  
> 100% Client-Side SPA · Lo-Fi Wireframe Renderer · Clean IR AST · Double-Click Editing · Built with React 19, TypeScript, and `@tldraw/tldraw`.

---

## What is MarkDraw?

Feeding visual wireframes and UI mockups to multimodal LLMs introduces **vision drift**: hallucinated paddings, missed nested components, misplaced flex directions, high API token costs, and slow inference.

**MarkDraw** completely eliminates this bottleneck. It runs an in-browser deterministic spatial compiler that parses lo-fi wireframe canvas layouts into clean, structured GitHub-Flavored Markdown (GFM) tables, ASCII wireframes, and pure JSON Intermediate Representation (IR) trees in real time.

---

## Key Features in v2.5

- 🖋️ **Authentic Lo-Fi Wireframe Renderer**:
  - Thin 1.5px monochrome borders and clean surface fills.
  - **Line Glyphs**: Paragraph and body text render as crisp horizontal rounded glyph bars (`───`). The real text is preserved in markdown output.
  - **Diagonal ✕ Crosses**: Image, video, and map placeholders render as bordered boxes with diagonal crosses.
  - **Line-Art Avatars**: Circle outlines with minimal head-shoulder arcs.
- ✏️ **Direct Inline Editing**:
  - **Double-click** any widget on canvas to instantly focus an inline cursor and edit its primary text label or placeholder.
  - Press `Enter` to commit, `Esc` to cancel, or click outside.
- 🎛️ **Floating Properties Mini-Panel**:
  - Selecting a single widget reveals a compact, collapsible property inspector for live tweaking of labels, placeholders, variants, icons, toggle states, options, values, and line-glyph display toggles.
- 🌲 **Clean Intermediate Representation (IR)**:
  - Strict **Shapes → IR → Serializers** pipeline.
  - **Zero tldraw internals** in the JSON AST export. Only pure semantic fields (`id`, `widgetType`, `role`, `label`, `textProps`, `bounds`, `children`, `parent`, `direction`, `path`) formatted with deterministic alphabetical key ordering.
- 🏷️ **Bracket-Tag Semantic Notation**:
  - Concise notation contract designed specifically for AI consumers:
    `[btn "Send"]`, `[card "Profile" elevated]`, `[input "Email..."]`, `[check "Remember me" on]`, `[para]`, `[nav "Home, About"]`.
- 🔒 **Canvas Lockdown**:
  - Default tldraw draw/shape tools and heavy toolbars are disabled. The canvas is locked strictly to MarkDraw UI widgets.
  - Sleek monochrome floating canvas control bar (Select, Pan, Undo, Redo, Zoom, Delete).
- 🧩 **54+ Typed Semantic UI Widgets**:
  - Categorized across Layout, Forms, Navigation, Content, Feedback, and Media.
- 🔲 **4 Live Output Formats**:
  1. **Spec Table**: Semantic bracket notation, hierarchy paths, layout flow (`Row` vs. `Column`), props, and child contents.
  2. **Spatial Grid**: 2D coordinate-clustered pipe table representing visual positioning.
  3. **ASCII Layout**: Unicode box-drawing character wireframe (`┌ ─ ┐ │ └ ┘`).
  4. **AST (JSON)**: Clean, deterministic Intermediate Representation tree.
- 💾 **Local-First & Offline**: State persists locally in IndexedDB (`persistenceKey="markdraw"`).

---

## Semantic Bracket Notation Contract

| Notation | Meaning | Example |
| :--- | :--- | :--- |
| `[btn "Text" variant]` | Button (solid, ghost, dashed) | `[btn "Send" ghost]` |
| `[header "Title" h1]` | Heading typography (h1, h2, h3) | `[header "About Us" h1]` |
| `[para]` | Body paragraph (line glyphs on canvas) | `[para]` |
| `[input "Placeholder"]` | Text / form input field | `[input "Email..."]` |
| `[search "Query"]` | Search input with caret glyph | `[search "Search..."]` |
| `[check "Label" on/off]` | Checkbox with state | `[check "Remember me" on]` |
| `[radio "Label" on/off]` | Radio button with state | `[radio "Option" off]` |
| `[toggle on/off]` | Switch toggle with state | `[toggle on]` |
| `[select "A\|B\|C"]` | Dropdown select choices | `[select "Option 1\|Option 2"]` |
| `[slider N]` | Range slider value | `[slider 50]` |
| `[nav "A, B, C"]` | Navbar navigation items | `[nav "Home, About, Docs"]` |
| `[tabs "A\|B\|C"]` | Tab selection group | `[tabs "Overview\|Specs"]` |
| `[section "Title"]` | Structural container band | `[section "Our Portfolio"]` |
| `[card "Title" variant]` | Content card container | `[card "Profile" elevated]` |
| `[img "Alt"]` | Image placeholder with ✕ cross | `[img "hero-banner"]` |
| `[icon "Name"]` | Graphical icon | `[icon "settings"]` |
| `[divider]` | Horizontal separator line | `[divider]` |

---

## Quickstart

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation
```bash
git clone git@github.com:Chandu4221/markdraw.git
cd markdraw
npm install
```

### Development
```bash
npm run dev
```

### Run Automated Tests
```bash
npm run test
```

### Production Build
```bash
npm run build
```
