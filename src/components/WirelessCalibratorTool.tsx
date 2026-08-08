import React, { useState } from "react";
import { Wifi, Radio, RefreshCw, Activity, CheckCircle2, ShieldCheck } from "lucide-react";

interface WirelessCalibratorToolProps {
  onRepairCompleted?: (deviceName: string, logs: string) => void;
  deviceName?: string;
}

export default function WirelessCalibratorTool({ onRepairCompleted, deviceName = "RF Transceiver Matrix" }: WirelessCalibratorToolProps) {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rssi, setRssi] = useState(-68); // dBm
  const [snr, setSnr] = useState(21); // dB
  const [nfcStatus, setNfcStatus] = useState<"DEGRADED" | "ALIGNED">("DEGRADED");
  const [logs, setLogs] = useState<string[]>([
    "[RF AUDIT] Interrogating Wi-Fi 6E/7 and Bluetooth 5.4 RF Front-End (RFFE) modules...",
    "[RF AUDIT] Detected -68 dBm signal attenuation due to dielectric interference.",
    "[NFC COIL] Inductive coil coupling response jitter: ±14.2%"
  ]);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setProgress(0);
    setLogs(prev => [...prev, "[FREQUENCY ALIGNMENT] Transmitting phase-locked loop (PLL) calibration impulses across 2.4GHz, 5GHz, & 6GHz bands..."]);

    let step = 0;
    const interval = setInterval(() => {
      step += 10;
      setProgress(step);

      setRssi(prev => Math.min(-38, Math.round(-68 + (step / 100) * 30)));
      setSnr(prev => Math.min(42, Math.round(21 + (step / 100) * 21)));

      if (step >= 100) {
        clearInterval(interval);
        setIsCalibrating(false);
        setNfcStatus("ALIGNED");

        const doneMsg = `[RF RECALIBRATED] Wireless matrix tuned successfully!\n- Wi-Fi/Bluetooth RSSI improved to -38 dBm (SNR: 42dB)\n- NFC Inductive coil coupling jitter reduced to ±0.4%\n- Wireless packet drop rate reduced to < 0.001%.`;
        setLogs(prev => [...prev, doneMsg]);

        if (onRepairCompleted) {
          onRepairCompleted(deviceName, doneMsg);
        }
      }
    }, 120);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-5 space-y-5 rounded-lg border border-zinc-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-wide">
              Wi-Fi, Bluetooth & NFC Wireless Antenna Calibrator
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Phase-locks RF trimmers, recalibrates Bluetooth 5.4 RSSI attenuation, and aligns NFC inductive coupling coils.
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
          NFC: {nfcStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">RF Signal (RSSI)</span>
          <span className="text-sm font-mono font-bold text-blue-400">{rssi} dBm</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Signal-to-Noise (SNR)</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{snr} dB</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Bands Swept</span>
          <span className="text-sm font-mono font-bold text-zinc-200">2.4 / 5 / 6 GHz</span>
        </div>
        <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">NFC Coupling</span>
          <span className="text-sm font-mono font-bold text-emerald-400">13.56 MHz (Optimal)</span>
        </div>
      </div>

      <button
        onClick={handleCalibrate}
        disabled={isCalibrating}
        className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isCalibrating ? "animate-spin" : ""}`} />
        {isCalibrating ? `Calibrating Antenna Phase Loops (${progress}%)...` : "Run Wireless Phase Alignment & NFC Coil Sweep"}
      </button>

      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1 font-mono text-[11px]">
        <div className="text-zinc-500 font-bold uppercase text-[9px] mb-1">Wireless Calibration Telemetry</div>
        <div className="max-h-28 overflow-y-auto space-y-1 text-zinc-400 scrollbar-thin">
          {logs.map((log, i) => (
            <div key={i} className="leading-snug">
              <span className="text-blue-400 shrink-0">›</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
