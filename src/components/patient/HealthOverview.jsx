
import {
  HeartPulse,
  Activity,
  Footprints,
  Moon
} from "lucide-react";

import HealthMetricCard from "../common/HealthMetricCard";

import { healthMetrics } from "../../data/patientDashboardData";

const icons = {
  heart: HeartPulse,
  oxygen: Activity,
  steps: Footprints,
  sleep: Moon
};

function HealthOverview() {
  return (
    <section className="patient-section">

      <div className="patient-section-heading">

        <div>
          <h2>Health Overview</h2>
          <p>
            A snapshot of your health information.
          </p>
        </div>

        <span className="sample-data-label">
          DEMO DATA
        </span>

      </div>

      <div className="health-metrics-grid">

        {healthMetrics.map((metric) => {

          const Icon = icons[metric.icon];

          return (
            <HealthMetricCard
              key={metric.id}
              icon={Icon}
              title={metric.title}
              value={metric.value}
              unit={metric.unit}
              description={metric.status}
            />
          );
        })}

      </div>

    </section>
  );
}

export default HealthOverview;
