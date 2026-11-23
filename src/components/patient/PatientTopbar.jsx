
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Menu,
  Bell,
  ChevronDown,
  UserRound,
  Mail,
  ShieldCheck,
  LogOut,
  X
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function PatientTopbar({ onMenuClick }) {
  const navigate = useNavigate();

  const { currentUser, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const patientName = currentUser?.name || "Patient";
  const patientEmail = currentUser?.email || "";

  const initials = patientName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function toggleProfile() {
    setProfileOpen(!profileOpen);
    setNotificationsOpen(false);
  }

  function toggleNotifications() {
    setNotificationsOpen(!notificationsOpen);
    setProfileOpen(false);
  }

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true
    });
  }

  return (
    <header className="patient-topbar">

      <div className="topbar-left">

        <button
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={23} />
        </button>

        <div>
          <h2>Patient Overview</h2>
          <p>Welcome to your health dashboard</p>
        </div>

      </div>

      <div className="topbar-right">

        {/* Notifications */}

        <div className="topbar-dropdown-wrapper">

          <button
            className={`notification-button ${
              notificationsOpen ? "dropdown-active" : ""
            }`}
            onClick={toggleNotifications}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={20} />

            <span className="notification-dot"></span>
          </button>

          {notificationsOpen && (
            <div className="topbar-dropdown notification-dropdown">

              <div className="dropdown-header">

                <h3>Notifications</h3>

                <button
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close notifications"
                >
                  <X size={17} />
                </button>

              </div>

              <div className="notification-empty">

                <Bell size={26} />

                <h4>No new notifications</h4>

                <p>
                  Your health updates and notifications
                  will appear here.
                </p>

              </div>

            </div>
          )}

        </div>

        {/* Patient Profile */}

        <div className="topbar-dropdown-wrapper">

          <button
            className="topbar-profile"
            onClick={toggleProfile}
            aria-expanded={profileOpen}
            aria-label="Open patient profile"
          >

            <div className="profile-avatar">
              {initials}
            </div>

            <div className="profile-details">
              <strong>{patientName}</strong>
              <span>Patient</span>
            </div>

            <ChevronDown
              size={16}
              className={`profile-chevron ${
                profileOpen ? "profile-chevron-open" : ""
              }`}
            />

          </button>

          {profileOpen && (
            <div className="topbar-dropdown profile-dropdown">

              <div className="profile-dropdown-heading">

                <div className="profile-avatar">
                  {initials}
                </div>

                <div>
                  <h3>{patientName}</h3>
                  <p>Patient Account</p>
                </div>

              </div>

              <div className="profile-dropdown-info">

                <div>
                  <Mail size={17} />
                  <span>{patientEmail}</span>
                </div>

                <div>
                  <ShieldCheck size={17} />
                  <span>Account Type: Patient</span>
                </div>

              </div>

              <button
                className="profile-menu-button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/patient/profile");
                }}
              >
                <UserRound size={17} />
                My Profile
              </button>

              <button
                className="profile-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Sign Out
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default PatientTopbar;
