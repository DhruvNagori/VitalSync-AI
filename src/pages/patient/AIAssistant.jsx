
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BrainCircuit,
  Send,
  UserRound,
  Sparkles,
  CalendarPlus
} from "lucide-react";

import {
  PageHeader,
  Panel
} from "../../components/patient/PageComponents";
import { getChatHistory, sendChatMessage } from "../../services/chatService";

function AIAssistant() {

  const navigate = useNavigate();

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let active = true;
    getChatHistory()
      .then((items) => {
        if (active) setMessages(items.map((item) => ({
          id: item.id,
          text: item.content,
          sender: item.role === "user" ? "user" : "assistant"
        })));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(e) {

    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    const submittedQuestion = question.trim();
    const priorMessages = messages;
    const userMessage = {
      id: crypto.randomUUID(),
      text: submittedQuestion,
      sender: "user"
    };

    setMessages([...priorMessages, userMessage]);
    setQuestion("");
    setError("");
    setIsLoading(true);

    try {
      const history = priorMessages.map((message) => ({
        role: message.sender === "user" ? "user" : "assistant",
        content: message.text
      }));
      const result = await sendChatMessage(submittedQuestion, history);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          text: result.reply,
          sender: "assistant",
          emergencyDetected: result.emergency_detected,
          sources: result.sources || []
        }
      ]);
    } catch (requestError) {
      setError(requestError.message || "The assistant could not answer right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="patient-feature-page">

      <PageHeader
        eyebrow="INTELLIGENT HEALTHCARE"
        title="AI Health Assistant"
        description="A dedicated space for healthcare-related questions and personalized health information."
      />

      <section className="feature-section">

        <Panel>

          <div className="ai-chat-container">

            <div className="ai-chat-header">

              <div className="feature-shortcut-icon">
                <BrainCircuit size={26} />
              </div>

              <div>
                <h3>VitalSync AI Assistant</h3>
                <p>Fine-tuned Qwen3-4B · Local inference</p>
              </div>

              <span className="feature-status">
                Local model
              </span>

            </div>


            <div className="ai-chat-messages">

              {messages.length === 0 ? (

                <div className="ai-chat-welcome">

                  <Sparkles size={35} />

                  <h2>How can I help you today?</h2>

                  <p>
                    Ask a healthcare-related question.
                    Ask for general educational health information.
                    Do not use this assistant for diagnosis,
                    treatment decisions, or emergencies.
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
                      {message.sources?.length > 0 && (
                        <div className="ai-message-sources">
                          <strong>Trusted sources</strong>
                          {message.sources.map((source) => (
                            <a
                              href={source.url}
                              key={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title}
                            </a>
                          ))}
                        </div>
                      )}
                      {message.sender === "assistant" && (
                        <button
                          type="button"
                          className="feature-secondary-button"
                          style={{ marginTop: 12 }}
                          onClick={() => navigate("/patient/appointments", {
                            state: {
                              reason: `I would like to discuss this health question: ${priorHealthQuestion(messages, message.id)}`,
                              chatSummary: message.text.slice(0, 3500)
                            }
                          })}
                        >
                          <CalendarPlus size={15} /> Discuss with a doctor
                        </button>
                      )}
                    </div>

                  </div>

                ))

              )}

              {isLoading && (
                <div className="ai-chat-message assistant-message">
                  <div className="ai-message-icon">
                    <BrainCircuit size={18} />
                  </div>
                  <div className="ai-message-content ai-message-loading">
                    Thinking…
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />

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
                disabled={!question.trim() || isLoading}
                aria-label="Send message"
              >
                <Send size={19} />
              </button>

            </form>

            {error && <p className="ai-chat-error" role="alert">{error}</p>}

            <p className="ai-chat-disclaimer">
              Academic demonstration only. Not a medical diagnosis or a
              substitute for professional care. Do not enter identifying data.
            </p>

          </div>

        </Panel>

      </section>

    </div>
  );
}

export default AIAssistant;

function priorHealthQuestion(messages, assistantId) {
  const index = messages.findIndex((item) => item.id === assistantId);
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (messages[cursor].sender === "user") return messages[cursor].text.slice(0, 500);
  }
  return "My recent AI health conversation";
}
