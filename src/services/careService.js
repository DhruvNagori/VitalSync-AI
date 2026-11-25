import { apiRequest } from "./api";

const json = (method, payload) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

export const getDoctors = (city = "") => apiRequest(`/doctors${city ? `?city=${encodeURIComponent(city)}` : ""}`);
export const getDoctorProfile = () => apiRequest("/doctor/profile");
export const saveDoctorProfile = (payload) => apiRequest("/doctor/profile", json("PUT", payload));

export const getAppointments = () => apiRequest("/appointments");
export const createAppointment = (payload) => apiRequest("/appointments", json("POST", payload));
export const updateAppointmentStatus = (id, status) => apiRequest(`/appointments/${id}/status`, json("PATCH", { status }));

export const getDoctorDashboard = () => apiRequest("/doctor/dashboard");
export const getDoctorPatients = () => apiRequest("/doctor/patients");
export const getPatientWorkspace = (id) => apiRequest(`/doctor/patients/${id}`);
export const addConsultationNote = (id, text) => apiRequest(`/doctor/patients/${id}/notes`, json("POST", { text }));
export const addCarePlan = (id, payload) => apiRequest(`/doctor/patients/${id}/care-plans`, json("POST", payload));
export const updateCarePlan = (id, status) => apiRequest(`/care-plans/${id}`, json("PATCH", { status }));
export const getPatientCarePlans = () => apiRequest("/care-plans");

export const getMessageContacts = () => apiRequest("/messages/contacts");
export const getMessages = (contactId) => apiRequest(`/messages/${contactId}`);
export const sendMessage = (contactId, text) => apiRequest("/messages", json("POST", { contact_id: contactId, text }));
