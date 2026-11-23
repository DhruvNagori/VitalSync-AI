
import { Link } from "react-router-dom";
import {
  HeartPulse,
  ShieldCheck,
  Activity,
  BrainCircuit
} from "lucide-react";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">

      <section className="auth-brand-panel">

        <Link to="/" className="auth-logo">
          <HeartPulse size={30} />
          <span>VitalSync AI</span>
        </Link>

        <div className="auth-brand-content">

          <span className="auth-eyebrow">
            INTELLIGENT HEALTHCARE MONITORING
          </span>

          <h1>
            Better Health
            <span> Starts with Understanding.</span>
          </h1>

          <p>
            Connect your health information with intelligent
            technology and a more informed healthcare experience.
          </p>

          <div className="auth-benefits">

            <div>
              <Activity size={19} />
              <span>Connected Health Monitoring</span>
            </div>

            <div>
              <BrainCircuit size={19} />
              <span>AI-Assisted Health Insights</span>
            </div>

            <div>
              <ShieldCheck size={19} />
              <span>Patient-Centred Healthcare</span>
            </div>

          </div>

        </div>

        <div className="auth-brand-footer">
          Monitor. Understand. Stay Connected.
        </div>

      </section>

      <section className="auth-form-panel">

        <div className="auth-form-container">

          <div className="auth-mobile-logo">
            <Link to="/" className="auth-logo">
              <HeartPulse size={27} />
              <span>VitalSync AI</span>
            </Link>
          </div>

          <div className="auth-heading">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          {children}

          <p className="auth-disclaimer">
            VitalSync AI provides health information and
            monitoring support, not a replacement for
            professional medical advice.
          </p>

        </div>

      </section>

    </div>
  );
}

export default AuthLayout;
