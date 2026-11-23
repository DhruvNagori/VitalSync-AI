
import { useState } from "react";

import {
  MessageCircle,
  Send,
  UserRound
} from "lucide-react";

import {
  PageHeader,
  Panel,
  DemoNotice
} from "../../components/patient/PageComponents";

function Messages() {

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  function sendMessage(e) {

    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        text: message.trim()
      }
    ]);

    setMessage("");
  }

  return (
    <div className="patient-feature-page">

      <PageHeader
        eyebrow="PATIENT COMMUNICATION"
        title="Messages"
        description="A dedicated space for communication between patients and healthcare professionals."
      />

      <DemoNotice />

      <section className="feature-section">

        <Panel>

          <div className="message-interface">

            <div className="message-header">

              <div className="feature-shortcut-icon">
                <MessageCircle size={23} />
              </div>

              <div>

                <h3>Doctor Communication</h3>

                <p>
                  No doctor conversation connected
                </p>

              </div>

            </div>

            <div className="message-conversation">

              {messages.length === 0 ? (

                <div className="feature-empty-state">

                  <UserRound size={30} />

                  <h3>No conversations yet</h3>

                  <p>
                    Your doctor conversations will appear here
                    after the messaging service is connected.
                  </p>

                </div>

              ) : (

                messages.map((item) => (

                  <div
                    className="message-bubble"
                    key={item.id}
                  >
                    {item.text}
                  </div>

                ))

              )}

            </div>

            <form
              className="ai-chat-input"
              onSubmit={sendMessage}
            >

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
                aria-label="Message"
              />

              <button
                type="submit"
                disabled={!message.trim()}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>

            </form>

            <p className="ai-chat-disclaimer">
              Local preview only. Messages are not delivered to doctors.
              Do not enter real medical or personal information.
            </p>

          </div>

        </Panel>

      </section>

    </div>
  );
}

export default Messages;
