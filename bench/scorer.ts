import { parse, HTMLElement } from 'node-html-parser';
import {
  AssertionDetail,
  ContractDefinition,
  PromptModality,
  ScorerResult
} from './types';

/**
 * Common semantic aliases for HTML element evaluation.
 */
const ELEMENT_SELECTOR_ALIASES: Record<string, string> = {
  header: 'header, [role="banner"], .header',
  nav: 'nav, [role="navigation"], .nav, .navbar',
  navbar: 'nav, [role="navigation"], .nav, .navbar',
  footer: 'footer, [role="contentinfo"], .footer',
  button: 'button, a.btn, a[role="button"], input[type="button"], input[type="submit"], [role="button"]',
  input: 'input, textarea, select',
  table: 'table, [role="table"], [role="grid"]',
  section: 'section, article, main, aside',
  hero: 'section.hero, header.hero, [data-hero], section:first-of-type, .hero',
  card: '.card, [data-card], article, div.rounded-lg, div.rounded-xl, div.border',
  modal: 'dialog, [role="dialog"], .modal, [data-modal]',
  dialog: 'dialog, [role="dialog"], .modal, [data-modal]',
  tabs: '[role="tablist"], .tabs, nav.tabs',
  kpi: '[data-kpi], .kpi, .stat, .metric'
};

function resolveSelector(typeOrSelector: string): string {
  const lower = typeOrSelector.toLowerCase().trim();
  return ELEMENT_SELECTOR_ALIASES[lower] || typeOrSelector;
}

/**
 * Safely executes querySelectorAll on an HTMLElement or root.
 */
function queryAllSafe(root: HTMLElement, selector: string): HTMLElement[] {
  try {
    const resolved = resolveSelector(selector);
    return root.querySelectorAll(resolved);
  } catch (err) {
    // Fallback: try raw selector
    try {
      return root.querySelectorAll(selector);
    } catch {
      return [];
    }
  }
}

/**
 * Evaluates an HTML string against a benchmark ContractDefinition.
 */
export function scoreHtmlOutput(
  html: string,
  contract: ContractDefinition,
  fixtureId: string,
  modality: PromptModality,
  tokenCost: { promptTokens: number; completionTokens: number; totalTokens: number }
): ScorerResult {
  const root = parse(html);
  const details: AssertionDetail[] = [];

  const categoryScores = {
    elements: { passed: 0, total: 0 },
    nesting: { passed: 0, total: 0 },
    flags: { passed: 0, total: 0 },
    widths: { passed: 0, total: 0 },
    order: { passed: 0, total: 0 }
  };

  const { assertions } = contract;

  // 1. Expected Elements Assertions
  if (assertions.expectedElements) {
    for (const [key, rule] of Object.entries(assertions.expectedElements)) {
      categoryScores.elements.total++;
      const elements = queryAllSafe(root, key);
      const count = elements.length;

      let passed = false;
      let expectedStr = '';

      if (typeof rule === 'number') {
        passed = count >= rule;
        expectedStr = `>= ${rule}`;
      } else {
        const min = rule.min ?? 0;
        const max = rule.max ?? Infinity;
        const exact = rule.exact;

        if (exact !== undefined) {
          passed = count === exact;
          expectedStr = `=== ${exact}`;
        } else {
          passed = count >= min && count <= max;
          expectedStr = max < Infinity ? `${min}..${max}` : `>= ${min}`;
        }
      }

      if (passed) categoryScores.elements.passed++;

      details.push({
        category: 'elements',
        description: `Element count for "${key}"`,
        passed,
        expected: expectedStr,
        actual: `${count}`
      });
    }
  }

  // 2. Nesting Hierarchy Assertions
  if (Array.isArray(assertions.nesting)) {
    for (const nest of assertions.nesting) {
      categoryScores.nesting.total++;
      const minCount = nest.minCount ?? 1;

      const parentElements = queryAllSafe(root, nest.parent);
      let passed = false;
      let maxChildCount = 0;

      for (const parent of parentElements) {
        const childElements = queryAllSafe(parent, nest.contains);
        maxChildCount = Math.max(maxChildCount, childElements.length);
        if (childElements.length >= minCount) {
          passed = true;
          break;
        }
      }

      if (passed) categoryScores.nesting.passed++;

      details.push({
        category: 'nesting',
        description: `Hierarchy: "${nest.parent}" contains "${nest.contains}"`,
        passed,
        expected: `parent has >= ${minCount} child`,
        actual: parentElements.length === 0
          ? 'parent element not found'
          : `max children found: ${maxChildCount}`
      });
    }
  }

  // 3. Flags and CSS Positioning Assertions
  if (Array.isArray(assertions.flags)) {
    for (const flag of assertions.flags) {
      categoryScores.flags.total++;
      const elements = queryAllSafe(root, flag.selector);
      const regex = new RegExp(flag.expectedCss, 'i');

      let passed = false;
      let matchedStyles = '';

      if (elements.length > 0) {
        for (const el of elements) {
          const classAttr = el.getAttribute('class') || '';
          const styleAttr = el.getAttribute('style') || '';
          const combined = `${classAttr} ${styleAttr}`;

          if (regex.test(combined)) {
            passed = true;
            matchedStyles = combined.trim();
            break;
          }
        }
      }

      if (passed) categoryScores.flags.passed++;

      details.push({
        category: 'flags',
        description: flag.description || `Flag for "${flag.selector}" matching /${flag.expectedCss}/`,
        passed,
        expected: flag.expectedCss,
        actual: elements.length === 0
          ? 'selector not found'
          : passed
          ? `matched: "${matchedStyles.slice(0, 40)}..."`
          : 'css/class did not match'
      });
    }
  }

  // 4. Width and Responsive Layout Assertions
  if (Array.isArray(assertions.widths)) {
    for (const widthRule of assertions.widths) {
      categoryScores.widths.total++;
      const elements = queryAllSafe(root, widthRule.selector);

      let passed = false;
      let foundClasses = '';

      if (elements.length > 0) {
        for (const el of elements) {
          const classAttr = el.getAttribute('class') || '';
          const styleAttr = el.getAttribute('style') || '';
          const classes = classAttr.split(/\s+/);

          const matches = widthRule.expectedClasses.some((expected) => {
            if (expected.includes(':') || expected.includes('-') || expected.includes('%')) {
              return classAttr.includes(expected) || styleAttr.includes(expected);
            }
            return classes.includes(expected);
          });

          if (matches) {
            passed = true;
            foundClasses = classAttr;
            break;
          }
        }
      }

      if (passed) categoryScores.widths.passed++;

      details.push({
        category: 'widths',
        description: widthRule.description || `Width for "${widthRule.selector}" in [${widthRule.expectedClasses.join(', ')}]`,
        passed,
        expected: widthRule.expectedClasses.join(' | '),
        actual: elements.length === 0
          ? 'selector not found'
          : passed
          ? `found: "${foundClasses.slice(0, 40)}..."`
          : 'no matching width class'
      });
    }
  }

  // 5. Section Order Assertions
  if (Array.isArray(assertions.sectionOrder) && assertions.sectionOrder.length > 1) {
    categoryScores.order.total++;
    const orderSelectors = assertions.sectionOrder;

    // Collect first DOM index of each selector
    const indices: number[] = [];
    let allFound = true;

    for (const sel of orderSelectors) {
      const el = queryAllSafe(root, sel)[0];
      if (!el) {
        allFound = false;
        break;
      }
      // Calculate depth-first position in tree
      const pos = getElementDomPosition(root, el);
      indices.push(pos);
    }

    let isOrdered = allFound && indices.length === orderSelectors.length;
    if (isOrdered) {
      for (let i = 1; i < indices.length; i++) {
        if (indices[i] <= indices[i - 1]) {
          isOrdered = false;
          break;
        }
      }
    }

    if (isOrdered) categoryScores.order.passed++;

    details.push({
      category: 'order',
      description: `DOM section order: ${orderSelectors.join(' -> ')}`,
      passed: isOrdered,
      expected: orderSelectors.join(' -> '),
      actual: isOrdered ? 'correct relative order' : `indices: [${indices.join(', ')}]`
    });
  }

  const totalAssertions =
    categoryScores.elements.total +
    categoryScores.nesting.total +
    categoryScores.flags.total +
    categoryScores.widths.total +
    categoryScores.order.total;

  const passedAssertions =
    categoryScores.elements.passed +
    categoryScores.nesting.passed +
    categoryScores.flags.passed +
    categoryScores.widths.passed +
    categoryScores.order.passed;

  const scorePercentage =
    totalAssertions > 0
      ? Math.round((passedAssertions / totalAssertions) * 1000) / 10
      : 100;

  return {
    fixtureId,
    modality,
    totalAssertions,
    passedAssertions,
    scorePercentage,
    categoryScores,
    details,
    tokenCost
  };
}

/**
 * Calculates a sequential DOM index by traversing children in DFS order.
 */
function getElementDomPosition(root: HTMLElement, target: HTMLElement): number {
  let counter = 0;
  let targetIndex = -1;

  function traverse(node: HTMLElement): boolean {
    counter++;
    if (node === target) {
      targetIndex = counter;
      return true;
    }
    for (const child of node.childNodes) {
      if (child instanceof HTMLElement) {
        if (traverse(child)) return true;
      }
    }
    return false;
  }

  traverse(root);
  return targetIndex;
}
