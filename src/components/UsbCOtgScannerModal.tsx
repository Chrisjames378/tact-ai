import React, { useEffect, useRef, useState } from "react";
import { 
  Usb, CheckCircle2, AlertTriangle, ShieldCheck, 
  HelpCircle, RefreshCw, X, Radio, Zap, Activity, ArrowRight, ShieldAlert, Cpu
} from "lucide-react";
import { OtgDiagnosticResult } from "../utils/usbOtgCheck";

interface UsbCOtgScannerModalProps {
  isOpen: boolean;
  isScanning: boolean;
  scanProgress: number; // 0 to 100
  currentPhase: number; // 1 to 4
  currentPhaseLabel: string;
  result: OtgDiagnosticResult | null;
  onClose: () => void;
  onRescan: () => void;
  onOpenPortRepair?: () => void;
}

// 24 Standard USB-C Pin Designations
const TOP_PINS = [
  { pin: "A1", name: "GND", role: "power" },
  { pin: "A2", name: "TX1+", role: "highspeed" },
  { pin: "A3", name: "TX1-", role: "highspeed" },
  { pin: "A4", name: "VBUS", role: "power" },
  { pin: "A5", name: "CC1", role: "cc" },
  { pin: "A6", name: "D+", role: "data" },
  { pin: "A7", name: "D-", role: "data" },
  { pin: "A8", name: "SBU1", role: "sideband" },
  { pin: "A9", name: "VBUS", role: "power" },
  { pin: "A10", name: "RX2-", role: "highspeed" },
  { pin: "A11", name: "RX2+", role: "highspeed" },
  { pin: "A12", name: "GND", role: "power" },
];

const BOTTOM_PINS = [
  { pin: "B12", name: "GND", role: "power" },
  { pin: "B11", name: "RX1+", role: "highspeed" },
  { pin: "B10", name: "RX1-", role: "highspeed" },
  { pin: "B9", name: "VBUS", role: "power" },
  { pin: "B8", name: "SBU2", role: "sideband" },
  { pin: "B7", name: "D-", role: "data" },
  { pin: "B6", name: "D+", role: "data" },
  { pin: "B5", name: "CC2", role: "cc" },
  { pin: "B4", name: "VBUS", role: "power" },
  { pin: "B3", name: "TX2-", role: "highspeed" },
  { pin: "B2", name: "TX2+", role: "highspeed" },
  { pin: "B1", name: "GND", role: "power" },
];

export default function UsbCOtgScannerModal({
  isOpen,
  isScanning,
  scanProgress,
  currentPhase,
  currentPhaseLabel,
  result,
  onClose,
  onRescan,
  onOpenPortRepair
}: UsbCOtgScannerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [activePinIndex, setActivePinIndex] = useState(0);

  // Audio tone generator for scanning beeps
  const playScanBeep = (freq: number = 880, duration: number = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // AudioContext policy handled
    }
  };

  // Play scanning phase beep on phase change
  useEffect(() => {
    if (isScanning) {
      playScanBeep(600 + currentPhase * 150, 0.06);
    }
  }, [currentPhase, isScanning]);

  // Rotate illuminated pin index during scan
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setActivePinIndex(prev => (prev + 1) % 12);
    }, 90);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Real-time Oscilloscope Packet Waveform Canvas
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const draw = () => {
      time += 0.15;
      const w = canvas.width;
      const h = canvas.height;

      // Dark oscilloscope background
      ctx.fillStyle = "rgba(9, 9, 11, 0.35)";
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(168, 85, 247, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Differential USB Signal Wave (D+ in Cyan, D- in Purple)
      const centerY = h / 2;
      
      // D+ trace
      ctx.strokeStyle = isScanning ? "#06b6d4" : (result?.supported ? "#10b981" : "#a1a1aa");
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        // Square wave modulation with dummy packet pulse
        const freq = isScanning ? 0.08 : 0.03;
        const packetChirp = Math.sin((x * freq) + time);
        const squareVal = Math.sign(packetChirp) * 12;
        const noise = (Math.random() - 0.5) * (isScanning ? 3 : 0.5);
        const y = centerY - 10 + squareVal + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // D- inverted trace
      ctx.strokeStyle = isScanning ? "#a855f7" : (result?.supported ? "#059669" : "#71717a");
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const freq = isScanning ? 0.08 : 0.03;
        const packetChirp = Math.sin((x * freq) + time);
        const squareVal = -Math.sign(packetChirp) * 12;
        const noise = (Math.random() - 0.5) * (isScanning ? 3 : 0.5);
        const y = centerY + 10 + squareVal + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isScanning, result]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-zinc-900 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/50 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Top Border Laser Bar */}
        <div className="relative h-1 w-full bg-zinc-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${scanProgress}%` }}
          />
          {isScanning && (
            <div className="absolute inset-y-0 w-24 bg-white blur-[2px] opacity-80 animate-laser-h" />
          )}
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl relative ${
              isScanning 
                ? "bg-purple-950/70 border border-purple-500/50" 
                : result?.supported 
                ? "bg-emerald-950/70 border border-emerald-500/50" 
                : "bg-red-950/70 border border-red-500/50"
            }`}>
              <Usb className={`w-5 h-5 ${
                isScanning 
                  ? "text-purple-400 animate-pulse" 
                  : result?.supported 
                  ? "text-emerald-400" 
                  : "text-red-400"
              }`} />
              {isScanning && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
                  USB-C OTG Hardware Diagnostic Probe
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                  isScanning 
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse" 
                    : result?.supported 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}>
                  {isScanning ? "Active Bus Scan" : result?.status}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Target Probe: Dummy Peripheral VID 0x1234 / PID 0x5678 • WebUSB Spec
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close diagnostic probe"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* VISUAL SCANNING ANIMATION HUD SECTION */}
          <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 p-4 overflow-hidden">
            {/* Background Radial Glow & Radar Ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-64 h-64 rounded-full border border-purple-500/20 animate-radar-ping" />
              <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20" />
              <div className="absolute w-32 h-32 rounded-full border border-purple-500/30" />
              {isScanning && (
                <div 
                  className="absolute w-56 h-56 rounded-full animate-radar-sweep pointer-events-none"
                  style={{
                    background: "conic-gradient(from 0deg, rgba(168, 85, 247, 0.25) 0deg, transparent 60deg, transparent 360deg)"
                  }}
                />
              )}
            </div>

            {/* Sub-header inside HUD */}
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Radio className={`w-3.5 h-3.5 ${isScanning ? "text-cyan-400 animate-spin" : "text-zinc-500"}`} />
                <span className="text-zinc-300 font-semibold uppercase">Receptacle Pin Array (Type-C 24-Pin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">PHY STATUS:</span>
                <span className={`text-[10px] font-bold ${isScanning ? "text-cyan-400" : "text-emerald-400"}`}>
                  {isScanning ? "INTERROGATING PINS" : "PROBE COMPLETE"}
                </span>
              </div>
            </div>

            {/* USB-C Receptacle Schematic View */}
            <div className="relative py-4 px-2 sm:px-4 bg-zinc-900/80 rounded-xl border border-zinc-800 shadow-inner flex flex-col items-center justify-center overflow-hidden">
              {/* Vertical Laser Scanline */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1px] opacity-90 animate-laser-v pointer-events-none z-20" />
              )}
              {/* Horizontal Crosshair Sweep */}
              {isScanning && (
                <div className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-purple-400 to-transparent blur-[1px] opacity-70 animate-laser-h pointer-events-none z-20" />
              )}

              {/* USB-C Plug Outer Pill Housing */}
              <div className="w-full max-w-lg p-3 sm:p-4 rounded-full border-2 border-zinc-700 bg-zinc-950/90 shadow-2xl relative flex flex-col gap-2">
                {/* Center Receptacle Tongue Tongue Blade */}
                <div className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl p-2.5 flex flex-col gap-2">
                  
                  {/* Top Pin Row (A1 - A12) */}
                  <div className="flex items-center justify-between gap-1 sm:gap-1.5 px-2">
                    {TOP_PINS.map((p, idx) => {
                      const isActive = isScanning && (activePinIndex === idx || p.pin === "A5" || p.pin === "A6");
                      const isCcPin = p.pin === "A5";
                      return (
                        <div key={p.pin} className="flex flex-col items-center gap-0.5 group">
                          <div 
                            className={`w-3 sm:w-4 h-5 sm:h-6 rounded-sm transition-all duration-150 flex items-center justify-center text-[7px] font-mono font-bold ${
                              isActive 
                                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/80 scale-110" 
                                : isCcPin
                                ? "bg-amber-400/80 text-black animate-pulse"
                                : p.role === "power"
                                ? "bg-amber-600/70 text-zinc-950"
                                : p.role === "data"
                                ? "bg-purple-600/70 text-white"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                            title={`Pin ${p.pin}: ${p.name} (${p.role.toUpperCase()})`}
                          >
                            <span className="hidden sm:inline scale-75">{p.pin.replace("A", "")}</span>
                          </div>
                          <span className="text-[8px] font-mono text-zinc-500 scale-75 hidden sm:inline">{p.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Pin Row (B12 - B1) */}
                  <div className="flex items-center justify-between gap-1 sm:gap-1.5 px-2">
                    {BOTTOM_PINS.map((p, idx) => {
                      const isActive = isScanning && (activePinIndex === (11 - idx) || p.pin === "B5" || p.pin === "B6");
                      const isCcPin = p.pin === "B5";
                      return (
                        <div key={p.pin} className="flex flex-col items-center gap-0.5 group">
                          <span className="text-[8px] font-mono text-zinc-500 scale-75 hidden sm:inline">{p.name}</span>
                          <div 
                            className={`w-3 sm:w-4 h-5 sm:h-6 rounded-sm transition-all duration-150 flex items-center justify-center text-[7px] font-mono font-bold ${
                              isActive 
                                ? "bg-purple-400 text-black shadow-lg shadow-purple-400/80 scale-110" 
                                : isCcPin
                                ? "bg-amber-400/80 text-black animate-pulse"
                                : p.role === "power"
                                ? "bg-amber-600/70 text-zinc-950"
                                : p.role === "data"
                                ? "bg-purple-600/70 text-white"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                            title={`Pin ${p.pin}: ${p.name} (${p.role.toUpperCase()})`}
                          >
                            <span className="hidden sm:inline scale-75">{p.pin.replace("B", "")}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* Pin Role Legend */}
              <div className="flex items-center justify-center gap-3 sm:gap-6 mt-3 text-[10px] font-mono text-zinc-400 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block shadow-sm" />
                  <span>CC1/CC2 (OTG Role Detect)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block shadow-sm" />
                  <span>D+/D- (Differential USB 2.0)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block" />
                  <span>VBUS (5.0V / PD Rail)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                  <span>TX/RX (SuperSpeed Gen2x2)</span>
                </div>
              </div>
            </div>

            {/* LIVE DIGITAL BUS OSCILLOSCOPE CANVAS */}
            <div className="mt-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Differential Bus Packet Stream (D+ / D- Signal Scope)</span>
                </span>
                <span className="text-zinc-500 font-mono">FRAME: 0x1234:0x5678 DUMMY SYNC</span>
              </div>
              <canvas 
                ref={canvasRef} 
                width={560} 
                height={55} 
                className="w-full h-14 bg-zinc-950 rounded border border-zinc-800/60 block"
              />
            </div>

            {/* PROBING PHASES & PROGRESS BAR */}
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                  {isScanning ? (
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{currentPhaseLabel}</span>
                </span>
                <span className="text-zinc-400 font-bold">{scanProgress}%</span>
              </div>

              {/* Multi-phase status steps */}
              <div className="grid grid-cols-4 gap-2 font-mono text-[10px]">
                {[
                  { step: 1, label: "Cryptographic Context" },
                  { step: 2, label: "WebUSB Subsystem" },
                  { step: 3, label: "Dummy Frame Inject" },
                  { step: 4, label: "OTG Controller Handshake" }
                ].map((s) => {
                  const isDone = currentPhase > s.step || (!isScanning && result !== null);
                  const isCurrent = isScanning && currentPhase === s.step;
                  return (
                    <div 
                      key={s.step}
                      className={`p-1.5 rounded-md border text-center transition-all ${
                        isDone
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                          : isCurrent
                          ? "bg-purple-950/60 border-purple-500 text-cyan-300 shadow-md shadow-purple-900/30 font-bold"
                          : "bg-zinc-900/40 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>P{s.step}</span>
                        {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                      </div>
                      <span className="truncate block text-[9px] mt-0.5">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DIAGNOSTIC RESULT REPORT (Rendered when complete or available) */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              {/* Primary Status Banner */}
              <div className={`p-4 rounded-xl border ${
                result.status === "SUPPORTED" || result.status === "DEVICE_CONNECTED"
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                  : "bg-red-950/30 border-red-500/30 text-red-200"
              }`}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  {result.status === "SUPPORTED" || result.status === "DEVICE_CONNECTED" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <h4 className="font-mono text-sm font-bold text-white">
                    {result.title}
                  </h4>
                  <span className="ml-auto font-mono text-[10px] text-zinc-400 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800">
                    {result.browserName}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed pl-7">
                  {result.message}
                </p>
              </div>

              {/* Hardware Capability Matrix */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                    <span>WebUSB API (`navigator.usb`):</span>
                  </span>
                  <span className={result.hasWebUsb ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {result.hasWebUsb ? "Present & Operational" : "Missing / Blocked"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Cryptographic Origin (HTTPS / Secure Context):</span>
                  </span>
                  <span className={result.isSecureContext ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {result.isSecureContext ? "Active (Cryptographically Secure)" : "Insecure (Plain HTTP)"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Dummy Peripheral Access Probe (VID:0x1234):</span>
                  </span>
                  <span className={result.promptTriggered ? "text-emerald-400 font-bold" : "text-zinc-400"}>
                    {result.promptTriggered ? "Native Prompt Dispatched (Verified)" : "Aborted Before Prompt"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Usb className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Connected / Paired USB Peripherals:</span>
                  </span>
                  <span className="text-zinc-200 font-bold">
                    {result.connectedDevicesCount} Attached
                  </span>
                </div>
              </div>

              {/* Technical Trace Log */}
              <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 space-y-1 font-mono">
                <span className="text-zinc-500 font-bold uppercase block text-[9px]">Hardware Diagnostics Trace:</span>
                <p className="leading-normal">{result.technicalDetails}</p>
              </div>

              {/* Actionable Guidance */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200/90 leading-normal">
                  {result.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onRescan}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white rounded-lg font-mono text-xs font-semibold border border-purple-500/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning Bus..." : "Rescan USB-C OTG"}</span>
            </button>

            {onOpenPortRepair && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPortRepair();
                }}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-mono text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Open Port Repair</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
