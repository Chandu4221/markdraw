# MarkDraw 📐

> **A semantic annotation layer between human visual intent and AI generation.**  
> Freehand-draw anything on a canvas, declare what each shape *means*, and export a compact, deterministic markdown contract for LLMs.  
> Built with React 19, TypeScript, Tailwind v4, and `@tldraw/tldraw`.

---

## What is MarkDraw?

When visual wireframes or freehand sketches are fed to multimodal LLMs, the model has to *guess* structure from pixels: padding, nesting, flex direction, and hierarchy can all drift from what the author intended.

MarkDraw takes a different approach: keep freehand drawing (no rigid widget libraries), and add a lightweight **semantic annotation layer** on top — each shape carries structured metadata (`shape.meta.markdraw`) declaring its role, hierarchy, and behavior. The compiler then emits a **deterministic markdown contract** the AI can follow without guessing.

**The intent**: the contract *constrains* the AI to what the author declared, rather than relying on vision inference. Whether it *outperforms* a screenshot in end-to-end generation has not yet been measured with live models — that benchmark is on the roadmap (see [Roadmap](#roadmap)).

---

## Key Features

- ✏️ **Freehand canvas (native tldraw)** — pencil, geo shapes, text, arrows, frames; no custom widget shapes.
- 🏷️ **31 semantic roles** — closed vocabulary: Structure (`page`, `section`, `card`, `footer`, `separator`), Content (`heading`, `para`, `img`, `video`, `table`, `carousel`, `stat`), Interaction (`button`, `input`, `textarea`, `select`, `checkbox`, `radio`, `switch`, `slider`, `stepper`), Navigation (`navbar`, `sidebar`, `tabs`, `steps`, `nav`), Feedback (`avatar`, `badge`, `banner`, `dialog`), Utility (`group`).
- 🎨 **Role badges & Unified Inspector Panel** — search-with-aliases (`cta` → `button`, `appbar` → `navbar`), integrated visual styles, compiler settings, behavior flags, responsive props, variants.
- 📦 **Custom Units** — save an annotated group as a reusable unit (e.g. `Follow Card`), stamp it anywhere, reference it by name in contracts.
- 📱 **Platform profiles** — Web (semantic HTML/CSS conventions) and Android/Material 3 (TopAppBar, NavigationBar, Scaffold conventions) as compile-time output translations.
- 🔍 **Scoped compile & per-root copy** — compile the selection's subtree or copy a single root frame's contract from the canvas.
- 🛡️ **Compile lints** — informational warnings: untagged shapes, loose shapes, responsive mismatches, invalid flags, repetitive sibling labels. Never blocking.
- 🔄 **v3 → v4 document migration** — converts legacy widget documents to annotated native shapes. Best-effort and linted; the migration map and its tests live in `src/annotation/migrate.ts`.

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

## Benchmark — what is actually measured

`npm run bench` runs an **internal, deterministic** harness: 20 wireframe fixtures across 4 categories (conventional, unconventional, dashboard, mobile), comparing the lean contract against ASCII structural proxies and raw ASTs, with a scoring engine logging to `bench/REPORT.md`.

**What this proves:** the compiler emits contracts that structurally match the drawn layout, deterministically, with regression gates.

**What this does *not* prove:** that a live LLM (GPT/Claude/Gemini) generates *better final UIs* from a MarkDraw contract than from a screenshot, prose notes, or raw tldraw JSON. That end-to-end comparison has not been run yet. Any prior versions of this README stating a "+79.5% structural fidelity improvement" figure should be treated as unverified until the harness output is published alongside the claim.

---

## Attribution & Credits

MarkDraw's architecture and design were shaped through extensive design sessions with the maintainer's AI collaborators, including Claude (Anthropic) and Vibe/Mistral (GLM), whose critiques and proposals materially influenced the v4 annotation-layer design. The project gratefully builds on **tldraw** — see below.

---

## License & Dependencies

- **MarkDraw's own code**: MIT (see [LICENSE](LICENSE) file).
- **`@tldraw/tldraw`**: NOT MIT. tldraw uses its own license — free for development, hobby (non-commercial, watermark) and trial licenses available, **commercial production use requires a paid license key**. See [tldraw's license terms](https://tldraw.dev/community/license). Deploying or selling a product built on tldraw requires verifying your license status with tldraw.
- Anyone cloning and running this repo in development mode is within tldraw's default terms; hosted/commercial deployments are not.

---

## Roadmap

- [ ] Live-LLM end-to-end benchmark (contract vs screenshot vs prose vs raw JSON, ≥3 models), results published here
- [x] `LICENSE` file (MIT for MarkDraw code, dependency notice for tldraw)
- [ ] CLI (`markdraw compile <file> --root X`) and MCP server for agent integrations
- [ ] Canvas adapter layer (loose coupling to the editor — Excalidraw port under evaluation)
- [ ] Authoring speed: coverage indicator, bulk tagging, clickable lints, starter templates
- [ ] Per-root platform profiles, breakpoint-keyed responsive model
- [ ] Contract versioning in output headers + JSON Schema for `meta.markdraw`

---

## Quickstart

**Prerequisites:** Node.js ≥ 20, npm ≥ 10

```bash
git clone git@github.com:Chandu4221/markdraw.git
cd markdraw
npm install
npm run dev        # development server
npm test           # unit tests
npm run bench      # deterministic fidelity harness
npm run build      # production build
```

## Repository Status

This project is a personal/passion project in active development. The annotation layer, compiler, units, and platform profiles are feature-complete and tested at the unit level; the roadmap items above (especially live-model evidence and licensing) are prerequisites for any commercial or hosted use.
