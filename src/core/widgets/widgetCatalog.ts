import { WidgetCatalogItem } from './types';

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  // FORMS
  {
    type: 'button',
    category: 'forms',
    name: 'Button',
    description: 'Interactive button with variants and icons',
    defaultWidth: 140,
    defaultHeight: 40,
    icon: 'MousePointerClick',
    defaultProps: {
      widgetType: 'button',
      label: 'Submit Action',
      variant: 'primary',
      iconName: 'ArrowRight'
    }
  },
  {
    type: 'input',
    category: 'forms',
    name: 'Text Input',
    description: 'Single-line form input with label and placeholder',
    defaultWidth: 220,
    defaultHeight: 64,
    icon: 'FormInput',
    defaultProps: {
      widgetType: 'input',
      label: 'Email Address',
      placeholder: 'user@example.com',
      variant: 'text'
    }
  },
  {
    type: 'textarea',
    category: 'forms',
    name: 'Textarea',
    description: 'Multi-line text input field',
    defaultWidth: 240,
    defaultHeight: 100,
    icon: 'AlignLeft',
    defaultProps: {
      widgetType: 'textarea',
      label: 'Bio / Notes',
      placeholder: 'Write your description here...'
    }
  },
  {
    type: 'checkbox',
    category: 'forms',
    name: 'Checkbox',
    description: 'Toggleable checkbox with label',
    defaultWidth: 180,
    defaultHeight: 32,
    icon: 'CheckSquare',
    defaultProps: {
      widgetType: 'checkbox',
      label: 'I accept terms & conditions',
      checked: true
    }
  },
  {
    type: 'radio',
    category: 'forms',
    name: 'Radio Group',
    description: 'Single selection from multiple options',
    defaultWidth: 200,
    defaultHeight: 80,
    icon: 'CircleDot',
    defaultProps: {
      widgetType: 'radio',
      label: 'Billing Cycle',
      options: 'Monthly ($12), Annual ($99 - Save 20%)',
      value: 1
    }
  },
  {
    type: 'toggle',
    category: 'forms',
    name: 'Toggle Switch',
    description: 'On/Off toggle switch with label',
    defaultWidth: 180,
    defaultHeight: 36,
    icon: 'ToggleRight',
    defaultProps: {
      widgetType: 'toggle',
      label: 'Enable Notifications',
      checked: true
    }
  },
  {
    type: 'select',
    category: 'forms',
    name: 'Select / Dropdown',
    description: 'Option selection dropdown menu',
    defaultWidth: 200,
    defaultHeight: 60,
    icon: 'ChevronDownSquare',
    defaultProps: {
      widgetType: 'select',
      label: 'Role / Permission',
      placeholder: 'Select a role...',
      options: 'Admin, Editor, Viewer'
    }
  },
  {
    type: 'slider',
    category: 'forms',
    name: 'Range Slider',
    description: 'Linear range slider control',
    defaultWidth: 220,
    defaultHeight: 50,
    icon: 'SlidersHorizontal',
    defaultProps: {
      widgetType: 'slider',
      label: 'Volume / Capacity',
      value: 65
    }
  },

  // NAVIGATION
  {
    type: 'navbar',
    category: 'navigation',
    name: 'Navigation Bar',
    description: 'Top header bar with brand, links, and action button',
    defaultWidth: 640,
    defaultHeight: 56,
    icon: 'PanelTop',
    defaultProps: {
      widgetType: 'navbar',
      label: 'Acme SaaS',
      options: 'Dashboard, Features, Pricing, Docs',
      subtext: 'Get Started'
    }
  },
  {
    type: 'sidebar',
    category: 'navigation',
    name: 'Sidebar Menu',
    description: 'Vertical sidebar navigation menu',
    defaultWidth: 200,
    defaultHeight: 400,
    icon: 'PanelLeft',
    defaultProps: {
      widgetType: 'sidebar',
      label: 'Application Menu',
      options: 'Overview, Analytics, Customers, Settings'
    }
  },
  {
    type: 'tabs',
    category: 'navigation',
    name: 'Tab Strip',
    description: 'Horizontal segmented tab bar',
    defaultWidth: 320,
    defaultHeight: 40,
    icon: 'Folders',
    defaultProps: {
      widgetType: 'tabs',
      label: 'View Mode',
      options: 'Account, Security, Billing, API'
    }
  },
  {
    type: 'breadcrumb',
    category: 'navigation',
    name: 'Breadcrumbs',
    description: 'Navigation path trail',
    defaultWidth: 280,
    defaultHeight: 28,
    icon: 'GitCommit',
    defaultProps: {
      widgetType: 'breadcrumb',
      options: 'Home > Projects > MarkDraw > Settings'
    }
  },
  {
    type: 'pagination',
    category: 'navigation',
    name: 'Pagination',
    description: 'Page selector controls',
    defaultWidth: 260,
    defaultHeight: 36,
    icon: 'ChevronsLeftRight',
    defaultProps: {
      widgetType: 'pagination',
      label: 'Page Navigation',
      options: 'Prev, 1, 2, 3, 4, Next'
    }
  },

  // CONTAINERS
  {
    type: 'card',
    category: 'containers',
    name: 'Card Container',
    description: 'Framed content card container',
    defaultWidth: 340,
    defaultHeight: 240,
    icon: 'CreditCard',
    defaultProps: {
      widgetType: 'card',
      label: 'User Profile Card',
      variant: 'elevated'
    }
  },
  {
    type: 'modal',
    category: 'containers',
    name: 'Modal Dialog',
    description: 'Dialog window with header, body slot, and actions',
    defaultWidth: 420,
    defaultHeight: 280,
    icon: 'AppWindow',
    defaultProps: {
      widgetType: 'modal',
      label: 'Confirm Changes',
      subtext: 'Are you sure you want to apply these settings?'
    }
  },
  {
    type: 'alert',
    category: 'containers',
    name: 'Alert Banner',
    description: 'Status notification notice banner',
    defaultWidth: 360,
    defaultHeight: 60,
    icon: 'AlertCircle',
    defaultProps: {
      widgetType: 'alert',
      label: 'Payment Method Expiring',
      subtext: 'Please update your credit card to avoid interruption.',
      variant: 'warning'
    }
  },
  {
    type: 'table',
    category: 'containers',
    name: 'Data Table',
    description: 'Tabular data grid preview',
    defaultWidth: 480,
    defaultHeight: 200,
    icon: 'Table',
    defaultProps: {
      widgetType: 'table',
      label: 'Transactions Table',
      options: 'ID | Customer | Amount | Status'
    }
  },

  // DISPLAY
  {
    type: 'avatar',
    category: 'display',
    name: 'Avatar',
    description: 'User avatar circular frame with badge',
    defaultWidth: 54,
    defaultHeight: 54,
    icon: 'UserCircle',
    defaultProps: {
      widgetType: 'avatar',
      label: 'JD',
      subtext: 'John Doe'
    }
  },
  {
    type: 'badge',
    category: 'display',
    name: 'Badge / Tag',
    description: 'Compact status or category pill',
    defaultWidth: 90,
    defaultHeight: 28,
    icon: 'Tag',
    defaultProps: {
      widgetType: 'badge',
      label: 'PRO TIER',
      variant: 'success'
    }
  },
  {
    type: 'icon',
    category: 'display',
    name: 'Icon Node',
    description: 'Named graphical symbol node',
    defaultWidth: 44,
    defaultHeight: 44,
    icon: 'Sparkles',
    defaultProps: {
      widgetType: 'icon',
      label: 'BellIcon',
      iconName: 'Bell'
    }
  },
  {
    type: 'divider',
    category: 'display',
    name: 'Divider Line',
    description: 'Visual separation line',
    defaultWidth: 300,
    defaultHeight: 16,
    icon: 'Minus',
    defaultProps: {
      widgetType: 'divider',
      label: 'Separator'
    }
  }
];
