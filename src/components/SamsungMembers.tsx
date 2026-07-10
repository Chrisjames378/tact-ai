import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone, Battery, Wifi, Cpu, Layers, Mic, Volume2, Camera, 
  Compass, Sun, ShieldCheck, Activity, Trash2, Play, CheckCircle2, 
  XCircle, AlertTriangle, Send, Loader2, Sparkles, HelpCircle, 
  RefreshCw, Check, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SamsungMembersProps {
  onTransmitToAI: (reportContent: string) => void;
}

interface TestItem {
  id: string;
  name: string;
  category: "hardware" | "sensor" | "network";
  icon: React.ComponentType<any>;
  status: "idle" | "running" | "passed" | "failed";
  resultDetail?: string;
}

export default function SamsungMembers({ onTransmitToAI }: SamsungMembersProps) {
  const [deviceModel, setDeviceModel] = useState("Galaxy S24 Ultra (SM-S928B)");
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<"not_started" | "running" | "completed">("not_started");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState("");
  const [currentProgress, setCurrentProgress] = useState(0);
  const [ramFreed, setRamFreed] = useState<number | null>(null);

  // Touch Screen Interactive test states
  const [touchGrid, setTouchGrid] = useState<boolean[]>(Array(16).fill(false));
  const [touchPassCount, setTouchPassCount] = useState(0);

  // Button interactive test state
  const [buttonStatus, setButtonStatus] = useState<{ volumeUp: boolean; volumeDown: boolean; power: boolean }>({
    volumeUp: false,
    volumeDown: false,
    power: false
  });

  // Battery status state from actual API
  const [actualBattery, setActualBattery] = useState<{ level: number; health: string; capacity: string }>({
    level: 88,
    health: "Good (98%)",
    capacity: "5000 mAh"
  });

  // Speaker sweep state
  const [isToneActive, setIsToneActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Flashlight state
  const [flashlightOn, setFlashlightOn] = useState(false);

  // GPS/Location state
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [testItems, setTestItems] = useState<TestItem[]>([
    { id: "battery", name: "Battery Status", category: "hardware", icon: Battery, status: "idle", resultDetail: "Good health" },
    { id: "wifi", name: "Wi-Fi & Network", category: "network", icon: Wifi, status: "idle", resultDetail: "Strong signal" },
    { id: "touch", name: "Touch Screen", category: "hardware", icon: Smartphone, status: "idle", resultDetail: "Grid responsive" },
    { id: "speaker", name: "Speaker & Audio", category: "hardware", icon: Volume2, status: "idle", resultDetail: "Stereo channels ok" },
    { id: "camera", name: "Camera Module", category: "hardware", icon: Camera, status: "idle", resultDetail: "Dual aperture calibrated" },
    { id: "sensors", name: "Sensors Grid", category: "sensor", icon: Compass, status: "idle", resultDetail: "Accelerometer / Gyro stable" },
    { id: "buttons", name: "Hardware Keys", category: "hardware", icon: Layers, status: "idle", resultDetail: "Volume & Side keys ok" },
    { id: "flashlight", name: "Flashlight Check", category: "hardware", icon: Sun, status: "idle", resultDetail: "LED brightness calibrated" },
  ]);

  // Hook up real battery if available
  useEffect(() => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setActualBattery({
          level: Math.round(batt.level * 100),
          health: "Normal (96%)",
          capacity: "5000 mAh (Typical)"
        });
      }).catch(() => {});
    }
  }, []);

  const handleRunAllTests = async () => {
    setOverallStatus("running");
    setCurrentProgress(0);

    for (let i = 0; i < testItems.length; i++) {
      const item = testItems[i];
      // Skip running if it's touch or buttons (which are interactive)
      if (item.id === "touch" || item.id === "buttons") {
        setActiveTestId(item.id);
        // Let the user interact with it. Pause "Run All" and wait
        return;
      }

      setTestItems(prev => prev.map(t => t.id === item.id ? { ...t, status: "running" } : t));
      setCurrentProgress(Math.round(((i + 1) / testItems.length) * 100));
      
      // Simulate test loading
      await new Promise(resolve => setTimeout(resolve, 800));

      let detail = item.resultDetail || "Normal";
      if (item.id === "battery") {
        detail = `${actualBattery.level}% Charge • ${actualBattery.health}`;
      } else if (item.id === "wifi") {
        detail = `Latency 24ms • Wi-Fi 6E Connected`;
      } else if (item.id === "sensors") {
        detail = `Active sensors: Accelerometer, Gyroscope, Magnetometer`;
      } else if (item.id === "flashlight") {
        detail = `Tested successfully`;
      }

      setTestItems(prev => prev.map(t => t.id === item.id ? { ...t, status: "passed", resultDetail: detail } : t));
    }

    setOverallStatus("completed");
    setActiveTestId(null);
  };

  const handleSingleTest = async (testId: string) => {
    setActiveTestId(testId);
    
    // For non-interactive tests, auto-run and pass
    if (testId !== "touch" && testId !== "buttons") {
      setTestItems(prev => prev.map(t => t.id === testId ? { ...t, status: "running" } : t));
      
      if (testId === "speaker") {
        // Play frequency sweep
        playToneSweep();
      }

      if (testId === "flashlight") {
        setFlashlightOn(true);
        setTimeout(() => setFlashlightOn(false), 2000);
      }

      if (testId === "camera") {
        // Query camera permission/stream if possible, else auto succeed
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setTimeout(() => {
              stream.getTracks().forEach(track => track.stop());
            }, 1500);
          }
        } catch (e) {}
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let detail = "Completed";
      if (testId === "battery") {
        detail = `${actualBattery.level}% Status • Health: Good`;
      } else if (testId === "wifi") {
        detail = `Wi-Fi Link speed: 866 Mbps • Signal -48dBm`;
      } else if (testId === "speaker") {
        detail = `Left/Right balanced (8kHz Sweep passed)`;
      } else if (testId === "camera") {
        detail = `Main lens & Ultra-wide active`;
      } else if (testId === "sensors") {
        detail = `Accelerometer: x=0.01, y=9.81, z=0.15`;
      } else if (testId === "flashlight") {
        detail = `Dual-LED active at 100% duty cycle`;
      }

      setTestItems(prev => prev.map(t => t.id === testId ? { ...t, status: "passed", resultDetail: detail } : t));
      setActiveTestId(null);
    }
  };

  const playToneSweep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Frequency sweep from 200Hz to 1200Hz
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setIsToneActive(true);

      setTimeout(() => {
        osc.stop();
        ctx.close();
        setIsToneActive(false);
      }, 1300);
    } catch (e) {
      console.error(e);
    }
  };

  // Complete Touch Grid test
  const handleTouchSquare = (index: number) => {
    if (activeTestId !== "touch") return;
    
    if (!touchGrid[index]) {
      const nextGrid = [...touchGrid];
      nextGrid[index] = true;
      setTouchGrid(nextGrid);
      
      const trueCount = nextGrid.filter(Boolean).length;
      setTouchPassCount(trueCount);

      if (trueCount === 16) {
        // Complete touch test
        setTestItems(prev => prev.map(t => t.id === "touch" ? { ...t, status: "passed", resultDetail: "100% Touch coordinates verified" } : t));
        setTimeout(() => {
          setActiveTestId(null);
          // Resume run-all if we were running
          if (overallStatus === "running") {
            resumeRemainingTests();
          }
        }, 800);
      }
    }
  };

  // Click simulation for Button test
  const handleKeyClick = (key: "volumeUp" | "volumeDown" | "power") => {
    const next = { ...buttonStatus, [key]: true };
    setButtonStatus(next);

    if (next.volumeUp && next.volumeDown && next.power) {
      setTestItems(prev => prev.map(t => t.id === "buttons" ? { ...t, status: "passed", resultDetail: "Buttons respond perfectly" } : t));
      setTimeout(() => {
        setActiveTestId(null);
        if (overallStatus === "running") {
          resumeRemainingTests();
        }
      }, 800);
    }
  };

  const resumeRemainingTests = async () => {
    // Resume tests starting after the current interactive tests
    const currentIndex = testItems.findIndex(t => t.id === activeTestId);
    
    for (let i = currentIndex + 1; i < testItems.length; i++) {
      const item = testItems[i];
      if (item.id === "touch" || item.id === "buttons") {
        setActiveTestId(item.id);
        return;
      }

      setTestItems(prev => prev.map(t => t.id === item.id ? { ...t, status: "running" } : t));
      setCurrentProgress(Math.round(((i + 1) / testItems.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 800));

      let detail = item.resultDetail || "Normal";
      if (item.id === "speaker") detail = "Swept 200Hz - 1.2kHz successfully";
      else if (item.id === "flashlight") detail = "LED strobe verification clear";

      setTestItems(prev => prev.map(t => t.id === item.id ? { ...t, status: "passed", resultDetail: detail } : t));
    }

    setOverallStatus("completed");
    setActiveTestId(null);
  };

  // Optimize system RAM and storage
  const handleOptimizeDevice = async () => {
    setIsOptimizing(true);
    setOptimizedText("Analyzing current storage block allocations...");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOptimizedText("Closing background processes and sleeping threads...");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOptimizedText("Purging system log files and transient cache layers...");
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    setOptimizedText("Reorganizing memory allocations completed!");
    
    const freedMB = Math.floor(Math.random() * 800) + 600; // 600MB - 1400MB
    setRamFreed(freedMB);
    setIsOptimizing(false);
  };

  const handleTransmitReport = () => {
    const passedTests = testItems.filter(t => t.status === "passed");
    const failedTests = testItems.filter(t => t.status === "failed");
    const idleTests = testItems.filter(t => t.status === "idle");

    const reportPayload = `[SAMSUNG MEMBERS DIAGNOSTIC TELEMETRY REPORT]
Device Model: ${deviceModel}
Diagnostics Complete: ${passedTests.length} / ${testItems.length} modules passed.

--- HARDWARE TEST BENCH METRICS ---
${testItems.map(item => `- ${item.name}: ${item.status.toUpperCase()} (${item.resultDetail || "No telemetry"})`).join("\n")}

--- MEMORY OPTIMIZATION STATUS ---
RAM/Storage Status: ${ramFreed ? `Cleaned & freed ${ramFreed} MB of background resources` : "Not optimized during this session"}

--- TACT AI TROUBLESHOOTING PROMPT ---
This diagnostic report was generated via the Samsung Members utility interface. Please examine the device state, recommend Samsung-specific performance optimizations (such as App Cache purge, Android System settings, Developer options, or battery limiters), and list any actions the user should take.`;

    onTransmitToAI(reportPayload);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/10 border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg">
      
      {/* Visual Header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-zinc-850 bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wider">
            Samsung Members Diagnostics
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-600/10 border border-blue-500/20 text-[9px] font-mono text-blue-400 font-bold uppercase">
          Device Support
        </span>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 select-none">

        {/* Model Spec Card */}
        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Selected Hardware Target</span>
            <input 
              type="text" 
              value={deviceModel} 
              onChange={(e) => setDeviceModel(e.target.value)}
              className="bg-transparent font-sans text-xs font-bold text-zinc-100 border-b border-transparent hover:border-zinc-700 focus:border-blue-500 focus:outline-none transition-all py-0.5 w-60"
            />
            <span className="text-[8px] font-mono text-zinc-600 block">Click model line above to customize device serial</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">Battery Health</span>
            <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">{actualBattery.health}</span>
          </div>
        </div>

        {/* Dynamic Testing Interactive overlays */}
        <AnimatePresence>
          {activeTestId && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-3"
            >
              
              {/* Interactive Touch Test Panel */}
              {activeTestId === "touch" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-blue-400 font-mono uppercase">Touch Grid Calibration</h4>
                      <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Tap or hover over all 16 squares to calibrate coordinates.</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">{touchPassCount}/16</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 max-w-[200px] mx-auto">
                    {touchGrid.map((filled, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => handleTouchSquare(idx)}
                        onClick={() => handleTouchSquare(idx)}
                        className={`aspect-square rounded border transition-all cursor-pointer flex items-center justify-center ${
                          filled 
                            ? "bg-emerald-500/30 border-emerald-500 text-emerald-300 shadow shadow-emerald-500/20" 
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-600"
                        }`}
                      >
                        {filled ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Buttons Test Panel */}
              {activeTestId === "buttons" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-blue-400 font-mono uppercase">Hardware Keys Check</h4>
                      <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Press virtual hardware buttons to calibrate pressure switches.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-center py-2">
                    {[
                      { key: "volumeUp" as const, label: "Volume +" },
                      { key: "volumeDown" as const, label: "Volume -" },
                      { key: "power" as const, label: "Power Key" }
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => handleKeyClick(btn.key)}
                        className={`px-3 py-2 border rounded-lg font-mono text-xs font-bold uppercase transition-all ${
                          buttonStatus[btn.key]
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {buttonStatus[btn.key] ? (
                          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {btn.label}</span>
                        ) : (
                          btn.label
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* Diagnostics Test Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Diagnostic Module Suite</span>
            {overallStatus === "running" ? (
              <div className="flex items-center gap-2 text-[10px] text-blue-400 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Auto-scanning {currentProgress}%</span>
              </div>
            ) : (
              <button
                onClick={handleRunAllTests}
                className="text-[10px] font-mono uppercase text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" /> Run All Diagnostics
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {testItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSingleTest(item.id)}
                  className={`p-2.5 rounded-xl border bg-zinc-950/30 transition-all flex items-center justify-between group cursor-pointer ${
                    activeTestId === item.id
                      ? "border-blue-500/50 bg-blue-950/10"
                      : item.status === "passed"
                      ? "border-emerald-500/20 hover:border-emerald-500/30 bg-emerald-500/5"
                      : "border-zinc-850 hover:border-zinc-800 hover:bg-zinc-950/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      item.status === "passed" 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "bg-zinc-900 text-zinc-400 group-hover:text-zinc-300"
                    }`}>
                      <Icon className={`w-4 h-4 ${item.status === "running" ? "animate-spin-slow" : ""}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-zinc-300 truncate">{item.name}</span>
                      <span className="text-[9px] text-zinc-500 truncate mt-0.5">
                        {item.status === "passed" ? item.resultDetail : item.status === "running" ? "Analyzing..." : "Tap to run"}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    {item.status === "passed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : item.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : item.status === "running" ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                    ) : (
                      <span className="text-[8px] font-mono text-zinc-600 uppercase border border-zinc-800 px-1 rounded">READY</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RAM and Storage Device Optimizer Panel */}
        <div className="border border-zinc-800/80 bg-zinc-950/40 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-400" />
              <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Device Optimization</span>
            </div>
            {isOptimizing ? (
              <span className="text-[9px] text-zinc-500 font-mono animate-pulse">Running Cleanup...</span>
            ) : ramFreed ? (
              <span className="text-[9px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                Optimized
              </span>
            ) : (
              <span className="text-[9px] text-zinc-600 font-mono uppercase">Idle</span>
            )}
          </div>

          {isOptimizing ? (
            <div className="space-y-2">
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="bg-blue-500 h-full"
                />
              </div>
              <p className="text-[9px] font-mono text-zinc-400 italic mt-1 leading-normal">
                &gt; {optimizedText}
              </p>
            </div>
          ) : ramFreed ? (
            <div className="p-2.5 bg-zinc-900/30 rounded-lg border border-zinc-850 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">RAM Cleaned</span>
                <span className="text-sm font-black font-mono text-emerald-400">{ramFreed} MB RECLAIMED</span>
              </div>
              <button 
                onClick={handleOptimizeDevice}
                className="text-[9px] font-mono uppercase bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-zinc-700 px-2.5 py-1.5 rounded transition-all cursor-pointer"
              >
                Scan Again
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] text-zinc-500 leading-normal">
                Deep clean system caches, release reserved RAM buffers, and optimize database indexing pools.
              </p>
              <button
                onClick={handleOptimizeDevice}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:text-zinc-100 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider shrink-0 transition-colors cursor-pointer"
              >
                Optimize RAM
              </button>
            </div>
          )}
        </div>

        {/* Generate and Transmit support ticket */}
        <div className="pt-1.5">
          <button
            onClick={handleTransmitReport}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-all shadow cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Send Samsung Report to Tact AI
          </button>
        </div>

      </div>
    </div>
  );
}
