import React, { useState, useEffect, useRef } from "react";
import { 
  Wifi, Signal, Zap, AlertCircle, Sparkles, RefreshCw, 
  Sliders, Play, Square, Check, Share2, Info, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WifiAnalyzerProps {
  onTransmitToAI: (reportContent: string) => void;
}

interface APNetwork {
  ssid: string;
  bssid: string;
  channel: number;
  frequency: "2.4 GHz" | "5 GHz";
  signal: number; // in dBm, e.g., -45
  security: string;
  vendor: string;
  color: string;
}

export default function WifiAnalyzer({ onTransmitToAI }: WifiAnalyzerProps) {
  const [band, setBand] = useState<"2.4" | "5">("2.4");
  const [isScanning, setIsScanning] = useState(true);
  const [selectedSSID, setSelectedSSID] = useState<string>("TACT_SECURE_NODE");
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [networks, setNetworks] = useState<APNetwork[]>([
    { ssid: "TACT_SECURE_NODE", bssid: "00:1A:2B:3C:4D:5E", channel: 6, frequency: "2.4 GHz", signal: -42, security: "WPA3-Enterprise", vendor: "Cisco Systems", color: "#3b82f6" },
    { ssid: "Guest_Access_Open", bssid: "04:18:D6:EF:32:11", channel: 1, frequency: "2.4 GHz", signal: -68, security: "Open", vendor: "Ubiquiti Networks", color: "#f59e0b" },
    { ssid: "Linksys_Home_WiFi", bssid: "E8:94:F6:1C:89:D2", channel: 11, frequency: "2.4 GHz", signal: -72, security: "WPA2-PSK", vendor: "Linksys", color: "#ec4899" },
    { ssid: "Neighbor_2G_Ext", bssid: "90:F6:52:AB:74:0C", channel: 4, frequency: "2.4 GHz", signal: -81, security: "WPA2-PSK", vendor: "Netgear", color: "#10b981" },
    { ssid: "Office_Mesh_Backup", bssid: "BC:CF:8F:63:E2:B0", channel: 6, frequency: "2.4 GHz", signal: -59, security: "WPA3-SAE", vendor: "Aruba", color: "#8b5cf6" },
    
    // 5GHz networks
    { ssid: "TACT_SECURE_5G", bssid: "00:1A:2B:3C:4D:5F", channel: 36, frequency: "5 GHz", signal: -45, security: "WPA3-Enterprise", vendor: "Cisco Systems", color: "#3b82f6" },
    { ssid: "Enterprise_GigaNet", bssid: "A4:2B:B0:FF:02:11", channel: 149, frequency: "5 GHz", signal: -61, security: "WPA2/WPA3", vendor: "Ruckus Wireless", color: "#06b6d4" },
    { ssid: "SmartTV_MediaCast", bssid: "D8:E0:E1:48:9A:C3", channel: 44, frequency: "5 GHz", signal: -78, security: "WPA2-PSK", vendor: "Samsung Electronics", color: "#a855f7" },
    { ssid: "HighSpeed_Guest", bssid: "44:D9:E7:E8:2F:3A", channel: 40, frequency: "5 GHz", signal: -67, security: "Open", vendor: "Ubiquiti Networks", color: "#f43f5e" }
  ]);

  // Audio sonar ping state
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load real browser connection properties on mount to replace purely static mock data
  useEffect(() => {
    if (typeof navigator !== "undefined" && (navigator as any).connection) {
      const conn = (navigator as any).connection;
      const rtt = conn.rtt || 40; // in ms
      
      // Map round trip latency (RTT) dynamically to a primary signal power
      // lower latency -> stronger signal, e.g. RTT of 20ms -> -40dBm, RTT of 300ms -> -80dBm
      const primarySignal = Math.max(-92, Math.min(-30, Math.round(-30 - (rtt / 7))));
      
      setNetworks(prev => prev.map(net => {
        if (net.ssid === "TACT_SECURE_NODE" || net.ssid === "TACT_SECURE_5G") {
          return { ...net, signal: primarySignal };
        }
        return net;
      }));
    }
  }, []);

  // Scan ticker to fluctuate signals for realistic active scanning look
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      setNetworks(prev => 
        prev.map(net => {
          // Introduce minor variance of +/- 3 dBm
          const delta = Math.floor(Math.random() * 7) - 3;
          let nextSignal = net.signal + delta;
          // Clamp signal strength between -95 and -30
          nextSignal = Math.max(-95, Math.min(-30, nextSignal));
          return { ...net, signal: nextSignal };
        })
      );

      // Play occasional sonar tracking sound if enabled and selected network changes signal
      if (soundEnabled) {
        const activeNet = networks.find(n => n.ssid === selectedSSID);
        if (activeNet) {
          // Map signal from -100..-30 to pitch/frequency (higher signal = higher pitch)
          const pct = (activeNet.signal + 100) / 70; // 0..1
          const pitch = 300 + (pct * 600);
          playSonarPing(pitch);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isScanning, soundEnabled, selectedSSID, networks]);

  const playSonarPing = (freq: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  // Get active networks filtered by current selected band
  const filteredNetworks = networks.filter(net => 
    band === "2.4" ? net.frequency === "2.4 GHz" : net.frequency === "5 GHz"
  );

  // Compute recommendation channels based on overlapping signals
  const getChannelRecommendations = () => {
    if (band === "2.4") {
      // 1, 6, 11 are non-overlapping. Let's calculate total signals on each
      const countByChan = { 1: 0, 6: 0, 11: 0 };
      filteredNetworks.forEach(net => {
        if (net.channel >= 1 && net.channel <= 3) countByChan[1] += (net.signal + 100);
        else if (net.channel >= 4 && net.channel <= 8) countByChan[6] += (net.signal + 100);
        else if (net.channel >= 9 && net.channel <= 13) countByChan[11] += (net.signal + 100);
      });

      // Best channel has the MINIMUM sum of overlapping signals
      const scores = [
        { chan: 1, score: countByChan[1] },
        { chan: 6, score: countByChan[6] },
        { chan: 11, score: countByChan[11] }
      ];
      scores.sort((a, b) => a.score - b.score);
      
      return {
        best: scores[0].chan,
        rating: scores[0].score < 30 ? "Excellent" : scores[0].score < 80 ? "Good" : "Congested",
        all: scores
      };
    } else {
      // For 5GHz, standard channels like 36, 44, 149, 157
      const countByChan = { 36: 0, 44: 0, 149: 0 };
      filteredNetworks.forEach(net => {
        if (net.channel === 36 || net.channel === 40) countByChan[36] += (net.signal + 100);
        else if (net.channel === 44 || net.channel === 48) countByChan[44] += (net.signal + 100);
        else if (net.channel >= 149) countByChan[149] += (net.signal + 100);
      });

      const scores = [
        { chan: 36, score: countByChan[36] },
        { chan: 44, score: countByChan[44] },
        { chan: 149, score: countByChan[149] }
      ];
      scores.sort((a, b) => a.score - b.score);

      return {
        best: scores[0].chan,
        rating: "Excellent (Clear Spectrum)",
        all: scores
      };
    }
  };

  const recommendation = getChannelRecommendations();

  // Selected Network Detailed Info
  const selectedNet = networks.find(n => n.ssid === selectedSSID) || networks[0];

  const handleTransmitReport = () => {
    const reportPayload = `[WIFI ANALYZER TELEMETRY REPORT]
Selected Band: ${band} GHz Band
Total Networks Detected: ${networks.length} access points.

--- DETECTED WI-FI AP LIST ---
${networks.map(net => `- SSID: "${net.ssid}" | Signal: ${net.signal} dBm | Chan: ${net.channel} | Band: ${net.frequency} | Security: ${net.security} (${net.vendor})`).join("\n")}

--- CHANNEL CONGESTION RECOMMENDATION ---
Recommended Optimal Channel: Channel ${recommendation.best} (${recommendation.rating})
Overlap rating breakdown: ${recommendation.all.map(s => `Chan ${s.chan}: congestion sum=${s.score}`).join(", ")}

--- TACT AI PERFORMANCE RECOMMENDATION ---
Please analyze this Wi-Fi spectrum footprint. Provide step-by-step guidance on how to log into the access point admin panel to swap channels, optimize 2.4/5GHz split SSID settings, reduce mutual interference from overlapping nearby routers, and maximize wireless throughput.`;

    onTransmitToAI(reportPayload);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/10 border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg">
      
      {/* Header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-zinc-850 bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wider">
            Wi-Fi Spectrum Analyzer
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
              isScanning 
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                : "bg-zinc-800 border border-zinc-700 text-zinc-400"
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>LIVE SCANNING</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5" />
                <span>SCAN PAUSED</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 select-none">

        {/* Band selector & Quick Diagnostic banner */}
        <div className="flex items-center justify-between bg-zinc-950/50 border border-zinc-850 p-2.5 rounded-xl">
          <div className="flex gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setBand("2.4")}
              className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase font-bold transition-all cursor-pointer ${
                band === "2.4" 
                  ? "bg-zinc-800 text-blue-400" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              2.4 GHz Band
            </button>
            <button
              onClick={() => setBand("5")}
              className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase font-bold transition-all cursor-pointer ${
                band === "5" 
                  ? "bg-zinc-800 text-blue-400" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              5.0 GHz Band
            </button>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">Optimal Channel</span>
            <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block flex items-center gap-1 justify-end">
              <Zap className="w-3 h-3 text-amber-400" /> Channel {recommendation.best}
            </span>
          </div>
        </div>

        {/* Real-time Spectrum SVG parabola overlaps visual graph */}
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase">
            <span>Signal Wave Overlaps (dBm vs Channel)</span>
            <span className="text-[9px] text-zinc-600">Parabolic signal boundaries</span>
          </div>

          <div className="relative bg-black/60 border border-zinc-850 rounded-xl h-44 overflow-hidden p-2">
            
            {/* Pulsing Live Scanner Overlay Bar */}
            {isScanning && (
              <motion.div 
                animate={{ left: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500/35 pointer-events-none z-10 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              />
            )}

            {/* Background Grid Lines (dBm markers) */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-3 text-[8px] text-zinc-700">
              <div className="border-b border-zinc-900/40 w-full flex justify-between"><span>-30 dBm (Excellent)</span></div>
              <div className="border-b border-zinc-900/40 w-full flex justify-between"><span>-60 dBm (Good)</span></div>
              <div className="border-b border-zinc-900/40 w-full flex justify-between"><span>-80 dBm (Weak)</span></div>
              <div className="w-full flex justify-between"><span>-95 dBm (Congested)</span></div>
            </div>

            {/* Custom Interactive SVG Wave Plotter */}
            <svg className="w-full h-full absolute inset-0 pt-4 pb-2 px-6 overflow-visible pointer-events-none">
              {filteredNetworks.map((net, idx) => {
                // Map channel to percentage on X axis (Channel 1 to 13 on 2.4G, 36 to 165 on 5G)
                let minChan = band === "2.4" ? 1 : 36;
                let maxChan = band === "2.4" ? 14 : 165;
                let pctX = ((net.channel - minChan) / (maxChan - minChan)) * 100;
                
                // Keep X centered within bounds
                pctX = Math.max(10, Math.min(90, pctX));

                // Map signal strength dBm (-95..-30) to Y percent (0..100) where Y=100 is bottom (weak)
                const signalVal = Math.max(-95, Math.min(-30, net.signal));
                const pctY = 100 - (((signalVal + 95) / 65) * 80); // higher signal -> lower pctY (closer to top)

                // Define parabolic wave path starting from bottom left, curving to (pctX, pctY), down to bottom right
                // Width of curve based on channel overlap (constant width for 2.4, wider or narrower)
                const widthOffset = band === "2.4" ? 22 : 15;
                const pathStr = `M ${pctX - widthOffset} 100 Q ${pctX} ${pctY} ${pctX + widthOffset} 100`;

                const isSelected = net.ssid === selectedSSID;

                return (
                  <g key={net.ssid}>
                    {/* Parabolic wave fill */}
                    <path
                      d={pathStr}
                      fill={isSelected ? `${net.color}15` : `${net.color}05`}
                      stroke={net.color}
                      strokeWidth={isSelected ? "2" : "1"}
                      strokeDasharray={isSelected ? "0" : "1.5"}
                      className="transition-all duration-300"
                    />

                    {/* Peak Dot indicator */}
                    <circle
                      cx={pctX}
                      cy={pctY}
                      r={isSelected ? "4" : "2.5"}
                      fill={net.color}
                      className="transition-all duration-300 shadow"
                    />

                    {/* Mini SSID Label above wave */}
                    <text
                      x={pctX}
                      y={pctY - 6}
                      textAnchor="middle"
                      fill={isSelected ? "#ffffff" : "#a1a1aa"}
                      fontSize="7"
                      fontFamily="monospace"
                      className="transition-all duration-300 select-none font-bold"
                    >
                      {net.ssid} ({net.channel})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Access Point Metrics Dashboard */}
        <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-zinc-400" />
              <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Node Telemetry: {selectedNet.ssid}</span>
            </div>
            
            {/* Audio toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2 py-0.5 border rounded font-mono text-[9px] uppercase font-bold transition-colors cursor-pointer ${
                soundEnabled 
                  ? "bg-blue-600/10 border-blue-500/20 text-blue-400" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400"
              }`}
            >
              Sonar {soundEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono">
            <div className="p-2.5 bg-zinc-900/30 rounded-lg border border-zinc-850">
              <span className="text-[8px] text-zinc-500 uppercase block">Signal Peak</span>
              <span className={`text-md font-bold mt-1 block ${
                selectedNet.signal >= -50 ? "text-emerald-400" : selectedNet.signal >= -70 ? "text-amber-400" : "text-red-400"
              }`}>
                {selectedNet.signal} dBm
              </span>
            </div>
            <div className="p-2.5 bg-zinc-900/30 rounded-lg border border-zinc-850">
              <span className="text-[8px] text-zinc-500 uppercase block">Access Channel</span>
              <span className="text-md font-bold text-zinc-200 mt-1 block">CH {selectedNet.channel}</span>
            </div>
            <div className="p-2.5 bg-zinc-900/30 rounded-lg border border-zinc-850">
              <span className="text-[8px] text-zinc-500 uppercase block">Router Vendor</span>
              <span className="text-md font-bold text-blue-400 mt-1 block truncate">{selectedNet.vendor}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-500">
            <div>BSSID: <span className="text-zinc-300">{selectedNet.bssid}</span></div>
            <div>Security: <span className="text-zinc-300">{selectedNet.security}</span></div>
          </div>
        </div>

        {/* Scan Results AP List */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Access Point Registry</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {filteredNetworks.map((net) => (
              <div
                key={net.ssid}
                onClick={() => setSelectedSSID(net.ssid)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between font-mono ${
                  net.ssid === selectedSSID
                    ? "bg-blue-600/5 border-blue-500/35"
                    : "bg-zinc-950/20 border-zinc-850/80 hover:border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: net.color }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-zinc-300 truncate">{net.ssid}</span>
                    <span className="text-[9px] text-zinc-500 truncate">
                      {net.vendor} • Channel {net.channel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-[10px] font-bold ${
                      net.signal >= -50 ? "text-emerald-400" : net.signal >= -70 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {net.signal} dBm
                    </span>
                    <span className="text-[8px] text-zinc-600 block">Strength</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Transmit spectrum analytics to Tact AI */}
        <div className="pt-1.5">
          <button
            onClick={handleTransmitReport}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-all shadow cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Send Wi-Fi Report to Tact AI
          </button>
        </div>

      </div>
    </div>
  );
}
