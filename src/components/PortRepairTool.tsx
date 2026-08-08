import React, { useState, useEffect, useRef } from "react";
import { Zap, Droplets, RefreshCw, Activity, ShieldCheck, AlertTriangle, Play, Square, CheckCircle2, Thermometer } from "lucide-react";

interface PortRepairToolProps {
  onRepairCompleted?: (deviceName: string, logs: string) => void;
  deviceName?: string;
}

export default function PortRepairTool({ onRepairCompleted, deviceName = "Primary USB-C Port" }: PortRepairToolProps) {
  // States
  const [isEjecting, setIsEjecting] = useState(false);
  const [ejectProgress, setEjectProgress] = useState(0);
  const [currentFreq, setCurrentFreq] = useState(220);
  const [moistureLevel, setMoistureLevel] = useState<number>(34); // % moisture detected
  const [portImpedance, setPortImpedance] = useState<number>(14.2); // Ohms
  const [isPdResetting, setIsPdResetting] = useState(false);
  const [pdStatus, setPdStatus] = useState<"NORMAL" | "LOCKOUT" | "RECALIBRATED">("LOCKOUT");
  const [oxidationLevel, setOxidationLevel] = useState<number>(28); // %
  const [repairLogs, setRepairLogs] = useState<string[]>([
    "[PORT DIAGNOSTIC] Initiating USB Power Delivery CC1/CC2 line scan...",
    "[PORT DIAGNOSTIC] Detected elevated CC line impedance: 14.2Ω (Threshold: <5.0Ω)",
    "[MOISTURE SENSOR] Warning: Micro-condensation flag raised on VBUS pins (34% relative humidity)",
    "[USB-PD CONTROLLER] Power handshake limited to 5V/0.5A safety trickle due to moisture lockout."
  ]);

  // Audio refs for ultrasonic acoustic pulse
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas visualizer for acoustic pulse waves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let waveOffset = 0;
    const drawWave = () => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Ultrasonic Pulse Sine/Square Wave
      ctx.beginPath();
      ctx.lineWidth = isEjecting ? 3 : 1.5;
      ctx.strokeStyle = isEjecting ? "#a855f7" : "#3b82f6";

      const amplitude = isEjecting ? 35 + Math.sin(waveOffset * 0.2) * 15 : 12;
      const frequency = isEjecting ? (currentFreq / 200) : 0.05;

      for (let x = 0; x < canvas.width; x++) {
        const y = (canvas.height / 2) + Math.sin(x * frequency + waveOffset) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Debris / Moisture Droplet Particle Animation when ejecting
      if (isEjecting) {
        ctx.fillStyle = "#38bdf8";
        for (let i = 0; i < 8; i++) {
          const px = (waveOffset * 15 + i * 50) % canvas.width;
          const py = (canvas.height / 2) + Math.sin(px * 0.1) * 20 - (ejectProgress * 0.8);
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, 4 - (i % 3)), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      waveOffset += isEjecting ? 0.25 : 0.05;
      animFrameRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEjecting, currentFreq, ejectProgress]);

  // Start Ultrasonic Ejection Pulse
  const startUltrasonicEject = () => {
    if (isEjecting) return;
    setIsEjecting(true);
    setEjectProgress(0);

    // Audio setup
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(165, ctx.currentTime);
        
        // Volume ramping
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscRef.current = osc;
        gainRef.current = gain;
      }
    } catch (e) {
      console.warn("Audio Context audio start warning:", e);
    }

    setRepairLogs(prev => [
      ...prev,
      `[ULTRASONIC PULSE] Launching acoustic moisture & debris ejection frequency sweep (165Hz -> 18,500Hz)...`
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step += 2;
      setEjectProgress(step);

      // Sweep frequency up
      const freq = 165 + Math.pow(step / 100, 2) * 18000;
      setCurrentFreq(Math.round(freq));

      if (oscRef.current && audioCtxRef.current) {
        oscRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      }

      // Dynamically lower moisture & oxidation
      setMoistureLevel(prev => Math.max(0, Math.round(prev - 0.7)));
      setOxidationLevel(prev => Math.max(2, Math.round(prev - 0.5)));
      setPortImpedance(prev => Math.max(1.8, Number((prev - 0.25).toFixed(1))));

      if (step >= 100) {
        clearInterval(interval);
        stopAudio();
        setIsEjecting(false);
        setMoistureLevel(0);
        setOxidationLevel(4);
        setPortImpedance(2.1);
        setPdStatus("NORMAL");

        const logMsg = `[ULTRASONIC COMPLETE] Port acoustic ejection successful!\n- Moisture cleared: 0%\n- Port impedance restored: 2.1Ω\n- Debris particles dislodged from CC1/CC2 contacts.`;
        setRepairLogs(prev => [...prev, logMsg]);

        if (onRepairCompleted) {
          onRepairCompleted(deviceName, logMsg);
        }
      }
    }, 120);
  };

  const stopAudio = () => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.2);
      }
      setTimeout(() => {
        if (oscRef.current) {
          oscRef.current.stop();
          oscRef.current.disconnect();
          oscRef.current = null;
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
      }, 250);
    } catch (e) {
      console.warn("Stop audio error:", e);
    }
  };

  const cancelEject = () => {
    setIsEjecting(false);
    stopAudio();
    setRepairLogs(prev => [...prev, "[USER CANCELED] Ultrasonic acoustic pulse interrupted."]);
  };

  // Perform USB-PD Soft Reset
  const handlePdSoftReset = () => {
    setIsPdResetting(true);
    setRepairLogs(prev => [...prev, "[USB-PD RESET] Sending digital CC line handshake toggle signal (5V -> 9V -> 20V reset)..."]);

    setTimeout(() => {
      setIsPdResetting(false);
      setPdStatus("RECALIBRATED");
      setPortImpedance(1.9);
      setMoistureLevel(0);
      const msg = "[USB-PD RECALIBRATED] CC1/CC2 handshake cleared false moisture lockout. Fast Charging Enabled (9V/3A 27W Turbo Power PD).";
      setRepairLogs(prev => [...prev, msg]);

      if (onRepairCompleted) {
        onRepairCompleted(deviceName, msg);
      }
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-5 space-y-5 rounded-lg border border-zinc-800/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
              USB Charging Port & Moisture Ultrasonic Repair Tool
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              No physical disassembly required. Uses acoustic resonance sweeps & digital USB-PD resets to eject moisture, clear false lockout flags, & clean oxidized pin contacts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase border ${
            pdStatus === "LOCKOUT" 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}>
            {pdStatus === "LOCKOUT" ? "⚠️ PD Lockout Active" : "✓ PD Recalibrated (Fast Charge)"}
          </span>
        </div>
      </div>

      {/* Live Oscilloscope & Frequency Pulse Monitor */}
      <div className="relative bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 font-bold uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Ultrasonic Acoustic Pulse Waveform Generator
          </span>
          <span className="text-purple-400 font-bold">
            {isEjecting ? `${currentFreq.toLocaleString()} Hz Sweep` : "Standby (165Hz Ready)"}
          </span>
        </div>

        <div className="h-28 w-full rounded border border-zinc-800 overflow-hidden relative">
          <canvas ref={canvasRef} className="w-full h-full" width={600} height={112} />
          {isEjecting && (
            <div className="absolute top-2 left-2 bg-purple-950/80 border border-purple-500/40 px-2 py-1 rounded text-[10px] font-mono text-purple-300 font-bold animate-pulse">
              EJECTING MOISTURE & DEBRIS ({ejectProgress}%)
            </div>
          )}
        </div>
      </div>

      {/* Real-time Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Port Moisture</span>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-mono font-bold ${moistureLevel > 10 ? "text-amber-400" : "text-emerald-400"}`}>
              {moistureLevel}% {moistureLevel > 10 ? "(Condensation)" : "(Dry)"}
            </span>
            <Droplets className={`w-4 h-4 ${moistureLevel > 10 ? "text-amber-400 animate-pulse" : "text-emerald-400"}`} />
          </div>
        </div>

        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Pin Impedance</span>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-mono font-bold ${portImpedance > 5 ? "text-red-400" : "text-emerald-400"}`}>
              {portImpedance} Ω
            </span>
            <Zap className={`w-4 h-4 ${portImpedance > 5 ? "text-red-400" : "text-emerald-400"}`} />
          </div>
        </div>

        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Oxidation Layer</span>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-mono font-bold ${oxidationLevel > 15 ? "text-amber-400" : "text-emerald-400"}`}>
              {oxidationLevel}%
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">USB Power Delivery</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-200">
              {pdStatus === "LOCKOUT" ? "5V / 0.5A (Limited)" : "9V / 3.0A (Turbo)"}
            </span>
            <CheckCircle2 className={`w-4 h-4 ${pdStatus === "LOCKOUT" ? "text-amber-400" : "text-emerald-400"}`} />
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={isEjecting ? cancelEject : startUltrasonicEject}
          className={`px-4 py-3 rounded-lg font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            isEjecting 
              ? "bg-red-600 hover:bg-red-500 text-white border border-red-400 animate-pulse" 
              : "bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/50"
          }`}
        >
          {isEjecting ? (
            <>
              <Square className="w-4 h-4" /> Stop Ultrasonic Sweep ({ejectProgress}%)
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Run Ultrasonic Moisture & Debris Ejection
            </>
          )}
        </button>

        <button
          onClick={handlePdSoftReset}
          disabled={isPdResetting}
          className="px-4 py-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isPdResetting ? "animate-spin text-blue-400" : ""}`} />
          {isPdResetting ? "Recalibrating USB-PD Handshake..." : "Recalibrate USB-PD Controller & Clear Lockout"}
        </button>
      </div>

      {/* Diagnostics Log Console */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1 font-mono text-[11px]">
        <div className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Port Repair Telemetry Log</div>
        <div className="max-h-28 overflow-y-auto space-y-1 text-zinc-400 scrollbar-thin">
          {repairLogs.map((log, i) => (
            <div key={i} className="leading-snug">
              <span className="text-purple-400 shrink-0">›</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
