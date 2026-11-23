
import {
  Activity,
  HeartPulse,
  TrendingUp
} from "lucide-react";

export function PageHeader({
  eyebrow = "VITALSYNC AI",
  title,
  description,
  action
}) {
  return (
    <div className="feature-page-header">

      <div>

        <span className="feature-eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

      </div>

      {action && (
        <div className="feature-header-action">
          {action}
        </div>
      )}

    </div>
  );
}


export function SectionHeading({
  title,
  description,
  action
}) {
  return (
    <div className="feature-section-heading">

      <div>

        <h2>{title}</h2>

        {description && <p>{description}</p>}

      </div>

      {action}

    </div>
  );
}


export function Panel({
  title,
  description,
  children,
  action
}) {
  return (
    <section className="feature-panel">

      {(title || action) && (
        <div className="feature-panel-heading">

          <div>

            {title && <h3>{title}</h3>}

            {description && <p>{description}</p>}

          </div>

          {action}

        </div>
      )}

      {children}

    </section>
  );
}


export function MetricCard({
  title,
  value,
  unit,
  description,
  icon: Icon = Activity,
  status
}) {
  return (
    <div className="feature-metric-card">

      <div className="feature-metric-top">

        <div className="feature-metric-icon">
          <Icon size={21} />
        </div>

        {status && (
          <span className="feature-status">
            {status}
          </span>
        )}

      </div>

      <p>{title}</p>

      <div className="feature-metric-value">

        <strong>{value}</strong>

        <span>{unit}</span>

      </div>

      {description && (
        <small>{description}</small>
      )}

    </div>
  );
}


export function EmptyState({
  icon: Icon = HeartPulse,
  title,
  description,
  action
}) {
  return (
    <div className="feature-empty-state">

      <div className="feature-empty-icon">
        <Icon size={28} />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {action}

    </div>
  );
}


export function DemoNotice() {
  return (
    <div className="feature-demo-notice">
      <strong>Demonstration mode:</strong>
      {" "}
      This page uses illustrative data or local interactions.
      It is not connected to a real patient database or
      healthcare service yet.
    </div>
  );
}
