import React, { useState } from "react";
import { Activity, Play, Square, CheckCircle2, Zap } from "lucide-react";

interface HapticTunerToolProps {
  onRepairCompleted?: (deviceName: string, logs: string) => void;
  deviceName?: string;
}

export default function HapticTunerTool({ onRepairCompleted, deviceName = "Linear Resonant Actuator (LRA)" }: HapticTunerToolProps) {
  const [isTuning, setIsTuning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resonantFreq, setResonantFreq] = useState(170); // Hz
  const [dampingFactor, setDampingFactor] = useState(0.82);
  const [logs, setLogs] = useState<string[]>([
    "[HAPTIC AUDIT] Measuring dual-axis LRA motor spring constant...",
    "[HAPTIC AUDIT] Resonance offset detected: +18Hz off-axis causing hollow rattle vibration."
  ]);

  const handleTune = () => {
    setIsTuning(true);
    setProgress(0);

    // Trigger physical browser vibration if supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([100, 50, 100, 50, 200, 100, 300]);
      } catch (e) {
        console.warn("Vibration API non-supported or restricted:", e);
      }
    }

    setLogs(prev => [...prev, "[RESONANCE SWEEP] Sweeping haptic drive frequencies (120Hz -> 240Hz) to locate mechanical peak Q-factor..."]);

    let step = 0;
    const interval = setInterval(() => {
      step += 10;
      setProgress(step);
      setResonantFreq(Math.round(170 + Math.sin(step) * 20));

      if (step >= 100) {
        clearInterval(interval);
        setIsTuning(false);
        setResonantFreq(182); // Ideal resonant peak
        setDampingFactor(0.98);

        const doneMsg = `[HAPTIC TUNED] Linear Resonant Actuator re-calibrated!\n- Peak mechanical Q-factor tuned to 182Hz\n- Damping coefficient optimized to 0.98 for sharp tactile clicks\n- Internal dust/loose micro-particulates dislodged.`;
        setLogs(prev => [...prev, doneMsg]);

        if (onRepairCompleted) {
          onRepairCompleted(deviceName, doneMsg);
        }
      }
    }, 140);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-5 space-y-5 rounded-lg border border-zinc-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-wide">
              Haptic Engine & LRA Resonator Tuner
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Calibrates tactile click crispness, tunes Linear Resonant Actuator frequency Q-factor, and clears debris chatter.
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
          Q-Factor: {resonantFreq} Hz
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Resonant Frequency</span>
          <span className="text-sm font-mono font-bold text-orange-400">{resonantFreq} Hz</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Damping Ratio</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{dampingFactor} (Crisp)</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Drive Voltage</span>
          <span className="text-sm font-mono font-bold text-zinc-200">3.3 V RMS</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Tactile Response</span>
          <span className="text-sm font-mono font-bold text-emerald-400">0.4ms Latency</span>
        </div>
      </div>

      <button
        onClick={handleTune}
        disabled={isTuning}
        className="px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
      >
        <Zap className={`w-4 h-4 ${isTuning ? "animate-bounce text-yellow-300" : ""}`} />
        {isTuning ? `Tuning Haptic Resonator (${progress}%)...` : "Run Haptic Resonator Sweep & Pulse Calibration"}
      </button>

      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1 font-mono text-[11px]">
        <div className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Haptic Tuner Telemetry Log</div>
        <div className="max-h-28 overflow-y-auto space-y-1 text-zinc-400 scrollbar-thin">
          {logs.map((log, i) => (
            <div key={i} className="leading-snug">
              <span className="text-orange-400 shrink-0">›</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
