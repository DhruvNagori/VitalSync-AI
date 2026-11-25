/* Compatibility adapter for the existing Medical Records UI.
 * Files and metadata are persisted by the backend, not browser storage.
 */
import { deleteDocument, getDocumentBlob, getDocuments, uploadDocument } from "../services/documentService";

export async function getMedicalDocuments() { return getDocuments(); }

export async function saveMedicalDocument(_userId, document) {
  return uploadDocument({
    title: document.title,
    category: document.category,
    documentDate: document.documentDate,
    notes: document.notes,
    file: document.fileBlob,
  });
}

export async function deleteMedicalDocument(_userId, id) {
  await deleteDocument(id);
  return true;
}

export async function getMedicalDocument(_userId, id) {
  const documents = await getDocuments();
  const document = documents.find((item) => Number(item.id) === Number(id));
  if (!document) return null;
  return { ...document, fileBlob: await getDocumentBlob(id) };
}
