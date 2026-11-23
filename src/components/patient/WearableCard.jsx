
import {
  Watch,
  Bluetooth,
  HeartPulse,
  Activity,
  Footprints,
  ArrowRight
} from "lucide-react";

function WearableCard() {
  return (
    <section className="patient-section" id="devices">

      <div className="patient-section-heading">

        <div>
          <h2>Connected Health Devices</h2>
          <p>
            Manage your wearable health data.
          </p>
        </div>

        <span className="device-status">
          NOT CONNECTED
        </span>

      </div>

      <div className="wearable-card">

        <div className="wearable-main">

          <div className="wearable-icon">
            <Watch size={37} />
          </div>

          <div className="wearable-content">

            <h3>Connect Your Smartwatch</h3>

            <p>
              Connect a supported wearable device in a future
              integration to view your health measurements
              directly on your VitalSync AI dashboard.
            </p>

            <div className="wearable-supported-data">

              <span>
                <HeartPulse size={15} />
                Heart Rate
              </span>

              <span>
                <Activity size={15} />
                Blood Oxygen
              </span>

              <span>
                <Footprints size={15} />
                Activity
              </span>

            </div>

            <button
              type="button"
              className="connect-device-button"
              disabled
            >
              <Bluetooth size={17} />
              Device Integration Coming Soon
              <ArrowRight size={16} />
            </button>

          </div>

        </div>

        <div className="wearable-note">
          <span className="wearable-note-dot"></span>

          No wearable device is currently connected.
          Supported device integrations will be added later.
        </div>

      </div>

    </section>
  );
}

export default WearableCard;
