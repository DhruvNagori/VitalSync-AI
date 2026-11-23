
import {
  Watch,
  HeartPulse,
  Droplets,
  Footprints,
  Moon,
  Bluetooth,
  RefreshCw
} from "lucide-react";

import {
  PageHeader,
  SectionHeading,
  Panel,
  DemoNotice
} from "../../components/patient/PageComponents";

function ConnectedDevices() {

  const measurements = [
    {
      name: "Heart Rate",
      description: "Heart rate measurements",
      icon: HeartPulse
    },
    {
      name: "Blood Oxygen",
      description: "SpO2 measurements",
      icon: Droplets
    },
    {
      name: "Daily Activity",
      description: "Steps and activity information",
      icon: Footprints
    },
    {
      name: "Sleep",
      description: "Sleep duration and patterns",
      icon: Moon
    }
  ];

  return (
    <div className="patient-feature-page">

      <PageHeader
        eyebrow="WEARABLE INTEGRATION"
        title="Connected Devices"
        description="Manage supported wearable devices and view synchronized health measurements."
      />

      <DemoNotice />

      <section className="feature-section">

        <SectionHeading
          title="Device Connection"
          description="Connect your wearable device when integration becomes available."
        />

        <Panel>

          <div className="wearable-connection">

            <div className="wearable-large-icon">
              <Watch size={39} />
            </div>

            <div className="wearable-connection-info">

              <span className="device-disconnected">
                NOT CONNECTED
              </span>

              <h3>Connect Your Smartwatch</h3>

              <p>
                Import supported health measurements from
                your wearable device into your VitalSync AI
                patient dashboard.
              </p>

              <div className="wearable-feature-list">

                {measurements.map((item) => {

                  const Icon = item.icon;

                  return (
                    <div key={item.name}>
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </div>
                  );

                })}

              </div>

              <button
                className="feature-secondary-button"
                type="button"
                disabled
              >
                <Bluetooth size={17} />
                Device Integration Coming Soon
              </button>

            </div>

          </div>

        </Panel>

      </section>

      <section className="feature-section">

        <SectionHeading
          title="Synchronization"
          description="Future device synchronization information."
        />

        <Panel>

          <div className="device-sync-information">

            <div>
              <RefreshCw size={21} />
              <strong>Last synchronization</strong>
              <span>Not synchronized</span>
            </div>

            <div>
              <Watch size={21} />
              <strong>Connected device</strong>
              <span>No device connected</span>
            </div>

          </div>

        </Panel>

      </section>

    </div>
  );
}

export default ConnectedDevices;
