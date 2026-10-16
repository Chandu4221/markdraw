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
  { id: 'navigation', label: 'Nav' },
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

  if (!isOpen) return null;

  return (
    <aside className="w-[260px] h-full flex flex-col shrink-0 border-r border-[var(--md-border)] bg-[var(--md-surface)] select-none">
      {/* Header */}
      <div className="h-10 px-3 border-b border-[var(--md-border)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--md-text-bold)]">
          <Box size={14} className="text-[var(--md-accent)]" />
          <span>Components</span>
        </div>
        <button
          className="p-1 rounded-[4px] text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] transition-colors"
          onClick={onToggle}
          title="Hide Palette (Ctrl+B)"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[var(--md-border)]">
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-2.5 text-[var(--md-text-subtle)]" />
          <input
            ref={searchInputRef}
            type="text"
            className="h-7 w-full pl-8 pr-7 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-bg)] text-xs text-[var(--md-text)] placeholder:text-[var(--md-text-subtle)] focus:outline-none focus:border-[var(--md-accent)] focus:ring-1 focus:ring-[var(--md-accent)] transition-colors"
            placeholder="Search widgets (use ↑↓, Enter)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <kbd className="absolute right-2 px-1 text-[10px] font-mono text-[var(--md-text-subtle)] border border-[var(--md-border)] rounded-[3px] bg-[var(--md-surface)]">
            /
          </kbd>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto border-b border-[var(--md-border)] scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-[var(--md-text-bold)] text-[var(--md-bg)]'
                : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)] hover:bg-[var(--md-surface-raised)]'
            }`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Widgets Catalog List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {groupedWidgets.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--md-text-subtle)]">
            No matching components found.
          </div>
        ) : (
          groupedWidgets.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <div className="px-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-text-subtle)]">
                  {group.category}
                </span>
                <span className="text-[10px] text-[var(--md-text-subtle)] font-mono">
                  {group.items.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {group.items.map((widget) => {
                  const IconComp = ICON_MAP[widget.icon] || Box;
                  const isHighlighted =
                    filteredWidgets[highlightedIndex]?.type === widget.type;
                  return (
                    <div
                      key={widget.type}
                      className={`group flex items-center gap-2.5 p-2 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] hover:bg-[var(--md-surface-raised)] hover:border-[var(--md-border-strong)] transition-all cursor-pointer shadow-xs ${
                        isHighlighted
                          ? 'border-[var(--md-accent)] ring-1 ring-[var(--md-accent)] bg-[var(--md-surface-raised)]'
                          : ''
                      }`}
                      onClick={() => onInsertWidget(widget)}
                      title={`Click or press Enter to add ${widget.name}`}
                    >
                      <div className="w-7 h-7 shrink-0 rounded-[4px] border border-[var(--md-border)] bg-[var(--md-bg)] flex items-center justify-center text-[var(--md-text)] group-hover:text-[var(--md-text-bold)] transition-colors">
                        <IconComp size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[var(--md-text-bold)] truncate">
                          {widget.name}
                        </span>
                        <span className="text-[11px] text-[var(--md-text-subtle)] truncate">
                          {widget.description}
                        </span>
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
