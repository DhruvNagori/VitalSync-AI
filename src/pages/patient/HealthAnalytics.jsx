
import { useMemo, useState } from "react";

import {
  HeartPulse,
  Droplets,
  Footprints,
  Moon,
  TrendingUp,
  Activity
} from "lucide-react";

import {
  PageHeader,
  SectionHeading,
  Panel,
  MetricCard,
  DemoNotice
} from "../../components/patient/PageComponents";


const analyticsData = {

  daily: {
    labels: ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
    heartRate: [68, 72, 80, 76, 82, 74],
    oxygen: [98, 97, 98, 97, 98, 99],
    steps: [350, 1200, 2800, 4200, 5600, 6450],
    sleep: 7.2
  },

  weekly: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    heartRate: [70, 72, 74, 71, 76, 78, 73],
    oxygen: [98, 97, 98, 96, 98, 99, 98],
    steps: [4200, 5800, 6500, 4900, 7200, 8100, 6400],
    sleep: 7.1
  },

  monthly: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    heartRate: [72, 74, 73, 76],
    oxygen: [98, 97, 98, 98],
    steps: [5200, 6100, 6800, 7200],
    sleep: 7.4
  }

};


function calculateAverage(values) {

  const total = values.reduce(
    (sum, value) => sum + value,
    0
  );

  return (total / values.length).toFixed(1);

}


function TrendChart({
  title,
  description,
  values,
  labels,
  unit,
  min,
  max
}) {

  const chartPoints = values.map((value, index) => {

    const x = 35 + (
      index * 530 / Math.max(values.length - 1, 1)
    );

    const y = 190 - (
      (value - min) / (max - min) * 155
    );

    return {
      x,
      y,
      value,
      label: labels[index]
    };

  });

  const pointsString = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (

    <Panel>

      <div className="analytics-chart-heading">

        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <span>{unit}</span>

      </div>

      <div className="analytics-svg-wrapper">

        <svg
          viewBox="0 0 600 235"
          preserveAspectRatio="none"
          className="analytics-line-chart"
        >

          {[45, 95, 145, 195].map((y) => (

            <line
              key={y}
              x1="30"
              y1={y}
              x2="580"
              y2={y}
              stroke="#e7edf1"
              strokeDasharray="4 5"
            />

          ))}

          <polyline
            points={pointsString}
            fill="none"
            stroke="#0d9488"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartPoints.map((point, index) => (

            <g key={index}>

              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#0d9488"
                stroke="white"
                strokeWidth="2"
              />

              <title>
                {point.label}: {point.value} {unit}
              </title>

            </g>

          ))}

        </svg>

        <div className="analytics-chart-labels">

          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}

        </div>

      </div>

    </Panel>

  );

}


function ActivityChart({ labels, values }) {

  const maximum = Math.max(...values, 1);

  return (

    <Panel>

      <div className="analytics-chart-heading">

        <div>
          <h3>Activity Overview</h3>
          <p>Daily steps comparison</p>
        </div>

        <span>Steps</span>

      </div>

      <div className="analytics-bar-chart">

        {values.map((value, index) => (

          <div
            className="analytics-bar-column"
            key={labels[index]}
          >

            <span>{value.toLocaleString("en-IN")}</span>

            <div className="analytics-bar-track">

              <div
                className="analytics-bar-fill"
                style={{
                  height: `${(value / maximum) * 100}%`
                }}
              />

            </div>

            <small>{labels[index]}</small>

          </div>

        ))}

      </div>

    </Panel>

  );

}


function HealthAnalytics() {

  const [period, setPeriod] = useState("weekly");

  const data = useMemo(
    () => analyticsData[period],
    [period]
  );

  const averageHeartRate = calculateAverage(data.heartRate);

  const averageOxygen = calculateAverage(data.oxygen);

  const averageSteps = Math.round(
    data.steps.reduce((sum, value) => sum + value, 0) /
    data.steps.length
  );

  return (

    <div className="patient-feature-page">

      <PageHeader
        eyebrow="HEALTH DATA INSIGHTS"
        title="Health Analytics"
        description="Explore your health measurements, activity patterns and changes over time."
      />

      <DemoNotice />


      {/* Time Filter */}

      <section className="feature-section">

        <div className="analytics-period-panel">

          <div>
            <h3>Analysis Period</h3>
            <p>Choose the time range for your health data.</p>
          </div>

          <div className="analytics-period-buttons">

            {["daily", "weekly", "monthly"].map((item) => (

              <button
                key={item}
                className={
                  period === item ? "analytics-period-active" : ""
                }
                onClick={() => setPeriod(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>

            ))}

          </div>

        </div>

      </section>


      {/* Metrics */}

      <section className="feature-section">

        <SectionHeading
          title="Health Performance"
          description={`Summary of your ${period} demonstration measurements.`}
        />

        <div className="feature-metric-grid">

          <MetricCard
            title="Average Heart Rate"
            value={averageHeartRate}
            unit="BPM"
            icon={HeartPulse}
            description="Illustrative average"
          />

          <MetricCard
            title="Average Blood Oxygen"
            value={averageOxygen}
            unit="%"
            icon={Droplets}
            description="Illustrative average"
          />

          <MetricCard
            title="Average Steps"
            value={averageSteps.toLocaleString("en-IN")}
            unit="steps"
            icon={Footprints}
            description={`Per ${period === "daily" ? "time point" : period === "weekly" ? "day" : "week"}`}
          />

          <MetricCard
            title="Average Sleep"
            value={data.sleep}
            unit="hours"
            icon={Moon}
            description="Illustrative measurement"
          />

        </div>

      </section>


      {/* Heart Rate */}

      <section className="feature-section">

        <SectionHeading
          title="Heart Rate Analysis"
          description="Explore the illustrative heart-rate trend."
        />

        <TrendChart
          title="Heart Rate"
          description="Heart-rate measurements over the selected period"
          values={data.heartRate}
          labels={data.labels}
          unit="BPM"
          min={55}
          max={100}
        />

      </section>


      {/* Blood Oxygen */}

      <section className="feature-section">

        <SectionHeading
          title="Blood Oxygen Analysis"
          description="Explore illustrative oxygen saturation measurements."
        />

        <TrendChart
          title="Blood Oxygen"
          description="SpO2 measurements over the selected period"
          values={data.oxygen}
          labels={data.labels}
          unit="SpO2 (%)"
          min={90}
          max={100}
        />

      </section>


      {/* Activity */}

      <section className="feature-section">

        <SectionHeading
          title="Activity Analysis"
          description="Compare your activity across the selected period."
        />

        <ActivityChart
          labels={data.labels}
          values={data.steps}
        />

      </section>


      {/* Additional information */}

      <section className="feature-section">

        <Panel>

          <div className="analytics-insight">

            <div>
              <TrendingUp size={23} />
            </div>

            <div>

              <h3>Understanding Your Health Trends</h3>

              <p>
                These visualizations help organize health measurements
                over time. Once the patient database and device
                integrations are connected, this page can display
                actual recorded measurements.
              </p>

            </div>

          </div>

        </Panel>

      </section>

    </div>

  );

}

export default HealthAnalytics;
