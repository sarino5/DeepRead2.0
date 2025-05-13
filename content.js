// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message)
  if (message.action === "getSelectedText") {
    const selectedText = window.getSelection().toString()
    console.log("Sending selected text:", selectedText)
    sendResponse({ selectedText: selectedText })
  }
  return true
})

// Function to handle text selection
function handleTextSelection() {
  const selection = window.getSelection()
  const selectedText = selection.toString().trim()
  console.log("Selected text:", selectedText)
  
  if (selectedText.length > 0) {
    // Send the selected text to the background script
    chrome.runtime.sendMessage({
      action: "textSelected",
      text: selectedText,
    })
  }
}

// Handle regular website text selection
function setupWebsiteTextSelection() {
  // Listen for text selection events
  document.addEventListener("mouseup", () => {
    const selectedText = window.getSelection().toString().trim()
    console.log("Website text selection:", selectedText)
    if (selectedText.length > 0) {
      chrome.runtime.sendMessage({
        action: "textSelected",
        text: selectedText,
      })
    }
  })
}

// Handle PDF content specifically
function checkForPDF() {
  console.log("Checking for PDF...")
  console.log("Content type:", document.contentType)
  console.log("URL:", window.location.href)
  
  // Check if we're in Chrome's PDF viewer (both local and web-hosted PDFs)
  const isPDF = document.contentType === "application/pdf" || 
                window.location.href.includes("pdfjs") ||
                window.location.href.endsWith(".pdf") ||
                window.location.href.startsWith("file://") && window.location.href.endsWith(".pdf")

  if (isPDF) {
    console.log("PDF detected, enabling PDF-specific features")

    // Add a message to notify the user about PDF support
    const infoDiv = document.createElement("div")
    infoDiv.style.position = "fixed"
    infoDiv.style.top = "0"
    infoDiv.style.left = "0"
    infoDiv.style.backgroundColor = "rgba(109, 40, 217, 0.9)"
    infoDiv.style.color = "white"
    infoDiv.style.padding = "10px"
    infoDiv.style.zIndex = "10000"
    infoDiv.style.borderRadius = "0 0 5px 0"
    infoDiv.textContent = "Llama Reader Assistant is active. Select text to analyze with Llama."

    // Add a close button
    const closeButton = document.createElement("span")
    closeButton.textContent = "✕"
    closeButton.style.marginLeft = "10px"
    closeButton.style.cursor = "pointer"
    closeButton.onclick = () => {
      document.body.removeChild(infoDiv)
    }

    infoDiv.appendChild(closeButton)
    document.body.appendChild(infoDiv)

    // Hide the notification after 5 seconds
    setTimeout(() => {
      if (document.body.contains(infoDiv)) {
        document.body.removeChild(infoDiv)
      }
    }, 5000)

    // Create a MutationObserver to watch for changes in the PDF viewer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if the PDF viewer has been added to the page
          const pdfViewer = document.querySelector('#viewer') || 
                          document.querySelector('.pdfViewer') ||
                          document.querySelector('#viewerContainer')
          
          if (pdfViewer) {
            console.log("PDF viewer found, adding event listeners")
            
            // Add event listeners to the PDF viewer
            pdfViewer.addEventListener('mouseup', handleTextSelection)
            pdfViewer.addEventListener('keyup', (e) => {
              if (e.ctrlKey || e.metaKey) {
                handleTextSelection()
              }
            })
          }
        }
      })
    })

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true })

    // Add event listeners to the document
    document.addEventListener('mouseup', handleTextSelection)
    document.addEventListener('keyup', (e) => {
      if (e.ctrlKey || e.metaKey) {
        handleTextSelection()
      }
    })
    document.addEventListener('selectionchange', handleTextSelection)

    // Try to access the PDF viewer's iframe
    const iframes = document.querySelectorAll('iframe')
    iframes.forEach(iframe => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        iframeDoc.addEventListener('mouseup', handleTextSelection)
        iframeDoc.addEventListener('selectionchange', handleTextSelection)
        console.log("Added event listeners to iframe")
      } catch (e) {
        console.log("Could not access iframe content:", e)
      }
    })

    // Add a context menu event listener
    document.addEventListener('contextmenu', () => {
      // Small delay to ensure the selection is complete
      setTimeout(handleTextSelection, 100)
    })
  } else {
    // If not a PDF, set up regular website text selection
    setupWebsiteTextSelection()
  }
}

// Check for PDF when the page loads
window.addEventListener("load", () => {
  console.log("Page loaded, checking for PDF...")
  checkForPDF()
})

// Also check when the URL changes (for PDFs loaded in the same tab)
let lastUrl = location.href
new MutationObserver(() => {
  const currentUrl = location.href
  if (currentUrl !== lastUrl) {
    console.log("URL changed, checking for PDF...")
    lastUrl = currentUrl
    checkForPDF()
  }
}).observe(document, { subtree: true, childList: true })
