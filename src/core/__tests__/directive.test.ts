import { describe, it, expect } from 'vitest';
import { AI_DIRECTIVE_HEADER, AI_DIRECTIVE_VERSION } from '../directive';
import { MarkDrawCompiler } from '../compiler';

describe('Part D — AI Directive Compliance Header', () => {
  it('defines version 2.9 and contains binding contract rules', () => {
    expect(AI_DIRECTIVE_VERSION).toBe('2.9');
    expect(AI_DIRECTIVE_HEADER).toContain('> This is a binding layout contract from MarkDraw v2.9');
    expect(AI_DIRECTIVE_HEADER).toContain('`[Text Placeholder]` means you MUST generate content');
    expect(AI_DIRECTIVE_HEADER).toContain('everything unspecified (colors, type, imagery) is your freedom');
    expect(AI_DIRECTIVE_HEADER).toContain('N × [pattern] and all counts are binding, not suggestions');
  });

  it('prepends AI Directive header to compiled markdown spec', () => {
    const s = {
      id: 'b1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 100, h: 40, widgetType: 'button', label: 'Submit' }
    } as any;

    const res = MarkDrawCompiler.compile([s]);
    expect(res.markdownSpec.startsWith('> This is a binding layout contract from MarkDraw v2.9')).toBe(true);
    expect(res.markdownSpec).toContain('### MarkDraw UI Specification');
  });

  it('includes aiDirective on root objects in JSON AST', () => {
    const s = {
      id: 'b1' as any,
      type: 'ui-widget',
      x: 0,
      y: 0,
      props: { w: 100, h: 40, widgetType: 'button', label: 'Submit' }
    } as any;

    const res = MarkDrawCompiler.compile([s]);
    const json = JSON.parse(res.jsonAst);
    expect(json[0].aiDirective).toBe(AI_DIRECTIVE_HEADER);
  });
});
