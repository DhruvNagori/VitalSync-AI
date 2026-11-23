
import { Link } from "react-router-dom";

import {
  HeartPulse,
  Activity,
  BrainCircuit,
  Stethoscope,
  ShieldCheck,
  Watch,
  ArrowRight,
  CheckCircle2,
  Footprints,
  Moon
} from "lucide-react";

function LandingPage() {
  const features = [
    {
      icon: Activity,
      title: "Smart Health Monitoring",
      description:
        "Monitor health measurements, track daily activity and understand your health trends."
    },
    {
      icon: BrainCircuit,
      title: "AI Health Assistant",
      description:
        "Get context-aware health information powered by intelligent AI and medical knowledge."
    },
    {
      icon: Stethoscope,
      title: "Doctor Connectivity",
      description:
        "Stay connected with healthcare professionals and access your health reports."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Collect Health Data",
      description:
        "Bring together health information, medical history and supported wearable measurements."
    },
    {
      number: "02",
      title: "AI-Powered Analysis",
      description:
        "Use machine learning and medical knowledge retrieval to analyse relevant health information."
    },
    {
      number: "03",
      title: "Understand Your Health",
      description:
        "View health trends, meaningful insights and reports that support informed decisions."
    }
  ];

  return (
    <div className="landing-container">

      {/* Navigation */}

      <nav className="navbar">

        <Link to="/" className="logo">
          <HeartPulse size={27} />
          <span>VitalSync AI</span>
        </Link>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>

          <Link to="/login" className="nav-button">
            Login
          </Link>
        </div>

      </nav>

      {/* Hero Section */}

      <main className="hero">

        <div className="hero-content">

          <div className="hero-tag">
            <span className="tag-dot"></span>
            INTELLIGENT HEALTHCARE MONITORING
          </div>

          <h1>
            Your Health,
            <span> Connected with AI.</span>
          </h1>

          <p className="hero-description">
            Monitor your health, understand your medical
            information and stay connected with intelligent
            healthcare technology.
          </p>

          <div className="hero-buttons">

            <Link to="/login" className="primary-button">
              Get Started
              <ArrowRight size={17} />
            </Link>

            <a href="#features" className="secondary-button">
              Explore Features
            </a>

          </div>

          <div className="hero-trust">

            <div>
              <CheckCircle2 size={17} />
              Intelligent Monitoring
            </div>

            <div>
              <CheckCircle2 size={17} />
              Connected Healthcare
            </div>

          </div>

        </div>

        {/* Dashboard Preview */}

        <div className="hero-visual">

          <div className="dashboard-preview">

            <div className="preview-header">

              <div>
                <span className="preview-label">
                  HEALTH OVERVIEW
                </span>

                <h3>Your Health Today</h3>
              </div>

              <div className="preview-icon">
                <HeartPulse size={23} />
              </div>

            </div>

            <div className="preview-status">
              <span className="status-dot"></span>
              Sample dashboard preview
            </div>

            <div className="preview-metrics">

              <div className="preview-metric">

                <div className="metric-heading">
                  <HeartPulse size={19} />
                  <span>Heart Rate</span>
                </div>

                <h2>78 <small>BPM</small></h2>

                <span className="metric-note">
                  Illustrative value
                </span>

              </div>

              <div className="preview-metric">

                <div className="metric-heading">
                  <Activity size={19} />
                  <span>Blood Oxygen</span>
                </div>

                <h2>98<small>%</small></h2>

                <span className="metric-note">
                  Illustrative value
                </span>

              </div>

            </div>

            <div className="preview-activity">

              <div className="activity-heading">
                <div>
                  <Footprints size={19} />
                  <span>Daily Activity</span>
                </div>

                <span className="activity-value">
                  6,450
                </span>
              </div>

              <div className="activity-progress">
                <div></div>
              </div>

              <div className="activity-footer">
                <span>Illustrative step count</span>
                <span>Demo data</span>
              </div>

            </div>

            <div className="preview-sleep">

              <div className="sleep-icon">
                <Moon size={19} />
              </div>

              <div>
                <span>Sleep Overview</span>
                <p>7h 20m <small>Demo data</small></p>
              </div>

              <span className="sleep-arrow">
                <ArrowRight size={18} />
              </span>

            </div>

          </div>

          <div className="floating-badge">
            <ShieldCheck size={20} />
            <span>
              <strong>AI-Powered</strong>
              <small>Health Intelligence</small>
            </span>
          </div>

        </div>

      </main>

      {/* Features Section */}

      <section className="features" id="features">

        <div className="section-heading">

          <span className="section-tag">
            OUR CAPABILITIES
          </span>

          <h2>Healthcare Made Smarter</h2>

          <p>
            Everything you need to understand and monitor
            your health in one connected platform.
          </p>

        </div>

        <div className="feature-list">

          {features.map((feature, index) => {

            const Icon = feature.icon;

            return (
              <div className="feature-card" key={index}>

                <div className="feature-icon">
                  <Icon size={27} />
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>

                <a href="#how-it-works" className="feature-link">
                  Learn More
                  <ArrowRight size={16} />
                </a>

              </div>
            );
          })}

        </div>

      </section>

      {/* How It Works Section */}

      <section className="how-it-works" id="how-it-works">

        <div className="section-heading">

          <span className="section-tag">
            SIMPLE AND INTELLIGENT
          </span>

          <h2>How VitalSync AI Works</h2>

          <p>
            A connected approach to understanding your health
            through data and artificial intelligence.
          </p>

        </div>

        <div className="steps-container">

          {steps.map((step, index) => (

            <div className="step-card" key={index}>

              <span className="step-number">
                {step.number}
              </span>

              <h3>{step.title}</h3>

              <p>{step.description}</p>

            </div>

          ))}

        </div>

      </section>

      {/* About Section */}

      <section className="about-section" id="about">

        <div className="about-content">

          <span className="section-tag">
            ABOUT VITALSYNC AI
          </span>

          <h2>
            Bringing Healthcare
            <span> and Technology Together.</span>
          </h2>

          <p>
            VitalSync AI is designed to connect personal
            health information, intelligent analysis and
            healthcare professionals through one platform.
          </p>

          <div className="about-points">

            <div>
              <CheckCircle2 size={19} />
              Connected health information
            </div>

            <div>
              <CheckCircle2 size={19} />
              AI-assisted health insights
            </div>

            <div>
              <CheckCircle2 size={19} />
              Patient and doctor collaboration
            </div>

          </div>

        </div>

        <div className="about-visual">
          <div className="about-icon">
            <HeartPulse size={65} />
          </div>

          <h3>Technology for Better Health Understanding</h3>

          <p>
            Monitor. Understand. Stay Connected.
          </p>

        </div>

      </section>

      {/* Footer */}

      <footer className="footer">

        <div className="footer-main">

          <div className="footer-brand">
            <Link to="/" className="logo">
              <HeartPulse size={25} />
              <span>VitalSync AI</span>
            </Link>

            <p>
              Intelligent healthcare monitoring powered
              by data and AI.
            </p>
          </div>

          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Login</Link>
          </div>

        </div>

        <div className="footer-bottom">

          <p>
            © 2026 VitalSync AI. All rights reserved.
          </p>

          <p>
            For informational purposes only. Not a
            substitute for professional medical advice.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default LandingPage;
