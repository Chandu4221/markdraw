import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownPreview } from '../MarkdownPreview';

describe('MarkdownPreview Component', () => {
  it('renders empty canvas placeholder when content is empty or default message', () => {
    const html = renderToStaticMarkup(<MarkdownPreview content="_Canvas is empty._" />);
    expect(html).toContain('Canvas is empty');
    expect(html).toContain('Draw shapes or drop UI widgets');
  });

  it('renders AI layout directive callout when blockquote is present', () => {
    const markdown = `> This is a binding layout contract from MarkDraw v2.9.\n> Follow every tag and id.`;
    const html = renderToStaticMarkup(<MarkdownPreview content={markdown} />);
    expect(html).toContain('AI Layout Directive (Binding Contract)');
    expect(html).toContain('This is a binding layout contract');
  });

  it('renders formatted table with path badges and component pills', () => {
    const markdown = `
### MarkDraw UI Specification
**Roots Detected:** 1 view(s)

#### Semantic Hierarchy Table
| Path | Component | Semantics | Placement | Layout Flow | Props & Attributes | Children / Content |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`Root > #8ac\` | **[page hd]** | <Page> | — | Row | variant="hd" | [header "MarkDraw SaaS"] |
| \`Root > #8ac > #fbi\` | **[header "MarkDraw SaaS"]** | <Header> | header | — | sticky full-width align-y:top | "MarkDraw SaaS" |
`;

    const html = renderToStaticMarkup(<MarkdownPreview content={markdown} />);

    // Headings
    expect(html).toContain('MarkDraw UI Specification');
    expect(html).toContain('Semantic Hierarchy Table');

    // Table elements
    expect(html).toContain('<table');
    expect(html).toContain('<thead');
    expect(html).toContain('<tbody');

    // Headers
    expect(html).toContain('Path');
    expect(html).toContain('Component');
    expect(html).toContain('Semantics');

    // Path segments rendered as breadcrumbs
    expect(html).toContain('Root');
    expect(html).toContain('#8ac');
    expect(html).toContain('#fbi');

    // Component bracket tags
    expect(html).toContain('[page hd]');
    expect(html).toContain('[header &quot;MarkDraw SaaS&quot;]');

    // Semantics badges
    expect(html).toContain('&lt;Page&gt;');
    expect(html).toContain('&lt;Header&gt;');

    // Props tokens
    expect(html).toContain('sticky');
    expect(html).toContain('full-width');
  });

  it('renders viewport simulation switcher and styles responsive tokens', () => {
    const markdown = `
### MarkDraw UI Specification
| Path | Component | Semantics | Placement | Layout Flow | Props & Attributes | Children / Content |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`Root > #c1\` | **[section]** | <Section> | body | Row | cols:2 (70/30), responsive:reverse | — |
| \`Root > #c1 > #f1\` | **[card]** | <Card> | nested | — | 2/3 (sm:full) sm:order-2 | — |
| \`Root > #c1 > #s1\` | **[card]** | <Card> | nested | — | 1/3 (sm:full) sm:order-1 sm:hidden | — |
`;

    const html = renderToStaticMarkup(<MarkdownPreview content={markdown} />);

    // Viewport Simulation Bar
    expect(html).toContain('Viewport Simulation:');
    expect(html).toContain('Desktop');
    expect(html).toContain('Mobile');

    // Responsive token badges
    expect(html).toContain('cols:2');
    expect(html).toContain('responsive:reverse');
    expect(html).toContain('sm:order-2');
    expect(html).toContain('sm:order-1');
    expect(html).toContain('sm:hidden');
  });
});
