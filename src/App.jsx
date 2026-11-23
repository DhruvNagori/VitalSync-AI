import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterChoicePage from "./pages/auth/RegisterChoicePage";
import RegisterPage from "./pages/auth/RegisterPage";

import PatientLayout from "./layouts/PatientLayout";
import PatientDashboard from "./pages/patient/PatientDashboard";
import MyHealth from "./pages/patient/MyHealth";
import HealthAnalytics from "./pages/patient/HealthAnalytics";
import Symptoms from "./pages/patient/Symptoms";
import HealthHistory from "./pages/patient/HealthHistory";
import MedicalRecords from "./pages/patient/MedicalRecords";
import AIAssistant from "./pages/patient/AIAssistant";
import Appointments from "./pages/patient/Appointments";
import ClinicalMessages from "./pages/patient/ClinicalMessages";
import PatientCareUpdates from "./pages/patient/PatientCareUpdates";
import FindHospitals from "./pages/patient/FindHospitals";
import ConnectedDevices from "./pages/patient/ConnectedDevices";
import PatientProfile from "./pages/patient/PatientProfile";

import DoctorLayout from "./layouts/DoctorLayout";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import Patients from "./pages/doctor/Patients";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import PatientCare from "./pages/doctor/PatientCare";
import DoctorMessages from "./pages/doctor/DoctorMessages";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import DoctorInsights from "./pages/doctor/DoctorInsights";

function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterChoicePage />} />
    <Route path="/register/:role" element={<RegisterPage />} />

    <Route path="/patient" element={<ProtectedRoute allowedRole="patient"><PatientLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/patient/dashboard" replace />} />
      <Route path="dashboard" element={<PatientDashboard />} />
      <Route path="health" element={<MyHealth />} />
      <Route path="analytics" element={<HealthAnalytics />} />
      <Route path="symptoms" element={<Symptoms />} />
      <Route path="history" element={<HealthHistory />} />
      <Route path="records" element={<MedicalRecords />} />
      <Route path="assistant" element={<AIAssistant />} />
      <Route path="appointments" element={<Appointments />} />
      <Route path="messages" element={<ClinicalMessages />} />
      <Route path="care-plan" element={<PatientCareUpdates />} />
      <Route path="hospitals" element={<FindHospitals />} />
      <Route path="devices" element={<ConnectedDevices />} />
      <Route path="profile" element={<PatientProfile />} />
    </Route>

    <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor"><DoctorLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/doctor/dashboard" replace />} />
      <Route path="dashboard" element={<DoctorDashboard />} />
      <Route path="patients" element={<Patients />} />
      <Route path="patients/:patientId" element={<PatientCare />} />
      <Route path="appointments" element={<DoctorAppointments />} />
      <Route path="messages" element={<DoctorMessages mode="doctor" />} />
      <Route path="insights" element={<DoctorInsights />} />
      <Route path="profile" element={<DoctorProfile />} />
    </Route>

    <Route path="*" element={<div className="not-found-page"><h1>404</h1><p>Page not found.</p></div>} />
  </Routes></BrowserRouter></AuthProvider>;
}
export default App;
