// src/annotation/__tests__/v40_golden_follow_card.test.ts
import { describe, it, expect } from 'vitest';
import { TLShape } from '@tldraw/tldraw';
import { MarkDrawCompiler } from '../../core/compiler';
import { UnitDefinition } from '../units';

describe('MarkDraw v4 Golden Example — Follow Card (§8.4)', () => {
  it('compiles scoped Follow Card group exactly as specified in §8.4', () => {
    const followCardUnit: UnitDefinition = {
      id: 'u_fc1',
      name: 'Follow Card',
      tag: 'Follow Card',
      baseRole: 'card',
      memberRoles: ['avatar', 'heading', 'button'],
      createdAt: 1729000000000,
      updatedAt: 1729000000000
    };

    // Frame "Feed Page" -> hashes to #8ac
    const frame: TLShape = {
      id: 'shape:shape_268221' as any,
      type: 'frame',
      x: 0,
      y: 0,
      props: {
        name: 'Feed Page',
        w: 800,
        h: 600
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'page',
          responsive: {
            order: 'auto',
            primary: false,
            smVisible: 'visible',
            smFullWidth: false,
            tablet: 'maintain'
          },
          props: {
            label: 'Feed Page',
            behaviors: ['responsive']
          }
        }
      }
    } as any;

    // Group "Follow Card" -> hashes to #a3f
    const group: TLShape = {
      id: 'shape:shape_227597' as any,
      type: 'group',
      parentId: 'shape:shape_268221',
      x: 50,
      y: 50,
      props: {
        name: 'Follow Card'
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'card',
          unitId: 'u_fc1',
          props: {
            label: 'Follow Card'
          }
        }
      }
    } as any;

    // Ellipse -> avatar -> hashes to #k2p
    const avatar: TLShape = {
      id: 'shape:shape_27652' as any,
      type: 'geo',
      parentId: 'shape:shape_227597',
      x: 60,
      y: 60,
      props: {
        geo: 'ellipse',
        w: 40,
        h: 40
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'avatar',
          unitId: 'u_fc1',
          props: {}
        }
      }
    } as any;

    // Text "Alex" -> heading h3 -> hashes to #m8x
    const heading: TLShape = {
      id: 'shape:shape_94236' as any,
      type: 'text',
      parentId: 'shape:shape_227597',
      x: 110,
      y: 65,
      props: {
        text: 'Alex',
        w: 100,
        h: 30
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'heading',
          unitId: 'u_fc1',
          props: {
            label: 'Alex',
            variant: 'h3'
          }
        }
      }
    } as any;

    // Rounded rect "Follow" -> button -> hashes to #q1b
    const button: TLShape = {
      id: 'shape:shape_2464' as any,
      type: 'geo',
      parentId: 'shape:shape_227597',
      x: 220,
      y: 60,
      props: {
        geo: 'rectangle',
        text: 'Follow',
        w: 80,
        h: 36
      },
      meta: {
        markdraw: {
          schema: 1,
          role: 'button',
          unitId: 'u_fc1',
          props: {
            label: 'Follow'
          }
        }
      }
    } as any;

    const res = MarkDrawCompiler.compile(
      [frame, group, avatar, heading, button],
      null,
      {
        scope: {
          shapeIds: ['shape:shape_227597'],
          scopeName: 'Follow Card'
        },
        units: [followCardUnit]
      }
    );

    const expectedOutput = `_Scoped compile: "Follow Card" — 1 unit, 3 nodes (of 4 in "Feed Page")_

### MarkDraw UI Specification
**Roots Detected:** 1 view(s)

#### Semantic Hierarchy Table
| Path | Component | Semantics | Placement | Layout Flow | Props & Attributes | Children / Content |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`Root > #8ac\` | **[page "Feed Page"]** | <Page> | — | Row | responsive | 1 × [Follow Card] |
| \`Root > #8ac > #a3f\` | **[Follow Card]** | <Card> | nested | Row | unit:"Follow Card" | avatar, heading, "Follow" |
| \`Root > #8ac > #a3f > #k2p\` | **[avatar]** | <Avatar> | nested | — | | "content: [Text Placeholder]" |
| \`Root > #8ac > #a3f > #m8x\` | **[heading "Alex" h3]** | <Heading> | nested | — | variant="h3" | "Alex" |
| \`Root > #8ac > #a3f > #q1b\` | **[button "Follow"]** | <Button> | nested | — | | "Follow" |`;

    expect(res.markdownSpec.trim()).toBe(expectedOutput.trim());
  });
});
