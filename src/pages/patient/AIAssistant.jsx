
import { useState } from "react";

import {
  BrainCircuit,
  Send,
  UserRound,
  Sparkles
} from "lucide-react";

import {
  PageHeader,
  Panel,
  DemoNotice
} from "../../components/patient/PageComponents";

function AIAssistant() {

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([]);

  function handleSubmit(e) {

    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        text: question.trim(),
        sender: "user"
      }
    ]);

    setQuestion("");
  }

  return (
    <div className="patient-feature-page">

      <PageHeader
        eyebrow="INTELLIGENT HEALTHCARE"
        title="AI Health Assistant"
        description="A dedicated space for healthcare-related questions and personalized health information."
      />

      <DemoNotice />

      <section className="feature-section">

        <Panel>

          <div className="ai-chat-container">

            <div className="ai-chat-header">

              <div className="feature-shortcut-icon">
                <BrainCircuit size={26} />
              </div>

              <div>
                <h3>VitalSync AI Assistant</h3>
                <p>Medical knowledge assistant · Preview</p>
              </div>

              <span className="feature-status">
                RAG Integration Pending
              </span>

            </div>


            <div className="ai-chat-messages">

              {messages.length === 0 ? (

                <div className="ai-chat-welcome">

                  <Sparkles size={35} />

                  <h2>How can I help you today?</h2>

                  <p>
                    Ask a healthcare-related question.
                    The connected RAG system will eventually
                    use supported medical knowledge and your
                    authorized health information to respond.
                  </p>

                  <div className="ai-suggestions">

                    <button
                      onClick={() =>
                        setQuestion("Help me understand my health report.")
                      }
                    >
                      Understand a health report
                    </button>

                    <button
                      onClick={() =>
                        setQuestion("Explain common health measurements.")
                      }
                    >
                      Understand health measurements
                    </button>

                    <button
                      onClick={() =>
                        setQuestion("What information should I discuss with my doctor?")
                      }
                    >
                      Prepare for a doctor visit
                    </button>

                  </div>

                </div>

              ) : (

                messages.map((message) => (

                  <div
                    className={`ai-chat-message ${
                      message.sender === "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                    key={message.id}
                  >

                    <div className="ai-message-icon">

                      {message.sender === "user" ? (
                        <UserRound size={18} />
                      ) : (
                        <BrainCircuit size={18} />
                      )}

                    </div>

                    <div className="ai-message-content">
                      {message.text}
                    </div>

                  </div>

                ))

              )}

            </div>


            <form
              className="ai-chat-input"
              onSubmit={handleSubmit}
            >

              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your health-related question..."
                aria-label="Health-related question"
              />

              <button
                type="submit"
                disabled={!question.trim()}
                aria-label="Send message"
              >
                <Send size={19} />
              </button>

            </form>

            <p className="ai-chat-disclaimer">
              Preview only. Messages are not sent to an AI model.
              Do not enter real medical or personal information.
            </p>

          </div>

        </Panel>

      </section>

    </div>
  );
}

export default AIAssistant;
