import { useState, useMemo, useRef } from 'react';
import { Editor } from '../core/types';
import {
  getDocRegistry,
  createDocument,
  renameDocument,
  deleteDocument,
  duplicateDocumentMeta,
  saveDocRegistry,
  serializeDocToFile,
  validateImportFile,
  MarkDrawDocMeta,
  MarkDrawDocRegistry
} from '../core/documents';

export interface UseDocumentManagementProps {
  editorRef: React.MutableRefObject<Editor | null>;
  showToast: (msg: string) => void;
}

export function useDocumentManagement({ editorRef, showToast }: UseDocumentManagementProps) {
  const [docsRegistry, setDocsRegistry] = useState<MarkDrawDocRegistry>(() => getDocRegistry());
  const pendingShapesRef = useRef<any[] | null>(null);

  const activeDoc: MarkDrawDocMeta = useMemo(() => {
    return (
      docsRegistry.docs.find((d) => d.id === docsRegistry.activeDocId) ||
      docsRegistry.docs[0]
    );
  }, [docsRegistry]);

  const handleSelectDoc = (docId: string) => {
    const updated: MarkDrawDocRegistry = { ...docsRegistry, activeDocId: docId };
    saveDocRegistry(updated);
    setDocsRegistry(updated);
  };

  const handleNewDoc = () => {
    const { registry, newDoc } = createDocument();
    setDocsRegistry(registry);
    showToast(`Created document "${newDoc.name}"`);
  };

  const handleDuplicateDoc = () => {
    const currentShapes = editorRef.current?.getCurrentPageShapes() || [];
    const { registry, newDoc } = duplicateDocumentMeta(activeDoc.id);
    pendingShapesRef.current = currentShapes.map((s: any) => ({
      type: s.type,
      x: s.x,
      y: s.y,
      props: { ...s.props }
    }));
    setDocsRegistry(registry);
    showToast(`Duplicated into "${newDoc.name}"`);
  };

  const handleRenameDoc = (docId: string, newName: string) => {
    const updated = renameDocument(docId, newName);
    setDocsRegistry(updated);
  };

  const handleDeleteDoc = (docId: string) => {
    try {
      const updated = deleteDocument(docId);
      setDocsRegistry(updated);
      showToast('Document deleted');
    } catch (err: any) {
      showToast(err?.message || 'Cannot delete document');
    }
  };

  const handleExportFile = () => {
    const current = editorRef.current;
    const shapes = current ? current.getCurrentPageShapes() : [];
    const fileData = serializeDocToFile(activeDoc.name, shapes);
    const blob = new Blob([JSON.stringify(fileData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = activeDoc.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'wireframe';
    link.download = `${safeName}.markdraw.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported "${activeDoc.name}.markdraw.json"`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = validateImportFile(text);
      if (!res.isValid || !res.shapes) {
        showToast(res.error || 'Import failed: invalid file');
        return;
      }

      const { registry, newDoc } = createDocument(res.docName);
      pendingShapesRef.current = res.shapes.map((s) => ({
        type: 'ui-widget' as const,
        x: s.x,
        y: s.y,
        props: { ...s.props }
      }));
      setDocsRegistry(registry);
      showToast(`Imported "${newDoc.name}" (${res.shapes.length} widgets)`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return {
    docsRegistry,
    setDocsRegistry,
    activeDoc,
    pendingShapesRef,
    handleSelectDoc,
    handleNewDoc,
    handleDuplicateDoc,
    handleRenameDoc,
    handleDeleteDoc,
    handleExportFile,
    handleImportFile
  };
}
