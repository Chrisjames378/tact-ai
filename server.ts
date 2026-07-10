import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to avoid crashes if API key is not yet set
let ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Helper function to generate content with fallback and retry to handle model rate limits or high demand (503)
async function generateContentWithRetry(client: any, model: string, options: any) {
  const modelsToTry = [
    model,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];
  
  let lastError: any = null;

  for (const targetModel of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Attempting content generation with model: ${targetModel} (Attempt ${attempt}/2)`);
        const response = await client.models.generateContent({
          model: targetModel,
          ...options,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Warning: Model ${targetModel} failed on attempt ${attempt}. Error:`, err.message || err);
        // Wait a small amount of time before retrying or falling back
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  throw lastError || new Error("All fallback models and attempts failed");
}

// API Routes
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, diagnostics } = req.body;
    const client = getGeminiClient();

    const systemInstruction = `You are Tact AI, an expert technical diagnostic and hardware repair assistant.
You help users troubleshoot digital devices, computer hardware, smartphones, vehicles, smart home devices, and household appliances.
Always structure your answers with:
1. **Initial Assessment**: What the symptoms suggest.
2. **Step-by-Step Troubleshooting Checklist**: Actionable steps from simplest to advanced. Keep safety instructions prominent!
3. **Recommended Tools**: Name specific tools from a technician's toolbox (e.g., Multimeter, Thermal Camera, Screwdrivers, Contact Cleaner, Oscilloscope).

If the user shares device diagnostics, analyze the diagnostics data (e.g., battery health, network latency, ping, speaker tests) to give highly specific, localized advice.
Keep your tone friendly, professional, analytical, and highly structured. Be playfully technical.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      contents.push(...history);
    }

    let userPrompt = message;
    if (diagnostics && Object.keys(diagnostics).length > 0) {
      userPrompt = `[DIAGNOSTICS REPORT ATTACHED]
${JSON.stringify(diagnostics, null, 2)}

User input: ${message}`;
    }

    contents.push({ role: "user", parts: [{ text: userPrompt }] });

    const response = await generateContentWithRetry(client, "gemini-3.5-flash", {
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// Google Drive & Sheets logging API endpoint
app.post("/api/sheets/log", async (req, res) => {
  try {
    const accessToken = req.headers["x-goog-user-access-token"] as string;
    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized: Missing Google Access Token" });
    }

    const { deviceName, issue, repairLogs, status } = req.body;
    if (!deviceName) {
      return res.status(400).json({ error: "Device name parameter is required" });
    }

    console.log(`[Sheets Log] Logging repair for ${deviceName} to Google Drive...`);

    // 1. Search for existing Google Sheet named "Tact AI Repair Logs"
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='Tact%20AI%20Repair%20Logs'%20and%20mimeType='application/vnd.google-apps.spreadsheet'%20and%20trashed=false&fields=files(id,name)`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("[Sheets Log] Drive search failed:", errText);
      return res.status(searchRes.status).json({ error: "Drive search failed", details: errText });
    }

    const searchData = await searchRes.json() as { files?: { id: string; name: string }[] };
    let spreadsheetId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

    // 2. Create the Google Sheet if it does not exist
    if (!spreadsheetId) {
      console.log("[Sheets Log] Spreadsheet not found. Creating 'Tact AI Repair Logs'...");
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            title: "Tact AI Repair Logs",
          },
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("[Sheets Log] Spreadsheet creation failed:", errText);
        return res.status(createRes.status).json({ error: "Spreadsheet creation failed", details: errText });
      }

      const createData = await createRes.json() as { spreadsheetId: string };
      spreadsheetId = createData.spreadsheetId;
      console.log(`[Sheets Log] Created new spreadsheet with ID: ${spreadsheetId}`);

      // Append header row immediately
      const appendHeaderRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:E1:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            ["Timestamp", "Device / System Node", "What Was Wrong / Found", "What Has Been Fixed", "Repair Status"]
          ]
        }),
      });

      if (!appendHeaderRes.ok) {
        console.warn("[Sheets Log] Failed to write header row:", await appendHeaderRes.text());
      }
    }

    // 3. Append the log row
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          [timestamp, deviceName, issue || "N/A", repairLogs || "N/A", status || "REPAIRED"]
        ]
      }),
    });

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      console.error("[Sheets Log] Failed to append row:", errText);
      return res.status(appendRes.status).json({ error: "Appending log failed", details: errText });
    }

    res.json({ success: true, spreadsheetId, message: "Repair log successfully appended." });
  } catch (error: any) {
    console.error("[Sheets Log] Unexpected Exception:", error);
    res.status(500).json({ error: error.message || "Failed to log to Google Sheets" });
  }
});

// Web Scraper Proxy Endpoint using Evomi Scraper API
app.post("/api/scrape", async (req, res) => {
  try {
    const { url, apiKey } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    const evomiApiKey = apiKey || process.env.EVOMI_API_KEY;
    if (!evomiApiKey) {
      return res.status(400).json({
        error: "EVOMI_API_KEY environment variable is not configured. Please supply an API key in the Scraper Settings tab or set it in Secrets under Settings."
      });
    }

    console.log(`[Scraper] Requesting Evomi Realtime Scrape for URL: ${url}`);

    const response = await fetch("https://scrape.evomi.com/api/v1/scraper/realtime", {
      method: "POST",
      headers: {
        "x-api-key": evomiApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Scraper] Evomi Scraper API Error: ${response.status}`, errText);
      return res.status(response.status).json({
        error: `Evomi Scraper returned error status ${response.status}`,
        details: errText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[Scraper] Proxy Endpoint Exception:", error);
    res.status(500).json({ error: error.message || "Failed to scrape URL" });
  }
});

// Specialized AI Agents Endpoint
app.post("/api/agents", async (req, res) => {
  try {
    const { agent, action, payload } = req.body;
    const client = getGeminiClient();

    let systemInstruction = "";
    let userPrompt = "";

    if (agent === "update") {
      systemInstruction = `You are Aero, the Update and Deployment AI Agent. You are an expert at software versioning, firmware checks, dependency audits, and package maintenance.
When the user invokes an update action (e.g., software audit, driver check, firmware upgrade), evaluate their system components or inputs.
Provide a highly technical, structured response covering:
1. **Current System Audit**: An evaluation of the given dependencies or components.
2. **Upgrade Targets**: Which versions or firmware files should be applied, citing the latest stable releases (e.g. Node 20+, React 19+, Android compileSdk 34).
3. **Execution Plan**: A detailed checklist with terminal commands (e.g., npm install, gradle tasks) or firmware flashing instructions.
4. **Breaking Changes Risk**: Any potential incompatibilities or deprecations to watch out for.
Keep your tone crisp, professional, cybernetic, and highly analytical.`;

      if (action === "audit") {
        userPrompt = `Trigger a complete dependency and component update audit.
Current system metadata:
- Runtime: Node.js (Vite + React 19, TypeScript 5.8)
- Android App: SDK compileSdkVersion 33, TargetSdkVersion 33, Picovoice Porcupine v3.0.0, Kotlin Gradle 8.0.2
- Core Library: @google/genai ^2.4.0, motion ^12.23.24
Please run a diagnostic analysis of what should be upgraded. Provide a clear recommendation list and update commands.`;
      } else {
        userPrompt = `Custom Update Request:
${JSON.stringify(payload || {}, null, 2)}`;
      }
    } 
    else if (agent === "error") {
      systemInstruction = `You are Helix, the Forensic Error Diagnostic AI Agent. You are specialized in parsing stack traces, analyzing runtime exceptions, and debugging syntax or compile errors.
When the user shares an error, parse it forensicly to determine:
1. **Crash Root Cause**: Exactly why the error occurred, breaking it down into plain-tech language.
2. **Exception Stack Analysis**: Point out where in the file or lifecycle the fault happened (e.g. state updating, event listeners, null references).
3. **Remediation Code snippet**: Provide a corrected, high-quality TypeScript, JavaScript, or Kotlin code snippet showing exactly how to fix it.
4. **Resilience Tip**: Suggest an architectural strategy (e.g., error boundaries, optional chaining, safe fallbacks) to prevent this in the future.
Keep your tone sharp, observant, reassuring, and highly developer-centric.`;

      if (action === "analyze-error") {
        userPrompt = `Analyze the following error log / crash trace:
Error string: ${payload?.errorText || "Generic runtime exception"}
Context components: ${payload?.contextComponent || "General workspace"}
Please diagnose the issue and provide a structured fix and code recommendations.`;
      } else {
        userPrompt = `Troubleshoot the current environment. Recent system alerts:
${JSON.stringify(payload || {}, null, 2)}`;
      }
    } 
    else if (agent === "maintenance") {
      systemInstruction = `You are Orion, the General Maintenance and Optimization AI Agent. You are an expert at garbage collection, cache size reduction, database optimization, and local resource cleanup.
Analyze the user's system stats or maintenance requests and provide:
1. **Performance Bottlenecks**: Identify potential performance or memory leaks in their local environment (e.g. stale state triggers, active event listeners, unremoved timers).
2. **Actionable Optimization Steps**: A structured list of maintenance commands (e.g. cleaning npm cache, deleting build artifacts).
3. **Database & Memory Optimization**: Advise on database query indexing, Firestore rules hygiene, and memory management.
4. **Health Check Score**: Assign a hypothetical maintenance health check score (e.g. 78/100) and explain how to get it to 100/100.
Keep your tone clean, systematic, efficient, and precise.`;

      if (action === "optimize") {
        userPrompt = `Perform a general system and application maintenance review.
Local app features in use:
- Web Speech API continuous SpeechRecognition (Hey Tact)
- Full-stack Vite + Express integration
- Dynamic battery API triggers
- In-memory chat history logging
Please suggest custom maintenance procedures and resource optimizations.`;
      } else {
        userPrompt = `Execute maintenance request:
${JSON.stringify(payload || {}, null, 2)}`;
      }
    }

    const response = await generateContentWithRetry(client, "gemini-3.5-flash", {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Agent Error:", error);
    res.status(500).json({ error: error.message || "Failed to execute AI Agent" });
  }
});

// Vite middleware or Static files
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("[WebSocket] Client connected");

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      console.log("[WebSocket] Message received:", parsed);

      if (parsed.type === "ping") {
        ws.send(JSON.stringify({
          type: "pong",
          timestamp: Date.now(),
          sender: "TACT_SERVER"
        }));
      } else if (parsed.type === "telemetry_transmit") {
        ws.send(JSON.stringify({
          type: "telemetry_ack",
          success: true,
          timestamp: Date.now(),
          node: "OSTRICH_PROTOTYPE_01",
          msg: "Node telemetry integrated successfully into core memory queues."
        }));
      } else {
        ws.send(JSON.stringify({
          type: "broadcast",
          echo: parsed.payload || parsed,
          timestamp: Date.now()
        }));
      }
    } catch (e) {
      ws.send(JSON.stringify({
        type: "error",
        error: "Malformed frame payload received."
      }));
    }
  });

  ws.on("close", () => {
    console.log("[WebSocket] Client connection terminated");
  });
});

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
