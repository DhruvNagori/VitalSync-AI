
import { useState } from "react";
import { Outlet } from "react-router-dom";
import "../styles/patient-pages.css";
import PatientSidebar from "../components/patient/PatientSidebar";
import PatientTopbar from "../components/patient/PatientTopbar";

function PatientLayout() {

  const [mobileOpen, setMobileOpen] = useState(false);

  function closeSidebar() {
    setMobileOpen(false);
  }

  return (

    <div className="patient-layout">

      <PatientSidebar
        mobileOpen={mobileOpen}
        closeSidebar={closeSidebar}
      />

      <div className="patient-main">

        <PatientTopbar
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="patient-content">

          <Outlet />

        </main>

        <footer className="patient-footer">

          © 2026 VitalSync AI. All rights reserved.

          <span>
            For informational purposes only.
          </span>

        </footer>

      </div>

    </div>

  );
}

export default PatientLayout;
