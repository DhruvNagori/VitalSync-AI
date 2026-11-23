/*
 * Account-scoped local storage for VitalSync AI symptom demonstration data.
 * Each temporary account gets a separate key based on currentUser.id.
 */

const BASE_STORAGE_KEY = "vitalsync_symptom_records_v1";

export function getSymptomStorageKey(userId) {
  if (userId === null || userId === undefined || userId === "") return null;
  return `${BASE_STORAGE_KEY}_${encodeURIComponent(String(userId))}`;
}

export function loadSymptomRecords(userId) {
  const key = getSymptomStorageKey(userId);
  if (!key) return [];

  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to load symptom records:", error);
    return [];
  }
}

export function saveSymptomRecords(userId, records) {
  const key = getSymptomStorageKey(userId);
  if (!key) return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("vitalsync:symptoms-updated", {
      detail: { userId: String(userId) }
    }));
    return true;
  } catch (error) {
    console.error("Unable to save symptom records:", error);
    return false;
  }
}