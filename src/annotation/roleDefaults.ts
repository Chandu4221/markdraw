// src/annotation/roleDefaults.ts
import { RoleName } from './roles';

export const ROLE_DEFAULT_PROPS: Record<RoleName, Record<string, unknown>> = {
  page: { variant: 'hd' },
  section: {},
  card: { variant: 'outline' },
  navbar: {},
  sidebar: {},
  footer: {},
  heading: { variant: 'h2' },
  para: {},
  img: {},
  video: {},
  button: { variant: 'solid' },
  input: { placeholder: 'Enter text...' },
  textarea: { placeholder: 'Enter multiline text...' },
  select: { options: 'Option 1, Option 2, Option 3' },
  checkbox: { checked: false },
  radio: { checked: false },
  switch: { checked: false },
  slider: { value: 50 },
  stepper: { value: 1 },
  table: {},
  tabs: { options: 'Tab 1, Tab 2, Tab 3' },
  avatar: {},
  badge: { variant: 'outline' },
  banner: { variant: 'info' },
  dialog: {},
  separator: { variant: 'solid' },
  carousel: { variant: 'contained' },
  stat: {},
  steps: { options: 'Step 1, Step 2, Step 3' },
  nav: { options: 'Link 1, Link 2, Link 3' },
  group: {}
};

export function getRoleDefaultProps(role: string): Record<string, unknown> {
  return (ROLE_DEFAULT_PROPS as Record<string, Record<string, unknown>>)[role] || {};
}

const COMMON_UNTOUCHED_LABELS = new Set([
  'save changes',
  'click me',
  'enter text...',
  'enter multiline text...',
  'lorem ipsum dolor sit amet'
]);

export function isUntouchedRoleLabel(role: string, label?: string): boolean {
  if (!label || label.trim() === '') return true;
  const clean = label.trim().toLowerCase();
  const cleanRole = role.toLowerCase().replace(/_/g, ' ');
  if (clean === cleanRole || clean === cleanRole.replace(/\s+/g, '')) {
    return true;
  }
  if (COMMON_UNTOUCHED_LABELS.has(clean)) {
    return true;
  }
  return false;
}

