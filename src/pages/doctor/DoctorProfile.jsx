import { useEffect, useState } from "react";
import { Save, UserRound, CalendarClock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorSettings, saveDoctorSettings, registerDoctorProfile } from "../../services/doctorService";
import "../../styles/doctor.css";
import "../../styles/doctor-care.css";
const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
export default function DoctorProfile() {
  const { currentUser } = useAuth();
  const id = String(currentUser?.id ?? currentUser?.email ?? "");
  const [form,setForm] = useState({ specialty:"", hospital:"", consultationFee:"", bio:"", availability:{} });
  const [saved,setSaved] = useState(false);
  useEffect(() => {
    const value = getDoctorSettings(id);
    setForm({ ...value, specialty: value.specialty || currentUser?.specialty || currentUser?.specialization || "", hospital: value.hospital || currentUser?.hospital || "", availability: value.availability || {} });
  },[id,currentUser]);
  function updateDay(day, value) { setForm(f=>({...f,availability:{...f.availability,[day]:value.split(",").map(x=>x.trim()).filter(Boolean)}})); }
  function submit(e) { e.preventDefault(); saveDoctorSettings(id,form); registerDoctorProfile({...currentUser,...form,role:"doctor"}); setSaved(true); }
  return <div className="patient-feature-page doctor-feature-page"><div className="feature-page-header"><div><span className="feature-eyebrow">ACCOUNT MANAGEMENT</span><h1>Doctor Profile & Availability</h1><p>Manage the professional details and weekly availability displayed in your demo profile.</p></div></div>
    <div className="doctor-demo-banner"><ShieldCheck size={18}/><p><strong>Demo profile:</strong> These settings are saved locally in this browser. They do not publish a real clinic schedule or guarantee appointment availability.</p></div>
    <form className="feature-panel doctor-settings-form" onSubmit={submit}><h2><UserRound size={19}/> Professional information</h2>
      <div className="doctor-settings-grid"><label>Full name<input value={currentUser?.name || ""} readOnly/></label><label>Email<input value={currentUser?.email || ""} readOnly/></label><label>Specialty<input value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})} placeholder="e.g. General Physician"/></label><label>Hospital / Clinic<input value={form.hospital} onChange={e=>setForm({...form,hospital:e.target.value})} placeholder="Hospital or clinic name"/></label><label>Consultation fee (demo)<input type="number" min="0" value={form.consultationFee} onChange={e=>setForm({...form,consultationFee:e.target.value})} placeholder="e.g. 500"/></label></div>
      <label>Professional introduction<textarea rows="4" maxLength="800" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Briefly describe your clinical interests and experience."/></label>
      <h2><CalendarClock size={19}/> Weekly availability</h2><p className="doctor-care-muted">Enter time slots separated by commas, for example: 09:00–12:00, 16:00–18:00.</p>
      <div className="doctor-availability-grid">{days.map(day=><label key={day}>{day[0].toUpperCase()+day.slice(1)}<input value={(form.availability[day]||[]).join(", ")} onChange={e=>updateDay(day,e.target.value)} placeholder="Not available"/></label>)}</div>
      <div className="doctor-settings-footer"><button className="feature-primary-button" type="submit"><Save size={16}/> Save profile & availability</button>{saved&&<span role="status">Saved successfully in this browser.</span>}</div>
    </form></div>;
}
