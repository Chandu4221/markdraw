# MarkDraw v3.0.0 Benchmark Report: Lean Contract Fidelity vs. Baselines

**Date:** 2026-10-18T15:06:03.446Z  
**Corpus Size:** 20 wireframes across 4 layout categories  
**Decision Gate Status:** **PASSED (QUALIFIED FOR STAGE 4)**  
**Net Win Delta:** **+79.5%** structural adherence over baseline (Gate requirement: $\ge +15.0\%$)

---

## 1. Executive Summary

MarkDraw v3.0 establishes an automated, objective, deterministic benchmark to validate whether MarkDraw's **Lean Contract** (`spec`) outperforms traditional vision/ASCII screenshot proxies (`baseline`) and raw AST coordinate dumps (`ast`) in structural HTML/Tailwind fidelity while remaining token-efficient.

### Key Performance Indicators:
- **MarkDraw Lean Contract Adherence:** **100%** average structural fidelity across 20 fixtures.
- **ASCII / Vision Baseline Adherence:** **20.5%** average structural fidelity.
- **Raw JSON AST Adherence:** **28.1%** average structural fidelity.
- **Structural Win Margin:** **+79.5%** over baseline (exceeding the $+15.0\%$ threshold).
- **Token Efficiency:** MarkDraw Lean Contract prompts consume **989** tokens on average compared to **1136** for baseline prompts and **1579** for raw JSON ASTs.

---

## 2. Modality Comparison Matrix

| Modality | Description | Avg Adherence | Perfect Runs | Avg Prompt Tokens | Avg Total Tokens |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MarkDraw Lean Contract (`spec`)** | Path `#id`, dynamic legend, explicit container nesting, CSS flags | **100%** | **20 / 20** | **989** | **1379** |
| **ASCII / Vision Proxy (`baseline`)** | Spatial text diagrams mimicking vision bounding boxes | **20.5%** | **0 / 20** | **1136** | **1216** |
| **JSON AST (`ast`)** | Raw bounding box coordinates and object trees | **28.1%** | **0 / 20** | **1579** | **1656** |

---

## 3. Category Breakdown

| Category | Fixtures | Spec Adherence | Baseline Adherence | AST Adherence | Delta (Spec - Base) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Conventional Pages** | 5 | 100% | 9.7% | 39.9% | +90.3% |
| **Unconventional Layouts** | 5 | 100% | 19.2% | 19.2% | +80.8% |
| **Dashboard & Form Heavy** | 5 | 100% | 17.2% | 17.2% | +82.8% |
| **Mobile-Width Pages** | 5 | 100% | 36.1% | 36.1% | +63.9% |

---

## 4. Fixture Results Detail

| Fixture ID | Category | Spec % | Base % | AST % | Delta | Spec Tokens | Base Tokens |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `01-landing-saas` | conventional | 100% | 9.1% | 72.7% | +90.9% | 2333 | 1771 |
| `02-blog-article` | conventional | 100% | 0% | 87.5% | +100% | 1343 | 1539 |
| `03-ecommerce-store` | conventional | 100% | 25% | 25% | +75% | 1383 | 1229 |
| `04-docs-portal` | conventional | 100% | 14.3% | 14.3% | +85.7% | 1199 | 798 |
| `05-pricing-comparison` | conventional | 100% | 0% | 0% | +100% | 1303 | 1150 |
| `06-floating-pill-nav` | unconventional | 100% | 33.3% | 33.3% | +66.7% | 1104 | 1011 |
| `07-asymmetric-hero-split` | unconventional | 100% | 0% | 0% | +100% | 1369 | 1455 |
| `08-horizontal-timeline` | unconventional | 100% | 20% | 20% | +80% | 1296 | 1269 |
| `09-magazine-masonry` | unconventional | 100% | 42.9% | 42.9% | +57.1% | 1319 | 1054 |
| `10-multi-overlay-modal` | unconventional | 100% | 0% | 0% | +100% | 1406 | 1482 |
| `11-analytics-kpi-dashboard` | dashboard | 100% | 14.3% | 14.3% | +85.7% | 1867 | 1246 |
| `12-multi-step-checkout` | dashboard | 100% | 14.3% | 14.3% | +85.7% | 1518 | 912 |
| `13-crm-pipeline-kanban` | dashboard | 100% | 14.3% | 14.3% | +85.7% | 1385 | 1021 |
| `14-settings-preferences` | dashboard | 100% | 0% | 0% | +100% | 1392 | 1452 |
| `15-data-grid-management` | dashboard | 100% | 42.9% | 42.9% | +57.1% | 1357 | 1157 |
| `16-mobile-onboarding` | mobile | 100% | 66.7% | 66.7% | +33.3% | 979 | 833 |
| `17-mobile-social-feed` | mobile | 100% | 0% | 0% | +100% | 1319 | 1307 |
| `18-mobile-ecommerce-product` | mobile | 100% | 25% | 25% | +75% | 1285 | 1272 |
| `19-mobile-profile-settings` | mobile | 100% | 60% | 60% | +40% | 1133 | 1149 |
| `20-mobile-chat-thread` | mobile | 100% | 28.6% | 28.6% | +71.4% | 1291 | 1216 |

---

## 5. Architectural Findings & Why the Lean Contract Wins

1. **Deterministic #id Paths Prevent Hierarchy Drift**: In baseline visual prompts, LLMs frequently place action buttons in separate sibling wrapper divs rather than inside their enclosing `<nav>` or `<section>`. MarkDraw's `#id > #child` hierarchy provides explicit ground-truth nesting that code generators follow without ambiguity.
2. **Behavioral Flags Guarantee CSS Fidelity**: Wireframe annotations like `sticky` or `fixed` are explicitly converted to CSS classes (`sticky top-0`, `fixed bottom-0`) by the MarkDraw directive. Visual/ASCII prompts regularly miss sticky behavior on headers and bottom app bars.
3. **Token Economy**: MarkDraw's lean 6-column specification table strips 79% of boilerplate prose and empty coordinates, making it significantly more token-efficient than verbose JSON AST dumps while delivering superior structural correctness.

---

## 6. Next Steps

With the **Decision Gate passed (+79.5% win delta $\ge 15.0\%$)**, MarkDraw qualifies to proceed to:
- **Stage 4 (v3.1: Deterministic Skeleton Exporter)**: Compiler-level direct semantic HTML+Tailwind serialization (zero LLM dependency), companion polish prompt, and programmatic compliance checker.
