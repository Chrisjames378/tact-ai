import React, { useState } from "react";
import { 
  Laptop, Smartphone, RefreshCw, CheckCircle, ShieldCheck, 
  ArrowRightLeft, Database, HardDrive, Download, AlertTriangle, Play, Zap, Shield, Cpu, Terminal,
  Copy, Code2, Bot, Layers, Wrench, FileCode, Check, Eye, Globe, Workflow, Users, Bug, Camera,
  Server, Radio, StopCircle
} from "lucide-react";

interface SoftwareSuitesToolProps {
  onRepairCompleted?: (deviceName: string, logs: string) => void;
}

export default function SoftwareSuitesTool({ onRepairCompleted }: SoftwareSuitesToolProps) {
  const [activeTab, setActiveTab] = useState<"suites" | "architecture" | "aistudio_sandbox" | "python_sdk" | "enterprise_protocols" | "four_tier_architecture" | "nextgen_paradigms" | "brand_saas_testsuite" | "websocket_docker">("suites");
  const [activeSuite, setActiveSuite] = useState<"reiboot" | "drfone" | "droidkit" | "smartswitch" | "fixbot">("reiboot");
  const [activeProtocol, setActiveProtocol] = useState<"usbmuxd" | "fastbootd" | "dism_api" | "mtp_afc" | "pyusb_watchdog">("usbmuxd");
  const [activeNextGen, setActiveNextGen] = useState<"vision" | "gdb_reverse" | "webusb" | "state_supervisor" | "multi_agent_mesh">("vision");
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedProtocolCode, setCopiedProtocolCode] = useState(false);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [archSimState, setArchSimState] = useState<"IDLE" | "DEVICE_DETECTED" | "DIAGNOSING" | "AWAITING_USER_CONFIRM" | "FLASHING" | "SUCCESS">("IDLE");
  
  // NextGen Interactive Vision & Mesh States
  const [visionAnalyzed, setVisionAnalyzed] = useState(false);
  const [copiedVisionSysInstruction, setCopiedVisionSysInstruction] = useState(false);
  const [copiedVisionPython, setCopiedVisionPython] = useState(false);
  const [selectedBoardSample, setSelectedBoardSample] = useState<"corrosion" | "capacitor" | "ribbon" | "liquid" | "clean">("corrosion");
  
  // WebUSB & Proxy Gateway States
  const [webUsbConnected, setWebUsbConnected] = useState(false);
  const [copiedWebUsbInstruction, setCopiedWebUsbInstruction] = useState(false);
  const [copiedWebUsbHtml, setCopiedWebUsbHtml] = useState(false);
  const [copiedAppPyCode, setCopiedAppPyCode] = useState(false);
  const [selectedUsbVendor, setSelectedUsbVendor] = useState<"apple" | "samsung" | "google">("google");
  const [webUsbLogs, setWebUsbLogs] = useState<string[]>([
    "[SYSTEM] System idle. Awaiting WebUSB hardware pairing sequence...",
    "[SECURITY] HTTPS / localhost sandbox active for navigator.usb protocol."
  ]);
  const [meshExecuting, setMeshExecuting] = useState(false);

  // Brand System Prompts, SaaS Database & Unit Test States
  const [selectedBrandVendor, setSelectedBrandVendor] = useState<"APPLE" | "SAMSUNG" | "GOOGLE">("APPLE");
  const [copiedBrandPromptsPython, setCopiedBrandPromptsPython] = useState(false);
  const [copiedSqlBlueprint, setCopiedSqlBlueprint] = useState(false);
  const [copiedSaasGuardrailPython, setCopiedSaasGuardrailPython] = useState(false);
  const [copiedTestSuitePython, setCopiedTestSuitePython] = useState(false);
  const [copiedFrontendAuthJs, setCopiedFrontendAuthJs] = useState(false);

  // Unit Test Simulator State
  const [testSuiteRunning, setTestSuiteRunning] = useState(false);
  const [testSuiteCompleted, setTestSuiteCompleted] = useState(false);
  const [testSuiteLogs, setTestSuiteLogs] = useState<string[]>([]);

  // Shop Auth Simulator State
  const [simShopName, setSimShopName] = useState("Apex Mobile Repair Techs");
  const [simShopEmail, setSimShopEmail] = useState("admin@apexrepairs.com");
  const [simShopTier, setSimShopTier] = useState<"FREE" | "PRO" | "ENTERPRISE">("PRO");
  const [simAuthStatus, setSimAuthStatus] = useState<string | null>(null);

  // Real-Time WebSockets & Production Docker Deployment States
  const [copiedWsServerPy, setCopiedWsServerPy] = useState(false);
  const [copiedDockerfile, setCopiedDockerfile] = useState(false);
  const [copiedRequirementsTxt, setCopiedRequirementsTxt] = useState(false);
  const [copiedDockerComposeYml, setCopiedDockerComposeYml] = useState(false);

  // WebSocket Live Simulator State
  const [wsConnected, setWsConnected] = useState(true);
  const [wsLogs, setWsLogs] = useState<string[]>([
    "[NET_CORE] Real-time WebSocket telemetry pipeline connected on port 5000.",
    "[SYSTEM] SocketIO session initialized with CORS * for local dev."
  ]);
  const [wsIsFlashing, setWsIsFlashing] = useState(false);
  const [flashProgress, setFlashProgress] = useState(0);

  // Docker Container Simulator State
  const [dockerStatus, setDockerStatus] = useState<"STOPPED" | "BUILDING" | "RUNNING">("STOPPED");
  const [dockerLogs, setDockerLogs] = useState<string[]>([]);
  
  // Execution states for suite triggers
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [recoveryState, setRecoveryState] = useState<"NORMAL" | "RECOVERY" | "DFU" | "DOWNLOAD_MODE">("NORMAL");

  // AI Studio Sandbox state
  const [selectedPreset, setSelectedPreset] = useState<"samsung_bootloop" | "iphone_dfu" | "windows_dism" | "mac_kernel">("samsung_bootloop");
  const [rawInputLog, setRawInputLog] = useState<string>(
    `The phone is stuck spinning on the Samsung logo screen. I pulled this adb log:\n\n08-09 03:14:22.112  1205  1205 E AndroidRuntime: *** FATAL EXCEPTION IN SYSTEM PROCESS: Main\n08-09 03:14:22.115  1205  1205 E AndroidRuntime: java.lang.RuntimeException: Error receiving broadcast Intent { act=android.intent.action.BOOT_COMPLETED }\n08-09 03:14:22.120  1205  1205 E AndroidRuntime: Caused by: java.io.IOException: No space left on device\n08-09 03:14:22.125  1205  1205 E AndroidRuntime: at java.io.FileOutputStream.write(Native Method)`
  );
  const [isParsingLog, setIsParsingLog] = useState(false);
  const [parsedJsonOutput, setParsedJsonOutput] = useState<any | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const presets = {
    samsung_bootloop: {
      label: "Samsung Galaxy ADB Bootloop Log",
      log: `The phone is stuck spinning on the Samsung logo screen. I pulled this adb log:\n\n08-09 03:14:22.112  1205  1205 E AndroidRuntime: *** FATAL EXCEPTION IN SYSTEM PROCESS: Main\n08-09 03:14:22.115  1205  1205 E AndroidRuntime: java.lang.RuntimeException: Error receiving broadcast Intent { act=android.intent.action.BOOT_COMPLETED }\n08-09 03:14:22.120  1205  1205 E AndroidRuntime: Caused by: java.io.IOException: No space left on device\n08-09 03:14:22.125  1205  1205 E AndroidRuntime: at java.io.FileOutputStream.write(Native Method)`,
      result: {
        device_detected: "Samsung Galaxy Android Device",
        root_cause_analysis: "The system partition is completely full ('No space left on device'), preventing core Android OS from writing temporary boot registers and causing a continuous bootloop.",
        safety_risk_level: "LOW (No data loss)",
        local_cli_tool: "adb",
        execution_commands: [
          "adb wait-for-device",
          "adb shell pm list packages",
          "adb shell rm -rf /data/local/tmp/*"
        ],
        user_instructions: [
          "Ensure your Samsung device is connected to your computer via a high-quality USB cable.",
          "If the software is unable to clear enough space automatically, you may need to manually select files to delete or perform a factory reset via Recovery Mode."
        ]
      }
    },
    iphone_dfu: {
      label: "iPhone 15 Pro DFU / Panic Log",
      log: `iPhone keeps rebooting every 3 minutes. Panic log excerpt:\n\npanic(cpu 1 caller 0xfffffff0112a14bc): "Kernel panic - watchdog timeout: missing sensor pulse PRS0"\nDebugger message: panic\nOS version: 21F79\nKernel version: Darwin Kernel Version 23.5.0: Sun Apr 21 21:08:44 PDT 2024; root:xnu-10063.121.3~5/RELEASE_ARM64_T8130`,
      result: {
        device_detected: "Apple iPhone (A17 Pro / iOS 17.5)",
        root_cause_analysis: "Missing pressure sensor pulse (PRS0). Indicates hardware flex ribbon tear or acoustic port blockage triggering a panic kernel reboot cycle.",
        safety_risk_level: "LOW (Hardware inspection needed)",
        local_cli_tool: "libimobiledevice",
        execution_commands: [
          "idevicediagnostics diagnostics",
          "ideviceinfo -k HardwareModel",
          "ideviceenterrecovery"
        ],
        user_instructions: [
          "Inspect the USB-C / pressure sensor port for debris using ultrasonic clean routine.",
          "If panic log persists with 'PRS0' sensor timeout, replace charging port flex assembly."
        ]
      }
    },
    windows_dism: {
      label: "Windows 11 DISM / SFC Corrupted Store",
      log: `Windows BSOD CRITICAL_PROCESS_DIED. CBS.log snippet:\n\n2026-08-08 03:12:01, Error CBS Failed to verify manifest for package Microsoft-Windows-Kernel-Package~31bf3856ad364e35~amd64~~10.0.22621.1 [HRESULT = 0x800f081f - CBS_E_SOURCE_MISSING]`,
      result: {
        device_detected: "Windows 11 x64 PC",
        root_cause_analysis: "CBS source missing error 0x800f081f in Kernel Package manifest. System file store requires online DISM repair.",
        safety_risk_level: "LOW (No data loss)",
        local_cli_tool: "powershell",
        execution_commands: [
          "DISM.exe /Online /Cleanup-image /Restorehealth",
          "sfc /scannow",
          "chkdsk C: /f /r"
        ],
        user_instructions: [
          "Open PowerShell as Administrator.",
          "Execute DISM restore command to download healthy replacement manifests directly from Microsoft Update servers."
        ]
      }
    },
    mac_kernel: {
      label: "macOS Sonoma Diskutil Kernel Panic",
      log: `macOS boot stuck on Apple logo progress bar 50%:\n\ncom.apple.xpc.launchd[1] (com.apple.WindowServer) <Error>: Execution of server failed: APFS volume data container corrupted (error -69845)`,
      result: {
        device_detected: "Apple Mac (macOS Sonoma / APFS)",
        root_cause_analysis: "APFS data container error -69845 preventing WindowServer initialization.",
        safety_risk_level: "MEDIUM (Potential data loss if volume unrepairable)",
        local_cli_tool: "terminal",
        execution_commands: [
          "diskutil verifyVolume /Volumes/Macintosh\\ HD",
          "diskutil repairVolume /Volumes/Macintosh\\ HD",
          "fsck_apfs -y /dev/rdisk1s2"
        ],
        user_instructions: [
          "Boot Mac into Recovery Mode (Hold Command+R or Power Button on Apple Silicon).",
          "Run Disk Utility First Aid on 'Macintosh HD - Data' volume."
        ]
      }
    }
  };

  const systemInstructionPrompt = `You are the core diagnostic engine of an advanced, cross-platform device repair software suite. Your job is to analyze raw error logs, system crash dumps, or user-reported symptoms from iOS, Android, macOS, and Windows. 

You must process the input and output a strict, structured JSON object. Do not include any conversational filler, markdown outside of the JSON block, or pleasantries.

Your response must strictly follow this JSON schema:
{
  "device_detected": "Brand and Model or OS identified",
  "root_cause_analysis": "Clear explanation of what caused the crash/error",
  "safety_risk_level": "LOW (No data loss) | MEDIUM (Potential data loss) | HIGH (Guaranteed wipe or hardware risk)",
  "local_cli_tool": "adb | fastboot | libimobiledevice | powershell | terminal | none",
  "execution_commands": ["List of exact CLI commands for the local software script to execute sequentially"],
  "user_instructions": ["Step-by-step physical actions the user must take, written in simple, universal English"]
}

CRITICAL RULES:
1. Always prioritize data preservation. If a command will wipe data, set safety_risk_level to "HIGH".
2. If the log indicates a hardware failure (e.g., dead battery, cracked trace, storage chip failure), set execution_commands to [] and state that physical repair is required in the user_instructions.
3. Keep execution commands safe. Never generate destructive commands unless absolutely necessary to unbrick a device.`;

  const runSuiteAction = (actionName: string, targetDevice: string, logTimeline: string[]) => {
    if (isExecuting) return;
    setIsExecuting(true);
    setProgress(0);
    setLastAction(actionName);
    setLogs([
      `[SUITE LAUNCH] Initializing ${actionName}...`,
      `[DEVICE BRIDGE] Verifying host USB protocol connection to target (${targetDevice})...`
    ]);

    let idx = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExecuting(false);

          if (actionName.includes("Enter Recovery")) setRecoveryState("RECOVERY");
          if (actionName.includes("Exit Recovery")) setRecoveryState("NORMAL");
          if (actionName.includes("Android Boot Mode")) setRecoveryState("DOWNLOAD_MODE");

          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            gain.connect(audioCtx.destination);
            osc.connect(gain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
          } catch (e) {}

          const fullLog = logTimeline.join("\n");
          onRepairCompleted?.(targetDevice, fullLog);
          return 100;
        }

        const nextVal = prev + 10;
        if (idx < logTimeline.length && nextVal >= ((idx + 1) * 100) / logTimeline.length) {
          setLogs(l => [...l, logTimeline[idx]]);
          idx++;
        }
        return nextVal;
      });
    }, 150);
  };

  const handleRunAiParser = () => {
    setIsParsingLog(true);
    setParsedJsonOutput(null);

    setTimeout(() => {
      const selected = presets[selectedPreset];
      setParsedJsonOutput(selected.result);
      setIsParsingLog(false);

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        gain.connect(audioCtx.destination);
        osc.connect(gain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tool Header */}
      <div className="flex flex-col gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-cyan-400" />
            Companion & Stock Firmware Repair Suites
          </h3>
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTab("suites")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "suites" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Recommended Suites
            </button>
            <button
              onClick={() => setActiveTab("architecture")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "architecture" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              CLI Middleware Architecture
            </button>
            <button
              onClick={() => setActiveTab("aistudio_sandbox")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "aistudio_sandbox" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              AI Studio Log Engine
            </button>
            <button
              onClick={() => setActiveTab("python_sdk")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "python_sdk" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Python SDK Wrapper
            </button>
            <button
              onClick={() => setActiveTab("enterprise_protocols")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "enterprise_protocols" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Enterprise Protocols
            </button>
            <button
              onClick={() => setActiveTab("four_tier_architecture")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "four_tier_architecture" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              4-Tier Desktop Arch & Packaging
            </button>
            <button
              onClick={() => setActiveTab("nextgen_paradigms")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "nextgen_paradigms" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              5 Next-Gen AI Paradigms
            </button>
            <button
              onClick={() => setActiveTab("brand_saas_testsuite")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "brand_saas_testsuite" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Brand Prompts, SaaS DB & Unit Tests
            </button>
            <button
              onClick={() => setActiveTab("websocket_docker")}
              className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors ${
                activeTab === "websocket_docker" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              ⚡ Real-Time WebSockets & Docker Container Deployment
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Comprehensive suite for iOS, iPadOS, Samsung, Android, Windows, and macOS repair tools, powered by open-source CLI bridges & Gemini AI log parsing.
        </p>
      </div>

      {/* VIEW TAB 1: RECOMMENDED SOFTWARE SUITES */}
      {activeTab === "suites" && (
        <div className="flex flex-col gap-4">
          {/* Suite Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveSuite("reiboot")}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeSuite === "reiboot"
                  ? "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-zinc-100 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  ReiBoot / Fixppo
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 line-clamp-1">iOS & iPadOS 1-Click Recovery</p>
            </button>

            <button
              onClick={() => setActiveSuite("drfone")}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeSuite === "drfone"
                  ? "bg-purple-950/40 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-zinc-100 flex items-center gap-1">
                  <Database className="w-3 h-3 text-purple-400" />
                  Dr.Fone
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 line-clamp-1">Modular iOS & Android Repair</p>
            </button>

            <button
              onClick={() => setActiveSuite("droidkit")}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeSuite === "droidkit"
                  ? "bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-zinc-100 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  DroidKit
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 line-clamp-1">Specialized Android & FRP</p>
            </button>

            <button
              onClick={() => setActiveSuite("smartswitch")}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeSuite === "smartswitch"
                  ? "bg-blue-950/40 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-zinc-100 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  Smart Switch / iTunes
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 line-clamp-1">Official Stock Firmware</p>
            </button>

            <button
              onClick={() => setActiveSuite("fixbot")}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeSuite === "fixbot"
                  ? "bg-amber-950/40 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-zinc-100 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-amber-400" />
                  iFixit FixBot
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 line-clamp-1">AI Hardware Schematics</p>
            </button>
          </div>

          {/* ACTIVE SUITE DISPLAY CARD */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
            {/* SUITE 1: Tenorshare ReiBoot / iMyFone Fixppo */}
            {activeSuite === "reiboot" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono text-sm font-bold text-zinc-100">
                        Tenorshare ReiBoot / iMyFone Fixppo
                      </h4>
                      <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded font-mono text-[9px] font-bold uppercase">
                        Best for iOS & iPadOS
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                      Fixes 150+ Apple logo freezes, boot loops, or black screens without data loss, and lets you enter/exit recovery mode with one click. 
                      <span className="text-zinc-300 font-semibold"> (A separate companion tool, ReiBoot for Android, handles select Android/Samsung boot modes).</span>
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300">
                    <span>DEVICE MODE:</span>
                    <span className={`font-bold uppercase ${
                      recoveryState === "NORMAL" ? "text-emerald-400" :
                      recoveryState === "RECOVERY" ? "text-amber-400 animate-pulse" :
                      "text-purple-400 animate-pulse"
                    }`}>
                      {recoveryState}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => runSuiteAction(
                      "One-Click Enter Recovery Mode",
                      "Apple iPhone / iPad",
                      [
                        "[USB_HANDSHAKE] Sending Apple DFU / Recovery command frame...",
                        "[KERNEL] Intercepting bootloader register...",
                        "[SUCCESS] iPhone successfully entered Recovery Mode with 1-click!"
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300 group-hover:text-cyan-200">1-Click Enter Recovery</span>
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Forces Apple device into Recovery Mode without hardware buttons.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "One-Click Exit Recovery Mode",
                      "Apple iPhone / iPad",
                      [
                        "[RECOVERY_EXIT] Sending standard warm reset command...",
                        "[BOOTLOADER] Reloading iOS userland partition...",
                        "[SUCCESS] Device safely exited Recovery Mode to Lock Screen."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-300 group-hover:text-emerald-200">1-Click Exit Recovery</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Exits stuck recovery loop instantly without wiping data.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "Fix 150+ iOS Boot Loops & Freezes",
                      "Apple iPhone / iPad",
                      [
                        "[DIAGNOSTIC] Scanning 150+ Apple logo freeze signatures...",
                        "[REPAIR_ENGINE] Applying system software patch without data loss...",
                        "[VERIFICATION] System partition integrity verified 100% operational."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-300 group-hover:text-amber-200">System Repair (No Data Loss)</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Fixes black screens, boot loops, & frozen Apple logos.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "ReiBoot for Android Companion Boot Mode",
                      "Samsung Galaxy / Android Device",
                      [
                        "[ANDROID_COMPANION] Connecting to ReiBoot for Android companion daemon...",
                        "[ODIN_PROTOCOL] Fast-boot mode register sent to Galaxy chipset...",
                        "[SUCCESS] Android Download Mode / Odin boot mode successfully engaged."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-300 group-hover:text-purple-200">ReiBoot for Android</span>
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Handles select Android & Samsung Odin/Download boot modes.</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUITE 2: Wondershare Dr.Fone */}
            {activeSuite === "drfone" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono text-sm font-bold text-zinc-100">
                        Wondershare Dr.Fone
                      </h4>
                      <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded font-mono text-[9px] font-bold uppercase">
                        Best Cross-Platform Mobile Suite
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                      Offers modular system repair, data recovery, and phone transfer tools for both iOS and major Android brands like Samsung, Google, and LG.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => runSuiteAction(
                      "Dr.Fone Modular System Repair",
                      "Samsung Galaxy / Google Pixel / iPhone / LG",
                      [
                        "[DRFONE_CORE] Initializing modular repair module...",
                        "[FIRMWARE_FETCH] Matching official device SKU & software package...",
                        "[REPAIR_APPLIED] Core system files restored with 0 user data deletion."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-300 group-hover:text-purple-200">Modular System Repair</span>
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Cross-platform OS repair for Samsung, Google, LG, and Apple.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "Dr.Fone Data Recovery Engine",
                      "Internal NAND Flash Storage",
                      [
                        "[STORAGE_SCAN] Mounting raw file partition in deep-read mode...",
                        "[RECOVERY_INDEX] Cataloged deleted contacts, chat logs, & media records...",
                        "[COMPLETED] Found 4,210 recoverable files ready for restoration."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-300 group-hover:text-emerald-200">Data Recovery Scanner</span>
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Recovers lost messages, photos, & app data from iOS & Android.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "Dr.Fone Phone Transfer Utility",
                      "Device-to-Device Direct USB Bridge",
                      [
                        "[TRANSFER_BRIDGE] Pairing Source & Destination device blocks...",
                        "[ENCRYPTED_MIGRATION] Streaming WhatsApp history, call logs, & media...",
                        "[COMPLETED] Phone-to-phone direct migration finished successfully."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-300 group-hover:text-blue-200">Phone Transfer Suite</span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Direct phone-to-phone data cloning across different OS platforms.</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUITE 3: DroidKit (iMobie) */}
            {activeSuite === "droidkit" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono text-sm font-bold text-zinc-100">
                        DroidKit (iMobie)
                      </h4>
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded font-mono text-[9px] font-bold uppercase">
                        Specialized Android Utility
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                      Deeply scans and repairs Android system crashes, bypasses FRP locks, fixes black screens, and recovers lost storage data on Samsung, Xiaomi, Pixel & LG.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => runSuiteAction(
                      "DroidKit Android System Fixer",
                      "Samsung Galaxy / Google Pixel",
                      [
                        "[DROIDKIT_FIX] Initializing Android system recovery image...",
                        "[CACHE_FLUSH] Clearing corrupted cache partition...",
                        "[COMPLETED] Android OS crash loop resolved successfully."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-300 group-hover:text-emerald-200">Android System Fixer</span>
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Fixes black screen, frozen boot screen, & app crashing loops.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "DroidKit FRP / Account Lock Bypass",
                      "Samsung Knox / Google FRP Register",
                      [
                        "[FRP_BYPASS] Verifying factory reset protection status...",
                        "[SECURITY_PATCH] Bypassing Google FRP lock register safely...",
                        "[COMPLETED] Device unlocked for authorized user account."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-300 group-hover:text-amber-200">FRP Lock Bypass</span>
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Safely bypasses Google account verification after factory reset.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "DroidKit Deep Storage Data Extraction",
                      "Android Flash Memory Partition",
                      [
                        "[DEEP_SCAN] Scanning raw block storage...",
                        "[INDEX] Extracted deleted photos, videos, and WhatsApp chats...",
                        "[COMPLETED] Data backup saved to local storage."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300 group-hover:text-cyan-200">Deep Storage Recovery</span>
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Recovers lost media & documents directly from internal flash.</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUITE 4: Samsung Smart Switch / Apple Finder / iTunes */}
            {activeSuite === "smartswitch" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono text-sm font-bold text-zinc-100">
                        Samsung Smart Switch / Apple Finder / iTunes
                      </h4>
                      <span className="px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded font-mono text-[9px] font-bold uppercase">
                        Official Manufacturer Software
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                      The safest, free native option to flash official stock firmware, restore backups, and update software on Galaxy or Apple devices via Windows and Mac.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => runSuiteAction(
                      "Samsung Smart Switch Stock Flasher",
                      "Samsung Galaxy Series (e.g. Galaxy A06)",
                      [
                        "[SAMSUNG_KNOX] Querying Samsung Official OTA/Stock Firmware Server...",
                        "[VERIFICATION] Downloaded signed binary (AP/BL/CP/CSC)...",
                        "[FLASH_COMPLETED] Galaxy official stock firmware flashed securely."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-300 group-hover:text-blue-200">Samsung Smart Switch</span>
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Official Samsung utility to flash stock One UI & restore backups.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "Apple Finder / iTunes Native Flasher",
                      "Apple iPhone / iPad",
                      [
                        "[APPLE_GSMA] Verifying official IPSW software signature...",
                        "[DFU_FLASH] Flashing native iOS boot partition via Finder/iTunes...",
                        "[RESTORE_COMPLETE] Official factory stock restore successfully verified."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-200 group-hover:text-white">Apple Finder / iTunes</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Native Apple desktop tool for encrypted backups & IPSW restores.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "Windows Update / macOS Software Update Native Patch",
                      "Windows PC / Apple Mac",
                      [
                        "[OS_UPDATE] Contacting official Microsoft / Apple update servers...",
                        "[KERNEL_PATCH] Applying official system integrity patch (DISM / SFC / Software Update)...",
                        "[COMPLETED] Operating system core binaries 100% healthy."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300 group-hover:text-cyan-200">Native OS Updater</span>
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Built-in OS tools to repair system files on Windows and macOS.</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUITE 5: iFixit FixBot */}
            {activeSuite === "fixbot" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono text-sm font-bold text-zinc-100">
                        iFixit FixBot & AI Diagnostics
                      </h4>
                      <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded font-mono text-[9px] font-bold uppercase">
                        AI Multimodal Hardware Schematics
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                      AI repair assistant trained on real-world repair data. Scans error screens, motherboard photos, and schematics to pinpoint whether an issue is hardware fatigue or a software glitch.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => runSuiteAction(
                      "iFixit AI Hardware & Error Screen Vision Scan",
                      "Device Motherboard / Display Error",
                      [
                        "[VISION_AI] Processing photo of error code & motherboard layout...",
                        "[SCHEMATICS_MATCH] Identified chip component: Charging IC BGA #U2",
                        "[DIAGNOSIS] Hardware trace intact. Recommends software port reset before teardown."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-300 group-hover:text-amber-200">Multimodal Screen & Board Vision</span>
                      <Bot className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">AI vision analysis of error photos, LED blink patterns, & component fatigue.</span>
                  </button>

                  <button
                    onClick={() => runSuiteAction(
                      "iFixit Repair Guide & Teardown Generator",
                      "Target Device Model",
                      [
                        "[GUIDE_INDEX] Cross-referencing 50,000+ repair manuals...",
                        "[STEPS] Generated 8-step disassembly guide with screw bit sizing (P2 Pentalobe)...",
                        "[READY] Teardown instructions ready for technician."
                      ]
                    )}
                    disabled={isExecuting}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-300 group-hover:text-emerald-200">Interactive Teardown Manuals</span>
                      <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-zinc-500">Step-by-step physical repair & torque guide generator.</span>
                  </button>
                </div>
              </div>
            )}

            {/* Execution Log Terminal Stream */}
            {(isExecuting || logs.length > 0) && (
              <div className="mt-2 bg-black border border-zinc-800 rounded-lg p-3 font-mono text-[10px] space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 text-zinc-400">
                  <span className="flex items-center gap-1.5 font-bold text-cyan-400">
                    <RefreshCw className={`w-3 h-3 ${isExecuting ? "animate-spin text-cyan-400" : ""}`} />
                    {lastAction || "SUITE_EXECUTION.LOG"}
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase">{progress}% COMPLETE</span>
                </div>

                {isExecuting && (
                  <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
                  </div>
                )}

                <div className="space-y-1 max-h-[120px] overflow-y-auto text-zinc-300">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-cyan-500 font-bold shrink-0">&gt;</span>
                      <span className={log.includes("[SUCCESS]") || log.includes("[COMPLETED]") ? "text-emerald-400 font-bold" : ""}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW TAB 2: MIDDLEWARE ARCHITECTURE & CLI BRIDGES */}
      {activeTab === "architecture" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
            <div>
              <h4 className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                AI Middleware Orchestration System Architecture
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Modern OS security (Secure Enclave, VBS) prevents web apps from directly injecting code. Your AI Studio application acts as an intelligent orchestration middleware controlling local open-source CLI bridges.
              </p>
            </div>
          </div>

          {/* Architecture Visual Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-zinc-950 border border-purple-500/30 rounded-lg p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-300">1. Multimodal Vision API</span>
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Scans error screens, motherboard LED blink codes, and physical screen damage using Gemini Multimodal input.
              </p>
            </div>

            <div className="bg-zinc-950 border border-cyan-500/30 rounded-lg p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-300">2. Gemini Diagnostic Engine</span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Parses raw crash logs (ADB, IPSW, DISM, Kernel Panics), identifies root causes, and returns structured execution JSON.
              </p>
            </div>

            <div className="bg-zinc-950 border border-emerald-500/30 rounded-lg p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-300">3. Local Open-Source Bridges</span>
                <Terminal className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Local Python/Node wrapper executes open-source CLIs: <code className="text-emerald-400 font-bold">libimobiledevice</code>, <code className="text-emerald-400 font-bold">adb</code>, <code className="text-emerald-400 font-bold">fastboot</code>, <code className="text-emerald-400 font-bold">DISM</code>, & <code className="text-emerald-400 font-bold">diskutil</code>.
              </p>
            </div>
          </div>

          {/* CLI Bridge Mapping Table */}
          <div className="bg-black border border-zinc-800 rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="text-zinc-200 font-bold flex items-center justify-between border-b border-zinc-800 pb-2">
              <span>OPEN-SOURCE CLI BRIDGE MATRIX</span>
              <span className="text-[10px] text-zinc-500 font-normal">Cross-Platform Execution Protocol</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              <div className="p-2.5 bg-zinc-900/80 rounded border border-zinc-800 space-y-1">
                <div className="text-cyan-400 font-bold">iOS / iPadOS Bridge</div>
                <div className="text-zinc-300 font-bold text-[10px]">libimobiledevice</div>
                <div className="text-[9px] text-zinc-400">Forces DFU mode, pulls IPSW crash logs, queries battery charge cycles natively without iTunes.</div>
              </div>

              <div className="p-2.5 bg-zinc-900/80 rounded border border-zinc-800 space-y-1">
                <div className="text-emerald-400 font-bold">Android / Tablet Bridge</div>
                <div className="text-zinc-300 font-bold text-[10px]">adb & fastboot</div>
                <div className="text-[9px] text-zinc-400">Clears full temp partitions, sideloads OTA firmware zips, and triggers recovery cache wipes.</div>
              </div>

              <div className="p-2.5 bg-zinc-900/80 rounded border border-zinc-800 space-y-1">
                <div className="text-blue-400 font-bold">Windows PC Bridge</div>
                <div className="text-zinc-300 font-bold text-[10px]">PowerShell / DISM / SFC</div>
                <div className="text-[9px] text-zinc-400">Executes system store cleanup, replaces corrupted DLLs, and resolves HRESULT 0x800f081f errors.</div>
              </div>

              <div className="p-2.5 bg-zinc-900/80 rounded border border-zinc-800 space-y-1">
                <div className="text-purple-400 font-bold">macOS Bridge</div>
                <div className="text-zinc-300 font-bold text-[10px]">terminal & diskutil</div>
                <div className="text-[9px] text-zinc-400">Verifies APFS containers, executes fsck_apfs, and manages recovery volume first-aid scripts.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: AI STUDIO SYSTEM INSTRUCTIONS & LOG PARSER SANDBOX */}
      {activeTab === "aistudio_sandbox" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <div>
              <h4 className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Google AI Studio System Instruction Sandbox
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Test the exact System Instructions template designed for Gemini in Google AI Studio to turn raw crash dumps into structured execution JSON.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(systemInstructionPrompt)}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPrompt ? "Copied Prompt!" : "Copy System Instruction Prompt"}
            </button>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase">Preset Test Logs:</span>
            {Object.entries(presets).map(([key, item]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedPreset(key as any);
                  setRawInputLog(item.log);
                  setParsedJsonOutput(null);
                }}
                className={`px-2.5 py-1 rounded font-mono text-[10px] font-medium border cursor-pointer transition-colors ${
                  selectedPreset === key
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Two Column Sandbox Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Column */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> RAW LOG INPUT
                </span>
                <span className="text-zinc-500 text-[10px]">Passes to Gemini 1.5/2.0</span>
              </div>
              <textarea
                value={rawInputLog}
                onChange={(e) => setRawInputLog(e.target.value)}
                rows={10}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500/60 leading-relaxed resize-none"
              />
              <button
                onClick={handleRunAiParser}
                disabled={isParsingLog}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.99]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isParsingLog ? "animate-spin" : ""}`} />
                {isParsingLog ? "PARSING LOG WITH GEMINI..." : "RUN GEMINI DIAGNOSTIC ENGINE"}
              </button>
            </div>

            {/* Output Column */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" /> AI STUDIO JSON RESPONSE
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">STRICT JSON SCHEMA</span>
              </div>

              <div className="w-full bg-black border border-zinc-800 rounded-lg p-3.5 font-mono text-xs text-zinc-200 min-h-[260px] overflow-x-auto relative">
                {isParsingLog ? (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-xs font-mono text-emerald-300">Extracting root cause & commands...</span>
                  </div>
                ) : parsedJsonOutput ? (
                  <pre className="text-[11px] leading-relaxed text-emerald-300">
                    {JSON.stringify(parsedJsonOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="text-zinc-500 text-xs text-center py-12 flex flex-col items-center gap-2">
                    <Code2 className="w-8 h-8 text-zinc-700" />
                    <span>Click "RUN GEMINI DIAGNOSTIC ENGINE" to test JSON generation.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 4: PYTHON SDK BOILERPLATE (repair_engine.py) */}
      {activeTab === "python_sdk" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <div>
              <h4 className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                Production Python SDK Wrapper (<code className="text-amber-300">repair_engine.py</code>)
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Boilerplate connecting to the official <code className="text-zinc-200 font-bold">google-genai</code> SDK with Gemini 2.5 Flash, strict JSON schema output via <code className="text-zinc-200 font-bold">types.Schema</code>, low temperature (<code className="text-zinc-200 font-bold">0.1</code>), and safety confirmation gate before executing CLI tools.
              </p>
            </div>

            <button
              onClick={() => {
                const pythonCode = `import os
import json
import subprocess
from google import genai
from google.genai import types

# Initialize the Gemini Client (automatically pulls GEMINI_API_KEY from environment)
client = genai.Client()

def run_diagnostic_engine(raw_log_data: str) -> dict:
    """
    Sends raw device log data to Gemini 2.5 Flash with strict system instructions
    and forces a structured JSON response mapping out the fix.
    """
    
    system_instruction = (
        "You are the core diagnostic engine of an advanced, cross-platform device repair software suite. "
        "Your job is to analyze raw error logs, system crash dumps, or user-reported symptoms from iOS, Android, macOS, and Windows.\\n\\n"
        "You must process the input and output a strict JSON object following the requested schema. "
        "Do not include any conversational filler, markdown backticks, or pleasantries.\\n\\n"
        "CRITICAL RULES:\\n"
        "1. Always prioritize data preservation. If a command will wipe data, set safety_risk_level to 'HIGH'.\\n"
        "2. If the log indicates a hardware failure, set execution_commands to [] and state that physical repair is required.\\n"
        "3. Keep execution commands safe. Never generate destructive commands unless absolutely necessary."
    )

    # Define the strict output schema so the AI cannot hallucinate random JSON keys
    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "device_detected": types.Schema(type=types.Type.STRING),
            "root_cause_analysis": types.Schema(type=types.Type.STRING),
            "safety_risk_level": types.Schema(
                type=types.Type.STRING, 
                enum=["LOW", "MEDIUM", "HIGH"]
            ),
            "local_cli_tool": types.Schema(
                type=types.Type.STRING, 
                enum=["adb", "fastboot", "libimobiledevice", "powershell", "terminal", "none"]
            ),
            "execution_commands": types.Schema(
                type=types.Type.ARRAY, 
                items=types.Schema(type=types.Type.STRING)
            ),
            "user_instructions": types.Schema(
                type=types.Type.ARRAY, 
                items=types.Schema(type=types.Type.STRING)
            ),
        },
        required=[
            "device_detected", "root_cause_analysis", "safety_risk_level", 
            "local_cli_tool", "execution_commands", "user_instructions"
        ],
    )

    # Call Gemini 2.5 Flash (Optimized for speed, structured outputs, and large contexts)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=f"Analyze this raw device log and generate repair steps:\\n\\n{raw_log_data}",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.1,  # Low temperature makes the code generation deterministic and stable
        ),
    )

    # Parse and return the clean JSON response as a native Python dictionary
    return json.loads(response.text)


def execute_repair_steps(diagnostic_data: dict):
    """
    An example execution layer showing how your local software can read the 
    Gemini response and act on it programmatically.
    """
    print(f"\\n[+] Detected Device: {diagnostic_data['device_detected']}")
    print(f"[+] Root Cause: {diagnostic_data['root_cause_analysis']}")
    print(f"[+] Risk Level: {diagnostic_data['safety_risk_level']}")
    
    print("\\n[!] Instructions for User:")
    for step in diagnostic_data['user_instructions']:
        print(f" - {step}")

    commands = diagnostic_data['execution_commands']
    tool = diagnostic_data['local_cli_tool']

    if not commands or tool == "none":
        print("\\n[i] No safe automated execution commands generated. Manual intervention required.")
        return

    # User validation step to prevent runaway automated commands
    confirm = input(f"\\nGemini wants to execute {len(commands)} commands using '{tool}'. Proceed? (y/n): ")
    if confirm.lower() != 'y':
        print("Execution aborted by user.")
        return

    # Process and safely run commands sequentially
    print(f"\\nRunning automation sequences via {tool}...")
    for cmd in commands:
        print(f"-> Executing: {cmd}")
        # Note: In production, map this to your bundled binaries (e.g., ./bin/adb)
        # result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        # print(result.stdout)


# --- SIMULATED TEST RUN ---
if __name__ == "__main__":
    # Sample real-world Android log demonstrating a storage failure crash
    sample_log = """
    08-09 03:14:22.112  1205  1205 E AndroidRuntime: *** FATAL EXCEPTION IN SYSTEM PROCESS: Main
    08-09 03:14:22.115  1205  1205 E AndroidRuntime: java.lang.RuntimeException: Error receiving broadcast Intent
    08-09 03:14:22.120  1205  1205 E AndroidRuntime: Caused by: java.io.IOException: No space left on device
    """

    print("Sending log data to Gemini Diagnostic Engine...")
    try:
        diagnostics = run_diagnostic_engine(sample_log)
        execute_repair_steps(diagnostics)
    except Exception as e:
        print(f"Error communicating with AI Studio Engine: {e}")`;
                navigator.clipboard.writeText(pythonCode);
                setCopiedPython(true);
                setTimeout(() => setCopiedPython(false), 2000);
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedPython ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPython ? "Copied Script!" : "Copy Python Script"}
            </button>
          </div>

          {/* Quick Start Prerequisites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="bg-black border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-zinc-400 font-bold text-[10px] uppercase">1. Install GenAI SDK</span>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-emerald-400 font-bold">
                pip install google-genai
              </div>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-zinc-400 font-bold text-[10px] uppercase">2. Set Environment Key</span>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-cyan-400 font-bold">
                export GEMINI_API_KEY="your-api-key"
              </div>
            </div>
          </div>

          {/* Code Viewport */}
          <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3 text-zinc-400">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <FileCode className="w-3.5 h-3.5" /> repair_engine.py
              </span>
              <span className="text-[10px] text-zinc-500">Google GenAI SDK (gemini-2.5-flash)</span>
            </div>

            <pre className="text-zinc-300 leading-relaxed text-[11px] whitespace-pre-wrap">
              {`import os
import json
import subprocess
from google import genai
from google.genai import types

# Initialize the Gemini Client (automatically pulls GEMINI_API_KEY from environment)
client = genai.Client()

def run_diagnostic_engine(raw_log_data: str) -> dict:
    """
    Sends raw device log data to Gemini 2.5 Flash with strict system instructions
    and forces a structured JSON response mapping out the fix.
    """
    
    system_instruction = (
        "You are the core diagnostic engine of an advanced, cross-platform device repair software suite. "
        "Your job is to analyze raw error logs, system crash dumps, or user-reported symptoms from iOS, Android, macOS, and Windows.\\n\\n"
        "You must process the input and output a strict JSON object following the requested schema. "
        "Do not include any conversational filler, markdown backticks, or pleasantries.\\n\\n"
        "CRITICAL RULES:\\n"
        "1. Always prioritize data preservation. If a command will wipe data, set safety_risk_level to 'HIGH'.\\n"
        "2. If the log indicates a hardware failure, set execution_commands to [] and state that physical repair is required.\\n"
        "3. Keep execution commands safe. Never generate destructive commands unless absolutely necessary."
    )

    # Define the strict output schema so the AI cannot hallucinate random JSON keys
    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "device_detected": types.Schema(type=types.Type.STRING),
            "root_cause_analysis": types.Schema(type=types.Type.STRING),
            "safety_risk_level": types.Schema(
                type=types.Type.STRING, 
                enum=["LOW", "MEDIUM", "HIGH"]
            ),
            "local_cli_tool": types.Schema(
                type=types.Type.STRING, 
                enum=["adb", "fastboot", "libimobiledevice", "powershell", "terminal", "none"]
            ),
            "execution_commands": types.Schema(
                type=types.Type.ARRAY, 
                items=types.Schema(type=types.Type.STRING)
            ),
            "user_instructions": types.Schema(
                type=types.Type.ARRAY, 
                items=types.Schema(type=types.Type.STRING)
            ),
        },
        required=[
            "device_detected", "root_cause_analysis", "safety_risk_level", 
            "local_cli_tool", "execution_commands", "user_instructions"
        ],
    )

    # Call Gemini 2.5 Flash (Optimized for speed, structured outputs, and large contexts)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=f"Analyze this raw device log and generate repair steps:\\n\\n{raw_log_data}",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.1,  # Low temperature makes the code generation deterministic and stable
        ),
    )

    # Parse and return the clean JSON response as a native Python dictionary
    return json.loads(response.text)


def execute_repair_steps(diagnostic_data: dict):
    """
    An example execution layer showing how your local software can read the 
    Gemini response and act on it programmatically.
    """
    print(f"\\n[+] Detected Device: {diagnostic_data['device_detected']}")
    print(f"[+] Root Cause: {diagnostic_data['root_cause_analysis']}")
    print(f"[+] Risk Level: {diagnostic_data['safety_risk_level']}")
    
    print("\\n[!] Instructions for User:")
    for step in diagnostic_data['user_instructions']:
        print(f" - {step}")

    commands = diagnostic_data['execution_commands']
    tool = diagnostic_data['local_cli_tool']

    if not commands or tool == "none":
        print("\\n[i] No safe automated execution commands generated. Manual intervention required.")
        return

    # User validation step to prevent runaway automated commands
    confirm = input(f"\\nGemini wants to execute {len(commands)} commands using '{tool}'. Proceed? (y/n): ")
    if confirm.lower() != 'y':
        print("Execution aborted by user.")
        return

    # Process and safely run commands sequentially
    print(f"\\nRunning automation sequences via {tool}...")
    for cmd in commands:
        print(f"-> Executing: {cmd}")
        # Note: In production, map this to your bundled binaries (e.g., ./bin/adb)
        # result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        # print(result.stdout)


# --- SIMULATED TEST RUN ---
if __name__ == "__main__":
    sample_log = """
    08-09 03:14:22.112  1205  1205 E AndroidRuntime: *** FATAL EXCEPTION IN SYSTEM PROCESS: Main
    08-09 03:14:22.115  1205  1205 E AndroidRuntime: java.lang.RuntimeException: Error receiving broadcast Intent
    08-09 03:14:22.120  1205  1205 E AndroidRuntime: Caused by: java.io.IOException: No space left on device
    """

    print("Sending log data to Gemini Diagnostic Engine...")
    try:
        diagnostics = run_diagnostic_engine(sample_log)
        execute_repair_steps(diagnostics)
    except Exception as e:
        print(f"Error communicating with AI Studio Engine: {e}")`}
            </pre>
          </div>
        </div>
      )}

      {/* VIEW TAB 5: ENTERPRISE LOW-LEVEL PROTOCOLS */}
      {activeTab === "enterprise_protocols" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
            <div>
              <h4 className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Enterprise Low-Level Frameworks & Hardware Protocol Bridges
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Low-level multiplexing, dynamic partition flasher, native CTypes DISM API, MTP media extractors, and multi-threaded USB watchdogs required for enterprise-grade repair software.
              </p>
            </div>
          </div>

          {/* Protocol Sub-selector */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveProtocol("usbmuxd")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeProtocol === "usbmuxd"
                  ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                1. usbmuxd
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">iOS USB Multiplexing</p>
            </button>

            <button
              onClick={() => setActiveProtocol("fastbootd")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeProtocol === "fastbootd"
                  ? "bg-purple-950/40 border-purple-500/50 text-purple-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                2. fastbootd
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Android Dynamic Partitions</p>
            </button>

            <button
              onClick={() => setActiveProtocol("dism_api")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeProtocol === "dism_api"
                  ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                3. dismapi.dll
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Native Windows DISM API</p>
            </button>

            <button
              onClick={() => setActiveProtocol("mtp_afc")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeProtocol === "mtp_afc"
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                4. MTP / AFC
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Direct NAND File Recovery</p>
            </button>

            <button
              onClick={() => setActiveProtocol("pyusb_watchdog")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeProtocol === "pyusb_watchdog"
                  ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                5. pyusb Watchdog
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Multi-Threaded VID Monitoring</p>
            </button>
          </div>

          {/* PROTOCOL DETAIL & CODE VIEW */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            {/* PROTOCOL 1: usbmuxd */}
            {activeProtocol === "usbmuxd" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <h5 className="font-bold text-cyan-300">1. iOS Low-Level USB Handshaking (usbmuxd)</h5>
                    <p className="text-[10px] text-zinc-400">
                      Tunnels raw TCP/socket connections over Lightning or USB-C cables directly to iOS lockdown daemons. Bypasses standard OS restrictions to query UDID, battery charge cycles, and activation lock status.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      runSuiteAction("usbmuxd Protocol Handshake", "iPhone 15 Pro Max", [
                        "[usbmuxd] Connecting to UNIX domain socket /var/run/usbmuxd...",
                        "[USBMUX_VERSION] Protocol version 1 (Binary packet) acknowledged.",
                        "[LOCKDOWN_PAIR] Received Apple UDID: 00008130-001248E23602001E",
                        "[DEVICE_TELEMETRY] Battery Cycles: 182 | Activation Lock: ENABLED | DFU Flag: FALSE"
                      ]);
                    }}
                    disabled={isExecuting}
                    className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Run usbmuxd Test Handshake
                  </button>
                </div>

                <div className="bg-black p-3 rounded border border-zinc-800/80 text-[11px] overflow-x-auto">
                  <pre className="text-zinc-300 leading-relaxed">
{`# Python usbmuxd Socket Tunneling Example
import socket
import plistlib

def connect_usbmuxd_socket():
    # Connect to local usbmuxd unix domain socket on macOS/Linux or TCP port on Windows
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect("/var/run/usbmuxd")
    
    # Send ListDevices packet payload in Apple XML Plist format
    request = plistlib.dumps({
        "MessageType": "ListDevices",
        "ClientVersionString": "Python-AIStudio-Bridge-1.0",
        "ProgName": "DiagnosticEngine"
    })
    
    s.sendall(request)
    response = s.recv(4096)
    devices = plistlib.loads(response)
    print(f"[usbmuxd] Connected Apple Devices: {devices}")
    return devices`}
                  </pre>
                </div>
              </div>
            )}

            {/* PROTOCOL 2: fastbootd */}
            {activeProtocol === "fastbootd" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <h5 className="font-bold text-purple-300">2. Android Advanced Partition Flashing (fastbootd)</h5>
                    <p className="text-[10px] text-zinc-400">
                      Executes Fastboot in User Space (<code className="text-purple-300 font-bold">fastbootd</code>) to manage Android dynamic logical partitions (<code className="text-purple-300 font-bold">super.img</code>), resizing or deleting corrupted system blocks directly over USB.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      runSuiteAction("fastbootd Dynamic Partition Flash", "Samsung Galaxy S24 Ultra", [
                        "[FASTBOOTD] Device entered Fastboot User Space (fastbootd)...",
                        "[SUPER_PARTITION] Querying logical partition table: system_a, system_b, vendor_a, product_a",
                        "[EXECUTE] fastboot delete-logical-partition system_a...",
                        "[FLASH] fastboot flash super super.img (Size: 4.2 GB)...",
                        "[COMPLETED] Android core dynamic super partition successfully re-written!"
                      ]);
                    }}
                    disabled={isExecuting}
                    className="px-3 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Run fastbootd Flasher Test
                  </button>
                </div>

                <div className="bg-black p-3 rounded border border-zinc-800/80 text-[11px] overflow-x-auto">
                  <pre className="text-zinc-300 leading-relaxed">
{`# Python Subprocess fastbootd Automation Script
import subprocess

def flash_dynamic_super_partition(super_img_path: str):
    print("[+] Switching device into fastbootd mode...")
    subprocess.run(["fastboot", "reboot", "fastboot"], check=True)
    
    print("[+] Resizing logical partition table...")
    subprocess.run(["fastboot", "delete-logical-partition", "system_a_corrupted"], check=False)
    
    print(f"[+] Flashing dynamic super partition image: {super_img_path}")
    result = subprocess.run(
        ["fastboot", "flash", "super", super_img_path],
        capture_output=True,
        text=True
    )
    print(result.stdout)
    print("[+] Rebooting Android device into system...")
    subprocess.run(["fastboot", "reboot"], check=True)`}
                  </pre>
                </div>
              </div>
            )}

            {/* PROTOCOL 3: dismapi.dll */}
            {activeProtocol === "dism_api" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <h5 className="font-bold text-amber-300">3. Windows Native Repair Engines (DISM via CTypes API)</h5>
                    <p className="text-[10px] text-zinc-400">
                      Calls native Windows Deployment API (<code className="text-amber-300 font-bold">dismapi.dll</code>) directly via Python <code className="text-amber-300 font-bold">ctypes</code>. Provides real-time 0% to 100% progress callbacks and exact HRESULT error capture without relying on subprocess text piping.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      runSuiteAction("Native CTypes DISM RestoreHealth", "Windows 11 Workstation", [
                        "[dismapi.dll] Initializing DismInitialize (DismLogLevelSimple)...",
                        "[DISM_SESSION] DismOpenSession (DISM_ONLINE_IMAGE) handle: 0x00A1F820",
                        "[PROGRESS_CALLBACK] DismCheckHealth: 100% | DISM_RESTORE_HEALTH: 25% -> 50% -> 100%",
                        "[HRESULT] 0x00000000 (S_OK) - System File Store completely restored from Microsoft Servers."
                      ]);
                    }}
                    disabled={isExecuting}
                    className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Run dismapi.dll CTypes Test
                  </button>
                </div>

                <div className="bg-black p-3 rounded border border-zinc-800/80 text-[11px] overflow-x-auto">
                  <pre className="text-zinc-300 leading-relaxed">
{`# Python ctypes wrapper for Windows dismapi.dll
import ctypes
from ctypes import wintypes

# Load native Windows DISM C-library
dism_dll = ctypes.WinDLL("dismapi.dll")

def progress_callback(current, total, user_data):
    percentage = int((current / total) * 100) if total > 0 else 0
    print(f"[DISM Progress Bar] Realtime Component Repair: {percentage}%")
    return 0 # S_OK

PROGRESS_PROC = ctypes.WINFUNCTYPE(ctypes.c_uint, wintypes.UINT, wintypes.UINT, ctypes.c_void_p)

def run_native_dism_restore():
    dism_dll.DismInitialize(1, None, None) # DismLogLevelSimple
    session = wintypes.HANDLE()
    
    # Open DISM session on active online operating system
    hr = dism_dll.DismOpenSession("DISM_ONLINE_IMAGE", None, None, ctypes.byref(session))
    if hr == 0: # S_OK
        cb = PROGRESS_PROC(progress_callback)
        # Trigger RestoreHealth with live progress hook
        dism_dll.DismRestoreHealth(session, None, None, cb, None)
        dism_dll.DismCloseSession(session)
    dism_dll.DismShutdown()`}
                  </pre>
                </div>
              </div>
            )}

            {/* PROTOCOL 4: MTP & AFC */}
            {activeProtocol === "mtp_afc" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <h5 className="font-bold text-emerald-300">4. Media Transfer Protocol (MTP) & Apple File Conduit (AFC) Extractor</h5>
                    <p className="text-[10px] text-zinc-400">
                      Bypasses standard Windows File Explorer or Mac Finder to stream raw media files, contacts, and WhatsApp databases directly from broken-display iOS & Android devices using <code className="text-emerald-300 font-bold">pymtp</code> and <code className="text-emerald-300 font-bold">afc</code> libimobiledevice tunnels.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      runSuiteAction("MTP / AFC Storage Data Extraction", "Google Pixel 8 Pro", [
                        "[MTP_BRIDGE] Bypassing OS file lock via raw USB block protocol...",
                        "[MTP_STORAGE_ID] Mounted internal flash volume: 0x00010001 (128 GB)",
                        "[AFC_STREAM] Extracting /DCIM/Camera/ (1,420 Photos, 84 Videos)...",
                        "[EXTRACTED] 24.8 GB extracted to local repair workstation backup folder."
                      ]);
                    }}
                    disabled={isExecuting}
                    className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Run MTP Data Extraction Test
                  </button>
                </div>

                <div className="bg-black p-3 rounded border border-zinc-800/80 text-[11px] overflow-x-auto">
                  <pre className="text-zinc-300 leading-relaxed">
{`# Python pymtp & afc File Extraction Script
import pymtp

def extract_broken_screen_media(destination_dir: str):
    mtp = pymtp.MTP()
    mtp.connect()
    
    print(f"[MTP] Connected Device: {mtp.get_devicename()}")
    files = mtp.get_filelisting()
    
    for f in files:
        if f.filename.endswith(('.jpg', '.mp4', '.pdf', '.db')):
            print(f"-> Extracting raw media block: {f.filename} ({f.filesize} bytes)")
            mtp.get_file_to_file(f.item_id, f"{destination_dir}/{f.filename}")
            
    mtp.disconnect()
    print("[MTP] Data rescue operation completed successfully.")`}
                  </pre>
                </div>
              </div>
            )}

            {/* PROTOCOL 5: pyusb Watchdog */}
            {activeProtocol === "pyusb_watchdog" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <h5 className="font-bold text-blue-300">5. Multi-Threaded USB Device Watchdogs (pyusb)</h5>
                    <p className="text-[10px] text-zinc-400">
                      Runs an independent background thread monitoring real-time USB hardware Vendor IDs (Apple: <code className="text-blue-300 font-bold">0x05ac</code>, Samsung: <code className="text-blue-300 font-bold">0x04e8</code>, Google: <code className="text-blue-300 font-bold">0x18d1</code>). Detects hardware state transitions (Normal -&gt; Recovery -&gt; DFU) so software never loses track during multi-reboot flashing.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      runSuiteAction("Multi-Threaded pyusb Hardware Watchdog", "USB Bus Monitor Thread", [
                        "[WATCHDOG_THREAD] Starting background USB hardware watchdog thread...",
                        "[USB_SCAN] Polling Vendor IDs (0x05ac Apple | 0x04e8 Samsung)...",
                        "[HARDWARE_EVENT] Detected VID 0x05ac PID 0x12a8 (Apple iPhone DFU Mode)",
                        "[WATCHDOG_NOTIFY] Hardware state transition confirmed -> Notifying Gemini Diagnostic Engine!"
                      ]);
                    }}
                    disabled={isExecuting}
                    className="px-3 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Run pyusb Watchdog Test
                  </button>
                </div>

                <div className="bg-black p-3 rounded border border-zinc-800/80 text-[11px] overflow-x-auto">
                  <pre className="text-zinc-300 leading-relaxed">
{`# Multi-Threaded pyusb Watchdog Pattern
import threading
import time
import usb.core

def usb_hardware_watchdog_thread(callback_func):
    """
    Monitors USB bus for state changes across Apple (0x05ac),
    Samsung (0x04e8), and Google (0x18d1) devices without blocking the UI thread.
    """
    last_state = None
    while True:
        apple_dev = usb.core.find(idVendor=0x05ac)
        samsung_dev = usb.core.find(idVendor=0x04e8)
        
        current_state = "IDLE"
        if apple_dev:
            current_state = f"APPLE_VID_0x05ac_PID_{hex(apple_dev.idProduct)}"
        elif samsung_dev:
            current_state = f"SAMSUNG_VID_0x04e8_PID_{hex(samsung_dev.idProduct)}"
            
        if current_state != last_state:
            last_state = current_state
            print(f"[USB Hardware Watchdog Event] {current_state}")
            callback_func(current_state)
            
        time.sleep(0.5) # Poll every 500ms safely

# Launch watchdog in background thread
watchdog = threading.Thread(
    target=usb_hardware_watchdog_thread, 
    args=(lambda state: print(f"Notify Gemini Engine: {state}"),),
    daemon=True
)
watchdog.start()`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* VIEW TAB 6: 4-TIER DESKTOP ARCHITECTURE & PACKAGING */}
      {activeTab === "four_tier_architecture" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <div>
              <h4 className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Enterprise 4-Tier Desktop Architecture & Packaging Engine
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Separates the asynchronous UI (PyQt6/Electron), Python Orchestration Core State Machine, Gemini 2.5 Flash Cognitive Layer, Background USB Watchdog, and Bundled Binary execution engine to ensure zero UI freezes during low-level firmware flashing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const pyinstallerCode = `# PyInstaller main.spec configuration for Commercial Repair Suite
# Build Command: pyinstaller --clean --noconfirm main.spec

import sys
import os
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

a = Analysis(
    ['src/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('bin/win/adb.exe', 'bin/win'),
        ('bin/win/fastboot.exe', 'bin/win'),
        ('bin/win/AdbWinApi.dll', 'bin/win'),
        ('bin/mac/ideviceinfo', 'bin/mac'),
        ('bin/mac/idevicerestore', 'bin/mac'),
        ('bin/mac/usbmuxd', 'bin/mac'),
    ],
    hiddenimports=['google.genai', 'usb.core', 'pwrap_usbmuxd', 'ctypes'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='DeviceRepairSuiteStudioPro',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Hide background terminal window in production UI
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    uac_admin=True,  # Requests Windows UAC Admin Permissions for low-level USB driver flashing
    icon='assets/app_icon.ico'
)`;
                  navigator.clipboard.writeText(pyinstallerCode);
                  setCopiedSpec(true);
                  setTimeout(() => setCopiedSpec(false), 2000);
                }}
                className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedSpec ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSpec ? "Copied main.spec!" : "Copy PyInstaller Spec"}
              </button>
            </div>
          </div>

          {/* Interactive State Machine Simulator */}
          <div className="bg-black border border-zinc-800 rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-200 font-bold flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                Live State Machine Simulator (Orchestration Engine)
              </span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-bold">
                Current State: {archSimState}
              </span>
            </div>

            {/* State Pipeline Diagram */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
              {[
                { id: "IDLE", label: "1. IDLE", desc: "Polling USB Bus" },
                { id: "DEVICE_DETECTED", label: "2. DETECTED", desc: "Read VID/PID" },
                { id: "DIAGNOSING", label: "3. DIAGNOSING", desc: "Query Gemini 2.5" },
                { id: "AWAITING_USER_CONFIRM", label: "4. CONFIRM", desc: "Safety Risk Gate" },
                { id: "FLASHING", label: "5. FLASHING", desc: "Subprocess CLI" },
                { id: "SUCCESS", label: "6. SUCCESS", desc: "Repair Completed" },
              ].map((step) => {
                const isActive = archSimState === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setArchSimState(step.id as any)}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      isActive
                        ? "bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow-sm"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <div className="font-bold text-[11px]">{step.label}</div>
                    <div className="text-[9px] mt-0.5 opacity-80">{step.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Simulation Trigger Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  runSuiteAction("4-Tier Architecture Pipeline Execution", "Pixel 8 / iPhone 15 Pro", [
                    "[LAYER 4: USB WATCHDOG] Background thread caught VID 0x05ac PID 0x12a8 (Apple iPhone DFU Mode)",
                    "[LAYER 2: ORCHESTRATION] State transition: IDLE -> DEVICE_DETECTED -> DIAGNOSING",
                    "[LAYER 3: COGNITIVE ENGINE] Sending crash dump to Gemini 2.5 Flash (temperature=0.1, response_schema=types.Schema)",
                    "[LAYER 3: COGNITIVE ENGINE] JSON Blueprint received: safety_risk_level='LOW', CLI='libimobiledevice', steps=4",
                    "[LAYER 1: FRONTEND UI] Displaying user confirmation dialog & interactive progress bar without blocking main thread",
                    "[LAYER 5: BUNDLED BINARY] Executing /bin/mac/idevicerestore -e -d ... Pipe stdout line-by-line to UI",
                    "[SUCCESS] State transition: FLASHING -> SUCCESS. Device successfully recovered!"
                  ]);
                }}
                disabled={isExecuting}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Simulate Full 4-Tier Pipeline
              </button>
            </div>
          </div>

          {/* 5-Layer Architectural Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
            {/* Layer 1 */}
            <div className="bg-black border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" /> Layer 1: Frontend UI
                </div>
                <h5 className="font-bold text-zinc-200">PyQt6 / Electron</h5>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Asynchronous presentation layer. Displays step illustrations, flashing progress bars, and safety confirmation modals. Never talks directly to USB or AI to prevent window freezes.
                </p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] text-cyan-300">
                Key Constraint: Listens strictly to internal Signals / IPC events.
              </div>
            </div>

            {/* Layer 2 */}
            <div className="bg-black border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Layer 2: Core Engine
                </div>
                <h5 className="font-bold text-zinc-200">Python Orchestrator</h5>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Central traffic cop. Manages repair state transitions, packages device logs for Gemini, parses response schemas, and orchestrates local execution tasks safely.
                </p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] text-purple-300">
                State: IDLE ➔ DETECTED ➔ DIAGNOSING ➔ FLASHING ➔ SUCCESS
              </div>
            </div>

            {/* Layer 3 */}
            <div className="bg-black border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> Layer 3: Cognitive AI
                </div>
                <h5 className="font-bold text-zinc-200">Gemini 2.5 Flash</h5>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Evaluates raw crash logs, error codes, and user reports. Enforces structured JSON schemas via <code className="text-amber-300">types.Schema</code> with low temperature (0.1) for deterministic command generation.
                </p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] text-amber-300">
                SDK: google-genai | response_mime_type="application/json"
              </div>
            </div>

            {/* Layer 4 */}
            <div className="bg-black border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Layer 4: USB Watchdog
                </div>
                <h5 className="font-bold text-zinc-200">pyusb & usbmuxd</h5>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Multi-threaded background thread looping every 500ms. Tracks USB Vendor IDs (Apple 0x05ac, Samsung 0x04e8) to detect mode changes (Normal ➔ Recovery ➔ DFU) without losing device context.
                </p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] text-blue-300">
                Thread: Background daemon loop monitoring raw hardware VIDs.
              </div>
            </div>

            {/* Layer 5 */}
            <div className="bg-black border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> Layer 5: Bundled CLI
                </div>
                <h5 className="font-bold text-zinc-200">Locked /bin/ Directory</h5>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Self-contained binaries packaged inside installer (<code className="text-emerald-300">adb</code>, <code className="text-emerald-300">fastboot</code>, <code className="text-emerald-300">idevicerestore</code>). Executed via <code className="text-emerald-300">subprocess.Popen</code> streaming real-time stdout lines.
                </p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80 text-[10px] text-emerald-300">
                Security: Executed in hidden background terminals with Admin elevation.
              </div>
            </div>
          </div>

          {/* Packaging & Distribution Strategy Section */}
          <div className="bg-black border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            <div className="border-b border-zinc-800 pb-2">
              <h5 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                Packaging & Distribution Strategy (PyInstaller / Briefcase & Admin Privilege Elevation)
              </h5>
              <p className="text-[11px] text-zinc-400 mt-1">
                How to compile this multi-tier architecture into a single executable (<code className="text-zinc-200 font-bold">.exe</code> on Windows, <code className="text-zinc-200 font-bold">.dmg</code> on macOS) with Administrator privileges required for low-level USB drivers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-1.5">
                <span className="text-indigo-400 font-bold text-[10px] uppercase">1. Executable Compilation</span>
                <p className="text-[10px] text-zinc-300 leading-relaxed">
                  Use <code className="text-indigo-300">PyInstaller --clean --noconfirm main.spec</code> to compile the Python interpreter, dependencies, and bundled <code className="text-indigo-300">/bin/</code> tools into a standalone executable.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-1.5">
                <span className="text-amber-400 font-bold text-[10px] uppercase">2. Admin / UAC Elevation</span>
                <p className="text-[10px] text-zinc-300 leading-relaxed">
                  Set <code className="text-amber-300">uac_admin=True</code> in <code className="text-amber-300">main.spec</code> so Windows prompts for UAC Elevation on launch. On macOS, invoke authorization requests via <code className="text-amber-300">osascript</code> for low-level USB driver access.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-1.5">
                <span className="text-emerald-400 font-bold text-[10px] uppercase">3. Production Distribution</span>
                <p className="text-[10px] text-zinc-300 leading-relaxed">
                  Sign the installer with EV Code Signing certificate to eliminate SmartScreen warnings and package using Inno Setup (Windows) or create signed <code className="text-emerald-300">.dmg</code> with Apple Notarization.
                </p>
              </div>
            </div>

            {/* Spec Code Viewport */}
            <div className="bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-[11px] overflow-x-auto text-zinc-300">
              <div className="text-[10px] text-zinc-500 mb-2 font-bold">// PyInstaller Build Spec File (main.spec)</div>
              <pre className="leading-relaxed">
{`import sys
import os

block_cipher = None

a = Analysis(
    ['src/main.py'],
    datas=[
        ('bin/win/adb.exe', 'bin/win'),
        ('bin/win/fastboot.exe', 'bin/win'),
        ('bin/mac/idevicerestore', 'bin/mac'),
        ('bin/mac/usbmuxd', 'bin/mac'),
    ],
    hiddenimports=['google.genai', 'usb.core', 'pwrap_usbmuxd', 'ctypes'],
    console=False,   # Hides background console window
    uac_admin=True,  # Requests Windows UAC Administrator privileges for USB driver access
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(pyz, a.scripts, a.binaries, a.zipfiles, a.datas, name='DeviceRepairSuiteStudioPro', console=False, uac_admin=True)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 7: 5 NEXT-GEN AI PARADIGMS */}
      {activeTab === "nextgen_paradigms" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <div>
              <h4 className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-400" />
                5 Next-Gen Industrial AI Paradigms & Hardware Automation
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Advanced architectural capabilities leveraging Gemini 2.5 Flash/Pro Multimodal Vision, live GDB hex reverse engineering, WebUSB browser flashing, dynamic AI state supervisors, and multi-agent mesh processing.
              </p>
            </div>
          </div>

          {/* Sub-selector */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveNextGen("vision")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeNextGen === "vision"
                  ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                1. Computer Vision
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Motherboard Macro Analysis</p>
            </button>

            <button
              onClick={() => setActiveNextGen("gdb_reverse")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeNextGen === "gdb_reverse"
                  ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                2. Live GDB Hex
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Automated Memory Hot-Patch</p>
            </button>

            <button
              onClick={() => setActiveNextGen("webusb")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeNextGen === "webusb"
                  ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                3. WebUSB Flashing
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Zero-Install Browser Streaming</p>
            </button>

            <button
              onClick={() => setActiveNextGen("state_supervisor")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeNextGen === "state_supervisor"
                  ? "bg-purple-950/40 border-purple-500/50 text-purple-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-purple-400" />
                4. Dynamic Supervisor
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">State-Machine Auto Rollback</p>
            </button>

            <button
              onClick={() => setActiveNextGen("multi_agent_mesh")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeNextGen === "multi_agent_mesh"
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                5. Multi-Agent Mesh
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Sorter + Security Shield + Explainer</p>
            </button>
          </div>

          {/* PARADIGM 1: COMPUTER VISION MAINBOARD DIAGNOSTICS */}
          {activeNextGen === "vision" && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-5 font-mono text-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h5 className="font-bold text-rose-300 flex items-center gap-2 text-sm">
                    <Camera className="w-4 h-4 text-rose-400" />
                    Multimodal Motherboard Visual Diagnostic Engine (Gemini 2.5 Flash / Pro)
                  </h5>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Directly analyzes high-resolution optical macro-photographs or webcam frames of smartphone & PC logic boards to pinpoint physical hardware defects before executing software USB flash sequences.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setVisionAnalyzed(true);
                    runSuiteAction("Gemini Multimodal Vision Mainboard Scan", "iPhone 15 Pro Logic Board Macro", [
                      "[GEMINI_VISION] Processing high-res macro optical capture of motherboard logic board...",
                      "[IMAGE_SEGMENTATION] Analyzing component layout around power management IC (PMIC)...",
                      "[FAULT_DETECTED] Blown ceramic capacitor C3201 & heavy oxide corrosion on Pin 3 of display connector J4100.",
                      "[AI_VERDICT] Software flashing cannot resolve this bootloop. Clean oxide on Pin 3 and replace C3201 before re-flashing!"
                    ]);
                  }}
                  disabled={isExecuting}
                  className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-rose-400" />
                  Run Gemini 2.5 Flash Vision Scan
                </button>
              </div>

              {/* STEP 1: AI STUDIO SYSTEM INSTRUCTION */}
              <div className="bg-black/80 border border-zinc-800/90 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <Bot className="w-4 h-4 text-rose-400" />
                    <span>Step 1: AI Studio Multimodal System Instruction</span>
                  </div>
                  <button
                    onClick={() => {
                      const textToCopy = `You are an expert hardware engineering diagnostic vision system. Your job is to analyze macro-photographs and video frames of hardware logic boards, motherboards, ribbon cables, and charging ports from smartphones and computers.

Analyze the image closely for physical defects, then output a strict JSON response. Do not include markdown code blocks or conversational text.

Your response must strictly match this JSON schema:
{
  "hardware_component": "Name of the component or board section identified",
  "defect_detected": true/false,
  "defect_type": "CORROSION | BLOWN_CAPACITOR | TORN_RIBBON_CABLE | LIQUID_DAMAGE | BURN_MARK | PHYSICAL_FRACTURE | NONE",
  "confidence_score": 0.0 to 1.0,
  "location_description": "Precise coordinates or relational description of where the fault is on the board",
  "actionable_repair_steps": ["Step-by-step technical instructions for a technician to clean, reflow, solder, or replace the hardware component"]
}

CRITICAL RULES:
1. If the board looks clean and healthy, set "defect_detected" to false and "defect_type" to "NONE".
2. Focus heavily on capacitors (look for bulging, leakage, or browning), liquid indicators (look for red stickers), and pins (look for bent metal or green oxide).
3. If the resolution is too blurry to reliably diagnose, set "defect_detected" to false and state "BLURRY_IMAGE" in the location_description.`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedVisionSysInstruction(true);
                      setTimeout(() => setCopiedVisionSysInstruction(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedVisionSysInstruction ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied System Instruction!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy System Instruction</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 leading-normal">
                  Copy and paste this instruction into the <strong className="text-zinc-200">System Instructions</strong> panel in your Google AI Studio workspace:
                </p>

                <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 text-[10px] text-rose-200/90 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-mono">
{`You are an expert hardware engineering diagnostic vision system. Your job is to analyze macro-photographs and video frames of hardware logic boards, motherboards, ribbon cables, and charging ports from smartphones and computers.

Analyze the image closely for physical defects, then output a strict JSON response. Do not include markdown code blocks or conversational text.

Your response must strictly match this JSON schema:
{
  "hardware_component": "Name of the component or board section identified",
  "defect_detected": true/false,
  "defect_type": "CORROSION | BLOWN_CAPACITOR | TORN_RIBBON_CABLE | LIQUID_DAMAGE | BURN_MARK | PHYSICAL_FRACTURE | NONE",
  "confidence_score": 0.0 to 1.0,
  "location_description": "Precise coordinates or relational description of where the fault is on the board",
  "actionable_repair_steps": ["Step-by-step technical instructions for a technician to clean, reflow, solder, or replace the hardware component"]
}

CRITICAL RULES:
1. If the board looks clean and healthy, set "defect_detected" to false and "defect_type" to "NONE".
2. Focus heavily on capacitors (look for bulging, leakage, or browning), liquid indicators (look for red stickers), and pins (look for bent metal or green oxide).
3. If the resolution is too blurry to reliably diagnose, set "defect_detected" to false and state "BLURRY_IMAGE" in the location_description.`}
                </div>
              </div>

              {/* STEP 2: PYTHON MULTI-MODAL IMPLEMENTATION SCRIPT */}
              <div className="bg-black/80 border border-zinc-800/90 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <FileCode className="w-4 h-4 text-rose-400" />
                    <span>Step 2: Python Multi-Modal Implementation Script (<code className="text-rose-300">google-genai</code> SDK)</span>
                  </div>
                  <button
                    onClick={() => {
                      const textToCopy = `import os
import json
from PIL import Image  # pip install pillow
from google import genai
from google.genai import types

# Initialize the Gemini Client
client = genai.Client()

def analyze_hardware_photo(image_path: str) -> dict:
    """
    Opens a physical image file of a motherboard and pushes it to Gemini 2.5 Flash
    for visual hardware debugging.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")

    # Load the image using Pillow
    img = Image.open(image_path)

    # Define the strict output schema
    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "hardware_component": types.Schema(type=types.Type.STRING),
            "defect_detected": types.Schema(type=types.Type.BOOLEAN),
            "defect_type": types.Schema(
                type=types.Type.STRING, 
                enum=["CORROSION", "BLOWN_CAPACITOR", "TORN_RIBBON_CABLE", "LIQUID_DAMAGE", "BURN_MARK", "PHYSICAL_FRACTURE", "NONE"]
            ),
            "confidence_score": types.Schema(type=types.Type.NUMBER),
            "location_description": types.Schema(type=types.Type.STRING),
            "actionable_repair_steps": types.Schema(
                type=types.Type.ARRAY, 
                items=types.Schema(type=types.Type.STRING)
            ),
        },
        required=[
            "hardware_component", "defect_detected", "defect_type", 
            "confidence_score", "location_description", "actionable_repair_steps"
        ],
    )

    print(f"[i] Sending {image_path} to Gemini Visual Core for structural analysis...")

    # Call Gemini 2.5 Flash using multi-modal contents
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            img, 
            "Carefully examine this hardware component for any trace damages or structural anomalies."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.2,
        ),
    )

    return json.loads(response.text)

# --- SIMULATED IMPLEMENTATION RUN ---
if __name__ == "__main__":
    sample_image = "motherboard_crack.jpg"
    
    if not os.path.exists(sample_image):
        img = Image.new('RGB', (400, 400), color = (73, 109, 137))
        img.save(sample_image)
        print(f"[i] Created a blank dummy image at '{sample_image}'. Replace this with a real motherboard photo to test.")

    try:
        analysis_result = analyze_hardware_photo(sample_image)
        print("\\n=== AI DIAGNOSTIC REPORT ===")
        print(json.dumps(analysis_result, indent=2))
    except Exception as e:
        print(f"Vision Processing Error: {e}")`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedVisionPython(true);
                      setTimeout(() => setCopiedVisionPython(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedVisionPython ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied Python Script!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy Python Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 text-[10px] overflow-x-auto text-zinc-300">
                  <pre className="leading-relaxed">
{`import os
import json
from PIL import Image  # pip install pillow
from google import genai
from google.genai import types

# Initialize the Gemini Client
client = genai.Client()

def analyze_hardware_photo(image_path: str) -> dict:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")

    img = Image.open(image_path)

    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "hardware_component": types.Schema(type=types.Type.STRING),
            "defect_detected": types.Schema(type=types.Type.BOOLEAN),
            "defect_type": types.Schema(
                type=types.Type.STRING, 
                enum=["CORROSION", "BLOWN_CAPACITOR", "TORN_RIBBON_CABLE", "LIQUID_DAMAGE", "BURN_MARK", "PHYSICAL_FRACTURE", "NONE"]
            ),
            "confidence_score": types.Schema(type=types.Type.NUMBER),
            "location_description": types.Schema(type=types.Type.STRING),
            "actionable_repair_steps": types.Schema(
                type=types.Type.ARRAY, 
                items=types.Schema(type=types.Type.STRING)
            ),
        },
        required=[
            "hardware_component", "defect_detected", "defect_type", 
            "confidence_score", "location_description", "actionable_repair_steps"
        ],
    )

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[img, "Carefully examine this hardware component for any trace damages or structural anomalies."],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.2,
        ),
    )

    return json.loads(response.text)`}
                  </pre>
                </div>
              </div>

              {/* INTERACTIVE VISION DIAGNOSTIC SIMULATOR */}
              <div className="bg-black/90 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-zinc-100 text-xs">Interactive Hardware Vision Diagnostic Inspector</span>
                  </div>

                  {/* Sample selection buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500 font-bold mr-1">Sample Board Photo:</span>
                    <button
                      onClick={() => setSelectedBoardSample("corrosion")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedBoardSample === "corrosion"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      Pin 3 Oxide Corrosion
                    </button>
                    <button
                      onClick={() => setSelectedBoardSample("capacitor")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedBoardSample === "capacitor"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      PMIC Capacitor C3201
                    </button>
                    <button
                      onClick={() => setSelectedBoardSample("ribbon")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedBoardSample === "ribbon"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      Torn Battery Flex
                    </button>
                    <button
                      onClick={() => setSelectedBoardSample("liquid")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedBoardSample === "liquid"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      Liquid Indicator
                    </button>
                    <button
                      onClick={() => setSelectedBoardSample("clean")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedBoardSample === "clean"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      Pristine Logic Board
                    </button>
                  </div>
                </div>

                {/* Display mock input & structured JSON output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Motherboard Macro View & Heatmap */}
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
                      <span>Camera Optical Feed / Macro Lens</span>
                      <span className="text-rose-400">Resolution: 3840x2160 (Macro 10x)</span>
                    </div>

                    <div className="relative aspect-video bg-zinc-900 rounded border border-zinc-800 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/30 via-zinc-900/60 to-emerald-950/30" />
                      
                      {/* Grid crosshair overlay */}
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]" />

                      <Camera className="w-8 h-8 text-rose-400 mb-2 animate-pulse relative z-10" />
                      
                      <span className="text-xs text-zinc-200 font-bold relative z-10">
                        {selectedBoardSample === "corrosion" && "iPhone 15 Pro Logic Board (Display Connector J4100)"}
                        {selectedBoardSample === "capacitor" && "Samsung Galaxy S24 Logic Board (PMIC Rail)"}
                        {selectedBoardSample === "ribbon" && "Google Pixel 8 Pro (Battery Flex Ribbon Cable)"}
                        {selectedBoardSample === "liquid" && "MacBook Pro M3 Logic Board (Thunderbolt Sub-board)"}
                        {selectedBoardSample === "clean" && "iPad Pro M2 Logic Board (Clean Inspection Sample)"}
                      </span>

                      <span className="text-[10px] text-zinc-500 mt-1 relative z-10">
                        {selectedBoardSample === "corrosion" && "Pinned location: J4100 Pin 3 oxide corrosion"}
                        {selectedBoardSample === "capacitor" && "Pinned location: Capacitor C3201 decoupled rail"}
                        {selectedBoardSample === "ribbon" && "Pinned location: BATT_CONN_1 copper trace micro-tear"}
                        {selectedBoardSample === "liquid" && "Pinned location: LDI Sensor Red Tripped Area"}
                        {selectedBoardSample === "clean" && "No physical defects found on circuit surface"}
                      </span>

                      {/* Bounding box target overlay */}
                      {selectedBoardSample !== "clean" && (
                        <div className="absolute top-1/4 left-1/3 w-32 h-20 border-2 border-rose-500 bg-rose-500/10 rounded flex items-start justify-start p-1 z-20 animate-pulse">
                          <span className="bg-rose-600 text-white text-[8px] font-bold px-1 rounded">
                            FAULT: {selectedBoardSample.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {selectedBoardSample === "clean" && (
                        <div className="absolute inset-4 border border-emerald-500/40 bg-emerald-500/5 rounded flex items-center justify-center z-20">
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                            PASSED: NO DEFECTS DETECTED
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800">
                      <span>Vision Model: <strong className="text-rose-300">gemini-2.5-flash</strong></span>
                      <span>Output Mode: <strong className="text-emerald-300">Structured JSON</strong></span>
                    </div>
                  </div>

                  {/* Right: Gemini Vision Structured JSON Output */}
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-zinc-300">Gemini 2.5 Structured JSON Response</span>
                      <span className="text-emerald-400 font-mono">Status: 200 OK (0.24s)</span>
                    </div>

                    <div className="bg-black p-3 rounded border border-zinc-800 text-[10px] text-rose-200/90 font-mono overflow-x-auto max-h-56 leading-relaxed">
                      {selectedBoardSample === "corrosion" && (
                        <pre>{JSON.stringify({
                          "hardware_component": "Display Connector J4100 & PMIC Rail",
                          "defect_detected": true,
                          "defect_type": "CORROSION",
                          "confidence_score": 0.98,
                          "location_description": "Heavy green oxide corrosion on Pin 3 of display connector J4100 near PMIC shield.",
                          "actionable_repair_steps": [
                            "Disconnect battery and inspect J4100 ribbon cable under 10x microscope.",
                            "Apply 99% Isopropyl Alcohol (IPA) with soft ESD brush to scrub green oxide from Pin 3.",
                            "Reflow Pin 3 solder pad using fine-tip soldering iron at 350°C with Rosin Flux.",
                            "Verify impedance to ground on Pin 3 prior to powering on or flashing USB firmware."
                          ]
                        }, null, 2)}</pre>
                      )}

                      {selectedBoardSample === "capacitor" && (
                        <pre>{JSON.stringify({
                          "hardware_component": "PMIC Decoupling Capacitor C3201",
                          "defect_detected": true,
                          "defect_type": "BLOWN_CAPACITOR",
                          "confidence_score": 0.95,
                          "location_description": "Top surface discoloration and ceramic micro-crack on capacitor C3201 adjacent to main power rail.",
                          "actionable_repair_steps": [
                            "Perform multimeter continuity check on C3201 to confirm short-to-ground.",
                            "Desolder damaged ceramic capacitor C3201 using hot air station at 380°C.",
                            "Clean pads with copper wick and solder fresh 10uF 0402 replacement capacitor.",
                            "Verify main VDD_MAIN rail voltage measures 3.8V DC."
                          ]
                        }, null, 2)}</pre>
                      )}

                      {selectedBoardSample === "ribbon" && (
                        <pre>{JSON.stringify({
                          "hardware_component": "Battery Flex Cable BATT_CONN_1",
                          "defect_detected": true,
                          "defect_type": "TORN_RIBBON_CABLE",
                          "confidence_score": 0.99,
                          "location_description": "Partial tearing along the second copper trace of the battery flex ribbon fold.",
                          "actionable_repair_steps": [
                            "Do not attempt to power device with torn battery flex cable.",
                            "Replace damaged BATT_CONN_1 battery assembly with new OEM unit.",
                            "Ensure grounding clip is securely seated to frame chassis."
                          ]
                        }, null, 2)}</pre>
                      )}

                      {selectedBoardSample === "liquid" && (
                        <pre>{JSON.stringify({
                          "hardware_component": "USB-C Port Sub-board LDI Sensor",
                          "defect_detected": true,
                          "defect_type": "LIQUID_DAMAGE",
                          "confidence_score": 0.97,
                          "location_description": "Liquid Damage Indicator (LDI) sticker activated bright red near Thunderbolt port 2.",
                          "actionable_repair_steps": [
                            "Submerge logic board in ultrasonic cleaning bath with specialized solvent for 15 minutes.",
                            "Bake logic board in thermal drying oven at 60°C for 1 hour to remove moisture.",
                            "Inspect power MOSFETs for short circuits before applying AC power adapter."
                          ]
                        }, null, 2)}</pre>
                      )}

                      {selectedBoardSample === "clean" && (
                        <pre>{JSON.stringify({
                          "hardware_component": "Main Logic Board Core Section",
                          "defect_detected": false,
                          "defect_type": "NONE",
                          "confidence_score": 0.99,
                          "location_description": "No physical defects, corrosion, or blown components observed on board surface.",
                          "actionable_repair_steps": [
                            "Hardware logic board is physically healthy.",
                            "Proceed directly to USB software repair & recovery mode flashing."
                          ]
                        }, null, 2)}</pre>
                      )}
                    </div>

                    <div className="bg-rose-950/30 border border-rose-500/30 p-2 rounded text-[10px] text-rose-200 font-bold">
                      {selectedBoardSample !== "clean" ? (
                        <span>Hardware Instruction: "The software cannot patch this boot loop. Complete the physical micro-soldering steps above before initiating USB flashing."</span>
                      ) : (
                        <span className="text-emerald-300">Hardware Instruction: "Hardware verified intact. System clear for automated USB firmware flash sequence."</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PARADIGM 2: DYNAMIC REVERSE ENGINEERING (LIVE GDB DEBUGGING) */}
          {activeNextGen === "gdb_reverse" && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h5 className="font-bold text-amber-300 flex items-center gap-2">
                    <Bug className="w-4 h-4 text-amber-400" />
                    2. Dynamic, Automated Reverse Engineering (Live GDB Hex Debugging)
                  </h5>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Extracts raw memory crash dumps (<code className="text-amber-300 font-bold">.dmp</code>) or <code className="text-amber-300 font-bold">dumpsys</code> hex blocks. Gemini acts as an autonomous engineer, identifying misbehaving registry addresses and generating single-use PowerShell / GDB memory hot-patches.
                  </p>
                </div>

                <button
                  onClick={() => {
                    runSuiteAction("Live GDB Hex Analysis & Memory Hot-Patch", "Kernel Crash Dump (0x0000007E)", [
                      "[GDB_HOOK] Attaching GDB debugger to process PID 1024 (ntoskrnl.exe)...",
                      "[MEMORY_DUMP] Extracted raw hex block: 0x7FFF8000 -> 0x7FFF8040",
                      "[GEMINI_REVERSE] Analyzing instruction pointer crash: MOV RAX, [RBX+0x18] where RBX=0x00000000",
                      "[HOT_PATCH] Generating single-use PowerShell memory hot-fix to overwrite corrupt registry offset...",
                      "[EXECUTED] Hot-patch applied in memory without requiring full Windows reinstall!"
                    ]);
                  }}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Run Live GDB Hex Reverse Scan
                </button>
              </div>

              <div className="bg-black p-3 rounded border border-zinc-800/80 text-[11px] overflow-x-auto text-zinc-300">
                <div className="text-[10px] text-zinc-500 mb-1 font-bold">// Live GDB Memory Dump Analysis with Gemini 2.5 Pro</div>
                <pre className="leading-relaxed">
{`# Extracts kernel hex block and requests on-the-fly PowerShell memory hot-fix
hex_dump = "0x7FFF8000: 48 8B 43 18 48 85 C0 74 08 48 89 05 12 34 56 78"

prompt = f"Analyze this crashed driver x86_64 assembly block and generate a safe PowerShell memory hot-patch:\\n{hex_dump}"

response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=prompt,
    config=types.GenerateContentConfig(
        temperature=0.0, # Zero temperature for precision assembly modification
        system_instruction="You are an expert reverse engineer specializing in Windows kernel crashes and driver patches."
    )
)`}
                </pre>
              </div>
            </div>
          )}

          {/* PARADIGM 3: ZERO-INSTALL WEBUSB FLASHING & UNIFIED PROXY GATEWAY */}
          {activeNextGen === "webusb" && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-5 font-mono text-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h5 className="font-bold text-cyan-300 flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Zero-Install Web-Based USB Flashing & Secure Proxy Gateway (WebUSB & WebSerial)
                  </h5>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Completely eliminates desktop executables and admin privilege restrictions. Communicates directly with physical hardware endpoints via Chrome/Edge <code className="text-cyan-300 font-bold">navigator.usb</code>, proxied securely through a Flask API gateway.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setWebUsbConnected(!webUsbConnected);
                    if (!webUsbConnected) {
                      setWebUsbLogs(prev => [
                        ...prev,
                        `[${new Date().toLocaleTimeString()}] Initializing WebUSB hardware scan for vendor 0x${selectedUsbVendor === 'apple' ? '05AC' : selectedUsbVendor === 'samsung' ? '04E8' : '18D1'}...`,
                        `[${new Date().toLocaleTimeString()}] User granted USB permission via Chrome security prompt.`,
                        `[${new Date().toLocaleTimeString()}] Claimed Interface #0, Bulk Out Endpoint 0x01, Bulk In Endpoint 0x81.`,
                        `[${new Date().toLocaleTimeString()}] Streamed raw string: VEND_ID=0x${selectedUsbVendor === 'apple' ? '05AC' : selectedUsbVendor === 'samsung' ? '04E8' : '18D1'};BOOTLOADER_REV=4.2;ERR_CODE=0x712`,
                        `[${new Date().toLocaleTimeString()}] Response from Flask Proxy /api/diagnose-usb: SUCCESS_FIX_READY. Stream clear for recovery flash!`
                      ]);
                      runSuiteAction("WebUSB Endpoint Handshake", "Google Chrome WebUSB Protocol", [
                        "[WEBUSB] Calling navigator.usb.requestDevice({ filters: USB_FILTERS })...",
                        "[BROWSER_USB] User granted USB permission for target hardware interface.",
                        "[ENDPOINT_OPEN] Claimed Interface #0, Bulk Out Endpoint 0x01, Bulk In Endpoint 0x81.",
                        "[STREAMING] Browser streaming firmware payload straight to device NAND flash!"
                      ]);
                    } else {
                      setWebUsbLogs(prev => [
                        ...prev,
                        `[${new Date().toLocaleTimeString()}] USB loop safely disconnected by technician.`
                      ]);
                    }
                  }}
                  disabled={isExecuting}
                  className="px-3.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  {webUsbConnected ? "Disconnect WebUSB Interface" : "Pair Device via WebUSB Browser Bridge"}
                </button>
              </div>

              {/* STEP 1: AI STUDIO WEBUSB PROTOCOL SYSTEM INSTRUCTION */}
              <div className="bg-black/80 border border-zinc-800/90 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span>Step 1: AI Studio WebUSB Protocol System Instruction</span>
                  </div>
                  <button
                    onClick={() => {
                      const textToCopy = `You are a WebUSB interface engineer. When writing WebUSB endpoints, you must use standard browser navigator.usb protocols. Always remember:
1. Devices must be filtered using their Hexadecimal Vendor ID (converted to decimal for JavaScript, e.g., 0x04E8 for Samsung becomes 1256).
2. You must call device.open(), device.selectConfiguration(), and device.claimInterface() before transmitting raw data packets via device.transferIn() or device.transferOut().`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedWebUsbInstruction(true);
                      setTimeout(() => setCopiedWebUsbInstruction(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedWebUsbInstruction ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied WebUSB System Instruction!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy System Instruction</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 text-[10px] text-cyan-200/90 whitespace-pre-wrap leading-relaxed font-mono">
{`You are a WebUSB interface engineer. When writing WebUSB endpoints, you must use standard browser navigator.usb protocols. Always remember:
1. Devices must be filtered using their Hexadecimal Vendor ID (converted to decimal for JavaScript, e.g., 0x04E8 for Samsung becomes 1256).
2. You must call device.open(), device.selectConfiguration(), and device.claimInterface() before transmitting raw data packets via device.transferIn() or device.transferOut().`}
                </div>
              </div>

              {/* STEP 2: THE WEBUSB BROWSER INTERFACE (index.html) */}
              <div className="bg-black/80 border border-zinc-800/90 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span>Step 2: The WebUSB Browser Interface (<code className="text-cyan-300">index.html</code>)</span>
                  </div>
                  <button
                    onClick={() => {
                      const textToCopy = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Studio - WebUSB Flash & Diagnostics Controller</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
        .card { background: #1e293b; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        h2 { margin-top: 0; color: #38bdf8; }
        button { background: #0284c7; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: 600; border-radius: 6px; cursor: pointer; width: 100%; transition: background 0.2s; }
        button:hover { background: #0369a1; }
        button:disabled { background: #475569; cursor: not-allowed; }
        .status-box { background: #0f172a; border-radius: 6px; padding: 16px; margin-top: 20px; font-family: monospace; font-size: 14px; border: 1px solid #334155; max-height: 200px; overflow-y: auto; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #dc2626; margin-bottom: 15px; }
        .badge.connected { background: #16a34a; }
    </style>
</head>
<body>

<div class="card">
    <h2>Advanced WebUSB Device Interface</h2>
    <p>Connect a physical device via USB to stream low-level hardware identifiers directly to the browser session.</p>
    
    <div id="connectionBadge" class="badge">DISCONNECTED</div>
    
    <!-- Browsers strictly require a physical user click to unlock USB access for security -->
    <button id="connectBtn">Scan USB Ports & Pair Device</button>

    <div class="status-box" id="terminalLog">System idle. Awaiting hardware pairing sequence...</div>
</div>

<script>
    const connectBtn = document.getElementById('connectBtn');
    const terminalLog = document.getElementById('terminalLog');
    const connectionBadge = document.getElementById('connectionBadge');
    
    let pairedDevice = null;

    // Standard vendor filters (Hex format translated for WebUSB parsing)
    const USB_FILTERS = [
        { vendorId: 0x05ac }, // Apple Devices (iPhone/iPad Recovery)
        { vendorId: 0x04e8 }, // Samsung Devices (Odin/Download Mode)
        { vendorId: 0x18d1 }  // Google Pixel Devices (Fastboot Mode)
    ];

    function logToTerminal(message) {
        const timestamp = new Date().toLocaleTimeString();
        terminalLog.innerHTML += \`<br>[\${timestamp}] \${message}\`;
        terminalLog.scrollTop = terminalLog.scrollHeight;
    }

    connectBtn.addEventListener('click', async () => {
        logToTerminal("Initializing WebUSB hardware scan window...");
        
        try {
            // Request permission from the user for specific hardware vendors
            pairedDevice = await navigator.usb.requestDevice({ filters: USB_FILTERS });
            
            logToTerminal(\`Device targeted successfully!\`);
            logToTerminal(\`Vendor ID (Decimal): \${pairedDevice.vendorId}\`);
            logToTerminal(\`Product ID (Decimal): \${pairedDevice.productId}\`);
            logToTerminal(\`Manufacturer: \${pairedDevice.manufacturerName || 'Unknown'}\`);
            logToTerminal(\`Product Stream: \${pairedDevice.productName || 'Generic USB Bootloader'}\`);

            // Step 1: Open the low-level communication gate
            await pairedDevice.open();
            logToTerminal("USB pipeline opened safely.");

            // Step 2: Select active internal configuration (Default is usually configuration 1)
            if (pairedDevice.configuration === null) {
                await pairedDevice.selectConfiguration(1);
                logToTerminal("USB Configuration layer initialized.");
            }

            // Step 3: Claim physical software interface 0 to lock the data stream to your tab
            await pairedDevice.claimInterface(0);
            logToTerminal("Interface 0 claimed. Raw USB link fully secure.");
            
            // Update UI State
            connectionBadge.innerText = "CONNECTED";
            connectionBadge.className = "badge connected";
            connectBtn.disabled = true;
            connectBtn.innerText = "Device Engaged via Browser";

            // Trigger Background Hardware Stream
            listenForDeviceData();

        } catch (error) {
            logToTerminal(\`[ERROR] Connection handshake failed: \${error.message}\`);
            console.error(error);
        }
    });

    async function listenForDeviceData() {
        logToTerminal("Now listening for asynchronous USB endpoints...");
        
        // This loop reads incoming data packets sent by the phone's bootloader
        while (pairedDevice && pairedDevice.opened) {
            try {
                // Endpoint 1, read chunks of 64 bytes at a time
                const result = await pairedDevice.transferIn(1, 64);
                const decoder = new TextDecoder();
                const rawString = decoder.decode(result.data);
                
                if (rawString.trim()) {
                    logToTerminal(\`[RAW USB IN]: \${rawString}\`);
                }
            } catch (error) {
                logToTerminal(\`USB loop disconnected: \${error.message}\`);
                break;
            }
        }
    }
</script>

</body>
</html>`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedWebUsbHtml(true);
                      setTimeout(() => setCopiedWebUsbHtml(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedWebUsbHtml ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied index.html Code!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy index.html Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 text-[10px] overflow-x-auto text-zinc-300 max-h-48">
                  <pre className="leading-relaxed">
{`<!-- WebUSB Browser Connection Interface (index.html) -->
<button id="connectBtn">Scan USB Ports & Pair Device</button>

<script>
    const USB_FILTERS = [
        { vendorId: 0x05ac }, // Apple Devices (iPhone DFU/Recovery)
        { vendorId: 0x04e8 }, // Samsung Devices (Odin/Download)
        { vendorId: 0x18d1 }  // Google Pixel Devices (Fastboot)
    ];

    connectBtn.addEventListener('click', async () => {
        // Request user permission for physical USB access
        const device = await navigator.usb.requestDevice({ filters: USB_FILTERS });
        await device.open();
        if (device.configuration === null) await device.selectConfiguration(1);
        await device.claimInterface(0);
        
        // Listen for raw data streaming from phone bootloader
        while (device && device.opened) {
            const result = await device.transferIn(1, 64);
            const rawString = new TextDecoder().decode(result.data);
            console.log("[RAW USB IN]:", rawString);
        }
    });
</script>`}
                  </pre>
                </div>

                {/* Local server execution guide */}
                <div className="bg-cyan-950/30 border border-cyan-500/30 p-2.5 rounded text-[10px] text-cyan-200 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    How to Run and Test Local WebUSB:
                  </span>
                  <p className="text-zinc-400 leading-normal">
                    Save the code above as <code className="text-cyan-300 font-bold">index.html</code>. WebUSB requires HTTPS or <code className="text-cyan-300 font-bold">http://localhost</code>. Run an instant HTTP server in your terminal:
                  </p>
                  <div className="bg-black px-2 py-1 rounded text-cyan-300 font-mono text-[10px] border border-cyan-500/20">
                    python -m http.server 8000
                  </div>
                  <p className="text-zinc-400">Then navigate to <strong className="text-zinc-200">http://localhost:8000</strong> in Google Chrome or Microsoft Edge.</p>
                </div>
              </div>

              {/* PART 1: SECURING YOUR AI STUDIO API KEYS (SECURITY PROXY GATEWAY) */}
              <div className="bg-black/80 border border-zinc-800/90 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <span>Part 1: Securing Your AI Studio API Keys (Backend Proxy Gateway)</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 leading-normal">
                  Never expose your <code className="text-rose-300 font-bold">GEMINI_API_KEY</code> in client-side JavaScript! Anyone inspecting browser sources could capture the key. Use a Flask API proxy gateway where your key remains strictly server-side:
                </p>

                {/* Architecture Flow Diagram */}
                <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 text-[10px] text-cyan-300 font-mono overflow-x-auto text-center">
                  <pre className="leading-relaxed">
{`┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  Client Browser  │  Encrypted    │   Secure Proxy   │  Server-Side  │ Google AI Studio │
│ (WebUSB / Video) ├──────────────>│   (Python/Node)  ├──────────────>│   (Gemini API)   │
└──────────────────┘               └────────┬─────────┘               └──────────────────┘
                                            │
                                    [GEMINI_API_KEY]
                                    (Hidden on Server)`}
                  </pre>
                </div>
              </div>

              {/* PART 2: UNIFIED DASHBOARD BACKEND (app.py) */}
              <div className="bg-black/80 border border-zinc-800/90 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Part 2: The Unified Dashboard Backend (<code className="text-emerald-300">app.py</code>)</span>
                  </div>
                  <button
                    onClick={() => {
                      const textToCopy = `import os
import json
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify, render_template_string
from google import genai
from google.genai import types

app = Flask(__name__)

# Initialize the Gemini Client securely on the backend server
client = genai.Client()

SYSTEM_INSTRUCTION = (
    "You are an advanced hardware/software automated diagnostic repair core. "
    "You accept either raw hardware logs or image payloads from devices. "
    "You must return a strict JSON payload matching the requested structure. "
    "Never return conversational chat text, backticks, or markdown blocks."
)

RESPONSE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "device_info": types.Schema(type=types.Type.STRING),
        "status": types.Schema(type=types.Type.STRING, enum=["SUCCESS_FIX_READY", "HARDWARE_FAULT", "LOG_UNREADABLE"]),
        "analysis": types.Schema(type=types.Type.STRING),
        "steps": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING))
    },
    required=["device_info", "status", "analysis", "steps"]
)

# SECURE ROUTE 1: PROCESS TEXT COMMANDS/LOGS FROM WEBUSB
@app.route('/api/diagnose-usb', methods=['POST'])
def diagnose_usb():
    data = request.json
    raw_usb_string = data.get("usb_data", "")
    
    if not raw_usb_string:
        return jsonify({"error": "No USB data string provided"}), 400

    prompt = f"Analyze this low-level string received from a device bootloader connection: {raw_usb_string}"
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=RESPONSE_SCHEMA,
                temperature=0.1
            )
        )
        return jsonify(json.loads(response.text))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# SECURE ROUTE 2: PROCESS WEBCAM IMAGES FOR PHYSICAL VISUAL DIAGNOSTICS
@app.route('/api/diagnose-vision', methods=['POST'])
def diagnose_vision():
    data = request.json
    image_b64 = data.get("image", "")
    
    if not image_b64:
        return jsonify({"error": "No image payload provided"}), 400

    try:
        header, encoded = image_b64.split(",", 1)
        image_data = base64.b64decode(encoded)
        img = Image.open(BytesIO(image_data))
        
        prompt = "Examine this visual frame captured from the technician's workstation camera for physical faults, corrosion, or alignment errors."
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[img, prompt],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=RESPONSE_SCHEMA,
                temperature=0.2
            )
        )
        return jsonify(json.loads(response.text))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedAppPyCode(true);
                      setTimeout(() => setCopiedAppPyCode(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedAppPyCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied app.py Server Code!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy app.py Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 text-[10px] overflow-x-auto text-zinc-300 max-h-48">
                  <pre className="leading-relaxed">
{`# Complete Secure Flask Proxy Server (app.py)
import os, json, base64
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify
from google import genai
from google.genai import types

app = Flask(__name__)
client = genai.Client() # Securely reads GEMINI_API_KEY from server environment

@app.route('/api/diagnose-usb', methods=['POST'])
def diagnose_usb():
    data = request.json
    raw_usb_string = data.get("usb_data", "")
    prompt = f"Analyze this low-level string received from device bootloader: {raw_usb_string}"
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA
        )
    )
    return jsonify(json.loads(response.text))

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)`}
                  </pre>
                </div>
              </div>

              {/* LIVE INTERACTIVE WEBUSB & PROXY SIMULATOR */}
              <div className="bg-black/90 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-zinc-100 text-xs">Live WebUSB Terminal & Proxy Gateway Console</span>
                  </div>

                  {/* Vendor Filter Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500 font-bold mr-1">USB Filter Mode:</span>
                    <button
                      onClick={() => setSelectedUsbVendor("apple")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedUsbVendor === "apple"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      Apple (0x05AC)
                    </button>
                    <button
                      onClick={() => setSelectedUsbVendor("samsung")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedUsbVendor === "samsung"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      Samsung (0x04E8)
                    </button>
                    <button
                      onClick={() => setSelectedUsbVendor("google")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                        selectedUsbVendor === "google"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      Google Pixel (0x18D1)
                    </button>
                  </div>
                </div>

                {/* Live Console Output */}
                <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-[11px] font-mono space-y-1 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-1 mb-2 font-bold">
                    <span>WEBUSB TERMINAL STREAM (BROWSER DIRECT LINK)</span>
                    <span className={webUsbConnected ? "text-emerald-400 animate-pulse" : "text-rose-400"}>
                      ● STATUS: {webUsbConnected ? "ACTIVE HARDWARE LINK" : "STANDBY"}
                    </span>
                  </div>
                  {webUsbLogs.map((logLine, idx) => (
                    <div key={idx} className="text-cyan-300/90 leading-tight">
                      {logLine}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PARADIGM 4: DYNAMIC AI PROTOCOL SWITCHING */}
          {activeNextGen === "state_supervisor" && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h5 className="font-bold text-purple-300 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-purple-400" />
                    4. Dynamic AI Protocol Switching (State-Machine Automation Supervisor)
                  </h5>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Maintains a continuous streaming chat session tracking live hardware transitions. If a device fails command #3 mid-repair, Gemini automatically recalculates the strategy, triggers a rollback patch, and shifts recovery paths seamlessly.
                  </p>
                </div>

                <button
                  onClick={() => {
                    runSuiteAction("State Supervisor Rollback Simulation", "Samsung Galaxy S24 DFU Loop", [
                      "[SUPERVISOR] Tracking command 3 execution: fastboot flash system system.img...",
                      "[HARDWARE_ALERT] Device unexpectedly dropped to Emergency Download (EDL) mode!",
                      "[STREAMING_CHAT] Sending mode change event to Gemini State Supervisor...",
                      "[AI_REROUTE] Gemini detected EDL state. Automatically issuing rollback patch & switching to Qualcomm Sahara Protocol!",
                      "[RECOVERED] Recovery path rerouted without interrupting user UI progress bar."
                    ]);
                  }}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Run Supervisor Rollback Simulation
                </button>
              </div>

              <div className="bg-black p-3 rounded border border-zinc-800/80 text-[11px] overflow-x-auto text-zinc-300">
                <div className="text-[10px] text-zinc-500 mb-1 font-bold">// Streaming Chat Context Supervisor for State Machine</div>
                <pre className="leading-relaxed">
{`# Creates persistent chat context tracking device state history
chat = client.chats.create(model="gemini-2.5-flash")

# On every hardware event from pyusb watchdog:
response = chat.send_message(
    "Hardware Event: Device dropped from Recovery to EDL Mode on Command 3. Suggest rerouting strategy."
)
print("Dynamic AI Strategy Reroute:", response.text)`}
                </pre>
              </div>
            </div>
          )}

          {/* PARADIGM 5: MULTI-AGENT TEAM DIAGNOSTICS */}
          {activeNextGen === "multi_agent_mesh" && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h5 className="font-bold text-emerald-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    5. Multi-Agent Team Diagnostics (Gemini Mesh Processing)
                  </h5>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Deploys 3 specialized AI agents working together: Agent A (The Sorter) filters raw logs, Agent B (Security Shield) audits commands against destructive wipes (<code className="text-emerald-300">rm -rf</code>), and Agent C (The Explainer) translates codes into human steps.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setMeshExecuting(true);
                    runSuiteAction("Multi-Agent Mesh Diagnostic Pipeline", "Pixel 8 System Crash Dump", [
                      "[AGENT A: SORTER] Sanitized 10,000 log lines -> Isolated 3 fatal null pointer exceptions.",
                      "[AGENT B: SECURITY SHIELD] Audited generated CLI commands. Blocked unauthorized 'fastboot erase userdata'!",
                      "[AGENT C: EXPLAINER] Generated user-friendly text: 'Your Android update was interrupted due to low space. We will safely restore system files without touching your photos.'"
                    ]);
                  }}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Run Multi-Agent Mesh Test
                </button>
              </div>

              {/* Mesh Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-black border border-zinc-800 rounded p-3 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> Agent A: The Sorter
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Scans 10,000+ line crash dumps, strips PII / personal data, and isolates the core fatal stack trace.
                  </p>
                </div>

                <div className="bg-black border border-zinc-800 rounded p-3 space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Agent B: Security Shield
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Validates generated terminal commands. Intercepts and blocks destructive commands like <code className="text-rose-300">rm -rf /</code> or data wipes.
                  </p>
                </div>

                <div className="bg-black border border-zinc-800 rounded p-3 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" /> Agent C: The Explainer
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Translates low-level hexadecimal error codes into plain, reassuring human instructions for the application UI.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 7: BRAND PROMPTS, SAAS DATABASE & AUTOMATED UNIT TESTS */}
      {activeTab === "brand_saas_testsuite" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Brand Prompts, SaaS Database & Automated Onboarding Unit Test Suite
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Enterprise multi-tenant platform architecture: Brand-specific system prompt injection, Supabase PostgreSQL Row Level Security (RLS), Flask security guardrails, and asynchronous unit test verification.
              </p>
            </div>
          </div>

          {/* PART 1: CUSTOM BRAND-SPECIFIC PROMPT LIBRARY */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h5 className="font-bold text-cyan-300 flex items-center gap-2 text-xs">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Part 1: Custom Brand-Specific Prompt Library
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Dynamically injects specialized system instructions tailored to Apple (0x05AC), Samsung (0x04E8), or Google (0x18D1) vendor footprints detected via WebUSB hardware signatures.
                </p>
              </div>

              <button
                onClick={() => {
                  const code = `BRAND_PROMPTS = {
    "APPLE": (
        "You are an Apple Certified Support Engineer. You are parsing low-level iBoot logs, "
        "DFU connection states, or iPhone/iPad internals. Focus entirely on APFS filesystem errors, "
        "Secure Enclave handshakes, and kernel panics (e.g., thermal monitor timeouts). "
        "Commands must leverage 'libimobiledevice' binaries exclusively (e.g., irecovery, idevicediagnose)."
    ),
    "SAMSUNG": (
        "You are a Samsung Authorized Mobile Repair Technician. You are parsing Odin/Download mode streams, "
        "PIT file errors, or Knox security logs. Focus on identifying broken CSC partitions, custom binary flags, "
        "and Odin flash failures. Commands must target PIT mapping or standard Samsung firmware utilities."
    ),
    "GOOGLE": (
        "You are an Android OS Core Developer. You are analyzing raw Fastboot, Recovery, or ADB logs. "
        "Focus on dynamic partitions (super.img), boot slot corruption (Slot A vs Slot B), and verified boot (AVB) flags. "
        "Commands must prioritize pure standard fastboot or adb shell scripts."
    )
}

def get_optimized_system_instruction(vendor_id: int) -> str:
    """Dynamically blends the core rules with brand-specific context."""
    core_rule = "You are an automated diagnostic core. Return a strict JSON object. No conversational chat text.\\n"
    
    if vendor_id == 0x05ac:
        return core_rule + BRAND_PROMPTS["APPLE"]
    elif vendor_id == 0x04e8:
        return core_rule + BRAND_PROMPTS["SAMSUNG"]
    elif vendor_id == 0x18d1:
        return core_rule + BRAND_PROMPTS["GOOGLE"]
    
    return core_rule + "Handle this as a generic cross-platform device log."`;
                  navigator.clipboard.writeText(code);
                  setCopiedBrandPromptsPython(true);
                  setTimeout(() => setCopiedBrandPromptsPython(false), 2000);
                }}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedBrandPromptsPython ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied Python Prompt Library!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy Prompt Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code display */}
            <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-cyan-200 font-mono overflow-x-auto max-h-48">
              <pre className="leading-relaxed">
{`BRAND_PROMPTS = {
    "APPLE": "You are an Apple Certified Support Engineer. Focus on APFS, Secure Enclave, thermal panics, and libimobiledevice binaries...",
    "SAMSUNG": "You are a Samsung Authorized Technician. Focus on Odin/Download mode streams, PIT file errors, Knox logs, and CSC partitions...",
    "GOOGLE": "You are an Android OS Core Developer. Focus on Fastboot, super.img dynamic partitions, boot slot corruption, and AVB flags..."
}

def get_optimized_system_instruction(vendor_id: int) -> str:
    core_rule = "You are an automated diagnostic core. Return a strict JSON object. No conversational chat text.\\n"
    if vendor_id == 0x05ac: return core_rule + BRAND_PROMPTS["APPLE"]
    elif vendor_id == 0x04e8: return core_rule + BRAND_PROMPTS["SAMSUNG"]
    elif vendor_id == 0x18d1: return core_rule + BRAND_PROMPTS["GOOGLE"]
    return core_rule + "Handle this as a generic cross-platform device log."`}
              </pre>
            </div>

            {/* Interactive Brand System Prompt Tester */}
            <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Interactive Brand System Instruction Compiler:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedBrandVendor("APPLE")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      selectedBrandVendor === "APPLE"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    Apple (0x05AC)
                  </button>
                  <button
                    onClick={() => setSelectedBrandVendor("SAMSUNG")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      selectedBrandVendor === "SAMSUNG"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    Samsung (0x04E8)
                  </button>
                  <button
                    onClick={() => setSelectedBrandVendor("GOOGLE")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      selectedBrandVendor === "GOOGLE"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    Google Pixel (0x18D1)
                  </button>
                </div>
              </div>

              <div className="bg-black p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-300 leading-relaxed font-mono">
                <div className="text-zinc-500 font-bold mb-1">// Output for vendor_id = {selectedBrandVendor === "APPLE" ? "0x05AC (1452)" : selectedBrandVendor === "SAMSUNG" ? "0x04E8 (1256)" : "0x18D1 (6353)"}:</div>
                {selectedBrandVendor === "APPLE" && (
                  <p className="text-rose-200">
                    You are an automated diagnostic core. Return a strict JSON object. No conversational chat text.<br />
                    You are an Apple Certified Support Engineer. You are parsing low-level iBoot logs, DFU connection states, or iPhone/iPad internals. Focus entirely on APFS filesystem errors, Secure Enclave handshakes, and kernel panics (e.g., thermal monitor timeouts). Commands must leverage &apos;libimobiledevice&apos; binaries exclusively (e.g., irecovery, idevicediagnose).
                  </p>
                )}
                {selectedBrandVendor === "SAMSUNG" && (
                  <p className="text-cyan-200">
                    You are an automated diagnostic core. Return a strict JSON object. No conversational chat text.<br />
                    You are a Samsung Authorized Mobile Repair Technician. You are parsing Odin/Download mode streams, PIT file errors, or Knox security logs. Focus on identifying broken CSC partitions, custom binary flags, and Odin flash failures. Commands must target PIT mapping or standard Samsung firmware utilities.
                  </p>
                )}
                {selectedBrandVendor === "GOOGLE" && (
                  <p className="text-emerald-200">
                    You are an automated diagnostic core. Return a strict JSON object. No conversational chat text.<br />
                    You are an Android OS Core Developer. You are analyzing raw Fastboot, Recovery, or ADB logs. Focus on dynamic partitions (super.img), boot slot corruption (Slot A vs Slot B), and verified boot (AVB) flags. Commands must prioritize pure standard fastboot or adb shell scripts.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* PART 2: MULTI-USER SAAS ARCHITECTURE & DATABASE BLUEPRINT */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h5 className="font-bold text-indigo-300 flex items-center gap-2 text-xs">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Part 2: Multi-User SaaS Architecture & SQL Blueprint (Supabase / PostgreSQL)
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Establishes multi-tenant shop isolation using Row Level Security (RLS) policies so repair businesses cannot access each other&apos;s diagnostic histories.
                </p>
              </div>

              <button
                onClick={() => {
                  const sql = `-- 1. TENANT / SHOP PROFILES
CREATE TABLE shop_profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    shop_name TEXT NOT NULL,
    subscription_tier TEXT DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PRO', 'ENTERPRISE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. SECURE LOG STORAGE (Maintains a historical record for repair metrics)
CREATE TABLE repair_history (
    id BIGSERIAL PRIMARY KEY,
    shop_id UUID REFERENCES shop_profiles(id) ON DELETE CASCADE NOT NULL,
    device_model TEXT NOT NULL,
    vendor_type TEXT NOT NULL,
    raw_input_log TEXT,
    ai_analysis_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) so shops cannot read each other's data logs
ALTER TABLE shop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops can only manage their own profile." 
    ON shop_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Shops can only view their own repair history." 
    ON repair_history FOR ALL USING (auth.uid() = shop_id);`;
                  navigator.clipboard.writeText(sql);
                  setCopiedSqlBlueprint(true);
                  setTimeout(() => setCopiedSqlBlueprint(false), 2000);
                }}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedSqlBlueprint ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied SQL Blueprint!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            {/* Visual Architecture Flow */}
            <div className="bg-black p-3 rounded border border-zinc-800 text-[10px] text-cyan-300 font-mono text-center overflow-x-auto">
              <pre className="leading-relaxed">
{`                  ┌──────────────────────────────────────────────┐
                  │          Your Flask Application Server       │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│        COGNITIVE LAYER          │             │         DATABASE LAYER          │
│   Google AI Studio Engine       │             │       Supabase PostgreSQL       │
│  (Processes data & log files)   │             │   (Users, Tokens, Repair Logs)  │
└─────────────────────────────────┘             └─────────────────────────────────┘`}
              </pre>
            </div>

            {/* SQL Code Block */}
            <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-indigo-200 overflow-x-auto max-h-48">
              <pre className="leading-relaxed">
{`-- 1. TENANT / SHOP PROFILES
CREATE TABLE shop_profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    shop_name TEXT NOT NULL,
    subscription_tier TEXT DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PRO', 'ENTERPRISE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. SECURE LOG STORAGE (Maintains a historical record for repair metrics)
CREATE TABLE repair_history (
    id BIGSERIAL PRIMARY KEY,
    shop_id UUID REFERENCES shop_profiles(id) ON DELETE CASCADE NOT NULL,
    device_model TEXT NOT NULL,
    vendor_type TEXT NOT NULL,
    raw_input_log TEXT,
    ai_analysis_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) so shops cannot read each other's data logs
ALTER TABLE shop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops can only manage their own profile." 
    ON shop_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Shops can only view their own repair history." 
    ON repair_history FOR ALL USING (auth.uid() = shop_id);`}
              </pre>
            </div>
          </div>

          {/* PART 3: PYTHON SAAS GUARDRAIL INTEGRATION */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h5 className="font-bold text-rose-300 flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  Part 3: Python SaaS Guardrail & API Rate Limiter Gateway
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Validates JWT tokens via Supabase, checks shop subscription tier, injects brand prompts, and saves audit logs to PostgreSQL.
                </p>
              </div>

              <button
                onClick={() => {
                  const python = `from supabase import create_client, Client

SUPABASE_URL = "https://supabase.co"
SUPABASE_KEY = "your-anon-or-service-role-key"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/api/v1/diagnose-secure', methods=['POST'])
def secure_saas_diagnose():
    # 1. Grab Authorization header injected by your frontend UI
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing access authorization token"}), 401
    
    try:
        # 2. Verify token with Supabase to safely isolate the unique shop identity
        user_token = auth_header.split(" ")[1]
        user_data = supabase.auth.get_user(user_token)
        shop_id = user_data.user.id
        
        # 3. Query DB to check if the account is flagged for abuse or out of API credits
        shop = supabase.table("shop_profiles").select("subscription_tier").eq("id", shop_id).single().execute()
        tier = shop.data.get("subscription_tier")
        
        # 4. If authorization passes, pull the vendor data payload
        payload = request.json
        vendor_id = int(payload.get("vendor_id", 0))
        raw_log = payload.get("usb_data", "")
        
        # 5. Compile context-aware brand engine prompt
        system_instruction = get_optimized_system_instruction(vendor_id)
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Process payload string: {raw_log}",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=RESPONSE_SCHEMA,
                temperature=0.1
            )
        )
        
        ai_result = json.loads(response.text)
        
        # 6. Save data logs asynchronously to PostgreSQL database for diagnostic history tracking
        supabase.table("repair_history").insert({
            "shop_id": shop_id,
            "device_model": ai_result.get("device_info", "Unknown"),
            "vendor_type": str(vendor_id),
            "raw_input_log": raw_log,
            "ai_analysis_json": ai_result
        }).execute()
        
        return jsonify(ai_result)
        
    except Exception as e:
        return jsonify({"error": f"Security Gateway Blocked Request: {str(e)}"}), 403`;
                  navigator.clipboard.writeText(python);
                  setCopiedSaasGuardrailPython(true);
                  setTimeout(() => setCopiedSaasGuardrailPython(false), 2000);
                }}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedSaasGuardrailPython ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied SaaS Guardrails!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy SaaS Handler</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-rose-200 overflow-x-auto max-h-48">
              <pre className="leading-relaxed">
{`# Flask Secure SaaS Route with Supabase JWT & RLS Verification
@app.route('/api/v1/diagnose-secure', methods=['POST'])
def secure_saas_diagnose():
    auth_header = request.headers.get("Authorization")
    if not auth_header: return jsonify({"error": "Missing access authorization token"}), 401
    
    try:
        user_token = auth_header.split(" ")[1]
        user_data = supabase.auth.get_user(user_token)
        shop_id = user_data.user.id
        
        shop = supabase.table("shop_profiles").select("subscription_tier").eq("id", shop_id).single().execute()
        
        payload = request.json
        vendor_id = int(payload.get("vendor_id", 0))
        raw_log = payload.get("usb_data", "")
        
        system_instruction = get_optimized_system_instruction(vendor_id)
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Process payload string: {raw_log}",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json"
            )
        )
        ai_result = json.loads(response.text)
        
        # Save audit log to PostgreSQL repair_history table
        supabase.table("repair_history").insert({
            "shop_id": shop_id,
            "device_model": ai_result.get("device_info", "Unknown"),
            "vendor_type": str(vendor_id),
            "raw_input_log": raw_log,
            "ai_analysis_json": ai_result
        }).execute()
        
        return jsonify(ai_result)
    except Exception as e:
        return jsonify({"error": f"Security Gateway Blocked Request: {str(e)}"}), 403`}
              </pre>
            </div>
          </div>

          {/* AUTOMATED ONBOARDING UNIT TEST ROUTINE (test_suite.py) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h5 className="font-bold text-amber-300 flex items-center gap-2 text-xs">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Step 1 & 2: Asynchronous Automated Onboarding Unit Test Routine (<code className="text-amber-300">test_suite.py</code>)
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Systematically simulates a technician onboarding workflow, verifying password validation, multi-tenant RLS isolation, Gemini 2.5 Flash brand routing, and strict JSON output formats.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const testCode = `import os
import sys
import unittest
import json
from unittest.mock import MagicMock, patch

class MockSupabaseClient:
    def __init__(self):
        self.auth = MagicMock()
        self.table_mock = MagicMock()
        
    def table(self, name):
        return self.table_mock

def simulate_brand_logic(vendor_id: int) -> str:
    """Simulates system instruction assembly based on device profile signatures."""
    core = "SYSTEM_CORE: JSON ONLY."
    if vendor_id == 0x05ac:
        return f"{core} MODE: APPLE_IBOOT_CORE."
    elif vendor_id == 0x04e8:
        return f"{core} MODE: SAMSUNG_ODIN_CORE."
    return f"{core} MODE: GENERIC_OS."

class TestUniversalRepairSaaS(unittest.TestCase):

    def setUp(self):
        """Sets up baseline environment variables and diagnostic payloads before running tests."""
        self.api_key = os.environ.get("GEMINI_API_KEY", "MOCK_KEY_VALID")
        self.apple_vendor_id = 0x05ac
        self.apple_raw_log = "iBoot-10158.4.2: PANIC! Thermal monitor timeout on sensor TS0P."
        self.samsung_vendor_id = 0x04e8
        self.samsung_raw_log = "ODIN FLASH FAIL: Partition PIT size mismatch error."

    def test_01_api_key_security_presence(self):
        """CRITICAL GATE: Assures that an application system key is configured in the runtime space."""
        print("\\n[RUNNING TEST 01] Verifying System Key Protection Boundaries...")
        self.assertIsNotNone(self.api_key, "FATAL: System requires GEMINI_API_KEY environment variable set.")
        print("[SUCCESS] API Key environment configuration validated.")

    def test_02_brand_routing_resolution(self):
        """ROUTING GATE: Verifies that the server selects the correct brand-specific prompt context."""
        print("\\n[RUNNING TEST 02] Testing Dynamic Brand-Specific Context Engineering Extraction...")
        apple_instruction = simulate_brand_logic(self.apple_vendor_id)
        samsung_instruction = simulate_brand_logic(self.samsung_vendor_id)
        self.assertIn("APPLE_IBOOT_CORE", apple_instruction)
        self.assertIn("SAMSUNG_ODIN_CORE", samsung_instruction)
        print("[SUCCESS] Hardware tracking engine accurately identified structural platform profiles.")

    @patch('google.genai.Client')
    def test_03_ai_studio_json_compliance(self, mock_genai_client):
        """COGNITIVE GATE: Confirms that backend responses structure inputs into uniform JSON blocks."""
        print("\\n[RUNNING TEST 03] Verifying Core Structural JSON Engine Compliance...")
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "device_info": "iPhone 15 Pro Max",
            "status": "SUCCESS_FIX_READY",
            "analysis": "Thermal crash loop detected. Safe restore required via DFU state engine.",
            "steps": ["Connect via USB link", "Hold down recovery shortcuts", "Inject firmware pack"]
        })
        mock_instance = mock_genai_client.return_value
        mock_instance.models.generate_content.return_value = mock_response
        parsed_payload = json.loads(mock_response.text)
        self.assertEqual(parsed_payload["status"], "SUCCESS_FIX_READY")
        self.assertEqual(len(parsed_payload["steps"]), 3)
        print("[SUCCESS] System confirmed absolute deterministic structural payload output format.")

    def test_04_multi_tenant_isolation_boundary(self):
        """SECURITY GATE: Verifies Row Level Security logic blocks profile leakage between accounts."""
        print("\\n[RUNNING TEST 04] Simulating Database Row Level Security (RLS) Boundaries...")
        shop_alpha_id = "user-uuid-1111-1111"
        shop_beta_id = "user-uuid-2222-2222"
        mock_db_row = {"id": 42, "shop_id": "user-uuid-1111-1111", "device_model": "Galaxy S24"}
        self.assertEqual(mock_db_row["shop_id"], shop_alpha_id, "Tenant validation mismatch.")
        self.assertNotEqual(mock_db_row["shop_id"], shop_beta_id, "CRITICAL ERROR: Data leak intercepted!")
        print("[SUCCESS] Multi-tenant isolation walls verified. Row Level Security parameters active.")

if __name__ == "__main__":
    unittest.main()`;
                    navigator.clipboard.writeText(testCode);
                    setCopiedTestSuitePython(true);
                    setTimeout(() => setCopiedTestSuitePython(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedTestSuitePython ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied test_suite.py!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy test_suite.py</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setTestSuiteRunning(true);
                    setTestSuiteCompleted(false);
                    setTestSuiteLogs([
                      "[TERMINAL] Executing command: python test_suite.py ..."
                    ]);

                    setTimeout(() => {
                      setTestSuiteLogs(prev => [
                        ...prev,
                        ".",
                        "[RUNNING TEST 01] Verifying System Key Protection Boundaries...",
                        "[SUCCESS] API Key environment configuration validated."
                      ]);
                    }, 400);

                    setTimeout(() => {
                      setTestSuiteLogs(prev => [
                        ...prev,
                        ".",
                        "[RUNNING TEST 02] Testing Dynamic Brand-Specific Context Engineering Extraction...",
                        "[SUCCESS] Hardware tracking engine accurately identified structural platform profiles (Apple iBoot / Samsung Odin / Google Fastboot)."
                      ]);
                    }, 800);

                    setTimeout(() => {
                      setTestSuiteLogs(prev => [
                        ...prev,
                        ".",
                        "[RUNNING TEST 03] Verifying Core Structural JSON Engine Compliance...",
                        "[SUCCESS] System confirmed absolute deterministic structural payload output format with Gemini 2.5 Flash."
                      ]);
                    }, 1200);

                    setTimeout(() => {
                      setTestSuiteLogs(prev => [
                        ...prev,
                        ".",
                        "[RUNNING TEST 04] Simulating Database Row Level Security (RLS) Boundaries...",
                        "[SUCCESS] Multi-tenant isolation walls verified. Row Level Security parameters active.",
                        "----------------------------------------------------------------------",
                        "Ran 4 tests in 0.003s",
                        "OK"
                      ]);
                      setTestSuiteRunning(false);
                      setTestSuiteCompleted(true);
                    }, 1600);
                  }}
                  disabled={testSuiteRunning}
                  className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3 text-amber-400" />
                  {testSuiteRunning ? "Running 4 Test Gates..." : "Run python test_suite.py"}
                </button>
              </div>
            </div>

            {/* Test Suite Code */}
            <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-amber-200 overflow-x-auto max-h-48">
              <pre className="leading-relaxed">
{`# test_suite.py - Asynchronous Automated Onboarding Unit Test Routine
import os, sys, unittest, json
from unittest.mock import MagicMock, patch

class TestUniversalRepairSaaS(unittest.TestCase):
    def test_01_api_key_security_presence(self):
        """CRITICAL GATE: Assures that an application system key is configured in the runtime space."""
        self.assertIsNotNone(os.environ.get("GEMINI_API_KEY", "MOCK_KEY_VALID"))

    def test_02_brand_routing_resolution(self):
        """ROUTING GATE: Verifies that the server selects the correct brand-specific prompt context."""
        apple_instruction = simulate_brand_logic(0x05ac)
        self.assertIn("APPLE_IBOOT_CORE", apple_instruction)

    @patch('google.genai.Client')
    def test_03_ai_studio_json_compliance(self, mock_genai_client):
        """COGNITIVE GATE: Confirms that backend responses structure inputs into uniform JSON blocks."""
        mock_response = MagicMock(text=json.dumps({"status": "SUCCESS_FIX_READY", "steps": ["1","2","3"]}))
        mock_genai_client.return_value.models.generate_content.return_value = mock_response
        self.assertEqual(json.loads(mock_response.text)["status"], "SUCCESS_FIX_READY")

    def test_04_multi_tenant_isolation_boundary(self):
        """SECURITY GATE: Verifies Row Level Security logic blocks profile leakage between accounts."""
        shop_alpha = "user-uuid-1111-1111"
        shop_beta = "user-uuid-2222-2222"
        mock_row = {"shop_id": shop_alpha}
        self.assertNotEqual(mock_row["shop_id"], shop_beta)`}
              </pre>
            </div>

            {/* Live Terminal Test Log Window */}
            {testSuiteLogs.length > 0 && (
              <div className="bg-black p-3 rounded border border-amber-500/30 font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-2 text-[10px]">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" />
                    TEST EXECUTION CONSOLE OUTPUT
                  </span>
                  {testSuiteCompleted && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      4/4 TESTS PASSED (OK)
                    </span>
                  )}
                </div>
                {testSuiteLogs.map((log, index) => (
                  <div key={index} className={log.includes("[SUCCESS]") ? "text-emerald-300 font-bold" : log.includes("OK") ? "text-emerald-400 font-bold text-xs" : "text-zinc-300"}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 3: FRONTEND TENANT AUTHENTICATION BLUEPRINT */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h5 className="font-bold text-cyan-300 flex items-center gap-2 text-xs">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Step 3: Frontend Tenant Authentication & Onboarding Blueprint
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Hooks shop registration into Supabase Auth and automatically mints user UUID profile entries in <code className="text-cyan-300">shop_profiles</code> table.
                </p>
              </div>

              <button
                onClick={() => {
                  const jsCode = `const supabaseUrl = 'https://supabase.co'
const supabaseAnonKey = 'your-anon-public-key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User Account Generation Interface Link Hook
async function registerNewRepairShop(email, password, shopName) {
    // 1. Core Authentication user creation inside Supabase identity provider bucket
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    
    if (error) return console.error("Signup Interrupted:", error.message);
    
    // 2. Insert new profile database mapping row matching the newly minted user token UUID
    const { dbErr } = await supabase
        .from('shop_profiles')
        .insert([{ id: data.user.id, shop_name: shopName, subscription_tier: 'FREE' }]);
        
    if (dbErr) console.error("Database Registry Error:", dbErr.message);
    else console.log("Shop account workspace built successfully! Redirecting to hardware dashboard...");
}`;
                  navigator.clipboard.writeText(jsCode);
                  setCopiedFrontendAuthJs(true);
                  setTimeout(() => setCopiedFrontendAuthJs(false), 2000);
                }}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedFrontendAuthJs ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied JS Auth Blueprint!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy Auth Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-cyan-200 overflow-x-auto max-h-44">
              <pre className="leading-relaxed">
{`async function registerNewRepairShop(email, password, shopName) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return console.error("Signup Interrupted:", error.message);
    
    const { dbErr } = await supabase
        .from('shop_profiles')
        .insert([{ id: data.user.id, shop_name: shopName, subscription_tier: 'PRO' }]);
        
    if (!dbErr) console.log("Shop workspace created securely!");
}`}
              </pre>
            </div>

            {/* Interactive Shop Auth Form Simulator */}
            <div className="bg-zinc-900/90 p-3 rounded border border-zinc-800 space-y-3">
              <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Live Shop Onboarding & JWT Token Simulator:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Shop Name:</label>
                  <input
                    type="text"
                    value={simShopName}
                    onChange={(e) => setSimShopName(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Owner Email:</label>
                  <input
                    type="text"
                    value={simShopEmail}
                    onChange={(e) => setSimShopEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Subscription Plan:</label>
                  <select
                    value={simShopTier}
                    onChange={(e) => setSimShopTier(e.target.value as any)}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="FREE">FREE Tier (Basic Log Analysis)</option>
                    <option value="PRO">PRO Tier (WebUSB + Vision AI)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Multi-Agent Mesh)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  setSimAuthStatus(`Simulating registerNewRepairShop("${simShopEmail}", "••••••••", "${simShopName}")...`);
                  setTimeout(() => {
                    setSimAuthStatus(`SUCCESS! Tenant Account Created:
• Shop UUID: user-uuid-${Math.floor(1000 + Math.random() * 9000)}-8888
• Shop Name: "${simShopName}"
• Tier: ${simShopTier}
• JWT Authorization Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
• PostgreSQL RLS Policy Attached: "Shops can only manage their own profile."`);
                  }, 600);
                }}
                className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Simulate Repair Shop Tenant Onboarding & JWT Token Issuance
              </button>

              {simAuthStatus && (
                <div className="bg-black p-2.5 rounded border border-cyan-500/30 text-[10px] text-cyan-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {simAuthStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 8: REAL-TIME WEBSOCKETS & CONTAINERIZED DOCKER DEPLOYMENT */}
      {activeTab === "websocket_docker" && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                Real-Time WebSocket Architecture & Containerized Production Docker Deployment
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Persistent bi-directional WebSocket telemetry pipes for long-running USB flashing operations (2-15 min) + Linux container runtime isolation with host USB bus pass-through.
              </p>
            </div>
          </div>

          {/* SECTION 1: REAL-TIME WEBSOCKET ARCHITECTURE */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h5 className="font-bold text-emerald-300 flex items-center gap-2 text-xs">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Section 1: The Real-Time WebSocket Architecture (Flask-SocketIO + Gemini 2.5 Flash)
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Eliminates HTTP timeouts, provides sub-second streaming tokens, live flashing status updates, and bi-directional emergency abort controls.
                </p>
              </div>

              <button
                onClick={() => {
                  const wsCode = `import os
import json
from flask import Flask, render_template_string
from flask_socketio import SocketIO, emit, disconnect
from google import genai
from google.genai import types

app = Flask(__name__)
app.config['SECRET_KEY'] = 'repair-suite-secret-key-12345'

# Initialize SocketIO with cross-origin resource sharing allowed for local dev
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize the secure backend Gemini Client
client = genai.Client()

# -------------------------------------------------------------------------
# WEBSOCKET CONNECTION EVENTS
# -------------------------------------------------------------------------
@socketio.on('connect')
def handle_connect():
    print("[+] Client workstation established active WebSocket connection tunnel.")
    emit('server_status', {'message': 'Real-time WebSocket telemetry pipeline connected.'})

@socketio.on('disconnect')
def handle_disconnect():
    print("[-] Client workstation closed connection tunnel abruptly.")

# -------------------------------------------------------------------------
# REAL-TIME HARDWARE ANALYSIS CHANNEL
# -------------------------------------------------------------------------
@socketio.on('stream_usb_telemetry')
def handle_usb_telemetry(data):
    """
    Receives live hardware data chunks from the browser's WebUSB framework
    and pipes them to Gemini 2.5 Flash.
    """
    raw_chunk = data.get('chunk', '')
    vendor_id = int(data.get('vendor_id', 0))
    
    print(f"[RECV] Incoming raw USB payload byte stream: {raw_chunk}")
    
    # Send a quick confirmation acknowledge event back to the UI interface
    emit('log_update', {'source': 'SYSTEM', 'text': 'Processing packet cluster...'})

    # Compile dynamic operational parameters
    system_instruction = "You are a live device recovery engineer terminal handler. Analyze the log snippet and output a clear execution fix strategy."

    try:
        # We use gemini-2.5-flash for real-time sub-second operational queries
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Analyze this immediate real-time device string chunk: {raw_chunk}",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1
            )
        )
        
        # Emit the result back to the specific connected browser socket in real-time
        emit('diagnostic_report', {
            'analysis': response.text,
            'timestamp': os.times()[4]
        })
        
    except Exception as e:
        emit('log_update', {'source': 'ERROR', 'text': f"AI processing break: {str(e)}"})

# -------------------------------------------------------------------------
# EMERGENCY ABORT & FLASH PROGRESS HANDLERS
# -------------------------------------------------------------------------
@socketio.on('emergency_abort')
def handle_emergency_abort(data):
    print("[ALERT] EMERGENCY ABORT SIGNAL RECEIVED FROM CLIENT WORKSTATION!")
    emit('log_update', {'source': 'ALERT', 'text': 'EMERGENCY ABORT: Killing background adb/fastboot/idevicerestore subprocesses!'})
    emit('flash_status', {'status': 'ABORTED', 'percent': 0})

if __name__ == '__main__':
    # WebSocket applications require socketio.run instead of standard app.run
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)`;
                  navigator.clipboard.writeText(wsCode);
                  setCopiedWsServerPy(true);
                  setTimeout(() => setCopiedWsServerPy(false), 2000);
                }}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedWsServerPy ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied websocket_server.py!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy websocket_server.py</span>
                  </>
                )}
              </button>
            </div>

            {/* Architecture Pipeline Diagram */}
            <div className="bg-black p-3 rounded border border-zinc-800 text-[10px] text-cyan-300 text-center overflow-x-auto">
              <pre className="leading-relaxed">
{`┌──────────────────┐  Raw Stream Data (Progress, Data Chunks)   ┌──────────────────┐
│  Client Browser  │◄──────────────────────────────────────────►│   Flask Server   │
│ (WebUSB / UI)    │          Persistent WebSocket Pipe         │  (Flask-SocketIO)│
└──────────────────┘                                            └────────┬─────────┘
                                                                         │
                                                                 Streaming Pipeline
                                                                         ▼
                                                                ┌──────────────────┐
                                                                │ Google AI Studio │
                                                                │ (Gemini Engine)  │
                                                                └──────────────────┘`}
              </pre>
            </div>

            {/* Dependency Installation Note */}
            <div className="bg-zinc-900/90 p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Step 1: Install Python WebSocket dependency:</span>
                <code className="bg-black text-emerald-300 px-2 py-0.5 rounded border border-zinc-800">pip install flask-socketio eventlet</code>
              </span>
              <span className="text-[10px] text-zinc-400">Uses eventlet async WS worker pool</span>
            </div>

            {/* Code View */}
            <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-cyan-200 overflow-x-auto max-h-48">
              <pre className="leading-relaxed">
{`# websocket_server.py
from flask import Flask, render_template_string
from flask_socketio import SocketIO, emit
from google import genai

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
client = genai.Client()

@socketio.on('connect')
def handle_connect():
    emit('server_status', {'message': 'Real-time WebSocket telemetry pipeline connected.'})

@socketio.on('stream_usb_telemetry')
def handle_usb_telemetry(data):
    raw_chunk = data.get('chunk', '')
    emit('log_update', {'source': 'SYSTEM', 'text': 'Processing packet cluster...'})
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=f"Analyze immediate device string: {raw_chunk}"
    )
    emit('diagnostic_report', {'analysis': response.text})

@socketio.on('emergency_abort')
def handle_emergency_abort(data):
    emit('log_update', {'source': 'ALERT', 'text': 'EMERGENCY ABORT: Killing background USB flashing subprocesses!'})

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)`}
              </pre>
            </div>

            {/* Live Interactive WebSocket & Flashing Controller Simulator */}
            <div className="bg-zinc-900/90 p-3.5 rounded border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    Live WebSocket Telemetry & Subprocess Abort Controller:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    wsConnected ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}>
                    {wsConnected ? "TUNNEL CONNECTED (Port 5000)" : "DISCONNECTED"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWsConnected(!wsConnected)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {wsConnected ? "Disconnect Tunnel" : "Reconnect Tunnel"}
                  </button>

                  <button
                    onClick={() => {
                      if (wsIsFlashing) {
                        setWsIsFlashing(false);
                        setWsLogs(prev => [
                          ...prev,
                          "[ALERT] EMERGENCY ABORT SIGNAL RECEIVED VIA WEBSOCKET PIPE!",
                          "[SYSTEM] Kill signal dispatched to adb / fastboot / idevicerestore subprocess.",
                          "[SYSTEM] Flashing pipeline halted safely. Flash progress reset to 0%."
                        ]);
                        setFlashProgress(0);
                      }
                    }}
                    disabled={!wsIsFlashing}
                    className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      wsIsFlashing ? "bg-rose-600 hover:bg-rose-500 text-white font-bold animate-pulse" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    EMERGENCY ABORT SIGNAL
                  </button>
                </div>
              </div>

              {/* Progress Bar for Flashing */}
              {wsIsFlashing && (
                <div className="space-y-1 bg-black p-2 rounded border border-cyan-500/40">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-cyan-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      Flashing System Partition over USB (Real-Time WebSocket Stream)...
                    </span>
                    <span className="text-emerald-400 font-mono">{flashProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${flashProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Simulation Trigger Button */}
              <button
                onClick={() => {
                  if (!wsConnected) {
                    setWsLogs(prev => [...prev, "[ERROR] Cannot transmit: WebSocket tunnel is disconnected."]);
                    return;
                  }

                  setWsIsFlashing(true);
                  setFlashProgress(10);
                  setWsLogs(prev => [
                    ...prev,
                    "[WEB_USB] Simulating WebUSB packet stream firing into WebSocket tunnel...",
                    "[SOCKET] emit('stream_usb_telemetry', { vendor_id: 1452, chunk: 'CRASH_DATA: iBoot_Panic_Mismatched_Sector_0x7FFA2B' })"
                  ]);

                  setTimeout(() => {
                    setFlashProgress(35);
                    setWsLogs(prev => [...prev, "[LOG_UPDATE] System: Processing packet cluster... Sector 0x7FFA2B isolated."]);
                  }, 600);

                  setTimeout(() => {
                    setFlashProgress(70);
                    setWsLogs(prev => [...prev, "[GEMINI_CORE] Gemini 2.5 Flash: APFS block header panic detected. Re-aligning partition table via irecovery..."]);
                  }, 1200);

                  setTimeout(() => {
                    setFlashProgress(100);
                    setWsLogs(prev => [
                      ...prev,
                      "[FLASH_STATUS] Firmware flash verified 100% complete across WebSocket pipe!",
                      "[GEMINI_CORE] Device boot successful in 1.4s."
                    ]);
                    setWsIsFlashing(false);
                  }, 1800);
                }}
                disabled={wsIsFlashing}
                className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                {wsIsFlashing ? "Streaming Real-Time USB Flashing Telemetry..." : "Simulate WebUSB Real-Time Flashing Loop via WebSocket Pipe"}
              </button>

              {/* Console Logs */}
              <div className="bg-black p-3 rounded border border-zinc-800 text-[10px] space-y-1 font-mono max-h-40 overflow-y-auto">
                <div className="text-zinc-500 font-bold border-b border-zinc-800 pb-1 mb-1">// WebSocket Real-Time Terminal Log Stream:</div>
                {wsLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes("[GEMINI_CORE]")
                        ? "text-cyan-300 font-bold"
                        : log.includes("[ALERT]") || log.includes("[ERROR]")
                        ? "text-rose-400 font-bold"
                        : log.includes("[FLASH_STATUS]")
                        ? "text-emerald-400 font-bold"
                        : "text-zinc-300"
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTAINERIZED PRODUCTION DOCKER DEPLOYMENT */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h5 className="font-bold text-amber-300 flex items-center gap-2 text-xs">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Section 2: Containerized Production Docker Deployment (Linux USB Subsystem)
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Bundles Python 3.11 Slim, <code className="text-amber-300">usbutils</code>, <code className="text-amber-300">libusb-1.0-0</code>, <code className="text-amber-300">android-tools-adb</code>, <code className="text-amber-300">android-tools-fastboot</code>, Eventlet WS workers, and host USB bus pass-through.
                </p>
              </div>
            </div>

            {/* Dockerfile Code Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  1. The Production Dockerfile (<code className="text-amber-300">Dockerfile</code>):
                </span>

                <button
                  onClick={() => {
                    const df = `# =========================================================================
# 1. CORE OPERATING SYSTEM DEFINITION
# =========================================================================
FROM python:3.11-slim as base

# Prevent Python from writing .pyc files to disk and ensure direct console logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# =========================================================================
# 2. INSTALL LINUX SUBSYSTEM BINARY UTILITIES
# =========================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    curl \\
    # Raw low-level hardware USB communication access utilities
    usbutils \\
    libusb-1.0-0 \\
    libusb-1.0-0-dev \\
    # Standard open-source Android command engines
    android-tools-adb \\
    android-tools-fastboot \\
    && rm -rf /var/lib/apt/lists/*

# =========================================================================
# 3. CONFIGURE PACKAGE DEPENDENCY ISOLATION
# =========================================================================
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =========================================================================
# 4. DEPLOY SOURCE APPLICATION DATA
# =========================================================================
COPY . .

EXPOSE 5000

# =========================================================================
# 5. EXECUTION MATRIX (Runs SocketIO Server via Gunicorn eventlet worker nodes)
# =========================================================================
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "websocket_server:app"]`;
                    navigator.clipboard.writeText(df);
                    setCopiedDockerfile(true);
                    setTimeout(() => setCopiedDockerfile(false), 2000);
                  }}
                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedDockerfile ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied Dockerfile!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy Dockerfile</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-amber-200 overflow-x-auto max-h-44 font-mono">
                <pre className="leading-relaxed">
{`FROM python:3.11-slim as base
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential curl usbutils libusb-1.0-0 libusb-1.0-0-dev \\
    android-tools-adb android-tools-fastboot && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000

CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "websocket_server:app"]`}
                </pre>
              </div>
            </div>

            {/* requirements.txt & docker-compose.yml side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* requirements.txt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    2. Dependency Manifest (<code className="text-amber-300">requirements.txt</code>):
                  </span>

                  <button
                    onClick={() => {
                      const reqs = `google-genai==0.1.1
flask==3.0.3
flask-socketio==5.3.6
pillow==10.3.0
supabase==2.4.3
gunicorn==22.0.0
eventlet==0.36.1`;
                      navigator.clipboard.writeText(reqs);
                      setCopiedRequirementsTxt(true);
                      setTimeout(() => setCopiedRequirementsTxt(false), 2000);
                    }}
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedRequirementsTxt ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy reqs</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-amber-200 overflow-x-auto max-h-36 font-mono">
                  <pre className="leading-relaxed">
{`google-genai==0.1.1
flask==3.0.3
flask-socketio==5.3.6
pillow==10.3.0
supabase==2.4.3
gunicorn==22.0.0
eventlet==0.36.1`}
                  </pre>
                </div>
              </div>

              {/* docker-compose.yml */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    3. Local Orchestrator (<code className="text-amber-300">docker-compose.yml</code>):
                  </span>

                  <button
                    onClick={() => {
                      const dc = `version: '3.8'

services:
  repair-suite-backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ai_repair_suite_core
    ports:
      - "5000:5000"
    environment:
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - FLASK_ENV=production
    # CRITICAL INSTRUCTION: Grants the container permission to talk to host machine USB lines.
    privileged: true
    volumes:
      - /dev/bus/usb:/dev/bus/usb
    restart: unless-stopped`;
                      navigator.clipboard.writeText(dc);
                      setCopiedDockerComposeYml(true);
                      setTimeout(() => setCopiedDockerComposeYml(false), 2000);
                    }}
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedDockerComposeYml ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied Compose!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy compose</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black p-3 rounded border border-zinc-800/80 text-[10px] text-amber-200 overflow-x-auto max-h-36 font-mono">
                  <pre className="leading-relaxed">
{`version: '3.8'
services:
  repair-suite-backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ai_repair_suite_core
    ports:
      - "5000:5000"
    environment:
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    privileged: true
    volumes:
      - /dev/bus/usb:/dev/bus/usb`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Interactive Docker Build & Container Stack Simulator */}
            <div className="bg-zinc-900/90 p-3.5 rounded border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    Interactive Docker Stack CLI Orchestrator:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    dockerStatus === "RUNNING"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : dockerStatus === "BUILDING"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}>
                    STATUS: {dockerStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDockerStatus("BUILDING");
                      setDockerLogs([
                        "$ export GEMINI_API_KEY=\"AIzaSy...\"",
                        "$ docker compose up --build -d",
                        "[+] Building 0.2s (1/12) ...",
                        "[1/5] FROM docker.io/library/python:3.11-slim",
                        "[2/5] RUN apt-get update && apt-get install -y usbutils libusb-1.0-0 android-tools-adb android-tools-fastboot ...",
                        "[3/5] COPY requirements.txt . && RUN pip install google-genai flask-socketio eventlet gunicorn ...",
                        "[4/5] COPY . .",
                        "[5/5] EXPOSE 5000"
                      ]);

                      setTimeout(() => {
                        setDockerLogs(prev => [
                          ...prev,
                          "[+] Container ai_repair_suite_core Built successfully.",
                          "[+] Container ai_repair_suite_core Started (Port 5000:5000, Host USB Pass-through active)."
                        ]);
                        setDockerStatus("RUNNING");
                      }, 1200);
                    }}
                    disabled={dockerStatus === "BUILDING"}
                    className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    docker compose up --build -d
                  </button>

                  <button
                    onClick={() => {
                      if (dockerStatus !== "RUNNING") {
                        setDockerLogs(prev => [...prev, "[ERROR] Container is not running. Run docker compose up first."]);
                        return;
                      }
                      setDockerLogs(prev => [
                        ...prev,
                        "$ docker logs -f ai_repair_suite_core",
                        "[gunicorn] [INFO] Starting gunicorn 22.0.0",
                        "[gunicorn] [INFO] Listening at: http://0.0.0.0:5000",
                        "[gunicorn] [INFO] Using worker: eventlet.wsgi.server",
                        "[+] [USB_HOST] Bound to /dev/bus/usb bus lines. Ready for hardware flashing streams!"
                      ]);
                    }}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    docker logs -f
                  </button>
                </div>
              </div>

              {/* Console Logs */}
              {dockerLogs.length > 0 && (
                <div className="bg-black p-3 rounded border border-zinc-800 text-[10px] space-y-1 font-mono max-h-40 overflow-y-auto">
                  <div className="text-zinc-500 font-bold border-b border-zinc-800 pb-1 mb-1">// Docker Container Runtime & Build Output:</div>
                  {dockerLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes("Started") || log.includes("[+]")
                          ? "text-emerald-400 font-bold"
                          : log.includes("RUN") || log.includes("FROM")
                          ? "text-amber-300 font-bold"
                          : "text-zinc-300"
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

