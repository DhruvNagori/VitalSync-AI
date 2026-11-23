import { useEffect, useMemo, useState } from "react";
import { loadSymptomRecords, saveSymptomRecords } from "../../utils/healthHistoryStorage";
import { useAuth } from "../../context/AuthContext";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileHeart,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X
} from "lucide-react";

const symptomOptions = [
  "Headache",
  "Fever",
  "Cough",
  "Sore throat",
  "Fatigue",
  "Nausea",
  "Dizziness",
  "Stomach pain",
  "Back pain",
  "Joint pain",
  "Shortness of breath",
  "Other"
];

const severityText = (value) => {
  if (value <= 3) return "Mild";
  if (value <= 6) return "Moderate";
  if (value <= 8) return "Severe";
  return "Very severe";
};

const formatDate = (value) => {
  if (!value) return "Date not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

function Symptoms() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? currentUser?.email ?? null;

  const [records, setRecords] = useState([]);
  const [loadedForUser, setLoadedForUser] = useState(null);

  useEffect(() => {
    setRecords(loadSymptomRecords(userId));
    setLoadedForUser(userId === null ? null : String(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId || loadedForUser !== String(userId)) return;
    saveSymptomRecords(userId, records);
  }, [records, userId, loadedForUser]);

  const accountRecords =
    userId && loadedForUser === String(userId) ? records : [];
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState(4);
  const [onsetDate, setOnsetDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [duration, setDuration] = useState("Today");
  const [notes, setNotes] = useState("");
  const [otherSymptom, setOtherSymptom] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  // Archived entries are hidden from this active symptom list,
  // but remain in localStorage for the permanent Health History timeline.
  const activeRecords = accountRecords.filter((item) => !item.archived);

  const activeCount = activeRecords.filter((item) => item.status === "Ongoing").length;
  const resolvedCount = activeRecords.filter((item) => item.status === "Resolved").length;
  const averageSeverity = activeRecords.length
    ? (
        activeRecords.reduce((total, item) => total + item.severity, 0) /
        activeRecords.length
      ).toFixed(1)
    : "—";

  const filteredRecords = useMemo(() => {
    return activeRecords
      .filter((item) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          item.symptoms.join(" ").toLowerCase().includes(query) ||
          item.notes.toLowerCase().includes(query);
        const matchesStatus =
          statusFilter === "All" || item.status === statusFilter;
        const matchesSeverity =
          severityFilter === "All" ||
          (severityFilter === "Mild" && item.severity <= 3) ||
          (severityFilter === "Moderate" && item.severity >= 4 && item.severity <= 6) ||
          (severityFilter === "Severe" && item.severity >= 7);
        return matchesSearch && matchesStatus && matchesSeverity;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [activeRecords, search, statusFilter, severityFilter]);

  function toggleSymptom(symptom) {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  }

  function resetForm() {
    setSelectedSymptoms([]);
    setSeverity(4);
    setOnsetDate(new Date().toLocaleDateString("en-CA"));
    setDuration("Today");
    setNotes("");
    setOtherSymptom("");
    setFormError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const finalSymptoms = selectedSymptoms
      .filter((item) => item !== "Other")
      .concat(
        selectedSymptoms.includes("Other") && otherSymptom.trim()
          ? [otherSymptom.trim()]
          : []
      );

    if (finalSymptoms.length === 0) {
      setFormError("Select at least one symptom before saving.");
      return;
    }

    if (selectedSymptoms.includes("Other") && !otherSymptom.trim()) {
      setFormError("Please enter the other symptom you want to record.");
      return;
    }

    const newRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      symptoms: finalSymptoms,
      severity,
      onsetDate,
      duration,
      notes: notes.trim(),
      status: "Ongoing",
      createdAt: new Date().toISOString()
    };

    setRecords((current) => [newRecord, ...current]);
    resetForm();
    setShowForm(false);
  }

  function toggleStatus(id) {
    setRecords((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Ongoing" ? "Resolved" : "Ongoing"
            }
          : item
      )
    );
  }

  function deleteRecord(id) {
    // Soft-delete: hide the entry from Symptoms but retain it in Health History.
    setRecords((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              archived: true,
              archivedAt: new Date().toISOString()
            }
          : item
      )
    );
  }

  return (
    <div className="patient-feature-page symptoms-page">
      <div className="feature-page-header symptoms-page-header">
        <div>
          <span className="feature-eyebrow">HEALTH TRACKING</span>
          <h1>Symptoms</h1>
          <p>
            Record how you feel, monitor symptom severity, and review your
            symptom history over time.
          </p>
        </div>

        <button
          type="button"
          className="feature-primary-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={17} />
          Record symptoms
        </button>
      </div>

      <div className="symptoms-demo-notice">
        <ShieldCheck size={17} />
        <span>
          <strong>Demonstration mode:</strong> Records are stored separately for this demo account in this browser. They remain available after refresh and appear in Health History. They are not uploaded to a
          server or sent to a clinician.
        </span>
      </div>

      <section className="symptoms-metric-grid" aria-label="Symptom summary">
        <article className="symptoms-metric-card">
          <div className="symptoms-metric-icon"><Activity size={20} /></div>
          <span>Total records</span>
          <strong>{activeRecords.length}</strong>
          <small>Active entries in Symptoms</small>
        </article>
        <article className="symptoms-metric-card">
          <div className="symptoms-metric-icon ongoing"><Clock3 size={20} /></div>
          <span>Ongoing</span>
          <strong>{activeCount}</strong>
          <small>Marked as currently present</small>
        </article>
        <article className="symptoms-metric-card">
          <div className="symptoms-metric-icon resolved"><CheckCircle2 size={20} /></div>
          <span>Resolved</span>
          <strong>{resolvedCount}</strong>
          <small>Marked as no longer present</small>
        </article>
        <article className="symptoms-metric-card">
          <div className="symptoms-metric-icon average"><TrendingUp size={20} /></div>
          <span>Average severity</span>
          <strong>{averageSeverity}</strong>
          <small>{activeRecords.length ? "Out of 10 recorded" : "No ratings yet"}</small>
        </article>
      </section>

      {showForm && (
        <section className="symptoms-form-panel" aria-labelledby="symptoms-form-title">
          <div className="symptoms-form-heading">
            <div>
              <span className="feature-eyebrow">NEW HEALTH ENTRY</span>
              <h2 id="symptoms-form-title">Record your symptoms</h2>
              <p>Enter the details below to add an entry to your session history.</p>
            </div>
            <button
              type="button"
              className="symptoms-close-button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              aria-label="Close symptom form"
            >
              <X size={19} />
            </button>
          </div>

          <form className="symptoms-form" onSubmit={handleSubmit}>
            <div className="symptoms-field">
              <label>What are you experiencing? <span>*</span></label>
              <div className="symptoms-choice-grid">
                {symptomOptions.map((symptom) => (
                  <button
                    type="button"
                    key={symptom}
                    className={`symptoms-choice ${
                      selectedSymptoms.includes(symptom) ? "selected" : ""
                    }`}
                    onClick={() => toggleSymptom(symptom)}
                    aria-pressed={selectedSymptoms.includes(symptom)}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
              {selectedSymptoms.includes("Other") && (
                <input
                  className="symptoms-text-input"
                  value={otherSymptom}
                  onChange={(event) => setOtherSymptom(event.target.value)}
                  placeholder="Enter another symptom"
                  aria-label="Other symptom"
                />
              )}
            </div>

            <div className="symptoms-form-two-col">
              <div className="symptoms-field">
                <label htmlFor="symptom-onset">When did it start?</label>
                <input
                  id="symptom-onset"
                  className="symptoms-text-input"
                  type="date"
                  max={new Date().toLocaleDateString("en-CA")}
                  value={onsetDate}
                  onChange={(event) => setOnsetDate(event.target.value)}
                />
              </div>
              <div className="symptoms-field">
                <label htmlFor="symptom-duration">Duration</label>
                <select
                  id="symptom-duration"
                  className="symptoms-text-input"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                >
                  <option>Today</option>
                  <option>1–2 days</option>
                  <option>3–7 days</option>
                  <option>More than a week</option>
                  <option>Comes and goes</option>
                </select>
              </div>
            </div>

            <div className="symptoms-field">
              <div className="symptoms-severity-heading">
                <label htmlFor="symptom-severity">How severe does it feel?</label>
                <strong>{severity}/10 · {severityText(severity)}</strong>
              </div>
              <input
                id="symptom-severity"
                className="symptoms-range"
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(event) => setSeverity(Number(event.target.value))}
              />
              <div className="symptoms-range-labels">
                <span>1 · Mild</span>
                <span>10 · Very severe</span>
              </div>
            </div>

            <div className="symptoms-field">
              <label htmlFor="symptom-notes">Additional notes</label>
              <textarea
                id="symptom-notes"
                className="symptoms-text-input symptoms-notes-input"
                rows="4"
                maxLength="500"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add details such as when it occurs or what makes it better or worse..."
              />
              <small>{notes.length}/500 characters</small>
            </div>

            {formError && <p className="symptoms-form-error">{formError}</p>}

            <div className="symptoms-form-actions">
              <button
                type="button"
                className="feature-secondary-button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="feature-primary-button">
                <CheckCircle2 size={16} />
                Save symptom entry
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="symptoms-history-section">
        <div className="symptoms-history-heading">
          <div>
            <span className="feature-eyebrow">YOUR HEALTH LOG</span>
            <h2>Symptom history</h2>
            <p>Review and update the symptom entries saved in this browser.</p>
          </div>
          <div className="symptoms-history-count">
            <FileHeart size={17} />
            {filteredRecords.length} {filteredRecords.length === 1 ? "entry" : "entries"}
          </div>
        </div>

        <div className="symptoms-filter-bar">
          <div className="symptoms-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search symptoms or notes..."
              aria-label="Search symptom history"
            />
          </div>
          <div className="symptoms-filter-control">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option>All</option>
              <option>Ongoing</option>
              <option>Resolved</option>
            </select>
          </div>
          <div className="symptoms-filter-control">
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              aria-label="Filter by severity"
            >
              <option>All</option>
              <option>Mild</option>
              <option>Moderate</option>
              <option>Severe</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="symptoms-empty-state">
            <div className="symptoms-empty-icon"><FileHeart size={27} /></div>
            <h3>{accountRecords.length ? "No matching entries" : "No symptoms recorded yet"}</h3>
            <p>
              {accountRecords.length
                ? "Try changing your search or filters."
                : "Use Record symptoms to add your first entry. Your recorded symptoms will appear here."}
            </p>
            {!activeRecords.length && (
              <button
                type="button"
                className="feature-primary-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                Record your first symptom
              </button>
            )}
          </div>
        ) : (
          <div className="symptoms-record-list">
            {filteredRecords.map((record) => (
              <article className="symptoms-record-card" key={record.id}>
                <div className="symptoms-record-main">
                  <div className="symptoms-record-icon"><Activity size={20} /></div>
                  <div className="symptoms-record-content">
                    <div className="symptoms-record-title-row">
                      <h3>{record.symptoms.join(", ")}</h3>
                      <span className={`symptoms-status ${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </div>
                    <div className="symptoms-record-meta">
                      <span><CalendarDays size={14} /> Started {formatDate(record.onsetDate)}</span>
                      <span><Clock3 size={14} /> {record.duration}</span>
                    </div>
                    {record.notes && <p className="symptoms-record-notes">{record.notes}</p>}
                  </div>
                </div>

                <div className="symptoms-record-side">
                  <div className="symptoms-severity-value">
                    <strong>{record.severity}/10</strong>
                    <span>{severityText(record.severity)}</span>
                  </div>
                  <div className="symptoms-record-actions">
                    <button
                      type="button"
                      className="symptoms-resolve-button"
                      onClick={() => toggleStatus(record.id)}
                    >
                      {record.status === "Ongoing" ? "Mark resolved" : "Mark ongoing"}
                    </button>
                    <button
                      type="button"
                      className="symptoms-delete-button"
                      onClick={() => deleteRecord(record.id)}
                      title="Remove from Symptoms. This entry will remain in Health History."
                      aria-label={`Archive ${record.symptoms.join(", ")} entry. It will remain in Health History.`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="symptoms-disclaimer">
        <ShieldCheck size={18} />
        <p>
          <strong>Health information:</strong> This tool is for personal symptom
          tracking only. It does not diagnose conditions, assess emergencies, or
          replace advice from a qualified healthcare professional. If symptoms
          are severe, rapidly worsening, or you are concerned, seek appropriate
          medical care.
        </p>
      </div>
    </div>
  );
}

export default Symptoms;
