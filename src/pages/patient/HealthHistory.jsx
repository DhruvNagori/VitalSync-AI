import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileHeart,
  Filter,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  ClipboardList,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import {
  PageHeader,
  SectionHeading,
  Panel,
  EmptyState,
  DemoNotice
} from "../../components/patient/PageComponents";

import {
  getSymptomStorageKey,
  loadSymptomRecords
} from "../../utils/healthHistoryStorage";
import { useAuth } from "../../context/AuthContext";

function formatDate(value) {
  if (!value) return "Date not recorded";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "Time not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not recorded";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function severityLabel(value) {
  if (value <= 3) return "Mild";
  if (value <= 6) return "Moderate";
  if (value <= 8) return "Severe";
  return "Very severe";
}

function getMonthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Older records";
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}

export default function HealthHistory() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? currentUser?.email ?? null;

  const [records, setRecords] = useState([]);
  const [loadedForUser, setLoadedForUser] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const accountId = userId === null ? null : String(userId);

    function refreshRecords() {
      setRecords(loadSymptomRecords(userId));
      setLoadedForUser(accountId);
    }

    refreshRecords();

    function handleStorage(event) {
      if (event.key === getSymptomStorageKey(userId)) refreshRecords();
    }

    function handleSameTabUpdate(event) {
      if (String(event.detail?.userId) === accountId) refreshRecords();
    }

    window.addEventListener("focus", refreshRecords);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("vitalsync:symptoms-updated", handleSameTabUpdate);

    return () => {
      window.removeEventListener("focus", refreshRecords);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("vitalsync:symptoms-updated", handleSameTabUpdate);
    };
  }, [userId]);

  const accountRecords =
    userId && loadedForUser === String(userId) ? records : [];

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accountRecords
      .filter((record) => {
        const searchable = [
          ...(record.symptoms || []),
          record.notes || "",
          record.duration || ""
        ].join(" ").toLowerCase();

        const matchesSearch = !query || searchable.includes(query);
        const matchesType = typeFilter === "All" || typeFilter === "Symptoms";
        const matchesStatus = statusFilter === "All" || record.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.onsetDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.onsetDate || 0).getTime();
        return dateB - dateA;
      });
  }, [accountRecords, search, typeFilter, statusFilter]);

  const ongoingCount = accountRecords.filter((record) => record.status === "Ongoing").length;
  const resolvedCount = accountRecords.filter((record) => record.status === "Resolved").length;
  const averageSeverity = accountRecords.length
    ? (
        accountRecords.reduce((sum, record) => sum + Number(record.severity || 0), 0) /
        accountRecords.length
      ).toFixed(1)
    : "—";

  const groupedRecords = useMemo(() => {
    return filteredRecords.reduce((groups, record) => {
      const key = getMonthKey(record.createdAt || record.onsetDate);
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
      return groups;
    }, {});
  }, [filteredRecords]);

  return (
    <div className="patient-feature-page health-history-page">
      <PageHeader
        eyebrow="PERSONAL HEALTH RECORD"
        title="Health History"
        description="A chronological view of your recorded health events and symptom trends."
      />

      <DemoNotice />

      <section className="feature-section">
        <div className="health-history-overview">
          <article className="health-history-stat">
            <span className="health-history-stat-icon"><FileHeart size={19} /></span>
            <div>
              <small>Total symptom entries</small>
              <strong>{accountRecords.length}</strong>
            </div>
          </article>
          <article className="health-history-stat">
            <span className="health-history-stat-icon ongoing"><Clock3 size={19} /></span>
            <div>
              <small>Ongoing</small>
              <strong>{ongoingCount}</strong>
            </div>
          </article>
          <article className="health-history-stat">
            <span className="health-history-stat-icon resolved"><CheckCircle2 size={19} /></span>
            <div>
              <small>Resolved</small>
              <strong>{resolvedCount}</strong>
            </div>
          </article>
          <article className="health-history-stat">
            <span className="health-history-stat-icon average"><TrendingUp size={19} /></span>
            <div>
              <small>Average severity</small>
              <strong>{averageSeverity}{accountRecords.length ? "/10" : ""}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="feature-section">
        <SectionHeading
          title="Health timeline"
          description="Your saved symptom entries, arranged from newest to oldest."
        />

        <Panel>
          <div className="health-history-filters">
            <div className="health-history-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search symptoms or notes..."
                aria-label="Search health history"
              />
            </div>

            <label className="health-history-select">
              <Filter size={15} />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter by event type"
              >
                <option value="All">All event types</option>
                <option value="Symptoms">Symptoms</option>
              </select>
            </label>

            <label className="health-history-select">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Resolved">Resolved</option>
              </select>
            </label>
          </div>

          <div className="health-history-source-note">
            <Activity size={16} />
            <span>
              Showing {filteredRecords.length} of {accountRecords.length} symptom records saved for this account on this device.
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="health-history-empty">
              <div className="health-history-empty-icon"><ClipboardList size={27} /></div>
              <h3>{accountRecords.length ? "No matching health events" : "Your health timeline is ready"}</h3>
              <p>
                {accountRecords.length
                  ? "Try changing your search term or filters."
                  : "When you record symptoms in the Symptoms section, those entries will automatically appear here."}
              </p>
              {!accountRecords.length && (
                <a className="feature-secondary-button" href="/patient/symptoms">
                  Go to Symptoms
                </a>
              )}
            </div>
          ) : (
            <div className="health-history-timeline">
              {Object.entries(groupedRecords).map(([month, monthRecords]) => (
                <section className="health-history-month" key={month}>
                  <h3 className="health-history-month-title">{month}</h3>

                  {monthRecords.map((record) => {
                    const isExpanded = expandedId === record.id;

                    return (
                      <article className="health-history-event" key={record.id}>
                        <div className="health-history-event-rail">
                          <span className="health-history-event-dot"><Activity size={15} /></span>
                          <span className="health-history-event-line" />
                        </div>

                        <div className="health-history-event-card">
                          <button
                            type="button"
                            className="health-history-event-toggle"
                            onClick={() => setExpandedId(isExpanded ? null : record.id)}
                            aria-expanded={isExpanded}
                          >
                            <div className="health-history-event-main">
                              <div className="health-history-event-heading">
                                <span className="health-history-event-type">SYMPTOM ENTRY</span>
                                <span className={`health-history-status ${String(record.status || "Ongoing").toLowerCase()}`}>
                                  {record.status || "Ongoing"}
                                </span>
                                {record.archived && (
                                  <span className="health-history-status archived">
                                    Archived from Symptoms
                                  </span>
                                )}
                              </div>

                              <h4>{(record.symptoms || []).join(", ") || "Symptom record"}</h4>

                              <div className="health-history-event-meta">
                                <span><CalendarDays size={14} /> Started {formatDate(record.onsetDate)}</span>
                                <span><Clock3 size={14} /> {record.duration || "Duration not recorded"}</span>
                              </div>
                            </div>

                            <div className="health-history-event-right">
                              <div className="health-history-severity">
                                <strong>{record.severity || "—"}/10</strong>
                                <small>{severityLabel(Number(record.severity || 0))}</small>
                              </div>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="health-history-event-details">
                              <div>
                                <span>Recorded on</span>
                                <strong>{formatDateTime(record.createdAt)}</strong>
                              </div>
                              <div>
                                <span>Current status</span>
                                <strong>{record.status || "Ongoing"}</strong>
                              </div>
                              {record.archived && (
                                <div>
                                  <span>History record</span>
                                  <strong>Archived from Symptoms on {formatDateTime(record.archivedAt)}</strong>
                                </div>
                              )}
                              {record.notes && (
                                <div className="health-history-notes">
                                  <span>Additional notes</span>
                                  <p>{record.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="feature-section">
        <SectionHeading
          title="Other health records"
          description="Additional sources will be connected as their modules are completed."
        />

        <div className="health-history-coming-grid">
          <article className="health-history-coming-card">
            <span><Stethoscope size={20} /></span>
            <div>
              <h3>Appointments</h3>
              <p>Appointment history will appear here after appointment requests are connected to persistent storage and the backend.</p>
              <small>Integration planned</small>
            </div>
          </article>
          <article className="health-history-coming-card">
            <span><ClipboardList size={20} /></span>
            <div>
              <h3>Medical records</h3>
              <p>Uploaded prescriptions, reports and clinical documents will be added when the Medical Records module is connected.</p>
              <small>Integration planned</small>
            </div>
          </article>
        </div>
      </section>

      <div className="health-history-disclaimer">
        <ShieldCheck size={18} />
        <p>
          <strong>Data and privacy:</strong> Symptom entries are stored separately for each signed-in demo account in this browser's local storage on this device. They are not yet synchronized with the VitalSync AI backend or shared with a healthcare professional. This timeline is for personal record-keeping and is not a diagnostic tool.
        </p>
      </div>
    </div>
  );
}
