
import {
  BrainCircuit,
  MessageCircle,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

function AIInsights() {
  return (
    <section className="patient-section" id="ai-assistant">

      <div className="patient-section-heading">
        <div>
          <h2>AI Health Intelligence</h2>
          <p>
            Your future AI-powered health information centre.
          </p>
        </div>
      </div>

      <div className="ai-insights-card">

        <div className="ai-insights-header">

          <div className="ai-insights-icon">
            <BrainCircuit size={27} />
          </div>

          <div>
            <h3>VitalSync AI Assistant</h3>
            <p>AI-powered healthcare information</p>
          </div>

          <span className="ai-demo-label">
            PREVIEW
          </span>

        </div>

        <div className="ai-insights-body">

          <div className="ai-insight-message">
            <ShieldCheck size={20} />

            <div>
              <strong>Personalized Health Understanding</strong>

              <p>
                Once connected, the AI assistant will use your
                available health information and medical knowledge
                to help answer your healthcare-related questions.
              </p>
            </div>
          </div>

          <div className="ai-insight-message">
            <MessageCircle size={20} />

            <div>
              <strong>Ask Health-Related Questions</strong>

              <p>
                Ask questions about your uploaded medical records,
                health trends and other supported health information.
              </p>
            </div>
          </div>

        </div>

        <button
          className="ai-assistant-button"
          type="button"
          onClick={() =>
            document.getElementById("ai-assistant")?.scrollIntoView({
              behavior: "smooth"
            })
          }
        >
          AI Assistant Coming Soon
          <ArrowRight size={17} />
        </button>

      </div>

    </section>
  );
}

export default AIInsights;
