import React, { useState } from "react";
import { 
  Globe, Key, Cpu, Code, Copy, Check, ExternalLink, 
  AlertCircle, Terminal, ArrowRight, Send, FileText, 
  Search, ShieldAlert, Sparkles, Loader2, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WebScraperProps {
  onTransmitToAI: (scrapedContent: string) => void;
}

export default function WebScraper({ onTransmitToAI }: WebScraperProps) {
  const [url, setUrl] = useState("https://httpbin.io/anything");
  const [customKey, setCustomKey] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "raw" | "metadata">("summary");
  
  // Scraped data results state
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [rawOutput, setRawOutput] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [scrapeStats, setScrapeStats] = useState<{ durationMs: number; sizeBytes: number } | null>(null);

  // Quick Preset URLs
  const presetUrls = [
    { label: "Httpbin Diagnostic", url: "https://httpbin.io/anything" },
    { label: "Wikipedia (API Test)", url: "https://en.wikipedia.org/wiki/Main_Page" },
    { label: "Hacker News", url: "https://news.ycombinator.com" },
  ];

  const handleScrape = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setScrapeResult(null);
    setRawOutput("");
    setLogs(["[00:00.01] Initializing Scraper Node...", "[00:00.05] Opening tunnel to server /api/scrape..."]);
    const startTime = Date.now();

    try {
      // Step 2 Log
      setTimeout(() => {
        setLogs(prev => [...prev, "[00:00.25] Handshaking with Evomi API Proxy...", "[00:00.45] Dispatching Realtime Web Crawler..."]);
      }, 300);

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          apiKey: customKey.trim() || undefined
        })
      });

      const duration = Date.now() - startTime;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Scrape failed with status ${res.status}`);
      }

      const data = await res.json();
      const stringified = JSON.stringify(data, null, 2);
      
      setLogs(prev => [
        ...prev, 
        `[00:01.10] Bytes received: ${stringified.length} bytes`,
        `[00:01.20] Parse completed in ${duration}ms!`,
        "[00:01.25] Generating localized Page Diagnostics..."
      ]);

      setScrapeResult(data);
      setRawOutput(stringified);
      setScrapeStats({
        durationMs: duration,
        sizeBytes: stringified.length
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during URL retrieval.");
      setLogs(prev => [...prev, `[ERROR] Scraper engine aborted: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransmit = () => {
    if (!scrapeResult) return;
    
    // Format a high-fidelity summary string to transmit to Tact AI
    let payload = `[WEBPAGE DIAGNOSTIC SCRAPE ANALYSIS]
Target URL: ${url}
Size: ${scrapeStats?.sizeBytes} bytes
Load Time: ${scrapeStats?.durationMs}ms

--- CONTENT ---
${rawOutput.substring(0, 1500)}${rawOutput.length > 1500 ? "\n\n[... truncated for context limits ...]" : ""}

--- TACT AI CRAWL INSTRUCTIONS ---
Please analyze this scraped content. Identify the main page elements, structure, and any technical errors or endpoints described. Summarize the content and recommend any troubleshooting or development paths.`;
    
    onTransmitToAI(payload);
  };

  // Helper to extract a friendly visual text summary of scraped content
  const renderFormattedSummary = () => {
    if (!scrapeResult) return null;

    // Check if Evomi returned standard text, body, or httpbin mock contents
    let title = "Web Scrape Document";
    let textExcerpt = "";
    
    if (scrapeResult.url) {
      title = `Scrape Result: ${scrapeResult.url}`;
    }

    if (scrapeResult.data) {
      textExcerpt = typeof scrapeResult.data === "string" ? scrapeResult.data : JSON.stringify(scrapeResult.data, null, 2);
    } else if (scrapeResult.content) {
      textExcerpt = scrapeResult.content;
    } else if (scrapeResult.html) {
      // Strip some tags for visual display preview
      textExcerpt = scrapeResult.html.replace(/<[^>]*>/g, " ").substring(0, 1000) + "...";
    } else {
      textExcerpt = JSON.stringify(scrapeResult, null, 2).substring(0, 800) + "...";
    }

    return (
      <div className="space-y-3 font-sans">
        <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 font-mono tracking-wider mb-1">
            <Globe className="w-3 h-3" /> Target Header Info
          </div>
          <h3 className="text-xs font-bold text-zinc-100 font-mono truncate">{url}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">
            Status: <span className="text-emerald-400 font-bold font-mono">200 OK</span> • Node: <span className="text-zinc-300 font-mono font-semibold">Evomi Realtime Crawl Engine v1</span>
          </p>
        </div>

        <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">Extracted Page Excerpt</span>
            <span className="text-[9px] text-zinc-500 font-mono">Max 1,000 chars preview</span>
          </div>
          <div className="max-h-56 overflow-y-auto bg-black/40 p-2.5 rounded border border-zinc-850 font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap select-text scrollbar-thin">
            {textExcerpt}
          </div>
        </div>

        <button
          onClick={handleTransmit}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Transmit Scrape data to Tact AI
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/10 border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg">
      
      {/* Header */}
      <div className="glass-panel-header px-4 py-3.5 flex items-center justify-between border-b border-zinc-850 bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Web Scraper Inspector Node
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-mono text-[9px] text-zinc-500 uppercase">Evomi Gateway</span>
        </div>
      </div>

      {/* Main Form Scraper Area */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 select-none">
        
        {/* API Settings configuration overlay/header */}
        <div className="border border-zinc-800/80 bg-zinc-950/40 rounded-lg p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">Evomi API Authorization</span>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[9px] font-mono uppercase text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
            >
              {showConfig ? "Hide Config" : "Configure Custom API Key"}
            </button>
          </div>

          <AnimatePresence>
            {showConfig && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 pt-2 border-t border-zinc-850 space-y-2"
              >
                <div className="flex flex-col gap-1.5 font-mono">
                  <label className="text-[9px] text-zinc-500 uppercase font-semibold">Custom Scraper API Key Override</label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="Enter your Evomi API key (or leave empty if EVOMI_API_KEY is configured in Secrets)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[8px] text-zinc-500 leading-normal">
                    * If left blank, the Express backend proxies requests using the secure EVOMI_API_KEY defined in the Secrets panel.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preset Selector */}
        <div className="space-y-1.5">
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Scraper Target Presets</span>
          <div className="flex flex-wrap gap-2">
            {presetUrls.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setUrl(preset.url)}
                className={`px-2.5 py-1 rounded border font-mono text-[9px] font-semibold transition-all duration-150 cursor-pointer ${
                  url === preset.url 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/35" 
                    : "bg-zinc-900/30 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target URL Input */}
        <div className="space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Target Endpoint URL</span>
            <span className="text-[9px] text-zinc-600">Requires complete HTTPS header</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25"
              />
            </div>
            <button
              onClick={handleScrape}
              disabled={loading || !url.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-850 disabled:text-zinc-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Execute</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Telemetry Output / Logs Panel */}
        <div className="font-mono text-[10px] space-y-1.5">
          <div className="flex items-center justify-between text-zinc-500 uppercase">
            <span>Terminal Trace Engine</span>
            <span>Real-time logger</span>
          </div>
          <div className="bg-black/60 border border-zinc-850 p-3 rounded-lg h-28 overflow-y-auto space-y-1 scrollbar-thin">
            {logs.length === 0 ? (
              <span className="text-zinc-600 italic">Engine idle. Provide a URL and click Execute to start the realtime web scraper node.</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`leading-normal ${log.startsWith("[ERROR]") ? "text-red-400 font-bold" : "text-zinc-400"}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5 font-mono text-[10px] text-red-400 leading-normal">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase mb-0.5">Scrape Transaction Refused</span>
              {error}
            </div>
          </div>
        )}

        {/* Scrape Result Output */}
        {scrapeResult && (
          <div className="space-y-3 pt-2">
            
            {/* Tab selection */}
            <div className="flex bg-zinc-950 p-0.5 rounded border border-zinc-850">
              {[
                { id: "summary", label: "Page Summary", icon: FileText },
                { id: "raw", label: "Raw JSON Response", icon: Code },
                { id: "metadata", label: "Performance Specs", icon: Cpu },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-mono text-[9px] uppercase font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-zinc-900 text-blue-400 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Render selected output tab */}
            <div className="min-h-[220px]">
              {activeTab === "summary" && renderFormattedSummary()}

              {activeTab === "raw" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">RAW JSON DATA ({scrapeStats?.sizeBytes} Bytes)</span>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 rounded font-mono text-[9px] uppercase font-bold transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Raw Response</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-auto bg-zinc-950/80 border border-zinc-850 p-3 rounded-lg font-mono text-[10px] text-zinc-400 whitespace-pre scrollbar-thin select-text">
                    {rawOutput}
                  </div>
                </div>
              )}

              {activeTab === "metadata" && scrapeStats && (
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                    <span className="text-[9px] text-zinc-500 uppercase block">Response Duration</span>
                    <span className="text-lg font-bold text-blue-400 mt-1 block">{scrapeStats.durationMs}ms</span>
                    <span className="text-[8px] text-zinc-600 block mt-1">Round-trip fetch latency</span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                    <span className="text-[9px] text-zinc-500 uppercase block">Total Weight</span>
                    <span className="text-lg font-bold text-purple-400 mt-1 block">{(scrapeStats.sizeBytes / 1024).toFixed(2)} KB</span>
                    <span className="text-[8px] text-zinc-600 block mt-1">Uncompressed raw payload</span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                    <span className="text-[9px] text-zinc-500 uppercase block">Target Status Code</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">200 OK</span>
                    <span className="text-[8px] text-zinc-600 block mt-1">Status validated successfully</span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                    <span className="text-[9px] text-zinc-500 uppercase block">Proxy Provider</span>
                    <span className="text-md font-bold text-zinc-300 mt-1.5 block truncate">EVOMI CRAWLER v1</span>
                    <span className="text-[8px] text-zinc-600 block mt-0.5">Realtime Scraper Gateway</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
