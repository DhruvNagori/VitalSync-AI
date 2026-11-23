import { useEffect, useMemo, useState } from "react";
import { Search, Users, Mail, Phone, CalendarDays, RefreshCw, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getPatientDirectory, subscribeToDemoData } from "../../services/doctorService";
import "../../styles/doctor.css";

export default function Patients() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");

  function refresh() {
    const doctorId = String(currentUser?.id ?? currentUser?.email ?? "");
    setPatients(getPatientDirectory(doctorId));
  }

  useEffect(() => {
    refresh();
    return subscribeToDemoData(refresh);
  }, [currentUser]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return !term ? patients : patients.filter((patient) =>
      [patient.name, patient.email, patient.phone, patient.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [patients, query]);

  return (
    <div className="patient-feature-page doctor-feature-page">
      <div className="feature-page-header">
        <div><span className="feature-eyebrow">PATIENT MANAGEMENT</span><h1>Patient Directory</h1><p>Find patients who have submitted a request assigned to your doctor account.</p></div>
        <button className="feature-secondary-button" onClick={refresh}><RefreshCw size={16} /> Refresh</button>
      </div>
      <div className="doctor-demo-banner"><Users size={18} /><p><strong>Data limitation:</strong> this directory shows basic patient details included in requests assigned to your doctor profile in this browser. It is not a complete patient registry or a medical record.</p></div>
      <section className="feature-section">
        <div className="doctor-directory-toolbar">
          <div className="doctor-search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by patient name, email or phone..." aria-label="Search patients" /></div>
          <span className="doctor-directory-count">{filtered.length} patient{filtered.length === 1 ? "" : "s"}</span>
        </div>
        <div className="feature-panel">
          {filtered.length === 0 ? (
            <div className="feature-empty-state"><div className="feature-empty-icon"><Users size={25} /></div>
              <h3>{patients.length ? "No matching patients" : "No linked patients found"}</h3>
              <p>{patients.length ? "Try a different search term." : "Patients will appear here after they submit an appointment request specifically assigned to your doctor account."}</p>
            </div>
          ) : (
            <div className="doctor-patient-grid">
              {filtered.map((patient, index) => {
                const name = patient.name || "Patient";
                const initials = name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <article className="doctor-patient-card" key={patient.id || patient.email || index}>
                    <div className="doctor-patient-card-top"><div className="doctor-patient-avatar">{initials}</div><div><h3>{name}</h3><span>Patient profile</span></div></div>
                    <div className="doctor-patient-contact">
                      {patient.email && <p><Mail size={15} />{patient.email}</p>}
                      {patient.phone && <p><Phone size={15} />{patient.phone}</p>}
                      {patient.createdAt && <p><CalendarDays size={15} />Added {new Date(patient.createdAt).toLocaleDateString("en-IN")}</p>}
                    </div>
                    <div className="doctor-patient-card-foot">
                      <span>Demo record · Basic details only</span>
                      <button type="button" onClick={() => navigate(`/doctor/patients/${encodeURIComponent(String(patient.id || patient.email || ""))}`)}>Open patient <ArrowRight size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
