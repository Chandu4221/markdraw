import { LayoutNode } from './types';

export class AsciiSerializer {
  public static serialize(roots: LayoutNode[], rootWidth: number = 78): string {
    if (!roots || roots.length === 0) {
      return '_Canvas is empty. Draw shapes or add UI components to generate the ASCII layout._';
    }

    const output: string[] = [];
    output.push('```text');

    for (const root of roots) {
      const boxLines = this.renderNode(root, rootWidth);
      output.push(boxLines.join('\n'));
      output.push('');
    }

    output.push('```');
    return output.join('\n');
  }

  private static renderNode(node: LayoutNode, targetWidth: number): string[] {
    const width = Math.max(20, Math.min(120, targetWidth));
    const roleTag = node.widgetType ? `<${node.widgetType}>` : `[${node.role}]`;
    const flowTag = node.direction !== 'Leaf' ? ` (${node.direction})` : '';
    const title = ` ${node.label} ${roleTag}${flowTag} `;

    const remainingDashes = Math.max(0, width - 3 - title.length);
    const topLine = `┌─${title}${'─'.repeat(remainingDashes)}┐`;
    const botLine = `└${'─'.repeat(Math.max(0, width - 2))}┘`;

    // Leaf node: render text or component preview
    if (node.children.length === 0) {
      const detail = node.widgetProps?.label
        ? `"${node.widgetProps.label}"`
        : node.shape.text
          ? `"${node.shape.text}"`
          : node.label;

      const innerText = `  ${detail}  `;
      const clampedText = innerText.slice(0, width - 4);
      const padRight = Math.max(0, width - 2 - clampedText.length);
      const midLine = `│${clampedText}${' '.repeat(padRight)}│`;

      return [topLine, midLine, botLine];
    }

    // Container with children
    const innerWidth = width - 6;
    const bodyLines: string[] = [];

    if (node.direction === 'Row') {
      const count = node.children.length;
      const gap = 2;
      const childWidth = Math.max(14, Math.floor((innerWidth - (count - 1) * gap) / count));

      const childrenBlocks = node.children.map((child) => this.renderNode(child, childWidth));
      const maxRows = Math.max(...childrenBlocks.map((b) => b.length));

      // Pad all children to equal height
      const normalizedBlocks = childrenBlocks.map((b) => {
        const padded = [...b];
        while (padded.length < maxRows) {
          padded.push(' '.repeat(childWidth));
        }
        return padded;
      });

      for (let r = 0; r < maxRows; r++) {
        const rowStr = normalizedBlocks.map((b) => b[r]).join('  ');
        const padRight = Math.max(0, width - 2 - 2 - rowStr.length);
        bodyLines.push(`│  ${rowStr}${' '.repeat(padRight)}│`);
      }
    } else {
      // Column flow
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childLines = this.renderNode(child, innerWidth);

        for (const line of childLines) {
          const padRight = Math.max(0, width - 2 - 2 - line.length);
          bodyLines.push(`│  ${line}${' '.repeat(padRight)}│`);
        }

        if (i < node.children.length - 1) {
          bodyLines.push(`│${' '.repeat(width - 2)}│`);
        }
      }
    }

    return [topLine, `│${' '.repeat(width - 2)}│`, ...bodyLines, `│${' '.repeat(width - 2)}│`, botLine];
  }
}
