import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  File,
  FileImage,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";

import {
  deleteMedicalDocument,
  getMedicalDocument,
  getMedicalDocuments,
  saveMedicalDocument
} from "../../utils/medicalRecordsStorage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = {
  "application/pdf": "PDF",
  "image/jpeg": "Image",
  "image/png": "Image"
};

const CATEGORIES = [
  "Lab Reports",
  "Prescriptions",
  "Medical Scans",
  "Discharge Summaries",
  "Vaccination Records",
  "Other"
];

function formatDate(value) {
  if (!value) return "Date not specified";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `record-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFileIcon(type) {
  return type === "application/pdf" ? FileText : FileImage;
}

export default function MedicalRecords() {
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? currentUser?.email ?? null;

  const [documents, setDocuments] = useState([]);
  const [loadedForUser, setLoadedForUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "Lab Reports",
    documentDate: "",
    notes: ""
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [actionError, setActionError] = useState("");

  async function refreshDocuments() {
    if (!userId) {
      setDocuments([]);
      setLoadedForUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setStorageError("");

    try {
      const savedDocuments = await getMedicalDocuments(userId);
      setDocuments(savedDocuments);
      setLoadedForUser(String(userId));
    } catch (error) {
      setStorageError(error.message || "Unable to load your medical records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDocuments([]);
    setLoadedForUser(null);
    refreshDocuments();
  }, [userId]);

  useEffect(() => {
    if (!previewDocument) {
      setPreviewUrl("");
      return undefined;
    }

    let active = true;
    let objectUrl = "";

    getMedicalDocument(userId, previewDocument.id)
      .then((document) => {
        if (!active || !document?.fileBlob) return;
        objectUrl = URL.createObjectURL(document.fileBlob);
        setPreviewUrl(objectUrl);
      })
      .catch((error) => {
        if (active) setActionError(error.message || "Unable to preview this file.");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewDocument, userId]);

  const accountDocuments =
    userId && loadedForUser === String(userId) ? documents : [];

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accountDocuments.filter((document) => {
      const matchesSearch =
        !query ||
        document.title.toLowerCase().includes(query) ||
        document.fileName.toLowerCase().includes(query) ||
        document.category.toLowerCase().includes(query) ||
        (document.notes || "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" || document.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [accountDocuments, search, categoryFilter]);

  const totalSize = accountDocuments.reduce((total, item) => total + item.fileSize, 0);
  const pdfCount = accountDocuments.filter((item) => item.fileType === "application/pdf").length;
  const imageCount = accountDocuments.length - pdfCount;

  function resetForm() {
    setSelectedFile(null);
    setForm({
      title: "",
      category: "Lab Reports",
      documentDate: "",
      notes: ""
    });
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelection(event) {
    const file = event.target.files?.[0];
    setFormError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES[file.type]) {
      setSelectedFile(null);
      setFormError("Unsupported file type. Please choose a PDF, JPG or PNG file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setFormError("The selected file is larger than 10 MB. Please choose a smaller file.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (!form.title.trim()) {
      setForm((current) => ({
        ...current,
        title: file.name.replace(/\.[^/.]+$/, "")
      }));
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    setFormError("");

    if (!selectedFile) {
      setFormError("Please choose a document to upload.");
      return;
    }

    if (!form.title.trim()) {
      setFormError("Please enter a document title.");
      return;
    }

    setSaving(true);

    const document = {
      id: createId(),
      title: form.title.trim(),
      category: form.category,
      documentDate: form.documentDate,
      notes: form.notes.trim(),
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      uploadedAt: new Date().toISOString(),
      fileBlob: selectedFile
    };

    try {
      await saveMedicalDocument(userId, document);
      await refreshDocuments();
      resetForm();
      setShowUploadForm(false);
    } catch (error) {
      setFormError(
        error.message ||
        "Unable to upload this file to the project database. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(document) {
    setActionError("");

    try {
      const saved = await getMedicalDocument(userId, document.id);
      if (!saved?.fileBlob) throw new Error("The original file could not be found.");

      const url = URL.createObjectURL(saved.fileBlob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = saved.fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(error.message || "Unable to download this document.");
    }
  }

  async function handleDelete(document) {
    const confirmed = window.confirm(
      `Delete "${document.title}" from the database? This cannot be undone.`
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await deleteMedicalDocument(userId, document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      if (previewDocument?.id === document.id) setPreviewDocument(null);
    } catch (error) {
      setActionError(error.message || "Unable to delete this document.");
    }
  }

  function closeUploadForm() {
    setShowUploadForm(false);
    resetForm();
  }

  return (
    <div className="patient-feature-page medical-records-page">
      <header className="feature-page-header medical-records-header">
        <div>
          <span className="feature-eyebrow">PERSONAL DOCUMENT VAULT</span>
          <h1>Medical Records</h1>
          <p>
            Securely organise your reports, prescriptions, scans and other
            important healthcare documents.
          </p>
        </div>

        <button
          type="button"
          className="feature-primary-button"
          onClick={() => {
            setShowUploadForm(true);
            setActionError("");
          }}
        >
          <Plus size={17} />
          Add medical record
        </button>
      </header>

      <div className="medical-records-notice">
        <LockKeyhole size={17} />
        <p>
          <strong>Consent-controlled storage:</strong> Documents are saved in the
          local VitalSync PostgreSQL database. A doctor can open a document only
          after you select it in an appointment's sharing options.
        </p>
      </div>

      <section className="medical-records-stats" aria-label="Medical records summary">
        <article className="medical-record-stat">
          <span className="medical-record-stat-icon"><FolderOpen size={20} /></span>
          <div><small>Total documents</small><strong>{accountDocuments.length}</strong></div>
        </article>
        <article className="medical-record-stat">
          <span className="medical-record-stat-icon pdf"><FileText size={20} /></span>
          <div><small>PDF documents</small><strong>{pdfCount}</strong></div>
        </article>
        <article className="medical-record-stat">
          <span className="medical-record-stat-icon image"><FileImage size={20} /></span>
          <div><small>Image documents</small><strong>{imageCount}</strong></div>
        </article>
        <article className="medical-record-stat">
          <span className="medical-record-stat-icon storage"><HardDrive size={20} /></span>
          <div><small>Storage used</small><strong>{formatFileSize(totalSize)}</strong></div>
        </article>
      </section>

      {showUploadForm && (
        <section className="medical-upload-panel" aria-labelledby="medical-upload-title">
          <div className="medical-upload-heading">
            <div>
              <span className="feature-eyebrow">ADD TO YOUR VAULT</span>
              <h2 id="medical-upload-title">Upload a medical document</h2>
              <p>Choose a file and add details to make it easier to find later.</p>
            </div>
            <button
              type="button"
              className="medical-close-button"
              onClick={closeUploadForm}
              aria-label="Close upload form"
            >
              <X size={19} />
            </button>
          </div>

          <form className="medical-upload-form" onSubmit={handleUpload}>
            <div className="medical-file-drop">
              <div className="medical-upload-icon"><UploadCloud size={27} /></div>
              <h3>{selectedFile ? selectedFile.name : "Choose a document"}</h3>
              <p>
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} · ${ALLOWED_TYPES[selectedFile.type]}`
                  : "Select a PDF, JPG or PNG file from your device."}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileSelection}
                aria-label="Choose medical document"
              />
              <small>Maximum file size: 10 MB</small>
            </div>

            <div className="medical-form-grid">
              <div className="medical-form-field">
                <label htmlFor="medical-title">Document title *</label>
                <input
                  id="medical-title"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Complete Blood Count"
                  maxLength={100}
                  required
                />
              </div>

              <div className="medical-form-field">
                <label htmlFor="medical-category">Document category *</label>
                <select
                  id="medical-category"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {CATEGORIES.map((category) => (
                    <option value={category} key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="medical-form-field">
                <label htmlFor="medical-date">Document date</label>
                <input
                  id="medical-date"
                  type="date"
                  max={new Date().toLocaleDateString("en-CA")}
                  value={form.documentDate}
                  onChange={(event) => setForm({ ...form, documentDate: event.target.value })}
                />
              </div>

              <div className="medical-form-field medical-notes-field">
                <label htmlFor="medical-notes">Notes (optional)</label>
                <textarea
                  id="medical-notes"
                  rows="3"
                  maxLength={500}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Add a short description or context..."
                />
                <small>{form.notes.length}/500 characters</small>
              </div>
            </div>

            {formError && (
              <div className="medical-record-error" role="alert">
                <AlertCircle size={17} />
                {formError}
              </div>
            )}

            <div className="medical-upload-actions">
              <button type="button" className="feature-secondary-button" onClick={closeUploadForm}>
                Cancel
              </button>
              <button type="submit" className="feature-primary-button" disabled={saving}>
                {saving ? <><UploadCloud size={16} /> Saving...</> : <><CheckCircle2 size={16} /> Save document</>}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="medical-library-section">
        <div className="medical-library-heading">
          <div>
            <span className="feature-eyebrow">YOUR DOCUMENT LIBRARY</span>
            <h2>All medical records</h2>
            <p>Search, preview, download or remove documents stored on this device.</p>
          </div>
          <span className="medical-record-count">
            <ClipboardList size={16} />
            {filteredDocuments.length} {filteredDocuments.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="medical-record-filters">
          <div className="medical-record-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, file name or notes..."
              aria-label="Search medical records"
            />
          </div>

          <label className="medical-record-category-filter">
            <Filter size={16} />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter medical records by category"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((category) => (
                <option value={category} key={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>

        {storageError && (
          <div className="medical-record-error" role="alert">
            <AlertCircle size={17} />
            {storageError}
            <button type="button" onClick={refreshDocuments}>Try again</button>
          </div>
        )}

        {actionError && (
          <div className="medical-record-error" role="alert">
            <AlertCircle size={17} />
            {actionError}
            <button type="button" onClick={() => setActionError("")} aria-label="Dismiss error">
              <X size={15} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="medical-record-empty">
            <div className="medical-empty-icon"><FolderOpen size={27} /></div>
            <h3>Loading your documents</h3>
            <p>Reading your locally stored medical records.</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="medical-record-empty">
            <div className="medical-empty-icon"><FilePlus2 size={27} /></div>
            <h3>{accountDocuments.length ? "No matching documents" : "Your document vault is empty"}</h3>
            <p>
              {accountDocuments.length
                ? "Try a different search term or category."
                : "Upload your first report, prescription or scan to start organising your medical records."}
            </p>
            {!accountDocuments.length && (
              <button
                type="button"
                className="feature-primary-button"
                onClick={() => setShowUploadForm(true)}
              >
                <Plus size={16} />
                Upload first document
              </button>
            )}
          </div>
        ) : (
          <div className="medical-document-grid">
            {filteredDocuments.map((document) => {
              const Icon = getFileIcon(document.fileType);

              return (
                <article className="medical-document-card" key={document.id}>
                  <div className="medical-document-card-top">
                    <div className={`medical-document-icon ${document.fileType === "application/pdf" ? "pdf" : "image"}`}>
                      <Icon size={23} />
                    </div>
                    <span className="medical-document-category">{document.category}</span>
                  </div>

                  <div className="medical-document-info">
                    <h3 title={document.title}>{document.title}</h3>
                    <p className="medical-document-filename">{document.fileName}</p>
                    <div className="medical-document-meta">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>Added {formatDateTime(document.uploadedAt)}</span>
                    </div>
                    {document.documentDate && (
                      <p className="medical-document-date">
                        <CalendarDays size={13} />
                        Document date: {formatDate(document.documentDate)}
                      </p>
                    )}
                    {document.notes && <p className="medical-document-notes">{document.notes}</p>}
                  </div>

                  <div className="medical-document-actions">
                    <button
                      type="button"
                      className="medical-document-action primary"
                      onClick={() => {
                        setActionError("");
                        setPreviewDocument(document);
                      }}
                    >
                      <Eye size={15} /> Preview
                    </button>
                    <button
                      type="button"
                      className="medical-document-icon-button"
                      onClick={() => handleDownload(document)}
                      aria-label={`Download ${document.title}`}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      type="button"
                      className="medical-document-icon-button danger"
                      onClick={() => handleDelete(document)}
                      aria-label={`Delete ${document.title}`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="medical-records-privacy">
        <ShieldCheck size={18} />
        <p>
          <strong>Privacy and medical safety:</strong> This is an academic document
          organiser. Files are stored in the local project database and are
          shared with a doctor only when you explicitly select them during
          appointment consent. Do not upload real patient records. This page
          does not interpret reports or provide medical advice.
        </p>
      </div>

      {previewDocument && (
        <div
          className="medical-preview-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewDocument(null);
          }}
        >
          <section
            className="medical-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="medical-preview-title"
          >
            <header className="medical-preview-header">
              <div>
                <span className="feature-eyebrow">DOCUMENT PREVIEW</span>
                <h2 id="medical-preview-title">{previewDocument.title}</h2>
                <p>{previewDocument.fileName}</p>
              </div>
              <button
                type="button"
                className="medical-close-button"
                onClick={() => setPreviewDocument(null)}
                aria-label="Close document preview"
              >
                <X size={19} />
              </button>
            </header>

            <div className="medical-preview-content">
              {!previewUrl ? (
                <div className="medical-record-empty">
                  <FolderOpen size={28} />
                  <p>Preparing preview...</p>
                </div>
              ) : previewDocument.fileType === "application/pdf" ? (
                <iframe title={previewDocument.title} src={previewUrl} />
              ) : (
                <img src={previewUrl} alt={previewDocument.title} />
              )}
            </div>

            <footer className="medical-preview-footer">
              <span>{formatFileSize(previewDocument.fileSize)}</span>
              <button
                type="button"
                className="feature-primary-button"
                onClick={() => handleDownload(previewDocument)}
              >
                <Download size={16} /> Download original
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
