import React, { useState, useMemo } from 'react';
import { WIDGET_CATALOG } from '../core/widgets/widgetCatalog';
import { WidgetCatalogItem, UIWidgetCategory } from '../core/widgets/types';
import {
  Layers,
  X,
  MousePointerClick,
  FormInput,
  CheckSquare,
  CircleDot,
  ToggleRight,
  SlidersHorizontal,
  PanelTop,
  PanelLeft,
  CreditCard,
  AppWindow,
  AlertCircle,
  Table,
  UserCircle,
  Tag,
  Sparkles,
  Minus,
  ChevronDownSquare,
  Folders,
  GitCommit,
  ChevronsLeftRight,
  AlignLeft,
  Box
} from 'lucide-react';
import styles from './ComponentPalette.module.css';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  MousePointerClick,
  FormInput,
  AlignLeft,
  CheckSquare,
  CircleDot,
  ToggleRight,
  ChevronDownSquare,
  SlidersHorizontal,
  PanelTop,
  PanelLeft,
  Folders,
  GitCommit,
  ChevronsLeftRight,
  CreditCard,
  AppWindow,
  AlertCircle,
  Table,
  UserCircle,
  Tag,
  Sparkles,
  Minus
};

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

  const filteredWidgets = useMemo(() => {
    return WIDGET_CATALOG.filter((w) => {
      const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className={styles.paletteContainer}>
      {!isOpen && (
        <button className={styles.toggleBtn} onClick={onToggle}>
          <Layers size={16} />
          <span>UI Components</span>
        </button>
      )}

      <div className={`${styles.palettePanel} ${!isOpen ? styles.collapsed : ''}`}>
        <div className={styles.paletteHeader}>
          <div className={styles.paletteTitle}>
            <Box size={16} color="#38bdf8" />
            <span>UI Component Library</span>
          </div>
          <button className={styles.closeBtn} onClick={onToggle} title="Close Palette">
            <X size={16} />
          </button>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search 20+ UI components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.categoryTabs}>
          {(['all', 'forms', 'navigation', 'containers', 'display'] as const).map((cat) => (
            <button
              key={cat}
              className={`${styles.catBtn} ${selectedCategory === cat ? styles.activeCat : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.widgetList}>
          {filteredWidgets.length === 0 ? (
            <div className={styles.emptyState}>No components match your search.</div>
          ) : (
            filteredWidgets.map((widget) => {
              const IconComp = ICON_MAP[widget.icon] || Box;
              return (
                <div
                  key={widget.type}
                  className={styles.widgetItem}
                  onClick={() => onInsertWidget(widget)}
                  title={`Click to add ${widget.name} to canvas`}
                >
                  <div className={styles.widgetIcon}>
                    <IconComp size={16} />
                  </div>
                  <div className={styles.widgetInfo}>
                    <div className={styles.widgetName}>
                      <span>{widget.name}</span>
                      <span className={styles.widgetCategory}>{widget.category}</span>
                    </div>
                    <div className={styles.widgetDesc}>{widget.description}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
