
import { NavLink, useNavigate } from "react-router-dom";

import {
  HeartPulse,
  LayoutDashboard,
  Activity,
  BrainCircuit,
  FileText,
  ChartNoAxesCombined,
  Watch,
  LogOut,
  ChevronLeft,
  ClipboardList,
  History,
  CalendarDays,
  MessageCircle,
  MapPin,
  UserRound
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const navigationGroups = [
  {
    title: "HEALTH OVERVIEW",
    items: [
      {
        name: "Overview",
        path: "/patient/dashboard",
        icon: LayoutDashboard
      },
      {
        name: "My Health",
        path: "/patient/health",
        icon: HeartPulse
      },
      {
        name: "Health Analytics",
        path: "/patient/analytics",
        icon: ChartNoAxesCombined
      }
    ]
  },
  {
    title: "HEALTH MANAGEMENT",
    items: [
      {
        name: "Symptoms",
        path: "/patient/symptoms",
        icon: ClipboardList
      },
      {
        name: "Health History",
        path: "/patient/history",
        icon: History
      },
      {
        name: "Medical Records",
        path: "/patient/records",
        icon: FileText
      },
      {
        name: "AI Assistant",
        path: "/patient/assistant",
        icon: BrainCircuit
      }
    ]
  },
  {
    title: "CONNECTIVITY",
    items: [
      {
        name: "Appointments",
        path: "/patient/appointments",
        icon: CalendarDays
      },
      {
        name: "Messages",
        path: "/patient/messages",
        icon: MessageCircle
      },
      {
        name: "Find Hospitals",
        path: "/patient/hospitals",
        icon: MapPin
      },
      {
        name: "Connected Devices",
        path: "/patient/devices",
        icon: Watch
      }
    ]
  }
];

function PatientSidebar({ mobileOpen, closeSidebar }) {

  const navigate = useNavigate();

  const { logout } = useAuth();

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true
    });
  }

  return (
    <>

      {mobileOpen && (
        <div
          className="patient-sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`patient-sidebar ${
          mobileOpen ? "patient-sidebar-open" : ""
        }`}
      >

        {/* Brand */}

        <div className="patient-sidebar-brand">

          <div className="patient-brand-icon">
            <HeartPulse size={25} />
          </div>

          <span>VitalSync AI</span>

          <button
            className="sidebar-close-button"
            onClick={closeSidebar}
            aria-label="Close navigation"
          >
            <ChevronLeft size={20} />
          </button>

        </div>


        {/* Navigation */}

        <nav className="patient-nav">

          {navigationGroups.map((group) => (

            <div
              className="patient-nav-group"
              key={group.title}
            >

              <div className="sidebar-section-label">
                {group.title}
              </div>

              {group.items.map((item) => {

                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `patient-nav-link ${
                        isActive ? "active" : ""
                      }`
                    }
                  >

                    <Icon size={19} />

                    <span>{item.name}</span>

                  </NavLink>
                );

              })}

            </div>

          ))}

        </nav>


        {/* Bottom Section */}

        <div className="patient-sidebar-bottom">

          <NavLink
            to="/patient/profile"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `patient-profile-nav ${
                isActive ? "active" : ""
              }`
            }
          >
            <UserRound size={19} />
            <span>My Profile</span>
          </NavLink>

          <div className="sidebar-help-card">

            <HeartPulse size={20} />

            <h4>Your Health Matters</h4>

            <p>
              Stay informed and connected with your health.
            </p>

          </div>

          <button
            className="patient-logout-button"
            onClick={handleLogout}
          >

            <LogOut size={19} />

            <span>Sign Out</span>

          </button>

        </div>

      </aside>

    </>
  );
}

export default PatientSidebar;
