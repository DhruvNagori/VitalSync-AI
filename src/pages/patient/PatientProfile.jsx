
import { useAuth } from "../../context/AuthContext";

import {
  UserRound,
  Mail,
  ShieldCheck,
  HeartPulse
} from "lucide-react";

import {
  PageHeader,
  SectionHeading,
  Panel,
  DemoNotice
} from "../../components/patient/PageComponents";

function PatientProfile() {

  const { currentUser } = useAuth();

  const patientName = currentUser?.name || "Patient";

  const patientEmail = currentUser?.email || "Email unavailable";

  const initials = patientName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="patient-feature-page">

      <PageHeader
        eyebrow="ACCOUNT MANAGEMENT"
        title="My Profile"
        description="View your account information and patient profile."
      />

      <DemoNotice />

      <section className="feature-section">

        <SectionHeading
          title="Personal Information"
          description="Your currently available account details."
        />

        <Panel>

          <div className="patient-profile-card">

            <div className="patient-profile-avatar">
              {initials}
            </div>

            <div>

              <h2>{patientName}</h2>

              <p>Patient Account</p>

            </div>

          </div>

          <div className="profile-information-list">

            <div>
              <UserRound size={20} />

              <div>
                <span>Full Name</span>
                <strong>{patientName}</strong>
              </div>
            </div>

            <div>
              <Mail size={20} />

              <div>
                <span>Email Address</span>
                <strong>{patientEmail}</strong>
              </div>
            </div>

            <div>
              <ShieldCheck size={20} />

              <div>
                <span>Account Type</span>
                <strong>Patient</strong>
              </div>
            </div>

            <div>
              <HeartPulse size={20} />

              <div>
                <span>Platform</span>
                <strong>VitalSync AI</strong>
              </div>
            </div>

          </div>

        </Panel>

      </section>

      <section className="feature-section">

        <SectionHeading
          title="Health Profile"
          description="Additional health profile details will be available after backend integration."
        />

        <Panel>

          <p className="feature-muted-text">
            Date of birth, gender, emergency contact,
            medical history and other patient information
            will be managed through the secured patient
            profile API.
          </p>

        </Panel>

      </section>

    </div>
  );
}

export default PatientProfile;
