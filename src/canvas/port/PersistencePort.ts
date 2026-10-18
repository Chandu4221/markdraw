import { CanvasShape } from './CanvasShape';

export interface StoredUnitDefinition {
  id: string;
  name: string;
  tag: string;
  baseRole: string;
  memberRoles: string[];
  createdAt: number;
  updatedAt: number;
}

export interface StoredDocument {
  shapes: CanvasShape[];
  units: StoredUnitDefinition[];
  docVersion: number;
  schema: 1;
}

export interface DocumentMeta {
  id: string;
  name: string;
  updatedAt: number;
}

export interface PersistencePort {
  loadDocument(id: string): Promise<StoredDocument | null>;
  saveDocument(doc: StoredDocument): Promise<void>;
  listDocuments(): Promise<DocumentMeta[]>;
  exportDocument(id: string): Promise<Blob>;
  importDocument(blob: Blob): Promise<StoredDocument>;
}
