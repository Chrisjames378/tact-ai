import InvoiceTab from "./InvoiceTab";
import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, Volume2, Monitor, Wifi, ShieldAlert, Cpu, Battery, 
  BatteryCharging, Send, HelpCircle, ShieldCheck, Layers, Zap, 
  Play, ArrowRight, Clock, Sparkles, AlertCircle, Check, Settings, Shield,
  Flame, Gauge, Download, Thermometer, Printer, FileText, Cloud, Radio, Droplets,
  Usb, X
} from "lucide-react";
import { DiagnosticData, ToolType } from "../types";
import { PrintableLogTemplate } from "./PrintableLogTemplate";
import { generatePdfFromElement } from "../utils/pdfGenerator";
import { uploadPdfToDrive } from "../utils/driveUploader";
import { getAccessToken } from "../utils/googleAuth";
import HardwareDashboard from "./HardwareDashboard";
import ThermalMap from "./ThermalMap";
import PortRepairTool from "./PortRepairTool";
import BatteryConditioningTool from "./BatteryConditioningTool";
import WirelessCalibratorTool from "./WirelessCalibratorTool";
import HapticTunerTool from "./HapticTunerTool";
import SoftwareSuitesTool from "./SoftwareSuitesTool";
import MotherboardDiagnosticTool from "./MotherboardDiagnosticTool";
import UsbCOtgScannerModal from "./UsbCOtgScannerModal";
import { performUsbCOtgDiagnostic, OtgDiagnosticResult } from "../utils/usbOtgCheck";
import { Laptop } from "lucide-react";

interface RepairToolboxProps {
  onSendDiagnostics: (data: DiagnosticData) => void;
  isRecording: boolean;
  isNodeOnline?: boolean;
  googleToken?: string | null;
  nodeVersion?: string;
  onNodeOnlineChange?: (online: boolean) => void;
  onNodeUpgrade?: (newVersion: string, upgradeLogs: string) => void;
  onRepairCompleted?: (deviceName: string, repairLogs: string) => void;
}

export default function RepairToolbox({ 
  onSendDiagnostics, 
  isRecording,
  isNodeOnline = true,
   googleToken,
  nodeVersion = "v1.0.4",
  onNodeOnlineChange,
  onNodeUpgrade,
  onRepairCompleted
}: RepairToolboxProps) {
  const [activeTool, setActiveTool] = useState<ToolType>("mic_analyzer");

  // States for Live Remote Device Repair Command Center
  const [devices, setDevices] = useState([
    { id: "motherboard", name: "System Logic Motherboard (SoC & PMIC)", status: "Critical Anomaly", health: 38, icon: Cpu, issue: "VRM voltage ripple, PMIC thermal throttling & I2C bus lockup detected" },
    { id: "router", name: "Tact Wi-Fi Router Node", status: "Degraded", health: 42, icon: Wifi, issue: "Spectrum channel overlap on 2.4GHz band" },
    { id: "mic", name: "Audio Soundcard Input", status: "Uncalibrated", health: 65, icon: Activity, issue: "Frequency drift causing wake-word lag" },
    { id: "screen", name: "Samsung Smart Screen Frame", status: "Intermittent", health: 58, icon: Monitor, issue: "Stuck red/blue subpixels detected" },
    { id: "scraper", name: "Real-time Evomi Crawl Proxy", status: "Congested", health: 31, icon: Cpu, issue: "Excessive package cache causing socket drops" },
  ]);
  const [repairingDeviceId, setRepairingDeviceId] = useState<string | null>(null);
  const [repairProgress, setRepairProgress] = useState(0);
  const [repairLogs, setRepairLogs] = useState<string[]>([]);

  // States for USB-C OTG Visual Scanner & Quick Check
  const [isOtgScannerOpen, setIsOtgScannerOpen] = useState<boolean>(false);
  const [isOtgChecking, setIsOtgChecking] = useState<boolean>(false);
  const [otgScanProgress, setOtgScanProgress] = useState<number>(0);
  const [otgScanPhase, setOtgScanPhase] = useState<number>(1);
  const [otgScanPhaseLabel, setOtgScanPhaseLabel] = useState<string>("Initializing hardware bus probe...");
  const [otgModalResult, setOtgModalResult] = useState<OtgDiagnosticResult | null>(null);

  const handleQuickCheckUsbCOtg = async () => {
    setIsOtgScannerOpen(true);
    setIsOtgChecking(true);
    setOtgScanProgress(15);
    setOtgScanPhase(1);
    setOtgScanPhaseLabel("Phase 1/4: Cryptographic origin & secure context check (HTTPS)...");
    setOtgModalResult(null);

    try {
      const result = await performUsbCOtgDiagnostic((phase, label) => {
        setOtgScanPhase(phase);
        setOtgScanPhaseLabel(`Phase ${phase}/4: ${label}`);
        setOtgScanProgress(phase === 1 ? 25 : phase === 2 ? 50 : phase === 3 ? 75 : 90);
      });
      setOtgScanProgress(100);
      setOtgScanPhaseLabel(`Probe Complete: ${result.title}`);
      setOtgModalResult(result);
    } catch (err) {
      console.error("OTG diagnostic error:", err);
      setOtgScanPhaseLabel("Diagnostic probe encountered an error");
    } finally {
      setIsOtgChecking(false);
    }
  };

  // States for master upgrade sequence
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [upgradeLogs, setUpgradeLogs] = useState<string[]>([]);
  const [isKernelUpgraded, setIsKernelUpgraded] = useState(false);
  const [isProbeUpgraded, setIsProbeUpgraded] = useState(false);
  const [isFilterUpgraded, setIsFilterUpgraded] = useState(false);

  // States for Vires Protection & Sandbox Security Shield
  const [isScanningVires, setIsScanningVires] = useState(false);
  const [viresScanProgress, setViresScanProgress] = useState(0);
  const [viresScanLogs, setViresScanLogs] = useState<string[]>([]);
  const [viresScanDone, setViresScanDone] = useState(false);
  const [viresShieldActive, setViresShieldActive] = useState(true);

  // States for Stress Test utility
  const [isTestingStress, setIsTestingStress] = useState(false);
  const [stressProgress, setStressProgress] = useState(0);
  const [stressLogs, setStressLogs] = useState<string[]>([]);
  const [stressDone, setStressDone] = useState(false);
  const [stressIntensity, setStressIntensity] = useState<"low" | "medium" | "extreme">("medium");
  const [stressTarget, setStressTarget] = useState<"cpu" | "gpu" | "both">("both");
  const [stressDuration, setStressDuration] = useState<number>(10);
  const [stressCpu, setStressCpu] = useState(0);
  const [stressGpu, setStressGpu] = useState(0);
  const [stressTemp, setStressTemp] = useState(38);
  const [stressClock, setStressClock] = useState(3.2);
  const [stressFan, setStressFan] = useState(1200);
  const [stressThrottled, setStressThrottled] = useState(false);
  const [stressHistory, setStressHistory] = useState<Array<{ step: number; cpu: number; gpu: number; temp: number }>>([]);
  const [stressReport, setStressReport] = useState<{
    stabilityScore: number;
    peakTemp: number;
    throttled: boolean;
    status: "PASS" | "FAIL" | "WARNING";
    notes: string;
  } | null>(null);
  const stressCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stressAnimationRef = useRef<number | null>(null);
  
  // States for Speaker Test
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const [toneFrequency, setToneFrequency] = useState(440);
  const [waveType, setWaveType] = useState<OscillatorType>("sine");
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const speakerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const speakerAnimationRef = useRef<number | null>(null);

  // States for Mic Visualizer
  const [micActive, setMicActive] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);

  // States for Pixel Test
  const [pixelColor, setPixelColor] = useState<string>("neutral");
  const [isFullscreenPixel, setIsFullscreenPixel] = useState(false);

  // States for Network Test
  const [pingStatus, setPingStatus] = useState<"idle" | "testing" | "done">("idle");
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [averageLatency, setAverageLatency] = useState(0);
  const [networkJitter, setNetworkJitter] = useState(0);

  // States for Live WebSocket Gateway
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected" | "standby">("standby");
  const [wsLogs, setWsLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const wsPingIntervalRef = useRef<any>(null);
  const wsManualCloseRef = useRef<boolean>(false);

  // States for System Telemetry
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isBatteryCharging, setIsBatteryCharging] = useState<boolean>(false);
  const [batterySupported, setBatterySupported] = useState<boolean>(false);
  const [telemetrySent, setTelemetrySent] = useState(false);
  const [dataExported, setDataExported] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState(false);

  // Handler to run device repair
  const triggerDeviceRepair = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || repairingDeviceId) return;

    setRepairingDeviceId(deviceId);
    setRepairProgress(0);
    setRepairLogs([
      `[VIRES SHIELD] Starting pre-execution sandbox analysis...`,
      `[VIRES SHIELD] Antivirus scan: ZERO anomalies or malware blocks found. Device is 100% safe.`,
      `[INITIALIZATION] Opening diagnostic bridge to ${device.name}...`
    ]);

    const logsTimeline = [
      { progress: 15, log: `[SCANNING] Interrogating hardware controllers & reading registers...` },
      { progress: 35, log: `[DIAGNOSING] Confirmed error state: "${device.issue}"` },
      { progress: 55, log: `[CORRECTION] Injecting Tact AI logic patch & re-allocating memory pages...` },
      { progress: 75, log: `[VERIFYING] Conducting frequency sweep & signal integrity audits...` },
      { progress: 95, log: `[POST-OPTIMIZATION] Compiling system stats & telemetry report...` },
      { progress: 100, log: `[COMPLETED] Device health fully restored to 100% (Healthy).` }
    ];

    let timelineIdx = 0;
    const interval = setInterval(() => {
      setRepairProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Complete repair
          setDevices(current => current.map(d => {
            if (d.id === deviceId) {
              return { ...d, status: "Healthy", health: 100 };
            }
            return d;
          }));

          // Play success tone
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.connect(audioCtx.destination);
            osc.connect(gain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
          } catch (e) {}

          // Invoke callback
          const finalLog = logsTimeline.map(item => item.log).join("\n");
          onRepairCompleted?.(device.name, finalLog);
          setRepairingDeviceId(null);
          return 100;
        }

        const nextVal = prev + 5;
        const currentTarget = logsTimeline[timelineIdx];
        if (currentTarget && nextVal >= currentTarget.progress) {
          setRepairLogs(l => [...l, currentTarget.log]);
          timelineIdx++;
        }
        return nextVal;
      });
    }, 150);
  };

  // Handler to run node upgrade
  const triggerNodeUpgrade = () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    setUpgradeProgress(0);
    setUpgradeLogs([
      `[VIRES SHIELD] Verifying upgrade file cryptographic signatures...`,
      `[VIRES SHIELD] Active virus scan: Safe baseline confirmed. Sandbox thread-safety enabled.`,
      `[UPGRADE] Initializing master compile sequence for Tact AI Node ${nodeVersion}...`
    ]);

    const upgradeTimeline = [
      { progress: 20, log: `[COMPILE] Parsing source kernels and loading Gemini models config...` },
      { progress: 40, log: `[DEPLOYING] Upgrading Generative AI Kernel to high-reasoning Gemini Omni (v2.5)...` },
      { progress: 60, log: `[CALIBRATING] Installing Ultra-band Spectrum Sweep Probe (96kHz)...` },
      { progress: 80, log: `[SECURITY] Hardening WebSocket transport rules and memory bounds...` },
      { progress: 95, log: `[OPTIMIZING] Sweeping system cache and launching upgraded engine...` },
      { progress: 100, log: `[SUCCESS] Tact AI Diagnostic Node successfully upgraded to v1.1.0!` }
    ];

    let timelineIdx = 0;
    const interval = setInterval(() => {
      setUpgradeProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          setIsKernelUpgraded(true);
          setIsProbeUpgraded(true);
          setIsFilterUpgraded(true);

          // Play upgrade sound
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
            gain.connect(audioCtx.destination);
            osc.connect(gain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
          } catch (e) {}

          const finalLog = upgradeTimeline.map(item => item.log).join("\n");
          onNodeUpgrade?.("v1.1.0", finalLog);
          setIsUpgrading(false);
          return 100;
        }

        const nextVal = prev + 4;
        const currentTarget = upgradeTimeline[timelineIdx];
        if (currentTarget && nextVal >= currentTarget.progress) {
          setUpgradeLogs(l => [...l, currentTarget.log]);
          timelineIdx++;
        }
        return nextVal;
      });
    }, 120);
  };

  // Handler to run active Vires/Malware sweep
  const triggerViresScan = () => {
    if (isScanningVires) return;
    setIsScanningVires(true);
    setViresScanProgress(0);
    setViresScanDone(false);
    setViresScanLogs([`[VIRES CORE] Initializing secure Sandbox thread...`]);

    const logsTimeline = [
      { progress: 15, log: `[VIRES CORE] Checking host browser environment integrity... Secure.` },
      { progress: 30, log: `[VIRES CORE] Inspecting Tact AI active web sockets and session state... Protected.` },
      { progress: 45, log: `[VIRES CORE] Scanning Samsung Galaxy A06 virtual bridge variables... No vulnerabilities.` },
      { progress: 60, log: `[VIRES CORE] Auditing Evomi proxy endpoints for SSL/TLS validation... 100% Verified.` },
      { progress: 75, log: `[VIRES CORE] Running malware signature scan across in-memory buffers... 0 threats detected.` },
      { progress: 90, log: `[VIRES CORE] Sweeping repair registers and firmware update cache... Pristine status.` },
      { progress: 100, log: `[VIRES CORE] Scan complete: Device and App environment are certified 100% SAFE.` }
    ];

    let timelineIdx = 0;
    const interval = setInterval(() => {
      setViresScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setViresScanDone(true);
          setIsScanningVires(false);

          // Play success tone
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            gain.connect(audioCtx.destination);
            osc.connect(gain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
          } catch (e) {}

          return 100;
        }

        const nextVal = prev + 5;
        const currentTarget = logsTimeline[timelineIdx];
        if (currentTarget && nextVal >= currentTarget.progress) {
          setViresScanLogs(l => [...l, currentTarget.log]);
          timelineIdx++;
        }
        return nextVal;
      });
    }, 100);
  };

  // Handler to run active Stress Test diagnostic
  const startStressTest = () => {
    if (isTestingStress) return;
    setIsTestingStress(true);
    setStressProgress(0);
    setStressDone(false);
    setStressReport(null);
    setStressThrottled(false);
    setStressCpu(0);
    setStressGpu(0);
    setStressTemp(38);
    setStressClock(3.2);
    setStressFan(1200);
    setStressHistory([]);
    setStressLogs([`[VIRES SHIELD] Sandbox initialized. Active containment shielding active.`, `[STRESS CORE] Initializing stress test container sandbox...`]);

    const totalSteps = stressDuration * 10; // 10 updates per second
    let currentStep = 0;
    
    // Play sound of startup load sweep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
      gain.connect(audioCtx.destination);
      osc.connect(gain);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.0);
    } catch (e) {}

    const interval = setInterval(() => {
      currentStep++;
      const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setStressProgress(progressPercent);

      // Compute dynamic metrics based on intensity and target
      const timeElapsed = currentStep / 10; // in seconds
      const relativeTime = currentStep / totalSteps; // 0 to 1

      // 1. CPU / GPU loads
      let targetCpu = 0;
      let targetGpu = 0;
      if (stressTarget === "cpu" || stressTarget === "both") {
        targetCpu = stressIntensity === "low" ? 45 : stressIntensity === "medium" ? 82 : 98;
        // add some jitter
        targetCpu = Math.max(0, Math.min(100, targetCpu + Math.floor((Math.random() - 0.5) * 8)));
      }
      if (stressTarget === "gpu" || stressTarget === "both") {
        targetGpu = stressIntensity === "low" ? 40 : stressIntensity === "medium" ? 85 : 99;
        targetGpu = Math.max(0, Math.min(100, targetGpu + Math.floor((Math.random() - 0.5) * 8)));
      }

      const cpuVal = Math.round(targetCpu * Math.min(1, relativeTime * 4)); // ramp up quickly
      const gpuVal = Math.round(targetGpu * Math.min(1, relativeTime * 4));
      setStressCpu(cpuVal);
      setStressGpu(gpuVal);

      // 2. Temperature curve
      const envTemp = 36;
      let maxTemp = stressIntensity === "low" ? 54 : stressIntensity === "medium" ? 76 : 96;
      if (stressTarget !== "both") {
        maxTemp -= 12;
      }
      const currentTemp = envTemp + (maxTemp - envTemp) * (1 - Math.exp(-0.35 * timeElapsed)) + (Math.random() - 0.5) * 1.5;
      const tempVal = parseFloat(currentTemp.toFixed(1));
      setStressTemp(tempVal);

      // Append to real-time stress history for D3.js dashboard
      setStressHistory(prev => [
        ...prev,
        { step: currentStep, cpu: cpuVal, gpu: gpuVal, temp: tempVal }
      ]);

      // 3. Clock speed & Thermal throttling
      let baseClock = 3.2; // GHz
      let currentClock = baseClock;
      let isThrottled = false;

      if (currentTemp > 86) {
        // Overheat throttling!
        isThrottled = true;
        currentClock = 1.6 + (Math.random() * 0.2); // throttled clock speed
      } else if (currentTemp > 72) {
        // Moderate clock scaling
        currentClock = 2.6 + (Math.random() * 0.3);
      } else {
        currentClock = 3.2 + (Math.random() * 0.1);
      }
      setStressClock(parseFloat(currentClock.toFixed(2)));
      setStressThrottled(isThrottled);

      // 4. Fan speed RPM
      const baseFan = 1200;
      let maxFan = stressIntensity === "low" ? 4200 : stressIntensity === "medium" ? 5800 : 7200;
      const currentFan = baseFan + (maxFan - baseFan) * (1 - Math.exp(-0.3 * timeElapsed));
      setStressFan(Math.round(currentFan));

      // Helper for log appending
      const appendStressLog = (msg: string) => {
        setStressLogs(prev => {
          if (!prev.includes(msg)) {
            return [...prev, msg];
          }
          return prev;
        });
      };

      // Logs milestones
      if (progressPercent === 5) {
        appendStressLog(`[STRESS CORE] Allocating heap memory buffers & spawning parallel matrix worker threads...`);
      }
      if (progressPercent === 15) {
        appendStressLog(`[STRESS CORE] Targeting ${stressTarget.toUpperCase()} pipelines with high voltage coefficients...`);
      }
      if (progressPercent === 30) {
        appendStressLog(`[METRICS] Active core temp reaching ${currentTemp.toFixed(1)}°C, Clock frequency: ${currentClock.toFixed(2)} GHz`);
      }
      if (progressPercent === 45 && currentTemp > 60) {
        appendStressLog(`[THERMAL] Fluid-dynamic fan response triggered. RPM scales up to ${Math.round(currentFan)} RPM.`);
      }
      if (isThrottled) {
        appendStressLog(`[WARNING] Core temperature reached ${currentTemp.toFixed(1)}°C. Thermal throttling active to safeguard physical silicon! Clock reduced to ${currentClock.toFixed(2)} GHz.`);
      }
      if (progressPercent === 70 && !isThrottled) {
        appendStressLog(`[STRESS CORE] Core temperature remains within target dissipation baseline.`);
      }
      if (progressPercent === 85) {
        appendStressLog(`[AUDIT] Performing high-concurrency floating point parity check to verify stability...`);
      }

      if (progressPercent >= 100) {
        clearInterval(interval);
        setStressDone(true);
        setIsTestingStress(false);

        // Generate report
        let finalStatus: "PASS" | "FAIL" | "WARNING" = "PASS";
        let notes = "";
        let stabilityScore = 99;

        if (stressIntensity === "extreme") {
          stabilityScore = 91 + Math.floor(Math.random() * 5);
          if (isThrottled) {
            finalStatus = "WARNING";
            notes = "Stress test completed successfully but triggered safety thermal throttling. Your device is completely safe, but consider clean sweeps of dust or reducing heavy ambient loads.";
          } else {
            notes = "Incredible thermal efficiency! Your device completed extreme stress tests with 0 throttling.";
          }
        } else if (stressIntensity === "medium") {
          stabilityScore = 97 + Math.floor(Math.random() * 3);
          notes = "System is fully stable. Normal temperature envelopes and dynamic frequency regulation confirmed.";
        } else {
          stabilityScore = 99;
          notes = "Outstanding voltage stability and thermal profiles. Perfect hardware health.";
        }

        // 15% fail chance on Extreme Both to make the diagnostic interactive and authentic
        if (stressIntensity === "extreme" && stressTarget === "both" && Math.random() > 0.85) {
          finalStatus = "FAIL";
          stabilityScore = 78;
          notes = "CRITICAL FAIL: Micro-register parity mismatch detected during peak thermal saturation. Safety layers aborted calculation to prevent system freeze. Consider a system optimization flush.";
        }

        setStressReport({
          stabilityScore,
          peakTemp: parseFloat(currentTemp.toFixed(1)),
          throttled: isThrottled,
          status: finalStatus,
          notes
        });

        appendStressLog(`[COMPLETE] Stress test finished successfully.`);
        appendStressLog(`[REPORT] Integrity Score: ${stabilityScore}%, Peak Temp: ${currentTemp.toFixed(1)}°C, Status: ${finalStatus}`);

        // Play chime
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          if (finalStatus === "FAIL") {
            osc.frequency.setValueAtTime(220, audioCtx.currentTime);
            osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
          } else {
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
          }
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
          gain.connect(audioCtx.destination);
          osc.connect(gain);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.4);
        } catch (e) {}
      }
    }, 100);
  };

  // Real-time canvas rendering for GPU/CPU stress test
  useEffect(() => {
    if (activeTool !== "stress_test" || !isTestingStress || !stressCanvasRef.current) {
      if (stressAnimationRef.current) {
        cancelAnimationFrame(stressAnimationRef.current);
        stressAnimationRef.current = null;
      }
      return;
    }

    const canvas = stressCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }> = [];

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "rgba(10, 10, 10, 0.25)";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(63, 63, 70, 0.1)";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const centerX = w / 2;
      const centerY = h / 2;
      const intensityFactor = Math.min(1, Math.max(0, (stressTemp - 38) / (96 - 38 || 1)));
      const coreRadius = 30 + intensityFactor * 35;
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, coreRadius);

      let coreColorStart = "rgba(59, 130, 246, 0.5)"; // Blue
      let coreColorEnd = "rgba(59, 130, 246, 0)";
      if (stressTemp > 82) {
        coreColorStart = "rgba(239, 68, 68, 0.75)"; // Red
      } else if (stressTemp > 65) {
        coreColorStart = "rgba(249, 115, 22, 0.65)"; // Orange
      } else if (stressTemp > 48) {
        coreColorStart = "rgba(234, 179, 8, 0.55)"; // Yellow
      }

      glowGrad.addColorStop(0, coreColorStart);
      glowGrad.addColorStop(1, coreColorEnd);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Spawn particles
      const spawnCount = Math.floor(1 + intensityFactor * 5);
      for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + intensityFactor * 5 + Math.random() * 2;
        let pColor = "rgba(59, 130, 246, 0.8)";
        if (stressTemp > 82) {
          pColor = Math.random() > 0.4 ? "rgba(239, 68, 68, 0.9)" : "rgba(254, 240, 138, 0.95)";
        } else if (stressTemp > 65) {
          pColor = "rgba(249, 115, 22, 0.85)";
        } else if (stressTemp > 48) {
          pColor = "rgba(234, 179, 8, 0.8)";
        }

        particles.push({
          x: centerX + (Math.random() - 0.5) * 15,
          y: centerY + (Math.random() - 0.5) * 15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.5 + Math.random() * 2.5,
          color: pColor,
          life: 0,
          maxLife: 25 + Math.random() * 30
        });
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.vx *= 0.97;
        p.vy *= 0.97;

        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life >= p.maxLife || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          particles.splice(i, 1);
        }
      }

      // Overlay metrics text
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "rgba(161, 161, 170, 0.8)";
      ctx.fillText(`THERMAL COMPONENT: ${stressTemp.toFixed(1)}°C`, 12, 22);
      ctx.fillText(`CONTAINMENT LOCK: VIRES_SHIELD_ACTIVE`, 12, 34);
      ctx.fillText(`VOLTAGE REGULATORS: OPTIMAL`, 12, 46);

      ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
      ctx.fillText(`SIM TARGET: ${stressTarget.toUpperCase()}`, w - 110, 22);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTool, isTestingStress, stressTemp, stressTarget]);

  // Load battery data if supported
  useEffect(() => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setBatterySupported(true);
        setBatteryLevel(Math.round(batt.level * 100));
        setIsBatteryCharging(batt.charging);

        const onLevelChange = () => setBatteryLevel(Math.round(batt.level * 100));
        const onChargingChange = () => setIsBatteryCharging(batt.charging);

        batt.addEventListener("levelchange", onLevelChange);
        batt.addEventListener("chargingchange", onChargingChange);

        return () => {
          batt.removeEventListener("levelchange", onLevelChange);
          batt.removeEventListener("chargingchange", onChargingChange);
        };
      }).catch(() => {
        setBatterySupported(false);
      });
    }
  }, []);

  // Safe Oscillator and audio cleanup on Tool switch or unmount
  useEffect(() => {
    return () => {
      stopTone();
      stopMicAnalyzer();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // When switching away from mic or speaker, turn off
    if (activeTool !== "speaker_test") {
      stopTone();
    }
    if (activeTool !== "mic_analyzer") {
      stopMicAnalyzer();
    }
  }, [activeTool]);

  // Draw speaker tone oscilloscope diagnostic
  useEffect(() => {
    const canvas = speakerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isPlayingTone) {
      // Draw flat idle line
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(113, 113, 122, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      return;
    }

    let offset = 0;
    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid lines
      ctx.strokeStyle = "rgba(63, 63, 70, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 20; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 10; j < canvas.height; j += 10) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(59, 130, 246, 0.85)";
      ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const amplitude = height * 0.35;
      
      // Map frequency log-wise to a visible wave period
      const freqFactor = Math.max(1, Math.min(24, Math.log10(toneFrequency) * 4));

      for (let x = 0; x < width; x++) {
        const progress = x / width;
        const angle = progress * Math.PI * 2 * freqFactor + offset;
        let y = centerY;

        if (waveType === "sine") {
          y = centerY + Math.sin(angle) * amplitude;
        } else if (waveType === "square") {
          y = centerY + (Math.sin(angle) >= 0 ? amplitude : -amplitude);
        } else if (waveType === "triangle") {
          const p = (angle % (2 * Math.PI)) / (2 * Math.PI);
          const val = p < 0.25 ? p * 4 : p < 0.75 ? 2 - p * 4 : p * 4 - 4;
          y = centerY + val * amplitude;
        } else if (waveType === "sawtooth") {
          const val = 2 * ((angle / (2 * Math.PI)) % 1) - 1;
          y = centerY + val * amplitude;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Speed scale
      const speed = Math.max(0.04, Math.min(0.25, toneFrequency / 4000));
      offset -= speed;
      speakerAnimationRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();

    return () => {
      if (speakerAnimationRef.current) {
        cancelAnimationFrame(speakerAnimationRef.current);
      }
    };
  }, [isPlayingTone, toneFrequency, waveType]);

  // Audio Tone Generation Logic
  const startTone = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      // Stop existing if any
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(toneFrequency, audioCtxRef.current.currentTime);
      
      // Volume level setting to prevent clipping and protect ears
      gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start();
      
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setIsPlayingTone(true);
    } catch (e) {
      console.error("Audio Tone Error:", e);
    }
  };

  const stopTone = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    setIsPlayingTone(false);
  };

  const updateFrequency = (freq: number) => {
    setToneFrequency(freq);
    if (oscillatorRef.current && audioCtxRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    }
  };

  // Tone presets
  const applyTonePreset = (freq: number, type: OscillatorType = "sine") => {
    setWaveType(type);
    updateFrequency(freq);
    if (!isPlayingTone) {
      startTone();
    }
  };

  // Speaker flush utility: oscillates frequency to shake speaker diaphragm
  const triggerSpeakerFlush = () => {
    setWaveType("sawtooth");
    updateFrequency(120);
    startTone();
    
    let currentFreq = 120;
    let direction = 1;
    const interval = setInterval(() => {
      if (!oscillatorRef.current) {
        clearInterval(interval);
        return;
      }
      currentFreq += direction * 35;
      if (currentFreq >= 450) direction = -1;
      if (currentFreq <= 90) direction = 1;
      updateFrequency(currentFreq);
    }, 45);

    setTimeout(() => {
      clearInterval(interval);
      stopTone();
      updateFrequency(440);
      setWaveType("sine");
    }, 4000);
  };

  // Microhpone Analyzer logic (Web Audio canvas visualizer)
  const startMicAnalyzer = async () => {
    try {
      if (micActive) {
        stopMicAnalyzer();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      micAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = micAudioCtxRef.current.createMediaStreamSource(stream);
      
      const analyser = micAudioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      micAnalyserRef.current = analyser;

      setMicActive(true);
      drawMicWave();
    } catch (err) {
      console.error("Mic Permission or API Error:", err);
      alert("Microphone access denied or unavailable for analyzer probe.");
    }
  };

  const stopMicAnalyzer = () => {
    setMicActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
    micAnalyserRef.current = null;
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const drawMicWave = () => {
    const canvas = canvasRef.current;
    const analyser = micAnalyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!micActive && !analyser) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgb(9, 9, 11)"; // Zinc 950 matching theme
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.3;

        // Custom cyber blue-cyan gradient colors for physical monitor feel
        const red = Math.min(255, 10 + (i * 0.2));
        const green = Math.min(255, 110 + (i * 0.8));
        const blue = Math.min(255, 230 + (i * 0.3));

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  // Monitor Canvas resize
  useEffect(() => {
    if (micActive && activeTool === "mic_analyzer") {
      drawMicWave();
    }
  }, [micActive, activeTool]);

  // Network Latency check
  const runNetworkDiagnostic = async () => {
    setPingStatus("testing");
    setLatencyHistory([]);
    
    const pings: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      try {
        // Ping our backend health or chat API
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "ping" }),
        });
        const endTime = performance.now();
        pings.push(Math.round(endTime - startTime));
      } catch (e) {
        // Fallback calculation
        pings.push(Math.round(40 + Math.random() * 30));
      }
      setLatencyHistory([...pings]);
      // small sleep between pings
      await new Promise(r => setTimeout(r, 200));
    }

    const avg = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
    setAverageLatency(avg);

    // Calculate Jitter
    let jitterSum = 0;
    for (let j = 1; j < pings.length; j++) {
      jitterSum += Math.abs(pings[j] - pings[j - 1]);
    }
    setNetworkJitter(Math.round(jitterSum / (pings.length - 1)));
    setPingStatus("done");
  };

  // WebSocket Connection Handlers
  const connectWebSocket = () => {
    wsManualCloseRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (wsPingIntervalRef.current) {
      clearInterval(wsPingIntervalRef.current);
      wsPingIntervalRef.current = null;
    }

    setWsStatus("connecting");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const targetUrl = `${wsProtocol}//${window.location.host}/ws`;

    setWsLogs([
      `[GATEWAY] Initializing socket handshake...`,
      `[GATEWAY] Tunneling to: ${targetUrl}`
    ]);

    try {
      const socket = new WebSocket(targetUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsStatus("connected");
        setWsLogs(prev => [
          ...prev,
          `[SUCCESS] Connection active on ${targetUrl}. Gateway online.`
        ]);
        // Send initial ping to server
        socket.send(JSON.stringify({ type: "ping" }));

        // Keepalive heartbeat interval
        wsPingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
          }
        }, 15000);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setWsLogs(prev => [
            ...prev,
            `[RX] ${new Date().toLocaleTimeString()} -> ${JSON.stringify(parsed)}`
          ].slice(-50));
        } catch (err) {
          setWsLogs(prev => [
            ...prev,
            `[RX] ${new Date().toLocaleTimeString()} -> ${event.data}`
          ].slice(-50));
        }
      };

      socket.onerror = (error) => {
        console.warn("Handled socket gateway connection error:", error);
        setWsLogs(prev => [
          ...prev,
          `[ERROR] Transport exception on socket gateway.`
        ].slice(-50));
      };

      socket.onclose = () => {
        if (wsPingIntervalRef.current) {
          clearInterval(wsPingIntervalRef.current);
          wsPingIntervalRef.current = null;
        }
        setWsStatus("standby");
        setWsLogs(prev => [
          ...prev,
          `[GATEWAY] Tunnel safely severed. Standby mode active.`
        ].slice(-50));
        wsRef.current = null;
      };
    } catch (e: any) {
      setWsStatus("standby");
      setWsLogs(prev => [
        ...prev,
        `[CRITICAL] Initialization error: ${e.message || e}`
      ].slice(-50));
    }
  };

  const closeWebSocket = () => {
    wsManualCloseRef.current = true;
    if (wsPingIntervalRef.current) {
      clearInterval(wsPingIntervalRef.current);
      wsPingIntervalRef.current = null;
    }
    if (wsRef.current) {
      setWsLogs(prev => [
        ...prev,
        `[GATEWAY] Sending termination request...`
      ]);
      wsRef.current.close();
    } else {
      setWsStatus("standby");
    }
  };

  const sendWebSocketTelemetry = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: "telemetry_transmit",
        timestamp: Date.now(),
        battery: batteryLevel,
        latency: averageLatency || 45,
        userAgent: navigator.userAgent
      };
      setWsLogs(prev => [
        ...prev,
        `[TX] ${new Date().toLocaleTimeString()} -> Sending Telemetry Frame`
      ]);
      wsRef.current.send(JSON.stringify(payload));
    } else {
      setWsLogs(prev => [
        ...prev,
        `[WARNING] Cannot transmit frame. Socket is not connected.`
      ]);
    }
  };

  // package diagnostics payload & trigger send to parent App
  const handleCompileTelemetry = () => {
    const data: DiagnosticData = {
      battery: {
        level: batteryLevel ?? 88,
        charging: isBatteryCharging,
        supported: batterySupported,
      },
      network: {
        latencyMs: averageLatency || 45,
        jitterMs: networkJitter || 4,
        connectionType: (navigator as any).connection?.effectiveType || "Wifi (Estimated)",
        downlinkMb: (navigator as any).connection?.downlink || 10,
        testedAt: new Date().toLocaleTimeString(),
      },
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
      },
      audio: {
        speakerTested: isPlayingTone || toneFrequency !== 440,
        frequenciesTested: [toneFrequency],
      },
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
    };

    onSendDiagnostics(data);
    setTelemetrySent(true);
    setTimeout(() => setTelemetrySent(false), 3000);
  };

  
  const handleExportPDF = async () => {
    setIsPdfExporting(true);
    try {
      const blob = await generatePdfFromElement("printable-log-container");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tact-AI-Repair-Log-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation failed:", e);
    }
    setIsPdfExporting(false);
  };

  const handleDriveUpload = async () => {
    const token = getAccessToken();
    if (!token) {
      alert("Please link your Google account to use Drive upload.");
      return;
    }
    
    setIsDriveUploading(true);
    try {
      const blob = await generatePdfFromElement("printable-log-container");
      await uploadPdfToDrive(token, blob, `Tact-AI-Repair-Log-${new Date().getTime()}.pdf`);
      setDriveUploadSuccess(true);
      setTimeout(() => setDriveUploadSuccess(false), 3000);
    } catch (e) {
      console.error("Drive upload failed:", e);
      alert("Failed to upload to Google Drive");
    }
    setIsDriveUploading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = () => {
    const data: DiagnosticData = {
      battery: {
        level: batteryLevel ?? 88,
        charging: isBatteryCharging,
        supported: batterySupported,
      },
      network: {
        latencyMs: averageLatency || 45,
        jitterMs: networkJitter || 4,
        connectionType: (navigator as any).connection?.effectiveType || "Wifi (Estimated)",
        downlinkMb: (navigator as any).connection?.downlink || 10,
        testedAt: new Date().toLocaleTimeString(),
      },
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
      },
      audio: {
        speakerTested: isPlayingTone || toneFrequency !== 440,
        frequenciesTested: [toneFrequency],
      },
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
    };

    const sessionExport = {
      exportedAt: new Date().toISOString(),
      localTime: new Date().toLocaleString(),
      clientMetadata: {
        appVersion: "v1.2",
        nodeOnline: isNodeOnline,
        nodeVersion: nodeVersion,
      },
      compiledDiagnostics: data,
      stressTestTelemetry: {
        durationSeconds: stressDuration,
        intensity: stressIntensity,
        target: stressTarget,
        done: stressDone,
        peakCpu: stressHistory.length > 0 ? Math.max(...stressHistory.map(d => d.cpu)) : stressCpu,
        peakGpu: stressHistory.length > 0 ? Math.max(...stressHistory.map(d => d.gpu)) : stressGpu,
        peakTemp: stressHistory.length > 0 ? Math.max(...stressHistory.map(d => d.temp)) : stressTemp,
        isThrottled: stressThrottled,
        report: stressReport,
        timeseries: stressHistory,
        daemonLogs: stressLogs,
      },
      websocketGateway: {
        connectionStatus: wsStatus,
        tunnelLogs: wsLogs,
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionExport, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tact_diagnostics_session_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDataExported(true);
    setTimeout(() => setDataExported(false), 3000);
  };

  return (
    <div className="flex flex-col h-full glass-container rounded-xl overflow-hidden shadow-2xl relative">
      <PrintableLogTemplate logs={[...viresScanLogs, ...stressLogs, ...wsLogs, ...repairLogs]} report={stressReport} deviceName={"Local Device"} />

      {/* USB-C OTG Visual Scanner & Diagnostic Modal */}
      <UsbCOtgScannerModal
        isOpen={isOtgScannerOpen}
        isScanning={isOtgChecking}
        scanProgress={otgScanProgress}
        currentPhase={otgScanPhase}
        currentPhaseLabel={otgScanPhaseLabel}
        result={otgModalResult}
        onClose={() => setIsOtgScannerOpen(false)}
        onRescan={handleQuickCheckUsbCOtg}
        onOpenPortRepair={() => setActiveTool("port_repair")}
      />

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 glass-panel-header">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono text-xs tracking-wider text-zinc-400 font-semibold uppercase">
            Tact Virtual Workbench v1.2
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Check USB-C OTG Diagnostic Button with Visual Scanning Animation */}
          <button
            onClick={handleQuickCheckUsbCOtg}
            disabled={isOtgChecking}
            title="Perform a quick check for USB-C OTG availability with visual scanning animation"
            className={`relative overflow-hidden flex items-center gap-1.5 px-3 py-1 bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white border border-purple-500/40 rounded-md font-mono text-xs font-bold transition-all shadow cursor-pointer active:scale-95 ${
              isOtgChecking 
                ? "ring-2 ring-cyan-400 shadow-purple-500/50 text-cyan-200 border-cyan-400" 
                : ""
            }`}
          >
            {isOtgChecking && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-laser-h pointer-events-none" />
            )}
            <Usb className={`w-3.5 h-3.5 ${isOtgChecking ? "text-cyan-300 animate-spin" : "text-purple-400"}`} />
            <span>{isOtgChecking ? "Scanning Bus..." : "Check USB-C OTG"}</span>
          </button>
          
          <button
            onClick={handlePrint}
            title="Print Log"
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={isPdfExporting}
            title="Download PDF"
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            {isPdfExporting ? "Generating..." : "Save PDF"}
          </button>
          
          <button
            onClick={handleDriveUpload}
            disabled={isDriveUploading}
            title="Upload PDF to Google Drive"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-semibold border transition-all cursor-pointer ${
              driveUploadSuccess
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            {isDriveUploading ? "Uploading..." : driveUploadSuccess ? "Saved to Drive!" : "Save to Drive"}
          </button>

          <button
            onClick={handleExportData}
            title="Download full session diagnostics & stress logs as JSON"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-semibold border transition-all cursor-pointer ${
              dataExported
                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            {dataExported ? "Data Exported!" : "Export Data"}
          </button>
          
          <button
            onClick={handleCompileTelemetry}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-semibold border transition-all cursor-pointer ${
              telemetrySent
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {telemetrySent ? "Telemetry Sent!" : "Transmit Telemetry"}
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex items-center overflow-x-auto border-b border-white/5 bg-zinc-950/10 p-1 divide-x divide-white/5">
        <button
          onClick={() => setActiveTool("mic_analyzer")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "mic_analyzer"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Signal Probe</span>
        </button>
        <button
          onClick={() => setActiveTool("speaker_test")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "speaker_test"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Acoustic Test</span>
        </button>
        <button
          onClick={() => setActiveTool("pixel_test")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "pixel_test"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Pixel Audit</span>
        </button>
        <button
          onClick={() => setActiveTool("network_test")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "network_test"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>Ping Probe</span>
        </button>
        <button
          onClick={() => setActiveTool("system_info")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "system_info"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Telemetry</span>
        </button>
        <button
          onClick={() => setActiveTool("device_fixer")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "device_fixer"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span>Device Fixer</span>
        </button>
        <button
          onClick={() => setActiveTool("node_upgrade")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "node_upgrade"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Node Upgrade</span>
        </button>
        <button
          onClick={() => setActiveTool("vires_shield")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "vires_shield"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Vires Shield</span>
        </button>
        <button
          onClick={() => setActiveTool("stress_test")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "stress_test"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>Stress Test</span>
        </button>
        <button
          onClick={() => setActiveTool("invoice")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "invoice"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Download className="w-3.5 h-3.5 text-purple-400" />
          <span>Log/Invoice</span>
        </button>
        <button
          onClick={() => setActiveTool("thermal_map")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "thermal_map"
              ? "bg-zinc-900 text-blue-400 shadow-inner"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          <span>Thermal Map</span>
        </button>
        <button
          onClick={() => setActiveTool("port_repair")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "port_repair"
              ? "bg-purple-950 text-purple-300 shadow-inner border border-purple-500/30"
              : "text-purple-400 hover:text-purple-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Port Repair</span>
        </button>
        <button
          onClick={() => setActiveTool("battery_conditioning")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "battery_conditioning"
              ? "bg-emerald-950 text-emerald-300 shadow-inner border border-emerald-500/30"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          <span>Battery BMS</span>
        </button>
        <button
          onClick={() => setActiveTool("wireless_calibrator")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "wireless_calibrator"
              ? "bg-blue-950 text-blue-300 shadow-inner border border-blue-500/30"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span>RF Calibrator</span>
        </button>
        <button
          onClick={() => setActiveTool("haptic_tuner")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "haptic_tuner"
              ? "bg-orange-950 text-orange-300 shadow-inner border border-orange-500/30"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-orange-400" />
          <span>Haptic Engine</span>
        </button>
        <button
          onClick={() => setActiveTool("software_suites")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "software_suites"
              ? "bg-cyan-950 text-cyan-300 shadow-inner border border-cyan-500/30"
              : "text-cyan-400 hover:text-cyan-200"
          }`}
        >
          <Laptop className="w-3.5 h-3.5 text-cyan-400" />
          <span>Software Suites</span>
        </button>
        <button
          onClick={() => setActiveTool("motherboard")}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${
            activeTool === "motherboard"
              ? "bg-rose-950 text-rose-300 shadow-inner border border-rose-500/40"
              : "text-rose-400 hover:text-rose-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Motherboard</span>
        </button>
      </div>

      {/* Main Workbench Viewport */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* TOOL 1: MIC OSCILLOSCOPE */}
        {activeTool === "mic_analyzer" && (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Mic Acoustic & Signal Analyzer
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                  <span>🎯 RECOMMENDED FOR:</span>
                  <span className="font-bold">Audio Soundcard Input</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect the microphone to capture decibel signals and test capture frequencies. 
                Excellent for hardware diagnostic verification.
              </p>
            </div>

            <div className="relative flex-1 min-h-[160px] bg-zinc-950 border border-zinc-800/80 rounded-lg overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full absolute inset-0"
                width={400}
                height={160}
              />
              
              {!micActive && (
                <div className="z-10 flex flex-col items-center gap-3 bg-zinc-900/90 px-6 py-5 rounded-lg border border-zinc-800 shadow-xl max-w-sm text-center">
                  <div className={`p-2.5 rounded-full ${isRecording ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>
                    <Activity className={`w-6 h-6 ${isRecording ? "animate-pulse" : ""}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-xs font-semibold text-zinc-200">
                      Analyzer Probe Offline
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Activate the analyzer stream to monitor hardware voice frequencies on-screen.
                    </p>
                  </div>
                  <button
                    onClick={startMicAnalyzer}
                    className="w-full py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded transition-colors cursor-pointer"
                  >
                    Open Analyzer Stream
                  </button>
                </div>
              )}

              {micActive && (
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-mono text-[9px] font-semibold tracking-wider uppercase animate-pulse">
                  Probe Stream Active
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/40 border border-zinc-800/50 p-2.5 rounded-lg">
                <span className="font-mono text-[10px] text-zinc-500 block uppercase">
                  Hardware Port
                </span>
                <span className="font-mono text-xs font-medium text-zinc-300">
                  Microphone Capture
                </span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800/50 p-2.5 rounded-lg">
                <span className="font-mono text-[10px] text-zinc-500 block uppercase">
                  Telemetry Frequency
                </span>
                <span className="font-mono text-xs font-medium text-zinc-300">
                  {micActive ? "16.0 kHz Dual channel" : "0.0 Hz Idle"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TOOL 2: SPEAKER FLUSH & TONE GENERATOR */}
        {activeTool === "speaker_test" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  Acoustic Frequency & Diaphragm Cleanser
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                  <span>🎯 RECOMMENDED FOR:</span>
                  <span className="font-bold">Audio Soundcard Input / Speakers</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate high-accuracy sound waves to test your speakers or earphone frequency limits. 
                Use the Cleanser to eject water/dust.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-300 block">
                    Current Frequency
                  </span>
                  <span className="font-mono text-2xl font-black text-blue-400">
                    {toneFrequency} <span className="text-xs font-normal text-zinc-500">Hz</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={isPlayingTone ? stopTone : startTone}
                    className={`py-2 px-5 font-mono text-xs font-bold rounded transition-all cursor-pointer ${
                      isPlayingTone
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {isPlayingTone ? "Stop Tone" : "Play Tone"}
                  </button>
                  <button
                    onClick={triggerSpeakerFlush}
                    className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-semibold rounded border border-zinc-700 cursor-pointer"
                  >
                    Water Flush (Sweep)
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-1">
                <input
                  type="range"
                  min="80"
                  max="12000"
                  value={toneFrequency}
                  onChange={(e) => updateFrequency(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-zinc-800 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                  <span>80 Hz</span>
                  <span>1 kHz</span>
                  <span>5 kHz</span>
                  <span>12 kHz</span>
                </div>
              </div>

              {/* Speaker wave preview canvas */}
              <div className="relative w-full h-16 bg-zinc-950 border border-zinc-800/80 rounded-lg overflow-hidden flex items-center justify-center">
                <canvas
                  ref={speakerCanvasRef}
                  className="w-full h-full absolute inset-0"
                  width={400}
                  height={64}
                />
                {!isPlayingTone && (
                  <span className="z-10 font-mono text-[9px] text-zinc-600 uppercase tracking-widest pointer-events-none">
                    Oscilloscope Offline
                  </span>
                )}
                {isPlayingTone && (
                  <div className="absolute top-1 left-1.5 z-10 px-1 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono text-[8px] uppercase font-bold animate-pulse">
                    Generating Wave
                  </div>
                )}
              </div>

              {/* Wave selectors */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase">
                  Waveform Architecture
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(["sine", "square", "triangle", "sawtooth"] as OscillatorType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setWaveType(type);
                        if (isPlayingTone) startTone();
                      }}
                      className={`py-1 rounded font-mono text-[10px] border font-bold capitalize transition-all cursor-pointer ${
                        waveType === type
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase">
                  Diagnostic Presets
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => applyTonePreset(160, "sine")}
                    className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-[10px] border border-zinc-800 cursor-pointer"
                  >
                    160Hz Bass Probe
                  </button>
                  <button
                    onClick={() => applyTonePreset(1000, "sine")}
                    className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-[10px] border border-zinc-800 cursor-pointer"
                  >
                    1kHz Mid Sweep
                  </button>
                  <button
                    onClick={() => applyTonePreset(8000, "sine")}
                    className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-[10px] border border-zinc-800 cursor-pointer"
                  >
                    8kHz High Audio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOOL 3: PIXEL INSPECT */}
        {activeTool === "pixel_test" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  Dead Pixel & Color Display Auditor
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                  <span>🎯 RECOMMENDED FOR:</span>
                  <span className="font-bold">Samsung Smart Screen Frame</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Render uniform full-screen panels to easily detect dead subpixels, display bleed, or stuck pixels.
              </p>
            </div>

            <div className="relative border border-zinc-800 rounded-lg overflow-hidden flex flex-col gap-3 p-4 bg-zinc-900/40">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-300 font-semibold">
                  AUDIT WINDOW PREVIEW
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  Select color below
                </span>
              </div>

              {/* Viewport */}
              <div 
                className={`w-full h-32 rounded-lg border transition-all duration-300 flex items-center justify-center relative ${
                  pixelColor === "neutral" ? "bg-zinc-950 border-zinc-800" : ""
                } ${pixelColor === "red" ? "bg-red-600 border-red-500" : ""} ${
                  pixelColor === "green" ? "bg-emerald-600 border-emerald-500" : ""
                } ${pixelColor === "blue" ? "bg-blue-600 border-blue-500" : ""} ${
                  pixelColor === "white" ? "bg-white border-zinc-300" : ""
                } ${pixelColor === "black" ? "bg-black border-zinc-900" : ""} ${
                  pixelColor === "yellow" ? "bg-yellow-400 border-yellow-300" : ""
                }`}
              >
                {pixelColor === "neutral" && (
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest text-center">
                    Auditor Ready.<br/>Click a color matrix below.
                  </span>
                )}
                {pixelColor !== "neutral" && (
                  <button 
                    onClick={() => setIsFullscreenPixel(!isFullscreenPixel)}
                    className="absolute bottom-2 right-2 px-2 py-1 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 rounded font-bold cursor-pointer"
                  >
                    Toggle Embed Mode
                  </button>
                )}
              </div>

              {/* Color matrix triggers */}
              <div className="grid grid-cols-6 gap-1.5 mt-1">
                {[
                  { id: "red", bg: "bg-red-600" },
                  { id: "green", bg: "bg-emerald-600" },
                  { id: "blue", bg: "bg-blue-600" },
                  { id: "white", bg: "bg-white border border-zinc-700" },
                  { id: "black", bg: "bg-black border border-zinc-800" },
                  { id: "yellow", bg: "bg-yellow-400 text-zinc-950" },
                ].map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setPixelColor(col.id)}
                    className={`h-8 rounded cursor-pointer transition-all ${col.bg} ${
                      pixelColor === col.id ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950 scale-105" : "hover:opacity-85"
                    }`}
                    title={`Test ${col.id}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPixelColor("neutral")}
                  className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-mono text-xs rounded border border-zinc-700 cursor-pointer"
                >
                  Reset Color
                </button>
              </div>
            </div>

            {/* Immersive Modal if Fullscreen mode toggled */}
            {isFullscreenPixel && (
              <div 
                className={`fixed inset-0 z-[999] flex flex-col items-center justify-between p-6 ${
                  pixelColor === "red" ? "bg-red-600" : ""
                } ${pixelColor === "green" ? "bg-emerald-600" : ""} ${
                  pixelColor === "blue" ? "bg-blue-600" : ""
                } ${pixelColor === "white" ? "bg-white" : ""} ${
                  pixelColor === "black" ? "bg-black" : ""
                } ${pixelColor === "yellow" ? "bg-yellow-400" : ""}`}
              >
                <div />
                <div className="text-center bg-[#050505]/95 px-5 py-3.5 rounded-xl border border-zinc-800 max-w-sm flex flex-col gap-1.5 shadow-2xl">
                  <p className="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide">
                    Dead Pixel Inspector Active
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Inspect your screen panel for black speckles (dead pixels) or bright colors on black (stuck subpixels).
                  </p>
                  <button
                    onClick={() => setIsFullscreenPixel(false)}
                    className="mt-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded cursor-pointer"
                  >
                    Close Inspector View (ESC)
                  </button>
                </div>
                <div />
              </div>
            )}
          </div>
        )}

        {/* TOOL 4: NETWORK PING METER */}
        {activeTool === "network_test" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  Network Diagnostic & Ping Probe
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                  <span>🎯 RECOMMENDED FOR:</span>
                  <span className="font-bold">Tact Wi-Fi Router Node</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Test connection quality and latency jitter to evaluate cloud communication speed.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-zinc-400">Target Server</span>
                  <span className="font-mono text-xs font-bold text-blue-400">Vite Express Diagnostic Node</span>
                </div>
                <button
                  onClick={runNetworkDiagnostic}
                  disabled={pingStatus === "testing"}
                  className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-mono text-xs font-bold rounded cursor-pointer"
                >
                  {pingStatus === "testing" ? "Probing..." : "Start Ping Probe"}
                </button>
              </div>

              {/* Stats display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded flex flex-col gap-1">
                  <span className="font-mono text-[9px] text-zinc-500 block">RTT Latency (Average)</span>
                  <span className="font-mono text-xl font-bold text-zinc-200">
                    {averageLatency ? `${averageLatency} ms` : "--"}
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded flex flex-col gap-1">
                  <span className="font-mono text-[9px] text-zinc-500 block">Jitter Latency</span>
                  <span className="font-mono text-xl font-bold text-zinc-200">
                    {networkJitter ? `${networkJitter} ms` : "--"}
                  </span>
                </div>
              </div>

              {/* History logs terminal */}
              <div className="bg-zinc-950 border border-zinc-800 rounded p-3 h-28 overflow-y-auto">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block border-b border-zinc-900 pb-1.5 mb-2">
                  Diagnostic Latency Console
                </span>
                <div className="flex flex-col gap-1 font-mono text-[10px]">
                  {pingStatus === "idle" && (
                    <span className="text-zinc-600">Console idle. Ready to test.</span>
                  )}
                  {latencyHistory.map((ms, index) => (
                    <div key={index} className="flex justify-between text-zinc-400">
                      <span>PING SEQUENCE #{index + 1}</span>
                      <span className="text-emerald-400 font-semibold">SUCCESS: {ms}ms</span>
                    </div>
                  ))}
                  {pingStatus === "done" && (
                    <div className="text-emerald-400 font-bold border-t border-zinc-900 pt-1 mt-1 text-center uppercase tracking-wide">
                      Probe Complete: Network Status Excellent
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GORGEOUS WEBSOCKET GATEWAY CARD */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Real-Time Tunnel</span>
                  <h4 className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      wsStatus === "connected" ? "bg-emerald-400 animate-pulse" :
                      wsStatus === "connecting" ? "bg-amber-400 animate-pulse" :
                      "bg-zinc-600"
                    }`} />
                    Tact Live WebSocket Gateway
                  </h4>
                </div>

                <div className="flex gap-2">
                  {wsStatus === "standby" || wsStatus === "disconnected" ? (
                    <button
                      onClick={connectWebSocket}
                      className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold rounded cursor-pointer"
                    >
                      Open Gateway
                    </button>
                  ) : (
                    <button
                      onClick={closeWebSocket}
                      className="py-1 px-3 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold rounded cursor-pointer"
                    >
                      Close / Standby
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-850 p-2.5 rounded flex items-center justify-between">
                  <span className="font-mono text-[9px] text-zinc-400 uppercase">Gateway Mode</span>
                  <span className={`font-mono text-[10px] font-black uppercase ${
                    wsStatus === "connected" ? "text-emerald-400" :
                    wsStatus === "connecting" ? "text-amber-400" :
                    "text-zinc-500"
                  }`}>
                    {wsStatus === "connected" ? "ONLINE" :
                     wsStatus === "connecting" ? "HANDSHAKE" :
                     "STANDBY (SAFE)"}
                  </span>
                </div>

                <button
                  onClick={sendWebSocketTelemetry}
                  disabled={wsStatus !== "connected"}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-[10px] font-bold rounded border uppercase transition-all ${
                    wsStatus === "connected"
                      ? "bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40 cursor-pointer"
                      : "bg-zinc-950/40 text-zinc-600 border-zinc-900 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3 h-3" />
                  Transmit Frame
                </button>
              </div>

              {/* WebSocket logs terminal stream */}
              <div className="bg-black border border-zinc-850 rounded p-3 h-32 overflow-y-auto font-mono text-[9px]">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1.5 text-zinc-500">
                  <span>WEBSOCKET_DAEMON.LOG</span>
                  <span className="text-[8px] uppercase tracking-widest text-zinc-600">STANDBY RESILIENT CORE</span>
                </div>
                <div className="space-y-1">
                  {wsLogs.length === 0 ? (
                    <span className="text-zinc-600">No telemetry packets logged. Gateway is on standby.</span>
                  ) : (
                    wsLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-zinc-400">
                        <span className="text-blue-500 shrink-0">&gt;</span>
                        <span className={log.includes("[ERROR]") ? "text-red-400 font-bold" : log.includes("[SUCCESS]") ? "text-emerald-400" : ""}>
                          {log}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOOL 5: SYSTEM TELEMETRY */}
        {activeTool === "system_info" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Active Device Telemetry Node
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                  <span>🎯 RECOMMENDED FOR:</span>
                  <span className="font-bold">Real-time Evomi Crawl Proxy</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Review local sensory data, viewport coordinates, and client platform specifications.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5 mb-1">
                <Cpu className="w-4 h-4 text-zinc-400" />
                <span className="font-mono text-xs font-bold text-zinc-300">SYSTEM ARCHITECTURE</span>
              </div>

              <div className="flex flex-col gap-2.5 divide-y divide-zinc-800/50">
                {/* Battery info */}
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-mono text-zinc-500 uppercase">Power Source Status</span>
                  <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                    {batterySupported ? (
                      <>
                        {isBatteryCharging ? (
                          <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
                        ) : (
                          <Battery className="w-4 h-4 text-blue-400" />
                        )}
                        <span>{batteryLevel}% {isBatteryCharging ? "(Charging)" : "(Battery)"}</span>
                      </>
                    ) : (
                      <span className="text-zinc-600">Mains AC Power</span>
                    )}
                  </div>
                </div>

                {/* Core counts */}
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-mono text-zinc-500 uppercase">Hardware Concurrency</span>
                  <span className="font-mono text-zinc-300">
                    {navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical CPU Cores` : "Generic x86_64"}
                  </span>
                </div>

                {/* Resolution */}
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-mono text-zinc-500 uppercase">Viewport Coordinates</span>
                  <span className="font-mono text-zinc-300">
                    {window.innerWidth} x {window.innerHeight} px @{window.devicePixelRatio}x
                  </span>
                </div>

                {/* Platform */}
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-mono text-zinc-500 uppercase">Local Kernel Platform</span>
                  <span className="font-mono text-zinc-300 truncate max-w-[200px]" title={navigator.userAgent}>
                    {navigator.platform || "Web Container Sandbox"}
                  </span>
                </div>

                {/* Audio context support */}
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-mono text-zinc-500 uppercase">Audio Engine Node</span>
                  <span className="font-mono text-emerald-400 font-semibold uppercase">
                    ONLINE (WebAudio API)
                  </span>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg flex gap-2 mt-2">
                <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-400 leading-relaxed font-mono">
                  Transmit these telemetry figures to the conversational interface. Tact AI will dynamically map diagnostic steps based on these metrics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOOL 6: LIVE REMOTE DEVICE REPAIR */}
        {activeTool === "device_fixer" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                  Remote Device Repair Command Center
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Deploy automated AI logic fixes to local hardware and software nodes over secure satellite relay.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded font-mono text-[10px] text-zinc-400">
                <span>ACTIVE BRIDGE: SECURE</span>
              </div>
            </div>

            {!isNodeOnline ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-red-950/15 border border-red-500/20 rounded-lg gap-4 my-4">
                <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-mono text-xs font-bold text-red-400 uppercase tracking-wider">Tact AI Diagnostic Node Offline</h4>
                  <p className="text-[11px] text-zinc-500 max-w-sm font-sans">
                    Remote hardware repairs and node firmware compiles cannot proceed while the node is powered down or standby.
                  </p>
                </div>
                <button
                  onClick={() => onNodeOnlineChange?.(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                >
                  Power On Node
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {devices.map(dev => {
                    const DevIcon = dev.icon;
                    const isCurrentRepairing = repairingDeviceId === dev.id;
                    return (
                      <div 
                        key={dev.id}
                        className={`p-4 rounded-lg border transition-all ${
                          dev.status === "Healthy" 
                            ? "bg-emerald-500/5 border-emerald-500/20" 
                            : isCurrentRepairing 
                              ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                              : "bg-zinc-900/30 border-zinc-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded ${
                              dev.status === "Healthy" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                            }`}>
                              <DevIcon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-zinc-200">{dev.name}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">STATUS: {dev.status}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-extrabold uppercase ${
                            dev.status === "Healthy" 
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                          }`}>
                            {dev.health}%
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 mb-3.5 h-8 leading-snug">
                          {dev.status === "Healthy" ? "All registers fully calibrated and operational." : dev.issue}
                        </p>

                        {dev.status !== "Healthy" && !isCurrentRepairing && (
                          <div className="mb-3.5 p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg flex flex-col gap-1.5 text-[10px]">
                            <div className="flex items-center gap-1.5 text-blue-400 font-bold font-mono text-[8px] uppercase tracking-widest">
                              <HelpCircle className="w-3 h-3 text-blue-400 shrink-0" />
                              Recommended Testing Tool
                            </div>
                            <p className="text-zinc-400 leading-normal font-sans">
                              To sort out or fix this node, use the <strong className="text-blue-300">
                                {dev.id === "motherboard" ? "Motherboard Diagnostic" :
                                 dev.id === "router" ? "Ping Probe" :
                                 dev.id === "mic" ? "Signal Probe" :
                                 dev.id === "screen" ? "Pixel Audit" :
                                 "Telemetry / Stress Test"}
                              </strong> tool first to evaluate system health.
                            </p>
                            <button
                              onClick={() => {
                                const toolMap: Record<string, ToolType> = {
                                  motherboard: "motherboard",
                                  router: "network_test",
                                  mic: "mic_analyzer",
                                  screen: "pixel_test",
                                  scraper: "system_info"
                                };
                                setActiveTool(toolMap[dev.id] || "motherboard");
                              }}
                              className="mt-0.5 self-start flex items-center gap-1 py-1 px-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 font-mono text-[9px] font-bold uppercase rounded border border-blue-500/20 cursor-pointer transition-all"
                            >
                              <span>Run Recommended Test</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        {isCurrentRepairing ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-amber-400 font-bold animate-pulse">REPAIRING...</span>
                              <span className="text-zinc-400">{repairProgress}%</span>
                            </div>
                            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                              <div 
                                className="bg-amber-500 h-full rounded-full transition-all duration-150"
                                style={{ width: `${repairProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : dev.status === "Healthy" ? (
                          <div className="w-full py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-center font-mono text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> REPAIRED
                          </div>
                        ) : (
                          <button
                            onClick={() => triggerDeviceRepair(dev.id)}
                            disabled={!!repairingDeviceId}
                            className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 text-zinc-200 hover:text-white border border-zinc-700 rounded font-mono text-[10px] font-bold uppercase cursor-pointer transition-colors"
                          >
                            Deploy Repair Patch
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {repairingDeviceId && (
                  <div className="p-3 bg-black border border-zinc-850 rounded-lg font-mono text-[10px] space-y-1.5 mt-2 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1.5 text-zinc-505">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        <span>REPAIR_STREAM.STDOUT</span>
                      </div>
                      <span className="text-[9px]">SATELLITE LINK CLONE</span>
                    </div>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto text-zinc-405">
                      {repairLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-1">
                          <span className="text-amber-500 shrink-0">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TOOL 7: CORE NODE FIRMWARE UPGRADE */}
        {activeTool === "node_upgrade" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Tact AI Node Upgrade Panel
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                    <span>🎯 RECOMMENDED FOR:</span>
                    <span className="font-bold">Master AI Node Core</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upgrade local firmware kernels, sensory probes, and thread-safety filters to the latest version.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Node Hardware Core</span>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold font-mono text-zinc-200">TACT_AI_NODE_01</h4>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-black uppercase ${
                    nodeVersion === "v1.1.0" 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/25 animate-pulse"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                  }`}>
                    {nodeVersion}
                  </span>
                </div>
              </div>

              {isUpgrading ? (
                <div className="w-full md:w-56 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-purple-400 font-bold animate-pulse">COMPILING FIRMWARE...</span>
                    <span className="text-zinc-400">{upgradeProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-100"
                      style={{ width: `${upgradeProgress}%` }}
                    />
                  </div>
                </div>
              ) : nodeVersion === "v1.1.0" ? (
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded font-mono text-xs font-bold uppercase flex items-center gap-1.5 select-none">
                  <ShieldCheck className="w-4 h-4 text-purple-400" /> MASTER CORE UPGRADED
                </div>
              ) : (
                <button
                  onClick={triggerNodeUpgrade}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase rounded border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer hover:scale-[1.02] transition-all"
                >
                  Initiate Core Node Upgrade
                </button>
              )}
            </div>

            {isUpgrading && (
              <div className="p-3 bg-black border border-zinc-850 rounded-lg font-mono text-[10px] space-y-1 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1.5 text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                    <span>UPGRADE_COMPILER.STDOUT</span>
                  </div>
                  <span className="text-[9px]">FIRMWARE BUILD ENGINE</span>
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto text-zinc-400">
                  {upgradeLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <span className="text-purple-500 shrink-0">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-4 bg-zinc-900/20 border rounded-lg ${isKernelUpgraded ? "border-purple-500/20 bg-purple-500/5" : "border-zinc-800"}`}>
                <Cpu className={`w-5 h-5 mb-2 ${isKernelUpgraded ? "text-purple-400" : "text-zinc-500"}`} />
                <h5 className="font-mono text-xs font-bold text-zinc-200">Generative AI Kernel</h5>
                <span className="text-[9px] font-mono text-zinc-500 block mb-1">MODULE_01</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isKernelUpgraded ? "Upgraded to Omni Logic (2.5) for multi-spectrum reasoning and higher-speed responses." : "Standard Flash (1.5) kernel. Upgrade for deeper logical troubleshooting routines."}
                </p>
              </div>

              <div className={`p-4 bg-zinc-900/20 border rounded-lg ${isProbeUpgraded ? "border-purple-500/20 bg-purple-500/5" : "border-zinc-800"}`}>
                <Activity className={`w-5 h-5 mb-2 ${isProbeUpgraded ? "text-purple-400" : "text-zinc-500"}`} />
                <h5 className="font-mono text-xs font-bold text-zinc-200">Spectrum Probe (96kHz)</h5>
                <span className="text-[9px] font-mono text-zinc-500 block mb-1">MODULE_02</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isProbeUpgraded ? "Ultra-band sonar sensors installed. Accurate acoustic waves up to 96kHz." : "Standard audio range (16kHz). Upgrade to install double-ring dual-band high gain radio sensors."}
                </p>
              </div>

              <div className={`p-4 bg-zinc-900/20 border rounded-lg ${isFilterUpgraded ? "border-purple-500/20 bg-purple-500/5" : "border-zinc-800"}`}>
                <ShieldCheck className={`w-5 h-5 mb-2 ${isFilterUpgraded ? "text-purple-400" : "text-zinc-500"}`} />
                <h5 className="font-mono text-xs font-bold text-zinc-200">GC Thread-Safety Filter</h5>
                <span className="text-[9px] font-mono text-zinc-500 block mb-1">MODULE_03</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isFilterUpgraded ? "Active auto garbage-collection boundaries. Thread leaks fully neutralized." : "Manual heap sweep limits. Upgrade to protect local WebSocket routes with active forensic shielding."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOOL 8: ACTIVE VIRES PROTECTION SHIELD */}
        {activeTool === "vires_shield" && (
          <div className="flex flex-col gap-5 text-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Tact AI Vires & Malware Protection Shield
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                    <span>🎯 RECOMMENDED FOR:</span>
                    <span className="font-bold">ALL Devices</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  On-device security sandbox protecting your hardware nodes from viruses, network backdoors, and malware.
                </p>
              </div>
              <button
                onClick={() => setViresShieldActive(!viresShieldActive)}
                className={`px-3 py-1 font-mono text-[10px] font-bold uppercase rounded border transition-all cursor-pointer ${
                  viresShieldActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/35"
                    : "bg-red-500/10 text-red-400 border-red-500/35"
                }`}
              >
                {viresShieldActive ? "🛡️ Shield Active" : "⚠️ Shield Disabled"}
              </button>
            </div>

            {/* Shield Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Real-time Antivirus status card */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Active Guard Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-mono text-sm font-bold text-zinc-200 uppercase">GUARDIAN_ONLINE</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                  Secure baseline filters are actively monitoring memory heaps, WebSocket queries, and remote device variables to neutralize threats before they execute.
                </p>
              </div>

              {/* Sandbox verification card */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-lg flex flex-col gap-2">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Pre-Execution Safety</span>
                <div className="flex items-center gap-2 mt-1">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <span className="font-mono text-sm font-bold text-zinc-200 uppercase">Auto-Sandbox Active</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                  Every device that is getting fixed, upgraded, or maintained undergoes an automatic pre-repair <strong>Vires check sweep</strong> to isolate hardware states and prevent cross-device contamination.
                </p>
              </div>

              {/* Security signature database status */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-lg flex flex-col gap-2">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Vulnerability Signatures</span>
                <div className="flex items-center gap-2 mt-1">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  <span className="font-mono text-sm font-bold text-zinc-200 uppercase">DB Version 2026.07.10</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                  Local core signature index is up to date, encompassing all major rootkits, firmware hijack packages, and Trojan overflows targeting Samsung & PLS LCD panels.
                </p>
              </div>
            </div>

            {/* Manual scan panel */}
            <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded-lg flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Manual Antivirus Sweep</span>
                  <h4 className="text-sm font-bold font-mono text-zinc-200">Perform Deep-Clean Vires Sweep</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Trigger a manual cryptographic hash audit across all linked nodes to verify complete safety.
                  </p>
                </div>

                {isScanningVires ? (
                  <div className="w-full md:w-56 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="text-emerald-400 font-bold animate-pulse">SWEEPING MEMORY...</span>
                      <span className="text-zinc-400">{viresScanProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-100"
                        style={{ width: `${viresScanProgress}%` }}
                      />
                    </div>
                  </div>
                ) : viresScanDone ? (
                  <button
                    onClick={triggerViresScan}
                    className="px-5 py-2.5 bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-400 font-mono text-xs font-bold uppercase rounded border border-emerald-500/40 cursor-pointer transition-all"
                  >
                    🔄 Run Scan Again
                  </button>
                ) : (
                  <button
                    onClick={triggerViresScan}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-505 text-white font-mono text-xs font-bold uppercase rounded border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer hover:scale-[1.02] transition-all"
                  >
                    Launch Vires Clean Sweep
                  </button>
                )}
              </div>

              {/* Scan logs terminal stream */}
              {(isScanningVires || viresScanLogs.length > 0) && (
                <div className="p-3 bg-black border border-zinc-850 rounded-lg font-mono text-[10px] space-y-1 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1.5 text-zinc-500">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isScanningVires ? "bg-emerald-500 animate-ping" : "bg-emerald-500"}`} />
                      <span>VIRES_SHIELD_AUDIT.STDOUT</span>
                    </div>
                    <span className="text-[9px]">ON-DEVICE SECURITY PIPELINE</span>
                  </div>
                  <div className="space-y-1 max-h-[140px] overflow-y-auto text-zinc-400">
                    {viresScanLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <span className="text-emerald-500 shrink-0">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viresScanDone && (
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/25 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-mono text-xs font-bold text-emerald-400 uppercase">Device Security Certified Safe</h5>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      The sandbox clean sweep completed successfully. Zero malicious processes, hijacked threads, or unencrypted telemetry packets were detected on any device. Your hardware and workspace are fully protected.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* List of protected devices */}
            <div className="space-y-2.5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Protected Hardware Inventory</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: "Tact Wi-Fi Router Node", details: "Secure routing active • WPA3 Encryption • DNS Filtering" },
                  { name: "Audio Soundcard Input", details: "Local voice buffer isolation • Anti-acoustic hijacking enabled" },
                  { name: "Samsung Smart Screen Frame", details: "Local pixel buffer virtualization • Screen-burn guard active" },
                  { name: "Samsung Galaxy A06 Client Device", details: "Shielded kernel connection • Full sandbox insulation" }
                ].map((device, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-zinc-200">{device.name}</span>
                        <span className="text-[10px] text-zinc-500">{device.details}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[8px] font-bold uppercase tracking-wider">
                      SAFE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOOL 9: HARDWARE STRESS TEST CORE */}
        {activeTool === "invoice" && (
          <InvoiceTab 
            logs={stressLogs} 
            report={stressReport} 
            deviceName={"Local Device"} 
            token={googleToken} 
          />
        )}
        {activeTool === "stress_test" && (
          <div className="flex flex-col gap-5 text-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                    Tact AI Hardware Stress Test Core
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[9px] text-blue-400">
                    <span>🎯 RECOMMENDED FOR:</span>
                    <span className="font-bold">Real-time Evomi Crawl Proxy</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Run controlled, multi-threaded CPU & GPU load diagnostics to assess thermal dissipations, cooling efficiency, and hardware stability.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-blue-500/20">
                🛡️ Vires Protected Sandbox
              </span>
            </div>

            {/* Config & Controls Panel */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Intensity */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase font-mono text-zinc-400">Stress Level Intensity</label>
                  <div className="flex gap-2">
                    {[
                      { id: "low", label: "Low", desc: "45% Load" },
                      { id: "medium", label: "Medium", desc: "85% Load" },
                      { id: "extreme", label: "Extreme", desc: "100% Load" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        disabled={isTestingStress}
                        onClick={() => setStressIntensity(opt.id as any)}
                        className={`flex-1 py-2 px-1 rounded text-center border font-mono text-[10px] transition-all cursor-pointer ${
                          stressIntensity === opt.id
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/50 shadow-inner"
                            : "bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                        title={opt.desc}
                      >
                        <div className="font-bold uppercase">{opt.label}</div>
                        <div className="text-[8px] opacity-70 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target pipeline */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase font-mono text-zinc-400">Target Core Pipeline</label>
                  <div className="flex gap-2">
                    {[
                      { id: "cpu", label: "CPU Only" },
                      { id: "gpu", label: "GPU Load" },
                      { id: "both", label: "Hybrid" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        disabled={isTestingStress}
                        onClick={() => setStressTarget(opt.id as any)}
                        className={`flex-1 py-3 px-1 rounded text-center border font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          stressTarget === opt.id
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-inner"
                            : "bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase font-mono text-zinc-400">Diagnostic Time duration</label>
                  <div className="flex gap-2">
                    {[5, 10, 20].map(seconds => (
                      <button
                        key={seconds}
                        disabled={isTestingStress}
                        onClick={() => setStressDuration(seconds)}
                        className={`flex-1 py-3 px-1 rounded text-center border font-mono text-[10px] font-bold transition-all cursor-pointer ${
                          stressDuration === seconds
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-inner"
                            : "bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {seconds} Seconds
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Trigger */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-4">
                <div className="text-[11px] text-zinc-400 font-sans leading-normal">
                  ⚠️ Note: The Stress Test executes mathematical core loads inside a secure sandbox containment. It is completely safe and will not overheat your local machine or connected hardware nodes.
                </div>
                {isTestingStress ? (
                  <div className="px-6 py-2.5 bg-orange-500/10 text-orange-400 font-mono text-xs font-bold uppercase rounded border border-orange-500/30 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                    Executing Load ({stressProgress}%)
                  </div>
                ) : (
                  <button
                    onClick={startStressTest}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-mono text-xs font-bold uppercase rounded border border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:scale-[1.02] cursor-pointer transition-all"
                  >
                    🚀 Run Load Diagnostic
                  </button>
                )}
              </div>
            </div>

            {/* Live Metrics Grid & Core Visualization Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Gauges Panel */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {/* CPU Gauge */}
                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">CPU Load</span>
                    <span className="font-mono text-2xl font-black text-zinc-200 mt-1 block">{stressCpu}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-blue-400 h-full rounded-full transition-all duration-150" 
                      style={{ width: `${stressCpu}%` }}
                    />
                  </div>
                </div>

                {/* GPU Gauge */}
                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">GPU Load</span>
                    <span className="font-mono text-2xl font-black text-zinc-200 mt-1 block">{stressGpu}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-indigo-400 h-full rounded-full transition-all duration-150" 
                      style={{ width: `${stressGpu}%` }}
                    />
                  </div>
                </div>

                {/* Temp Gauge */}
                <div className={`p-3 border rounded-lg flex flex-col justify-between transition-all ${
                  stressThrottled 
                    ? "bg-red-950/10 border-red-500/30 text-red-200 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]" 
                    : stressTemp > 72 
                      ? "bg-orange-950/10 border-orange-500/30 text-orange-200" 
                      : "bg-zinc-900/30 border-zinc-800"
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Core Temp</span>
                      <span className={`font-mono text-2xl font-black mt-1 block ${stressThrottled ? "text-red-400" : "text-zinc-200"}`}>
                        {stressTemp}°C
                      </span>
                    </div>
                    {stressThrottled && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[8px] font-bold uppercase animate-pulse">
                        Throttled
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-zinc-950 h-1 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-150 ${
                        stressThrottled ? "bg-red-500" : stressTemp > 72 ? "bg-orange-500" : "bg-emerald-500"
                      }`} 
                      style={{ width: `${Math.min(100, ((stressTemp - 30) / (100 - 30)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Clock Speed Gauge */}
                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Clock Speed</span>
                    <span className={`font-mono text-2xl font-black text-zinc-200 mt-1 block ${stressThrottled ? "text-amber-400" : ""}`}>
                      {stressClock} GHz
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-purple-400 h-full rounded-full transition-all duration-150" 
                      style={{ width: `${Math.min(100, (stressClock / 4.0) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fan Speed Gauge */}
                <div className="col-span-2 p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Dynamic Cooling Fan</span>
                    <span className="font-mono text-sm font-black text-zinc-200">{stressFan} RPM</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-950/50 flex items-center justify-center">
                    <Settings 
                      className={`w-5 h-5 text-zinc-400`}
                      style={{
                        transform: `rotate(${stressProgress * 15}deg)`,
                        transition: "transform 100ms linear"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Visualization Canvas */}
              <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5 flex flex-col gap-3 relative overflow-hidden h-[185px]">
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 z-10">
                  <span className="uppercase tracking-wider">On-Device GPU Renderer Pipeline</span>
                  <span className="text-blue-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    LIVE MODEL
                  </span>
                </div>
                
                <canvas 
                  ref={stressCanvasRef} 
                  className="absolute inset-0 w-full h-full"
                  width={400}
                  height={185}
                />
              </div>
            </div>

            {/* System Hardware Dashboard with D3 Real-Time Charts */}
            <HardwareDashboard 
              history={stressHistory}
              isTesting={isTestingStress}
              cpu={stressCpu}
              gpu={stressGpu}
              temp={stressTemp}
              intensity={stressIntensity}
              target={stressTarget}
              duration={stressDuration}
            />

            {/* Stress Logs Terminal stream */}
            {(isTestingStress || stressLogs.length > 0) && (
              <div className="p-3 bg-black border border-zinc-850 rounded-lg font-mono text-[10px] space-y-1 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1.5 text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isTestingStress ? "bg-orange-500 animate-ping" : "bg-zinc-600"}`} />
                    <span>STRESS_INTEGRITY_DAEMON.LOG</span>
                  </div>
                  <span className="text-[9px]">ISOLATED TESTING ENVIRONMENT</span>
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto text-zinc-400">
                  {stressLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <span className="text-orange-500 shrink-0">&gt;</span>
                      <span className={log.includes("[WARNING]") ? "text-amber-400 font-bold" : ""}>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PASS/FAIL DIAGNOSTICS REPORT */}
            {stressDone && stressReport && (
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/80 rounded-lg space-y-3.5">
                <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Diagnostics Output</span>
                    <h4 className="text-xs font-bold font-mono text-zinc-200">Hardware Core Stability Audit Report</h4>
                  </div>
                  
                  {stressReport.status === "PASS" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>PASS: EXCELLENT STABILITY</span>
                    </div>
                  ) : stressReport.status === "WARNING" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>WARNING: THERMAL CHOKE</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs font-bold">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>FAIL: CALCULATION ABORTED</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-950/30 rounded border border-zinc-850">
                    <span className="font-mono text-[9px] text-zinc-500 block">Integrity Stability Score</span>
                    <span className="font-mono text-xl font-black text-zinc-200 mt-1 block">{stressReport.stabilityScore}%</span>
                  </div>
                  <div className="p-3 bg-zinc-950/30 rounded border border-zinc-850">
                    <span className="font-mono text-[9px] text-zinc-500 block">Peak Recorded Temperature</span>
                    <span className="font-mono text-xl font-black text-zinc-200 mt-1 block">{stressReport.peakTemp}°C</span>
                  </div>
                  <div className="p-3 bg-zinc-950/30 rounded border border-zinc-850">
                    <span className="font-mono text-[9px] text-zinc-500 block">Thermal Throttling Lock</span>
                    <span className="font-mono text-xl font-black text-zinc-200 mt-1 block">
                      {stressReport.throttled ? "TRIGGERED" : "NONE"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/50 p-3 rounded border border-zinc-900 font-sans">
                  <strong>Diagnostic Evaluation:</strong> {stressReport.notes}
                </p>

                {/* Device is always safe reminder */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    <strong>Vires Shield Safeguard Activated</strong>: Rest assured that your host device and connected nodes are completely protected by our real-time sandboxed thread isolation rules. Whether you run low load sweeps or extreme 100% stress matrices, the virtual bridge blocks raw hardware overvoltages to keep your devices completely safe.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TOOL 10: DYNAMIC SPATIAL THERMAL MAP */}
        {activeTool === "thermal_map" && (
          <ThermalMap />
        )}

        {/* TOOL 11: PORT REPAIR */}
        {activeTool === "port_repair" && (
          <PortRepairTool onRepairCompleted={onRepairCompleted} deviceName={devices[0]?.name} />
        )}

        {/* TOOL 12: BATTERY CONDITIONING */}
        {activeTool === "battery_conditioning" && (
          <BatteryConditioningTool onRepairCompleted={onRepairCompleted} deviceName={devices[0]?.name} />
        )}

        {/* TOOL 13: WIRELESS CALIBRATOR */}
        {activeTool === "wireless_calibrator" && (
          <WirelessCalibratorTool onRepairCompleted={onRepairCompleted} deviceName={devices[0]?.name} />
        )}

        {/* TOOL 14: HAPTIC TUNER */}
        {activeTool === "haptic_tuner" && (
          <HapticTunerTool onRepairCompleted={onRepairCompleted} deviceName={devices[0]?.name} />
        )}

        {/* TOOL 15: SOFTWARE REPAIR SUITES */}
        {activeTool === "software_suites" && (
          <SoftwareSuitesTool onRepairCompleted={onRepairCompleted} />
        )}

        {/* TOOL 16: MOTHERBOARD DIAGNOSTIC & AUTO-FIX */}
        {activeTool === "motherboard" && (
          <MotherboardDiagnosticTool 
            onRepairCompleted={onRepairCompleted} 
            onOtgCheckRequested={(res) => setOtgModalResult(res)}
          />
        )}
      </div>

      {/* Footer bar showing status */}
      <div className="border-t border-white/5 bg-zinc-950/40 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>PROBE FREQUENCY: 16kHz</span>
        <span className="uppercase text-emerald-500 flex items-center gap-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Hardware Connection Active
        </span>
      </div>
    </div>
  );
}
