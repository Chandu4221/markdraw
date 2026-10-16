import { MARKDRAW_VERSION } from './compiler';

export interface MarkDrawDocMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  persistenceKey: string;
}

export interface MarkDrawDocRegistry {
  docs: MarkDrawDocMeta[];
  activeDocId: string;
}

export interface MarkDrawFileFormat {
  formatVersion: 1;
  markdrawVersion: string;
  doc: {
    name: string;
    shapes: any[];
  };
}

export const DOCS_STORAGE_KEY = 'markdraw_docs';
export const MIGRATION_FLAG_KEY = 'markdraw_migrated_v27';

/**
 * Creates a unique document ID.
 */
export function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Retrieves the document registry from localStorage, applying one-time legacy migration if needed.
 */
export function getDocRegistry(storage: Storage = window.localStorage): MarkDrawDocRegistry {
  const migrated = storage.getItem(MIGRATION_FLAG_KEY);
  const raw = storage.getItem(DOCS_STORAGE_KEY);

  let registry: MarkDrawDocRegistry | null = null;
  if (raw) {
    try {
      registry = JSON.parse(raw);
    } catch (e) {
      console.error('[MarkDraw] Failed to parse document registry:', e);
    }
  }

  // One-time migration from legacy single document persistenceKey="markdraw"
  if (!migrated) {
    storage.setItem(MIGRATION_FLAG_KEY, 'true');
    if (!registry || !registry.docs || registry.docs.length === 0) {
      const initialDoc: MarkDrawDocMeta = {
        id: 'doc_default',
        name: 'Untitled',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        persistenceKey: 'markdraw' // preserves existing indexedDB data from v2.5 / v2.6
      };
      registry = {
        docs: [initialDoc],
        activeDocId: initialDoc.id
      };
      storage.setItem(DOCS_STORAGE_KEY, JSON.stringify(registry));
      return registry;
    }
  }

  // Ensure registry is valid
  if (!registry || !Array.isArray(registry.docs) || registry.docs.length === 0) {
    const freshDoc: MarkDrawDocMeta = {
      id: generateDocId(),
      name: 'Untitled',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persistenceKey: `markdraw_doc_${Date.now()}`
    };
    registry = {
      docs: [freshDoc],
      activeDocId: freshDoc.id
    };
    storage.setItem(DOCS_STORAGE_KEY, JSON.stringify(registry));
    return registry;
  }

  // Ensure activeDocId points to an existing doc
  const activeExists = registry.docs.some((d) => d.id === registry!.activeDocId);
  if (!activeExists) {
    registry.activeDocId = registry.docs[0].id;
    storage.setItem(DOCS_STORAGE_KEY, JSON.stringify(registry));
  }

  return registry;
}

/**
 * Persists the registry to localStorage.
 */
export function saveDocRegistry(
  registry: MarkDrawDocRegistry,
  storage: Storage = window.localStorage
): void {
  storage.setItem(DOCS_STORAGE_KEY, JSON.stringify(registry));
}

/**
 * Creates a new document and activates it.
 */
export function createDocument(
  name?: string,
  storage: Storage = window.localStorage
): { registry: MarkDrawDocRegistry; newDoc: MarkDrawDocMeta } {
  const current = getDocRegistry(storage);
  const id = generateDocId();
  const docName = name?.trim() || `Untitled ${current.docs.length + 1}`;
  const newDoc: MarkDrawDocMeta = {
    id,
    name: docName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    persistenceKey: `markdraw_doc_${id}`
  };

  const updatedRegistry: MarkDrawDocRegistry = {
    docs: [newDoc, ...current.docs],
    activeDocId: id
  };

  saveDocRegistry(updatedRegistry, storage);
  return { registry: updatedRegistry, newDoc };
}

/**
 * Renames an existing document.
 */
export function renameDocument(
  docId: string,
  newName: string,
  storage: Storage = window.localStorage
): MarkDrawDocRegistry {
  const current = getDocRegistry(storage);
  const trimmed = newName.trim();
  if (!trimmed) return current;

  const docs = current.docs.map((doc) => {
    if (doc.id === docId) {
      return { ...doc, name: trimmed, updatedAt: Date.now() };
    }
    return doc;
  });

  const updated: MarkDrawDocRegistry = { ...current, docs };
  saveDocRegistry(updated, storage);
  return updated;
}

/**
 * Deletes a document. Cannot delete if it is the only remaining document.
 */
export function deleteDocument(
  docId: string,
  storage: Storage = window.localStorage
): MarkDrawDocRegistry {
  const current = getDocRegistry(storage);
  if (current.docs.length <= 1) {
    throw new Error('Cannot delete the only remaining document.');
  }

  const docs = current.docs.filter((d) => d.id !== docId);
  let activeDocId = current.activeDocId;
  if (activeDocId === docId) {
    activeDocId = docs[0].id;
  }

  const updated: MarkDrawDocRegistry = { docs, activeDocId };
  saveDocRegistry(updated, storage);
  return updated;
}

/**
 * Duplicates a document in the registry.
 */
export function duplicateDocumentMeta(
  sourceDocId: string,
  storage: Storage = window.localStorage
): { registry: MarkDrawDocRegistry; newDoc: MarkDrawDocMeta } {
  const current = getDocRegistry(storage);
  const source = current.docs.find((d) => d.id === sourceDocId);
  const baseName = source ? `${source.name} (Copy)` : 'Untitled (Copy)';

  const id = generateDocId();
  const newDoc: MarkDrawDocMeta = {
    id,
    name: baseName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    persistenceKey: `markdraw_doc_${id}`
  };

  const updated: MarkDrawDocRegistry = {
    docs: [newDoc, ...current.docs],
    activeDocId: id
  };

  saveDocRegistry(updated, storage);
  return { registry: updated, newDoc };
}

/**
 * Updates a document's updatedAt timestamp.
 */
export function touchDocument(
  docId: string,
  storage: Storage = window.localStorage
): void {
  const current = getDocRegistry(storage);
  const docs = current.docs.map((d) =>
    d.id === docId ? { ...d, updatedAt: Date.now() } : d
  );
  saveDocRegistry({ ...current, docs }, storage);
}

/**
 * Generates initial demo wireframe shapes (Page + Header + Hero + Section + Footer)
 * for a new document so the canvas is never an empty void.
 */
export function getDemoCanvasShapes(): any[] {
  return [
    {
      id: `shape_page_${Date.now()}`,
      type: 'ui-widget',
      x: 80,
      y: 60,
      props: {
        w: 1280,
        h: 960,
        widgetType: 'page',
        label: 'Home Page',
        variant: 'hd'
      }
    },
    {
      id: `shape_header_${Date.now()}`,
      type: 'ui-widget',
      x: 80,
      y: 96,
      props: {
        w: 1280,
        h: 52,
        widgetType: 'header',
        label: 'MarkDraw SaaS',
        subtext: 'Features · Docs · Pricing'
      }
    },
    {
      id: `shape_hero_${Date.now()}`,
      type: 'ui-widget',
      x: 220,
      y: 180,
      props: {
        w: 1000,
        h: 220,
        widgetType: 'hero',
        label: 'Design in Markdown, Ship with Confidence',
        subtext: 'Deterministic wireframes compiled into structured AI context.'
      }
    },
    {
      id: `shape_section_${Date.now()}`,
      type: 'ui-widget',
      x: 220,
      y: 430,
      props: {
        w: 1000,
        h: 280,
        widgetType: 'section',
        label: 'Key Capabilities'
      }
    },
    {
      id: `shape_card1_${Date.now()}`,
      type: 'ui-widget',
      x: 250,
      y: 480,
      props: {
        w: 290,
        h: 200,
        widgetType: 'card',
        label: 'Output Hygiene',
        variant: 'outline'
      }
    },
    {
      id: `shape_card2_${Date.now()}`,
      type: 'ui-widget',
      x: 575,
      y: 480,
      props: {
        w: 290,
        h: 200,
        widgetType: 'card',
        label: 'Placement Semantics',
        variant: 'outline'
      }
    },
    {
      id: `shape_card3_${Date.now()}`,
      type: 'ui-widget',
      x: 900,
      y: 480,
      props: {
        w: 290,
        h: 200,
        widgetType: 'card',
        label: 'Multi-Document',
        variant: 'outline'
      }
    },
    {
      id: `shape_footer_${Date.now()}`,
      type: 'ui-widget',
      x: 80,
      y: 972,
      props: {
        w: 1280,
        h: 48,
        widgetType: 'footer',
        label: '© 2026 MarkDraw Inc.',
        subtext: 'All rights reserved.'
      }
    }
  ];
}

/**
 * Serializes document name and shapes to `.markdraw.json` shareable file format.
 */
export function serializeDocToFile(docName: string, shapes: any[]): MarkDrawFileFormat {
  return {
    formatVersion: 1,
    markdrawVersion: MARKDRAW_VERSION,
    doc: {
      name: docName || 'Untitled',
      shapes: Array.isArray(shapes) ? shapes : []
    }
  };
}

/**
 * Validates an imported `.markdraw.json` file.
 * Requires formatVersion === 1 and ensures all shapes are of type 'ui-widget'.
 */
export function validateImportFile(fileContent: string): {
  isValid: boolean;
  error?: string;
  docName?: string;
  shapes?: any[];
} {
  try {
    const data = JSON.parse(fileContent);

    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'File content is not a valid JSON object.' };
    }

    if (data.formatVersion !== 1) {
      return {
        isValid: false,
        error: `Unsupported format version (${data.formatVersion}). Only formatVersion 1 is supported.`
      };
    }

    if (!data.doc || typeof data.doc !== 'object') {
      return { isValid: false, error: 'File is missing required "doc" object.' };
    }

    const docName = typeof data.doc.name === 'string' ? data.doc.name : 'Imported Document';
    const shapes = data.doc.shapes;

    if (!Array.isArray(shapes)) {
      return { isValid: false, error: '"doc.shapes" must be an array.' };
    }

    // Strict validation: every shape must be a ui-widget
    const invalidShapes = shapes.filter((s: any) => !s || s.type !== 'ui-widget');
    if (invalidShapes.length > 0) {
      return {
        isValid: false,
        error: `File contains ${invalidShapes.length} non-wireframe shape(s). MarkDraw only supports ui-widget shapes.`
      };
    }

    return {
      isValid: true,
      docName,
      shapes
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `JSON parsing error: ${err?.message || 'Invalid syntax'}`
    };
  }
}
