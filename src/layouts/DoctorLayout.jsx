import { useState } from "react";
import { Outlet } from "react-router-dom";
import DoctorSidebar from "../components/doctor/DoctorSidebar";
import DoctorTopbar from "../components/doctor/DoctorTopbar";

export default function DoctorLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="patient-layout doctor-layout">
      <DoctorSidebar mobileOpen={mobileOpen} closeSidebar={() => setMobileOpen(false)} />
      <div className="patient-main">
        <DoctorTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="patient-content doctor-content" id="top"><Outlet /></main>
        <footer className="patient-footer">
          © 2026 VitalSync AI. All rights reserved.
          <span>Clinical decisions remain the responsibility of qualified professionals.</span>
        </footer>
      </div>
    </div>
  );
}
