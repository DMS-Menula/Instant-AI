document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sendButton = document.getElementById("send-button");
  const messageInput = document.getElementById("usertext");
  const messageCanvas = document.getElementById("message-canvas");
  const clearChatButton = document.getElementById("clear-chat");
  const themeToggle = document.getElementById("theme-toggle");
  const voiceInputButton = document.getElementById("voice-input");
  const attachFileButton = document.getElementById("attach-file");
  const typingIndicator = document.getElementById("typing-indicator");
  const charCounter = document.getElementById("char-counter");

  // State variables
  let isDarkMode = true;
  let recognition;
<<<<<<< HEAD
=======
  const API_KEY = "AIzaSyDYV2slkUuzJ3ddfmKFXZYm6l9VWlV3OOI"; 
>>>>>>> d67090ff74493bb3a9950f3f6dbc2751f4742641

  // Initialize the app
  init();

  function init() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem("instantAI-theme");
    if (savedTheme === "light") {
      toggleTheme();
    }

    // Load chat history if available
    loadChatHistory();

    // Set up event listeners
    setupEventListeners();
  }

  function setupEventListeners() {
    // Send message on button click or Enter key
    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    // Clear chat history
    clearChatButton.addEventListener("click", clearChat);

    // Toggle theme
    themeToggle.addEventListener("click", toggleTheme);

    // Voice input
    voiceInputButton.addEventListener("click", toggleVoiceInput);

    // Character counter
    messageInput.addEventListener("input", updateCharCounter);

    // Initialize character counter
    updateCharCounter();
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
      // Display user message
      displayMessage(message, "user");

      // Clear input
      messageInput.value = "";
      updateCharCounter();

      // Show typing indicator
      showTypingIndicator();

      // Get bot response after a short delay
      setTimeout(() => {
        getBotResponse(message);
      }, 500);
    }
  }

  // Update the displayMessage function to be more responsive
  function displayMessage(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message-${sender} mb-3`;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (sender === "user") {
      messageDiv.innerHTML = `
            <div class="flex items-start justify-end space-x-2">
                <div class="flex-1 min-w-0">
                    <div class="bg-blue-600 rounded-lg p-2 max-w-full">
                        <p class="text-white text-sm sm:text-base break-words">${message}</p>
                    </div>
                    <div class="text-xs text-gray-400 mt-1 mr-1 text-right">${timestamp}</div>
                </div>
                <div class="flex-shrink-0 bg-gray-600 rounded-full w-7 h-7 flex items-center justify-center">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
            </div>
        `;
    } else {
      messageDiv.innerHTML = `
            <div class="flex items-start space-x-2">
                <div class="flex-shrink-0 bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="bg-gray-700 rounded-lg p-2 max-w-full">
                        <p class="text-white text-sm sm:text-base break-words">${message}</p>
                    </div>
                    <div class="text-xs text-gray-400 mt-1 ml-1">${timestamp}</div>
                </div>
            </div>
        `;
    }

    messageCanvas.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    saveChatHistory();
  }

  function getBotResponse(userMessage) {
    // Set headers for the API request
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    // Prepare the request payload with the user input text
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
    });

    // Set request options
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDYV2slkUuzJ3ddfmKFXZYm6l9VWlV3OOI";

    fetch(apiUrl, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch API");
        }
        return response.json();
      })
      .then((result) => {
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
        hideTypingIndicator();
        console.error("Error:", error);
        displayMessage(
          "I'm having trouble connecting right now. Please try again later.",
          "bot"
        );
      });
  }

  function showTypingIndicator() {
    typingIndicator.style.opacity = "1";
  }

  function hideTypingIndicator() {
    typingIndicator.style.opacity = "0";
  }

  function clearChat() {
    // Show confirmation dialog
    if (confirm("Are you sure you want to clear the chat history?")) {
      messageCanvas.innerHTML = `
                <div class="message-bot animate__animated animate__fadeInUp animate__faster mb-4">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0 bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center">
                            <i class="fas fa-robot text-white text-sm"></i>
                        </div>
                        <div>
                            <div class="bg-gray-700 rounded-lg p-3 max-w-3xl">
                                <p class="text-white">Chat history cleared. How can I assist you now?</p>
                            </div>
                            <div class="text-xs text-gray-400 mt-1 ml-1">Just now</div>
                        </div>
                    </div>
                </div>
            `;

      // Clear local storage
      localStorage.removeItem("instantAI-chatHistory");
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;

    if (isDarkMode) {
      document.body.classList.remove("bg-gray-100", "text-gray-900");
      document.body.classList.add("bg-gray-900", "text-gray-100");
      themeToggle.innerHTML = '<i class="fas fa-moon text-xl"></i>';
      localStorage.setItem("instantAI-theme", "dark");
    } else {
      document.body.classList.remove("bg-gray-900", "text-gray-100");
      document.body.classList.add("bg-gray-100", "text-gray-900");
      themeToggle.innerHTML = '<i class="fas fa-sun text-xl"></i>';
      localStorage.setItem("instantAI-theme", "light");
    }
  }

  function toggleVoiceInput() {
    if (!("webkitSpeechRecognition" in window)) {
      displayMessage(
        "Your browser doesn't support speech recognition. Try Chrome or Edge.",
        "bot"
      );
      return;
    }

    if (voiceInputButton.classList.contains("recording")) {
      // Stop recording
      recognition.stop();
      voiceInputButton.classList.remove("recording", "text-red-500");
      voiceInputButton.classList.add("text-gray-400");
      voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
    } else {
      // Start recording
      recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        voiceInputButton.classList.remove("text-gray-400");
        voiceInputButton.classList.add("recording", "text-red-500");
        voiceInputButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        updateCharCounter();
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        voiceInputButton.classList.remove("recording", "text-red-500");
        voiceInputButton.classList.add("text-gray-400");
        voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
      };

      recognition.onend = () => {
        voiceInputButton.classList.remove("recording", "text-red-500");
        voiceInputButton.classList.add("text-gray-400");
        voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
      };

      recognition.start();
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
      // Scroll to bottom
      messageCanvas.scrollTop = messageCanvas.scrollHeight;
    }
  }

  // Prevent right-click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
});
<<<<<<< HEAD
=======

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
>>>>>>> d67090ff74493bb3a9950f3f6dbc2751f4742641
