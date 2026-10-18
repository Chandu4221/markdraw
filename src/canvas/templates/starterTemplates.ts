import { CanvasShape } from '../port/CanvasShape';

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  shapes: CanvasShape[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'web-landing',
    name: 'Web Landing Page',
    description: 'Header, hero banner, feature cards, and footer',
    shapes: [
      {
        id: 'tpl_landing_page',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 1200, h: 900, rotation: 0 },
        parentId: null,
        name: 'Web Landing Page',
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'page',
            props: { label: 'Web Landing Page' }
          }
        }
      },
      {
        id: 'tpl_landing_nav',
        kind: 'rect',
        bounds: { x: 20, y: 20, w: 1160, h: 60, rotation: 0 },
        parentId: 'tpl_landing_page',
        name: 'Navbar',
        text: 'Logo   Features   Pricing   Contact        [Sign In]',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'navbar',
            props: { label: 'Main Navigation' }
          }
        }
      },
      {
        id: 'tpl_landing_hero',
        kind: 'rect',
        bounds: { x: 20, y: 100, w: 1160, h: 320, rotation: 0 },
        parentId: 'tpl_landing_page',
        name: 'Hero Section',
        text: 'Build Better AI Apps Faster\nTransform sketches into production layouts instantly.\n\n[Get Started Free]   [View Demo]',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'section',
            variant: 'hero',
            props: { label: 'Hero Banner' }
          }
        }
      },
      {
        id: 'tpl_landing_features',
        kind: 'rect',
        bounds: { x: 20, y: 440, w: 1160, h: 300, rotation: 0 },
        parentId: 'tpl_landing_page',
        name: 'Feature Grid',
        text: 'Feature 1: Deterministic | Feature 2: Vendor Neutral | Feature 3: Token Aligned',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'section',
            variant: 'grid',
            props: { label: 'Feature Grid' }
          }
        }
      },
      {
        id: 'tpl_landing_footer',
        kind: 'rect',
        bounds: { x: 20, y: 760, w: 1160, h: 100, rotation: 0 },
        parentId: 'tpl_landing_page',
        name: 'Footer',
        text: '© 2026 MarkDraw Inc. MIT Licensed.',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'footer',
            props: { label: 'Site Footer' }
          }
        }
      }
    ]
  },
  {
    id: 'mobile-feed',
    name: 'Mobile Feed',
    description: 'Header, story carousel, feed cards, and bottom navigation',
    shapes: [
      {
        id: 'tpl_feed_page',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 390, h: 844, rotation: 0 },
        parentId: null,
        name: 'Mobile Feed',
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'page',
            props: { label: 'Mobile Feed' }
          }
        }
      },
      {
        id: 'tpl_feed_header',
        kind: 'rect',
        bounds: { x: 16, y: 16, w: 358, h: 48, rotation: 0 },
        parentId: 'tpl_feed_page',
        name: 'Header',
        text: 'MarkDraw Feed                    [Search] [DM]',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'heading',
            props: { label: 'Feed Header' }
          }
        }
      },
      {
        id: 'tpl_feed_stories',
        kind: 'rect',
        bounds: { x: 16, y: 76, w: 358, h: 80, rotation: 0 },
        parentId: 'tpl_feed_page',
        name: 'Stories Carousel',
        text: 'Your Story   Alice   Bob   Charlie   Diana',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'carousel',
            props: { label: 'Stories Carousel' }
          }
        }
      },
      {
        id: 'tpl_feed_card_1',
        kind: 'rect',
        bounds: { x: 16, y: 168, w: 358, h: 260, rotation: 0 },
        parentId: 'tpl_feed_page',
        name: 'Post Card 1',
        text: 'Alice\nJust shipped MarkDraw v5 with Excalidraw adapter!\n[Like] [Comment] [Share]',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'card',
            props: { label: 'Post Card 1' }
          }
        }
      },
      {
        id: 'tpl_feed_card_2',
        kind: 'rect',
        bounds: { x: 16, y: 440, w: 358, h: 260, rotation: 0 },
        parentId: 'tpl_feed_page',
        name: 'Post Card 2',
        text: 'Bob\nDeterministic AI layout generation is game changing.\n[Like] [Comment] [Share]',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'card',
            props: { label: 'Post Card 2' }
          }
        }
      },
      {
        id: 'tpl_feed_bottom_nav',
        kind: 'rect',
        bounds: { x: 16, y: 772, w: 358, h: 56, rotation: 0 },
        parentId: 'tpl_feed_page',
        name: 'Tab Bar',
        text: 'Home    Search    Create    Activity    Profile',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'nav',
            props: { label: 'Bottom Navigation' }
          }
        }
      }
    ]
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    description: 'Sidebar navigation, header, KPI metric cards, and data table',
    shapes: [
      {
        id: 'tpl_dash_page',
        kind: 'frame',
        bounds: { x: 0, y: 0, w: 1280, h: 800, rotation: 0 },
        parentId: null,
        name: 'Analytics Dashboard',
        text: null,
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'page',
            props: { label: 'Analytics Dashboard' }
          }
        }
      },
      {
        id: 'tpl_dash_sidebar',
        kind: 'rect',
        bounds: { x: 20, y: 20, w: 220, h: 760, rotation: 0 },
        parentId: 'tpl_dash_page',
        name: 'Sidebar',
        text: 'MarkDraw\n\n• Overview\n• Analytics\n• Customers\n• Settings',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'sidebar',
            props: { label: 'Sidebar Nav' }
          }
        }
      },
      {
        id: 'tpl_dash_header',
        kind: 'rect',
        bounds: { x: 260, y: 20, w: 1000, h: 60, rotation: 0 },
        parentId: 'tpl_dash_page',
        name: 'Header',
        text: 'Overview Dashboard                 [Export Report] [Profile]',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'heading',
            props: { label: 'Dashboard Header' }
          }
        }
      },
      {
        id: 'tpl_dash_kpi',
        kind: 'rect',
        bounds: { x: 260, y: 100, w: 1000, h: 140, rotation: 0 },
        parentId: 'tpl_dash_page',
        name: 'KPI Stats',
        text: 'Revenue: $124.5k (+14%) | Active Users: 14,290 (+8%) | Retention: 94.2%',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'section',
            props: { label: 'KPI Metrics' }
          }
        }
      },
      {
        id: 'tpl_dash_table',
        kind: 'rect',
        bounds: { x: 260, y: 260, w: 1000, h: 520, rotation: 0 },
        parentId: 'tpl_dash_page',
        name: 'Data Table',
        text: 'User ID | Customer | Plan | Status | MRR\n#101 | Stripe | Enterprise | Active | $4,200\n#102 | Vercel | Pro | Active | $1,800',
        arrowEndpoints: null,
        meta: {
          markdraw: {
            schema: 1,
            role: 'section',
            props: { label: 'Customer Table' }
          }
        }
      }
    ]
  }
];
