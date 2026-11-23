import { apiRequest } from "./api";

export function sendChatMessage(message, history = []) {
  return apiRequest("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message, history })
  });
}

export function getChatHistory() {
  return apiRequest("/chat/history");
}
