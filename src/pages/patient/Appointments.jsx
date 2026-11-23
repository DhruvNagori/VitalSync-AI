import { useEffect, useMemo, useState } from "react";
import { loadSymptomRecords } from "../../utils/healthHistoryStorage";
import { getMedicalDocuments } from "../../utils/medicalRecordsStorage";
import {
  CalendarDays, CheckCircle2, Clock3, Hospital, LoaderCircle,
  MapPin, Search, Stethoscope, Trash2, UserRound, ArrowRight, UserCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  PageHeader, SectionHeading, Panel, EmptyState, DemoNotice,
} from "../../components/patient/PageComponents";
import AppointmentCalendar from "../../components/appointments/AppointmentCalendar";
import TimeSlotSelector from "../../components/appointments/TimeSlotSelector";
import {
  searchLocation, findNearbyHospitals, calculateDistance,
} from "../../services/hospitalService";
import {
  getDoctorDirectory, saveAppointmentRequest, removeAppointmentRequest,
  getAppointmentRequests, subscribeToDemoData,
} from "../../services/doctorService";

const SEARCH_RADIUS_METERS = 10000;
const APPOINTMENT_STORAGE_PREFIX = "vitalsync_demo_appointments_v1";

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function getStorageKey(user) {
  const identity = user?.id ?? user?.email ?? "guest";
  return `${APPOINTMENT_STORAGE_PREFIX}_${String(identity).trim().toLowerCase()}`;
}

function readAppointments(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getFacilityType(category = "") {
  const value = String(category).toLowerCase();
  if (value.includes("hospital")) return "Hospital";
  if (value.includes("clinic")) return "Clinic";
  if (value.includes("doctor")) return "Doctor practice";
  return "Healthcare facility";
}

function syncRequestStatuses(items) {
  const shared = getAppointmentRequests();
  const sharedById = new Map(shared.map((item) => [item.id, item]));
  return items.map((item) => {
    const latest = sharedById.get(item.id);
    return latest ? { ...item, ...latest } : item;
  });
}

export default function Appointments() {
  const { currentUser } = useAuth();
  const storageKey = getStorageKey(currentUser);

  const [city, setCity] = useState("");
  const [cityLabel, setCityLabel] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [sharedHealthSummary, setSharedHealthSummary] = useState("");
  const [shareHealthSummary, setShareHealthSummary] = useState(false);
  const [shareSymptoms, setShareSymptoms] = useState(false);
  const [shareHealthHistory, setShareHealthHistory] = useState(false);
  const [shareMedicalDocuments, setShareMedicalDocuments] = useState(false);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [healthDataLoading, setHealthDataLoading] = useState(false);
  const patientId = currentUser?.id ?? currentUser?.email ?? null;
  const [appointmentState, setAppointmentState] = useState(() => ({
    owner: storageKey,
    items: readAppointments(storageKey),
  }));
  const [bookingMessage, setBookingMessage] = useState("");

  const appointments = appointmentState.owner === storageKey ? appointmentState.items : [];
  const filteredFacilities = useMemo(() => facilities.slice(0, 12), [facilities]);
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === selectedDoctorId);
  const today = getTodayKey();

  function refreshDoctors() {
    setDoctors(getDoctorDirectory());
  }

  useEffect(() => {
    setAppointmentState({
      owner: storageKey,
      items: syncRequestStatuses(readAppointments(storageKey)),
    });
  }, [storageKey]);

  useEffect(() => {
    refreshDoctors();
    return subscribeToDemoData(refreshDoctors);
  }, []);

  useEffect(() => {
    if (appointmentState.owner !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(appointmentState.items));
    } catch {
      // Keep the page usable if browser storage is unavailable.
    }
  }, [appointmentState, storageKey]);

  useEffect(() => {
    function refreshStatuses() {
      setAppointmentState((previous) => previous.owner === storageKey
        ? { ...previous, items: syncRequestStatuses(previous.items) }
        : previous);
    }
    window.addEventListener("focus", refreshStatuses);
    const unsubscribe = subscribeToDemoData(refreshStatuses);
    return () => {
      window.removeEventListener("focus", refreshStatuses);
      unsubscribe();
    };
  }, [storageKey]);

  useEffect(() => {
    let active = true;
    async function loadShareableHealthData() {
      if (!patientId) {
        setAvailableSymptoms([]);
        setAvailableDocuments([]);
        return;
      }
      setHealthDataLoading(true);
      try {
        const symptoms = loadSymptomRecords(patientId);
        const documents = await getMedicalDocuments(patientId);
        if (!active) return;
        setAvailableSymptoms(Array.isArray(symptoms) ? symptoms : []);
        setAvailableDocuments(Array.isArray(documents) ? documents : []);
      } catch (error) {
        if (active) {
          setAvailableSymptoms([]);
          setAvailableDocuments([]);
        }
      } finally {
        if (active) setHealthDataLoading(false);
      }
    }
    loadShareableHealthData();
    return () => { active = false; };
  }, [patientId]);

  function toggleSharedDocument(documentId) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId]
    );
  }

  async function handleCitySearch(event) {
    event.preventDefault();
    const query = city.trim();
    if (!query) {
      setSearchError("Enter a city or location to find healthcare facilities.");
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    setFacilities([]);
    setSelectedFacility(null);
    setSelectedDoctorId("");
    setAppointmentDate("");
    setAppointmentTime("");
    setHasSearched(false);
    setBookingMessage("");

    try {
      // Keep the existing Geoapify-based facility discovery service.
      const location = await searchLocation(query);
      const results = await findNearbyHospitals(
        location.latitude, location.longitude, SEARCH_RADIUS_METERS, "all"
      );

      const sorted = results
        .map((facility) => ({
          ...facility,
          distance: calculateDistance(
            location.latitude, location.longitude,
            facility.latitude, facility.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance);

      setCityLabel(location.displayName || query);
      setFacilities(sorted);
      setHasSearched(true);
      if (!sorted.length) {
        setSearchError("No facilities were listed near this location. Try a nearby locality or another city.");
      }
    } catch (error) {
      setSearchError(error.message || "Unable to search right now. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }

  function chooseFacility(facility) {
    setSelectedFacility(facility);
    setSelectedDoctorId("");
    setAppointmentDate("");
    setAppointmentTime("");
    setBookingMessage("");
  }

  function submitRequest(event) {
    event.preventDefault();
    if (!selectedFacility || !selectedDoctor || !appointmentDate || !appointmentTime) {
      setBookingMessage("Select a healthcare location, a doctor, date and time first.");
      return;
    }
    if (appointmentDate < today) {
      setBookingMessage("Please select today or a future date.");
      return;
    }

    const patient = {
      id: currentUser?.id ?? currentUser?.email ?? "guest",
      name: currentUser?.name || "Demo Patient",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    };

    const request = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patient,
      assignedDoctorId: String(selectedDoctor.id),
      assignedDoctorName: selectedDoctor.name,
      assignedDoctorEmail: selectedDoctor.email || "",
      doctorSpecialty: selectedDoctor.specialty || "General Practitioner",
      facilityName: selectedFacility.name,
      facilityType: getFacilityType(selectedFacility.category),
      city: cityLabel,
      address: selectedFacility.address,
      date: appointmentDate,
      time: appointmentTime,
      reason: reason.trim(),
      shareConsent: Boolean(
        shareHealthSummary || shareSymptoms || shareHealthHistory ||
        (shareMedicalDocuments && selectedDocumentIds.length)
      ),
      patientSharedSummary: shareHealthSummary ? sharedHealthSummary.trim() : "",
      sharedHealthData: {
        consentedAt: new Date().toISOString(),
        categories: {
          symptoms: shareSymptoms,
          healthHistory: shareHealthHistory,
          medicalDocuments: shareMedicalDocuments,
          writtenSummary: shareHealthSummary,
        },
        symptoms: shareSymptoms
          ? availableSymptoms.map((record) => ({
              id: record.id,
              symptoms: Array.isArray(record.symptoms) ? record.symptoms : [],
              severity: record.severity,
              onsetDate: record.onsetDate,
              duration: record.duration,
              notes: record.notes || "",
              status: record.status || "Ongoing",
              archived: Boolean(record.archived),
              createdAt: record.createdAt,
            }))
          : [],
        healthHistory: shareHealthHistory
          ? availableSymptoms.map((record) => ({
              id: record.id,
              symptoms: Array.isArray(record.symptoms) ? record.symptoms : [],
              severity: record.severity,
              onsetDate: record.onsetDate,
              duration: record.duration,
              notes: record.notes || "",
              status: record.status || "Ongoing",
              archived: Boolean(record.archived),
              createdAt: record.createdAt,
            }))
          : [],
        medicalDocuments: shareMedicalDocuments
          ? availableDocuments
              .filter((document) => selectedDocumentIds.includes(document.id))
              .map((document) => ({
                id: document.id,
                title: document.title,
                category: document.category,
                documentDate: document.documentDate || "",
                notes: document.notes || "",
                fileName: document.fileName,
                fileType: document.fileType,
                fileSize: document.fileSize,
                uploadedAt: document.uploadedAt,
              }))
          : [],
      },
      status: "Pending review",
      createdAt: new Date().toISOString(),
    };

    // Shared queue for the doctor portal.
    saveAppointmentRequest(request);

    // Account-scoped copy for the patient's own appointment history.
    setAppointmentState((previous) => ({
      owner: storageKey,
      items: [
        request,
        ...(previous.owner === storageKey ? previous.items.filter((item) => item.id !== request.id) : []),
      ],
    }));

    setAppointmentDate("");
    setAppointmentTime("");
    setReason("");
    setSharedHealthSummary("");
    setShareHealthSummary(false);
    setShareSymptoms(false);
    setShareHealthHistory(false);
    setShareMedicalDocuments(false);
    setSelectedDocumentIds([]);
    setBookingMessage(
      `Your request has been saved for ${selectedDoctor.name}. The doctor can review it in the doctor portal. This is a browser-local demonstration, not a confirmed booking.`
    );
  }

  function removeRequest(requestId) {
    removeAppointmentRequest(requestId);
    setAppointmentState((previous) => ({
      owner: storageKey,
      items: previous.owner === storageKey
        ? previous.items.filter((request) => request.id !== requestId)
        : [],
    }));
  }

  return (
    <div className="patient-feature-page appointments-page appointment-workflow-page">
      <PageHeader
        eyebrow="CARE & CONSULTATIONS"
        title="Book an Appointment"
        description="Find a healthcare location, choose a doctor and plan your consultation."
      />
      <DemoNotice />

      <div className="appointment-workflow-steps" aria-label="Appointment steps">
        <div className={hasSearched ? "is-complete" : "is-current"}>
          <span>1</span><div><strong>Find a location</strong><small>Choose your city</small></div>
        </div>
        <div className={selectedFacility ? "is-complete" : hasSearched ? "is-current" : ""}>
          <span>2</span><div><strong>Select a facility</strong><small>Choose where to visit</small></div>
        </div>
        <div className={selectedDoctor ? "is-complete" : selectedFacility ? "is-current" : ""}>
          <span>3</span><div><strong>Choose a doctor</strong><small>Select your clinician</small></div>
        </div>
        <div className={appointmentDate && appointmentTime ? "is-complete" : selectedDoctor ? "is-current" : ""}>
          <span>4</span><div><strong>Choose a time</strong><small>Plan your visit</small></div>
        </div>
      </div>

      <section className="feature-section appointment-location-section">
        <SectionHeading
          title="Where would you like to visit?"
          description="Search a city to see nearby hospitals, clinics and mapped healthcare practices."
        />
        <Panel>
          <form className="appointment-city-search appointment-workflow-search" onSubmit={handleCitySearch}>
            <div className="appointment-city-input">
              <MapPin size={19} />
              <input
                type="text" value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Enter city or locality, e.g. Ludhiana"
                aria-label="City or location"
              />
            </div>
            <button type="submit" className="feature-primary-button" disabled={searchLoading}>
              {searchLoading
                ? <><LoaderCircle size={17} className="spin" /> Searching...</>
                : <><Search size={17} /> Search locations</>}
            </button>
          </form>
          <p className="appointment-search-help">
            <MapPin size={14} /> Facility search uses the configured Geoapify Places service. Map listings may be incomplete.
          </p>
          {searchError && <div className="hospital-error" role="alert">{searchError}</div>}
        </Panel>
      </section>

      <section className="feature-section">
        <SectionHeading
          title="Choose a healthcare location"
          description={cityLabel ? `Nearby locations for ${cityLabel}` : "Your search results will appear here."}
        />
        {!hasSearched ? (
          <Panel><div className="appointment-discovery-empty">
            <span><Search size={25} /></span><strong>Start with a city search</strong>
            <p>We will show nearby healthcare locations here. For a full map-based search, use Find Hospitals in the sidebar.</p>
          </div></Panel>
        ) : filteredFacilities.length === 0 ? (
          <Panel><div className="appointment-discovery-empty">
            <span><Hospital size={25} /></span><strong>No mapped locations found</strong>
            <p>Try a nearby locality or use the Find Hospitals page to explore a different search radius.</p>
          </div></Panel>
        ) : (
          <div className="appointment-facility-grid">
            {filteredFacilities.map((facility) => (
              <button
                type="button" key={facility.id}
                className={`appointment-facility-card ${selectedFacility?.id === facility.id ? "is-selected" : ""}`}
                onClick={() => chooseFacility(facility)}
              >
                <span className="appointment-facility-card-icon"><Hospital size={21} /></span>
                <span className="appointment-facility-card-content">
                  <strong>{facility.name}</strong>
                  <small>{getFacilityType(facility.category)} <span>·</span> {facility.distance.toFixed(1)} km away</small>
                  <span className="appointment-facility-address">{facility.address}</span>
                </span>
                <span className="appointment-facility-select">
                  {selectedFacility?.id === facility.id ? <CheckCircle2 size={20} /> : <ArrowRight size={18} />}
                </span>
              </button>
            ))}
          </div>
        )}
        {hasSearched && facilities.length > filteredFacilities.length && (
          <p className="appointment-result-count">Showing the 12 closest locations. Open Find Hospitals for the full map and additional filters.</p>
        )}
      </section>

      <section className="feature-section">
        <SectionHeading
          title="Select your doctor"
          description="Choose a doctor registered in this VitalSync AI demo workspace."
        />
        <Panel>
          {!selectedFacility ? (
            <div className="appointment-booking-placeholder">
              <Stethoscope size={30} /><strong>Select a healthcare location first</strong>
              <p>Available doctor profiles will appear after you choose a location.</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="appointment-discovery-empty">
              <span><UserRound size={25} /></span>
              <strong>No doctor profiles are registered in this browser yet</strong>
              <p>Sign in with a doctor account and open the Doctor Portal once. The profile will then become selectable here.</p>
              <button type="button" className="feature-secondary-button" onClick={refreshDoctors}>Refresh doctor list</button>
            </div>
          ) : (
            <div className="appointment-facility-grid">
              {doctors.map((doctor) => (
                <button
                  type="button"
                  key={doctor.id}
                  className={`appointment-facility-card ${selectedDoctorId === String(doctor.id) ? "is-selected" : ""}`}
                  onClick={() => { setSelectedDoctorId(String(doctor.id)); setBookingMessage(""); }}
                >
                  <span className="appointment-facility-card-icon"><UserCheck size={21} /></span>
                  <span className="appointment-facility-card-content">
                    <strong>{doctor.name}</strong>
                    <small>{doctor.specialty || "General Practitioner"}</small>
                    <span className="appointment-facility-address">{doctor.email || "Doctor account"}{doctor.hospital ? ` · ${doctor.hospital}` : ""}</span>
                  </span>
                  <span className="appointment-facility-select">
                    {selectedDoctorId === String(doctor.id) ? <CheckCircle2 size={20} /> : <ArrowRight size={18} />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="feature-section">
        <SectionHeading
          title="Plan your consultation"
          description="Choose a date and preferred time after selecting your healthcare location and doctor."
        />
        <Panel>
          {!selectedFacility || !selectedDoctor ? (
            <div className="appointment-booking-placeholder">
              <CalendarDays size={30} /><strong>Select a location and doctor first</strong>
              <p>Your appointment details and scheduling options will appear here.</p>
            </div>
          ) : (
            <form className="feature-form appointment-booking-form" onSubmit={submitRequest}>
              <div className="appointment-booking-summary">
                <div className="appointment-booking-summary-icon"><Stethoscope size={22} /></div>
                <div className="appointment-booking-summary-details">
                  <span>Selected doctor</span>
                  <strong>{selectedDoctor.name}</strong>
                  <small>{selectedDoctor.specialty || "General Practitioner"}</small>
                  <small><MapPin size={13} /> {selectedFacility.name} · {selectedFacility.address}</small>
                </div>
                <span className="appointment-selected-badge"><CheckCircle2 size={14} /> Selected</span>
              </div>

              <div className="appointment-scheduling-grid">
                <div className="appointment-schedule-card">
                  <div className="appointment-schedule-card-heading">
                    <CalendarDays size={18} />
                    <div><strong>Select date</strong><small>Choose your preferred day</small></div>
                  </div>
                  <AppointmentCalendar
                    value={appointmentDate}
                    onChange={(date) => {
                      setAppointmentDate(date);
                      setAppointmentTime("");
                      setBookingMessage("");
                    }}
                    minDate={today}
                  />
                </div>
                <div className="appointment-schedule-card">
                  <div className="appointment-schedule-card-heading">
                    <Clock3 size={18} />
                    <div><strong>Select time</strong><small>{appointmentDate ? "Choose a preferred time slot" : "Select a date first"}</small></div>
                  </div>
                  <TimeSlotSelector
                    value={appointmentTime}
                    onChange={(time) => { setAppointmentTime(time); setBookingMessage(""); }}
                    disabled={!appointmentDate}
                  />
                </div>
              </div>

              <div className="feature-form-group appointment-reason-field">
                <label htmlFor="appointment-reason">Reason for consultation (optional)</label>
                <textarea
                  id="appointment-reason" rows="3" value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Briefly describe what you would like to discuss..."
                />
              </div>

              <div className="feature-form-group appointment-reason-field doctor-sharing-field">
                <strong>Choose the health information you want to share</strong>
                <p className="appointment-search-help">
                  Each selection applies only to this appointment request. The doctor receives a snapshot of the information selected below.
                </p>

                <label className="doctor-sharing-consent">
                  <input type="checkbox" checked={shareSymptoms} onChange={(event) => setShareSymptoms(event.target.checked)} />
                  <span><strong>Recorded symptoms</strong> — share {availableSymptoms.length} symptom {availableSymptoms.length === 1 ? "entry" : "entries"}, including severity, dates, status and notes.</span>
                </label>

                <label className="doctor-sharing-consent">
                  <input type="checkbox" checked={shareHealthHistory} onChange={(event) => setShareHealthHistory(event.target.checked)} />
                  <span><strong>Health history timeline</strong> — share the symptom-based timeline shown in your Health History section ({availableSymptoms.length} entries).</span>
                </label>

                <div className="doctor-sharing-documents">
                  <label className="doctor-sharing-consent">
                    <input type="checkbox" checked={shareMedicalDocuments} onChange={(event) => {
                      setShareMedicalDocuments(event.target.checked);
                      if (!event.target.checked) setSelectedDocumentIds([]);
                    }} />
                    <span><strong>Medical documents</strong> — choose individual reports, prescriptions or scans to share.</span>
                  </label>
                  {shareMedicalDocuments && (
                    <div className="doctor-shared-document-picker">
                      {healthDataLoading ? <small>Loading your document library…</small> :
                        availableDocuments.length === 0 ? <small>No medical documents are available in this account yet.</small> :
                        availableDocuments.map((document) => (
                          <label className="doctor-sharing-consent doctor-document-option" key={document.id}>
                            <input type="checkbox" checked={selectedDocumentIds.includes(document.id)} onChange={() => toggleSharedDocument(document.id)} />
                            <span><strong>{document.title}</strong><small>{document.category} · {document.fileName}</small></span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>

                <label htmlFor="doctor-health-summary">Personal health summary (optional)</label>
                <textarea
                  id="doctor-health-summary"
                  rows="4"
                  maxLength="1200"
                  value={sharedHealthSummary}
                  onChange={(event) => setSharedHealthSummary(event.target.value)}
                  placeholder="Add any context you want this doctor to know, such as concerns, relevant medicines or allergies..."
                />
                <small>{sharedHealthSummary.length}/1200 characters.</small>
                <label className="doctor-sharing-consent">
                  <input type="checkbox" checked={shareHealthSummary} onChange={(event) => setShareHealthSummary(event.target.checked)} />
                  <span><strong>Consent to share my written summary</strong> — include the text above in this appointment request.</span>
                </label>

                <div className="doctor-sharing-privacy-note">
                  <strong>Privacy control:</strong> Unselected categories and documents are not added to the appointment request. Health metrics and connected-device readings are not offered here because those sources are not currently connected to this demo workflow.
                </div>
              </div>

              <div className="appointment-submit-row">
                <div className="appointment-submit-hint">
                  <UserRound size={16} />
                  <span>Review your selected doctor, location, date and time before submitting.</span>
                </div>
                <button type="submit" className="feature-primary-button" disabled={!appointmentDate || !appointmentTime}>
                  <CalendarDays size={17} /> Send appointment request
                </button>
              </div>
              {bookingMessage && (
                <div className="appointment-feedback" role="status">
                  <CheckCircle2 size={17} /><span>{bookingMessage}</span>
                </div>
              )}
            </form>
          )}
        </Panel>
      </section>

      <section className="feature-section">
        <SectionHeading
          title="My appointment requests"
          description="Your saved demonstration requests for this patient account."
        />
        <Panel>
          {appointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointment requests yet" description="Your added demonstration requests will appear here." />
          ) : (
            <div className="feature-record-list">
              {appointments.map((item) => (
                <div className="feature-record-item" key={item.id}>
                  <div className="appointment-record">
                    <CalendarDays size={22} />
                    <div>
                      <h4>{item.facilityName}</h4>
                      <p>Dr. {item.assignedDoctorName || "Not selected"} · {item.doctorSpecialty || "Specialty not listed"}</p>
                      <p>{item.facilityType} · {item.city}</p>
                      <p><CalendarDays size={13} /> {item.date} · <Clock3 size={13} /> {item.time}</p>
                      <p>{item.address}</p>
                      {item.reason && <p>Reason: {item.reason}</p>}
                      {item.shareConsent && <p><strong>Health summary shared:</strong> Yes</p>}
                      <strong className={`doctor-status-pill ${item.status === "Accepted" ? "is-accepted" : item.status === "Declined" ? "is-declined" : ""}`}>{item.status || "Pending review"}</strong>
                      {item.reviewedBy && <p>Reviewed by {item.reviewedBy}</p>}
                      <small>Demo request — not a confirmed clinical booking</small>
                    </div>
                  </div>
                  <button
                    type="button" className="feature-icon-button danger"
                    onClick={() => removeRequest(item.id)}
                    aria-label={`Remove request for ${item.facilityName}`}
                  ><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="feature-section">
        <Panel>
          <div className="hospital-data-notice">
            <strong>About doctor profiles and appointment requests</strong>
            <p>Doctor choices are demo profiles registered when a doctor account opens the Doctor Portal in this browser. Facility names and locations are retrieved through the configured Geoapify Places service.</p>
            <p>Requests are saved in this browser and assigned to the selected doctor account. This does not verify clinical availability or create a real appointment. Cross-device sharing, secure medical data and confirmed scheduling require the VitalSync AI backend.</p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
