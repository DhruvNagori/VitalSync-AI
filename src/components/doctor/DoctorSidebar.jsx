import { NavLink, useNavigate } from "react-router-dom";
import { HeartPulse, LayoutDashboard, Users, CalendarDays, LogOut, ChevronLeft, Stethoscope, MessageCircle, Activity, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
const items = [
 {name:"Overview",path:"/doctor/dashboard",icon:LayoutDashboard,end:true},
 {name:"Patients",path:"/doctor/patients",icon:Users},
 {name:"Appointment Requests",path:"/doctor/appointments",icon:CalendarDays},
 {name:"Messages",path:"/doctor/messages",icon:MessageCircle},
 {name:"Patient Insights",path:"/doctor/insights",icon:Activity},
 {name:"Profile & Availability",path:"/doctor/profile",icon:UserRound},
];
export default function DoctorSidebar({mobileOpen,closeSidebar}) {
 const navigate=useNavigate(); const {logout}=useAuth();
 function handleLogout(){logout();navigate("/login",{replace:true});}
 return <>{mobileOpen&&<div className="patient-sidebar-overlay" onClick={closeSidebar}/>}<aside className={`patient-sidebar ${mobileOpen?"patient-sidebar-open":""}`}><div className="patient-sidebar-brand"><div className="patient-brand-icon"><HeartPulse size={25}/></div><span>VitalSync AI</span><button className="sidebar-close-button" onClick={closeSidebar} aria-label="Close navigation"><ChevronLeft size={20}/></button></div><div className="doctor-sidebar-caption"><Stethoscope size={15}/><span>DOCTOR PORTAL</span></div><nav className="patient-nav"><div className="patient-nav-group"><div className="sidebar-section-label">CLINICAL WORKSPACE</div>{items.map(item=>{const Icon=item.icon;return <NavLink key={item.path} to={item.path} end={item.end} onClick={closeSidebar} className={({isActive})=>`patient-nav-link ${isActive?"active":""}`}><Icon size={19}/><span>{item.name}</span></NavLink>;})}</div></nav><div className="patient-sidebar-bottom"><div className="sidebar-help-card"><HeartPulse size={20}/><h4>Care with clarity</h4><p>Review patient-submitted information and manage your care workflow.</p></div><button className="patient-logout-button" onClick={handleLogout}><LogOut size={19}/><span>Sign Out</span></button></div></aside></>;
}
