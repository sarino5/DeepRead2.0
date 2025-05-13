// Initialize the side panel when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item for selected text
  chrome.contextMenus.create({
    id: "askLlama",
    title: "Ask Llama about this text",
    contexts: ["selection"],
  })

  // Set default settings
  chrome.storage.local.get(["llamaSettings"], (result) => {
    if (!result.llamaSettings) {
      chrome.storage.local.set({
        llamaSettings: {
          llamaPath: "",
          contextLength: 2048,
          temperature: 0.7,
        },
      })
    }
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askLlama" && info.selectionText) {
    // Open the side panel
    chrome.sidePanel.open({ tabId: tab.id })

    // Send the selected text to the side panel
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: "setSelectedText",
        text: info.selectionText,
      })
    }, 500) // Small delay to ensure side panel is loaded
  }
})

// Handle browser action click (toolbar icon)
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id })
})

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    // Request the content script to get the selected text
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
          if (response && response.selectedText) {
            sendResponse({ selectedText: response.selectedText })
          }
        })
      }
    })
    return true // Keep the message channel open for the async response
  }
})
