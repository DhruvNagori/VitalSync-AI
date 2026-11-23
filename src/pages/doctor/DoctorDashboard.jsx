import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, CalendarDays, Clock3, CheckCircle2, ArrowRight,
  ClipboardList, Activity, Stethoscope, RefreshCw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getAppointmentRequests, getPatientDirectory, subscribeToDemoData,
  formatAppointmentDate
} from "../../services/doctorService";
import "../../styles/doctor.css";

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <article className="feature-metric-card doctor-metric-card">
      <div className="feature-metric-top">
        <div className="feature-metric-icon"><Icon size={21} /></div>
        <span className="feature-status">DEMO DATA</span>
      </div>
      <p>{label}</p><div className="feature-metric-value"><strong>{value}</strong></div><small>{detail}</small>
    </article>
  );
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const doctorId = String(currentUser?.id ?? currentUser?.email ?? "");
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);

  function refresh() {
    const assigned = getAppointmentRequests().filter(
      (item) => String(item.assignedDoctorId ?? "") === doctorId
    );
    setRequests(assigned);
    setPatients(getPatientDirectory(doctorId));
  }

  useEffect(() => {
    refresh();
    return subscribeToDemoData(refresh);
  }, [doctorId]);

  const pending = useMemo(
    () => requests.filter((item) => (item.status || "Pending review") === "Pending review").length,
    [requests]
  );
  const accepted = useMemo(() => requests.filter((item) => item.status === "Accepted").length, [requests]);

  return (
    <div className="patient-feature-page doctor-feature-page">
      <div className="feature-page-header doctor-welcome-header">
        <div><span className="feature-eyebrow">VITALSYNC AI · DOCTOR PORTAL</span>
          <h1>Welcome, Dr. {currentUser?.name || "Doctor"}</h1>
          <p>Review incoming patient requests and manage your clinical workspace.</p>
        </div>
        <button className="feature-secondary-button" onClick={refresh}><RefreshCw size={16} /> Refresh data</button>
      </div>
      <div className="doctor-demo-banner"><Activity size={18} />
        <p><strong>Demonstration workspace:</strong> figures and requests are browser-local sample data, not a live hospital system or verified medical record.</p>
      </div>
      <section className="feature-section">
        <div className="feature-section-heading"><div><h2>Workspace overview</h2><p>Current information assigned to your doctor account.</p></div></div>
        <div className="feature-metric-grid">
          <Metric icon={Users} label="Patients in directory" value={patients.length} detail="Unique linked patient profiles" />
          <Metric icon={CalendarDays} label="Incoming requests" value={requests.length} detail="Requests assigned to you" />
          <Metric icon={Clock3} label="Awaiting review" value={pending} detail="Requests not yet reviewed" />
          <Metric icon={CheckCircle2} label="Accepted requests" value={accepted} detail="Marked accepted in this demo" />
        </div>
      </section>
      <section className="feature-section">
        <div className="feature-section-heading">
          <div><h2>Appointment request activity</h2><p>Latest requests assigned to your account.</p></div>
          <button className="feature-text-button" onClick={() => navigate("/doctor/appointments")}>View all <ArrowRight size={15} /></button>
        </div>
        <div className="feature-panel">
          {requests.length === 0 ? (
            <div className="feature-empty-state">
              <div className="feature-empty-icon"><CalendarDays size={25} /></div>
              <h3>No requests available yet</h3>
              <p>Requests assigned to your doctor account from the patient portal will appear here.</p>
              <button className="feature-secondary-button" onClick={() => navigate("/doctor/appointments")}>Open request queue <ArrowRight size={15} /></button>
            </div>
          ) : (
            <div className="feature-record-list">{requests.slice(0, 5).map((item) => (
              <div className="feature-record-item" key={item.id}>
                <div className="doctor-request-summary"><div className="doctor-request-icon"><CalendarDays size={20} /></div>
                  <div><h4>{item.facilityName || "Healthcare facility request"}</h4>
                    <p>{item.patient?.name || "Patient details not supplied"} · {formatAppointmentDate(item.date)} · {item.time || "Time not selected"}</p>
                    <p>{item.city || item.address || "Location not provided"}</p>
                  </div>
                </div>
                <span className={`doctor-status-pill ${item.status === "Accepted" ? "is-accepted" : item.status === "Declined" ? "is-declined" : ""}`}>{item.status || "Pending review"}</span>
              </div>
            ))}</div>
          )}
        </div>
      </section>
      <section className="feature-section">
        <div className="feature-section-heading"><div><h2>Quick access</h2><p>Move directly to common doctor workflows.</p></div></div>
        <div className="feature-shortcut-grid">
          <button className="feature-shortcut-card" onClick={() => navigate("/doctor/patients")}>
            <div className="feature-shortcut-icon"><Users size={22} /></div><h3>Patient Directory</h3>
            <p>Search patient information linked to your account.</p><span>Open directory <ArrowRight size={15} /></span>
          </button>
          <button className="feature-shortcut-card" onClick={() => navigate("/doctor/appointments")}>
            <div className="feature-shortcut-icon"><ClipboardList size={22} /></div><h3>Review Requests</h3>
            <p>Review, accept or decline incoming demonstration requests.</p><span>Open requests <ArrowRight size={15} /></span>
          </button>
          <div className="feature-shortcut-card doctor-static-card">
            <div className="feature-shortcut-icon"><Stethoscope size={22} /></div><h3>Clinical workspace</h3>
            <p>Manage consultation notes and care-plan items for linked patients.</p><span>Available in Patient Care</span>
          </div>
        </div>
      </section>
    </div>
  );
}
