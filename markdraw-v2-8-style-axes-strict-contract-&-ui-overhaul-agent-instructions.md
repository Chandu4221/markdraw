# MarkDraw v2.8 — Agent Instructions (Style Axes, Strict Contract & UI Rebuild)

**Repo:** `github.com/Chandu4221/markdraw` (current state: v2.7 — multi-doc, error boundary, worker compile, multi-select props, placement, pattern grouping, monochrome neubrutalist styling)

**Two goals:**

1. **UI/UX OVERHAUL — drop neubrutalism.** The current "architectural neubrutalist" styling (hard offset shadows, 1.5px borders, press-translate effects) reads heavy and amateur. Rebuild the app chrome with **Tailwind CSS + shadcn/ui primitives**, clean and professional (Linear/Vercel/Raycast aesthetic), keeping the neutral monochrome ramp and dark/light theming.
2. **Style axes + strict contract** (from the experiment findings): geometric style inference, behavior flags, AI Directive compliance header.

**NOT in scope:** new widget types (except `carousel`), serializer column changes, core architecture. `src/core/` is untouched by Part U entirely.

---

## PART U — UI/UX Overhaul (Tailwind + shadcn)

### U0. Stack migration

1. Install dev deps: `tailwindcss` (v4, `@tailwindcss/vite` plugin), `shadcn` primitives via the shadcn CLI (`npx shadcn@latest add button dropdown-menu dialog select tooltip separator scroll-area input label switch checkbox slider badge tabs popover`), plus its required deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*` — pulled in by the CLI).
2. Configure Tailwind theme tokens to EXACTLY reuse the existing calibrated neutral ramp (`--md-neutral-0..9` from `src/theme/tokens.css`) via CSS variables — define Tailwind colors as `bg: var(--md-bg)` etc. so **dark/light theming continues to work through `data-theme` attribute flips with zero per-component theme code**. shadcn components must use these tokens, not their default zinc palette.
3. Keep `src/theme/tokens.css` as the single source of truth; Tailwind config references the variables. Delete ALL neubrutalist treatment tokens (`--md-shadow-interactive`, `--md-shadow-panel`, hard offset shadows, `--md-border-width: 1.5px`).

### U1. New visual language (professional, minimal)

- **Borders:** 1px, `--md-border` (neutral-4); strong = neutral-5. No 1.5px borders.
- **Shadows:** layered soft shadows (`0 1px 2px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.12)`-style, theme-adjusted via tokens). Panels/modals get real elevation, not offset blocks.
- **Radii:** 6px controls, 8px panels, 12px modals (`--md-radius-sm/md/lg/xl` = 6/8/10/12).
- **Interactions:** standard hover (surface lighten), focus-visible rings (2px accent ring, 2px offset), active = subtle 0.98 scale. **Remove all `translate(-1px,-1px)` press effects.**
- **Accent:** keep monochrome but allow ONE restrained functional accent for selection/active states: use a saturated blue `--md-accent: #3b82f6`-family (dark) / `#2563eb` (light) in BOTH themes. Selection states, active tabs, active tool buttons, resizer hover. Nowhere else.
- **Typography:** Inter (`Google Sans` import can stay as fallback but switch primary to Inter for weight availability), 13px UI base, 12px secondary, JetBrains Mono for code output (unchanged).
- **Density:** reduce. 8px rhythm instead of mixed 3–16px. Consistent 12px panel padding.

### U2. Component rebuild map (what becomes what)

| Current | New |
|---|---|
| All `.module.css` files | Delete; replace with Tailwind classes + shadcn components |
| Header buttons (`.iconBtn`, `.presetBtn`) | shadcn `Button` variant="ghost"/"outline" size="sm" |
| `DocumentMenu.tsx` (custom dropdown) | shadcn `DropdownMenu` — items: New, Open, Duplicate, Rename, Import, Export, separators |
| `LegendModal`, `SettingsModal`, `ShortcutsModal` | shadcn `Dialog` (proper focus trap, portal, Esc, backdrop) — a11y for free |
| `PropsPanel` inputs, variant dropdown, checkboxes | shadcn `Input`, `Select`, `Switch`, `Checkbox`, `Label`, `Tabs` (props grouped) |
| Output pane tabs | shadcn `Tabs` |
| Tooltips (currently `title` attr) | shadcn `Tooltip` on all icon buttons |
| Toast | lightweight custom (keep) but restyled: soft shadow, border, no offset block |
| ComponentPalette | Tailwind rebuild: 8px grid, category `Badge`-style headers, hover-lift thumbnails (1px border + subtle shadow), search `Input` with `/` kbd chip |
| Resizer | 1px divider + 4px hover accent bar + grab handle appears on hover |

### U3. tldraw overrides update (`tl-overrides.css`)

Re-skin tldraw internals to match: 1px borders, soft selection handles, blue selection ring matching `--md-accent`, monochrome style panel (hidden in v2.5 lockdown — keep hidden), grid dots at 4% opacity. tldraw's UI chrome stays hidden; overrides only affect canvas visuals (selection, handles, hover).

### U4. Wireframe canvas rendering — DO NOT restyle with Tailwind

`WireframePreview.tsx` renders SVG inside tldraw shapes; Tailwind doesn't apply there. Keep it driven by the CSS token variables (which it already is). Only update: chip styling to the new radii/typography, and glyph colors read from the SAME remapped tokens — so wireframes automatically match both themes. Zero functional change.

### U5. Migration order & acceptance

1. Install + configure Tailwind/shadcn with token mapping (U0)
2. Header + workspace shell (App.tsx layout classes)
3. DocumentMenu → DropdownMenu; modals → Dialog
4. PropsPanel → shadcn inputs; Output tabs → Tabs; tooltips
5. ComponentPalette rebuild
6. Delete all `.module.css` files + neubrutalist tokens (dead code pass)
7. tl-overrides update
8. **Acceptance:** both themes screenshot-reviewed; NO offset shadows anywhere; no 1.5px borders; focus rings visible on every interactive element; keyboard: Tab through header → document menu → palette → output tabs works; all v2.7 functionality regression-tested (multi-doc switching, import/export, shortcuts, worker compile).

---

## PART A — Geometric Style Inference (automatic, measured from canvas)

New module `src/core/style.ts` (pure, fully unit-tested). For every IR node with a parent, compute axes and attach a `style` object.

### A1. Size (`width`)
- `widthPct = round(shape.width / parent.width * 100)`
- Buckets (±2 tolerance): 95–100 → `full-width`; 75 → `75%`; 66/67 → `2/3`; 50 → `50%`; 33/34 → `1/3`; 25 → `25%`; >100 → `overflow:NN%`; else raw `NN%`.
- `height` bands only when notable: `<10% of parent → short`, `<35% → compact`; else omit.
- Noise rule: omit width when ALL siblings in the parent share the same bucket (the parent's dist axis covers it).

### A2. Alignment (`align`, `align-y`)
- Center-x vs parent center-x within ±3% → `align:center`. Right third → `align:right`. Full parent width → omit (stretch default). Left → omit (default).
- `align-y:top|middle|bottom` only when child is much shorter than parent and non-default.

### A3. Distribution (`dist`) — containers with 2+ children
- Equal gaps ≈ edge padding → `dist:space-between`
- Clustered centered → `dist:center`
- Packed leading edge → omit (default)
- Even rows+cols grid → `dist:grid cols:N rows:M`
- Wrapping rows → `dist:wrap`

### A4. Relationship (`rel`)
- Child extends beyond parent edge >5% → `rel:overflow`
- Sibling overlap 15–60% → `rel:overlap` on the later sibling (suppress old collision warning below 60%)
- Large equal inset >15% each side → `rel:inset`

### A5. Settings
New thresholds (`sizeBucketTolerance: 2`, `alignTolerance: 3`) join existing compiler settings in the (now shadcn) SettingsModal; persisted in `markdraw_settings`.

---

## PART B — Behavior Flags (user-set intent)

Closed vocabulary (NO free text), per-widget `behaviors` in `widgetCatalog.ts`:

| Flag | Applies to | Legend meaning |
|---|---|---|
| `sticky` | navbar, header, section, footer | stays fixed while scrolling |
| `floating` | navbar, card, modal, section | detached, floats over background |
| `overlay` | navbar, banner, modal | sits on top of content beneath |
| `fixed` | navbar, footer, btn | pinned to viewport edge |
| `fullscreen` | modal, hero, carousel | occupies whole viewport |
| `autoplay` | carousel, video, gallery | advances automatically |
| `parallax` | hero, img, section | background moves slower than content |
| `expandable` | card, sidebar, list | can expand to reveal more |
| `draggable` | card, modal, slider | user can drag it |
| `scroll-snap` | carousel, list, gallery | children snap when scrolled |

PropsPanel (rebuilt with shadcn) renders a "Behavior" multi-checkbox group from the catalog entry; flags stored on shape props; multi-select batch edit applies like other props. Emitted in-tag after variant: `[navbar "Home, Menu" floating sticky]`. Only user-set flags (v2.6 hygiene rule).

---

## PART C — Placement Fix + Carousel + Note

1. **Placement override (pet-store bug):** geometric `footer` = last top-level band AND top edge within bottom 35% of page; otherwise `body`. Widget TYPE wins: `footer`/`navbar` widgets emit `placement:type`, never contradicted.
2. **Intra-container positioning legend line:** `_align describes position within the parent container; do not relocate elements to conventional positions._`
3. **`carousel` widget** (media; variants: full-width, contained; behaviors: autoplay, scroll-snap; wireframe render: box with `< >` arrow glyphs and slide chips). Update WireframePreview + catalog + notation `[carousel "Title" flags]`.
4. **`note` escape hatch:** optional `note` text prop on every widget + page-level note in document header (set via PropsPanel / document menu). Emitted only when non-empty: `note:"..."`. Legend: `_note = free-text style hint (non-binding); bracket tags are the binding contract._`

---

## PART D — AI Directive (strict compliance header)

Prepended to spec markdown (and as comment/field in ASCII + JSON). Constant in new `directive.ts`, version-stamped:

```markdown
> **AI DIRECTIVE — READ FIRST**
> 1. This document is a **binding layout contract**. Follow every bracket tag, placement, width, align, dist, and behavior flag EXACTLY as written.
> 2. Do NOT relocate, reorder, restyle, or omit any component described here. Placement and alignment describe position WITHIN THE PARENT — render as specified even if unconventional.
> 3. Content marked `content: unspecified` or bare tags: you MUST generate the content — this is the only sanctioned improvisation. Match the page's domain and tone.
> 4. Everything not specified here (colors, typography, imagery, effects) is your creative freedom — UNLESS a `note:"..."` hint exists, which you should weigh.
> 5. If this contract is impossible to satisfy, state the conflict explicitly instead of silently deviating.
```

---

## PART E — Legend Auto-Generation Extension

Append style semantics section (auto-generated, never drifts):

```
**Style semantics**
| `width:50%` / `full-width` / `overflow` | measured span relative to parent |
| `align:left\|center\|right`, `align-y` | position within parent (default: stretch/left) |
| `dist:space-between\|center\|grid\|wrap` | how siblings distribute along the flow |
| `rel:overflow\|overlap\|inset` | edge relationship with parent/siblings |
| `sticky, floating, overlay, fixed, fullscreen, autoplay, parallax, expandable, draggable, scroll-snap` | user-declared behavior; implement literally |
| `note:"..."` | free-text hint, non-binding |
```

---

## PART F — Serializer Integration

1. Spec table: style props and flags join the `Props & Attributes` column (space-separated, after variant). **Column count unchanged (6).**
2. JSON AST: `style: { widthPct, align, alignY, dist, rel, behaviors[], note }` per node; omit empty.
3. ASCII tab unchanged. Page-level note in spec header (`**Page note:** ...`) when set.

---

## PART G — Tests & QA

1. Unit tests: size bucketing, alignment, distribution, relationship, placement-override, directive emission, legend completeness (every flag documented).
2. Fixture regression: floating navbar (70% width, centered, top), 50% centered testimonials, sticky footer — assert exact spec strings.
3. User acceptance: redraw the pet-store canvas with floating nav + full-width autoplay carousel + 50% centered testimonials → compile → mockup AI must reflect the axes.
4. UI acceptance (U5.8): full regression of v2.7 features post-Tailwind migration; both themes; all existing core tests green; determinism re-verified.

## Build Order

1. **Part U first** (UI rebuild on a stable feature base, before adding new surfaces) — U0→U5
2. Part C.1–C.2 (placement fix)
3. Part A (style.ts + tests)
4. Part B (behavior flags + panel)
5. Part E + legend; Part D (directive)
6. Part F (serializer integration); Part C.3–C.4 (carousel + note)
7. Full QA (both parts)

## Constraints

- New deps allowed ONLY for Part U (tailwindcss, shadcn CLI components + their deps). `src/core/` gains nothing.
- `src/core/` stays pure/DOM-free and is untouched by Part U; all new core logic unit-tested.
- Closed vocabulary for semantics; `note` is the only free-text, marked non-binding.
- Deterministic compile (styles are pure functions of bounds).
- Spec table 6 columns; directive + style legend token budget ≤ ~350 tokens.
- Dark/light theming MUST continue to work via `data-theme` token flips (no per-component theme code).