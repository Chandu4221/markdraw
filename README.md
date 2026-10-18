# MarkDraw v4.0 📐

> **MarkDraw — the semantic layer between human visual intent and AI generation.**  
> 100% Client-Side SPA · Native tldraw Freehand Drawing · 31 Semantic Roles · Custom Units Lifecycle · Platform Profiles · Built with React 19, TypeScript, and `@tldraw/tldraw`.

---

## What is MarkDraw?

Feeding visual wireframes and freehand sketches to multimodal LLMs introduces **vision drift**: hallucinated paddings, missed nested components, misplaced flex directions, ambiguous hierarchy, high API token costs, and slow inference.

**MarkDraw v4.0** eliminates this bottleneck. Instead of forcing rigid, pre-canned UI widget shapes, MarkDraw restores full freehand tldraw tools (pencil, geometric shapes, text, arrows, frames) and adds a lightweight **semantic annotation layer** (`shape.meta.markdraw`).

Draw whatever you want, tag shapes with intuitive semantic roles, package reusable components into custom units, target your preferred platform profile, and export a compact, deterministic markdown contract.

---

## Key Features in v4.0

- ✏️ **Unconstrained Freehand & Native tldraw Canvas**:
  - Full native tldraw drawing experience restored (`pencil`, `geo`, `text`, `arrow`, `frame`, `note`).
  - Zero custom shape utilities or rigid widget constraints. Draw wireframes, pamphlets, mobile screens, or diagrams freely.
- 🏷️ **The Annotation Layer (31 Semantic Roles)**:
  - Non-destructive metadata stored on standard tldraw shapes (`shape.meta.markdraw`).
  - 31 precise semantic roles across 6 categories:
    - **Structure**: `page`, `section`, `card`, `footer`, `separator`
    - **Content**: `heading`, `para`, `img`, `video`, `table`, `carousel`, `stat`
    - **Interaction**: `button`, `input`, `textarea`, `select`, `checkbox`, `radio`, `switch`, `slider`, `stepper`
    - **Navigation**: `navbar`, `sidebar`, `tabs`, `steps`, `nav`
    - **Feedback**: `avatar`, `badge`, `banner`, `dialog`
    - **Utility**: `group`
- 🎨 **Canvas Role Badges & Contextual Floating Role Panel**:
  - Visual role indicator badges on annotated canvas shapes.
  - Floating Role Panel offering instant role selection, alias search (e.g. `cta` → `button`, `appbar` → `navbar`), responsive settings, variants, and behavior flags.
- 📦 **Custom Units Lifecycle**:
  - Save any annotated group or container as a reusable **Custom Unit** (e.g., `Follow Card`, `Pricing Tier`, `User Avatar`).
  - Stamp units anywhere across the canvas; compiled specs reference them cleanly by unit name.
- 📱 **Platform Profiles**:
  - **Web**: Standard semantic HTML & CSS conventions.
  - **Android (Material 3)**: Targets Scaffold, TopAppBar, NavigationBar, BottomSheet, and Material 3 guidelines.
- 🔍 **Selection-Scoped Compile & Per-Root Copy**:
  - Hover any root frame or card to copy its lean contract directly to clipboard.
  - Selection-scoped compile allows compiling just the selected subtree, complete with header metadata:
    `_Scoped compile: "Follow Card" — 1 unit, 3 nodes (of 4 in "Feed Page")_`
- 🛡️ **Comprehensive §13 Lint Engine**:
  - Real-time compile lints identify untagged shapes, loose shapes outside frames, responsive hierarchy mismatches, invalid flags, and repetitive sibling labels without blocking compilation.
- 🔄 **Lossless v3 Document Migration**:
  - Automatically migrates legacy v3 `ui-widget` documents to v4 native geometric shapes with `shape.meta.markdraw` annotations.
- ⚡ **20/20 Benchmark-Proven Fidelity**:
  - Achieves 100% PASS on the MarkDraw benchmark suite across 20 wireframe fixtures with +79.5% structural fidelity improvement over visual-only baseline.

---

## Semantic Bracket Notation Contract

| Notation | Meaning | Example |
| :--- | :--- | :--- |
| `[page "Title"]` | Viewport or screen root frame | `[page "Feed Page"]` |
| `[button "Text" variant]` | Actionable button (solid, ghost, outline) | `[button "Follow" outline]` |
| `[heading "Title" h1-h6]` | Typography heading | `[heading "Alex" h3]` |
| `[para]` | Body text / paragraph | `[para]` |
| `[navbar "Items" flags]` | Top navigation bar | `[navbar "Home, About" sticky]` |
| `[card "Title" variant]` | Content card container | `[card "Profile" elevated]` |
| `[avatar]` | Person profile avatar | `[avatar]` |
| `[input "Placeholder"]` | Form input field | `[input "Email..."]` |
| `[switch on/off]` | Toggle switch control | `[switch on]` |
| `[check "Label" on/off]` | Checkbox control | `[check "Remember me" on]` |
| `[stat "Value" variant]` | Metric / KPI display | `[stat "98%" progress]` |
| `[dialog "Title"]` | Modal / popup dialog | `[dialog "Confirm Action"]` |

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

### Run Benchmark Harness (Fidelity Decision Gate)
```bash
npm run bench
```
Evaluates the automated structural fidelity scoring engine across 20 wireframe fixtures across 4 categories (`conventional`, `unconventional`, `dashboard`, `mobile`), testing MarkDraw's Lean Contract against ASCII visual proxies and raw ASTs, logging detailed output to `bench/REPORT.md`.

### Production Build
```bash
npm run build
```
