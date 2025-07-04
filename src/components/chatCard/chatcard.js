// src/components/chatCard/chatcard.js
export class ChatCard {
  constructor(message, isBot = false) {
    this.message = message;
    this.isBot = isBot;
  }

  createElement() {
    const card = document.createElement('div');
    card.className = `chat-card ${this.isBot ? 'bot' : 'user'}`;

    card.innerHTML = `
      <div class="chat-message">${this.message}</div>
    `;

    return card;
  }

  static initChatContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID ${containerId} not found`);
      return null;
    }
    container.className = 'chat-container';
    return container;
  }

  static createInputWrapper(onSendCallback) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-input-wrapper';

    const input = document.createElement('input');
    input.id = 'chatInput';
    input.type = 'text';
    input.placeholder = 'Ketik pesan...';

    const button = document.createElement('button');
    button.id = 'sendButton';
    button.textContent = 'Kirim';
    
    button.addEventListener('click', async () => {
      if (input.value.trim()) {
        await onSendCallback(input.value);
        input.value = '';
      }
    });

    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        await onSendCallback(input.value);
        input.value = '';
      }
    });

    wrapper.append(input, button);
    return wrapper;
  }

  static async getBotResponse(userMessage) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
          'X-Title': import.meta.env.VITE_SITE_NAME || 'Dijkstra Treasure Hunt',
        },
        body: JSON.stringify({
          model: 'qwen/qwen-7b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'Kamu adalah asisten yang ramah dan membantu dalam permainan Dijkstra Treasure Hunt. Berikan jawaban yang relevan, singkat, dan dalam bahasa Indonesia yang santai. Gunakan emoji untuk membuat respons lebih menarik. 😊',
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error fetching bot response:', error);
      return 'Maaf, ada masalah saat menghubungi server. Coba lagi ya! 😅';
    }
  }

  static displayInitialMessages(container, messages) {
    messages.forEach(msg => {
      const card = new ChatCard(msg.message, msg.isBot).createElement();
      container.appendChild(card);
    });
  }
}