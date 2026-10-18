import { PersistencePort, StoredDocument, DocumentMeta } from '../port/PersistencePort';
import { getDocRegistry, MarkDrawDocMeta } from '../../core/documents';

export class ExcalidrawPersistence implements PersistencePort {
  private getStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  async listDocuments(): Promise<DocumentMeta[]> {
    const storage = this.getStorage();
    if (!storage) return [];
    const registry = getDocRegistry(storage);
    return registry.docs.map((d: MarkDrawDocMeta) => ({
      id: d.id,
      name: d.name,
      updatedAt: d.updatedAt
    }));
  }

  async loadDocument(id: string): Promise<StoredDocument | null> {
    const storage = this.getStorage();
    if (!storage) return null;
    const raw = storage.getItem(`markdraw_doc_content_${id}`);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed as StoredDocument;
    } catch {
      return null;
    }
  }

  async saveDocument(doc: StoredDocument): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;

    const activeDocId = getDocRegistry(storage).activeDocId;
    storage.setItem(`markdraw_doc_content_${activeDocId}`, JSON.stringify(doc));
  }

  async exportDocument(id: string): Promise<Blob> {
    const doc = await this.loadDocument(id);
    const content = JSON.stringify(
      doc || {
        shapes: [],
        units: [],
        docVersion: 1,
        schema: 1
      },
      null,
      2
    );
    return new Blob([content], { type: 'application/json' });
  }

  async importDocument(blob: Blob): Promise<StoredDocument> {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed as StoredDocument;
  }
}
