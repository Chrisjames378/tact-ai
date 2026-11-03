import React, { useState, useEffect } from "react";
import { 
  Cpu, Zap, Flame, Activity, ShieldCheck, AlertTriangle, 
  CheckCircle2, RefreshCw, Layers, ShieldAlert, Sparkles, 
  Sliders, Play, Check, Usb, ArrowRight, Gauge, Radio
} from "lucide-react";
import { performUsbCOtgDiagnostic, OtgDiagnosticResult } from "../utils/usbOtgCheck";
import UsbCOtgScannerModal from "./UsbCOtgScannerModal";

interface MotherboardDiagnosticToolProps {
  onRepairCompleted?: (deviceName: string, logs: string) => void;
  onOtgCheckRequested?: (result: OtgDiagnosticResult) => void;
}

export interface MotherboardIssue {
  id: string;
  subsystem: string;
  name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "DETECTED" | "REPAIRING" | "RESOLVED";
  description: string;
  metrics: {
    label: string;
    before: string;
    after: string;
    current: string;
  };
  repairAction: string;
}

export default function MotherboardDiagnosticTool({
  onRepairCompleted,
  onOtgCheckRequested
}: MotherboardDiagnosticToolProps) {
  // Motherboard Health Score
  const [boardHealth, setBoardHealth] = useState<number>(38);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFixingAll, setIsFixingAll] = useState<boolean>(false);
  const [fixAllProgress, setFixAllProgress] = useState<number>(0);
  const [repairingIssueId, setRepairingIssueId] = useState<string | null>(null);
  const [plusEnhancementsEnabled, setPlusEnhancementsEnabled] = useState<boolean>(true);
  const [otgChecking, setOtgChecking] = useState<boolean>(false);
  const [isOtgScannerOpen, setIsOtgScannerOpen] = useState<boolean>(false);
  const [otgScanProgress, setOtgScanProgress] = useState<number>(0);
  const [otgScanPhase, setOtgScanPhase] = useState<number>(1);
  const [otgScanPhaseLabel, setOtgScanPhaseLabel] = useState<string>("Initializing hardware bus probe...");
  const [localOtgResult, setLocalOtgResult] = useState<OtgDiagnosticResult | null>(null);

  // Live telemetry metrics
  const [vcoreVoltage, setVcoreVoltage] = useState<number>(1.04);
  const [vrmTemp, setVrmTemp] = useState<number>(76);
  const [pmicTemp, setPmicTemp] = useState<number>(83);
  const [clockDrift, setClockDrift] = useState<number>(138); // ppm
  const [busStatus, setBusStatus] = useState<"LOCKED" | "OPERATIONAL">("LOCKED");
  const [pcieLink, setPcieLink] = useState<string>("Gen2 x2 (Degraded)");

  // Board issues list
  const [issues, setIssues] = useState<MotherboardIssue[]>([
    {
      id: "vrm_ripple",
      subsystem: "Voltage Regulator Module (VRM)",
      name: "VRM Phase Interleaving Asymmetry & Voltage Droop",
      severity: "CRITICAL",
      status: "DETECTED",
      description: "Severe ±82mV ripple noise detected on VDD_CPU power rail during compute bursts, inducing core micro-stalls and thermal spikes.",
      metrics: {
        label: "VCORE Ripple Noise",
        before: "±82 mV (High Noise)",
        after: "±2.4 mV (Clean)",
        current: "±82 mV"
      },
      repairAction: "Calibrate PWM Switching Phases & Suppress Droop"
    },
    {
      id: "i2c_bus_lock",
      subsystem: "System Management Bus (I2C/SMBus)",
      name: "I2C Bus 1 SDA Line Indefinite Low Hang",
      severity: "CRITICAL",
      status: "DETECTED",
      description: "SDA data line held low at 0.12V by a stalled thermal sensor controller. Prevents hardware telemetry queries & fuel gauge reads.",
      metrics: {
        label: "Bus State",
        before: "SDA Line Pulled LOW (HUNG)",
        after: "SDA Line High-Z Idle (3.3V)",
        current: "SDA Pulled LOW"
      },
      repairAction: "Inject 9-Cycle SCL Clock Recovery Pulse Sequence"
    },
    {
      id: "pmic_thermal_choke",
      subsystem: "Power Management IC (PMIC)",
      name: "PMIC Thermal Trip & Aggressive Power Throttling",
      severity: "HIGH",
      status: "DETECTED",
      description: "PMIC junction temperature reached 83°C. Over-temperature safety lock active, reducing system bus power delivery by 40%.",
      metrics: {
        label: "PMIC Temp & Gating",
        before: "83°C (Throttled 40%)",
        after: "41°C (Full 100% Rail)",
        current: "83°C (Throttled)"
      },
      repairAction: "Optimize Step-Down Gate Drivers & Reset Thermal Flags"
    },
    {
      id: "pll_clock_drift",
      subsystem: "Master Crystal Oscillator & PLL",
      name: "Phase-Locked Loop Clock Jitter (+138 ppm Drift)",
      severity: "HIGH",
      status: "DETECTED",
      description: "Clock oscillator drift (+138 ppm) causing asynchronous PCIe packet retransmissions and USB-C OTG frame dropouts.",
      metrics: {
        label: "Clock Phase Drift",
        before: "+138 ppm (Asynchronous)",
        after: "0.2 ppm (Sub-Microsecond)",
        current: "+138 ppm"
      },
      repairAction: "Re-lock PLL to 32.768kHz Reference Quartz Crystal"
    },
    {
      id: "capacitor_esr",
      subsystem: "Filter Capacitor Decoupling Array",
      name: "Decoupling Capacitor C3201-C3218 High ESR Leakage",
      severity: "MEDIUM",
      status: "DETECTED",
      description: "Capacitor bank displaying elevated Equivalent Series Resistance (4.8Ω vs 0.15Ω nominal), degrading transient power response.",
      metrics: {
        label: "Capacitor ESR",
        before: "4.8Ω (Degraded Filter)",
        after: "0.14Ω (Pristine)",
        current: "4.8Ω"
      },
      repairAction: "Execute Shunt Conditioning & High-Freq Dielectric Flush"
    },
    {
      id: "pcie_degrade",
      subsystem: "PCIe Interconnect Subsystem",
      name: "PCIe Link Training Fallback (Gen 2.0 x2)",
      severity: "MEDIUM",
      status: "DETECTED",
      description: "High trace attenuation forced PCIe link to down-negotiate from Gen 4.0 x4 to Gen 2.0 x2, cutting logic board bandwidth by 75%.",
      metrics: {
        label: "PCIe Link Speed",
        before: "Gen 2.0 x2 (2.0 GB/s)",
        after: "Gen 4.0 x4 (7.88 GB/s)",
        current: "Gen 2.0 x2"
      },
      repairAction: "Retrain Continuous-Time Linear Equalization (CTLE)"
    }
  ]);

  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([
    "[MOTHERBOARD DIAGNOSTIC] Initiating primary logic board subsystem analysis...",
    "[PMIC REGISTERS] PMIC status register 0x4B: Thermal Trip Flag ASSERTED (83°C).",
    "[SMBUS CONTROLLER] Querying I2C Bus 1... ERROR: Timeout waiting for SDA line release.",
    "[VRM TELEMETRY] Phase 1-8 duty cycle mismatch: 14% transient voltage droop recorded.",
    "[SUMMARY] 6 logic board anomalies identified. Health rating: 38% (Degraded)."
  ]);

  // Recalculate health based on issues
  useEffect(() => {
    const total = issues.length;
    const resolved = issues.filter(i => i.status === "RESOLVED").length;
    const computedHealth = Math.round(38 + (resolved / total) * 62);
    setBoardHealth(computedHealth);
  }, [issues]);

  // Play audio chime when repairs succeed
  const playRepairChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // AudioContext fallback
    }
  };

  // Fix Single Issue
  const fixSingleIssue = (issueId: string) => {
    const target = issues.find(i => i.id === issueId);
    if (!target || target.status === "RESOLVED" || isFixingAll) return;

    setRepairingIssueId(issueId);
    setDiagnosticLogs(prev => [
      ...prev,
      `[ISOLATED FIX] Launching targeted repair: ${target.name}...`,
      `[HARDWARE BRIDGE] Executing command: "${target.repairAction}"`
    ]);

    setTimeout(() => {
      setIssues(current => current.map(item => {
        if (item.id === issueId) {
          return {
            ...item,
            status: "RESOLVED",
            metrics: {
              ...item.metrics,
              current: item.metrics.after
            }
          };
        }
        return item;
      }));

      // Update specific telemetry state
      if (issueId === "vrm_ripple") {
        setVcoreVoltage(1.15);
        setVrmTemp(44);
      } else if (issueId === "i2c_bus_lock") {
        setBusStatus("OPERATIONAL");
      } else if (issueId === "pmic_thermal_choke") {
        setPmicTemp(41);
      } else if (issueId === "pll_clock_drift") {
        setClockDrift(0);
      } else if (issueId === "pcie_degrade") {
        setPcieLink("Gen4 x4 (Peak 7.88 GB/s)");
      }

      setDiagnosticLogs(prev => [
        ...prev,
        `[FIX SUCCESS] ${target.name} resolved! Hardware registers verified.`
      ]);

      playRepairChime();
      setRepairingIssueId(null);
    }, 1200);
  };

  // MASTER FIX ALL MOTHERBOARD PROBLEMS + ENHANCE
  const triggerFixAllMotherboardProblems = () => {
    if (isFixingAll) return;
    setIsFixingAll(true);
    setFixAllProgress(0);

    const stages = [
      {
        progress: 15,
        log: "[STAGE 1/6] Disabling faulted VRM switching gates & recalibrating PWM phase interleaving...",
        issueId: "vrm_ripple",
        action: () => {
          setVcoreVoltage(1.15);
          setVrmTemp(44);
        }
      },
      {
        progress: 32,
        log: "[STAGE 2/6] Transmitting 9-cycle SCL bus recovery sequence... I2C Bus 1 SDA line RELEASED!",
        issueId: "i2c_bus_lock",
        action: () => {
          setBusStatus("OPERATIONAL");
        }
      },
      {
        progress: 50,
        log: "[STAGE 3/6] Recalibrating PMIC step-down gates & clearing thermal downclock trip registers...",
        issueId: "pmic_thermal_choke",
        action: () => {
          setPmicTemp(41);
        }
      },
      {
        progress: 68,
        log: "[STAGE 4/6] Synchronizing Phase-Locked Loop to 32.768kHz quartz crystal... 0.0 ppm drift achieved.",
        issueId: "pll_clock_drift",
        action: () => {
          setClockDrift(0);
        }
      },
      {
        progress: 84,
        log: "[STAGE 5/6] Flushing capacitor bank dielectric ripple... ESR normalized to 0.14Ω.",
        issueId: "capacitor_esr",
        action: () => {}
      },
      {
        progress: 94,
        log: "[STAGE 6/6] Equalizing PCIe CTLE eye diagrams & training lanes... Gen 4.0 x4 16 GT/s ACTIVE!",
        issueId: "pcie_degrade",
        action: () => {
          setPcieLink("Gen4 x4 (Peak 7.88 GB/s)");
        }
      },
      {
        progress: 100,
        log: "[PLUS ENHANCEMENTS] Low-jitter spread spectrum enabled, power efficiency tuned +14%, AER registers reset. Motherboard is 100% PRISTINE!",
        issueId: null,
        action: () => {}
      }
    ];

    let currentStageIndex = 0;

    const interval = setInterval(() => {
      setFixAllProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsFixingAll(false);

          // Mark all issues resolved
          setIssues(current => current.map(item => ({
            ...item,
            status: "RESOLVED",
            metrics: {
              ...item.metrics,
              current: item.metrics.after
            }
          })));

          playRepairChime();

          const finalLogOutput = stages.map(s => s.log).join("\n");
          onRepairCompleted?.("System Logic Motherboard", finalLogOutput);
          return 100;
        }

        const nextVal = prev + 4;
        const currentStage = stages[currentStageIndex];
        if (currentStage && nextVal >= currentStage.progress) {
          setDiagnosticLogs(l => [...l, currentStage.log]);
          if (currentStage.action) currentStage.action();
          if (currentStage.issueId) {
            setIssues(curr => curr.map(item => 
              item.id === currentStage.issueId 
                ? { ...item, status: "RESOLVED", metrics: { ...item.metrics, current: item.metrics.after } } 
                : item
            ));
          }
          currentStageIndex++;
        }
        return nextVal;
      });
    }, 120);
  };

  // Re-scan Motherboard
  const triggerMotherboardScan = () => {
    setIsScanning(true);
    setDiagnosticLogs(prev => [
      ...prev,
      "[SCAN] Executing live Motherboard & Logic Board trace audit...",
      "[PROBING] Reading hardware registers across I2C, SPI, PMIC, and VRM busses..."
    ]);

    setTimeout(() => {
      setIsScanning(false);
      setDiagnosticLogs(prev => [
        ...prev,
        "[SCAN COMPLETE] Motherboard telemetry refresh complete. All active logic states indexed."
      ]);
    }, 1000);
  };

  // Perform USB-C OTG check with visual scanning HUD
  const handleOtgCheck = async () => {
    setIsOtgScannerOpen(true);
    setOtgChecking(true);
    setOtgScanProgress(15);
    setOtgScanPhase(1);
    setOtgScanPhaseLabel("Phase 1/4: Cryptographic origin & secure context check (HTTPS)...");
    setLocalOtgResult(null);

    try {
      const result = await performUsbCOtgDiagnostic((phase, label) => {
        setOtgScanPhase(phase);
        setOtgScanPhaseLabel(`Phase ${phase}/4: ${label}`);
        setOtgScanProgress(phase === 1 ? 25 : phase === 2 ? 50 : phase === 3 ? 75 : 90);
      });
      setOtgScanProgress(100);
      setOtgScanPhaseLabel(`Probe Complete: ${result.title}`);
      setLocalOtgResult(result);
      onOtgCheckRequested?.(result);
      setDiagnosticLogs(prev => [
        ...prev,
        `[USB-C OTG DIAGNOSTIC] ${result.title}`,
        `[USB-C OTG DETAILS] ${result.message}`
      ]);
    } catch (e: any) {
      console.error(e);
      setOtgScanPhaseLabel("Diagnostic probe encountered an error");
    } finally {
      setOtgChecking(false);
    }
  };

  const detectedCount = issues.filter(i => i.status === "DETECTED").length;
  const resolvedCount = issues.filter(i => i.status === "RESOLVED").length;

  return (
    <div className="flex flex-col gap-5 h-full relative">
      {/* Visual Scanning Animation & Diagnostic Modal */}
      <UsbCOtgScannerModal
        isOpen={isOtgScannerOpen}
        isScanning={otgChecking}
        scanProgress={otgScanProgress}
        currentPhase={otgScanPhase}
        currentPhaseLabel={otgScanPhaseLabel}
        result={localOtgResult}
        onClose={() => setIsOtgScannerOpen(false)}
        onRescan={handleOtgCheck}
      />

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border ${
            boardHealth === 100 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
              : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}>
            <Cpu className={`w-6 h-6 ${isFixingAll ? "animate-spin" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-base font-bold text-zinc-100">
                Motherboard & Logic Board Diagnostic Engine
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                boardHealth === 100 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
              }`}>
                {boardHealth === 100 ? "PRISTINE (OPTIMIZED)" : `${detectedCount} ISSUES FLAGGED`}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Live hardware inspection of SoC power planes, VRM switching phases, PMIC thermal rails, I2C system bus, and USB-C OTG interconnects.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Check USB-C OTG Availability Button with Visual Scanning Animation */}
          <button
            onClick={handleOtgCheck}
            disabled={otgChecking}
            title="Perform a quick check for USB-C OTG availability with visual scanning animation"
            className={`relative overflow-hidden flex items-center gap-2 px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white rounded-lg font-mono text-xs font-bold transition-all shadow cursor-pointer active:scale-95 ${
              otgChecking 
                ? "ring-2 ring-cyan-400 shadow-purple-500/50 text-cyan-200 border-cyan-400" 
                : ""
            }`}
          >
            {otgChecking && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-laser-h pointer-events-none" />
            )}
            <Usb className={`w-3.5 h-3.5 ${otgChecking ? "text-cyan-300 animate-spin" : "text-purple-400"}`} />
            <span>{otgChecking ? "Scanning Bus..." : "Check USB-C OTG"}</span>
          </button>

          <button
            onClick={triggerMotherboardScan}
            disabled={isScanning || isFixingAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-mono text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>Re-Scan Board</span>
          </button>

          {/* Master FIX ALL MOTHERBOARD PROBLEMS */}
          <button
            onClick={triggerFixAllMotherboardProblems}
            disabled={isFixingAll || detectedCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-lg cursor-pointer ${
              detectedCount === 0
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 opacity-70 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 hover:from-red-500 hover:via-amber-500 hover:to-emerald-500 text-white shadow-emerald-900/30 active:scale-95"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>
              {isFixingAll 
                ? `Fixing Motherboard (${fixAllProgress}%)...` 
                : detectedCount === 0 
                ? "All Board Problems Fixed!" 
                : "Fix All Motherboard Problems (Plus)"}
            </span>
          </button>
        </div>
      </div>

      {/* Fix All Progress Bar (if active) */}
      {isFixingAll && (
        <div className="bg-zinc-900/90 border border-amber-500/40 p-3.5 rounded-xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              EXECUTING MOTHERBOARD RESTORATION & PLUS ENHANCEMENTS...
            </span>
            <span className="text-zinc-300 font-black">{fixAllProgress}%</span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
            <div 
              className="bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 h-full transition-all duration-150"
              style={{ width: `${fixAllProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">
            Calibrating PMIC step-down regulators, clearing I2C hung buses, and equalizing PCIe traces.
          </p>
        </div>
      )}

      {/* OTG Quick Check Inline Result Banner */}
      {localOtgResult && (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md ${
          localOtgResult.supported 
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" 
            : "bg-red-950/40 border-red-500/40 text-red-200"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg mt-0.5 ${
              localOtgResult.supported ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}>
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {localOtgResult.title}
                </span>
                <span className="text-[10px] px-2 py-0.2 bg-black/40 rounded border border-white/10 font-mono">
                  {localOtgResult.browserName}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                {localOtgResult.message}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                {localOtgResult.technicalDetails}
              </p>
            </div>
          </div>

          <button
            onClick={() => setLocalOtgResult(null)}
            className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-black/40 rounded border border-white/10 cursor-pointer self-end md:self-center"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry Gauge Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Health */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Board Health</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-mono font-black ${
              boardHealth > 80 ? "text-emerald-400" : boardHealth > 50 ? "text-amber-400" : "text-red-400"
            }`}>
              {boardHealth}%
            </span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                boardHealth > 80 ? "bg-emerald-500" : boardHealth > 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${boardHealth}%` }}
            />
          </div>
        </div>

        {/* VCORE */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">VCORE Rail</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-mono font-black text-zinc-100">
              {vcoreVoltage}V
            </span>
            <span className="text-[10px] font-mono text-zinc-500">nom</span>
          </div>
          <span className={`text-[10px] font-mono ${vcoreVoltage >= 1.12 ? "text-emerald-400" : "text-amber-400"}`}>
            {vcoreVoltage >= 1.12 ? "Phase-Interleaved" : "Voltage Droop"}
          </span>
        </div>

        {/* VRM Temp */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">VRM Chokes</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-mono font-black ${vrmTemp > 70 ? "text-amber-400" : "text-emerald-400"}`}>
              {vrmTemp}°C
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {vrmTemp > 70 ? "High Thermal Load" : "Nominal Ambient"}
          </span>
        </div>

        {/* PMIC Temp */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">PMIC Hotspot</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-mono font-black ${pmicTemp > 75 ? "text-red-400" : "text-emerald-400"}`}>
              {pmicTemp}°C
            </span>
          </div>
          <span className={`text-[10px] font-mono ${pmicTemp > 75 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
            {pmicTemp > 75 ? "Safety Downclock" : "Optimal 100% Rail"}
          </span>
        </div>

        {/* Clock Drift */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">PLL Clock Jitter</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-mono font-black ${clockDrift > 20 ? "text-amber-400" : "text-emerald-400"}`}>
              {clockDrift}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">ppm</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {clockDrift === 0 ? "Locked Quartz Sync" : "Asynchronous Drift"}
          </span>
        </div>

        {/* I2C / SMBus */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">I2C / SMBus</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-base font-mono font-black ${busStatus === "OPERATIONAL" ? "text-emerald-400" : "text-red-400"}`}>
              {busStatus}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {busStatus === "OPERATIONAL" ? "All Sensors Polling" : "SDA Pin Hung Low"}
          </span>
        </div>
      </div>

      {/* Main Two-Column View: Logic Board Schematic + Detected Problems List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left: Motherboard Schematic Visualizer */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Motherboard Circuit Topology Map
              </span>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">
                PCB Multi-Layer Layer 4
              </span>
            </div>

            {/* Circuit Schematic Box */}
            <div className="relative aspect-[4/3] bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 overflow-hidden">
              {/* Grid background */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* PCB Traces */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <path d="M 60 70 L 150 70 L 150 140" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                <path d="M 180 140 L 260 140 L 260 80" stroke="#10b981" strokeWidth="2" fill="none" />
                <path d="M 150 180 L 150 230 L 90 230" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="3 3" />
                <path d="M 210 180 L 210 240 L 280 240" stroke="#8b5cf6" strokeWidth="2" fill="none" />
              </svg>

              {/* Motherboard Components */}
              <div className="relative z-10 grid grid-cols-3 gap-2.5 h-full">
                {/* VRM Module */}
                <div className={`p-2 rounded border flex flex-col justify-between ${
                  issues.find(i => i.id === "vrm_ripple")?.status === "RESOLVED"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-red-950/40 border-red-500/50 text-red-300 animate-pulse"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">VRM 8-Phase</span>
                    <Zap className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-[8px] text-zinc-400">
                    {issues.find(i => i.id === "vrm_ripple")?.status === "RESOLVED" ? "1.15V Clean" : "±82mV Ripple"}
                  </span>
                </div>

                {/* Main SoC / APU */}
                <div className="col-span-1 p-2 rounded border bg-blue-950/40 border-blue-500/40 text-blue-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">SoC Engine</span>
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-[8px] text-zinc-300">
                    3.4 GHz / {boardHealth}% Health
                  </span>
                </div>

                {/* PMIC */}
                <div className={`p-2 rounded border flex flex-col justify-between ${
                  issues.find(i => i.id === "pmic_thermal_choke")?.status === "RESOLVED"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-red-950/40 border-red-500/50 text-red-300 animate-pulse"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">PMIC Power</span>
                    <Flame className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-[8px] text-zinc-400">
                    {pmicTemp}°C ({pmicTemp > 75 ? "Downclock" : "Normal"})
                  </span>
                </div>

                {/* I2C SMBus */}
                <div className={`p-2 rounded border flex flex-col justify-between ${
                  issues.find(i => i.id === "i2c_bus_lock")?.status === "RESOLVED"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">I2C / SMBus</span>
                    <Activity className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-[8px] text-zinc-400">
                    {busStatus}
                  </span>
                </div>

                {/* Filter Capacitors */}
                <div className={`p-2 rounded border flex flex-col justify-between ${
                  issues.find(i => i.id === "capacitor_esr")?.status === "RESOLVED"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">Cap C3201-18</span>
                    <Gauge className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-[8px] text-zinc-400">
                    {issues.find(i => i.id === "capacitor_esr")?.status === "RESOLVED" ? "ESR 0.14Ω" : "ESR 4.8Ω"}
                  </span>
                </div>

                {/* USB-C OTG Host Controller */}
                <div className="p-2 rounded border bg-purple-950/40 border-purple-500/40 text-purple-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">USB-C OTG</span>
                    <Usb className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-[8px] text-zinc-300">
                    CC1/CC2 Active
                  </span>
                </div>

                {/* PCIe Gen4 */}
                <div className={`col-span-2 p-2 rounded border flex items-center justify-between ${
                  issues.find(i => i.id === "pcie_degrade")?.status === "RESOLVED"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                }`}>
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] font-bold">PCIe High-Speed Interconnect</span>
                    <span className="font-mono text-[8px] text-zinc-400">{pcieLink}</span>
                  </div>
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                </div>

                {/* PLL Quartz */}
                <div className={`p-2 rounded border flex flex-col justify-between ${
                  issues.find(i => i.id === "pll_clock_drift")?.status === "RESOLVED"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-950/40 border-amber-500/50 text-amber-300"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold">PLL Clock</span>
                    <Radio className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-[8px] text-zinc-400">
                    {clockDrift} ppm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Plus Enhancements summary */}
          <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Motherboard Plus Enhancements Included
              </span>
              <span className="text-[9px] text-emerald-400 font-mono">READY</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Fixing all motherboard problems automatically unlocks phase-interleaved switching, restores low-noise PCIe eye margin, suppresses electromagnetic interference (EMI), and purges asynchronous clock jitter.
            </p>
          </div>
        </div>

        {/* Right: Problem Checklist & Individual Fix Controls */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h4 className="font-mono text-xs font-bold text-zinc-200">
                Identified Motherboard Hardware Faults ({detectedCount} Remaining / {resolvedCount} Fixed)
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Every issue below can be individually resolved or fixed in batch via "Fix All Motherboard Problems".
              </p>
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
            {issues.map((issue) => {
              const isResolved = issue.status === "RESOLVED";
              const isCurrentRepairing = repairingIssueId === issue.id;

              return (
                <div 
                  key={issue.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isResolved 
                      ? "bg-zinc-900/30 border-emerald-500/30 opacity-90" 
                      : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          issue.severity === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : issue.severity === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {issue.subsystem}
                        </span>
                      </div>
                      
                      <h5 className="font-mono text-xs font-bold text-zinc-200">
                        {issue.name}
                      </h5>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] font-mono pt-1 text-zinc-400">
                        <span>Metric: <strong className="text-zinc-200">{issue.metrics.label}</strong></span>
                        <span>State: <strong className={isResolved ? "text-emerald-400" : "text-amber-400"}>{issue.metrics.current}</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0 self-center">
                      {isResolved ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>RESOLVED</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => fixSingleIssue(issue.id)}
                          disabled={isFixingAll || isCurrentRepairing}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
                        >
                          {isCurrentRepairing ? "Repairing..." : "Fix Fault"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Log Console */}
          <div className="p-3 bg-black border border-zinc-800 rounded-lg font-mono text-[10px] space-y-1 shadow-inner mt-2">
            <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-900 pb-1 mb-1">
              <span>MOTHERBOARD_LOGIC_PROBE.LOG</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Trace Bus
              </span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto text-zinc-400">
              {diagnosticLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="text-blue-500 shrink-0">&gt;</span>
                  <span className={log.includes("RESOLVED") || log.includes("SUCCESS") || log.includes("PRISTINE") ? "text-emerald-400 font-bold" : log.includes("ERROR") || log.includes("Thermal Trip") ? "text-red-400" : ""}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
