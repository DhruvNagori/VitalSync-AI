import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, CalendarDays, MapPin, FileText, ClipboardList,
  Plus, Stethoscope, ShieldCheck, Download, Eye, Activity, Clock3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getAppointmentRequests, getDoctorPatientCare, saveDoctorPatientCare,
} from "../../services/doctorService";
import { getMedicalDocument } from "../../utils/medicalRecordsStorage";
import "../../styles/doctor.css";
import "../../styles/doctor-care.css";

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-IN");
}
function formatSize(bytes = 0) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function PatientCare() {
  const { patientId } = useParams();
  const { currentUser } = useAuth();
  const doctorId = String(currentUser?.id ?? currentUser?.email ?? "");
  const [care, setCare] = useState({ notes: [], carePlans: [] });
  const [noteText, setNoteText] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [planDetails, setPlanDetails] = useState("");
  const [planDueDate, setPlanDueDate] = useState("");
  const [feedback, setFeedback] = useState("");
  const [documentBusy, setDocumentBusy] = useState("");
  const [documentError, setDocumentError] = useState("");

  const patientRequests = useMemo(() => getAppointmentRequests().filter((item) =>
    String(item.assignedDoctorId || "") === doctorId &&
    String(item.patient?.id || item.patient?.email || "") === patientId
  ), [doctorId, patientId]);
  const patient = patientRequests[0]?.patient || null;

  useEffect(() => {
    setCare(getDoctorPatientCare(doctorId, patientId));
  }, [doctorId, patientId]);

  function persist(nextCare) {
    setCare(nextCare);
    saveDoctorPatientCare(doctorId, patientId, nextCare);
    setFeedback("Saved in this browser for this doctor-patient relationship.");
  }
  function addNote(event) {
    event.preventDefault();
    if (!noteText.trim()) return;
    const note = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: noteText.trim(), createdAt: new Date().toISOString(), doctorName: currentUser?.name || "Doctor" };
    persist({ ...care, notes: [note, ...care.notes] });
    setNoteText("");
  }
  function addCarePlan(event) {
    event.preventDefault();
    if (!planTitle.trim() || !planDetails.trim()) return;
    const plan = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: planTitle.trim(), details: planDetails.trim(), dueDate: planDueDate, status: "Active", createdAt: new Date().toISOString(), doctorName: currentUser?.name || "Doctor" };
    persist({ ...care, carePlans: [plan, ...care.carePlans] });
    setPlanTitle(""); setPlanDetails(""); setPlanDueDate("");
  }
  function updatePlanStatus(id, status) {
    persist({ ...care, carePlans: care.carePlans.map((plan) => plan.id === id ? { ...plan, status } : plan) });
  }

  async function openSharedDocument(request, metadata, download = false) {
    setDocumentError("");
    setDocumentBusy(metadata.id);
    try {
      const patientAccountId = request.patient?.id ?? request.patient?.email;
      const allowed = (request.sharedHealthData?.medicalDocuments || []).some((item) => item.id === metadata.id);
      if (!allowed || !patientAccountId) throw new Error("This document was not included in the patient's consent for this request.");
      const saved = await getMedicalDocument(patientAccountId, metadata.id);
      if (!saved?.fileBlob) throw new Error("The original file is unavailable in this browser. The metadata was shared, but the file may have been removed or this is a different device.");
      const url = URL.createObjectURL(saved.fileBlob);
      if (download) {
        const link = document.createElement("a");
        link.href = url; link.download = saved.fileName || metadata.fileName;
        document.body.appendChild(link); link.click(); link.remove();
        URL.revokeObjectURL(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      setDocumentError(error.message || "Unable to open this shared document.");
    } finally {
      setDocumentBusy("");
    }
  }

  if (!patient) {
    return <div className="patient-feature-page doctor-feature-page">
      <div className="doctor-care-back"><Link to="/doctor/patients"><ArrowLeft size={16} /> Back to Patient Directory</Link></div>
      <div className="feature-panel feature-empty-state"><div className="feature-empty-icon"><ShieldCheck size={25} /></div><h3>Patient relationship not found</h3><p>This patient has no appointment request assigned to your doctor account in this browser.</p></div>
    </div>;
  }

  const consentedRequests = patientRequests.filter((item) => item.shareConsent && item.sharedHealthData);
  return <div className="patient-feature-page doctor-feature-page">
    <div className="doctor-care-back"><Link to="/doctor/patients"><ArrowLeft size={16} /> Back to Patient Directory</Link></div>
    <div className="feature-page-header"><div><span className="feature-eyebrow">AUTHORIZED PATIENT WORKSPACE</span><h1>{patient.name || "Patient"}</h1><p>Review the health information explicitly shared with you for each appointment request.</p></div></div>
    <div className="doctor-demo-banner"><ShieldCheck size={18} /><p><strong>Consent boundary:</strong> Only information captured in an appointment's consent snapshot is displayed below. This is a browser-local demonstration, not a secure clinical records system.</p></div>

    <section className="feature-section doctor-care-profile-grid">
      <article className="feature-panel doctor-care-profile-card">
        <div className="doctor-care-avatar">{(patient.name || "P").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
        <div><h2>{patient.name || "Patient"}</h2><span>Patient account</span></div>
        <div className="doctor-care-contact-list">{patient.email && <p><Mail size={15} /> {patient.email}</p>}{patient.phone && <p><Phone size={15} /> {patient.phone}</p>}</div>
      </article>
      <article className="feature-panel">
        <div className="feature-panel-heading"><div><h3>Appointment requests</h3><p>Requests assigned to your account</p></div><CalendarDays size={20} /></div>
        {patientRequests.map((item) => <div className="doctor-care-appointment" key={item.id}><strong>{item.facilityName}</strong><span><CalendarDays size={14} /> {formatDate(item.date)} · {item.time}</span><span><MapPin size={14} /> {item.address || item.city}</span><span className={`doctor-status-pill ${item.status === "Accepted" ? "is-accepted" : item.status === "Declined" ? "is-declined" : ""}`}>{item.status || "Pending review"}</span></div>)}
      </article>
    </section>

    <section className="feature-section">
      <div className="feature-section-heading"><div><h2>Patient-shared health information</h2><p>Each section below is limited to the categories and files approved for that appointment.</p></div></div>
      <div className="feature-panel">
        {consentedRequests.length === 0 ? <div className="doctor-care-empty"><FileText size={23} /><strong>No health information shared</strong><p>The patient has not selected any health information to share with these appointment requests.</p></div> :
          consentedRequests.map((request) => {
            const data = request.sharedHealthData || {};
            const categories = data.categories || {};
            const symptoms = data.symptoms || [];
            const history = data.healthHistory || [];
            const documents = data.medicalDocuments || [];
            return <article className="doctor-shared-summary" key={request.id}>
              <div><strong>Consent recorded · {formatDateTime(data.consentedAt)}</strong><span>{request.facilityName} · {formatDate(request.date)}</span></div>
              {categories.writtenSummary && request.patientSharedSummary && <div className="doctor-shared-data-block"><h4>Patient-written summary</h4><p>{request.patientSharedSummary}</p></div>}
              {categories.symptoms && <div className="doctor-shared-data-block"><h4><Activity size={16} /> Recorded symptoms ({symptoms.length})</h4>
                {symptoms.length ? symptoms.map((record) => <div className="doctor-shared-record" key={`sym-${record.id}`}><strong>{(record.symptoms || []).join(", ") || "Symptom entry"}</strong><span>Severity: {record.severity ?? "—"}/10 · {record.status || "Status not recorded"}</span><span>Started: {formatDate(record.onsetDate)} · Duration: {record.duration || "Not recorded"}</span>{record.notes && <p>{record.notes}</p>}</div>) : <p>No symptom entries were present when consent was given.</p>}
              </div>}
              {categories.healthHistory && <div className="doctor-shared-data-block"><h4><Clock3 size={16} /> Health history timeline ({history.length})</h4>
                {history.length ? history.map((record) => <div className="doctor-shared-record" key={`hist-${record.id}`}><strong>{(record.symptoms || []).join(", ") || "Health event"}</strong><span>Recorded: {formatDateTime(record.createdAt)} · Severity: {record.severity ?? "—"}/10</span><span>{record.status || "Status not recorded"} · {record.duration || "Duration not recorded"}</span>{record.notes && <p>{record.notes}</p>}</div>) : <p>No health-history entries were present when consent was given.</p>}
              </div>}
              {categories.medicalDocuments && <div className="doctor-shared-data-block"><h4><FileText size={16} /> Medical documents ({documents.length})</h4>
                {documents.length ? documents.map((item) => <div className="doctor-shared-record doctor-shared-document" key={item.id}><div><strong>{item.title}</strong><span>{item.category} · {item.fileName} · {formatSize(item.fileSize)}</span>{item.documentDate && <span>Document date: {formatDate(item.documentDate)}</span>}{item.notes && <p>{item.notes}</p>}</div><div className="doctor-shared-document-actions"><button type="button" className="feature-secondary-button" disabled={documentBusy === item.id} onClick={() => openSharedDocument(request, item, false)}><Eye size={15} /> View</button><button type="button" className="feature-secondary-button" disabled={documentBusy === item.id} onClick={() => openSharedDocument(request, item, true)}><Download size={15} /> Download</button></div></div>) : <p>No documents were selected for this request.</p>}
              </div>}
            </article>;
          })}
        {documentError && <p className="doctor-care-feedback" role="alert">{documentError}</p>}
      </div>
    </section>

    <section className="feature-section"><div className="feature-section-heading"><div><h2>Consultation notes</h2><p>Private working notes stored for this doctor-patient pair in this browser.</p></div></div><div className="feature-panel">
      <form className="doctor-care-form" onSubmit={addNote}><label htmlFor="doctor-consultation-note">Add a consultation note</label><textarea id="doctor-consultation-note" rows="4" maxLength="2000" value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Record consultation observations or follow-up context..." /><button className="feature-primary-button" type="submit" disabled={!noteText.trim()}><Plus size={16} /> Save note</button></form>
      <div className="doctor-care-list">{care.notes.length === 0 ? <p className="doctor-care-muted">No consultation notes have been added.</p> : care.notes.map((note) => <article className="doctor-care-entry" key={note.id}><p>{note.text}</p><small>{note.doctorName} · {new Date(note.createdAt).toLocaleString("en-IN")}</small></article>)}</div>
    </div></section>

    <section className="feature-section"><div className="feature-section-heading"><div><h2>Care plan</h2><p>Create and track follow-up actions for this patient.</p></div></div><div className="feature-panel">
      <form className="doctor-care-form" onSubmit={addCarePlan}><div className="doctor-care-form-grid"><div><label htmlFor="care-plan-title">Plan title</label><input id="care-plan-title" value={planTitle} onChange={(event) => setPlanTitle(event.target.value)} placeholder="e.g. Follow-up consultation" maxLength="120" required /></div><div><label htmlFor="care-plan-date">Review date (optional)</label><input id="care-plan-date" type="date" min={new Date().toLocaleDateString("en-CA")} value={planDueDate} onChange={(event) => setPlanDueDate(event.target.value)} /></div></div><label htmlFor="care-plan-details">Care plan details</label><textarea id="care-plan-details" rows="4" maxLength="2000" value={planDetails} onChange={(event) => setPlanDetails(event.target.value)} placeholder="Add the follow-up steps or instructions agreed during the consultation..." required /><button className="feature-primary-button" type="submit" disabled={!planTitle.trim() || !planDetails.trim()}><Plus size={16} /> Add care plan item</button></form>
      <div className="doctor-care-list">{care.carePlans.length === 0 ? <p className="doctor-care-muted">No care plan items have been added.</p> : care.carePlans.map((plan) => <article className="doctor-care-entry" key={plan.id}><div className="doctor-care-entry-heading"><strong>{plan.title}</strong><span className={`doctor-status-pill ${plan.status === "Completed" ? "is-accepted" : ""}`}>{plan.status}</span></div><p>{plan.details}</p>{plan.dueDate && <small>Review date: {formatDate(plan.dueDate)}</small>}<div className="doctor-care-plan-actions">{plan.status !== "Completed" && <button className="feature-secondary-button" type="button" onClick={() => updatePlanStatus(plan.id, "Completed")}>Mark completed</button>}{plan.status !== "Active" && <button className="feature-secondary-button" type="button" onClick={() => updatePlanStatus(plan.id, "Active")}>Reopen</button>}</div></article>)}</div>
    </div></section>
    {feedback && <p className="doctor-care-feedback" role="status">{feedback}</p>}
    <p className="doctor-care-disclaimer"><Stethoscope size={16} /> Demo-only clinical workspace. This local prototype is not a production electronic health record and does not provide clinical decision support.</p>
  </div>;
}
