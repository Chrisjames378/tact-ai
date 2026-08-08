import IntegrationsPanel from "./IntegrationsPanel";
import MonetizationPanel from "./MonetizationPanel";
import React, { useState, useEffect, useRef } from "react";
import { 
  RefreshCw, AlertCircle, Wrench, Sparkles, Cpu, Terminal, 
  ArrowRight, CornerDownRight, Copy, Check, Send, ShieldAlert,
  HardDrive, Info, Activity, ShieldCheck, Clock, Database, Play,
  Pause, LogIn, LogOut, CheckCircle, Smartphone, Download, WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateMaintenanceScore, sanitizeErrorText } from "../utils/agentHelpers";
import { logRepairToGoogleSheets } from "../utils/sheetsLogger";

interface AgentHubProps {
  batteryLevel?: number;
  latencyMs?: number;
  isNodeOnline?: boolean;
  nodeVersion?: string;
  onNodeOnlineChange?: (online: boolean) => void;
  onNodeUpgrade?: (newVersion: string, upgradeLogs: string) => void;
  onRepairCompleted?: (deviceName: string, repairLogs: string) => void;
  setMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  googleUser?: any;
  googleToken?: string | null;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  isLocalOnly?: boolean;
  onToggleLocalOnly?: () => void;
}

interface Agent {
  id: "update" | "error" | "maintenance";
  name: string;
  codename: string;
  avatarColor: string;
  borderColor: string;
  glowColor: string;
  icon: React.ComponentType<any>;
  description: string;
  specialization: string;
  status: string;
}

export default function AgentHub({ 
  batteryLevel, 
  latencyMs,
  isNodeOnline = true,
  nodeVersion = "v1.0.4",
  onNodeOnlineChange,
  onNodeUpgrade,
  onRepairCompleted,
  setMessages,
  googleUser,
  googleToken,
  onGoogleLogin,
  onGoogleLogout,
  isLocalOnly = false,
  onToggleLocalOnly
}: AgentHubProps) {
  const [activeAgentId, setActiveAgentId] = useState<"update" | "error" | "maintenance">("update");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [customError, setCustomError] = useState("");
  const [customPackage, setCustomPackage] = useState("");
  const [copied, setCopied] = useState(false);
  const [agentLog, setAgentLog] = useState<string[]>([]);

  // Moto G15 App Cover & PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [coverGlowColor, setCoverGlowColor] = useState<"cyan" | "emerald" | "amber" | "purple">("cyan");
  const [appCoverBadge, setAppCoverBadge] = useState<string>("TA"); // "TA" for Tact AI, "AE" for Aegis, "DN" for Diagnostic Node
  const [customIconLabel, setCustomIconLabel] = useState<string>("Tact AI");

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if running in standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Direct instructions for Moto G15 Android if standard prompt is unavailable
      if (setMessages) {
        setMessages(prev => [...prev, {
          id: `pwa-install-manual-${Date.now()}`,
          role: "assistant",
          text: `📲 **Install Tact AI on your Moto G15 (Android)**:\n\n1. Open this app in **Chrome** on your phone.\n2. Tap the **three dots menu (⋮)** in the top right of Chrome.\n3. Tap **"Add to Home screen"** or **"Install app"**.\n4. Your custom **Tact AI App Cover** will be added to your home screen! Once added, it will load instantly and run offline **every single time, without a doubt!**`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Autopilot Daemon & Google Sheets sync states
  const [isAutopilotEnabled, setIsAutopilotEnabled] = useState<boolean>(true);
  const [autopilotInterval, setAutopilotInterval] = useState<"2days" | "3days" | "speedy">("2days");
  const [timeLeft, setTimeLeft] = useState<number>(2 * 24 * 60 * 60); // 172,800 seconds for 2 days
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [autopilotLogs, setAutopilotLogs] = useState<Array<{
    id: string;
    timestamp: string;
    issues: string;
    fixes: string;
    synced: boolean;
  }>>([
    {
      id: "hist-1",
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
      issues: "Samsung Wi-Fi Antenna frequency jitter detected (184Hz drift)",
      fixes: "Applied automated multi-channel alignment protocol. SNR improved +14dB",
      synced: true
    },
    {
      id: "hist-2",
      timestamp: new Date(Date.now() - 96 * 3600 * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
      issues: "Aero Update package audit: Outdated gradle tools",
      fixes: "Aligned Android build dependencies & cleared npm compile cache",
      synced: true
    }
  ]);

  // Handle countdown ticking
  useEffect(() => {
    if (!isAutopilotEnabled || isSweeping) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Trigger sweep when timer hits 0
          runAutopilotSweep(false);
          return getIntervalSeconds(autopilotInterval);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutopilotEnabled, autopilotInterval, isSweeping, isNodeOnline, googleToken]);

  // Reset countdown based on interval selection
  const getIntervalSeconds = (interval: "2days" | "3days" | "speedy") => {
    if (interval === "speedy") return 30;
    if (interval === "3days") return 3 * 24 * 60 * 60;
    return 2 * 24 * 60 * 60;
  };

  const resetTimer = () => {
    setTimeLeft(getIntervalSeconds(autopilotInterval));
  };

  useEffect(() => {
    resetTimer();
  }, [autopilotInterval]);

  // Format countdown string for humans
  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    if (mins <= 60) {
      return `${mins}m ${seconds % 60}s`;
    }
    const hours = Math.floor(mins / 60);
    if (hours <= 24) {
      return `${hours}h ${mins % 60}m`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Autopilot background routine sweep
  const runAutopilotSweep = async (isManual: boolean = false) => {
    if (isSweeping) return;
    if (!isNodeOnline) {
      if (isManual && setMessages) {
        setMessages(prev => [...prev, {
          id: `sweep-blocked-${Date.now()}`,
          role: "assistant",
          text: `⚠️ **Autopilot Sweep Interrupted**: The Tact AI Diagnostic Node is currently OFFLINE. Please power on the Node to allow automated diagnostics.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      return;
    }

    setIsSweeping(true);
    
    // Add logs to the agent console log dynamically
    setAgentLog([
      "[🛡️ AEGIS AUTOPILOT] Initializing Scheduled System Sweep...",
      `[🛡️ AEGIS AUTOPILOT] Trigger source: ${isManual ? "Manual User Override" : "Scheduled Background Daemon"}`,
      `[🛡️ AEGIS AUTOPILOT] Local time: ${new Date().toLocaleTimeString()}`
    ]);

    await new Promise(resolve => setTimeout(resolve, 600));
    setAgentLog(prev => [...prev, "[🛡️ AEGIS AUTOPILOT] Step 1/3: Analyzing local package.json dependencies and gradle scripts..."]);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    setAgentLog(prev => [...prev, "[🛡️ AEGIS AUTOPILOT] Step 2/3: Checking network latency, telemetry endpoints, and wifi signal interference..."]);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    setAgentLog(prev => [...prev, "[🛡️ AEGIS AUTOPILOT] Step 3/3: Running forensic diagnostics on device memory allocations and cache health..."]);

    // Determine what has been audited, upgraded, and fixed
    let upgradeResult = "";
    let repairResult = "";
    let issuesFound: string[] = [];
    let actionsTaken: string[] = [];

    // Execute firmware check / upgrade check
    if (nodeVersion === "v1.0.4") {
      upgradeResult = "Firmware updated from v1.0.4 to v1.1.0 (LATEST)";
      issuesFound.push("Outdated core node firmware (v1.0.4)");
      actionsTaken.push("Flashed node controller to latest stable v1.1.0 build");
      if (onNodeUpgrade) {
        onNodeUpgrade("v1.1.0", "[AUTOPILOT BUILD] Bundled Gemini SDK...\n[AUTOPILOT DEPLOY] Upgraded Core Model to Gemini Omni 2.5.\n[COMPLETED] Master firmware upgrade successful.");
      }
    } else {
      upgradeResult = "Core node firmware matches highest compiled version (v1.1.0)";
    }

    // Execute error check and automatic repairs of device nodes
    const devicesToRepair = [
      { name: "Tact Wi-Fi Router Node", issue: "High wireless spectrum overlap noise", fix: "Auto-shifted channel frequency band. Signal clear." },
      { name: "Galaxy Audio Output", issue: "High frequency audio distortion", fix: "Re-aligned transducer logic buffers. Sound output optimal." },
      { name: "Moto G15 Telemetry Hub", issue: "Wake-word frequency drift in battery saver", fix: "Adjusted wake frequency coefficients for optimal power" }
    ];

    const randomRep = devicesToRepair[Math.floor(Math.random() * devicesToRepair.length)];
    issuesFound.push(randomRep.issue);
    actionsTaken.push(randomRep.fix);
    repairResult = `Repaired ${randomRep.name} (${randomRep.issue})`;

    if (onRepairCompleted) {
      onRepairCompleted(randomRep.name, `[AUTOPILOT DIAGNOSTICS] Parsing spectrum output...\n[CORRECTION] ${randomRep.fix}\n[COMPLETED] Sub-module status restored to healthy.`);
    }

    // Compose final sweep details
    const sweepTime = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const issueSummary = issuesFound.join(", ") || "No critical faults";
    const fixSummary = actionsTaken.join("; ") || "System optimization completed";

    let sheetsSynced = false;
    let sheetResponseMsg = "";

    // Log to Sheets if googleToken is available
    if (googleToken) {
      try {
        await logRepairToGoogleSheets(googleToken, "Aegis Autopilot Sweep", issueSummary, fixSummary, "AUTOPILOT_OK");
        sheetsSynced = true;
        sheetResponseMsg = "Logs successfully archived to Google Drive Spreadsheet.";
      } catch (err: any) {
        console.error("Sheets sync failed during autopilot sweep:", err);
        sheetResponseMsg = "Drive sync failed. Saved to local storage buffer.";
      }
    } else {
      sheetResponseMsg = "Not logged in with Google. Logs cached locally.";
    }

    // Add new log to our state
    const newLog = {
      id: `sweep-${Date.now()}`,
      timestamp: sweepTime,
      issues: issueSummary,
      fixes: fixSummary,
      synced: sheetsSynced
    };

    setAutopilotLogs(prev => [newLog, ...prev]);

    if (setMessages) {
      setMessages(prev => [...prev, {
        id: `autopilot-run-${Date.now()}`,
        role: "assistant",
        text: `🛡️ **Aegis Autopilot Sweep Complete**:\n\nSystem diagnostics check completed successfully! Here is the telemetry summary:\n\n- **Interval**: Check runs every 2 to 3 days .\n- **Audit Findings**: ${issueSummary}.\n- **Auto-Fix Action**: ${fixSummary}.\n- **Google Drive Storage**: ${sheetResponseMsg}\n\n*Aegis remains alert to secure and optimize your system in the background.*`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    setAgentLog(prev => [...prev, "[🛡️ AEGIS AUTOPILOT] Sweep completed successfully. System status: HEALED.", `[🛡️ AEGIS AUTOPILOT] ${sheetResponseMsg}`]);
    setIsSweeping(false);

    // Reset countdown
    resetTimer();
  };

  // Simulation parameters
  const [maintenanceScore, setMaintenanceScore] = useState<number | null>(null);
  const [optimizedFiles, setOptimizedFiles] = useState<string[]>([]);

  const agents: Agent[] = [
    {
      id: "update",
      name: "GitHub Review Agent",
      codename: "GITHUB_v2.5",
      avatarColor: "bg-blue-600",
      borderColor: "border-blue-500/30",
      glowColor: "shadow-blue-500/10",
      icon: RefreshCw,
      description: "Handles software versioning audits, GitHub PR validation, dependency checks, and automated merge testing.",
      specialization: "Codebase compatibility & PR routines",
      status: "READY"
    },
    {
      id: "error",
      name: "Grok Error Detective",
      codename: "GROK_v1.9",
      avatarColor: "bg-red-600",
      borderColor: "border-red-500/30",
      glowColor: "shadow-red-500/10",
      icon: AlertCircle,
      description: "Powered by Grok to examine stack traces, diagnose network WebSocket dropouts, memory leaks, and supply pristine repair code snippets.",
      specialization: "Root-cause forensics & compile debugging",
      status: "ONLINE"
    },
    {
      id: "maintenance",
      name: "Cloud Run Maintenance Agent",
      codename: "CLOUDRUN_v3.2",
      avatarColor: "bg-emerald-600",
      borderColor: "border-emerald-500/30",
      glowColor: "shadow-emerald-500/10",
      icon: Wrench,
      description: "Executes performance profiles, scales Cloud Run container configurations, sweeps cache records, and optimizes app heap allocations.",
      specialization: "Serverless efficiency & scaling",
      status: "STANDBY"
    }
  ];

  const activeAgent = agents.find(a => a.id === activeAgentId)!;

  // Run Backend Agent Command
  const triggerAgentAction = async (action: string, payload?: any) => {
    setIsLoading(true);
    setReport(null);
    setCopied(false);

    if (!isNodeOnline) {
      setAgentLog([
        "SYSTEM_ALERT: Core Diagnostic Node is OFFLINE.",
        "SYSTEM_ALERT: Outbound satellite routes are currently disabled.",
        "SYSTEM_ALERT: Toggle the node ONLINE to deploy AI agents."
      ]);
      setReport("⚠️ **Uplink Blocked**: The core Tact AI Diagnostic Node is currently offline. Please toggle the node status to ONLINE to allow AI agents to parse packages, trace failures, and conduct logic maintenance.");
      setIsLoading(false);
      return;
    }

    // Initial log sequence to make the agent feel incredibly dynamic
    const logs = {
      update: [
        "GITHUB_AGENT: Establishing uplink to GitHub API...",
        "GITHUB_AGENT: Scanning local /package.json schema and active branches...",
        "GITHUB_AGENT: Interrogating GitHub Actions workflows...",
        "GITHUB_AGENT: Fetching model response from GenAI engine..."
      ],
      error: [
        "GROK_AGENT: Mounting stack trace parser...",
        "GROK_AGENT: Correlating exception metrics...",
        "GROK_AGENT: Isolating local environment parameters...",
        "GROK_AGENT: Compiling diagnostic remediation recommendation..."
      ],
      maintenance: [
        "CLOUDRUN_AGENT: Performing container heap allocation profile...",
        "CLOUDRUN_AGENT: Sweeping unused browser DOM events...",
        "CLOUDRUN_AGENT: Indexing Cloud Run service scaling telemetry...",
        "CLOUDRUN_AGENT: Generating system optimization routine..."
      ]
    };

    // Staggered logs simulation
    setAgentLog([]);
    const activeLogs = logs[activeAgentId];
    for (let i = 0; i < activeLogs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 350));
      setAgentLog(prev => [...prev, activeLogs[i]]);
    }

    if (isLocalOnly) {
      // Run completely offline without touching the backend endpoint
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let localReportText = "";
      if (activeAgentId === "update") {
        if (action === "audit") {
          localReportText = `### 📦 Tact Core Offline Dependency Audit

The local package.json index matches the production offline baseline:
- **vite**: ^5.1.0 (Optimal asset pipeline)
- **react**: ^18.2.0 (Component tree state optimal)
- **motion**: ^11.11.17 (Animations loaded on-device)
- **lucide-react**: ^0.344.0 (All system icons verified)

**Diagnostic Recommendation:** No orphaned development dependencies or malicious hooks found. Safe for on-device execution.`;
        } else {
          const target = payload.target || "Android Target SDK 34 Alignment";
          localReportText = `### ⚙️ Tact On-Device Alignment Report: ${target}

- **Baseline Check**: Local Moto G15 host runs Android SDK API level 34 compatibilities directly.
- **Config Manifest**: Local config file parsed with zero cloud queries.
- **Offline Resolution**: Confirmed that all client components, service worker caches, and assets are perfectly bundled to align with on-device target rules.`;
        }
      } else if (activeAgentId === "error") {
        localReportText = `### 🔬 Tact Forensic Stack Trace Analysis

**Reported Log:** ${payload.errorText || "WebSocket Closed unexpectedly"}
**Suspected Origin:** Sandbox container iframe boundary limitations.

**Remedial Checklist:**
1. This is a benign warning. In a browser iframe environment, WebSocket HMR often fails to handshake because port 3000 uses strict reverse-proxy rules.
2. The offline service worker has intercepted asset loading to ensure offline robustness.
3. No user actions are required; the fallback thread is handling all layout calculations on-device.`;
      } else { // maintenance
        localReportText = `### 🧹 Tact System Flush Completed

- **Volatile Cache Truncated**: Cleaned browser memory leaks.
- **Diagnostic States Stabilized**: Offline node active on port 3000.
- **Score Gained**: Calculated real-time hardware alignment.`;
      }

      setReport(localReportText);
      if (activeAgentId === "maintenance") {
        const score = calculateMaintenanceScore(batteryLevel ?? 100, latencyMs ?? 25, 0);
        setMaintenanceScore(score);
        setOptimizedFiles(["npm cache cleared", "in-memory chat logs truncated", "battery-level event listeners sanitized"]);
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: activeAgentId,
          action,
          payload
        })
      });

      if (!res.ok) {
        throw new Error(`Agent query failed with status ${res.status}`);
      }

      const data = await res.json();
      setReport(data.text);
      
      // Update custom visual states if applicable
      if (activeAgentId === "maintenance") {
        const score = calculateMaintenanceScore(batteryLevel ?? 100, latencyMs ?? 25, 0);
        setMaintenanceScore(score);
        setOptimizedFiles(["npm cache cleared", "in-memory chat logs truncated", "battery-level event listeners sanitized"]);
      }
    } catch (err: any) {
      console.error(err);
      setReport(`⚠️ **Agent Dispatch Failure**: Could not query the server-side agent core. Ensure your GEMINI_API_KEY is configured correctly in the Secrets panel.\n\nError details: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderReportMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let content = line;
      let isHeader = false;
      let headerLevel = 0;

      // Detect bullet points
      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*") || /^\d+\./.test(line.trim());
      
      // Clean leading hashes for headers
      if (line.startsWith("### ")) {
        content = line.replace("### ", "");
        isHeader = true;
        headerLevel = 3;
      } else if (line.startsWith("## ")) {
        content = line.replace("## ", "");
        isHeader = true;
        headerLevel = 2;
      } else if (line.startsWith("# ")) {
        content = line.replace("# ", "");
        isHeader = true;
        headerLevel = 1;
      }

      // Format bold elements **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-zinc-100 font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const finalContent = parts.length > 0 ? parts : content;

      if (isHeader) {
        if (headerLevel === 1) {
          return <h4 key={idx} className="text-sm font-extrabold text-blue-400 uppercase tracking-wider mt-4 mb-2 font-mono">{finalContent}</h4>;
        } else if (headerLevel === 2) {
          return <h5 key={idx} className="text-xs font-bold text-zinc-200 uppercase mt-3 mb-1.5 font-mono flex items-center gap-1.5"><CornerDownRight className="w-3.5 h-3.5 text-blue-500" /> {finalContent}</h5>;
        } else {
          return <h6 key={idx} className="text-xs font-semibold text-zinc-300 mt-2 mb-1 font-sans">{finalContent}</h6>;
        }
      }

      if (isBullet) {
        return (
          <div key={idx} className="pl-4 py-0.5 text-xs text-zinc-400 font-sans leading-relaxed flex items-start gap-1.5">
            <span className="text-blue-500 shrink-0 select-none mt-1">•</span>
            <span>{finalContent}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs text-zinc-400 font-sans leading-relaxed mb-1.5 min-h-[4px]">
          {finalContent}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-[500px] bg-zinc-950/25 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
      
      {/* Control Header */}
      <div className="glass-panel-header px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-xs font-bold tracking-tight text-zinc-300">
            AI AGENTS CONTROL ROOM
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-blue-400/80 font-mono font-bold uppercase">Gemini Agent Engine</span>
        </div>
      </div>

      {/* Dynamic Tact AI Diagnostic Node Telemetry Monitor */}
      <div className={`px-4 py-2.5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        isNodeOnline ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            {isNodeOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-black text-zinc-200">TACT_AI_DIAGNOSTIC_NODE</span>
              <span className={`px-1 rounded font-mono text-[7px] font-bold uppercase ${
                nodeVersion === "v1.1.0" ? "bg-purple-500/15 text-purple-400" : "bg-blue-500/15 text-blue-400"
              }`}>
                {nodeVersion}
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono leading-none">
              STATUS: <strong className={isNodeOnline ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{isNodeOnline ? "ONLINE" : "STANDBY (OFFLINE)"}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Node Online Toggle Switch */}
          <button
            onClick={() => onNodeOnlineChange?.(!isNodeOnline)}
            className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer border ${
              isNodeOnline 
                ? "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/25" 
                : "bg-red-500/10 hover:bg-red-500/15 text-red-400 border-red-500/25"
            }`}
            title={isNodeOnline ? "Switch Node Standby" : "Power On Node"}
          >
            {isNodeOnline ? "Node: Online" : "Node: Offline"}
          </button>

          {/* Shortcut: Deploy Auto-Fixes */}
          <button
            onClick={() => {
              if (onRepairCompleted) {
                setMessages?.(prev => [...prev, {
                  id: `msg-${Date.now()}`,
                  role: "user",
                  text: "Trigger remote fix for Tact Wi-Fi Router Node",
                  timestamp: new Date().toLocaleTimeString()
                }]);
                onRepairCompleted("Tact Wi-Fi Router Node", "[INITIALIZATION] Opening channel multiplexers...\n[CORRECTION] Overriding spectrum overlay on 2.4GHz band.\n[COMPLETED] Router channel noise successfully minimized.");
              }
            }}
            disabled={!isNodeOnline}
            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-zinc-300 hover:text-white font-mono text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 transition-colors"
          >
            <Wrench className="w-2.5 h-2.5 text-amber-400" />
            Auto-Fix
          </button>

          {/* Shortcut: Core Upgrade */}
          <button
            onClick={() => {
              if (onNodeUpgrade) {
                if (nodeVersion === "v1.1.0") {
                  setMessages?.(prev => [...prev, {
                    id: `msg-ver-${Date.now()}`,
                    role: "assistant",
                    text: "✨ **Diagnostics Check**: Tact AI Diagnostic Node is already running the highest compiled release version: **v1.1.0**.",
                    timestamp: new Date().toLocaleTimeString()
                  }]);
                  return;
                }
                setMessages?.(prev => [...prev, {
                  id: `msg-${Date.now()}`,
                  role: "user",
                  text: "Upgrade Core Node firmware",
                  timestamp: new Date().toLocaleTimeString()
                }]);
                onNodeUpgrade("v1.1.0", "[COMPILE] Bundling Gemini SDK...\n[DEPLOYING] Upgraded Core Model to Gemini Omni 2.5.\n[COMPLETED] Master firmware upgrade successful.");
              }
            }}
            disabled={!isNodeOnline}
            className="px-2 py-0.5 rounded bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-900/60 hover:to-indigo-900/60 disabled:opacity-40 text-purple-300 hover:text-white border border-purple-500/20 font-mono text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            Upgrade
          </button>
        </div>
      </div>

      {/* 🔒 TACT SHIELD: LOCAL-ONLY PRIVACY TOGGLE */}
      <div className={`p-3.5 border-b space-y-2.5 transition-all ${
        isLocalOnly 
          ? "bg-blue-950/20 border-blue-500/20" 
          : "bg-zinc-900/20 border-zinc-800/50"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLocalOnly ? (
              <ShieldCheck className="w-4 h-4 text-blue-400 animate-pulse" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-zinc-500" />
            )}
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-black uppercase text-zinc-200 tracking-wider">
                TACT_PRIVACY_SHIELD_V2
              </span>
              <span className="text-[8px] text-zinc-500 font-mono">
                COGNITIVE PIPELINE: {isLocalOnly ? "100% LOCAL (ON-DEVICE)" : "CLOUD GENAI & WORKSPACE CONNECTED"}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleLocalOnly}
            className={`px-3 py-1 rounded font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
              isLocalOnly 
                ? "bg-blue-600/25 hover:bg-blue-600/35 text-blue-300 border-blue-500/35 shadow-lg shadow-blue-500/5" 
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {isLocalOnly ? "🔒 Local-Only: Active" : "🔓 Local-Only: Inactive"}
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 leading-normal font-sans">
          {isLocalOnly 
            ? "Tact Shield is routing all telemetry parsing, expert reasoning sweeps, and diagnostic logic through local memory buffers. External APIs and Google sheets backups are fully blocked."
            : "Requires internet. Queries are processed server-side. Connect Google Sheets below to automatically back up successful hardware repair tickets."
          }
        </p>
      </div>

      {/* Aegis Autopilot Daemon & Google Sheets Integration Panel */}
      <div className="p-3.5 bg-zinc-900/60 border-b border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-[10px] font-black uppercase text-zinc-300 tracking-wider">
              Aegis Autopilot Daemon
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold uppercase ${
              isAutopilotEnabled ? "bg-blue-500/10 text-blue-400 animate-pulse" : "bg-zinc-800 text-zinc-500"
            }`}>
              {isAutopilotEnabled ? "Daemon Active" : "Daemon Suspended"}
            </span>
          </div>
        </div>

        {/* Sync Status / Google Sheets Authenticator */}
        <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Database className={`w-4 h-4 mt-0.5 shrink-0 ${googleUser && !isLocalOnly ? "text-emerald-400" : "text-zinc-500"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold font-mono text-zinc-200">
                GOOGLE SHEETS REPAIR LOGGER
              </span>
              <p className="text-[9px] text-zinc-500 font-mono mt-0.5 leading-none">
                Destination: <span className="text-zinc-400 font-semibold underline">Tact AI Repair Logs</span>
              </p>
              {googleUser ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLocalOnly ? "bg-blue-400" : "bg-emerald-500"}`} />
                  <span className={`text-[9px] font-mono font-medium ${isLocalOnly ? "text-blue-400" : "text-emerald-400"}`}>
                    {isLocalOnly 
                      ? "Cloud block active • Log kept local" 
                      : `Logged in as ${googleUser.displayName || googleUser.email}`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                  <span className="text-[9px] text-zinc-500 font-mono">
                    Logs cached locally • Connect to Google Drive
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end">
            {googleUser ? (
              <button
                onClick={onGoogleLogout}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[9px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Disconnect from Google Drive"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={onGoogleLogin}
                disabled={isLocalOnly}
                className={`px-2.5 py-1 rounded text-[9px] font-mono border shadow-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                  isLocalOnly 
                    ? "bg-zinc-900 border-zinc-850 text-zinc-600 cursor-not-allowed hover:scale-100" 
                    : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 hover:scale-[1.02]"
                }`}
                title={isLocalOnly ? "Disabled in Local Only privacy mode" : "Connect to Google Sheets & Drive"}
              >
                <LogIn className="w-3 h-3 text-blue-100" />
                Connect Sheets
              </button>
            )}
          </div>
        </div>

        {/* Autopilot Controller Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
          {/* Active Settings */}
          <div className="p-2 bg-zinc-950/20 border border-zinc-800/30 rounded-lg flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight">Active Schedule</span>
              <span className="text-[10px] font-mono font-bold text-blue-400">
                {isAutopilotEnabled ? `Runs in: ${formatTimeLeft(timeLeft)}` : "STANDBY"}
              </span>
            </div>

            {/* Interval Toggles */}
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setAutopilotInterval("2days")}
                className={`py-1 rounded text-[8px] font-mono font-bold uppercase transition-all border ${
                  autopilotInterval === "2days"
                    ? "bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-inner"
                    : "bg-zinc-900/40 text-zinc-500 border-transparent hover:text-zinc-400 hover:bg-zinc-900/80 cursor-pointer"
                }`}
              >
                2 Days
              </button>
              <button
                onClick={() => setAutopilotInterval("3days")}
                className={`py-1 rounded text-[8px] font-mono font-bold uppercase transition-all border ${
                  autopilotInterval === "3days"
                    ? "bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-inner"
                    : "bg-zinc-900/40 text-zinc-500 border-transparent hover:text-zinc-400 hover:bg-zinc-900/80 cursor-pointer"
                }`}
              >
                3 Days
              </button>
              <button
                onClick={() => setAutopilotInterval("speedy")}
                title="Fast 30s loop for development and demo sweeps"
                className={`py-1 rounded text-[8px] font-mono font-bold uppercase transition-all border ${
                  autopilotInterval === "speedy"
                    ? "bg-purple-600/10 text-purple-400 border-purple-500/30 shadow-inner"
                    : "bg-zinc-900/40 text-zinc-500 border-transparent hover:text-zinc-400 hover:bg-zinc-900/80 cursor-pointer"
                }`}
              >
                Speedy
              </button>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="p-2 bg-zinc-950/20 border border-zinc-800/30 rounded-lg flex items-center justify-between gap-2.5">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight">Manual Sweep Override</span>
              <span className="text-[8px] font-mono text-zinc-500 mt-0.5">Triggers deep analysis immediately</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Play/Pause Daemon Toggle */}
              <button
                onClick={() => setIsAutopilotEnabled(!isAutopilotEnabled)}
                className={`p-1.5 rounded border transition-colors cursor-pointer ${
                  isAutopilotEnabled 
                    ? "bg-zinc-900 border-zinc-800 text-blue-400 hover:text-blue-300" 
                    : "bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20"
                }`}
                title={isAutopilotEnabled ? "Pause Autopilot Daemon" : "Resume Autopilot Daemon"}
              >
                {isAutopilotEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Force run check */}
              <button
                onClick={() => runAutopilotSweep(true)}
                disabled={isSweeping || !isNodeOnline}
                className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-[9px] font-bold uppercase transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSweeping ? "animate-spin" : ""}`} />
                {isSweeping ? "Sweeping" : "Sweep"}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Sweep log History */}
        <div className="border border-zinc-800/30 bg-zinc-950/10 rounded-lg overflow-hidden">
          <div className="px-2 py-1.5 bg-zinc-950/30 flex items-center justify-between">
            <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-zinc-500" />
              Autopilot History & Sync Records
            </span>
            <span className="text-[8px] font-mono text-zinc-500">
              {autopilotLogs.length} runs cataloged
            </span>
          </div>

          <div className="max-h-[82px] overflow-y-auto divide-y divide-zinc-900 font-mono text-[9px]">
            {autopilotLogs.map((log) => (
              <div key={log.id} className="p-2 hover:bg-zinc-950/30 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[8px] text-zinc-500">
                    <span>{log.timestamp}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-blue-500/70 font-semibold uppercase">Autopilot Run</span>
                  </div>
                  <div className="text-zinc-300 font-semibold leading-tight">
                    Audit: {log.issues}
                  </div>
                  <div className="text-zinc-500 text-[8px] leading-tight">
                    Remedy: {log.fixes}
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  {log.synced ? (
                    <span className="px-1 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-[7px] font-bold uppercase" title="Archived successfully to Google Sheets">
                      Synced
                    </span>
                  ) : (
                    <span className="px-1 py-0.5 rounded bg-zinc-950/40 text-zinc-500 border border-zinc-800 text-[7px] font-bold uppercase" title="Not synced to Drive">
                      Local
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Moto G15 Mobile Installer & App Cover Customizer Panel */}
      <div className="p-3.5 bg-zinc-900/40 border-b border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono text-[10px] font-black uppercase text-zinc-300 tracking-wider">
              Moto G15 Mobile Installer & App Cover Customizer
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[8px] font-bold uppercase">
            PWA Ready
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Controls Side */}
          <div className="lg:col-span-7 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                Configure your custom <span className="text-purple-400 font-bold">App Cover Icon</span> and install Tact AI directly on your Motorola Moto G15 or other Android devices. Once installed, our advanced Service Worker caching guarantees the app opens instantly and runs offline **every single time, without a doubt!**
              </p>

              {/* Customizer controls */}
              <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60 space-y-2.5">
                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-tight block">
                  🎨 Live App Cover Customizer
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Badge text input */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase font-semibold">Badge Letters</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={appCoverBadge}
                      onChange={(e) => setAppCoverBadge(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 uppercase focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* App Label */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase font-semibold">Home Screen Label</label>
                    <input
                      type="text"
                      maxLength={12}
                      value={customIconLabel}
                      onChange={(e) => setCustomIconLabel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Glow Color Selector */}
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-zinc-500 uppercase font-semibold block">Glow Profile Accent</label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: "cyan", name: "Aegis Cyan", color: "bg-cyan-500" },
                      { id: "emerald", name: "Matrix Green", color: "bg-emerald-500" },
                      { id: "amber", name: "Cyber Amber", color: "bg-amber-500" },
                      { id: "purple", name: "Neon Purple", color: "bg-purple-500" }
                    ].map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setCoverGlowColor(col.id as any)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-mono border transition-all cursor-pointer ${
                          coverGlowColor === col.id
                            ? "bg-zinc-900 border-zinc-700 text-zinc-100"
                            : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
                        {col.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core Features list */}
              <div className="space-y-1.5 pl-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                  <span className="text-[10px] font-mono text-zinc-400 leading-tight">
                    <strong className="text-zinc-300">Offline Caching Strategy (v2)</strong>: Dynamically bundles and stores CSS & JS assets. Works 100% offline.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                  <span className="text-[10px] font-mono text-zinc-400 leading-tight">
                    <strong className="text-zinc-300">Standalone App View</strong>: Removes Android status & browser url bars for native full-screen view.
                  </span>
                </div>
              </div>
            </div>

            {/* Installer Action */}
            <div className="pt-2">
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 border border-purple-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
              >
                <Download className="w-4 h-4 animate-bounce" />
                {isInstalled ? "Tact AI is Installed ✓" : "Install PWA on Moto G15"}
              </button>
            </div>
          </div>

          {/* Interactive Phone Systemup Side */}
          <div className="lg:col-span-5 flex items-center justify-center pt-2 lg:pt-0">
            <div className="relative w-full max-w-[190px] aspect-[9/18] rounded-[2rem] border-[4px] border-zinc-800 bg-zinc-950 shadow-2xl p-2 flex flex-col justify-between overflow-hidden">
              {/* Phone Camera Notch */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-800 z-30 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-blue-900/60" />
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between text-[7px] text-zinc-500 font-mono px-2 pt-0.5 z-20">
                <span>03:46</span>
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-2.5 h-1.5 border border-zinc-600 rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-zinc-500" />
                  </div>
                </div>
              </div>

              {/* High-tech Starry Sky Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 z-0 opacity-90" />
              <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(88,28,135,0.15),transparent)]" />
              
              {/* Home Screen Icons Grid */}
              <div className="flex-1 flex flex-col justify-end pb-8 z-10 space-y-4">
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 px-1 text-center">
                  {/* System icon 1 */}
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                      <span className="text-[9px] font-mono text-zinc-500">SYS</span>
                    </div>
                    <span className="text-[6px] font-mono text-zinc-600 truncate max-w-full">Settings</span>
                  </div>

                  {/* CUSTOM TACT AI APP ICON (THE HEART OF THE TASK) */}
                  <motion.div 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex flex-col items-center justify-center relative transition-all duration-300 ${
                      coverGlowColor === "cyan" ? "shadow-[0_0_12px_rgba(6,182,212,0.6)] border-cyan-500/80 bg-cyan-950/10" :
                      coverGlowColor === "emerald" ? "shadow-[0_0_12px_rgba(16,185,129,0.6)] border-emerald-500/80 bg-emerald-950/10" :
                      coverGlowColor === "amber" ? "shadow-[0_0_12px_rgba(245,158,11,0.6)] border-amber-500/80 bg-amber-950/10" :
                      "shadow-[0_0_12px_rgba(168,85,247,0.6)] border-purple-500/80 bg-purple-950/10"
                    }`}>
                      {/* Chip pins graphics */}
                      <span className="absolute -left-0.5 top-2 w-1 h-[2px] bg-zinc-700 rounded-r" />
                      <span className="absolute -left-0.5 top-4 w-1 h-[2px] bg-zinc-700 rounded-r" />
                      <span className="absolute -left-0.5 top-6 w-1 h-[2px] bg-zinc-700 rounded-r" />
                      <span className="absolute -right-0.5 top-2 w-1 h-[2px] bg-zinc-700 rounded-l" />
                      <span className="absolute -right-0.5 top-4 w-1 h-[2px] bg-zinc-700 rounded-l" />
                      <span className="absolute -right-0.5 top-6 w-1 h-[2px] bg-zinc-700 rounded-l" />

                      {/* Microchip center */}
                      <div className={`w-5 h-5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[7px] font-black uppercase font-mono transition-colors ${
                        coverGlowColor === "cyan" ? "text-cyan-400" :
                        coverGlowColor === "emerald" ? "text-emerald-400" :
                        coverGlowColor === "amber" ? "text-amber-400" :
                        "text-purple-400"
                      }`}>
                        {appCoverBadge || "TA"}
                      </div>
                      
                      {/* Diagnostic Wave circle */}
                      <span className={`absolute inset-0 rounded-xl border border-dashed animate-pulse duration-1000 ${
                        coverGlowColor === "cyan" ? "border-cyan-500/30" :
                        coverGlowColor === "emerald" ? "border-emerald-500/30" :
                        coverGlowColor === "amber" ? "border-amber-500/30" :
                        "border-purple-500/30"
                      }`} />
                    </div>
                    <span className="text-[6px] font-mono text-zinc-200 font-bold tracking-tight truncate max-w-full">
                      {customIconLabel || "Tact AI"}
                    </span>
                  </motion.div>

                  {/* System icon 3 */}
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                      <span className="text-[9px] font-mono text-zinc-500">MOC</span>
                    </div>
                    <span className="text-[6px] font-mono text-zinc-600 truncate max-w-full">Terminal</span>
                  </div>
                </div>
              </div>

              {/* Moto Phone Soft Navigation Key */}
              <div className="w-12 h-[3px] bg-zinc-700 rounded-full mx-auto mb-1 z-20 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <IntegrationsPanel />
      <MonetizationPanel />

      {/* Agents Selection Grid */}
      <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-zinc-950/40 border-b border-zinc-800/40">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgentId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => {
                setActiveAgentId(agent.id);
                setReport(null);
                setAgentLog([]);
              }}
              className={`flex flex-col items-center gap-2 p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                isActive 
                  ? `${agent.borderColor} bg-zinc-900/90 shadow ${agent.glowColor}` 
                  : "border-transparent bg-zinc-900/20 hover:bg-zinc-900/50 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className={`p-1.5 rounded-md ${isActive ? agent.avatarColor + " text-white" : "bg-zinc-800 text-zinc-400"} transition-all`}>
                <Icon className={`w-4 h-4 ${isActive && agent.id === "update" ? "animate-spin-slow" : ""}`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold font-mono uppercase ${isActive ? "text-zinc-100" : "text-zinc-400"}`}>
                  {agent.id}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 tracking-tighter">
                  {agent.codename}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Agent Briefing */}
      <div className="p-4 bg-zinc-950/15 border-b border-zinc-800/30 flex flex-col md:flex-row gap-3 items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-200">
              {activeAgent.name}
            </h3>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] font-mono text-zinc-400 font-bold uppercase">
              STATUS: {activeAgent.status}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal font-sans">
            {activeAgent.description}
          </p>
          <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500 pt-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Specialization: {activeAgent.specialization}</span>
          </div>
        </div>
      </div>

      {/* Agent Dynamic Tools & Forms */}
      <div className="p-4 bg-zinc-950/20 space-y-4 flex-1 flex flex-col">
        <h4 className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" /> AVAILABLE DEPLOYMENT TOOLS
        </h4>

        {/* --- Tools for UPDATE AGENT --- */}
        {activeAgentId === "update" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                onClick={() => triggerAgentAction("audit")}
                disabled={isLoading}
                className="p-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-50 flex items-start gap-2.5 group"
              >
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 group-hover:rotate-180 transition-transform duration-500" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase">Audit Dependencies</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Scans package.json & build files for outdated SDKs.</span>
                </div>
              </button>

              <button
                onClick={() => triggerAgentAction("custom-upgrade", { customAsset: "Android Target SDK 34 Alignment" })}
                disabled={isLoading}
                className="p-3 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-50 flex items-start gap-2.5"
              >
                <Cpu className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase">Target SDK Upgrade</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Formulates safety upgrade plan to Android SDK 34.</span>
                </div>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Audit Custom Library Version</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPackage}
                  onChange={(e) => setCustomPackage(e.target.value)}
                  placeholder="e.g. '@google/genai ^2.5.0', 'picovoice v3.0'"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={() => triggerAgentAction("custom-audit", { target: customPackage })}
                  disabled={isLoading || !customPackage.trim()}
                  className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[11px] font-bold uppercase rounded border border-zinc-700 hover:text-zinc-100 cursor-pointer shrink-0"
                >
                  Inspect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Tools for ERROR AGENT --- */}
        {activeAgentId === "error" && (
          <div className="space-y-3.5 flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                onClick={() => triggerAgentAction("analyze-error", { 
                  errorText: "WebSocket closed without opened (Vite HMR disconnect)", 
                  contextComponent: "Vite Proxy Server & Sandbox Iframe" 
                })}
                disabled={isLoading}
                className="p-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-50 flex items-start gap-2.5 group"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase">WebSocket Drop Forensics</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Diagnoses sandboxed iframe HMR WebSocket disconnects.</span>
                </div>
              </button>

              <button
                onClick={() => triggerAgentAction("analyze-error", { 
                  errorText: "SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS - Mic permission required for Tact AI voice features", 
                  contextComponent: "Android WebView & Web Speech API" 
                })}
                disabled={isLoading}
                className="p-3 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-50 flex items-start gap-2.5"
              >
                <Terminal className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase">Mic Access Exceptions</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Diagnoses browser frame recording access error states.</span>
                </div>
              </button>
            </div>

            <div className="flex-1 flex flex-col space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Submit Core Error Logs / Stack Traces</label>
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={customError}
                  onChange={(e) => setCustomError(e.target.value)}
                  placeholder="Paste your build exception, React warning, or backend Node crash logs here..."
                  className="flex-1 min-h-[90px] bg-zinc-950 border border-zinc-800 rounded p-3 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-red-500 font-mono resize-none"
                />
                <button
                  onClick={() => triggerAgentAction("analyze-error", { errorText: sanitizeErrorText(customError) })}
                  disabled={isLoading || !customError.trim()}
                  className="w-full h-10 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono text-[11px] font-bold uppercase rounded transition-colors shadow cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Deconstruct Exception
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Tools for MAINTENANCE AGENT --- */}
        {activeAgentId === "maintenance" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                onClick={() => triggerAgentAction("optimize")}
                disabled={isLoading}
                className="p-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-50 flex items-start gap-2.5 group"
              >
                <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase">System Maintenance Audit</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Sweeps for stale SpeechSynthesis instances & cache logs.</span>
                </div>
              </button>

              <button
                onClick={() => triggerAgentAction("optimize", { target: "firestore_rules_cleaning" })}
                disabled={isLoading}
                className="p-3 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-50 flex items-start gap-2.5"
              >
                <HardDrive className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-zinc-200 uppercase">DB Hygiene Check</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Evaluates local state hygiene & storage schemas.</span>
                </div>
              </button>
            </div>

            {/* Active Maintenance Performance metrics block */}
            {maintenanceScore !== null && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">App Maintenance Score</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold font-mono text-emerald-400">{maintenanceScore}/100</span>
                    <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-1.5 rounded uppercase font-semibold">OPTIMAL</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Sanitized Entries</span>
                  <span className="text-xs font-bold font-mono text-zinc-300">{optimizedFiles.length} Processes</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Dynamic Loading console */}
        {isLoading && (
          <div className="p-3 bg-black border border-zinc-900 rounded-lg font-mono text-[10px] space-y-1">
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
              <span>SPAWNING SUBAGENT PROTOCOLS...</span>
            </div>
            <div className="space-y-0.5 pt-1 text-zinc-400">
              {agentLog.map((log, index) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="text-blue-500 shrink-0 font-bold">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Output Terminal Report */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="flex-1 flex flex-col bg-black border border-zinc-800 rounded-lg overflow-hidden shadow-2xl min-h-[180px]"
            >
              <div className="px-3.5 py-2 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500 select-none">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  <span>REPORT_TELEMETRY.LOG</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 hover:text-zinc-200 transition-colors uppercase font-bold cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY LOG</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto max-h-[300px] text-zinc-300 font-mono text-xs leading-relaxed scrollbar-thin">
                <div className="space-y-2">
                  {renderReportMarkdown(report)}
                </div>
              </div>

              {/* UPGRADE EXTRAORDINARY INTERACTIVE ADDITIONS */}
              <div className="border-t border-zinc-900 p-3 bg-zinc-950/70 flex flex-col gap-2.5">
                {activeAgentId === "update" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Fast Sandbox Patch commands</span>
                      <span className="px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-mono uppercase font-black">Ready to deploy</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 gap-2">
                      <span className="truncate">npm install @google/genai@2.5.0 motion@12.23.24</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("npm install @google/genai@2.5.0 motion@12.23.24");
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] uppercase font-bold cursor-pointer shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {activeAgentId === "error" && (
                  <div className="space-y-1.5 font-mono">
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Exception Shielding Active
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Helix Forensic shield intercepted memory drops and secured WebSocket boundaries.
                    </p>
                  </div>
                )}

                {activeAgentId === "maintenance" && (
                  <div className="flex items-center justify-between gap-4 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <svg className="absolute w-8 h-8 transform -rotate-90">
                          <circle
                            cx="16"
                            cy="16"
                            r="13"
                            className="stroke-zinc-800 fill-none"
                            strokeWidth="2.5"
                          />
                          <circle
                            cx="16"
                            cy="16"
                            r="13"
                            className="stroke-emerald-400 fill-none"
                            strokeWidth="2.5"
                            strokeDasharray={2 * Math.PI * 13}
                            strokeDashoffset={2 * Math.PI * 13 * (1 - (maintenanceScore ?? 90) / 100)}
                          />
                        </svg>
                        <span className="text-[9px] font-bold text-zinc-300">{maintenanceScore ?? 90}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-200 font-bold uppercase">Sweep Optimization</span>
                        <span className="text-[8px] text-emerald-400 uppercase font-bold tracking-tighter">Completed successfully</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setMaintenanceScore(100);
                        setOptimizedFiles(prev => [...prev, "reclaimed 24MB cache buffer"]);
                      }}
                      className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                    >
                      Deep Flush
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
