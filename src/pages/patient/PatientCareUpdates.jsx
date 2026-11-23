import { useMemo } from "react";
import { CalendarDays, ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentRequests, getDoctorPatientCare } from "../../services/doctorService";
import "../../styles/doctor.css";
import "../../styles/doctor-care.css";
export default function PatientCareUpdates() {
  const { currentUser } = useAuth();
  const patientId = String(currentUser?.id ?? currentUser?.email ?? "");
  const plans = useMemo(() => {
    const requests = getAppointmentRequests().filter(r => String(r.patient?.id ?? r.patient?.email ?? "") === patientId);
    const byDoctor = new Map();
    requests.forEach(r => {
      const doctorId = String(r.assignedDoctorId || "");
      if (!doctorId) return;
      const care = getDoctorPatientCare(doctorId, patientId);
      if (care.carePlans?.length) byDoctor.set(doctorId,{doctorName:r.assignedDoctorName || "Your doctor", plans:care.carePlans});
    });
    return [...byDoctor.entries()].flatMap(([doctorId,data]) => data.plans.map(plan=>({...plan,doctorId,doctorName:data.doctorName}))).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  },[patientId]);
  return <div className="patient-feature-page"><div className="feature-page-header"><div><span className="feature-eyebrow">YOUR CARE JOURNEY</span><h1>Care Plan & Follow-ups</h1><p>Review care-plan items and follow-up actions added by doctors assigned through your appointment requests.</p></div></div>
    <div className="doctor-demo-banner"><ShieldCheck size={18}/><p><strong>Read-only patient view:</strong> Care plans are created and updated by your doctor. This demo stores them in the same browser and does not replace clinical instructions provided directly by your healthcare professional.</p></div>
    <section className="feature-panel">{plans.length ? plans.map(plan=><article className="patient-care-plan-card" key={plan.id}><div className="patient-care-plan-top"><span className={`doctor-status-pill ${plan.status==="Completed"?"is-accepted":""}`}>{plan.status || "Active"}</span><small>{plan.doctorName}</small></div><h3>{plan.title}</h3><p>{plan.details}</p><div className="patient-care-plan-meta">{plan.dueDate&&<span><CalendarDays size={14}/> Review date: {new Date(`${plan.dueDate}T00:00:00`).toLocaleDateString("en-IN")}</span>}<span><Clock3 size={14}/> Added {new Date(plan.createdAt).toLocaleDateString("en-IN")}</span></div></article>) : <div className="feature-empty-state"><ClipboardCheck size={28}/><h3>No care-plan updates yet</h3><p>When your assigned doctor adds a care-plan item, it will appear here.</p></div>}</section></div>;
}
