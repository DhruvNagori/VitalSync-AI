
import { useNavigate } from "react-router-dom";

import {
  HeartPulse,
  Droplets,
  Footprints,
  Moon,
  CalendarDays,
  FileText,
  BrainCircuit,
  MessageCircle,
  Watch,
  Hospital,
  ArrowRight,
  Activity,
  UserRound,
  ClipboardList,
  Clock
} from "lucide-react";

import {
  PageHeader,
  SectionHeading,
  Panel,
  MetricCard,
  DemoNotice
} from "../../components/patient/PageComponents";


function PatientDashboard() {

  const navigate = useNavigate();


  const quickLinks = [
    {
      title: "My Health",
      description: "View your personal health measurements.",
      icon: HeartPulse,
      path: "/patient/health"
    },
    {
      title: "Health Analytics",
      description: "Explore health trends and measurements.",
      icon: Activity,
      path: "/patient/analytics"
    },
    {
      title: "Symptoms",
      description: "Record and review your symptoms.",
      icon: ClipboardList,
      path: "/patient/symptoms"
    },
    {
      title: "Medical Records",
      description: "Manage your medical documents.",
      icon: FileText,
      path: "/patient/records"
    },
    {
      title: "Appointments",
      description: "Manage doctor consultations.",
      icon: CalendarDays,
      path: "/patient/appointments"
    },
    {
      title: "Messages",
      description: "Access patient communication.",
      icon: MessageCircle,
      path: "/patient/messages"
    },
    {
      title: "Find Hospitals",
      description: "Discover nearby healthcare facilities.",
      icon: Hospital,
      path: "/patient/hospitals"
    },
    {
      title: "My Profile",
      description: "View your patient account information.",
      icon: UserRound,
      path: "/patient/profile"
    }
  ];


  const recentActivities = [
    {
      id: 1,
      title: "Patient dashboard accessed",
      description: "Your health overview was opened.",
      time: "Today",
      icon: Activity
    },
    {
      id: 2,
      title: "Health analytics available",
      description: "View your demonstration health trends.",
      time: "Today",
      icon: HeartPulse
    },
    {
      id: 3,
      title: "Device connection",
      description: "No wearable device is connected.",
      time: "Today",
      icon: Watch
    }
  ];


  return (

    <div className="patient-feature-page">

      <PageHeader
        eyebrow="YOUR PERSONAL HEALTH SPACE"
        title="Welcome to Your Dashboard"
        description="Your healthcare overview. Monitor your health information, manage appointments and access your healthcare services."
      />

      <DemoNotice />


      {/* Health Summary */}

      <section className="feature-section">

        <SectionHeading
          title="Health Overview"
          description="A quick snapshot of your illustrative health information."
        />

        <div className="feature-metric-grid">

          <MetricCard
            title="Heart Rate"
            value="78"
            unit="BPM"
            description="Illustrative reading"
            icon={HeartPulse}
          />

          <MetricCard
            title="Blood Oxygen"
            value="98"
            unit="%"
            description="Illustrative reading"
            icon={Droplets}
          />

          <MetricCard
            title="Daily Steps"
            value="6,450"
            unit="steps"
            description="Demonstration activity"
            icon={Footprints}
          />

          <MetricCard
            title="Sleep Duration"
            value="7.2"
            unit="hours"
            description="Demonstration data"
            icon={Moon}
          />

        </div>

        <div className="dashboard-view-all">

          <button
            className="feature-text-button"
            onClick={() => navigate("/patient/health")}
          >
            View All Health Information
            <ArrowRight size={16} />
          </button>

        </div>

      </section>


      {/* Appointment Preview */}

      <section className="feature-section">

        <SectionHeading
          title="Appointments"
          description="Your doctor consultation management."
          action={
            <button
              className="feature-text-button"
              onClick={() => navigate("/patient/appointments")}
            >
              View All <ArrowRight size={15} />
            </button>
          }
        />

        <Panel>

          <div className="dashboard-appointment-preview">

            <div className="appointment-date-icon">
              <CalendarDays size={26} />
            </div>

            <div className="appointment-preview-info">

              <span>APPOINTMENT STATUS</span>

              <h3>No confirmed appointments</h3>

              <p>
                You have no confirmed appointments in this
                demonstration account. Explore the appointment
                page to submit a sample request.
              </p>

            </div>

            <button
              className="feature-primary-button"
              onClick={() => navigate("/patient/appointments")}
            >
              Book Appointment
              <ArrowRight size={16} />
            </button>

          </div>

        </Panel>

      </section>


      {/* Quick Access */}

      <section className="feature-section">

        <SectionHeading
          title="Healthcare Services"
          description="Quickly access your patient portal features."
        />

        <div className="feature-shortcut-grid">

          {quickLinks.map((item) => {

            const Icon = item.icon;

            return (

              <button
                className="feature-shortcut-card"
                key={item.path}
                onClick={() => navigate(item.path)}
              >

                <div className="feature-shortcut-icon">
                  <Icon size={22} />
                </div>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <span>
                  Open <ArrowRight size={15} />
                </span>

              </button>

            );

          })}

        </div>

      </section>


      {/* Connected Device */}

      <section className="feature-section">

        <SectionHeading
          title="Connected Health Devices"
          description="Manage your wearable device connections."
        />

        <Panel>

          <div className="dashboard-ai-preview">

            <div className="feature-shortcut-icon">
              <Watch size={25} />
            </div>

            <div>

              <h3>Connect Your Smartwatch</h3>

              <p>
                No wearable device is currently connected.
                Device synchronization will be available
                after wearable integration.
              </p>

            </div>

            <button
              className="feature-secondary-button"
              onClick={() => navigate("/patient/devices")}
            >
              Manage Devices
              <ArrowRight size={15} />
            </button>

          </div>

        </Panel>

      </section>


      {/* Recent Activity */}

      <section className="feature-section">

        <SectionHeading
          title="Recent Activity"
          description="Recent updates from your patient portal."
        />

        <Panel>

          <div className="feature-activity-list">

            {recentActivities.map((item) => {

              const Icon = item.icon;

              return (

                <div
                  className="feature-activity-item"
                  key={item.id}
                >

                  <div className="feature-activity-icon">
                    <Icon size={19} />
                  </div>

                  <div className="feature-activity-details">

                    <h4>{item.title}</h4>

                    <p>{item.description}</p>

                  </div>

                  <span>{item.time}</span>

                </div>

              );

            })}

          </div>

        </Panel>

      </section>


      {/* Medical Notice */}

      <div className="dashboard-medical-notice">

        <strong>Medical Information Notice</strong>

        <p>
          This dashboard currently uses illustrative demonstration
          data. It is not intended for diagnosis, treatment or
          emergency medical decisions.
        </p>

      </div>

    </div>

  );

}

export default PatientDashboard;
