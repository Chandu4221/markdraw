import { describe, it, expect } from 'vitest';
import { detectSiblingPatterns, getWidgetTagName } from '../patterns';
import { IRNode } from '../ir';

function mockChild(widgetType: string, label: string = ''): IRNode {
  return {
    id: `id-${Math.random().toString(36).slice(2, 7)}`,
    shortId: 'ptn1',
    widgetType,
    role: 'unknown',
    label,
    textProps: { label },
    bounds: { x: 0, y: 0, w: 100, h: 40 },
    children: [],
    parent: null,
    direction: 'Leaf',
    path: 'Root'
  };
}

describe('Sibling Pattern Grouping (Task 3)', () => {
  it('maps widget types to clean bracket tag names', () => {
    expect(getWidgetTagName('paragraph')).toBe('para');
    expect(getWidgetTagName('image_frame')).toBe('img');
    expect(getWidgetTagName('button')).toBe('btn');
    expect(getWidgetTagName('heading')).toBe('header');
    expect(getWidgetTagName('checkbox')).toBe('check');
  });

  it('handles empty and single-child containers', () => {
    expect(detectSiblingPatterns([])).toBe('—');
    const single = mockChild('button', 'Submit');
    expect(detectSiblingPatterns([single])).toBe('[btn "Submit"]');
  });

  it('handles sequences of 1 (no repetition -> no pattern emitted)', () => {
    const children = [
      mockChild('paragraph'),
      mockChild('image_frame'),
      mockChild('button')
    ];
    // None repeat consecutively
    expect(detectSiblingPatterns(children)).toBe('[para], [img], [btn]');
  });

  it('detects 4 consecutive triples of [para, img, btn]', () => {
    const children: IRNode[] = [];
    for (let i = 0; i < 4; i++) {
      children.push(mockChild('paragraph'));
      children.push(mockChild('image_frame'));
      children.push(mockChild('button'));
    }
    expect(detectSiblingPatterns(children)).toBe(
      '4 × [para, img, btn] (repeated group — likely card/list items)'
    );
  });

  it('detects pairs of repeating widgets (k = 2)', () => {
    const children = [
      mockChild('paragraph'),
      mockChild('button'),
      mockChild('paragraph'),
      mockChild('button')
    ];
    expect(detectSiblingPatterns(children)).toBe(
      '2 × [para, btn] (repeated group — likely card/list items)'
    );
  });

  it('detects repeated quads of widgets (L = 4, k = 2)', () => {
    const children = [
      mockChild('heading'),
      mockChild('paragraph'),
      mockChild('image_frame'),
      mockChild('button'),
      mockChild('heading'),
      mockChild('paragraph'),
      mockChild('image_frame'),
      mockChild('button')
    ];
    expect(detectSiblingPatterns(children)).toBe(
      '2 × [header, para, img, btn] (repeated group — likely card/list items)'
    );
  });

  it('detects repeating single items (e.g. 4 cards)', () => {
    const children = [
      mockChild('card'),
      mockChild('card'),
      mockChild('card'),
      mockChild('card')
    ];
    expect(detectSiblingPatterns(children)).toBe(
      '4 × [card] (repeated group — likely card/list items)'
    );
  });

  it('handles mixed sequences (lead header + repeated group + trailing cta button)', () => {
    const children = [
      mockChild('heading', 'Features'),
      mockChild('paragraph'),
      mockChild('image_frame'),
      mockChild('button'),
      mockChild('paragraph'),
      mockChild('image_frame'),
      mockChild('button'),
      mockChild('paragraph'),
      mockChild('image_frame'),
      mockChild('button'),
      mockChild('button', 'Contact Us')
    ];
    expect(detectSiblingPatterns(children)).toBe(
      '[header "Features"], 3 × [para, img, btn] (repeated group — likely card/list items), [btn "Contact Us"]'
    );
  });

  it('handles no-pattern cases with distinct widgets', () => {
    const children = [
      mockChild('navbar'),
      mockChild('hero'),
      mockChild('section'),
      mockChild('footer')
    ];
    expect(detectSiblingPatterns(children)).toBe(
      '[navbar], [hero], [section], [footer]'
    );
  });
});
