// This is a Node.js server that will interface with Ollama
import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 8080
const OLLAMA_BASE_URL = "http://localhost:11434"

// Middleware
app.use(cors())
app.use(express.json())

// Default config
let config = {
  model: "llama3.2",  // default model name
  contextSize: 2048,
  temperature: 0.7
}

// Load config if exists
const configPath = path.join(__dirname, "config.json")
if (fs.existsSync(configPath)) {
  try {
    const configData = fs.readFileSync(configPath, "utf8")
    config = { ...config, ...JSON.parse(configData) }
  } catch (error) {
    console.error("Error loading config:", error)
  }
}

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (!response.ok) {
      throw new Error("Ollama server not responding")
    }
    const data = await response.json()
    res.json({ 
      status: "ok", 
      model: config.model,
      availableModels: data.models.map(m => m.name)
    })
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Ollama server not available. Please make sure Ollama is running.",
      error: error.message
    })
  }
})

// Update config endpoint
app.post("/config", (req, res) => {
  const { model, contextSize, temperature } = req.body

  if (model) {
    config.model = model
  }

  if (contextSize && !isNaN(contextSize)) {
    config.contextSize = Number.parseInt(contextSize)
  }

  if (temperature && !isNaN(temperature)) {
    config.temperature = Number.parseFloat(temperature)
  }

  // Save config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

  res.json({ status: "ok", config })
})

// Text completion endpoint
app.post("/completion", async (req, res) => {
  const { prompt, max_tokens = 512, temperature = config.temperature } = req.body

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" })
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: temperature,
          num_predict: max_tokens,
          context_size: config.contextSize
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    res.json({ completion: data.response })
  } catch (error) {
    res.status(500).json({
      error: "Failed to get completion from Ollama",
      details: error.message
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Using Ollama model: ${config.model}`)
})

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server...")
  process.exit(0)
})
