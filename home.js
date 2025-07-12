document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-button");
  const messageInput = document.getElementById("usertext");
  const messageCanvas = document.getElementById("message-canvas");
  const clearChatButton = document.getElementById("clear-chat");
  const themeToggle = document.getElementById("theme-toggle");
  const boldButton = document.getElementById("markdown-bold");
  const codeButton = document.getElementById("markdown-code");
  const typingIndicator = document.getElementById("typing-indicator");
  const charCounter = document.getElementById("char-counter");

  let isDarkMode = true;
  let recognition;
  const API_KEY = "AIzaSyDYV2slkUuzJ3ddfmKFXZYm6l9VWlV3OOI"; 

  init();

  function init() {
    const savedTheme = localStorage.getItem("instantAI-theme");
    if (savedTheme === "light") {
      toggleTheme();
    }

    loadChatHistory();

    setupEventListeners();

    hljs.highlightAll();
  }

  function setupEventListeners() {
    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    clearChatButton.addEventListener("click", clearChat);

    themeToggle.addEventListener("click", toggleTheme);

    boldButton.addEventListener("click", () => {
      wrapSelection("**", "**");
      messageInput.focus();
    });

    codeButton.addEventListener("click", () => {
      wrapSelection("```\n", "\n```");
      messageInput.focus();
    });

    messageInput.addEventListener("input", updateCharCounter);

    updateCharCounter();
  }

  function wrapSelection(prefix, suffix) {
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const selectedText = messageInput.value.substring(start, end);
    const beforeText = messageInput.value.substring(0, start);
    const afterText = messageInput.value.substring(end);

    messageInput.value = beforeText + prefix + selectedText + suffix + afterText;
    
    if (selectedText.length > 0) {
      messageInput.selectionStart = start + prefix.length;
      messageInput.selectionEnd = end + prefix.length;
    } else {
      messageInput.selectionStart = messageInput.selectionEnd = start + prefix.length;
    }
    
    updateCharCounter();
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
      displayMessage(message, "user");

      messageInput.value = "";
      updateCharCounter();

      showTypingIndicator();

      setTimeout(() => {
        getBotResponse(message);
      }, 500);
    }
  }

  function displayMessage(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message-${sender} mb-3`;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let processedMessage = message;
    
    processedMessage = processedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    processedMessage = processedMessage.replace(/```([\s\S]*?)```/g, function(match, code) {
      const randomId = 'code-' + Math.random().toString(36).substr(2, 9);
      return `<div class="code-block relative">
          <button class="code-copy-btn" onclick="copyCode(this)" data-code="${escapeHtml(code)}">
              <i class="far fa-copy"></i> Copy
          </button>
          <pre><code class="language-javascript">${escapeHtml(code)}</code></pre>
      </div>`;
    });

    if (sender === "user") {
      messageDiv.innerHTML = `
            <div class="flex items-start justify-end space-x-2">
                <div class="flex-1 min-w-0">
                    <div class="bg-blue-600 rounded-lg p-2 max-w-full">
                        <div class="prose prose-invert max-w-none">${processedMessage}</div>
                    </div>
                    <div class="text-xs text-gray-400 mt-1 mr-1 text-right">${timestamp}</div>
                </div>
                <div class="flex-shrink-0 bg-gray-600 rounded-full w-6 h-6 flex items-center justify-center">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
            </div>
        `;
    } else {
      messageDiv.innerHTML = `
            <div class="flex items-start space-x-2">
                <div class="flex-shrink-0 bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="bg-gray-700 rounded-lg p-2 max-w-full">
                        <div class="prose prose-invert max-w-none">${processedMessage}</div>
                    </div>
                    <div class="text-xs text-gray-400 mt-1 ml-1">${timestamp}</div>
                </div>
            </div>
        `;
    }

    messageCanvas.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
    
    saveChatHistory();
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getBotResponse(userMessage) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: userMessage,
            },
          ],
        },
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    console.log("Sending request to:", apiUrl);
    console.log("Request payload:", raw);

    fetch(apiUrl, requestOptions)
      .then((response) => {
        console.log("Raw response:", response);
        if (!response.ok) {
          return response.text().then((text) => {
            console.log("Error response:", text);
            throw new Error(`API Error: ${response.status} - ${text}`);
          });
        }
        return response.json();
      })
      .then((result) => {
        console.log("API Response:", result);
        hideTypingIndicator();

        if (result && result.candidates && result.candidates.length > 0) {
          const botReply = result.candidates[0].content.parts[0].text;
          displayMessage(botReply, "bot");
        } else {
          displayMessage(
            "Sorry, I couldn't understand that. Could you try rephrasing your question?",
            "bot"
          );
        }
      })
      .catch((error) => {
        console.error("Full Error:", error);
        hideTypingIndicator();
        displayMessage(
          `Error: ${error.message}. Please check the console for details.`,
          "bot"
        );
        
        // Fallback response
        setTimeout(() => {
          displayMessage(
            "Here's a fallback response while we fix the API connection...",
            "bot"
          );
        }, 1000);
      });
  }

  function showTypingIndicator() {
    typingIndicator.style.opacity = "1";
  }

  function hideTypingIndicator() {
    typingIndicator.style.opacity = "0";
  }

  function clearChat() {
    if (confirm("Are you sure you want to clear the chat history?")) {
      messageCanvas.innerHTML = `
                <div class="message-bot animate__animated animate__fadeInUp animate__faster mb-3">
                    <div class="flex items-start space-x-2">
                        <div class="flex-shrink-0 bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center">
                            <i class="fas fa-robot text-white text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="bg-gray-700 rounded-lg p-2 max-w-full">
                                <p class="text-white">Chat history cleared. How can I assist you now?</p>
                            </div>
                            <div class="text-xs text-gray-400 mt-1 ml-1">Just now</div>
                        </div>
                    </div>
                </div>
            `;

      localStorage.removeItem("instantAI-chatHistory");
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;

    if (isDarkMode) {
      document.body.classList.remove("bg-gray-100", "text-gray-900");
      document.body.classList.add("bg-gray-900", "text-gray-100");
      themeToggle.innerHTML = '<i class="fas fa-moon text-base"></i>';
      localStorage.setItem("instantAI-theme", "dark");
    } else {
      document.body.classList.remove("bg-gray-900", "text-gray-100");
      document.body.classList.add("bg-gray-100", "text-gray-900");
      themeToggle.innerHTML = '<i class="fas fa-sun text-base"></i>';
      localStorage.setItem("instantAI-theme", "light");
    }
  }

  function updateCharCounter() {
    const currentLength = messageInput.value.length;
    const maxLength = 1000;
    charCounter.textContent = `${currentLength}/${maxLength}`;

    if (currentLength > maxLength * 0.9) {
      charCounter.classList.add("text-red-400");
      charCounter.classList.remove("text-gray-400");
    } else {
      charCounter.classList.remove("text-red-400");
      charCounter.classList.add("text-gray-400");
    }
  }

  function saveChatHistory() {
    const chatHistory = messageCanvas.innerHTML;
    localStorage.setItem("instantAI-chatHistory", chatHistory);
  }

  function loadChatHistory() {
    const savedChat = localStorage.getItem("instantAI-chatHistory");
    if (savedChat) {
      messageCanvas.innerHTML = savedChat;
      messageCanvas.scrollTop = messageCanvas.scrollHeight;
      
      // Re-highlight any code blocks
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }

  // Prevent right-click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
});

// Global function for copying code
function copyCode(button) {
  const code = button.getAttribute('data-code');
  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  });
}
