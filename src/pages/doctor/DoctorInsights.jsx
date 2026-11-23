import { useMemo } from "react";
import { Activity, FileText, ClipboardList, TrendingUp, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentRequests } from "../../services/doctorService";
import "../../styles/doctor.css";
import "../../styles/doctor-care.css";
export default function DoctorInsights() {
 const {currentUser}=useAuth(); const id=String(currentUser?.id ?? currentUser?.email ?? "");
 const data=useMemo(()=>getAppointmentRequests().filter(r=>String(r.assignedDoctorId||"")===id && r.sharedHealthData && r.shareConsent),[id]);
 const totals=data.reduce((acc,r)=>{const d=r.sharedHealthData||{};acc.symptoms+=d.categories?.symptoms?(d.symptoms||[]).length:0;acc.history+=d.categories?.healthHistory?(d.healthHistory||[]).length:0;acc.documents+=d.categories?.medicalDocuments?(d.medicalDocuments||[]).length:0;return acc;},{symptoms:0,history:0,documents:0});
 return <div className="patient-feature-page doctor-feature-page"><div className="feature-page-header"><div><span className="feature-eyebrow">CONSENT-BASED OVERVIEW</span><h1>Patient Health Insights</h1><p>A summary of health information patients have explicitly shared through appointment requests.</p></div></div><div className="doctor-demo-banner"><ShieldCheck size={18}/><p><strong>Privacy boundary:</strong> This page counts only data categories present in consent snapshots. It does not diagnose, predict conditions or calculate clinical risk.</p></div>
 <div className="doctor-insight-grid"><article><Activity/><span>Shared symptom entries</span><strong>{totals.symptoms}</strong></article><article><ClipboardList/><span>Shared history entries</span><strong>{totals.history}</strong></article><article><FileText/><span>Selected documents</span><strong>{totals.documents}</strong></article><article><TrendingUp/><span>Requests with consent</span><strong>{data.length}</strong></article></div>
 <section className="feature-panel"><h2>Recent consented submissions</h2>{data.length?data.slice(0,8).map(r=><div className="doctor-insight-row" key={r.id}><div><strong>{r.patient?.name||"Patient"}</strong><small>{r.facilityName||"Appointment request"} · {r.date||"Date not set"}</small></div><span>{(r.sharedHealthData?.categories&&Object.entries(r.sharedHealthData.categories).filter(([,v])=>v).map(([k])=>k).join(", "))||"Summary only"}</span></div>):<p className="doctor-care-muted">No appointment requests with health-data consent are available yet.</p>}</section></div>;
}
