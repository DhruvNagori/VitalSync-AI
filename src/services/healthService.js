import { apiRequest } from "./api";

export const getSymptoms = () => apiRequest("/symptoms");
export const createSymptom = (payload) => apiRequest("/symptoms", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
export const updateSymptom = (id, payload) => apiRequest(`/symptoms/${id}`, {
  method: "PATCH", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
export const deleteSymptom = (id) => apiRequest(`/symptoms/${id}`, { method: "DELETE" });

export const getWearableState = () => apiRequest("/wearables");
export const updateWearableDevice = (connected, scenario) => apiRequest("/wearables/device", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ connected, scenario })
});
export const syncWearable = () => apiRequest("/wearables/sync", { method: "POST" });
export const acknowledgeAlert = (id) => apiRequest(`/alerts/${id}/acknowledge`, { method: "PATCH" });
export const getPatientDashboard = () => apiRequest("/patient/dashboard");
