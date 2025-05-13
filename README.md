# DeepRead 2.0

A Chrome extension that leverages Ollama to help answer questions about text on websites or PDFs.

## Features

- Select text on any website or PDF in Chrome
- Ask questions about the selected text
- Get AI-powered answers from Ollama
- Customize model settings (temperature, context length)
- Works with any Ollama-compatible model

## Installation

### 1. Install the Chrome Extension

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension icon should now appear in your Chrome toolbar

### 2. Set Up the Local Server

The extension requires a local server to communicate with Ollama.

#### Prerequisites

- Node.js (v14 or later)
- Ollama installed and running
- An Ollama model (e.g., llama2, mistral, or any other supported model)

#### Server Setup

1. Install Ollama:
   - macOS: `curl https://ollama.ai/install.sh | sh`
   - Linux: `curl https://ollama.ai/install.sh | sh`
   - Windows: Download from [Ollama's website](https://ollama.ai)

2. Pull your desired model:
   ```bash
   ollama pull llama3.2  # or any other model you prefer
   ```

3. Navigate to the `server` directory
4. Install dependencies: `npm install`
5. Create a `config.json` file with your preferred settings:
   ```json
   {
     "model": "llama3.2",
     "contextSize": 2048,
     "temperature": 0.7
   }
   ```
6. Start the server: `node llama-server.js`
7. The server should be running on `http://localhost:8080`

## Usage

1. Browse to any website or PDF in Chrome
2. Select text you want to analyze
3. Click the extension icon in the toolbar to open the side panel
4. The selected text will appear in the "Selected Text" section
5. Type your question in the "Your Question" field
6. Click "Ask Llama" to get a response
7. The answer will appear in the "Llama's Response" section

Alternatively, you can right-click on selected text and choose "Ask Llama about this text" from the context menu.

## Configuration

You can configure the Ollama model settings in the extension:

1. Click the gear icon (⚙️) in the top-right corner of the side panel
2. Select your preferred Ollama model
3. Adjust the context length and temperature as needed
4. Click "Save Settings"

## Troubleshooting

- **Extension shows "Disconnected"**: Make sure the local server is running on port 8080
- **No response from Ollama**: Check that Ollama is running and the model is properly installed
- **Slow responses**: Try reducing the context length or using a smaller model
- **Model not found**: Make sure you've pulled the model using `ollama pull <model-name>`

## License

MIT
