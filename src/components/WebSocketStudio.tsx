import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, Activity, RefreshCw, Send, CheckCircle2, AlertCircle, 
  Terminal, ShieldCheck, Cpu, Database, Play, Flame, Layers, 
  Clock, ArrowUpRight, Copy, Check, Radio, Wifi, Trash2
} from "lucide-react";

interface WSFrame {
  id: string;
  direction: "sent" | "received";
  timestamp: string;
  type: string;
  data: any;
}

export default function WebSocketStudio() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  
  // Response API Configuration
  const [model, setModel] = useState("gemini-3.5-flash");
  const [store, setStore] = useState(false);
  const [generate, setGenerate] = useState(true);
  const [previousResponseId, setPreviousResponseId] = useState<string>("");
  const [lastResponseId, setLastResponseId] = useState<string>("");
  const [userInput, setUserInput] = useState("Run diagnostic checks on local network latency and GPU thermal levels.");
  
  // Streaming & Log States
  const [streamingText, setStreamingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [frames, setFrames] = useState<WSFrame[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pingStartRef = useRef<number>(0);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const heartbeatRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const manualDisconnectRef = useRef<boolean>(false);

  const getWsUrl = () => {
    if (typeof window === "undefined") return "ws://localhost:3000/ws";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  };

  const addFrameLog = (direction: "sent" | "received", data: any) => {
    const frame: WSFrame = {
      id: Math.random().toString(36).substring(2, 9),
      direction,
      timestamp: new Date().toLocaleTimeString() + "." + String(Date.now() % 1000).padStart(3, "0"),
      type: data.type || (direction === "sent" ? "outgoing_payload" : "incoming_payload"),
      data
    };
    setFrames(prev => [frame, ...prev].slice(0, 50));
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const startHeartbeat = (socket: WebSocket) => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        sendPing(socket);
      }
    }, 10000);
  };

  const connect = () => {
    manualDisconnectRef.current = false;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);
    const url = getWsUrl();
    console.log("[WebSocketStudio] Connecting to:", url);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        addFrameLog("received", { type: "system_status", message: "WebSocket connection established.", url });
        sendPing(ws);
        startHeartbeat(ws);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          addFrameLog("received", parsed);

          if (parsed.type === "pong") {
            if (pingStartRef.current) {
              setLatencyMs(Date.now() - pingStartRef.current);
            }
          } else if (parsed.type === "response.created") {
            setIsGenerating(true);
            const respId = parsed.response?.id;
            if (respId) {
              setLastResponseId(respId);
              setPreviousResponseId(respId);
            }
          } else if (parsed.type === "response.text.delta") {
            if (parsed.delta) {
              setStreamingText(prev => prev + parsed.delta);
            }
          } else if (parsed.type === "response.completed") {
            setIsGenerating(false);
            const respId = parsed.response?.id;
            if (respId) {
              setLastResponseId(respId);
              setPreviousResponseId(respId);
            }
          } else if (parsed.type === "error") {
            setIsGenerating(false);
          }
        } catch (e) {
          addFrameLog("received", { type: "raw_text", raw: event.data });
        }
      };

      ws.onerror = (err) => {
        console.warn("[WebSocketStudio] Transport issue handled:", err);
        addFrameLog("received", { type: "error", message: "WebSocket transport issue encountered." });
        setIsConnected(false);
        setIsConnecting(false);
      };

      ws.onclose = () => {
        stopHeartbeat();
        setIsConnected(false);
        setIsConnecting(false);
        addFrameLog("received", { type: "system_status", message: "WebSocket connection closed." });

        if (!manualDisconnectRef.current) {
          console.log("[WebSocketStudio] Connection lost unexpectedly. Retrying in 3s...");
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!manualDisconnectRef.current) {
              connect();
            }
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (e: any) {
      setIsConnecting(false);
      addFrameLog("received", { type: "error", message: e.message || "Failed to create WebSocket instance." });
    }
  };

  const disconnect = () => {
    manualDisconnectRef.current = true;
    stopHeartbeat();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsGenerating(false);
  };

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  const sendPing = (socket = wsRef.current) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      pingStartRef.current = Date.now();
      const payload = { type: "ping" };
      socket.send(JSON.stringify(payload));
      addFrameLog("sent", payload);
    }
  };

  const handleSendResponseCreate = (customGenerate?: boolean, customPrevId?: string, customInput?: any[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      setTimeout(() => handleSendResponseCreate(customGenerate, customPrevId, customInput), 500);
      return;
    }

    setStreamingText("");
    setIsGenerating(true);

    const isGen = customGenerate !== undefined ? customGenerate : generate;
    const prevId = customPrevId !== undefined ? customPrevId : (previousResponseId.trim() || undefined);

    const inputItems = customInput || [
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: userInput }]
      }
    ];

    const payload: any = {
      type: "response.create",
      model,
      store,
      generate: isGen,
      input: inputItems
    };

    if (prevId) {
      payload.previous_response_id = prevId;
    }

    wsRef.current.send(JSON.stringify(payload));
    addFrameLog("sent", payload);
  };

  const handleSendToolOutput = () => {
    const toolItems = [
      {
        type: "function_call_output",
        call_id: `call_${Math.random().toString(36).substring(2, 7)}`,
        output: "Diagnostic scan result: Thermal levels nominal (38°C), network ping: 12ms."
      },
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Summarize findings based on tool output." }]
      }
    ];
    handleSendResponseCreate(true, previousResponseId, toolItems);
  };

  const handleSendWarmup = () => {
    handleSendResponseCreate(false);
  };

  const handleTestInvalidResponseId = () => {
    handleSendResponseCreate(true, "resp_invalid_nonexistent_9999");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${isConnected ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
          <h2 className="text-sm font-bold font-mono tracking-tight text-zinc-100 flex items-center gap-1.5">
            WebSocket Mode Studio
            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono uppercase">
              /v1/responses
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Indicator */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : isConnecting ? "bg-amber-500 animate-ping" : "bg-red-500"}`} />
            <span className="text-zinc-300">{isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}</span>
            {latencyMs !== null && isConnected && (
              <span className="text-emerald-400 text-[10px] ml-1">({latencyMs}ms)</span>
            )}
          </div>

          <button
            onClick={() => sendPing()}
            disabled={!isConnected}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 rounded border border-zinc-700 text-xs transition"
            title="Ping WebSocket Server"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {isConnected ? (
            <button
              onClick={disconnect}
              className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-200 text-xs font-mono rounded transition"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-200 text-xs font-mono rounded transition flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isConnecting ? "animate-spin" : ""}`} /> Connect
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Control Panel: Request Builder (5 cols) */}
        <div className="lg:col-span-5 border-r border-zinc-800 p-3 overflow-y-auto space-y-4 bg-zinc-950/80">
          {/* Transport & Model Options */}
          <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/80 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> Session Configuration
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Model Alias</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Fast)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  <option value="gpt-5.6">gpt-5.6 (Alias)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Store Mode</label>
                <button
                  type="button"
                  onClick={() => setStore(!store)}
                  className={`w-full px-2 py-1 rounded text-xs font-mono border flex items-center justify-between ${
                    store 
                      ? "bg-blue-950/60 border-blue-700 text-blue-300" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-400"
                  }`}
                >
                  <span>{store ? "store=true" : "store=false (ZDR)"}</span>
                  <Database className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Previous Response ID chaining */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                  <span>previous_response_id</span>
                  {previousResponseId && (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">Chained</span>
                  )}
                </label>
                {previousResponseId && (
                  <button
                    onClick={() => setPreviousResponseId("")}
                    className="text-[9px] font-mono text-zinc-500 hover:text-red-400"
                  >
                    Clear Chain
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={previousResponseId}
                  onChange={(e) => setPreviousResponseId(e.target.value)}
                  placeholder="resp_123... (Omitting starts new session)"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                {lastResponseId && previousResponseId !== lastResponseId && (
                  <button
                    onClick={() => setPreviousResponseId(lastResponseId)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 rounded border border-zinc-700"
                    title="Use last response ID"
                  >
                    Use Latest
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Prompt & Turn Input */}
          <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/80 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Incremental Turn Input
            </h3>

            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              placeholder="Enter text input for response.create..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
            />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generate}
                  onChange={(e) => setGenerate(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-blue-600 focus:ring-0"
                />
                generate: true
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">(Uncheck for state warmup)</span>
            </div>

            <button
              onClick={() => handleSendResponseCreate()}
              disabled={isGenerating}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Streaming over WebSocket...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Dispatch response.create
                </>
              )}
            </button>
          </div>

          {/* Quick Action Presets */}
          <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/80 space-y-2">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Protocol Test Presets
            </h3>

            <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
              <button
                onClick={handleSendWarmup}
                disabled={isGenerating}
                className="w-full text-left px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded text-zinc-300 flex items-center justify-between"
              >
                <span>🔥 Preload Warmup (generate: false)</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </button>

              <button
                onClick={handleSendToolOutput}
                disabled={isGenerating}
                className="w-full text-left px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded text-zinc-300 flex items-center justify-between"
              >
                <span>🛠️ Send Tool Result Output (function_call_output)</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </button>

              <button
                onClick={handleTestInvalidResponseId}
                disabled={isGenerating}
                className="w-full text-left px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800/80 border border-red-900/30 rounded text-red-300 hover:text-red-200 flex items-center justify-between"
              >
                <span>⚠️ Test Uncached ID (previous_response_not_found)</span>
                <ArrowUpRight className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Real-Time Stream Output & Frame Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-zinc-950">
          {/* Output Display Box */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-zinc-300 uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Real-time Streaming Response Text
              </span>
              {isGenerating && (
                <span className="text-[10px] font-mono text-emerald-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Receiving delta chunks...
                </span>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded p-3 min-h-[120px] max-h-[220px] overflow-y-auto font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {streamingText ? (
                streamingText
              ) : (
                <span className="text-zinc-600 italic">No output text received yet. Dispatch a response.create event to stream response tokens live over WebSocket.</span>
              )}
            </div>
          </div>

          {/* Frame Inspector Log Header */}
          <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold text-zinc-200 uppercase">Live WebSocket Frame Log</span>
              <span className="text-[10px] text-zinc-500">({frames.length} frames)</span>
            </div>

            <button
              onClick={() => setFrames([])}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear Log
            </button>
          </div>

          {/* Frames Stream Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-[11px]">
            {frames.length === 0 ? (
              <div className="text-center text-zinc-600 py-8 text-xs font-mono">
                Frame log is empty. Connection events and responses will appear here.
              </div>
            ) : (
              frames.map((frame) => (
                <div
                  key={frame.id}
                  className={`p-2.5 rounded border ${
                    frame.direction === "sent"
                      ? "bg-blue-950/20 border-blue-900/40 text-blue-200"
                      : frame.type === "error"
                      ? "bg-red-950/30 border-red-900/50 text-red-200"
                      : frame.type === "response.text.delta"
                      ? "bg-zinc-900/40 border-zinc-800 text-zinc-300"
                      : "bg-zinc-900/70 border-zinc-800 text-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span
                        className={`px-1 rounded uppercase text-[9px] ${
                          frame.direction === "sent"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {frame.direction}
                      </span>
                      <span className="text-zinc-300 font-mono">{frame.type}</span>
                    </div>
                    <span className="text-zinc-500">{frame.timestamp}</span>
                  </div>

                  <pre className="text-[10px] leading-tight overflow-x-auto whitespace-pre-wrap bg-zinc-950/80 p-1.5 rounded border border-zinc-800/50 text-zinc-300">
                    {JSON.stringify(frame.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
