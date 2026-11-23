
import {
  HeartPulse,
  Droplets,
  Thermometer,
  Activity,
  Wind,
  Scale
} from "lucide-react";

import {
  PageHeader,
  SectionHeading,
  MetricCard,
  Panel,
  DemoNotice
} from "../../components/patient/PageComponents";

function MyHealth() {

  const vitals = [
    {
      title: "Heart Rate",
      value: "78",
      unit: "BPM",
      description: "Illustrative reading",
      icon: HeartPulse
    },
    {
      title: "Blood Oxygen",
      value: "98",
      unit: "%",
      description: "Illustrative reading",
      icon: Droplets
    },
    {
      title: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      description: "Illustrative reading",
      icon: Activity
    },
    {
      title: "Body Temperature",
      value: "36.8",
      unit: "°C",
      description: "Illustrative reading",
      icon: Thermometer
    },
    {
      title: "Respiratory Rate",
      value: "16",
      unit: "breaths/min",
      description: "Illustrative reading",
      icon: Wind
    },
    {
      title: "Body Weight",
      value: "--",
      unit: "kg",
      description: "No measurement recorded",
      icon: Scale
    }
  ];

  return (
    <div className="patient-feature-page">

      <PageHeader
        eyebrow="PERSONAL HEALTH"
        title="My Health"
        description="View your personal health measurements and keep track of your health information."
      />

      <DemoNotice />

      <section className="feature-section">

        <SectionHeading
          title="Health Measurements"
          description="Your available health indicators."
        />

        <div className="feature-metric-grid">

          {vitals.map((item) => (
            <MetricCard
              key={item.title}
              {...item}
            />
          ))}

        </div>

      </section>

      <section className="feature-section">

        <SectionHeading
          title="Health Information"
          description="Additional information associated with your health profile."
        />

        <Panel>

          <div className="health-information-grid">

            <div>
              <span>Last measurement</span>
              <strong>Demonstration data</strong>
            </div>

            <div>
              <span>Data source</span>
              <strong>Sample values</strong>
            </div>

            <div>
              <span>Connected device</span>
              <strong>Not connected</strong>
            </div>

            <div>
              <span>Measurement history</span>
              <strong>Available in Health History</strong>
            </div>

          </div>

        </Panel>

      </section>

      <div className="feature-demo-notice">
        Health values displayed here are illustrative.
        They are not verified measurements or medical advice.
      </div>

    </div>
  );
}

export default MyHealth;
