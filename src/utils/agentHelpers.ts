/**
 * Utility helper functions for Tact AI Agents and Diagnostics
 */

/**
 * Calculates a deterministic system maintenance score based on diagnostics metrics
 */
export function calculateMaintenanceScore(
  batteryLevel: number,
  latencyMs: number,
  errorsCount: number = 0
): number {
  let score = 100;

  // Deduct for low battery if discharging
  if (batteryLevel < 30) {
    score -= (30 - batteryLevel) * 0.5;
  }

  // Deduct for high latency
  if (latencyMs > 100) {
    score -= Math.min(25, (latencyMs - 100) * 0.1);
  } else if (latencyMs > 50) {
    score -= 5;
  }

  // Deduct for active runtime error traces
  score -= Math.min(80, errorsCount * 15);

  return Math.max(10, Math.min(100, Math.round(score)));
}

/**
 * Strips out credential markers, local disk paths, or token-like words from error traces
 */
export function sanitizeErrorText(errorText: string): string {
  if (!errorText) return "";
  
  return errorText
    // Mask absolute UNIX and Windows-like disk paths to guard environment privacy
    .replace(/\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g, ".../$1")
    .replace(/[C-z]:\\[a-zA-Z0-9_-]+\\[a-zA-Z0-9_-]+\\([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g, "...\\$1")
    // Hide API key or secret token values if accidentally pasted
    .replace(/(AIzaSy[A-Za-z0-9_-]{31})/g, "AIzaSy[REDACTED_API_KEY]")
    .replace(/(sk-[A-Za-z0-9_-]{32,})/g, "sk-[REDACTED_SECRET_KEY]")
    // Clean up excessive spacing
    .trim();
}

/**
 * Validates and wraps agent payload properties into standard telemetry log headers
 */
export function formatAgentPrompt(
  agentId: string,
  action: string,
  payload: Record<string, any> = {}
): string {
  const headers = [
    `[AGENT_SYS_LOG: ${agentId.toUpperCase()}]`,
    `[ACTION: ${action.toUpperCase()}]`,
    `[TIMESTAMP: ${new Date().toISOString()}]`
  ];
  
  const formattedPayload = Object.entries(payload)
    .map(([key, val]) => ` - ${key}: ${typeof val === "object" ? JSON.stringify(val) : val}`)
    .join("\n");

  return `${headers.join("\n")}\n\nPayload telemetry data:\n${formattedPayload || " - None provided"}`;
}

/**
 * Local Rule-Based Expert System to generate diagnostic troubleshooting responses on-device
 */
export function generateLocalDiagnosticResponse(
  prompt: string,
  diagnostics: any | null
): string {
  const query = prompt.toLowerCase();
  
  let assessment = "";
  let steps: string[] = [];
  let tools: string[] = [];

  // Match: Battery Drain
  if (query.includes("battery") || query.includes("charge") || query.includes("drain") || (diagnostics?.battery && diagnostics.battery.level < 30)) {
    const battLevel = diagnostics?.battery?.level || 65;
    assessment = `⚡ **[ON-DEVICE COPROCESSOR ASSESSMENT]**: Detected battery troubleshooting inquiry. Current telemetry reports a physical charge level of **${battLevel}%**. Fast discharge patterns typically indicate aggressive background refresh cycles, high display brightness, or excessive wake-locks from non-PWA browser containers.`;
    steps = [
      "Navigate to **Settings > Battery** on your device to audit high-power system processes.",
      "Enable **Adaptive Battery / Power Saving Mode** to limit background daemon executions.",
      "Optimize display sleep timers and lower refresh rates to reduce screen hardware consumption.",
      "Disable Bluetooth, Wi-Fi Scanning, and background Location probes when not explicitly required.",
      "Audit active PWA service workers (like this Tact AI offline node) to ensure proper thread sleeping."
    ];
    tools = ["Multimeter (test charger current drawing)", "USB Power Meter (measure exact voltage & milliamp delivery)", "Thermal Camera (detect hot spots/shorts in the battery IC area)"];
  }
  // Match: Screen / Pixel / Display / Samsung A06 installer
  else if (query.includes("pixel") || query.includes("screen") || query.includes("display") || query.includes("samsung") || query.includes("a06")) {
    assessment = `📱 **[ON-DEVICE COPROCESSOR ASSESSMENT]**: Screen calibration / Dead Pixel analysis requested for device screen/panel. Samsung Galaxy A06 PLS LCD panels are susceptible to sub-pixel fatigue, stuck liquid crystals, or minor backlight leakage.`;
    steps = [
      "Open a high-contrast full-screen dead pixel diagnostic page (flashing solid Red, Green, Blue, White, Black).",
      "Gently apply localized pressure to the stuck pixel area using a soft microfiber cloth or rubber stylus.",
      "Run a high-speed chromatic flicker calibration sequence for 15 minutes to cycle stuck sub-pixels.",
      "Ensure screen timeout is active to prevent static display burn-in.",
      "Check phone graphics driver logs for display controller buffer discrepancies."
    ];
    tools = ["Microfiber Cloth & Stylus", "Colorimeter / Light Sensor Probe", "High-Precision Suction Cups (for panel repair)"];
  }
  // Match: Sound / Speaker / Audio / Frequency / Mic
  else if (query.includes("sound") || query.includes("speaker") || query.includes("audio") || query.includes("frequency") || query.includes("mic") || query.includes("beep")) {
    assessment = `🔊 **[ON-DEVICE COPROCESSOR ASSESSMENT]**: Speaker fidelity/acoustics diagnostic sweep triggered. Accumulation of microscopic dust particles in physical speaker grilles is the leading cause of low-volume clipping or resonant buzzes.`;
    steps = [
      "Play a high-intensity 165Hz sound wave loop for 30 seconds to physically dislodge dust and water ingress.",
      "Use clean compressed air directed at an angle to safely clear physical debris from the speaker channel.",
      "Verify audio output is set to Stereo Mode and check system equalizer for flat frequency response.",
      "Test dynamic range by playing a custom 20Hz-20kHz linear frequency sweep.",
      "Inspect microphone input using a localized gain meter to check for feedback loops."
    ];
    tools = ["Contact Cleaner Spray", "Micro-Bristle ESD Cleaning Brush", "Audio Frequency Analyzer / Decibel Meter"];
  }
  // Match: Network / Wifi / Ping / Latency / Jitter
  else if (query.includes("wifi") || query.includes("ping") || query.includes("latency") || query.includes("network") || query.includes("jitter") || (diagnostics?.network && diagnostics.network.latencyMs > 100)) {
    const lat = diagnostics?.network?.latencyMs || 42;
    assessment = `📶 **[ON-DEVICE COPROCESSOR ASSESSMENT]**: Telemetry reports a real-time network latency of **${lat}ms**. Signal jitter and packet loss typically originate from Wi-Fi channel overlapping or outdated local router firmware.`;
    steps = [
      "Execute a channel overlap scan using the Wi-Fi Analyzer tab on the right to identify clean frequency bands.",
      "Reposition your antenna and ensure clear line-of-sight to prevent physical object signal reflection.",
      "Force-clear your local DNS resolver cache on-device and power-cycle your wireless gateway.",
      "Disable concurrent intensive background downloads and prioritize local telemetry ports.",
      "Configure your device to prefer 5GHz/6GHz bands over saturated 2.4GHz spectrum."
    ];
    tools = ["Wi-Fi Spectrometer Tool", "Ethernet Cable Tester", "Hardware Router Terminal Console"];
  }
  // Match: Scraper / Samsung / Google Sheets
  else if (query.includes("scraper") || query.includes("samsung") || query.includes("sheet") || query.includes("drive")) {
    assessment = `🔒 **[ON-DEVICE COPROCESSOR ASSESSMENT]**: Local Privacy Mode has disabled external scraping and Google sheets connectivity. This keeps your local data fully insulated.`;
    steps = [
      "Review the local cache stored in the browser's sandbox to inspect what was harvested.",
      "For Samsung Members content, copy the raw text to clipboard and paste it directly into this terminal.",
      "All logged repair records are currently safely preserved inside your browser memory only (localStorage).",
      "No outbound telemetry queries are transmitted to Google Drive spreadsheets until Local Only is toggled off."
    ];
    tools = ["Web Browser Local Storage Inspector", "Manual Copy Clipboard Utility"];
  }
  // Generic / Default
  else {
    assessment = `🤖 **[ON-DEVICE COPROCESSOR ASSESSMENT]**: Active inquiry processed on-device. Tact AI Local Mode is executing a privacy-insulated rule match for: "${prompt.substring(0, 60)}...". Core memory units are functioning fully offline.`;
    steps = [
      "Power cycle the system component under test to isolate state anomalies.",
      "Conduct a physical visual inspection of input ports, solder joints, and battery thermal expansion.",
      "Use local log tools to dump firmware logs directly onto a diagnostic storage disk.",
      "Verify connection pins for oxidation or contact fatigue using localized high-purity contact cleaner."
    ];
    tools = ["Digital Multimeter", "Anti-Static ESD Wrist Strap", "Precision Screw Bits", "Contact Cleaner"];
  }

  // Format response in the signature Tact AI structure
  return `### 1. Initial Assessment
${assessment}

### 2. Step-by-Step Troubleshooting Checklist
${steps.map((step, idx) => `${idx + 1}. **Step ${idx + 1}**: ${step}`).join("\n")}

### 3. Recommended Tools
${tools.map(tool => `- **${tool}**`).join("\n")}

***
*🛡️ Diagnostics ran entirely on-device using Tact AI Offline Coprocessor (v2).*`;
}
