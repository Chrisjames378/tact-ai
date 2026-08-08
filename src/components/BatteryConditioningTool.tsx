import React, { useState } from "react";
import { BatteryCharging, Zap, RefreshCw, CheckCircle2, ShieldCheck, Activity } from "lucide-react";

interface BatteryConditioningToolProps {
  batteryLevel?: number;
  onRepairCompleted?: (deviceName: string, logs: string) => void;
  deviceName?: string;
}

export default function BatteryConditioningTool({ batteryLevel = 88, onRepairCompleted, deviceName = "Primary Li-Po Cell" }: BatteryConditioningToolProps) {
  const [isConditioning, setIsConditioning] = useState(false);
  const [conditioningProgress, setConditioningProgress] = useState(0);
  const [healthScore, setHealthScore] = useState(84);
  const [cycleCount, setCycleCount] = useState(412);
  const [cellVoltage, setCellVoltage] = useState(3.82); // Volts
  const [internalResistance, setInternalResistance] = useState(48); // mΩ
  const [logs, setLogs] = useState<string[]>([
    "[BATTERY AUDIT] Reading Smart BMS Coulomb Counter registers...",
    `[BATTERY AUDIT] Reported state-of-charge: ${batteryLevel}%. Estimated health capacity: 84%`,
    "[CELL VOLTAGE] 3.82V across main Li-Po pack. Internal impedance elevated at 48 mΩ."
  ]);

  const handleRunConditioning = () => {
    setIsConditioning(true);
    setConditioningProgress(0);
    setLogs(prev => [...prev, "[PULSE CONDITIONING] Injecting high-frequency micro-charge trickle pulse to dissolve crystalline passivation..."]);

    let step = 0;
    const interval = setInterval(() => {
      step += 5;
      setConditioningProgress(step);

      setCellVoltage(prev => Number((3.82 + (step / 100) * 0.38).toFixed(2)));
      setInternalResistance(prev => Math.max(18, Math.round(48 - (step / 100) * 26)));

      if (step >= 100) {
        clearInterval(interval);
        setIsConditioning(false);
        setHealthScore(96);
        setInternalResistance(22);
        
        const doneMsg = `[BATTERY OPTIMIZED] Coulomb counter re-calibrated successfully!\n- Internal cell resistance reduced from 48 mΩ -> 22 mΩ\n- Maximum operational health recalibrated to 96%\n- Trickle charge curves re-aligned.`;
        setLogs(prev => [...prev, doneMsg]);

        if (onRepairCompleted) {
          onRepairCompleted(deviceName, doneMsg);
        }
      }
    }, 150);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-5 space-y-5 rounded-lg border border-zinc-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <BatteryCharging className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-wide">
              Battery Conditioning & BMS Recalibration Engine
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Re-aligns Coulomb counters, optimizes chemical passivation layers, and tunes lithium-ion trickle charge thresholds.
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Health: {healthScore}%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Pack Voltage</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{cellVoltage} V</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Internal Impedance</span>
          <span className="text-sm font-mono font-bold text-blue-400">{internalResistance} mΩ</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Charge Cycles</span>
          <span className="text-sm font-mono font-bold text-zinc-200">{cycleCount} Cycles</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Calculated Health</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{healthScore}% (Optimal)</span>
        </div>
      </div>

      <button
        onClick={handleRunConditioning}
        disabled={isConditioning}
        className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isConditioning ? "animate-spin" : ""}`} />
        {isConditioning ? `Conditioning Battery Cells (${conditioningProgress}%)...` : "Run Deep Cell Trickle Conditioning & BMS Reset"}
      </button>

      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1 font-mono text-[11px]">
        <div className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Battery Conditioning Log</div>
        <div className="max-h-28 overflow-y-auto space-y-1 text-zinc-400 scrollbar-thin">
          {logs.map((log, i) => (
            <div key={i} className="leading-snug">
              <span className="text-emerald-400 shrink-0">›</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
