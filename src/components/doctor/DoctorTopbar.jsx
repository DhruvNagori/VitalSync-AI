import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, ChevronDown, UserRound, Mail, ShieldCheck, LogOut, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const titles = {
  "/doctor/dashboard": ["Doctor Overview", "Your clinical workspace at a glance"],
  "/doctor/patients": ["Patient Directory", "Review patient information available in this demo"],
  "/doctor/appointments": ["Appointment Requests", "Review incoming patient-submitted requests"],
  "/doctor/messages": ["Messages", "Communicate with appointment-linked patients"],
  "/doctor/insights": ["Patient Health Insights", "Review consented health information summaries"],
  "/doctor/profile": ["Profile & Availability", "Manage your professional details and weekly availability"],
};

export default function DoctorTopbar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const name = currentUser?.name || "Doctor";
  const email = currentUser?.email || "";
  const initials = name.split(" ").filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const [title, subtitle] = titles[location.pathname] || ["Doctor Workspace", "VitalSync AI clinical portal"];
  function signOut() { logout(); navigate("/login", { replace: true }); }

  return <header className="patient-topbar">
    <div className="topbar-left">
      <button className="mobile-menu-button" onClick={onMenuClick} aria-label="Open navigation"><Menu size={23} /></button>
      <div><h2>{title}</h2><p>{subtitle}</p></div>
    </div>
    <div className="topbar-right">
      <div className="topbar-dropdown-wrapper">
        <button className={`notification-button ${notificationsOpen ? "dropdown-active" : ""}`}
          onClick={() => { setNotificationsOpen(v => !v); setProfileOpen(false); }}
          aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={20} /></button>
        {notificationsOpen && <div className="topbar-dropdown notification-dropdown">
          <div className="dropdown-header"><h3>Notifications</h3><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={17} /></button></div>
          <div className="notification-empty"><Bell size={26} /><h4>No new notifications</h4><p>New demo request activity will appear in Appointment Requests.</p></div>
        </div>}
      </div>
      <div className="topbar-dropdown-wrapper">
        <button className="topbar-profile" onClick={() => { setProfileOpen(v => !v); setNotificationsOpen(false); }}
          aria-expanded={profileOpen} aria-label="Open doctor profile menu">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-details"><strong>{name}</strong><span>Doctor</span></div>
          <ChevronDown size={16} className={`profile-chevron ${profileOpen ? "profile-chevron-open" : ""}`} />
        </button>
        {profileOpen && <div className="topbar-dropdown profile-dropdown">
          <div className="profile-dropdown-heading"><div className="profile-avatar">{initials}</div><div><h3>{name}</h3><p>Doctor Account</p></div></div>
          <div className="profile-dropdown-info">
            <div><Mail size={17} /><span>{email || "Email not available"}</span></div>
            <div><ShieldCheck size={17} /><span>Account Type: Doctor</span></div>
          </div>
          <button className="profile-menu-button" onClick={() => { setProfileOpen(false); navigate("/doctor/dashboard"); }}><UserRound size={17} /> Doctor Overview</button>
          <button className="profile-logout-button" onClick={signOut}><LogOut size={17} /> Sign Out</button>
        </div>}
      </div>
    </div>
  </header>;
}
