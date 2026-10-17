import { BenchmarkFixture } from '../types';

function s(
  id: string,
  widgetType: string,
  x: number,
  y: number,
  w: number,
  h: number,
  props: Record<string, unknown> = {}
) {
  return {
    id,
    type: 'ui-widget',
    x,
    y,
    props: {
      w,
      h,
      widgetType,
      ...props
    }
  };
}

export const BENCHMARK_FIXTURES: BenchmarkFixture[] = [
  // ==========================================
  // Category A: Conventional Pages (1 - 5)
  // ==========================================
  {
    id: '01-landing-saas',
    name: 'SaaS Product Landing Page',
    category: 'conventional',
    description: 'Sticky header with nav, hero section with 2 CTA buttons, 3-card feature grid, pricing cards, and footer.',
    shapes: [
      s('shape:p1', 'page', 0, 0, 1440, 2200, { label: 'SaaS Landing Page' }),
      s('shape:h1', 'header', 0, 0, 1440, 80, { label: 'Site Header', behaviors: ['sticky'], parentId: 'shape:p1' }),
      s('shape:n1', 'navbar', 300, 20, 840, 40, { label: 'Primary Nav', parentId: 'shape:h1' }),
      s('shape:b1', 'button', 1200, 20, 140, 40, { label: 'Get Started', variant: 'solid', parentId: 'shape:h1' }),
      s('shape:hero', 'hero', 120, 120, 1200, 400, { label: 'Scale Your Workflow Faster', parentId: 'shape:p1' }),
      s('shape:b2', 'button', 200, 380, 160, 48, { label: 'Start Free Trial', parentId: 'shape:hero' }),
      s('shape:b3', 'button', 380, 380, 160, 48, { label: 'Book Demo', variant: 'outline', parentId: 'shape:hero' }),
      s('shape:sec_feat', 'section', 120, 560, 1200, 450, { label: 'Key Features Grid', parentId: 'shape:p1' }),
      s('shape:c1', 'card', 140, 620, 360, 240, { label: 'Instant Sync', parentId: 'shape:sec_feat' }),
      s('shape:c2', 'card', 540, 620, 360, 240, { label: 'Role Permissions', parentId: 'shape:sec_feat' }),
      s('shape:c3', 'card', 940, 620, 360, 240, { label: 'Automated CI/CD', parentId: 'shape:sec_feat' }),
      s('shape:sec_price', 'section', 120, 1050, 1200, 500, { label: 'Simple Transparent Pricing', parentId: 'shape:p1' }),
      s('shape:b4', 'button', 200, 1450, 200, 44, { label: 'Choose Starter', parentId: 'shape:sec_price' }),
      s('shape:b5', 'button', 620, 1450, 200, 44, { label: 'Choose Pro', parentId: 'shape:sec_price' }),
      s('shape:f1', 'footer', 0, 1800, 1440, 180, { label: 'Site Footer', parentId: 'shape:p1' })
    ],
    contract: {
      name: 'SaaS Product Landing Page',
      category: 'conventional',
      description: 'Sticky header, semantic nav, feature grid, and footer.',
      assertions: {
        expectedElements: {
          header: 1,
          nav: 1,
          button: { min: 4 },
          section: { min: 2 },
          footer: 1
        },
        nesting: [
          { parent: 'header', contains: 'nav', minCount: 1 },
          { parent: 'header', contains: 'button', minCount: 1 },
          { parent: 'section', contains: 'button', minCount: 1 }
        ],
        flags: [
          { selector: 'header', expectedCss: 'sticky|fixed|top-0', description: 'Sticky header positioning' }
        ],
        widths: [
          { selector: 'header', expectedClasses: ['w-full', 'w-screen', 'max-w-'], description: 'Full width header' }
        ],
        sectionOrder: ['header', 'section', 'footer']
      }
    }
  },

  {
    id: '02-blog-article',
    name: 'Editorial Blog Post',
    category: 'conventional',
    description: 'Sticky top bar, main editorial article column, sidebar aside with search input and recent posts, footer.',
    shapes: [
      s('shape:p2', 'page', 0, 0, 1280, 1800, { label: 'Blog Article' }),
      s('shape:h2', 'header', 0, 0, 1280, 70, { label: 'Blog Header', behaviors: ['sticky'], parentId: 'shape:p2' }),
      s('shape:sec_article', 'section', 100, 100, 750, 1200, { label: 'Article Main Content', parentId: 'shape:p2' }),
      s('shape:btn_read', 'button', 120, 240, 140, 36, { label: 'Follow Author', parentId: 'shape:sec_article' }),
      s('shape:sidebar', 'card', 900, 100, 320, 800, { label: 'Sidebar Aside', parentId: 'shape:p2' }),
      s('shape:search_in', 'input', 920, 130, 280, 40, { placeholder: 'Search articles...', parentId: 'shape:sidebar' }),
      s('shape:btn_search', 'button', 920, 190, 280, 38, { label: 'Search', parentId: 'shape:sidebar' }),
      s('shape:f2', 'footer', 0, 1500, 1280, 150, { label: 'Blog Footer', parentId: 'shape:p2' })
    ],
    contract: {
      name: 'Editorial Blog Post',
      category: 'conventional',
      description: 'Sticky header, article body, sidebar with search input, footer.',
      assertions: {
        expectedElements: {
          header: 1,
          input: 1,
          button: { min: 2 },
          footer: 1
        },
        nesting: [
          { parent: 'aside, .sidebar, div', contains: 'input', minCount: 1 }
        ],
        flags: [
          { selector: 'header', expectedCss: 'sticky|fixed|top-0', description: 'Sticky header' }
        ],
        widths: [
          { selector: 'aside, .sidebar, div', expectedClasses: ['w-1/3', 'w-1/4', 'col-span-1', 'w-full', 'max-w-xs', 'max-w-sm'], description: 'Sidebar width column' }
        ],
        sectionOrder: ['header', 'footer']
      }
    }
  },

  {
    id: '03-ecommerce-store',
    name: 'E-commerce Catalog & Storefront',
    category: 'conventional',
    description: 'Header with search input and cart button, filter sidebar, 3-column product catalog, pagination, footer.',
    shapes: [
      s('shape:p3', 'page', 0, 0, 1440, 1600, { label: 'Catalog Store' }),
      s('shape:h3', 'header', 0, 0, 1440, 80, { label: 'Store Header', parentId: 'shape:p3' }),
      s('shape:in_search', 'input', 400, 20, 400, 40, { placeholder: 'Search catalog...', parentId: 'shape:h3' }),
      s('shape:btn_cart', 'button', 1250, 20, 120, 40, { label: 'Cart (3)', parentId: 'shape:h3' }),
      s('shape:sec_catalog', 'section', 80, 120, 1280, 1100, { label: 'Catalog Section', parentId: 'shape:p3' }),
      s('shape:btn_add1', 'button', 380, 480, 140, 36, { label: 'Add to Cart', parentId: 'shape:sec_catalog' }),
      s('shape:btn_add2', 'button', 720, 480, 140, 36, { label: 'Add to Cart', parentId: 'shape:sec_catalog' }),
      s('shape:btn_add3', 'button', 1060, 480, 140, 36, { label: 'Add to Cart', parentId: 'shape:sec_catalog' }),
      s('shape:f3', 'footer', 0, 1350, 1440, 160, { label: 'Store Footer', parentId: 'shape:p3' })
    ],
    contract: {
      name: 'E-commerce Catalog & Storefront',
      category: 'conventional',
      description: 'Header with search and cart, catalog grid with add-to-cart buttons, footer.',
      assertions: {
        expectedElements: {
          header: 1,
          input: { min: 1 },
          button: { min: 4 },
          footer: 1
        },
        nesting: [
          { parent: 'header', contains: 'input', minCount: 1 },
          { parent: 'header', contains: 'button', minCount: 1 }
        ],
        widths: [
          { selector: 'header', expectedClasses: ['w-full', 'max-w-'], description: 'Header width' }
        ],
        sectionOrder: ['header', 'section, main', 'footer']
      }
    }
  },

  {
    id: '04-docs-portal',
    name: 'Developer Documentation Portal',
    category: 'conventional',
    description: 'Fixed left navigation tree with search input, central article with code frame, next/previous buttons, and right TOC.',
    shapes: [
      s('shape:p4', 'page', 0, 0, 1440, 1200, { label: 'Documentation Portal' }),
      s('shape:side_nav', 'navbar', 0, 0, 280, 1200, { label: 'Docs Nav Sidebar', behaviors: ['fixed'], parentId: 'shape:p4' }),
      s('shape:doc_search', 'input', 20, 20, 240, 36, { placeholder: 'Search documentation...', parentId: 'shape:side_nav' }),
      s('shape:main_doc', 'section', 320, 40, 800, 1000, { label: 'Documentation Article', parentId: 'shape:p4' }),
      s('shape:btn_prev', 'button', 340, 950, 140, 40, { label: 'Previous: Setup', parentId: 'shape:main_doc' }),
      s('shape:btn_next', 'button', 920, 950, 160, 40, { label: 'Next: Architecture', parentId: 'shape:main_doc' })
    ],
    contract: {
      name: 'Developer Documentation Portal',
      category: 'conventional',
      description: 'Fixed sidebar nav with search input, documentation body, navigation buttons.',
      assertions: {
        expectedElements: {
          nav: 1,
          input: 1,
          button: { min: 2 }
        },
        nesting: [
          { parent: 'nav, aside, .sidebar', contains: 'input', minCount: 1 },
          { parent: 'section, main, article', contains: 'button', minCount: 2 }
        ],
        flags: [
          { selector: 'nav, aside, .sidebar', expectedCss: 'fixed|sticky', description: 'Fixed/sticky sidebar navigation' }
        ],
        widths: [
          { selector: 'nav, aside, .sidebar', expectedClasses: ['w-64', 'w-72', 'w-1/4', 'w-1/5', 'max-w-'], description: 'Sidebar width column' }
        ]
      }
    }
  },

  {
    id: '05-pricing-comparison',
    name: 'Tiered Pricing & FAQ Page',
    category: 'conventional',
    description: 'Site header, billing cycle toggle switch, 3-tier pricing cards with CTA buttons, FAQ accordion section, footer.',
    shapes: [
      s('shape:p5', 'page', 0, 0, 1440, 1600, { label: 'Pricing Comparison' }),
      s('shape:h5', 'header', 0, 0, 1440, 80, { label: 'Pricing Header', parentId: 'shape:p5' }),
      s('shape:sec_tiers', 'section', 120, 120, 1200, 600, { label: 'Pricing Tiers Grid', parentId: 'shape:p5' }),
      s('shape:btn_t1', 'button', 200, 580, 180, 42, { label: 'Select Starter', parentId: 'shape:sec_tiers' }),
      s('shape:btn_t2', 'button', 580, 580, 180, 42, { label: 'Select Pro', variant: 'solid', parentId: 'shape:sec_tiers' }),
      s('shape:btn_t3', 'button', 960, 580, 180, 42, { label: 'Select Enterprise', parentId: 'shape:sec_tiers' }),
      s('shape:sec_faq', 'section', 120, 800, 1200, 400, { label: 'Frequently Asked Questions', parentId: 'shape:p5' }),
      s('shape:f5', 'footer', 0, 1300, 1440, 160, { label: 'Pricing Footer', parentId: 'shape:p5' })
    ],
    contract: {
      name: 'Tiered Pricing & FAQ Page',
      category: 'conventional',
      description: 'Header, pricing tier buttons, FAQ section, footer.',
      assertions: {
        expectedElements: {
          header: 1,
          button: { min: 3 },
          section: { min: 2 },
          footer: 1
        },
        nesting: [
          { parent: 'section', contains: 'button', minCount: 3 }
        ],
        widths: [
          { selector: 'section', expectedClasses: ['max-w-', 'w-full', 'container', 'mx-auto'], description: 'Responsive container' }
        ],
        sectionOrder: ['header', 'section', 'footer']
      }
    }
  },

  // ==========================================
  // Category B: Unconventional Layouts (6 - 10)
  // ==========================================
  {
    id: '06-floating-pill-nav',
    name: 'Floating Pill Nav & Asymmetric Hero',
    category: 'unconventional',
    description: 'Floating pill navbar fixed with rounded-full pill styling, asymmetric 70/30 split hero with rich card.',
    shapes: [
      s('shape:p6', 'page', 0, 0, 1440, 1200, { label: 'Pill Nav Showcase' }),
      s('shape:nav_pill', 'navbar', 320, 24, 800, 56, { label: 'Floating Pill Nav', behaviors: ['sticky'], parentId: 'shape:p6' }),
      s('shape:btn_launch', 'button', 980, 32, 120, 40, { label: 'Launch App', parentId: 'shape:nav_pill' }),
      s('shape:hero_split', 'section', 100, 140, 1240, 600, { label: 'Asymmetric 70/30 Split', parentId: 'shape:p6' }),
      s('shape:btn_get_started', 'button', 160, 450, 180, 48, { label: 'Get Started Now', parentId: 'shape:hero_split' })
    ],
    contract: {
      name: 'Floating Pill Nav & Asymmetric Hero',
      category: 'unconventional',
      description: 'Floating pill navigation with sticky positioning, action buttons.',
      assertions: {
        expectedElements: {
          nav: 1,
          button: { min: 2 },
          section: { min: 1 }
        },
        flags: [
          { selector: 'nav', expectedCss: 'sticky|fixed|top-4|top-2', description: 'Sticky/fixed floating nav' }
        ],
        widths: [
          { selector: 'nav', expectedClasses: ['rounded-full', 'max-w-', 'w-fit', 'mx-auto', 'w-full'], description: 'Pill nav layout' }
        ],
        sectionOrder: ['nav', 'section']
      }
    }
  },

  {
    id: '07-asymmetric-hero-split',
    name: 'Asymmetric 60/40 Split & Feature Bands',
    category: 'unconventional',
    description: 'Header, 60/40 hero split layout with overlapping media badges, alternating 50% feature bands, footer.',
    shapes: [
      s('shape:p7', 'page', 0, 0, 1440, 1800, { label: 'Asymmetric Split Landing' }),
      s('shape:h7', 'header', 0, 0, 1440, 80, { label: 'Main Header', parentId: 'shape:p7' }),
      s('shape:sec_split', 'section', 100, 120, 1240, 500, { label: '60/40 Hero Split', parentId: 'shape:p7' }),
      s('shape:btn_cta1', 'button', 140, 420, 160, 44, { label: 'Explore Features', parentId: 'shape:sec_split' }),
      s('shape:sec_band1', 'section', 100, 700, 1240, 400, { label: 'Alternating Band 1', parentId: 'shape:p7' }),
      s('shape:sec_band2', 'section', 100, 1150, 1240, 400, { label: 'Alternating Band 2', parentId: 'shape:p7' }),
      s('shape:btn_band', 'button', 140, 1400, 140, 40, { label: 'Learn More', parentId: 'shape:sec_band2' }),
      s('shape:f7', 'footer', 0, 1620, 1440, 160, { label: 'Footer', parentId: 'shape:p7' })
    ],
    contract: {
      name: 'Asymmetric 60/40 Split & Feature Bands',
      category: 'unconventional',
      description: 'Header, multi-section asymmetric bands, footer.',
      assertions: {
        expectedElements: {
          header: 1,
          section: { min: 3 },
          button: { min: 2 },
          footer: 1
        },
        widths: [
          { selector: 'section, .hero, div', expectedClasses: ['w-3/5', 'w-2/5', 'w-1/2', 'grid-cols-2', 'flex', 'max-w-'], description: 'Split column widths' }
        ],
        sectionOrder: ['header', 'section', 'footer']
      }
    }
  },

  {
    id: '08-horizontal-timeline',
    name: 'Interactive Milestone Timeline',
    category: 'unconventional',
    description: 'Header, timeline progress rail, alternating left/right milestone cards with action buttons.',
    shapes: [
      s('shape:p8', 'page', 0, 0, 1440, 1600, { label: 'Timeline Showcase' }),
      s('shape:h8', 'header', 0, 0, 1440, 70, { label: 'Roadmap Header', parentId: 'shape:p8' }),
      s('shape:sec_tl', 'section', 120, 100, 1200, 1200, { label: 'Timeline Rail Section', parentId: 'shape:p8' }),
      s('shape:btn_m1', 'button', 200, 280, 140, 36, { label: 'View Q1 Release', parentId: 'shape:sec_tl' }),
      s('shape:btn_m2', 'button', 800, 520, 140, 36, { label: 'View Q2 Release', parentId: 'shape:sec_tl' }),
      s('shape:btn_m3', 'button', 200, 780, 140, 36, { label: 'View Q3 Release', parentId: 'shape:sec_tl' }),
      s('shape:btn_m4', 'button', 800, 1040, 140, 36, { label: 'View Q4 Release', parentId: 'shape:sec_tl' })
    ],
    contract: {
      name: 'Interactive Milestone Timeline',
      category: 'unconventional',
      description: 'Header, timeline milestones, milestone action buttons.',
      assertions: {
        expectedElements: {
          header: 1,
          button: { min: 3 },
          section: { min: 1 }
        },
        nesting: [
          { parent: 'section, main, div', contains: 'button', minCount: 3 }
        ],
        widths: [
          { selector: 'section, div', expectedClasses: ['w-1/2', 'max-w-', 'w-full', 'container'], description: 'Timeline column widths' }
        ]
      }
    }
  },

  {
    id: '09-magazine-masonry',
    name: 'Editorial Magazine Masonry Grid',
    category: 'unconventional',
    description: 'Masthead header, 3-column masonry with double-height featured hero card, stacked story cards, newsletter subscribe form, footer.',
    shapes: [
      s('shape:p9', 'page', 0, 0, 1440, 1500, { label: 'Magazine Editorial' }),
      s('shape:h9', 'header', 0, 0, 1440, 100, { label: 'The Editorial Chronicle', parentId: 'shape:p9' }),
      s('shape:sec_masonry', 'section', 80, 130, 1280, 1050, { label: 'Masonry Grid Container', parentId: 'shape:p9' }),
      s('shape:in_news', 'input', 960, 480, 280, 40, { placeholder: 'Enter your email...', parentId: 'shape:sec_masonry' }),
      s('shape:btn_sub', 'button', 960, 540, 280, 40, { label: 'Subscribe Now', parentId: 'shape:sec_masonry' }),
      s('shape:btn_readmore', 'button', 140, 700, 160, 40, { label: 'Read Feature', parentId: 'shape:sec_masonry' }),
      s('shape:f9', 'footer', 0, 1260, 1440, 160, { label: 'Chronicle Footer', parentId: 'shape:p9' })
    ],
    contract: {
      name: 'Editorial Magazine Masonry Grid',
      category: 'unconventional',
      description: 'Masthead header, masonry grid with newsletter input, action buttons, footer.',
      assertions: {
        expectedElements: {
          header: 1,
          input: 1,
          button: { min: 2 },
          footer: 1
        },
        nesting: [
          { parent: 'section, main, form, div', contains: 'input', minCount: 1 }
        ],
        widths: [
          { selector: '.grid, section, main, div', expectedClasses: ['grid-cols-3', 'grid', 'columns-3', 'w-full', 'max-w-'], description: '3-column masonry grid' }
        ],
        sectionOrder: ['header', 'section, main', 'footer']
      }
    }
  },

  {
    id: '10-multi-overlay-modal',
    name: 'Data View with Backdrop Modal Overlay',
    category: 'unconventional',
    description: 'Background dashboard table, fixed full-screen backdrop overlay, centered modal dialog card with form inputs and action buttons.',
    shapes: [
      s('shape:p10', 'page', 0, 0, 1440, 1000, { label: 'Modal Showcase Page' }),
      s('shape:h10', 'header', 0, 0, 1440, 70, { label: 'Dashboard Bar', parentId: 'shape:p10' }),
      s('shape:sec_bg', 'section', 100, 90, 1240, 800, { label: 'Background Table View', parentId: 'shape:p10' }),
      s('shape:modal_box', 'modal', 460, 220, 520, 420, { label: 'Confirm Action Dialog', behaviors: ['fixed'], parentId: 'shape:p10' }),
      s('shape:in_reason', 'input', 500, 320, 440, 40, { placeholder: 'State reason for changes...', parentId: 'shape:modal_box' }),
      s('shape:in_confirm', 'input', 500, 380, 440, 40, { placeholder: 'Type CONFIRM to proceed', parentId: 'shape:modal_box' }),
      s('shape:btn_cancel', 'button', 660, 540, 120, 40, { label: 'Cancel', variant: 'outline', parentId: 'shape:modal_box' }),
      s('shape:btn_confirm', 'button', 800, 540, 140, 40, { label: 'Confirm Changes', variant: 'solid', parentId: 'shape:modal_box' })
    ],
    contract: {
      name: 'Data View with Backdrop Modal Overlay',
      category: 'unconventional',
      description: 'Modal overlay with fixed backdrop, dialog form inputs and buttons.',
      assertions: {
        expectedElements: {
          header: 1,
          input: { min: 2 },
          button: { min: 2 }
        },
        flags: [
          { selector: 'dialog, .modal, [data-modal], .backdrop, div.fixed', expectedCss: 'fixed|absolute|inset-0|z-50', description: 'Fixed backdrop or modal container' }
        ],
        nesting: [
          { parent: 'dialog, .modal, [data-modal], form, div.fixed', contains: 'button', minCount: 2 }
        ]
      }
    }
  },

  // ==========================================
  // Category C: Dashboard & Form Heavy (11 - 15)
  // ==========================================
  {
    id: '11-analytics-kpi-dashboard',
    name: 'Executive Analytics KPI Dashboard',
    category: 'dashboard',
    description: 'Header with date range, row of 4 KPI counter stat cards ($24.8k, +12%), filterable data table with search, pagination.',
    shapes: [
      s('shape:p11', 'page', 0, 0, 1440, 1200, { label: 'Analytics Dashboard' }),
      s('shape:h11', 'header', 0, 0, 1440, 70, { label: 'Analytics Header Bar', parentId: 'shape:p11' }),
      s('shape:sec_kpis', 'section', 80, 90, 1280, 160, { label: 'KPI Counters Row', parentId: 'shape:p11' }),
      s('shape:k1', 'kpi', 100, 110, 280, 120, { label: 'Monthly Recurring Revenue', value: 24800, parentId: 'shape:sec_kpis' }),
      s('shape:k2', 'kpi', 420, 110, 280, 120, { label: 'Active Subscribers', value: 3820, parentId: 'shape:sec_kpis' }),
      s('shape:k3', 'kpi', 740, 110, 280, 120, { label: 'Net Churn Rate', value: 1.2, parentId: 'shape:sec_kpis' }),
      s('shape:k4', 'kpi', 1060, 110, 280, 120, { label: 'Average LTV', value: 940, parentId: 'shape:sec_kpis' }),
      s('shape:sec_table', 'section', 80, 280, 1280, 700, { label: 'Transaction Data Table', parentId: 'shape:p11' }),
      s('shape:in_tfilter', 'input', 100, 310, 360, 40, { placeholder: 'Filter transactions...', parentId: 'shape:sec_table' }),
      s('shape:btn_export', 'button', 1180, 310, 160, 40, { label: 'Export CSV', parentId: 'shape:sec_table' }),
      s('shape:tbl_data', 'table', 100, 370, 1240, 500, { label: 'Transactions Table', parentId: 'shape:sec_table' }),
      s('shape:btn_pg', 'button', 1180, 900, 140, 36, { label: 'Next Page', parentId: 'shape:sec_table' })
    ],
    contract: {
      name: 'Executive Analytics KPI Dashboard',
      category: 'dashboard',
      description: 'Header, KPI stats, filter input, data table, export buttons.',
      assertions: {
        expectedElements: {
          header: 1,
          input: 1,
          table: 1,
          button: { min: 2 }
        },
        nesting: [
          { parent: 'section, main, div', contains: 'table', minCount: 1 }
        ],
        widths: [
          { selector: 'section, .grid, div', expectedClasses: ['grid-cols-4', 'grid-cols-2', 'grid', 'w-full', 'max-w-'], description: 'KPI grid or responsive width' }
        ],
        sectionOrder: ['header', 'section, main']
      }
    }
  },

  {
    id: '12-multi-step-checkout',
    name: 'Multi-Step Checkout & Order Summary',
    category: 'dashboard',
    description: 'Header, progress stepper, 2-column layout (shipping form with 4 inputs vs order summary card with total and CTA).',
    shapes: [
      s('shape:p12', 'page', 0, 0, 1280, 1100, { label: 'Checkout Page' }),
      s('shape:h12', 'header', 0, 0, 1280, 70, { label: 'Secure Checkout Header', parentId: 'shape:p12' }),
      s('shape:sec_form', 'section', 80, 110, 720, 800, { label: 'Shipping Address Form', parentId: 'shape:p12' }),
      s('shape:in_fname', 'input', 100, 180, 320, 40, { placeholder: 'First Name', parentId: 'shape:sec_form' }),
      s('shape:in_lname', 'input', 460, 180, 320, 40, { placeholder: 'Last Name', parentId: 'shape:sec_form' }),
      s('shape:in_addr', 'input', 100, 250, 680, 40, { placeholder: 'Street Address', parentId: 'shape:sec_form' }),
      s('shape:in_city', 'input', 100, 320, 320, 40, { placeholder: 'City', parentId: 'shape:sec_form' }),
      s('shape:btn_cont', 'button', 100, 440, 220, 48, { label: 'Continue to Payment', variant: 'solid', parentId: 'shape:sec_form' }),
      s('shape:sec_summary', 'card', 840, 110, 360, 500, { label: 'Order Summary Card', parentId: 'shape:p12' }),
      s('shape:btn_apply', 'button', 860, 380, 140, 38, { label: 'Apply Coupon', parentId: 'shape:sec_summary' })
    ],
    contract: {
      name: 'Multi-Step Checkout & Order Summary',
      category: 'dashboard',
      description: 'Header, form with at least 4 inputs, continue and coupon buttons.',
      assertions: {
        expectedElements: {
          header: 1,
          input: { min: 4 },
          button: { min: 2 }
        },
        nesting: [
          { parent: 'section, form, div', contains: 'input', minCount: 4 },
          { parent: 'section, form, div', contains: 'button', minCount: 1 }
        ],
        widths: [
          { selector: 'main, .checkout-container, section, div', expectedClasses: ['grid-cols-3', 'w-2/3', 'w-1/3', 'grid-cols-2', 'flex', 'w-full', 'max-w-'], description: 'Multi-column checkout layout' }
        ],
        sectionOrder: ['header', 'section, main']
      }
    }
  },

  {
    id: '13-crm-pipeline-kanban',
    name: 'Sales CRM Kanban Board',
    category: 'dashboard',
    description: 'Header with board search and "+ Add Deal" button, 4 stage columns (Lead, Contacted, Proposal, Won) with cards.',
    shapes: [
      s('shape:p13', 'page', 0, 0, 1440, 1000, { label: 'CRM Deals Board' }),
      s('shape:h13', 'header', 0, 0, 1440, 70, { label: 'Kanban Header Bar', parentId: 'shape:p13' }),
      s('shape:in_ksearch', 'input', 400, 16, 360, 38, { placeholder: 'Search deals by company...', parentId: 'shape:h13' }),
      s('shape:btn_newdeal', 'button', 1250, 16, 150, 38, { label: '+ Add New Deal', parentId: 'shape:h13' }),
      s('shape:sec_board', 'section', 60, 90, 1320, 850, { label: 'Kanban Board Stages', parentId: 'shape:p13' }),
      s('shape:btn_d1', 'button', 100, 320, 120, 32, { label: 'Open Deal', parentId: 'shape:sec_board' }),
      s('shape:btn_d2', 'button', 420, 320, 120, 32, { label: 'Open Deal', parentId: 'shape:sec_board' })
    ],
    contract: {
      name: 'Sales CRM Kanban Board',
      category: 'dashboard',
      description: 'Header with search and deal button, 4-stage kanban columns.',
      assertions: {
        expectedElements: {
          header: 1,
          input: 1,
          button: { min: 2 }
        },
        nesting: [
          { parent: 'header', contains: 'input', minCount: 1 },
          { parent: 'header', contains: 'button', minCount: 1 }
        ],
        widths: [
          { selector: 'section, .board, div', expectedClasses: ['grid-cols-4', 'w-1/4', 'grid', 'flex', 'w-full', 'max-w-'], description: '4-column kanban grid' }
        ],
        sectionOrder: ['header', 'section, main']
      }
    }
  },

  {
    id: '14-settings-preferences',
    name: 'Account & Security Preferences',
    category: 'dashboard',
    description: 'Settings tab bar (Profile, Security, Billing), form with email/password inputs, alert toggles, Save and Cancel buttons.',
    shapes: [
      s('shape:p14', 'page', 0, 0, 1280, 1000, { label: 'Settings Preferences' }),
      s('shape:tab_bar', 'tabs', 80, 40, 1120, 50, { label: 'Settings Tabs List', options: 'Profile, Security, Notifications, Billing', parentId: 'shape:p14' }),
      s('shape:sec_form', 'section', 80, 120, 800, 750, { label: 'Security & Preferences Form', parentId: 'shape:p14' }),
      s('shape:in_currpass', 'input', 100, 180, 500, 40, { placeholder: 'Current Password', parentId: 'shape:sec_form' }),
      s('shape:in_newpass', 'input', 100, 250, 500, 40, { placeholder: 'New Password', parentId: 'shape:sec_form' }),
      s('shape:in_email', 'input', 100, 320, 500, 40, { placeholder: 'Recovery Email Address', parentId: 'shape:sec_form' }),
      s('shape:btn_save', 'button', 100, 450, 160, 44, { label: 'Save Changes', variant: 'solid', parentId: 'shape:sec_form' }),
      s('shape:btn_discard', 'button', 280, 450, 140, 44, { label: 'Discard', variant: 'outline', parentId: 'shape:sec_form' })
    ],
    contract: {
      name: 'Account & Security Preferences',
      category: 'dashboard',
      description: 'Tab bar, form with 3 password/email inputs, action buttons.',
      assertions: {
        expectedElements: {
          input: { min: 3 },
          button: { min: 2 }
        },
        nesting: [
          { parent: 'section, form, div', contains: 'input', minCount: 3 },
          { parent: 'section, form, div', contains: 'button', minCount: 2 }
        ],
        widths: [
          { selector: 'section, form, div', expectedClasses: ['max-w-xl', 'max-w-2xl', 'max-w-3xl', 'w-full', 'max-w-'], description: 'Form container width' }
        ]
      }
    }
  },

  {
    id: '15-data-grid-management',
    name: 'Enterprise Data Grid with Sorting',
    category: 'dashboard',
    description: 'Toolbar with search input and export/action buttons, sortable data table, pagination control bar.',
    shapes: [
      s('shape:p15', 'page', 0, 0, 1440, 1100, { label: 'Data Grid Manager' }),
      s('shape:bar_tool', 'section', 80, 30, 1280, 70, { label: 'Toolbar Action Band', parentId: 'shape:p15' }),
      s('shape:in_searchgrid', 'input', 100, 45, 360, 40, { placeholder: 'Search records...', parentId: 'shape:bar_tool' }),
      s('shape:btn_batch', 'button', 1020, 45, 150, 40, { label: 'Batch Actions', parentId: 'shape:bar_tool' }),
      s('shape:btn_csv', 'button', 1190, 45, 150, 40, { label: 'Download CSV', parentId: 'shape:bar_tool' }),
      s('shape:tbl_grid', 'table', 80, 130, 1280, 650, { label: 'Records Data Table', parentId: 'shape:p15' }),
      s('shape:bar_pg', 'footer', 80, 810, 1280, 60, { label: 'Pagination Bar', parentId: 'shape:p15' }),
      s('shape:btn_pgnext', 'button', 1200, 820, 140, 40, { label: 'Next Page ->', parentId: 'shape:bar_pg' })
    ],
    contract: {
      name: 'Enterprise Data Grid with Sorting',
      category: 'dashboard',
      description: 'Toolbar with search and batch actions, data table, pagination bar with next button.',
      assertions: {
        expectedElements: {
          table: 1,
          input: { min: 1 },
          button: { min: 3 }
        },
        nesting: [
          { parent: 'section, header, div', contains: 'input', minCount: 1 },
          { parent: 'footer, nav, div', contains: 'button', minCount: 1 }
        ],
        widths: [
          { selector: 'table, div', expectedClasses: ['w-full', 'min-w-full', 'max-w-'], description: 'Full width table' }
        ],
        sectionOrder: ['section, header, .toolbar', 'table, [role="table"]', 'footer, nav, .pagination']
      }
    }
  },

  // ==========================================
  // Category D: Mobile-Width Pages (16 - 20)
  // ==========================================
  {
    id: '16-mobile-onboarding',
    name: 'Mobile App Onboarding Flow',
    category: 'mobile',
    description: '375px mobile screen, skip button, illustration card, title, slide dots, full-width CTA button.',
    shapes: [
      s('shape:p16', 'page', 0, 0, 375, 812, { label: 'Mobile Onboarding Screen' }),
      s('shape:btn_skip', 'button', 280, 20, 75, 32, { label: 'Skip', variant: 'ghost', parentId: 'shape:p16' }),
      s('shape:card_ill', 'card', 32, 90, 311, 380, { label: 'Onboarding Illustration', parentId: 'shape:p16' }),
      s('shape:btn_start', 'button', 32, 680, 311, 52, { label: 'Get Started', variant: 'solid', parentId: 'shape:p16' })
    ],
    contract: {
      name: 'Mobile App Onboarding Flow',
      category: 'mobile',
      description: 'Mobile screen layout with skip button, illustration card, get started CTA.',
      assertions: {
        expectedElements: {
          button: { min: 2 }
        },
        nesting: [
          { parent: 'body, main, div', contains: 'button', minCount: 2 }
        ],
        widths: [
          { selector: 'body, main, div', expectedClasses: ['max-w-sm', 'max-w-md', 'w-full', 'w-[375px]'], description: 'Mobile viewport width constraints' }
        ]
      }
    }
  },

  {
    id: '17-mobile-social-feed',
    name: 'Mobile Social Feed with Bottom Nav',
    category: 'mobile',
    description: '375px mobile screen, sticky top app bar with logo + DM button, post feed cards with buttons, sticky bottom navigation bar.',
    shapes: [
      s('shape:p17', 'page', 0, 0, 375, 1400, { label: 'Mobile Social Feed' }),
      s('shape:appbar', 'header', 0, 0, 375, 56, { label: 'Top App Bar', behaviors: ['sticky'], parentId: 'shape:p17' }),
      s('shape:btn_dm', 'button', 315, 12, 44, 32, { label: 'DM', parentId: 'shape:appbar' }),
      s('shape:sec_posts', 'section', 16, 70, 343, 1180, { label: 'Posts Feed', parentId: 'shape:p17' }),
      s('shape:btn_like1', 'button', 24, 420, 60, 32, { label: 'Like', parentId: 'shape:sec_posts' }),
      s('shape:btn_comment1', 'button', 92, 420, 75, 32, { label: 'Reply', parentId: 'shape:sec_posts' }),
      s('shape:bot_nav', 'navbar', 0, 1340, 375, 60, { label: 'Bottom Navigation Bar', behaviors: ['fixed'], parentId: 'shape:p17' }),
      s('shape:btn_home', 'button', 16, 1350, 70, 40, { label: 'Home', parentId: 'shape:bot_nav' })
    ],
    contract: {
      name: 'Mobile Social Feed with Bottom Nav',
      category: 'mobile',
      description: 'Sticky top bar, post feed buttons, fixed bottom navigation.',
      assertions: {
        expectedElements: {
          header: 1,
          nav: 1,
          button: { min: 4 }
        },
        flags: [
          { selector: 'header, .appbar', expectedCss: 'fixed|sticky|top-0', description: 'Sticky top bar' },
          { selector: 'nav, .bottom-nav, footer', expectedCss: 'fixed|sticky|bottom-0', description: 'Sticky/fixed bottom bar' }
        ],
        widths: [
          { selector: 'body, main, div', expectedClasses: ['max-w-sm', 'max-w-md', 'w-full', 'w-[375px]'], description: 'Mobile container width' }
        ],
        sectionOrder: ['header', 'section, main', 'nav, footer']
      }
    }
  },

  {
    id: '18-mobile-ecommerce-product',
    name: 'Mobile Product Detail with Sticky Cart',
    category: 'mobile',
    description: '375px mobile screen, top back/share header, product image frame, price stat, sticky bottom add-to-cart bar.',
    shapes: [
      s('shape:p18', 'page', 0, 0, 375, 960, { label: 'Mobile Product View' }),
      s('shape:h18', 'header', 0, 0, 375, 52, { label: 'Product Top Bar', parentId: 'shape:p18' }),
      s('shape:btn_back', 'button', 16, 10, 60, 32, { label: 'Back', parentId: 'shape:h18' }),
      s('shape:sec_pbody', 'section', 16, 70, 343, 760, { label: 'Product Body Details', parentId: 'shape:p18' }),
      s('shape:btn_chip1', 'button', 24, 480, 70, 32, { label: 'Small', parentId: 'shape:sec_pbody' }),
      s('shape:btn_chip2', 'button', 104, 480, 70, 32, { label: 'Medium', parentId: 'shape:sec_pbody' }),
      s('shape:bot_cart', 'footer', 0, 890, 375, 70, { label: 'Sticky Cart Bar', behaviors: ['fixed'], parentId: 'shape:p18' }),
      s('shape:btn_addcart', 'button', 140, 902, 220, 46, { label: 'Add to Cart — $89', variant: 'solid', parentId: 'shape:bot_cart' })
    ],
    contract: {
      name: 'Mobile Product Detail with Sticky Cart',
      category: 'mobile',
      description: 'Back button, variant chips, sticky fixed bottom add-to-cart footer.',
      assertions: {
        expectedElements: {
          button: { min: 3 },
          footer: 1
        },
        flags: [
          { selector: 'footer, .bottom-bar, div:last-child', expectedCss: 'fixed|sticky|bottom-0', description: 'Fixed/sticky bottom cart bar' }
        ],
        widths: [
          { selector: 'body, main, div', expectedClasses: ['max-w-sm', 'max-w-md', 'w-full', 'w-[375px]'], description: 'Mobile container' }
        ]
      }
    }
  },

  {
    id: '19-mobile-profile-settings',
    name: 'Mobile User Profile & Settings',
    category: 'mobile',
    description: '375px mobile screen, header with title, avatar card, grouped list items with navigation toggles, logout button.',
    shapes: [
      s('shape:p19', 'page', 0, 0, 375, 840, { label: 'Mobile Profile Screen' }),
      s('shape:h19', 'header', 0, 0, 375, 56, { label: 'Profile Header Bar', parentId: 'shape:p19' }),
      s('shape:sec_profile', 'section', 16, 76, 343, 680, { label: 'Profile Options Section', parentId: 'shape:p19' }),
      s('shape:in_notify', 'input', 24, 300, 327, 40, { placeholder: 'Push Notifications', parentId: 'shape:sec_profile' }),
      s('shape:btn_edit', 'button', 110, 220, 155, 36, { label: 'Edit Profile', parentId: 'shape:sec_profile' }),
      s('shape:btn_logout', 'button', 24, 600, 327, 46, { label: 'Sign Out', variant: 'outline', parentId: 'shape:sec_profile' })
    ],
    contract: {
      name: 'Mobile User Profile & Settings',
      category: 'mobile',
      description: 'Mobile profile screen, options inputs, action and logout buttons.',
      assertions: {
        expectedElements: {
          header: 1,
          button: { min: 2 },
          input: { min: 1 }
        },
        nesting: [
          { parent: 'section, main, div', contains: 'button', minCount: 2 }
        ],
        widths: [
          { selector: 'body, main, div', expectedClasses: ['max-w-sm', 'max-w-md', 'w-full', 'w-[375px]'], description: 'Mobile container constraints' }
        ]
      }
    }
  },

  {
    id: '20-mobile-chat-thread',
    name: 'Mobile Direct Message Thread',
    category: 'mobile',
    description: '375px mobile screen, sticky top conversation header, message bubbles list, fixed bottom chat input bar with send button.',
    shapes: [
      s('shape:p20', 'page', 0, 0, 375, 812, { label: 'Chat Conversation Screen' }),
      s('shape:chat_h', 'header', 0, 0, 375, 60, { label: 'Chat Partner Header', behaviors: ['sticky'], parentId: 'shape:p20' }),
      s('shape:btn_cback', 'button', 12, 14, 50, 32, { label: 'Back', parentId: 'shape:chat_h' }),
      s('shape:sec_msgs', 'section', 12, 70, 351, 660, { label: 'Messages Stream', parentId: 'shape:p20' }),
      s('shape:chat_inbar', 'footer', 0, 750, 375, 62, { label: 'Input Bar', behaviors: ['fixed'], parentId: 'shape:p20' }),
      s('shape:in_msg', 'input', 16, 760, 280, 42, { placeholder: 'Type a message...', parentId: 'shape:chat_inbar' }),
      s('shape:btn_send', 'button', 306, 760, 56, 42, { label: 'Send', variant: 'solid', parentId: 'shape:chat_inbar' })
    ],
    contract: {
      name: 'Mobile Direct Message Thread',
      category: 'mobile',
      description: 'Sticky chat header with back button, fixed bottom input bar with send button.',
      assertions: {
        expectedElements: {
          header: 1,
          input: 1,
          button: { min: 2 }
        },
        flags: [
          { selector: 'header', expectedCss: 'fixed|sticky|top-0', description: 'Sticky chat conversation header' },
          { selector: 'footer, .input-bar, form', expectedCss: 'fixed|sticky|bottom-0', description: 'Fixed bottom message input bar' }
        ],
        widths: [
          { selector: 'body, main, div', expectedClasses: ['max-w-sm', 'max-w-md', 'w-full', 'w-[375px]'], description: 'Mobile width constraints' }
        ],
        sectionOrder: ['header', 'section, main', 'footer, form']
      }
    }
  }
];
