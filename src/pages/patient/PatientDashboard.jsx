import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, BrainCircuit, CalendarDays, ClipboardList, Droplets, FileText, HeartPulse, MessageCircle, Moon, Watch } from "lucide-react";
import { DemoNotice, MetricCard, PageHeader, Panel, SectionHeading } from "../../components/patient/PageComponents";
import { getPatientDashboard } from "../../services/healthService";

const links=[
  ["Ask health AI","Educational answers from your local model",BrainCircuit,"/patient/assistant"],
  ["Book a doctor","Share selected data with consent",CalendarDays,"/patient/appointments"],
  ["Symptoms","Record and review symptom history",ClipboardList,"/patient/symptoms"],
  ["Medical records","Store reports securely in the database",FileText,"/patient/records"],
  ["Smart band","Sync mock readings and create alerts",Watch,"/patient/devices"],
  ["Clinical messages","Continue with your doctor",MessageCircle,"/patient/messages"],
];
export default function PatientDashboard(){
  const navigate=useNavigate(); const [data,setData]=useState({wearable:{latest:null,alerts:[]},appointments:[],activeSymptomCount:0}); const [error,setError]=useState("");
  async function load(){try{setData(await getPatientDashboard());}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]); const latest=data.wearable?.latest; const openAlerts=(data.wearable?.alerts||[]).filter(a=>!a.acknowledged);
  return <div className="patient-feature-page"><PageHeader eyebrow="CONNECTED PATIENT PORTAL" title="Your health workspace" description="Ask questions, track simulated wearable signals, book care and decide exactly what a doctor may see." action={<button className="feature-primary-button" onClick={()=>navigate("/patient/assistant")}><BrainCircuit size={16}/>Ask the AI</button>}/><DemoNotice/>{error&&<p className="care-error">{error}</p>}
    <section className="feature-section"><SectionHeading title="Latest health snapshot" description="Database-backed simulated measurements from the demo band."/><div className="feature-metric-grid"><MetricCard title="Heart rate" value={latest?.heartRate??"—"} unit="BPM" icon={HeartPulse} description="Simulated reading"/><MetricCard title="Blood oxygen" value={latest?.spo2??"—"} unit="%" icon={Droplets} description="Simulated reading"/><MetricCard title="Sleep" value={latest?.sleepHours??"—"} unit="hours" icon={Moon} description="Simulated reading"/><MetricCard title="Open alerts" value={openAlerts.length} unit="" icon={Activity} description="Rule-based demo alerts"/></div></section>
    <section className="feature-section"><SectionHeading title="Care at a glance"/><div className="care-grid"><div className="care-item"><span className="care-badge">SYMPTOMS</span><h3>{data.activeSymptomCount} ongoing</h3><button className="care-link-button" onClick={()=>navigate("/patient/symptoms")}>Review history <ArrowRight size={14}/></button></div><div className="care-item"><span className="care-badge">APPOINTMENTS</span><h3>{data.appointments.length} recent requests</h3><button className="care-link-button" onClick={()=>navigate("/patient/appointments")}>Open appointments <ArrowRight size={14}/></button></div><div className={`care-item ${openAlerts.length?"care-alert":""}`}><span className={`care-badge ${openAlerts.length?"warning":""}`}>ALERTS</span><h3>{openAlerts.length?`${openAlerts.length} need review`:"No open alerts"}</h3><button className="care-link-button" onClick={()=>navigate("/patient/devices")}>View band data <ArrowRight size={14}/></button></div></div></section>
    <section className="feature-section"><SectionHeading title="Patient services" description="Each workflow is connected to the backend API."/><div className="feature-shortcut-grid">{links.map(([title,description,Icon,path])=><button className="feature-shortcut-card" key={path} onClick={()=>navigate(path)}><div className="feature-shortcut-icon"><Icon size={22}/></div><h3>{title}</h3><p>{description}</p><span>Open <ArrowRight size={15}/></span></button>)}</div></section>
    <section className="feature-section"><SectionHeading title="Recent appointment activity"/><Panel>{data.appointments.length===0?<div className="feature-empty-state"><CalendarDays size={28}/><h3>No appointment requests</h3><p>Use Book a doctor to create your first consent-based request.</p></div>:<div className="care-stack">{data.appointments.map(item=><article className="care-item" key={item.id}><div className="care-item-head"><div><h3>{item.assignedDoctorName}</h3><p>{item.facilityName} · {new Date(item.date).toLocaleDateString("en-IN")} at {item.time}</p></div><span className="care-badge">{item.status}</span></div></article>)}</div>}</Panel></section>
  </div>;
}
