import { describe, it, expect } from 'vitest';
import { formatSemanticNotation } from '../notation';
import { IRNode } from '../ir';

function mockNode(widgetType: string, label: string = '', textProps: any = {}): IRNode {
  return {
    id: 'test-1',
    widgetType,
    role: 'unknown',
    label,
    textProps: { label, ...textProps },
    bounds: { x: 0, y: 0, w: 100, h: 40 },
    children: [],
    parent: null,
    direction: 'Leaf',
    path: 'Root'
  };
}

describe('Semantic Markdown Notation (Part 4.1 Specification)', () => {
  it('formats button with label and variants', () => {
    expect(formatSemanticNotation(mockNode('button', 'Send'))).toBe('[btn "Send"]');
    expect(formatSemanticNotation(mockNode('button', 'Send', { variant: 'ghost' }))).toBe('[btn "Send" ghost]');
  });

  it('formats heading with variant', () => {
    expect(formatSemanticNotation(mockNode('heading', 'About Us', { variant: 'h1' }))).toBe('[header "About Us" h1]');
  });

  it('formats paragraph as [para]', () => {
    expect(formatSemanticNotation(mockNode('paragraph', 'Some long body text here'))).toBe('[para]');
  });

  it('formats inputs, searches, passwords, dates, files, sliders, selects', () => {
    expect(formatSemanticNotation(mockNode('input', '', { placeholder: 'Email...' }))).toBe('[input "Email..."]');
    expect(formatSemanticNotation(mockNode('search', '', { placeholder: 'Search...' }))).toBe('[search "Search..."]');
    expect(formatSemanticNotation(mockNode('password', ''))).toBe('[password]');
    expect(formatSemanticNotation(mockNode('date_picker', ''))).toBe('[date]');
    expect(formatSemanticNotation(mockNode('file_upload', 'Upload'))).toBe('[file "Upload"]');
    expect(formatSemanticNotation(mockNode('select', '', { options: 'A|B|C' }))).toBe('[select "A\\|B\\|C"]');
    expect(formatSemanticNotation(mockNode('slider', '', { value: 50 }))).toBe('[slider 50]');
  });

  it('formats checkboxes, radios, toggles with on/off states', () => {
    expect(formatSemanticNotation(mockNode('checkbox', 'Remember me', { checked: true }))).toBe('[check "Remember me" on]');
    expect(formatSemanticNotation(mockNode('radio', 'Option', { checked: false }))).toBe('[radio "Option" off]');
    expect(formatSemanticNotation(mockNode('toggle', '', { checked: true }))).toBe('[toggle on]');
  });

  it('formats structural containers and sections', () => {
    expect(formatSemanticNotation(mockNode('section', 'Our Portfolio'))).toBe('[section "Our Portfolio"]');
    expect(formatSemanticNotation(mockNode('card', 'Profile'))).toBe('[card "Profile"]');
    expect(formatSemanticNotation(mockNode('card', 'Profile', { variant: 'elevated' }))).toBe('[card "Profile" elevated]');
    expect(formatSemanticNotation(mockNode('hero', ''))).toBe('[hero]');
    expect(formatSemanticNotation(mockNode('modal', 'Confirm'))).toBe('[modal "Confirm"]');
    expect(formatSemanticNotation(mockNode('split_pane', ''))).toBe('[split]');
    expect(formatSemanticNotation(mockNode('grid_gallery', '', { variant: '3x2' }))).toBe('[grid 3x2]');
    expect(formatSemanticNotation(mockNode('data_table', '', { variant: '4x3' }))).toBe('[table 4x3]');
  });

  it('formats media and placeholders with cross crossbar', () => {
    expect(formatSemanticNotation(mockNode('image_frame', 'hero-banner', { altText: 'hero-banner' }))).toBe('[img "hero-banner"]');
    expect(formatSemanticNotation(mockNode('video_frame', 'intro.mp4'))).toBe('[video "intro.mp4"]');
    expect(formatSemanticNotation(mockNode('icon', '', { iconName: 'settings' }))).toBe('[icon "settings"]');
    expect(formatSemanticNotation(mockNode('avatar', ''))).toBe('[avatar]');
  });

  it('escapes pipes and double quotes inside text safely', () => {
    expect(formatSemanticNotation(mockNode('button', 'Save | "Done"'))).toBe('[btn "Save \\| \\"Done\\""]');
  });
});
