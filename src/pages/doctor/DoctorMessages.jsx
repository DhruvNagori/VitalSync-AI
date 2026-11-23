import { useEffect, useMemo, useState } from "react";
import { Send, MessageCircle, UserRound, Clock3, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentRequests, getClinicalMessages, sendClinicalMessage, subscribeToDemoData } from "../../services/doctorService";
import "../../styles/doctor.css";
import "../../styles/doctor-care.css";

export default function ClinicalMessages({ mode = "doctor" }) {
  const { currentUser } = useAuth();
  const userId = String(currentUser?.id ?? currentUser?.email ?? "");
  const isDoctor = mode === "doctor";
  const [messages, setMessages] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const assignedPatients = useMemo(() => {
    const requests = getAppointmentRequests().filter((r) => String(r.assignedDoctorId || "") === userId && r.patient);
    const map = new Map();
    requests.forEach((r) => {
      const id = String(r.patient.id ?? r.patient.email ?? "");
      if (id && !map.has(id)) map.set(id, { id, name: r.patient.name || "Patient", email: r.patient.email || "" });
    });
    return [...map.values()];
  }, [userId]);

  const patientDoctors = useMemo(() => {
    const requests = getAppointmentRequests().filter((r) => String(r.patient?.id ?? r.patient?.email ?? "") === userId);
    const map = new Map();
    requests.forEach((r) => {
      const id = String(r.assignedDoctorId || "");
      if (id && !map.has(id)) map.set(id, { id, name: r.assignedDoctorName || "Assigned doctor", specialty: r.doctorSpecialty || "" });
    });
    return [...map.values()];
  }, [userId]);

  const contacts = isDoctor ? assignedPatients : patientDoctors;
  useEffect(() => {
    const refresh = () => setMessages(getClinicalMessages());
    refresh();
    return subscribeToDemoData(refresh);
  }, []);

  useEffect(() => {
    if (!selectedPatient && contacts.length) setSelectedPatient(contacts[0].id);
    if (selectedPatient && !contacts.some((c) => c.id === selectedPatient)) setSelectedPatient(contacts[0]?.id || "");
  }, [contacts, selectedPatient]);

  const activeMessages = messages.filter((m) =>
    isDoctor
      ? String(m.doctorId) === userId && String(m.patientId) === selectedPatient
      : String(m.patientId) === userId && String(m.doctorId) === selectedPatient
  );

  function handleSend(event) {
    event.preventDefault();
    if (!draft.trim() || !selectedPatient) return;
    const message = {
      doctorId: isDoctor ? userId : selectedPatient,
      patientId: isDoctor ? selectedPatient : userId,
      senderId: userId,
      senderRole: isDoctor ? "doctor" : "patient",
      senderName: currentUser?.name || (isDoctor ? "Doctor" : "Patient"),
      text: draft.trim(),
    };
    const next = sendClinicalMessage(message);
    setMessages(next);
    setDraft("");
    setError("");
  }

  return <div className="patient-feature-page doctor-feature-page">
    <div className="feature-page-header"><div><span className="feature-eyebrow">CARE COMMUNICATION</span><h1>Messages</h1><p>Exchange non-urgent messages with patients connected through an appointment request.</p></div></div>
    <div className="doctor-demo-banner"><ShieldCheck size={18}/><p><strong>Demonstration messaging:</strong> Messages are stored in this browser only. Do not send emergency requests or sensitive clinical information. For urgent concerns, contact the appropriate healthcare service directly.</p></div>
    <div className="clinical-messaging-layout">
      <aside className="clinical-contact-panel"><h3>{isDoctor ? "My patients" : "Doctors from my requests"}</h3>
        {contacts.length ? contacts.map((contact) => <button type="button" key={contact.id} className={`clinical-contact ${selectedPatient === contact.id ? "active" : ""}`} onClick={() => setSelectedPatient(contact.id)}><span className="clinical-avatar"><UserRound size={18}/></span><span><strong>{contact.name}</strong><small>{contact.specialty || contact.email || (isDoctor ? "Patient" : "Assigned doctor")}</small></span></button>) : <p className="doctor-care-muted">No appointment-linked contacts are available yet.</p>}
      </aside>
      <section className="clinical-chat-panel"><header><div className="clinical-avatar"><MessageCircle size={18}/></div><div><strong>{contacts.find(c => c.id === selectedPatient)?.name || "Select a contact"}</strong><small>Appointment-linked conversation</small></div></header>
        <div className="clinical-chat-history">{activeMessages.length ? activeMessages.map((m) => <article key={m.id} className={`clinical-message ${m.senderId === userId ? "mine" : ""}`}><p>{m.text}</p><small>{m.senderName} · {new Date(m.createdAt).toLocaleString("en-IN")}</small></article>) : <div className="clinical-chat-empty"><MessageCircle size={28}/><strong>No messages yet</strong><span>Start the conversation with a short, non-urgent message.</span></div>}</div>
        <form className="clinical-chat-compose" onSubmit={handleSend}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message..." maxLength={1500} disabled={!selectedPatient}/><button className="feature-primary-button" type="submit" disabled={!draft.trim() || !selectedPatient}><Send size={16}/> Send</button></form>
      </section>
    </div>
  </div>;
}
