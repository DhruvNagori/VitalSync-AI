const REQUEST_KEY = "vitalsync_demo_appointment_requests_v1";
const PATIENT_KEY = "vitalsync_demo_patient_directory_v1";
const DOCTOR_KEY = "vitalsync_demo_doctor_directory_v1";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("vitalsync-demo-data-updated"));
    return true;
  } catch {
    return false;
  }
}

export function getAppointmentRequests() {
  const value = read(REQUEST_KEY, []);
  return Array.isArray(value) ? value : [];
}

export function saveAppointmentRequest(request) {
  const next = [request, ...getAppointmentRequests().filter((item) => item.id !== request.id)];
  write(REQUEST_KEY, next);
  return next;
}

export function removeAppointmentRequest(id) {
  const next = getAppointmentRequests().filter((item) => item.id !== id);
  write(REQUEST_KEY, next);
  return next;
}

export function updateAppointmentRequest(id, status, doctor) {
  const next = getAppointmentRequests().map((item) => item.id === id
    ? {
        ...item,
        status,
        reviewedBy: doctor?.name || "Doctor",
        reviewedAt: new Date().toISOString(),
      }
    : item);
  write(REQUEST_KEY, next);
  return next;
}

export function registerDoctorProfile(user) {
  if (!user || user.role !== "doctor") return getDoctorDirectory();

  const doctor = {
    id: String(user.id ?? user.email),
    name: user.name || "Doctor",
    email: user.email || "",
    specialty: user.specialty || user.specialization || "General Practitioner",
    hospital: user.hospital || user.clinic || "",
  };

  const doctors = getDoctorDirectory();
  const next = [doctor, ...doctors.filter((item) => String(item.id) !== doctor.id)];
  write(DOCTOR_KEY, next);
  return next;
}

// A fresh browser page load starts a new in-memory demo-auth session.
export function resetDemoDoctorDirectory() {
  try {
    localStorage.removeItem(DOCTOR_KEY);
    window.dispatchEvent(new CustomEvent("vitalsync-demo-data-updated"));
  } catch {
    // Keep the app usable if browser storage is unavailable.
  }
}

export function getDoctorDirectory() {
  const value = read(DOCTOR_KEY, []);
  return Array.isArray(value) ? value : [];
}

export function getPatientDirectory(doctorId) {
  const doctorKey = String(doctorId ?? "");
  if (!doctorKey) return [];

  // Only patients connected through requests assigned to this doctor are visible.
  const requests = getAppointmentRequests().filter(
    (item) => String(item.assignedDoctorId ?? "") === doctorKey && item.patient
  );

  const map = new Map();
  requests.forEach((item) => {
    const patient = item.patient;
    const key = String(patient.id ?? patient.email ?? patient.name ?? "").toLowerCase();
    if (key && !map.has(key)) map.set(key, patient);
  });

  return [...map.values()];
}

export function subscribeToDemoData(callback) {
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("vitalsync-demo-data-updated", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("vitalsync-demo-data-updated", handler);
  };
}

export function formatAppointmentDate(value) {
  if (!value) return "Date not selected";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}


const CARE_DATA_PREFIX = "vitalsync_doctor_care_v1";

function getCareStorageKey(doctorId, patientId) {
  return `${CARE_DATA_PREFIX}_${encodeURIComponent(String(doctorId || ""))}_${encodeURIComponent(String(patientId || ""))}`;
}

export function getDoctorPatientCare(doctorId, patientId) {
  const value = read(getCareStorageKey(doctorId, patientId), { notes: [], carePlans: [] });
  return {
    notes: Array.isArray(value.notes) ? value.notes : [],
    carePlans: Array.isArray(value.carePlans) ? value.carePlans : [],
  };
}

export function saveDoctorPatientCare(doctorId, patientId, careData) {
  return write(getCareStorageKey(doctorId, patientId), careData);
}


const MESSAGE_KEY = "vitalsync_demo_clinical_messages_v1";
const DOCTOR_SETTINGS_PREFIX = "vitalsync_doctor_settings_v1";

export function getClinicalMessages() {
  const value = read(MESSAGE_KEY, []);
  return Array.isArray(value) ? value : [];
}
export function sendClinicalMessage(message) {
  const messages = getClinicalMessages();
  const next = [...messages, {
    ...message,
    id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: message.createdAt || new Date().toISOString(),
  }];
  write(MESSAGE_KEY, next);
  return next;
}
export function getDoctorSettings(doctorId) {
  return read(`${DOCTOR_SETTINGS_PREFIX}_${encodeURIComponent(String(doctorId || ""))}`, {
    specialty: "", hospital: "", consultationFee: "", bio: "",
    availability: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
  });
}
export function saveDoctorSettings(doctorId, settings) {
  return write(`${DOCTOR_SETTINGS_PREFIX}_${encodeURIComponent(String(doctorId || ""))}`, settings);
}