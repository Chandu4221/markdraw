import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDocRegistry,
  createDocument,
  renameDocument,
  deleteDocument,
  duplicateDocumentMeta,
  getDemoCanvasShapes,
  serializeDocToFile,
  validateImportFile,
  MIGRATION_FLAG_KEY
} from '../documents';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe('Document Management & Registry', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('migrates legacy single persistenceKey on first load', () => {
    const registry = getDocRegistry(mockStorage);
    expect(mockStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');
    expect(registry.docs.length).toBe(1);
    expect(registry.docs[0].name).toBe('Untitled');
    expect(registry.docs[0].persistenceKey).toBe('markdraw');
    expect(registry.activeDocId).toBe(registry.docs[0].id);
  });

  it('creates new documents and updates activeDocId', () => {
    getDocRegistry(mockStorage);
    const { registry, newDoc } = createDocument('Landing Page Wireframe', mockStorage);

    expect(registry.docs.length).toBe(2);
    expect(registry.activeDocId).toBe(newDoc.id);
    expect(newDoc.name).toBe('Landing Page Wireframe');
    expect(newDoc.persistenceKey).toContain('markdraw_doc_');
  });

  it('renames an existing document', () => {
    const reg = getDocRegistry(mockStorage);
    const docId = reg.docs[0].id;

    const updated = renameDocument(docId, 'Dashboard V1', mockStorage);
    expect(updated.docs[0].name).toBe('Dashboard V1');
  });

  it('deletes document and gracefully switches activeDocId', () => {
    getDocRegistry(mockStorage);
    const { newDoc } = createDocument('Second Doc', mockStorage);

    const updated = deleteDocument(newDoc.id, mockStorage);
    expect(updated.docs.length).toBe(1);
    expect(updated.activeDocId).not.toBe(newDoc.id);
  });

  it('prevents deleting the only document', () => {
    const reg = getDocRegistry(mockStorage);
    expect(() => deleteDocument(reg.docs[0].id, mockStorage)).toThrow();
  });

  it('duplicates document metadata with copy suffix', () => {
    const reg = getDocRegistry(mockStorage);
    const sourceId = reg.docs[0].id;

    const { registry, newDoc } = duplicateDocumentMeta(sourceId, mockStorage);
    expect(registry.docs.length).toBe(2);
    expect(newDoc.name).toBe('Untitled (Copy)');
    expect(registry.activeDocId).toBe(newDoc.id);
  });

  it('generates demo canvas shapes with valid ui-widget types and no invalid id prefix', () => {
    const demoShapes = getDemoCanvasShapes();
    expect(demoShapes.length).toBeGreaterThan(0);
    for (const shape of demoShapes) {
      expect(shape.type).toBe('ui-widget');
      expect(shape.props).toBeDefined();
      expect(shape.props.widgetType).toBeDefined();
      // Either id is omitted (so tldraw generates valid shape ID) or it must start with "shape:"
      if (shape.id !== undefined) {
        expect(shape.id.startsWith('shape:')).toBe(true);
      }
    }
  });
});

describe('File Export & Import Serialization', () => {
  it('serializes document to .markdraw.json format', () => {
    const shapes = [
      { id: '1', type: 'ui-widget', props: { widgetType: 'button' } }
    ];
    const file = serializeDocToFile('My Project', shapes);

    expect(file.formatVersion).toBe(1);
    expect(file.markdrawVersion).toBe('2.8');
    expect(file.doc.name).toBe('My Project');
    expect(file.doc.shapes.length).toBe(1);
  });

  it('validates and accepts valid .markdraw.json file', () => {
    const validJson = JSON.stringify({
      formatVersion: 1,
      markdrawVersion: '2.7',
      doc: {
        name: 'Shared Wireframe',
        shapes: [
          { id: 'btn1', type: 'ui-widget', props: { widgetType: 'button' } }
        ]
      }
    });

    const res = validateImportFile(validJson);
    expect(res.isValid).toBe(true);
    expect(res.docName).toBe('Shared Wireframe');
    expect(res.shapes?.length).toBe(1);
  });

  it('rejects files with unsupported formatVersion', () => {
    const json = JSON.stringify({ formatVersion: 2, doc: { shapes: [] } });
    const res = validateImportFile(json);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Unsupported format version');
  });

  it('rejects files containing non-widget shapes', () => {
    const json = JSON.stringify({
      formatVersion: 1,
      doc: {
        name: 'Bad Doc',
        shapes: [
          { id: 'geo1', type: 'geo', props: {} }
        ]
      }
    });

    const res = validateImportFile(json);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('non-wireframe shape');
  });
});
