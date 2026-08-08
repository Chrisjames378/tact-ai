import React, { useState, useEffect } from "react";
import { Server, Cpu, MemoryStick, Activity } from "lucide-react";

export default function SystemMonitor() {
  const [memory, setMemory] = useState<number>(0);
  const [cpu, setCpu] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frames = 0;
    
    // Smooth CPU simulation based on frame timing and random jitter
    let smoothedCpu = 15; // baseline

    const updateMetrics = () => {
      const now = performance.now();
      frames++;

      if (now >= lastTime + 1000) {
        const currentFps = Math.round((frames * 1000) / (now - lastTime));
        setFps(currentFps);
        
        // Calculate CPU usage estimate (inverse of FPS health + some variance)
        // If FPS drops, CPU goes up. 
        const fpsDrop = Math.max(0, 60 - currentFps);
        const targetCpu = Math.min(100, Math.max(5, fpsDrop * 3 + Math.random() * 20));
        smoothedCpu = smoothedCpu * 0.8 + targetCpu * 0.2;
        setCpu(Math.round(smoothedCpu));

        frames = 0;
        lastTime = now;

        // Memory Usage from Chrome's performance.memory if available
        if ((performance as any).memory) {
          const used = (performance as any).memory.usedJSHeapSize;
          const total = (performance as any).memory.jsHeapSizeLimit || (performance as any).memory.totalJSHeapSize;
          if (total > 0) {
            setMemory(Math.round((used / total) * 100));
          }
        } else {
          // Fallback simulation based on DOM size and components
          const domElements = document.getElementsByTagName('*').length;
          setMemory(Math.min(100, Math.round(domElements / 50)));
        }
      }
      animationFrameId = requestAnimationFrame(updateMetrics);
    };

    animationFrameId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const getCpuColor = (val: number) => {
    if (val > 80) return "bg-red-500";
    if (val > 50) return "bg-amber-500";
    return "bg-emerald-500";
  };
  
  const getMemColor = (val: number) => {
    if (val > 80) return "bg-red-500";
    if (val > 60) return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className="flex gap-8 items-center">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-500 tracking-tighter">
          <Cpu className="w-3 h-3" />
          <span>CPU Compute</span>
          <span className="ml-auto font-mono text-zinc-300">{cpu}%</span>
        </div>
        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${getCpuColor(cpu)}`}
            style={{ width: `${cpu}%` }}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-500 tracking-tighter">
          <MemoryStick className="w-3 h-3" />
          <span>Heap Memory</span>
          <span className="ml-auto font-mono text-zinc-300">{memory}%</span>
        </div>
        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${getMemColor(memory)}`}
            style={{ width: `${memory}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-500 tracking-tighter">
          <Activity className="w-3 h-3" />
          <span>Engine FPS</span>
        </div>
        <span className={`text-sm font-mono ${fps < 30 ? 'text-red-400' : 'text-zinc-300'}`}>
          {fps} <span className="text-[10px] text-zinc-500">FPS</span>
        </span>
      </div>
    </div>
  );
}
