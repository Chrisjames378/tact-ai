import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Activity, Cpu, Zap, Flame, Award, BarChart2 } from "lucide-react";

interface MetricPoint {
  step: number;
  cpu: number;
  gpu: number;
  temp: number;
}

interface HardwareDashboardProps {
  history: MetricPoint[];
  isTesting: boolean;
  cpu: number;
  gpu: number;
  temp: number;
  intensity: "low" | "medium" | "extreme";
  target: "cpu" | "gpu" | "both";
  duration: number;
}

export default function HardwareDashboard({
  history,
  isTesting,
  cpu,
  gpu,
  temp,
  intensity,
  target,
  duration
}: HardwareDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 220 });

  // ResizeObserver to ensure robust responsiveness
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Keep safety minimum dimensions
      setDimensions({
        width: Math.max(300, width),
        height: Math.max(180, height || 220)
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute stats
  const peakCpu = history.length > 0 ? Math.max(...history.map(d => d.cpu)) : cpu;
  const peakGpu = history.length > 0 ? Math.max(...history.map(d => d.gpu)) : gpu;
  const peakTemp = history.length > 0 ? Math.max(...history.map(d => d.temp)) : temp;
  const avgCpu = history.length > 0 ? Math.round(history.reduce((acc, d) => acc + d.cpu, 0) / history.length) : cpu;
  const avgGpu = history.length > 0 ? Math.round(history.reduce((acc, d) => acc + d.gpu, 0) / history.length) : gpu;

  // D3 Render Loop
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 15, right: 15, bottom: 25, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create container group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Handle empty state gracefully
    if (history.length === 0) {
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("class", "fill-zinc-500 font-mono text-[10px]")
        .text("Awaiting stress simulation telemetry frames...");
      return;
    }

    // Set up Scales
    const maxSteps = duration * 10; // 10 ticks per second
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(maxSteps, history[history.length - 1].step)])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Create gradients for smooth area fills
    const defs = svg.append("defs");

    const cpuGradient = defs.append("linearGradient")
      .attr("id", "cpu-grad")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    cpuGradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.18);
    cpuGradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.0);

    const gpuGradient = defs.append("linearGradient")
      .attr("id", "gpu-grad")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    gpuGradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1").attr("stop-opacity", 0.18);
    gpuGradient.append("stop").attr("offset", "100%").attr("stop-color", "#6366f1").attr("stop-opacity", 0.0);

    // Draw Grid Lines (Y-Axis Grid)
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-innerWidth)
      .ticks(5)
      .tickFormat(() => "");
    
    g.append("g")
      .attr("class", "grid-lines stroke-zinc-800/40")
      .call(yGrid)
      .selectAll(".tick line")
      .attr("stroke", "#27272a")
      .attr("stroke-dasharray", "1,3");

    // Draw Grid Lines (X-Axis Grid)
    const xGrid = d3.axisBottom(xScale)
      .tickSize(-innerHeight)
      .ticks(6)
      .tickFormat(() => "");

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .attr("class", "grid-lines stroke-zinc-800/40")
      .call(xGrid)
      .selectAll(".tick line")
      .attr("stroke", "#27272a")
      .attr("stroke-dasharray", "1,3");

    // Add Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => `${(d as number) / 10}s`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .attr("class", "axis x-axis text-zinc-500 font-mono text-[8px]")
      .call(xAxis)
      .call(g => g.select(".domain").attr("stroke", "#3f3f46"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#3f3f46"));

    g.append("g")
      .attr("class", "axis y-axis text-zinc-500 font-mono text-[8px]")
      .call(yAxis)
      .call(g => g.select(".domain").attr("stroke", "#3f3f46"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#3f3f46"));

    // Area and Line Generators
    const cpuAreaGenerator = d3.area<MetricPoint>()
      .x(d => xScale(d.step))
      .y0(innerHeight)
      .y1(d => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    const gpuAreaGenerator = d3.area<MetricPoint>()
      .x(d => xScale(d.step))
      .y0(innerHeight)
      .y1(d => yScale(d.gpu))
      .curve(d3.curveMonotoneX);

    const cpuLineGenerator = d3.line<MetricPoint>()
      .x(d => xScale(d.step))
      .y(d => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    const gpuLineGenerator = d3.line<MetricPoint>()
      .x(d => xScale(d.step))
      .y(d => yScale(d.gpu))
      .curve(d3.curveMonotoneX);

    // Draw Areas
    if (target === "cpu" || target === "both") {
      g.append("path")
        .datum(history)
        .attr("class", "cpu-area")
        .attr("d", cpuAreaGenerator)
        .attr("fill", "url(#cpu-grad)");
    }

    if (target === "gpu" || target === "both") {
      g.append("path")
        .datum(history)
        .attr("class", "gpu-area")
        .attr("d", gpuAreaGenerator)
        .attr("fill", "url(#gpu-grad)");
    }

    // Draw Lines
    if (target === "cpu" || target === "both") {
      g.append("path")
        .datum(history)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 1.8)
        .attr("d", cpuLineGenerator);
    }

    if (target === "gpu" || target === "both") {
      g.append("path")
        .datum(history)
        .attr("fill", "none")
        .attr("stroke", "#6366f1")
        .attr("stroke-width", 1.8)
        .attr("d", gpuLineGenerator);
    }

    // Highlight newest data points with small glowing nodes
    const lastPoint = history[history.length - 1];
    
    if (target === "cpu" || target === "both") {
      g.append("circle")
        .attr("cx", xScale(lastPoint.step))
        .attr("cy", yScale(lastPoint.cpu))
        .attr("r", 4)
        .attr("fill", "#3b82f6")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1);

      g.append("circle")
        .attr("cx", xScale(lastPoint.step))
        .attr("cy", yScale(lastPoint.cpu))
        .attr("r", 8)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 1)
        .attr("class", "animate-ping")
        .style("transform-origin", `${xScale(lastPoint.step)}px ${yScale(lastPoint.cpu)}px`);
    }

    if (target === "gpu" || target === "both") {
      g.append("circle")
        .attr("cx", xScale(lastPoint.step))
        .attr("cy", yScale(lastPoint.gpu))
        .attr("r", 4)
        .attr("fill", "#6366f1")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1);

      g.append("circle")
        .attr("cx", xScale(lastPoint.step))
        .attr("cy", yScale(lastPoint.gpu))
        .attr("r", 8)
        .attr("fill", "none")
        .attr("stroke", "#6366f1")
        .attr("stroke-width", 1)
        .attr("class", "animate-ping")
        .style("transform-origin", `${xScale(lastPoint.step)}px ${yScale(lastPoint.gpu)}px`);
    }

  }, [history, dimensions, duration, target]);

  return (
    <div id="hardware_d3_dashboard" className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg flex flex-col gap-3.5 shadow-md">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-orange-500/10 text-orange-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wider">
              System Hardware Dashboard
            </h4>
            <p className="text-[10px] text-zinc-500 font-sans">
              Real-time D3.js load matrices engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[9px] text-zinc-400">
            {intensity.toUpperCase()} MODE
          </span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[9px] text-zinc-400">
            {target.toUpperCase()} TARGET
          </span>
        </div>
      </div>

      {/* Grid of Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2 bg-zinc-950/40 border border-zinc-850 rounded">
          <span className="font-mono text-[8px] text-zinc-500 uppercase block font-semibold">CPU Peak</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-sm font-extrabold text-blue-400">{peakCpu}%</span>
            <span className="font-mono text-[8px] text-zinc-500">avg {avgCpu}%</span>
          </div>
        </div>

        <div className="p-2 bg-zinc-950/40 border border-zinc-850 rounded">
          <span className="font-mono text-[8px] text-zinc-500 uppercase block font-semibold">GPU Peak</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-sm font-extrabold text-indigo-400">{peakGpu}%</span>
            <span className="font-mono text-[8px] text-zinc-500">avg {avgGpu}%</span>
          </div>
        </div>

        <div className="p-2 bg-zinc-950/40 border border-zinc-850 rounded">
          <span className="font-mono text-[8px] text-zinc-500 uppercase block font-semibold">Peak Temperature</span>
          <div className="mt-0.5">
            <span className={`font-mono text-sm font-extrabold ${peakTemp > 80 ? "text-red-400" : peakTemp > 70 ? "text-orange-400" : "text-emerald-400"}`}>
              {peakTemp}°C
            </span>
          </div>
        </div>

        <div className="p-2 bg-zinc-950/40 border border-zinc-850 rounded">
          <span className="font-mono text-[8px] text-zinc-500 uppercase block font-semibold">Simulation Clock</span>
          <div className="mt-0.5">
            <span className="font-mono text-sm font-extrabold text-purple-400">
              {history.length > 0 ? (history.length / 10).toFixed(1) : "0.0"}s / {duration}s
            </span>
          </div>
        </div>
      </div>

      {/* Graphical Plot container */}
      <div 
        ref={containerRef} 
        className="w-full h-44 bg-zinc-950/85 border border-zinc-850 rounded relative overflow-hidden flex items-center justify-center"
      >
        <svg 
          ref={svgRef} 
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Dynamic Plot Legend */}
      {history.length > 0 && (
        <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-sm bg-blue-500" />
            <span>CPU Active Load ({cpu}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-sm bg-indigo-500" />
            <span>GPU Active Load ({gpu}%)</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-zinc-400">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>Dynamic Core Matrix</span>
          </div>
        </div>
      )}
    </div>
  );
}
