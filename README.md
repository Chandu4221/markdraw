# MarkDraw v2.0 📐

> **Canvas-to-Markdown Spatial Compiler for Large Language Models**  
> 100% Client-Side SPA · Zero Runtime AI · Deterministic Computational Geometry · Built with React 19, TypeScript, and `@tldraw/tldraw`.

---

## What is MarkDraw?

Feeding visual wireframes and UI mockups to multimodal LLMs (GPT-4o, Claude 3.5 Sonnet) introduces **vision drift**: hallucinated paddings, missed nested components, misplaced flex directions, high API token costs, and slow inference.

**MarkDraw** completely eliminates this bottleneck. It runs an in-browser deterministic spatial compiler that parses freeform vector shapes and a library of **54+ typed semantic UI widgets** into clean, structured GitHub-Flavored Markdown (GFM) tables, ASCII wireframes, and JSON Abstract Layout Trees (ALT) in real time.

---

## Key Features

- ⚡ **Zero-Runtime-AI & Deterministic**: Output is compiled using pure $O(N \log N)$ computational geometry (AABB containment trees, spatial clustering, and topological sorting). Identical drawings generate byte-for-byte identical markdown.
- 🎨 **Unified Monochrome Design System**: Neutral-ramp design tokens with zero color leakage, unified dark and light mode inversion, and customized `@tldraw/tldraw` canvas integration.
- 🧩 **54+ Semantic UI Components**: Drag, click, or draw realistic wireframes with full semantic metadata across 6 categories:
  - **Layout**: Section Bands, Cards (outline/elevated/flat), Hero Banners, Headers, Footers, Grid Galleries, Split Panes, Modals.
  - **Forms**: Buttons, Text Inputs, Search, Passwords, Textareas, Checkboxes, Radios, Toggles, Dropdown Selects, Sliders, File Uploads, Date Pickers, Steppers, Swatches.
  - **Navigation**: Navbars, Menubars, Sidebars, Tab Strips, Breadcrumbs, Pagination, Footer Links, Chips, Step Indicators.
  - **Content**: Headings (H1–H3), Paragraphs, Lists, Data Tables, Blockquotes, Code Blocks, Dividers, Spacers, Image Frames, Video Frames, Stat / KPI Cards.
  - **Feedback**: Progress Bars, Skeleton Loaders, Tooltips, Toasts, Empty States, Announcement Banners.
  - **Media**: Avatars, Avatar Groups, Thumbnail Strips, Badges, Icons.
- 📖 **Embedded Semantic Legend**: Prepend standardized legend tables to outputs so AI agents interpret UI notations deterministically.
- 🔲 **4 Live Output Formats**:
  1. **Spec Table**: Component hierarchy paths, semantics, layout flow (`Row` vs. `Column`), props, and child contents.
  2. **Spatial Grid**: 2D coordinate-clustered pipe table representing visual positioning.
  3. **ASCII Layout**: Unicode box-drawing character wireframe (`┌ ─ ┐ │ └ ┘`).
  4. **AST (JSON)**: Fully-typed Abstract Layout Tree for programmatic integration.
- 💾 **Local-First & Offline**: Zero network calls post-hydration. State persists locally in IndexedDB (`persistenceKey="markdraw"`).
- 🎛️ **Configurable Tolerances**: Adjust containment threshold, row-clustering variance, and grid bands via in-app Settings.

---

## Semantic Legend

| Notation | Meaning |
| :--- | :--- |
| `[Section]` | Page-level structural band |
| `[Card]` | Grouped content container (variants: outline/elevated/flat) |
| `[Button]` | Interactive click target |
| `<Input>` | Form input (kinds: text/search/password/date/file) |
| `(Icon)` | Graphical node; name in parentheses |
| `---` | Divider / Separator |
| `>` direction | Row / Column layout of container children |

---

## Output Example (Spec Table)

```markdown
## MarkDraw Semantic Legend
| Notation | Meaning |
| :--- | :--- |
| `[Section]` | Page-level structural band |
| `[Card]` | Grouped content container (variants: outline/elevated/flat) |
| `[Button]` | Interactive click target |
| `<Input>` | Form input (kinds: text/search/password/date/file) |

---

### MarkDraw UI Specification
**Roots Detected:** 1 view(s)

#### Semantic Hierarchy Table
| Path | Component | Semantics | Layout Flow | Props & Attributes | Children / Content |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Root` | AuthModal | <Modal> | Column | title="Sign In", width="440px" | ModalHeader, FormContainer, Actions |
| `Root > AuthModal > FormContainer` | EmailInput | <Input> | Row | placeholder="you@work.com", required=true | "Work Email" |
| `Root > AuthModal > FormContainer` | PasswordInput | <Input> | Row | placeholder="••••••••", required=true | "Password" |
| `Root > AuthModal > FormContainer` | RememberMe | <Checkbox> | Row | checked=true | "Remember me for 30 days" |
| `Root > AuthModal > Actions` | SubmitBtn | <Button> | Row | variant="solid" | "Log In to Account" |
```

---

## Quickstart

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation
```bash
git clone https://github.com/Chandu4221/markdraw.git
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

---

## Deployment Target

MarkDraw is pre-configured for **GitHub Pages** deployment with GitHub Actions:
- Production Base Path: `/markdraw/`
- Target: 100% static client-side single page app.
