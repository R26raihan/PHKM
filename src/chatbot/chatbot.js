// src/chatbot.js
import { createChatCard } from "./components/chatCard.js";

const chatContainer = document.getElementById("chatContainer");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

sendButton.addEventListener("click", () => {
  const message = chatInput.value.trim();
  if (message) {
    sendMessageToBot(message);
    chatInput.value = "";
  }
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendButton.click();
  }
});

async function sendMessageToBot(message) {
  const userCard = createChatCard(message, false);
  chatContainer.appendChild(userCard);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "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", 
        "HTTP-Referer": "https://algo-play.com", // opsional
        "X-Title": "AlgoPlay Anak" // opsional
      },
      body: JSON.stringify({
        model: "qwen/qwen3-30b-a3b:free",
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();
    const botMessage = data.choices?.[0]?.message?.content || "Bot tidak membalas.";
    const botCard = createChatCard(botMessage, true);
    chatContainer.appendChild(botCard);
  } catch (error) {
    console.error(error);
    const errorCard = createChatCard("Gagal menghubungi chatbot 😢", true);
    chatContainer.appendChild(errorCard);
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}
