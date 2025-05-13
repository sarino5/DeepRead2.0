// DOM Elements
const settingsButton = document.getElementById("settingsButton")
const settingsPanel = document.getElementById("settingsPanel")
const selectedTextElement = document.getElementById("selectedText")
const userQueryElement = document.getElementById("userQuery")
const submitQueryButton = document.getElementById("submitQuery")
const llamaResponseElement = document.getElementById("llamaResponse")
const statusMessageElement = document.getElementById("statusMessage")
const connectionDotElement = document.getElementById("connectionDot")
const connectionStatusElement = document.getElementById("connectionStatus")
const llamaPathInput = document.getElementById("llamaPath")
const contextLengthInput = document.getElementById("contextLength")
const temperatureInput = document.getElementById("temperature")
const temperatureValueElement = document.getElementById("temperatureValue")
const saveSettingsButton = document.getElementById("saveSettings")

// State
let selectedText = ""
let isConnected = false
let llamaSettings = {
  llamaPath: "",
  contextLength: 2048,
  temperature: 0.7,
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadSettings()
  checkLlamaConnection()

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "setSelectedText" && message.text) {
      setSelectedText(message.text)
    } else if (message.action === "textSelected" && message.text) {
      setSelectedText(message.text)
    }
  })

  // Request selected text when side panel opens
  chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
    if (response && response.selectedText) {
      setSelectedText(response.selectedText)
    }
  })
})

// Event Listeners
settingsButton.addEventListener("click", () => {
  settingsPanel.classList.toggle("active")
})

saveSettingsButton.addEventListener("click", () => {
  saveSettings()
  settingsPanel.classList.remove("active")
  checkLlamaConnection()
})

userQueryElement.addEventListener("input", () => {
  submitQueryButton.disabled = !userQueryElement.value.trim() || !selectedText || !isConnected
})

submitQueryButton.addEventListener("click", async () => {
  const query = userQueryElement.value.trim()
  if (!query || !selectedText || !isConnected) return

  await askLlama(query, selectedText)
})

temperatureInput.addEventListener("input", () => {
  temperatureValueElement.textContent = temperatureInput.value
})

// Functions
function setSelectedText(text) {
  selectedText = text
  selectedTextElement.innerHTML = `<p>${escapeHTML(text)}</p>`
  selectedTextElement.classList.remove("placeholder")
  submitQueryButton.disabled = !userQueryElement.value.trim() || !isConnected
}

function loadSettings() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["llamaSettings"], (result) => {
      if (result.llamaSettings) {
        llamaSettings = result.llamaSettings
        llamaPathInput.value = llamaSettings.llamaPath
        contextLengthInput.value = llamaSettings.contextLength
        temperatureInput.value = llamaSettings.temperature
        temperatureValueElement.textContent = llamaSettings.temperature
      }
    })
  } else {
    console.warn("Chrome storage API not available.")
  }
}

function saveSettings() {
  llamaSettings = {
    llamaPath: llamaPathInput.value.trim(),
    contextLength: Number.parseInt(contextLengthInput.value),
    temperature: Number.parseFloat(temperatureInput.value),
  }

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ llamaSettings })
    updateStatus("Settings saved")
  } else {
    console.warn("Chrome storage API not available.")
  }
}

async function checkLlamaConnection() {
  updateConnectionStatus(false, "Checking connection...")

  try {
    // Try to connect to the local Llama server
    const response = await fetch("http://localhost:8080/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      updateConnectionStatus(true, "Connected to Llama")
      isConnected = true
      submitQueryButton.disabled = !userQueryElement.value.trim() || !selectedText
    } else {
      throw new Error("Connection failed")
    }
  } catch (error) {
    updateConnectionStatus(false, "Disconnected")
    isConnected = false
    submitQueryButton.disabled = true
    updateStatus("Cannot connect to Llama. Make sure the local server is running.")
  }
}

async function askLlama(query, context) {
  if (!isConnected) {
    updateStatus("Not connected to Llama")
    return
  }

  updateStatus("Asking Llama...")
  showLoadingInResponse()

  try {
    // Prepare the prompt with the selected text as context
    const prompt = `
Context: ${context}

Question: ${query}

Please provide a helpful answer based on the context above:`

    // Send request to local Llama server
    const response = await fetch("http://localhost:8080/completion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: llamaSettings.contextLength,
        temperature: llamaSettings.temperature,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get response from Llama")
    }

    const data = await response.json()
    displayResponse(data.completion || "No response from Llama")
    updateStatus("Response received")
  } catch (error) {
    displayResponse("Error: Could not get a response from Llama. Please check your connection and settings.")
    updateStatus("Error: " + error.message)
  }
}

function displayResponse(text) {
  llamaResponseElement.innerHTML = `<p>${escapeHTML(text)}</p>`
  llamaResponseElement.classList.remove("placeholder")
}

function showLoadingInResponse() {
  llamaResponseElement.innerHTML = `
    <div class="loading">
      <div></div><div></div><div></div><div></div>
    </div>
    <p>Thinking...</p>
  `
  llamaResponseElement.classList.remove("placeholder")
}

function updateConnectionStatus(connected, message) {
  connectionDotElement.classList.toggle("connected", connected)
  connectionStatusElement.textContent = message
}

function updateStatus(message) {
  statusMessageElement.textContent = message
}

function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>")
}
