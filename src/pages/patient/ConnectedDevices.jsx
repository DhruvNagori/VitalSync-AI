import { useEffect, useState } from "react";
import { Activity, Bluetooth, Check, Droplets, HeartPulse, Moon, RefreshCw, Thermometer, Watch } from "lucide-react";
import { DemoNotice, MetricCard, PageHeader, Panel, SectionHeading } from "../../components/patient/PageComponents";
import { acknowledgeAlert, getWearableState, syncWearable, updateWearableDevice } from "../../services/healthService";

const labels = { normal: "Normal day", elevated_heart_rate: "Elevated heart rate", low_spo2: "Low blood oxygen", fever: "Fever pattern", poor_sleep: "Poor sleep", high_stress: "High stress / BP" };

export default function ConnectedDevices() {
  const [state, setState] = useState({ device: null, latest: null, readings: [], alerts: [], scenarios: [] });
  const [scenario, setScenario] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() { try { const data = await getWearableState(); setState(data); setScenario(data.device?.scenario || "normal"); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, []);
  async function connect(connected) { setBusy(true); setError(""); try { setState(await updateWearableDevice(connected, scenario)); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  async function sync() { setBusy(true); setError(""); try { setState(await syncWearable()); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  async function changeScenario(value) { setScenario(value); if (state.device?.status === "connected") { setBusy(true); try { setState(await updateWearableDevice(true, value)); } catch (err) { setError(err.message); } finally { setBusy(false); } } }
  async function acknowledge(id) { await acknowledgeAlert(id); setState((current) => ({ ...current, alerts: current.alerts.map((item) => item.id === id ? { ...item, acknowledged: true } : item) })); }
  const connected = state.device?.status === "connected"; const latest = state.latest;
  return <div className="patient-feature-page">
    <PageHeader eyebrow="SIMULATED WEARABLE" title="Smart Health Band" description="Generate repeatable mock readings, store them in PostgreSQL and demonstrate explainable anomaly alerts." />
    <DemoNotice />{error && <p className="care-error" role="alert">{error}</p>}
    <section className="feature-section"><SectionHeading title="Band connection" description="Choose a scenario before syncing. Every generated sample is marked simulated." /><Panel><div className="care-split"><div className="care-stack">
      <div className="care-item-head"><div className="care-actions"><Watch size={28}/><div><h3>VitalSync Demo Band</h3><p className="care-muted">{connected ? "Connected to this patient account" : "Not connected"}</p></div></div><span className={`care-badge ${connected ? "" : "warning"}`}><Bluetooth size={13}/>{connected ? "CONNECTED" : "DISCONNECTED"}</span></div>
      <label className="care-field">Simulation scenario<select value={scenario} onChange={(e) => changeScenario(e.target.value)}>{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="care-actions"><button className="feature-primary-button" disabled={busy} onClick={() => connect(!connected)}><Bluetooth size={16}/>{connected ? "Disconnect band" : "Connect demo band"}</button><button className="feature-secondary-button" disabled={busy || !connected} onClick={sync}><RefreshCw size={16}/>{busy ? "Working…" : "Sync mock data"}</button></div>
    </div><div className="care-item"><strong>Last database sync</strong><p>{state.device?.lastSyncAt ? new Date(state.device.lastSyncAt).toLocaleString("en-IN") : "No readings synced yet"}</p><small className="care-muted">Academic simulator, not Bluetooth hardware integration.</small></div></div></Panel></section>
    <section className="feature-section"><SectionHeading title="Latest synchronized reading" description="Stored server-side and available for consent-based doctor sharing." /><div className="feature-metric-grid"><MetricCard title="Heart rate" value={latest?.heartRate ?? "—"} unit="BPM" icon={HeartPulse} description="Simulated"/><MetricCard title="Blood oxygen" value={latest?.spo2 ?? "—"} unit="%" icon={Droplets} description="Simulated"/><MetricCard title="Temperature" value={latest?.bodyTemperature ?? "—"} unit="°C" icon={Thermometer} description="Simulated"/><MetricCard title="Sleep" value={latest?.sleepHours ?? "—"} unit="hours" icon={Moon} description="Simulated"/></div></section>
    <section className="feature-section"><SectionHeading title="Anomaly alerts" description="Transparent threshold rules—not a diagnosis or clinical decision system." /><Panel>{state.alerts.length === 0 ? <div className="feature-empty-state"><Activity size={28}/><h3>No anomalies generated</h3><p>Sync a scenario to demonstrate alerts.</p></div> : <div className="care-stack">{state.alerts.slice(0,12).map((alert) => <article key={alert.id} className={`care-item care-alert ${alert.severity}`}><div className="care-item-head"><div><h4>{alert.metric}</h4><p>{alert.message}</p><small>Observed {alert.observedValue}; rule {alert.threshold} · {new Date(alert.createdAt).toLocaleString("en-IN")}</small></div>{alert.acknowledged ? <span className="care-badge"><Check size={13}/>Acknowledged</span> : <button className="feature-secondary-button" onClick={() => acknowledge(alert.id)}>Acknowledge</button>}</div></article>)}</div>}</Panel></section>
  </div>;
}
