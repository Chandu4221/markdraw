# MarkDraw 📐

> **A semantic annotation layer between human visual intent and AI generation.**  
> Freehand-draw anything on a canvas, declare what each shape *means*, and export a compact, deterministic markdown contract for LLMs.  
> Built with React 19, TypeScript, Tailwind v4, and `@excalidraw/excalidraw` (MIT).

---

## What is MarkDraw?

When visual wireframes or freehand sketches are fed to multimodal LLMs, the model has to *guess* structure from pixels: padding, nesting, flex direction, and hierarchy can all drift from what the author intended.

MarkDraw takes a different approach: keep freehand drawing (no rigid widget libraries), and add a lightweight **semantic annotation layer** on top — each shape carries structured metadata (`shape.meta.markdraw` / `customData.markdraw`) declaring its role, hierarchy, and behavior. The compiler then emits a **deterministic markdown contract** the AI can follow without guessing.

**The intent**: the contract *constrains* the AI to what the author declared, rather than relying on vision inference.

---

## Key Features

- ✏️ **Freehand canvas (Excalidraw MIT)** — pencil, geometric shapes, text, arrows, frames; powered by a vendor-neutral Hexagonal Architecture (`CanvasDriver`).
- 🏷️ **34 semantic roles** — canonical vocabulary:
  - **Structure**: `page`, `section`, `card`, `footer`, `separator`
  - **Content**: `heading`, `para`, `img`, `video`, `table`, `carousel`, `stat`
  - **Interaction**: `button`, `input`, `textarea`, `select`, `checkbox`, `radio`, `switch`, `slider`, `stepper`
  - **Navigation**: `navbar`, `sidebar`, `tabs`, `steps`, `nav`
  - **Feedback**: `avatar`, `badge`, `banner`, `dialog`
  - **Utility**: `group`
  - **Platform**: `fab`, `bottom_sheet`, `scaffold` (Material 3 platform roles)
- 📱 **Platform-Aware Tagging** — profile loader (`profileLoader.ts`) for Web and Android Material 3. Search and dropdown present platform vocabulary (`TopAppBar`, `NavigationBar`) while maintaining canonical role storage invariants.
- 📐 **Responsive Simulation Mode** — pure DOM-free layout reflow engine (`reflow.ts`) with interactive width slider (375px–1200px) and ghost overlay preview (`ReflowPreview.tsx`). Non-destructive, exact match with compiler `sm:` tokens.
- 🎨 **Unified Design System & Docked Sidebar** — Inspector integrated directly into Excalidraw's official `<Sidebar>` with single-authority CSS tokens (`tokens.css`), unified `MarkDrawChip`, responsive props, and variant selectors.
- 📦 **Custom Units** — save an annotated group as a reusable unit (e.g. `Follow Card`), stamp it anywhere, reference it by name in contracts.
- 💻 **Headless CLI (`bin/markdraw`)** — compile stored documents directly in terminal/CI pipelines (`markdraw compile <file> [--root <id|name>] [--platform <web|android-material>] [--scope <all|id>] [--json]`).
- 🧭 **Authoring UX & Diagnostics**:
  - **Coverage indicator**: `Tagged X/Y shapes` in the compile panel header.
  - **Clickable lints**: Click any lint warning to automatically pan and select the offending shape.
  - **Onboarding walkthrough**: 3-step interactive onboarding guide (Draw → Tag → Copy contract).
  - **Starter templates**: Instant templates for Web Landing, Mobile Feed, and Analytics Dashboard.
- 🔍 **Scoped compile & per-root copy** — compile the selection's subtree or copy a single root frame's contract directly from the canvas.

---

## Semantic Bracket Notation

| Notation | Meaning | Example |
| :--- | :--- | :--- |
| `[page "Title"]` | Viewport / screen root frame | `[page "Feed Page"]` |
| `[button "Text" variant]` | Action button | `[button "Follow" outline]` |
| `[heading "Title" h1-h6]` | Typography heading | `[heading "Alex" h3]` |
| `[para]` | Body text | `[para]` |
| `[navbar "Items" flags]` | Top navigation bar | `[navbar "Home, About" sticky]` |
| `[card "Title" variant]` | Content card container | `[card "Profile" elevated]` |
| `[avatar]` | Profile avatar | `[avatar]` |
| `[input "Placeholder"]` | Form input | `[input "Email..."]` |
| `[switch on/off]` | Toggle switch | `[switch on]` |
| `[stat "Value" variant]` | Metric display | `[stat "98%" progress]` |
| `[dialog "Title"]` | Modal dialog | `[dialog "Confirm Action"]` |

---

## CLI Usage

MarkDraw includes a standalone command-line compiler:

```bash
# Compile a stored document to markdown contract
npx markdraw compile scene.markdraw.json

# Compile a specific root screen for Android Material 3
npx markdraw compile scene.markdraw.json --root "Feed Page" --platform android-material

# Output AST in JSON format
npx markdraw compile scene.markdraw.json --json
```

---

## Benchmark — what is actually measured

`npm run bench` runs an **internal, deterministic** harness: 20 wireframe fixtures across 4 categories (conventional, unconventional, dashboard, mobile), comparing the lean contract against ASCII structural proxies and raw ASTs, with a scoring engine logging to `bench/REPORT.md`.

- **What this proves:** the compiler emits contracts that structurally match the drawn layout, deterministically, with regression gates (decision gate passing at 20/20 perfect runs with +79.5% win delta).
- **What this does *not* prove:** that a live LLM generates *better final UIs* from a MarkDraw contract than from a screenshot. That end-to-end benchmark is on the roadmap.

---

## Attribution & Credits

MarkDraw's architecture and design were shaped through extensive design sessions with the maintainer's AI collaborators, including Claude (Anthropic), Vibe/Mistral (GLM), and Antigravity (Google DeepMind). The canvas engine is powered by the excellent open-source project **Excalidraw**.

---

## License & Dependencies

- **MarkDraw code**: MIT License (see [LICENSE](LICENSE)).
- **Third-Party Dependencies**: All third-party dependencies are permissively licensed. See [LICENSE-NOTICE.md](LICENSE-NOTICE.md) for full details.
- **No Proprietary Vendor Restrictions**: MarkDraw v5 is completely free of proprietary runtime licenses, watermarks, or commercial usage barriers.

---

## Roadmap

- [x] Hexagonal canvas adapter architecture (`CanvasDriver`)
- [x] Excalidraw integration (100% MIT permissive licensing)
- [x] Headless CLI compiler (`bin/markdraw`)
- [x] Single-authority design token system (`tokens.css`) & decomposed UI (`≤ 389 lines`)
- [x] UX additions: coverage indicator, clickable lints, onboarding modal, starter templates
- [x] Pure MIT license & removal of proprietary canvas dependencies
- [ ] Live-LLM end-to-end benchmark (contract vs screenshot vs prose vs raw JSON, ≥3 models)
- [ ] Model Context Protocol (MCP) server for agent integrations
- [ ] Per-root platform profiles, breakpoint-keyed responsive model

---

## Quickstart

**Prerequisites:** Node.js ≥ 20, npm ≥ 10

```bash
git clone git@github.com:Chandu4221/markdraw.git
cd markdraw
npm install
npm run dev        # start local development server
npm test           # run all 30 test suites
npm run bench      # run deterministic benchmark harness
npm run build      # typecheck, vite build, and bundle CLI
```
