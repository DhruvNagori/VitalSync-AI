import { API_BASE_URL, apiRequest, getAccessToken } from "./api";

export const getDocuments = () => apiRequest("/documents");

export async function uploadDocument({ title, category, documentDate, notes, file }) {
  const form = new FormData();
  form.append("title", title);
  form.append("category", category);
  if (documentDate) form.append("document_date", documentDate);
  form.append("notes", notes || "");
  form.append("file", file);
  return apiRequest("/documents", { method: "POST", body: form });
}

export const deleteDocument = (id) => apiRequest(`/documents/${id}`, { method: "DELETE" });

export async function getDocumentBlob(id) {
  const response = await fetch(`${API_BASE_URL}/documents/${id}/content`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Unable to open this document.");
  }
  return response.blob();
}
