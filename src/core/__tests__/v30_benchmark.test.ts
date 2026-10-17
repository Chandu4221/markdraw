import { describe, it, expect } from 'vitest';
import { scoreHtmlOutput } from '../../../bench/scorer';
import { buildPromptPayload, estimateTokens } from '../../../bench/prompts';
import { BENCHMARK_FIXTURES } from '../../../bench/corpus/fixtures';
import { ContractDefinition } from '../../../bench/types';

describe('Stage 3 (v3.0) — Benchmark Harness & Scorer Engine', () => {
  describe('3.1 Corpus Structure & Integrity', () => {
    it('contains exactly 20 benchmark fixtures', () => {
      expect(BENCHMARK_FIXTURES.length).toBe(20);
    });

    it('distributes fixtures evenly across 4 categories (5 per category)', () => {
      const counts: Record<string, number> = {};
      for (const f of BENCHMARK_FIXTURES) {
        counts[f.category] = (counts[f.category] || 0) + 1;
      }
      expect(counts.conventional).toBe(5);
      expect(counts.unconventional).toBe(5);
      expect(counts.dashboard).toBe(5);
      expect(counts.mobile).toBe(5);
    });

    it('ensures every fixture has shapes and a valid contract with assertions', () => {
      for (const f of BENCHMARK_FIXTURES) {
        expect(f.id).toBeDefined();
        expect(f.name).toBeDefined();
        expect(f.shapes.length).toBeGreaterThan(0);
        expect(f.contract).toBeDefined();
        expect(f.contract.assertions).toBeDefined();
        expect(f.contract.assertions.expectedElements).toBeDefined();
      }
    });
  });

  describe('3.2 Automated Structural Scorer (scorer.ts)', () => {
    const testContract: ContractDefinition = {
      name: 'Test Page Contract',
      category: 'conventional',
      description: 'Test contract for unit testing',
      assertions: {
        expectedElements: {
          header: 1,
          nav: 1,
          button: { min: 2 },
          footer: 1
        },
        nesting: [
          { parent: 'header', contains: 'nav', minCount: 1 },
          { parent: 'nav', contains: 'button', minCount: 1 }
        ],
        flags: [
          { selector: 'header', expectedCss: 'sticky|fixed|top-0' }
        ],
        widths: [
          { selector: 'header', expectedClasses: ['w-full'] }
        ],
        sectionOrder: ['header', 'main', 'footer']
      }
    };

    it('scores 100% on valid HTML that satisfies all contract assertions', () => {
      const validHtml = `
        <header class="sticky top-0 w-full">
          <nav>
            <button>Nav Button</button>
          </nav>
        </header>
        <main>
          <button>Main CTA</button>
        </main>
        <footer>
          <p>Copyright</p>
        </footer>
      `;

      const result = scoreHtmlOutput(
        validHtml,
        testContract,
        'test-fixture',
        'spec',
        { promptTokens: 100, completionTokens: 100, totalTokens: 200 }
      );

      expect(result.scorePercentage).toBe(100);
      expect(result.passedAssertions).toBe(result.totalAssertions);
      expect(result.categoryScores.elements.passed).toBe(4);
      expect(result.categoryScores.nesting.passed).toBe(2);
      expect(result.categoryScores.flags.passed).toBe(1);
      expect(result.categoryScores.widths.passed).toBe(1);
      expect(result.categoryScores.order.passed).toBe(1);
    });

    it('correctly docks points when assertions fail', () => {
      // In this HTML:
      // - header lacks sticky/fixed flag (fails flag)
      // - nav is outside header (fails nesting)
      // - missing footer (fails element count)
      // - header lacks w-full (fails width)
      // - order is broken (nav -> header)
      const brokenHtml = `
        <nav><button>Only one button</button></nav>
        <header class="bg-white">Title</header>
      `;

      const result = scoreHtmlOutput(
        brokenHtml,
        testContract,
        'test-fixture',
        'baseline',
        { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
      );

      expect(result.scorePercentage).toBeLessThan(50);
      expect(result.categoryScores.flags.passed).toBe(0);
      expect(result.categoryScores.nesting.passed).toBe(1); // nav still contains button
      expect(result.categoryScores.widths.passed).toBe(0);
    });
  });

  describe('3.3 Prompt Payload Builder & Token Estimator (prompts.ts)', () => {
    it('estimates tokens deterministically', () => {
      const text = 'The quick brown fox jumps over the lazy dog.';
      const tok1 = estimateTokens(text);
      const tok2 = estimateTokens(text);
      expect(tok1).toBe(tok2);
      expect(tok1).toBeGreaterThan(5);
    });

    it('generates distinct payloads for spec, baseline, and ast modalities', () => {
      const fixture = BENCHMARK_FIXTURES[0];
      const specPayload = buildPromptPayload(fixture, 'spec');
      const basePayload = buildPromptPayload(fixture, 'baseline');
      const astPayload = buildPromptPayload(fixture, 'ast');

      expect(specPayload.modality).toBe('spec');
      expect(basePayload.modality).toBe('baseline');
      expect(astPayload.modality).toBe('ast');

      // Spec prompt should contain MarkDraw table headers
      expect(specPayload.userPrompt).toContain('MarkDraw UI Specification');
      expect(specPayload.userPrompt).toContain('| Path | Component |');

      // Baseline prompt should contain ASCII wireframe
      expect(basePayload.userPrompt).toContain('ASCII Layout Wireframe');

      // AST prompt should contain JSON AST
      expect(astPayload.userPrompt).toContain('JSON AST');
      expect(astPayload.userPrompt).toContain('"widgetType"');
    });
  });
});
