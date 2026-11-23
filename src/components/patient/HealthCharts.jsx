
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import {
  heartRateData,
  oxygenData,
  activityData
} from "../../data/patientDashboardData";

function HealthCharts() {
  return (
    <section className="patient-section" id="analytics">

      <div className="patient-section-heading">

        <div>
          <h2>Health Analytics</h2>
          <p>
            Explore your sample health measurements and activity.
          </p>
        </div>

        <span className="sample-data-label">
          DEMO DATA
        </span>

      </div>

      <div className="health-charts-grid">

        {/* Heart Rate Chart */}

        <div className="health-chart-card">

          <div className="chart-heading">
            <div>
              <h3>Heart Rate</h3>
              <p>Illustrative readings throughout the day</p>
            </div>

            <span className="chart-unit">BPM</span>
          </div>

          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={heartRateData}>

                <defs>
                  <linearGradient
                    id="heartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#ef7777"
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="100%"
                      stopColor="#ef7777"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e9eef2"
                />

                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "#718096" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={["dataMin - 10", "dataMax + 10"]}
                  tick={{ fontSize: 11, fill: "#718096" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#e56b6b"
                  strokeWidth={2.5}
                  fill="url(#heartGradient)"
                  name="Heart Rate"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* Oxygen Chart */}

        <div className="health-chart-card">

          <div className="chart-heading">
            <div>
              <h3>Blood Oxygen</h3>
              <p>Illustrative oxygen readings</p>
            </div>

            <span className="chart-unit">SpO2 (%)</span>
          </div>

          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={oxygenData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e9eef2"
                />

                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "#718096" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={[90, 100]}
                  tick={{ fontSize: 11, fill: "#718096" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0d9488" }}
                  activeDot={{ r: 6 }}
                  name="SpO2"
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* Weekly Activity Chart */}

        <div className="health-chart-card activity-chart-card">

          <div className="chart-heading">
            <div>
              <h3>Weekly Activity</h3>
              <p>Daily step count demonstration</p>
            </div>

            <span className="chart-unit">Steps</span>
          </div>

          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">

              <BarChart data={activityData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e9eef2"
                />

                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#718096" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: "#718096" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />

                <Tooltip />

                <Bar
                  dataKey="steps"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                  name="Steps"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

    </section>
  );
}

export default HealthCharts;
