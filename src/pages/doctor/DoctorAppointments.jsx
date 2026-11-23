import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Check, X, RefreshCw, MapPin, Clock3, UserRound, Stethoscope, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getAppointmentRequests, updateAppointmentRequest, subscribeToDemoData, formatAppointmentDate,
} from "../../services/doctorService";
import "../../styles/doctor.css";

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");

  function refresh() {
    const doctorId = String(currentUser?.id ?? currentUser?.email ?? "");
    setRequests(getAppointmentRequests().filter((item) => String(item.assignedDoctorId || "") === doctorId));
  }

  useEffect(() => {
    refresh();
    return subscribeToDemoData(refresh);
  }, [currentUser]);

  function update(id, status) {
    updateAppointmentRequest(id, status, currentUser);
    refresh();
  }

  const visible = requests.filter((item) =>
    filter === "All" || (item.status || "Pending review") === filter
  );

  return (
    <div className="patient-feature-page doctor-feature-page">
      <div className="feature-page-header">
        <div><span className="feature-eyebrow">CARE COORDINATION</span><h1>Appointment Requests</h1><p>Review requests specifically assigned to your doctor account.</p></div>
        <button className="feature-secondary-button" onClick={refresh}><RefreshCw size={16} /> Refresh</button>
      </div>
      <div className="doctor-demo-banner"><CalendarDays size={18} /><p><strong>Demo workflow:</strong> requests are routed to the selected doctor account in this browser. Accepting or declining updates the patient's local request status; it does not confirm a real appointment.</p></div>
      <section className="feature-section">
        <div className="doctor-filter-row">
          {["All", "Pending review", "Accepted", "Declined"].map((item) => (
            <button key={item} className={`doctor-filter-chip ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)}>{item}</button>
          ))}
          <span className="doctor-directory-count">{visible.length} request{visible.length === 1 ? "" : "s"}</span>
        </div>
        <div className="feature-panel">
          {visible.length === 0 ? (
            <div className="feature-empty-state">
              <div className="feature-empty-icon"><CalendarDays size={25} /></div>
              <h3>No requests in this view</h3>
              <p>Requests assigned to your doctor profile from the patient portal will appear here.</p>
            </div>
          ) : (
            <div className="feature-record-list">
              {visible.map((item) => (
                <article className="doctor-appointment-card" key={item.id}>
                  <div className="doctor-appointment-main">
                    <div className="doctor-request-icon"><CalendarDays size={21} /></div>
                    <div className="doctor-appointment-details">
                      <div className="doctor-appointment-title">
                        <h3>{item.facilityName || "Healthcare facility request"}</h3>
                        <span className={`doctor-status-pill ${item.status === "Accepted" ? "is-accepted" : item.status === "Declined" ? "is-declined" : ""}`}>{item.status || "Pending review"}</span>
                      </div>
                      <p><UserRound size={14} /> {item.patient?.name || "Patient details not supplied"}</p>
                      {item.patient?.email && <p>{item.patient.email}</p>}
                      <p><Stethoscope size={14} /> {item.assignedDoctorName} · {item.doctorSpecialty}</p>
                      <p><CalendarDays size={14} /> {formatAppointmentDate(item.date)} <Clock3 size={14} /> {item.time || "Time not selected"}</p>
                      <p><MapPin size={14} /> {item.address || item.city || "Location not supplied"}</p>
                      {item.reason && <p className="doctor-request-reason">Reason: {item.reason}</p>}
                      {item.reviewedBy && <small>Reviewed by {item.reviewedBy}</small>}
                      {item.patient?.id || item.patient?.email ? (
                        <button
                          type="button"
                          className="feature-text-button doctor-open-patient-button"
                          onClick={() => navigate(`/doctor/patients/${encodeURIComponent(String(item.patient.id || item.patient.email))}`)}
                        >
                          Open patient workspace <ArrowRight size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {(item.status || "Pending review") === "Pending review" && (
                    <div className="doctor-appointment-actions">
                      <button className="feature-primary-button" onClick={() => update(item.id, "Accepted")}><Check size={16} /> Accept</button>
                      <button className="feature-secondary-button doctor-decline-button" onClick={() => update(item.id, "Declined")}><X size={16} /> Decline</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
