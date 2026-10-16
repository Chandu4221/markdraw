import { WidgetCatalogItem } from './types';

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  // ==================== LAYOUT (8) ====================
  {
    type: 'section',
    category: 'layout',
    name: 'Section Band',
    description: 'Full-width structural band with label header',
    defaultWidth: 640,
    defaultHeight: 180,
    icon: 'Maximize2',
    defaultProps: {
      widgetType: 'section',
      label: 'Main Features Section',
      variant: 'default'
    }
  },
  {
    type: 'card',
    category: 'layout',
    name: 'Card Container',
    description: 'Grouped content box (outline / elevated / flat)',
    defaultWidth: 320,
    defaultHeight: 220,
    icon: 'CreditCard',
    defaultProps: {
      widgetType: 'card',
      label: 'Feature Card',
      variant: 'outline'
    }
  },
  {
    type: 'hero',
    category: 'layout',
    name: 'Hero Banner',
    description: 'Prominent header banner with heading and CTA',
    defaultWidth: 600,
    defaultHeight: 220,
    icon: 'Sparkles',
    defaultProps: {
      widgetType: 'hero',
      label: 'Build Software 10x Faster',
      subtext: 'Turn canvas wireframes into clean deterministic code without vision drift.'
    }
  },
  {
    type: 'header',
    category: 'layout',
    name: 'Page Header Band',
    description: 'Top-level page application header',
    defaultWidth: 640,
    defaultHeight: 52,
    icon: 'PanelTop',
    defaultProps: {
      widgetType: 'header',
      label: 'Acme SaaS Cloud',
      subtext: 'Docs / Support / Pricing'
    }
  },
  {
    type: 'footer',
    category: 'layout',
    name: 'Page Footer Band',
    description: 'Bottom page chrome band',
    defaultWidth: 640,
    defaultHeight: 48,
    icon: 'PanelBottom',
    defaultProps: {
      widgetType: 'footer',
      label: '© 2026 MarkDraw Inc.',
      subtext: 'Privacy Policy · Terms'
    }
  },
  {
    type: 'grid_gallery',
    category: 'layout',
    name: 'Grid Gallery',
    description: 'Multi-slot container for responsive card grids',
    defaultWidth: 380,
    defaultHeight: 240,
    icon: 'LayoutGrid',
    defaultProps: {
      widgetType: 'grid_gallery',
      label: 'Product Showcase'
    }
  },
  {
    type: 'split_pane',
    category: 'layout',
    name: 'Split Pane',
    description: 'Dual-column comparative layout container',
    defaultWidth: 460,
    defaultHeight: 200,
    icon: 'Columns',
    defaultProps: {
      widgetType: 'split_pane',
      label: 'Side-by-Side Comparison'
    }
  },
  {
    type: 'modal',
    category: 'layout',
    name: 'Modal Dialog',
    description: 'Overlay window with header, body slot, and actions',
    defaultWidth: 420,
    defaultHeight: 260,
    icon: 'AppWindow',
    defaultProps: {
      widgetType: 'modal',
      label: 'Delete Confirmation',
      subtext: 'Are you sure you want to permanently delete this project?'
    }
  },

  // ==================== FORMS (14) ====================
  {
    type: 'button',
    category: 'forms',
    name: 'Button',
    description: 'Interactive button (solid, outline, ghost, danger)',
    defaultWidth: 140,
    defaultHeight: 40,
    icon: 'MousePointerClick',
    defaultProps: {
      widgetType: 'button',
      label: 'Save Changes',
      variant: 'solid',
      iconName: 'ArrowRight'
    }
  },
  {
    type: 'input',
    category: 'forms',
    name: 'Text Input',
    description: 'Single-line form input field with label',
    defaultWidth: 220,
    defaultHeight: 60,
    icon: 'FormInput',
    defaultProps: {
      widgetType: 'input',
      label: 'Full Name',
      placeholder: 'e.g. Jane Doe'
    }
  },
  {
    type: 'search',
    category: 'forms',
    name: 'Search Input',
    description: 'Search box with search icon and placeholder',
    defaultWidth: 240,
    defaultHeight: 40,
    icon: 'Search',
    defaultProps: {
      widgetType: 'search',
      placeholder: 'Search documentation...'
    }
  },
  {
    type: 'password',
    category: 'forms',
    name: 'Password Input',
    description: 'Masked password entry field',
    defaultWidth: 220,
    defaultHeight: 60,
    icon: 'Lock',
    defaultProps: {
      widgetType: 'password',
      label: 'Password'
    }
  },
  {
    type: 'textarea',
    category: 'forms',
    name: 'Textarea',
    description: 'Multi-line text input field',
    defaultWidth: 260,
    defaultHeight: 90,
    icon: 'AlignLeft',
    defaultProps: {
      widgetType: 'textarea',
      label: 'Description',
      placeholder: 'Add details here...'
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
      label: 'Agree to terms and conditions',
      checked: true
    }
  },
  {
    type: 'radio',
    category: 'forms',
    name: 'Radio Group',
    description: 'Single selection from multiple options',
    defaultWidth: 200,
    defaultHeight: 70,
    icon: 'CircleDot',
    defaultProps: {
      widgetType: 'radio',
      label: 'Subscription Tier',
      options: 'Starter ($0), Pro ($29), Enterprise',
      value: 1
    }
  },
  {
    type: 'toggle',
    category: 'forms',
    name: 'Toggle Switch',
    description: 'Binary switch state toggle',
    defaultWidth: 160,
    defaultHeight: 34,
    icon: 'ToggleRight',
    defaultProps: {
      widgetType: 'toggle',
      label: 'Email Notifications',
      checked: true
    }
  },
  {
    type: 'select',
    category: 'forms',
    name: 'Select Dropdown',
    description: 'Selection picker dropdown menu',
    defaultWidth: 200,
    defaultHeight: 60,
    icon: 'ChevronDownSquare',
    defaultProps: {
      widgetType: 'select',
      label: 'Department',
      placeholder: 'Choose department...'
    }
  },
  {
    type: 'slider',
    category: 'forms',
    name: 'Range Slider',
    description: 'Linear numeric value slider',
    defaultWidth: 220,
    defaultHeight: 48,
    icon: 'SlidersHorizontal',
    defaultProps: {
      widgetType: 'slider',
      label: 'Volume',
      value: 70
    }
  },
  {
    type: 'file_upload',
    category: 'forms',
    name: 'File Upload',
    description: 'Drag-and-drop document upload zone',
    defaultWidth: 240,
    defaultHeight: 90,
    icon: 'Upload',
    defaultProps: {
      widgetType: 'file_upload',
      label: 'Upload CSV or JSON'
    }
  },
  {
    type: 'date_picker',
    category: 'forms',
    name: 'Date Picker',
    description: 'Calendar date selection field',
    defaultWidth: 180,
    defaultHeight: 40,
    icon: 'Calendar',
    defaultProps: {
      widgetType: 'date_picker',
      placeholder: 'YYYY-MM-DD'
    }
  },
  {
    type: 'stepper',
    category: 'forms',
    name: 'Stepper Counter',
    description: 'Increment and decrement number input',
    defaultWidth: 120,
    defaultHeight: 36,
    icon: 'Plus',
    defaultProps: {
      widgetType: 'stepper',
      value: 3
    }
  },
  {
    type: 'color_swatch',
    category: 'forms',
    name: 'Color Swatch',
    description: 'Monochrome color palette swatch row',
    defaultWidth: 160,
    defaultHeight: 28,
    icon: 'Palette',
    defaultProps: {
      widgetType: 'color_swatch'
    }
  },

  // ==================== NAVIGATION (10) ====================
  {
    type: 'navbar',
    category: 'navigation',
    name: 'Navigation Bar',
    description: 'Header navigation bar with brand and links',
    defaultWidth: 640,
    defaultHeight: 52,
    icon: 'PanelTop',
    defaultProps: {
      widgetType: 'navbar',
      label: 'MarkDraw',
      options: 'Home, Features, Pricing, Docs',
      subtext: 'Try Live'
    }
  },
  {
    type: 'menubar',
    category: 'navigation',
    name: 'Desktop Menu Bar',
    description: 'Application menubar (File, Edit, View, Help)',
    defaultWidth: 500,
    defaultHeight: 32,
    icon: 'Menu',
    defaultProps: {
      widgetType: 'menubar',
      options: 'File, Edit, View, Format, Window, Help'
    }
  },
  {
    type: 'sidebar',
    category: 'navigation',
    name: 'Sidebar Menu',
    description: 'Vertical application side navigation',
    defaultWidth: 180,
    defaultHeight: 360,
    icon: 'PanelLeft',
    defaultProps: {
      widgetType: 'sidebar',
      label: 'Main Menu',
      options: 'Dashboard, Analytics, Users, Settings'
    }
  },
  {
    type: 'tabs',
    category: 'navigation',
    name: 'Tab Strip',
    description: 'Segmented view switcher tab bar',
    defaultWidth: 300,
    defaultHeight: 38,
    icon: 'Folders',
    defaultProps: {
      widgetType: 'tabs',
      options: 'Overview, Invoices, Security, API'
    }
  },
  {
    type: 'breadcrumbs',
    category: 'navigation',
    name: 'Breadcrumbs',
    description: 'Hierarchical path navigation trail',
    defaultWidth: 260,
    defaultHeight: 26,
    icon: 'GitCommit',
    defaultProps: {
      widgetType: 'breadcrumbs',
      options: 'Home > Workspaces > MarkDraw > Editor'
    }
  },
  {
    type: 'pagination',
    category: 'navigation',
    name: 'Pagination',
    description: 'Page numbers controller',
    defaultWidth: 240,
    defaultHeight: 32,
    icon: 'ChevronsLeftRight',
    defaultProps: {
      widgetType: 'pagination',
      options: '<, 1, 2, 3, 4, >'
    }
  },
  {
    type: 'footer_nav',
    category: 'navigation',
    name: 'Footer Links',
    description: 'Multi-column site map footer links',
    defaultWidth: 520,
    defaultHeight: 100,
    icon: 'PanelBottom',
    defaultProps: {
      widgetType: 'footer_nav',
      options: 'Solutions, Resources, Enterprise'
    }
  },
  {
    type: 'link',
    category: 'navigation',
    name: 'Hyperlink',
    description: 'Underlined inline navigation link',
    defaultWidth: 140,
    defaultHeight: 26,
    icon: 'ExternalLink',
    defaultProps: {
      widgetType: 'link',
      label: 'View Documentation →'
    }
  },
  {
    type: 'chip',
    category: 'navigation',
    name: 'Chip Tag',
    description: 'Filter pill or removable tag',
    defaultWidth: 90,
    defaultHeight: 28,
    icon: 'Tag',
    defaultProps: {
      widgetType: 'chip',
      label: 'Filter: Active'
    }
  },
  {
    type: 'steps',
    category: 'navigation',
    name: 'Step Progress',
    description: 'Multi-step process progression bar',
    defaultWidth: 320,
    defaultHeight: 32,
    icon: 'ListOrdered',
    defaultProps: {
      widgetType: 'steps',
      options: '1. Cart, 2. Payment, 3. Success'
    }
  },

  // ==================== CONTENT (11) ====================
  {
    type: 'heading',
    category: 'content',
    name: 'Heading Title',
    description: 'Structured title (H1, H2, H3)',
    defaultWidth: 260,
    defaultHeight: 36,
    icon: 'Type',
    defaultProps: {
      widgetType: 'heading',
      label: 'Design Specifications',
      variant: 'h1'
    }
  },
  {
    type: 'paragraph',
    category: 'content',
    name: 'Paragraph Block',
    description: 'Multi-line body typography block',
    defaultWidth: 280,
    defaultHeight: 48,
    icon: 'AlignLeft',
    defaultProps: {
      widgetType: 'paragraph',
      label: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      showText: false
    }
  },
  {
    type: 'list',
    category: 'content',
    name: 'Itemized List',
    description: 'Bulleted or numbered bullet points',
    defaultWidth: 220,
    defaultHeight: 70,
    icon: 'List',
    defaultProps: {
      widgetType: 'list',
      options: 'Zero Vision Hallucination, $0 Token API Cost, Offline Determinism'
    }
  },
  {
    type: 'data_table',
    category: 'content',
    name: 'Data Table',
    description: 'Tabular data grid with columns and rows',
    defaultWidth: 420,
    defaultHeight: 140,
    icon: 'Table',
    defaultProps: {
      widgetType: 'data_table',
      options: 'Component | Role | Direction'
    }
  },
  {
    type: 'blockquote',
    category: 'content',
    name: 'Blockquote',
    description: 'Prominent quote callout with border bar',
    defaultWidth: 280,
    defaultHeight: 48,
    icon: 'Quote',
    defaultProps: {
      widgetType: 'blockquote',
      label: 'Deterministic layout compiler eliminates visual hallucinations.'
    }
  },
  {
    type: 'code_block',
    category: 'content',
    name: 'Code Snippet',
    description: 'Monospace code block preview',
    defaultWidth: 280,
    defaultHeight: 60,
    icon: 'Code',
    defaultProps: {
      widgetType: 'code_block',
      label: 'npm run test && npm run build'
    }
  },
  {
    type: 'divider',
    category: 'content',
    name: 'Divider Line',
    description: 'Horizontal hairline boundary divider',
    defaultWidth: 320,
    defaultHeight: 16,
    icon: 'Minus',
    defaultProps: {
      widgetType: 'divider'
    }
  },
  {
    type: 'spacer',
    category: 'content',
    name: 'Layout Spacer',
    description: 'Vertical whitespace separator slot',
    defaultWidth: 200,
    defaultHeight: 32,
    icon: 'MoveVertical',
    defaultProps: {
      widgetType: 'spacer',
      label: 'Spacer 32px'
    }
  },
  {
    type: 'image_frame',
    category: 'content',
    name: 'Image Placeholder',
    description: 'Graphic image frame placeholder',
    defaultWidth: 220,
    defaultHeight: 130,
    icon: 'Image',
    defaultProps: {
      widgetType: 'image_frame',
      label: 'Hero Illustration',
      altText: 'hero-banner'
    }
  },
  {
    type: 'video_frame',
    category: 'content',
    name: 'Video Player',
    description: 'Video media player frame with play icon',
    defaultWidth: 280,
    defaultHeight: 160,
    icon: 'Video',
    defaultProps: {
      widgetType: 'video_frame',
      label: 'Demo Walkthrough (2:40)'
    }
  },
  {
    type: 'stat_kpi',
    category: 'content',
    name: 'Stat / KPI Card',
    description: 'Numeric key performance indicator badge',
    defaultWidth: 160,
    defaultHeight: 70,
    icon: 'TrendingUp',
    defaultProps: {
      widgetType: 'stat_kpi',
      label: 'Monthly Active Users',
      subtext: '48,250 (+18%)'
    }
  },

  // ==================== FEEDBACK (6) ====================
  {
    type: 'progress_bar',
    category: 'feedback',
    name: 'Progress Bar',
    description: 'Linear loading or completion percentage bar',
    defaultWidth: 200,
    defaultHeight: 36,
    icon: 'Activity',
    defaultProps: {
      widgetType: 'progress_bar',
      label: 'Upload Progress',
      value: 65
    }
  },
  {
    type: 'skeleton',
    category: 'feedback',
    name: 'Skeleton Loader',
    description: 'Content wireframe loading state bars',
    defaultWidth: 220,
    defaultHeight: 50,
    icon: 'Loader',
    defaultProps: {
      widgetType: 'skeleton'
    }
  },
  {
    type: 'tooltip',
    category: 'feedback',
    name: 'Tooltip Hint',
    description: 'Floating contextual tooltip indicator',
    defaultWidth: 140,
    defaultHeight: 30,
    icon: 'HelpCircle',
    defaultProps: {
      widgetType: 'tooltip',
      label: 'Click to copy table'
    }
  },
  {
    type: 'toast',
    category: 'feedback',
    name: 'Toast Notification',
    description: 'Temporary popup snackbar message',
    defaultWidth: 240,
    defaultHeight: 40,
    icon: 'Bell',
    defaultProps: {
      widgetType: 'toast',
      label: 'Document saved to local storage.'
    }
  },
  {
    type: 'empty_state',
    category: 'feedback',
    name: 'Empty State',
    description: 'Blank slate placeholder with call-to-action',
    defaultWidth: 240,
    defaultHeight: 120,
    icon: 'Inbox',
    defaultProps: {
      widgetType: 'empty_state',
      label: 'No Projects Created'
    }
  },
  {
    type: 'banner',
    category: 'feedback',
    name: 'Announcement Banner',
    description: 'Information or warning notice ribbon',
    defaultWidth: 420,
    defaultHeight: 44,
    icon: 'AlertCircle',
    defaultProps: {
      widgetType: 'banner',
      label: 'Notice: Workspace auto-saved in browser IndexedDB.'
    }
  },

  // ==================== MEDIA (5) ====================
  {
    type: 'avatar',
    category: 'media',
    name: 'User Avatar',
    description: 'Circular user profile picture node',
    defaultWidth: 48,
    defaultHeight: 48,
    icon: 'User',
    defaultProps: {
      widgetType: 'avatar',
      label: 'JD'
    }
  },
  {
    type: 'avatar_group',
    category: 'media',
    name: 'Avatar Group',
    description: 'Overlapping collaborator circles',
    defaultWidth: 100,
    defaultHeight: 32,
    icon: 'Users',
    defaultProps: {
      widgetType: 'avatar_group',
      label: 'Team Members'
    }
  },
  {
    type: 'thumbnail_strip',
    category: 'media',
    name: 'Thumbnail Strip',
    description: 'Horizontal gallery strip of media frames',
    defaultWidth: 220,
    defaultHeight: 56,
    icon: 'Film',
    defaultProps: {
      widgetType: 'thumbnail_strip'
    }
  },
  {
    type: 'badge',
    category: 'media',
    name: 'Status Badge',
    description: 'Compact status tag pill',
    defaultWidth: 80,
    defaultHeight: 26,
    icon: 'Tag',
    defaultProps: {
      widgetType: 'badge',
      label: 'ACTIVE'
    }
  },
  {
    type: 'icon',
    category: 'media',
    name: 'Icon Node',
    description: 'Named vector symbol indicator',
    defaultWidth: 36,
    defaultHeight: 36,
    icon: 'Sparkles',
    defaultProps: {
      widgetType: 'icon',
      label: 'IconNode'
    }
  }
];
