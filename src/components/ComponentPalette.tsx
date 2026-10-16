import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WIDGET_CATALOG } from '../core/widgets/widgetCatalog';
import { WidgetCatalogItem, UIWidgetCategory } from '../core/widgets/types';
import {
  Search,
  PanelLeftClose,
  Box,
  MousePointerClick,
  FormInput,
  Lock,
  AlignLeft,
  CheckSquare,
  CircleDot,
  ToggleRight,
  ChevronDownSquare,
  SlidersHorizontal,
  Upload,
  Calendar,
  Plus,
  Palette,
  PanelTop,
  Menu,
  PanelLeft,
  Folders,
  GitCommit,
  ChevronsLeftRight,
  ExternalLink,
  Tag,
  ListOrdered,
  Type,
  List,
  Table,
  Quote,
  Code,
  Minus,
  MoveVertical,
  Image,
  Video,
  TrendingUp,
  Activity,
  Loader,
  HelpCircle,
  Bell,
  Inbox,
  AlertCircle,
  User,
  Users,
  Film,
  Sparkles,
  Maximize2,
  CreditCard,
  AppWindow,
  LayoutGrid,
  Columns
} from 'lucide-react';
import styles from './ComponentPalette.module.css';

const ICON_MAP: Record<string, React.FC<{ size?: number; strokeWidth?: number }>> = {
  Maximize2,
  CreditCard,
  Sparkles,
  PanelTop,
  PanelBottom: PanelTop,
  LayoutGrid,
  Columns,
  AppWindow,
  MousePointerClick,
  FormInput,
  Search,
  Lock,
  AlignLeft,
  CheckSquare,
  CircleDot,
  ToggleRight,
  ChevronDownSquare,
  SlidersHorizontal,
  Upload,
  Calendar,
  Plus,
  Palette,
  Menu,
  PanelLeft,
  Folders,
  GitCommit,
  ChevronsLeftRight,
  ExternalLink,
  Tag,
  ListOrdered,
  Type,
  List,
  Table,
  Quote,
  Code,
  Minus,
  MoveVertical,
  Image,
  Video,
  TrendingUp,
  Activity,
  Loader,
  HelpCircle,
  Bell,
  Inbox,
  AlertCircle,
  User,
  Users,
  Film
};

const CATEGORIES: { id: UIWidgetCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'layout', label: 'Layout' },
  { id: 'content', label: 'Content' },
  { id: 'forms', label: 'Forms' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'media', label: 'Media' }
];

interface ComponentPaletteProps {
  isOpen: boolean;
  onToggle: () => void;
  onInsertWidget: (item: WidgetCatalogItem) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  isOpen,
  onToggle,
  onInsertWidget
}) => {
  const [selectedCategory, setSelectedCategory] = useState<UIWidgetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredWidgets = useMemo(() => {
    return WIDGET_CATALOG.filter((w) => {
      const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Reset highlight index when search results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, selectedCategory]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(filteredWidgets.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredWidgets[highlightedIndex]) {
        onInsertWidget(filteredWidgets[highlightedIndex]);
      }
    }
  };

  const groupedWidgets = useMemo(() => {
    if (selectedCategory !== 'all') {
      return [{ category: selectedCategory, items: filteredWidgets }];
    }
    const categories: UIWidgetCategory[] = ['layout', 'content', 'forms', 'navigation', 'feedback', 'media'];
    return categories
      .map((cat) => ({
        category: cat,
        items: filteredWidgets.filter((w) => w.category === cat)
      }))
      .filter((g) => g.items.length > 0);
  }, [selectedCategory, filteredWidgets]);

  return (
    <aside className={`${styles.paletteRail} ${!isOpen ? styles.paletteRailCollapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Box size={16} strokeWidth={1.5} />
          <span>UI Components</span>
        </div>
        <button className={styles.collapseBtn} onClick={onToggle} title="Hide Palette">
          <PanelLeftClose size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <Search size={14} color="var(--md-text-subtle)" strokeWidth={1.5} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search widgets (use ↑↓, Enter)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <kbd className={styles.searchKbd}>/</kbd>
        </div>
      </div>

      <div className={styles.categoryNav}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.categoryBtnActive : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={styles.catalogScroll}>
        {groupedWidgets.length === 0 ? (
          <div className={styles.emptySearch}>No matching components found.</div>
        ) : (
          groupedWidgets.map((group) => (
            <div key={group.category} className={styles.categoryGroup}>
              <div className={styles.categoryLabel}>{group.category}</div>
              <div className={styles.widgetGrid}>
                {group.items.map((widget) => {
                  const IconComp = ICON_MAP[widget.icon] || Box;
                  const isHighlighted =
                    filteredWidgets[highlightedIndex]?.type === widget.type;
                  return (
                    <div
                      key={widget.type}
                      className={`${styles.widgetCard} ${isHighlighted ? styles.widgetCardHighlighted : ''}`}
                      onClick={() => onInsertWidget(widget)}
                      title={`Click or press Enter to add ${widget.name}`}
                    >
                      <div className={styles.widgetIconBox}>
                        <IconComp size={16} strokeWidth={1.5} />
                      </div>
                      <div className={styles.widgetMeta}>
                        <span className={styles.widgetName}>{widget.name}</span>
                        <span className={styles.widgetDesc}>{widget.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
