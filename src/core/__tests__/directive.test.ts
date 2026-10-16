import { describe, it, expect } from 'vitest';
import { AI_DIRECTIVE_HEADER, AI_DIRECTIVE_VERSION } from '../directive';
import { MarkDrawCompiler } from '../compiler';

describe('Part D — AI Directive Compliance Header', () => {
  it('defines version 2.8 and contains all 5 mandatory compliance rules', () => {
    expect(AI_DIRECTIVE_VERSION).toBe('2.8');
    expect(AI_DIRECTIVE_HEADER).toContain('> **AI DIRECTIVE — READ FIRST**');
    expect(AI_DIRECTIVE_HEADER).toContain('1. This document is a **binding layout contract**');
    expect(AI_DIRECTIVE_HEADER).toContain('2. Do NOT relocate, reorder, restyle, or omit');
    expect(AI_DIRECTIVE_HEADER).toContain('3. Content marked `content: unspecified`');
    expect(AI_DIRECTIVE_HEADER).toContain('4. Everything not specified here (colors, typography');
    expect(AI_DIRECTIVE_HEADER).toContain('5. If this contract is impossible to satisfy');
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
    expect(res.markdownSpec.startsWith('> **AI DIRECTIVE — READ FIRST**')).toBe(true);
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
