import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Thermometer, Zap, Activity, Flame, ShieldAlert, Cpu, RefreshCw, Layers } from "lucide-react";

interface ThermalCell {
  id: string;
  name: string;
  type: "cpu" | "gpu" | "battery" | "pmic";
  row: number;
  col: number;
  baseTemp: number;
  temp: number;
  load: number;
  frequency: string;
  voltage: string;
}

export default function ThermalMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 420, height: 320 });
  const [selectedCell, setSelectedCell] = useState<ThermalCell | null>(null);
  const [cells, setCells] = useState<ThermalCell[]>([]);
  const [loadMultiplier, setLoadMultiplier] = useState<number>(1.0); // 1x, 1.5x, 2.5x (Stress)
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "cpu" | "gpu" | "battery" | "pmic">("all");

  // Initialize the grid layout (8x8 = 64 components)
  useEffect(() => {
    const initialCells: ThermalCell[] = [];
    const types: Array<"cpu" | "gpu" | "battery" | "pmic"> = ["cpu", "gpu", "battery", "pmic"];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        // Determine type based on coordinates
        let type: "cpu" | "gpu" | "battery" | "pmic" = "cpu";
        let baseTemp = 38;
        let name = "";
        let frequency = "3.2 GHz";
        let voltage = "1.12V";

        if (r < 4 && c < 4) {
          type = "cpu";
          baseTemp = 42;
          const coreNum = r * 4 + c;
          name = `CPU Core ${coreNum} (${coreNum < 4 ? "Performance" : "Efficiency"})`;
          frequency = coreNum < 4 ? "3.8 GHz" : "2.4 GHz";
          voltage = "1.25V";
        } else if (r < 4 && c >= 4) {
          type = "gpu";
          baseTemp = 45;
          const unitNum = r * 4 + (c - 4);
          name = `GPU Compute Unit ${unitNum}`;
          frequency = "1.8 GHz";
          voltage = "1.15V";
        } else if (r >= 4 && c < 4) {
          type = "battery";
          baseTemp = 32;
          const cellNum = (r - 4) * 4 + c;
          name = `Li-Po Battery Cell ${cellNum}`;
          frequency = "N/A (Direct DC)";
          voltage = "3.82V";
        } else {
          type = "pmic";
          baseTemp = 48;
          const phaseNum = (r - 4) * 4 + (c - 4);
          name = `PMIC Power Phase Regulator ${phaseNum}`;
          frequency = "650 kHz (PWM)";
          voltage = "12.0V In / 1.1V Out";
        }

        initialCells.push({
          id: `${type}_r${r}_c${c}`,
          name,
          type,
          row: r,
          col: c,
          baseTemp,
          temp: baseTemp,
          load: Math.floor(Math.random() * 20) + 10,
          frequency,
          voltage
        });
      }
    }

    setCells(initialCells);
    // Select first CPU cell by default
    setSelectedCell(initialCells[0]);
  }, []);

  // Set up ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(300, width),
        height: 310
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Simulate real-time fluctuating thermal and load levels
  useEffect(() => {
    if (!isSimulating || cells.length === 0) return;

    const interval = setInterval(() => {
      setCells((prevCells) =>
        prevCells.map((cell) => {
          // Calculate noise and load changes based on selected loadMultiplier
          const targetLoad = Math.min(
            100,
            Math.max(
              5,
              cell.type === "cpu" || cell.type === "gpu"
                ? Math.floor(Math.random() * 25) + 15 * loadMultiplier + (loadMultiplier > 2 ? 40 : 10)
                : Math.floor(Math.random() * 12) + 8 * loadMultiplier
            )
          );

          // Temp correlates directly with load and multiplier
          const loadRatio = targetLoad / 100;
          const maxAddedTemp = cell.type === "cpu" ? 45 : cell.type === "gpu" ? 48 : cell.type === "pmic" ? 38 : 15;
          const targetTemp = parseFloat(
            (cell.baseTemp + loadRatio * maxAddedTemp * (loadMultiplier * 0.8) + (Math.random() - 0.5) * 1.5).toFixed(1)
          );

          return {
            ...cell,
            load: Math.round(targetLoad),
            temp: targetTemp
          };
        })
      );
    }, 800);

    return () => clearInterval(interval);
  }, [isSimulating, cells.length, loadMultiplier]);

  // Sync selected cell data when cells array updates
  useEffect(() => {
    if (!selectedCell) return;
    const match = cells.find(c => c.id === selectedCell.id);
    if (match) {
      setSelectedCell(match);
    }
  }, [cells]);

  // Render the D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || cells.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 15, right: 15, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define colors for heat values
    // Light-to-dark heat gradient: cool light blue -> emerald -> orange -> bright crimson red
    const colorScale = d3.scaleSequential<string>()
      .domain([30, 95]) // temperature domain
      .interpolator(d3.interpolateRgbBasis(["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]));

    // Grid details
    const numRows = 8;
    const numCols = 8;
    const cellWidth = innerWidth / numCols;
    const cellHeight = innerHeight / numRows;

    // Draw background cell grid
    const cellSelection = g.selectAll<SVGRectElement, ThermalCell>(".thermal-rect")
      .data(cells)
      .enter()
      .append("rect")
      .attr("class", "thermal-rect cursor-pointer transition-all duration-300 stroke-zinc-950")
      .attr("x", (d: ThermalCell) => d.col * cellWidth)
      .attr("y", (d: ThermalCell) => d.row * cellHeight)
      .attr("width", cellWidth - 2)
      .attr("height", cellHeight - 2)
      .attr("rx", 3)
      .attr("fill", (d: ThermalCell) => {
        // Dim if filter is active and doesn't match
        if (selectedFilter !== "all" && d.type !== selectedFilter) {
          return "#18181b"; // dark zinc
        }
        return colorScale(d.temp);
      })
      .attr("opacity", (d: ThermalCell) => {
        if (selectedFilter !== "all" && d.type !== selectedFilter) {
          return 0.25;
        }
        return 0.9;
      })
      .on("click", (event, d: ThermalCell) => {
        setSelectedCell(d);
      });

    // Add glowing stroke for the currently selected cell
    if (selectedCell) {
      const match = cells.find(c => c.id === selectedCell.id);
      if (match) {
        g.append("rect")
          .attr("x", match.col * cellWidth - 1)
          .attr("y", match.row * cellHeight - 1)
          .attr("width", cellWidth)
          .attr("height", cellHeight)
          .attr("rx", 3)
          .attr("fill", "none")
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 2.2)
          .attr("class", "animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]");
      }
    }

    // Draw little core index numbers inside each cell (if wide enough)
    if (innerWidth > 280) {
      g.selectAll<SVGTextElement, ThermalCell>(".cell-text")
        .data(cells)
        .enter()
        .append("text")
        .attr("class", "cell-text pointer-events-none font-mono font-bold text-[8px] fill-zinc-950/80")
        .attr("x", (d: ThermalCell) => d.col * cellWidth + cellWidth / 2)
        .attr("y", (d: ThermalCell) => d.row * cellHeight + cellHeight / 2 + 3)
        .attr("text-anchor", "middle")
        .text((d: ThermalCell) => {
          if (selectedFilter !== "all" && d.type !== selectedFilter) return "";
          return `${Math.round(d.temp)}°`;
        });
    }

  }, [cells, dimensions, selectedCell, selectedFilter]);

  // Aggregate Stats
  const avgTemp = cells.length > 0 ? (cells.reduce((acc, c) => acc + c.temp, 0) / cells.length).toFixed(1) : "0";
  const peakTemp = cells.length > 0 ? Math.max(...cells.map(c => c.temp)).toFixed(1) : "0";
  const hotspotsCount = cells.filter(c => c.temp > 75).length;

  return (
    <div className="flex flex-col gap-5 text-zinc-100">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-mono text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-500 animate-pulse" />
              Dynamic Spatial Thermal Map
            </h3>
            <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded font-mono text-[9px] text-orange-400">
              D3 Heatmap Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Real-time visual map displaying spatial thermal signatures and core loads across your device array core dies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-1.5 rounded border text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
              isSimulating
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Live Feed" : "Frozen"}</span>
          </button>
        </div>
      </div>

      {/* Control Presets & Sector Filtering */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Col: Load & Filtering */}
        <div className="md:col-span-8 p-3.5 bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col gap-4">
          {/* Sector Filtering */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase font-mono text-zinc-500 tracking-wider">
              Filter Die Sector View
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "Entire Array" },
                { id: "cpu", label: "CPU Die (Cores)" },
                { id: "gpu", label: "GPU Clusters" },
                { id: "battery", label: "Battery Cells" },
                { id: "pmic", label: "PMIC Power Phases" }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedFilter(opt.id as any)}
                  className={`py-1 px-2.5 rounded font-mono text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                    selectedFilter === opt.id
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/40"
                      : "bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:text-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Load Generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase font-mono text-zinc-500 tracking-wider">
                System Load Profile
              </label>
              <span className="font-mono text-[10px] text-orange-400 font-bold">
                {loadMultiplier === 1.0 ? "Idle Normal (38-50°C)" : loadMultiplier === 1.6 ? "Standard Computing (45-65°C)" : "Extreme Loading (65-98°C)"}
              </span>
            </div>
            <div className="flex gap-2">
              {[
                { val: 1.0, label: "Idle State", desc: "Minimal operations" },
                { val: 1.6, label: "Render Run", desc: "Standard app usage" },
                { val: 2.5, label: "Stress Core", desc: "Extreme mathematical workload" }
              ].map(profile => (
                <button
                  key={profile.val}
                  onClick={() => {
                    setLoadMultiplier(profile.val);
                    setIsSimulating(true);
                  }}
                  className={`flex-1 py-2 px-1.5 rounded border text-center font-mono flex flex-col gap-0.5 transition-all cursor-pointer ${
                    loadMultiplier === profile.val
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/40 shadow-inner"
                      : "bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-[10px] font-bold">{profile.label}</span>
                  <span className="text-[8px] text-zinc-500">{profile.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Instant Stats Panel */}
        <div className="md:col-span-4 p-3.5 bg-zinc-900/30 border border-zinc-800 rounded-lg grid grid-cols-2 md:grid-cols-1 gap-2.5">
          <div className="p-2.5 bg-zinc-950/40 border border-zinc-850 rounded flex flex-col justify-center">
            <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Average Die Temp</span>
            <span className="font-mono text-xl font-black text-emerald-400 mt-1">{avgTemp}°C</span>
          </div>
          <div className="p-2.5 bg-zinc-950/40 border border-zinc-850 rounded flex flex-col justify-center">
            <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Peak Cell Temp</span>
            <span className={`font-mono text-xl font-black mt-1 ${parseFloat(peakTemp) > 75 ? "text-red-400 animate-pulse" : "text-zinc-200"}`}>
              {peakTemp}°C
            </span>
          </div>
          <div className="col-span-2 md:col-span-1 p-2.5 bg-zinc-950/40 border border-zinc-850 rounded flex items-center justify-between">
            <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Hotspots Detected</span>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
              hotspotsCount > 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {hotspotsCount} Critical
            </span>
          </div>
        </div>
      </div>

      {/* Main Heatmap and Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* D3 Heatmap Frame */}
        <div ref={containerRef} className="lg:col-span-7 bg-zinc-950 border border-zinc-850 rounded-lg p-3 flex flex-col justify-center items-center relative min-h-[330px]">
          <div className="absolute top-3 left-3 text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-zinc-500" />
            <span>Silicon Space Grid (8x8 Mapping)</span>
          </div>

          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="mt-3" />
        </div>

        {/* Interactive Die Inspector Panel */}
        <div className="lg:col-span-5 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-2.5">
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Spatial Node Inspector</span>
              <h4 className="font-mono text-xs font-bold text-zinc-200 mt-0.5">Cell Sensor Telemetry</h4>
            </div>

            {selectedCell ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${
                    selectedCell.type === "cpu" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    selectedCell.type === "gpu" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                    selectedCell.type === "battery" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  }`}>
                    {selectedCell.type === "cpu" ? <Cpu className="w-5 h-5" /> :
                     selectedCell.type === "gpu" ? <Activity className="w-5 h-5" /> :
                     selectedCell.type === "battery" ? <Zap className="w-5 h-5" /> :
                     <Thermometer className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="font-mono text-xs font-bold text-zinc-100">{selectedCell.name}</h5>
                    <span className="font-mono text-[9px] uppercase text-zinc-500 tracking-wider">
                      Grid Index: [{selectedCell.row}, {selectedCell.col}] • Type: {selectedCell.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 bg-zinc-950/40 border border-zinc-850 rounded">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block">Local Sensor Temp</span>
                    <span className={`font-mono text-lg font-black mt-1 block ${
                      selectedCell.temp > 75 ? "text-red-400" :
                      selectedCell.temp > 55 ? "text-orange-400" :
                      "text-zinc-200"
                    }`}>
                      {selectedCell.temp}°C
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/40 border border-zinc-850 rounded">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block">Silicon Capacity Load</span>
                    <span className="font-mono text-lg font-black text-zinc-200 mt-1 block">{selectedCell.load}%</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/40 border border-zinc-850 rounded">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block">Operating Freq</span>
                    <span className="font-mono text-xs font-bold text-zinc-300 mt-1 block">{selectedCell.frequency}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/40 border border-zinc-850 rounded">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block">Cell Voltage</span>
                    <span className="font-mono text-xs font-bold text-zinc-300 mt-1 block">{selectedCell.voltage}</span>
                  </div>
                </div>

                {/* Progress bars inside panel for visual detail */}
                <div className="space-y-2.5 pt-1.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                      <span>TEMPERATURE LIMIT PROXIMITY</span>
                      <span>{Math.round((selectedCell.temp / 100) * 100)}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          selectedCell.temp > 75 ? "bg-red-500" : selectedCell.temp > 55 ? "bg-orange-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${Math.min(100, (selectedCell.temp / 100) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                      <span>LOAD PROXIMITY</span>
                      <span>{selectedCell.load}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${selectedCell.load}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-mono italic">
                Select any silicon block coordinate cell inside the spatial map to view micro-telemetry readings.
              </p>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-start gap-2.5 text-[10px] text-zinc-400 font-sans">
            <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
            <p className="leading-normal">
              Heat dissipation values are simulated securely. Selecting "Stress Core" system load will activate hot mathematical dies, displaying how the system distributes workloads to avoid localized silicon thermal bottlenecks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
