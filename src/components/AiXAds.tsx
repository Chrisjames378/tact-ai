import React, { useState, useEffect } from "react";
import { Sparkles, ExternalLink, Zap, ShieldCheck, X } from "lucide-react";

export default function AiXAds() {
  const [currentAdIdx, setCurrentAdIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const ads = [
    {
      sponsor: "AI-X Hardware Repair Suite",
      badge: "SPONSORED NODE",
      headline: "Ultrasonic Frequency Transducers & Micro-Soldering Probes",
      description: "Upgrade your benchtop with precision 24kHz acoustic pulse clean guns for USB-C moisture clearing.",
      cta: "Explore AI-X Tools",
      url: "https://ai-x-hardware.example.com",
      color: "from-purple-900/40 to-indigo-900/40 border-purple-500/30 text-purple-300"
    },
    {
      sponsor: "AI-Gateway Enterprise",
      badge: "AI PARTNER",
      headline: "Zero-Latency LLM Proxy & Cache Network for Technicians",
      description: "Route Gemini, Grok, and Claude diagnostic requests with 99.99% uptime and zero rate limits.",
      cta: "Claim $50 Gateway Credit",
      url: "https://gateway.ai-x.example.com",
      color: "from-blue-900/40 to-cyan-900/40 border-blue-500/30 text-blue-300"
    },
    {
      sponsor: "Samsung Members Care+",
      badge: "OFFICIAL DIAGNOSTICS",
      headline: "Automated Galaxy OLED Pixel Recalibration SDK v3.1",
      description: "Direct OEM API integration for Samsung screen subpixel conditioning and battery health audits.",
      cta: "Learn More",
      url: "https://samsung.com",
      color: "from-emerald-900/40 to-teal-900/40 border-emerald-500/30 text-emerald-300"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdIdx(prev => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (!isVisible) return null;

  const currentAd = ads[currentAdIdx];

  return (
    <div className={`px-4 py-2 bg-gradient-to-r ${currentAd.color} border-b flex items-center justify-between gap-3 text-xs font-mono transition-all`}>
      <div className="flex items-center gap-2.5 overflow-hidden">
        <span className="px-1.5 py-0.5 rounded bg-zinc-950/80 font-bold text-[8px] uppercase tracking-wider text-amber-400 border border-amber-500/30 shrink-0">
          {currentAd.badge}
        </span>
        <div className="flex items-center gap-2 truncate">
          <strong className="text-zinc-100 font-bold shrink-0">{currentAd.sponsor}:</strong>
          <span className="text-zinc-300 font-medium truncate">{currentAd.headline}</span>
          <span className="hidden md:inline text-zinc-400 text-[10px] truncate">— {currentAd.description}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={currentAd.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-[9px] font-bold uppercase flex items-center gap-1 transition-colors"
        >
          {currentAd.cta}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <button
          onClick={() => setIsVisible(false)}
          className="text-zinc-500 hover:text-zinc-300 p-0.5"
          title="Dismiss sponsor banner"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
