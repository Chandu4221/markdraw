import { SemanticRole } from './types';

export interface ShapeAttributes {
  type: string;
  color: string;
  dash: string;
  text?: string;
  userMetaRole?: string;
  geo?: string;
}

export class LegendEngine {
  public static resolveRole(attr: ShapeAttributes): SemanticRole {
    if (attr.userMetaRole) {
      return attr.userMetaRole as SemanticRole;
    }

    if (attr.type === 'text') {
      return 'text';
    }

    if (attr.type === 'line' || attr.type === 'draw') {
      return 'divider';
    }

    if (attr.type === 'frame') {
      return 'container';
    }

    if (attr.type === 'geo') {
      if (attr.geo === 'ellipse' || attr.geo === 'oval') {
        return 'icon_avatar';
      }
      if (attr.color === 'light-blue' || attr.color === 'blue') {
        return 'button';
      }
      if (attr.dash === 'dashed' || attr.dash === 'dotted') {
        return 'container';
      }
      return 'input';
    }

    return 'unknown';
  }

  public static getBadgeSymbol(role: SemanticRole, label: string): string {
    const clean = label || 'Untitled';
    switch (role) {
      case 'container': return `[Container: ${clean}]`;
      case 'button': return `[Button: "${clean}"]`;
      case 'input': return `<Input: "${clean}">`;
      case 'icon_avatar': return `(Icon: ${clean})`;
      case 'divider': return `--- Divider ---`;
      case 'text': return `"${clean}"`;
      default: return clean;
    }
  }
}
