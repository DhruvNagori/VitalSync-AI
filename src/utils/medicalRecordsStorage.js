/*
 * VitalSync AI - Medical Records browser storage.
 * Uses IndexedDB because medical files are binary data and should not be
 * stored as base64 strings in localStorage.
 */

const DATABASE_NAME = "vitalsync_medical_records";
const DATABASE_VERSION = 2;
const STORE_NAME = "documents";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support local document storage."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });
        store.createIndex("uploadedAt", "uploadedAt", { unique: false });
        store.createIndex("category", "category", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(
      request.error || new Error("Unable to open local document storage.")
    );
  });
}

function runTransaction(mode, operation) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;

    try {
      result = operation(store);
    } catch (error) {
      database.close();
      reject(error);
      return;
    }

    transaction.oncomplete = () => {
      database.close();
      resolve(result?.result);
    };

    transaction.onerror = () => {
      const error = transaction.error || new Error("Document storage operation failed.");
      database.close();
      reject(error);
    };

    transaction.onabort = () => {
      const error = transaction.error || new Error("Document storage operation was cancelled.");
      database.close();
      reject(error);
    };
  }));
}

export async function getMedicalDocuments(userId) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => {
      const documents = (request.result || []).filter(
        (document) => String(document.userId) === String(userId)
      );
      documents.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      resolve(documents);
    };

    request.onerror = () => reject(
      request.error || new Error("Unable to load medical documents.")
    );

    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Unable to read medical documents."));
    };
  });
}

export async function saveMedicalDocument(userId, document) {
  if (userId === null || userId === undefined || userId === "") {
    throw new Error("A signed-in account is required to save a medical document.");
  }

  const accountDocument = { ...document, userId: String(userId) };
  await runTransaction("readwrite", (store) => store.put(accountDocument));
  return accountDocument;
}

export async function deleteMedicalDocument(userId, id) {
  const existing = await getMedicalDocument(userId, id);
  if (!existing) return false;
  await runTransaction("readwrite", (store) => store.delete(id));
  return true;
}

export async function getMedicalDocument(userId, id) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);

    request.onsuccess = () => {
      const document = request.result || null;
      resolve(document && String(document.userId) === String(userId) ? document : null);
    };
    request.onerror = () => reject(
      request.error || new Error("Unable to open this medical document.")
    );

    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Unable to read this medical document."));
    };
  });
}