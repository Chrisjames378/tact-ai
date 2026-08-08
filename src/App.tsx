import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, MessageSquare, Send, Volume2, VolumeX, RefreshCw, 
  Settings, Battery, Wifi, Cpu, Layers, HelpCircle, Terminal, 
  Wrench, Activity, Sparkles, Plus, AlertCircle, Play, Square,
  ExternalLink, Info, Globe, Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import RepairToolbox from "./components/RepairToolbox";
import AgentHub from "./components/AgentHub";
import WebScraper from "./components/WebScraper";
import SamsungMembers from "./components/SamsungMembers";
import WifiAnalyzer from "./components/WifiAnalyzer";
import SystemMonitor from "./components/SystemMonitor";
import AiXAds from "./components/AiXAds";
import { Message, DiagnosticData } from "./types";
import { initAuth, googleSignIn, logout, setAccessToken } from "./utils/googleAuth";
import { logRepairToGoogleSheets } from "./utils/sheetsLogger";
import { generateLocalDiagnosticResponse } from "./utils/agentHelpers";

export default function App() {
  // Right-hand Panel Selection Tab (Toggle between Workbench, AI Agents Hub, Web Scraper, Samsung Members, and Wi-Fi Analyzer)
  const [rightPanelTab, setRightPanelTab] = useState<"workbench" | "agents" | "scraper" | "samsung" | "wifi">("agents");

  // Node Online Status and Node Version Upgrades
  const [isNodeOnline, setIsNodeOnline] = useState<boolean>(true);
  const [nodeVersion, setNodeVersion] = useState<string>("v1.0.4");

  // Local Only Privacy Mode (Disables cloud connections, processes entirely on-device)
  const [isLocalOnly, setIsLocalOnly] = useState<boolean>(() => {
    return localStorage.getItem("tact_ai_local_only") === "true";
  });

  const handleToggleLocalOnly = () => {
    const newVal = !isLocalOnly;
    setIsLocalOnly(newVal);
    localStorage.setItem("tact_ai_local_only", String(newVal));
    playBeep();
    
    if (newVal) {
      setMessages(prev => [...prev, {
        id: `privacy-on-${Date.now()}`,
        role: "assistant",
        text: `🔒 **Local Only Privacy Mode Activated**: Cloud connection channels are now suspended.
- **On-Device Expert System**: Troubleshooting questions & diagnostic analyses will run entirely local.
- **Privacy Shield Active**: Offloads to Google Drive or Sheets are completely blocked.
- **Enterprise Isolation**: Zero cloud data footprint or logging queries leave your browser.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      speakResponse("Local only privacy mode activated.");
    } else {
      setMessages(prev => [...prev, {
        id: `privacy-off-${Date.now()}`,
        role: "assistant",
        text: `🌐 **Cloud Cognitive Mode Restored**: Google Drive and server-side GenAI features are fully available again.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      speakResponse("Cloud connectivity restored.");
    }
  };

  // Chat History
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      text: "Tact AI Diagnostic Node Online. Ready for hardware and software systems telemetry analysis. You can speak to me, activate 'Hey Tact' wake-word monitoring, or transmit local telemetry figures using the virtual Workbench on the right.",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google OAuth Auth & Logging states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  useEffect(() => {
    // Initialize google auth state observer
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Audio / Speech States
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Diagnostics & Workbenches
  const [activeDiagnostics, setActiveDiagnostics] = useState<DiagnosticData | null>(null);
  const [batteryState, setBatteryState] = useState<{ level: number; charging: boolean; supported: boolean }>({
    level: 100,
    charging: true,
    supported: false
  });

  // Load battery state for Repair Tools dynamic payload
  useEffect(() => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setBatteryState({
          level: Math.round(batt.level * 100),
          charging: batt.charging,
          supported: true
        });

        const onLevelChange = () => setBatteryState(prev => ({ ...prev, level: Math.round(batt.level * 100) }));
        const onChargingChange = () => setBatteryState(prev => ({ ...prev, charging: batt.charging }));

        batt.addEventListener("levelchange", onLevelChange);
        batt.addEventListener("chargingchange", onChargingChange);

        return () => {
          batt.removeEventListener("levelchange", onLevelChange);
          batt.removeEventListener("chargingchange", onChargingChange);
        };
      }).catch(() => {
        setBatteryState(prev => ({ ...prev, supported: false }));
      });
    }
  }, []);
  
  // Audio Refs
  const recognitionRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Check Web Speech API Support & initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setRecognitionError(null);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript && transcript.trim() !== "") {
          handleSend(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        if (e.error === "not-allowed") {
          setRecognitionError("Mic access blocked. Please enable frame permissions in metadata or browser settings.");
        } else {
          setRecognitionError(`Recognition error code: ${e.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    } else {
      setSpeechSupported(false);
    }

    // Load synth voices early
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    // Cleanup speech on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // "Hey Tact" continuous wake word checker
  useEffect(() => {
    let continuousRec: any = null;
    if (!wakeWordActive || !speechSupported) {
      if (continuousRec) continuousRec.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    continuousRec = new SpeechRecognition();
    continuousRec.continuous = true;
    continuousRec.interimResults = true;
    continuousRec.lang = "en-US";

    continuousRec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          const finalText = e.results[i][0].transcript.toLowerCase();
          console.log("Wake word candidate phrase:", finalText);
          if (finalText.includes("hey tact") || finalText.includes("tact") || finalText.includes("tech")) {
            // Wake word triggered! Play confirmation click and start recording
            playBeep();
            triggerManualVoiceInput();
            break;
          }
        }
      }
    };

    continuousRec.onerror = (err: any) => {
      console.warn("Continuous monitoring warning:", err.error);
      if (err.error === "not-allowed") {
        setWakeWordActive(false);
      }
    };

    continuousRec.onend = () => {
      // Loop continuous listener if wake word remains toggled
      if (wakeWordActive) {
        try {
          continuousRec.start();
        } catch (e) {}
      }
    };

    try {
      continuousRec.start();
    } catch (e) {
      console.error("Continuous start failed", e);
    }

    return () => {
      if (continuousRec) {
        continuousRec.onend = null;
        continuousRec.stop();
      }
    };
  }, [wakeWordActive, speechSupported]);

  // Google Sheets Authentication Handlers
  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setMessages(prev => [...prev, {
          id: `auth-success-${Date.now()}`,
          role: "assistant",
          text: `🔑 **Google Drive & Sheets Connected**: Successfully signed in as **${res.user.displayName || res.user.email}**! Real-time telemetry log archiving to \`Tact AI Repair Logs\` spreadsheet is now enabled.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setMessages(prev => [...prev, {
        id: `auth-failed-${Date.now()}`,
        role: "assistant",
        text: `⚠️ **Connection Failed**: Google sign-in was unsuccessful. Please verify your connection.\n\n*Error details: ${err.message || err}*`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setMessages(prev => [...prev, {
        id: `auth-logout-${Date.now()}`,
        role: "assistant",
        text: `🔒 **Google Drive Disconnected**: Signed out successfully. Repair logs will be saved locally until authorized again.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Clean trigger beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high tech beep
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  const playPowerOnTone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.35);
      osc2.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  };

  const playUpgradeTone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.setValueAtTime(450, audioCtx.currentTime + 0.08);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.16);
      osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.24);

      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  // Text-To-Speech playback
  const speakResponse = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop anything playing

    // Strip Markdown punctuation for clear playback voice
    const cleanText = text
      .replace(/\*\*|__/g, "")
      .replace(/\*|_/g, "")
      .replace(/#+\s/g, "")
      .replace(/`[^`]+`/g, "code telemetry")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .substring(0, 250); // limit to prevent drone playback

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Select premium voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      v.lang.startsWith("en") && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Synthesis"))
    );
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle voice playback manually
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Trigger recording
  const triggerManualVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Voice speech-to-text API is not supported on this browser context. Please use keyboard terminal inputs.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Start recording failed", e);
      }
    }
  };

  // Submit flow to Gemini Backend
  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || inputText;
    if (!prompt.trim()) return;

    if (!isNodeOnline) {
      const offlineMessageId = `offline-${Date.now()}`;
      const newOfflineMessage: Message = {
        id: offlineMessageId,
        role: "assistant",
        text: `⚠️ **Tact AI Diagnostic Node is Offline**\n\nThe local telemetry system is currently powered down or standby. To ask questions, analyze hardware, or run remote repairs, you must toggle the Diagnostic Node **ONLINE** via the selector bar at the top or within the Repair Toolbox.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: "user",
        text: prompt,
        timestamp: new Date().toLocaleTimeString(),
      }, newOfflineMessage]);
      setInputText("");
      speakResponse("The diagnostic node is offline. Please power on.");
      return;
    }

    // COMMAND PARSING LAYER
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes("mute assistant") || lowerPrompt.includes("mute voice") || lowerPrompt.includes("turn off voice")) {
      setIsMuted(true);
      stopSpeaking();
      const muteMsg = { id: `mute-${Date.now()}`, role: "assistant" as const, text: "Assistant voice muted.", timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "user" as const, text: prompt, timestamp: new Date().toLocaleTimeString() }, muteMsg]);
      setInputText("");
      return;
    }

    if (lowerPrompt.includes("unmute assistant") || lowerPrompt.includes("unmute voice") || lowerPrompt.includes("turn on voice")) {
      setIsMuted(false);
      const unmuteMsg = { id: `unmute-${Date.now()}`, role: "assistant" as const, text: "Assistant voice unmuted.", timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "user" as const, text: prompt, timestamp: new Date().toLocaleTimeString() }, unmuteMsg]);
      setInputText("");
      // Using direct speech synthesis here because isMuted state might not be updated yet for speakResponse
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance("Assistant voice unmuted.");
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    if (lowerPrompt.includes("open repair tools") || lowerPrompt.includes("open workbench") || lowerPrompt.includes("repair tool") || lowerPrompt.includes("open toolbox")) {
      setRightPanelTab("workbench");
      const repairMsg = { id: `rep-${Date.now()}`, role: "assistant" as const, text: "Opening Repair Workbench.", timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "user" as const, text: prompt, timestamp: new Date().toLocaleTimeString() }, repairMsg]);
      setInputText("");
      speakResponse("Opening repair tools.");
      return;
    }

    if (lowerPrompt.includes("check diagnostics") || lowerPrompt.includes("run diagnostics") || lowerPrompt.includes("hardware dashboard")) {
      setRightPanelTab("workbench");
      // Actually there's no way to force a specific sub-tool yet from App level easily, but setting to workbench is close enough.
      const diagMsg = { id: `diag-${Date.now()}`, role: "assistant" as const, text: "Opening Hardware Dashboard and readying diagnostics.", timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "user" as const, text: prompt, timestamp: new Date().toLocaleTimeString() }, diagMsg]);
      setInputText("");
      speakResponse("Checking diagnostics.");
      return;
    }

    const userMessageId = `msg-${Date.now()}`;
    const newUserMessage: Message = {
      id: userMessageId,
      role: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString(),
      diagnostics: activeDiagnostics ? { ...activeDiagnostics } : undefined,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText("");
    setIsLoading(true);
    stopSpeaking();

    if (isLocalOnly) {
      setTimeout(() => {
        const localResponse = generateLocalDiagnosticResponse(prompt, activeDiagnostics);
        const assistantMessageId = `msg-${Date.now() + 1}`;
        const newAssistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          text: localResponse,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages(prev => [...prev, newAssistantMessage]);
        speakResponse(newAssistantMessage.text);
        setActiveDiagnostics(null);
        setIsLoading(false);
      }, 700);
      return;
    }

    // Prepare history payload for context
    const apiHistory = messages.slice(-5).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: apiHistory,
          diagnostics: activeDiagnostics || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`API failed with status ${res.status}`);
      }

      const data = await res.json();
      
      const assistantMessageId = `msg-${Date.now() + 1}`;
      const newAssistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        text: data.text || "Diagnostic query returned empty.",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, newAssistantMessage]);
      speakResponse(newAssistantMessage.text);

      // Once sent, clear the attached diagnostic state context
      setActiveDiagnostics(null);
    } catch (err: any) {
      console.error("Chat Submit Error:", err);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: `⚠️ **Diagnostic link lost**: Unable to fetch telemetry data from GenAI server. Make sure your GEMINI_API_KEY is configured in **Settings > Secrets**.\n\nError detail: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Receives telemetry packet from workbench toolbox
  const handleReceiveDiagnostics = (data: DiagnosticData) => {
    setActiveDiagnostics(data);
    playBeep();
  };

  // Helper formatting for simple styled markdown render
  const renderMessageContent = (text: string) => {
    // splits paragraphs and basic bold markers
    return text.split("\n").map((line, idx) => {
      let content = line;
      
      // Handle Bold **text**
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="text-blue-400 font-semibold font-mono text-xs">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const formattedLine = parts.length > 0 ? parts : content;

      // Check if it looks like a list item
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return (
          <li key={idx} className="ml-4 list-disc text-zinc-300 text-xs py-0.5 font-sans leading-relaxed">
            {parts.length > 0 ? parts : line.trim().substring(1).trim()}
          </li>
        );
      }
      
      if (line.trim().match(/^\d+\./)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-zinc-300 text-xs py-0.5 font-sans leading-relaxed">
            {parts.length > 0 ? parts : line.trim().replace(/^\d+\.\s*/, "")}
          </li>
        );
      }

      if (line.startsWith("#")) {
        const textStr = line.replace(/^#+\s*/, "");
        return (
          <h4 key={idx} className="font-mono text-xs font-bold text-zinc-100 tracking-wide uppercase border-b border-zinc-850 pb-1 mt-3 mb-1.5">
            {textStr}
          </h4>
        );
      }

      return (
        <p key={idx} className="text-xs text-zinc-300 font-sans leading-relaxed mb-1 min-h-[4px]">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200 border-4 border-[#121212] relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[160px]"></div>
      </div>
      
      {/* AI-X Sponsored Hardware & Partner Ticker */}
      <AiXAds />

      {/* 1. Header Bar */}
      <header className="h-20 flex items-center justify-between px-6 glass-header z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-zinc-100">
              Tact AI <span className="text-zinc-500 font-normal ml-2 text-sm font-sans">v1.0.4</span>
            </h1>
          </div>
        </div>

        {/* Diagnostic Bar Indicators */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold font-sans">System Active</span>
          </div>
          <div className="h-4 w-[1px] bg-zinc-700"></div>
          <div className="text-xs text-zinc-500 font-mono tracking-tighter">ID: OSTRICH_PROTOTYPE_01</div>
        </div>
      </header>

      {/* 2. Main Workbench Panels */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10">
        
        {/* COLUMN A (Lg: 7/12) - SPEECH ASSISTANT CONSOLE */}
        <div className="lg:col-span-7 flex flex-col glass-container rounded-xl overflow-hidden shadow-2xl min-h-[500px]">
          
          {/* Active Status Display Bar */}
          <div className="glass-panel-header px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-xs font-bold text-zinc-300">
                Voice Assistant Node
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWakeWordActive(!wakeWordActive)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded border font-mono text-[9px] font-bold transition-all cursor-pointer ${
                  wakeWordActive 
                    ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse" 
                    : "bg-zinc-850 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                }`}
                title="Continuous background listening for phrase 'Hey Tact'"
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${wakeWordActive ? "bg-red-500" : "bg-zinc-500"}`} />
                Hey Tact Wake Word
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded cursor-pointer"
                title={isMuted ? "Unmute Assistant voice response" : "Mute Assistant voice response"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Interactive Core Orb Viewport */}
          <div className="relative py-8 bg-zinc-950/20 border-b border-white/5 flex flex-col items-center justify-center gap-6 min-h-[280px] overflow-hidden">
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Pulsing Visual Technical Core - Sleek double-ring layout from design */}
            <div 
              onClick={triggerManualVoiceInput}
              className="relative flex items-center justify-center w-56 h-56 cursor-pointer group z-10"
            >
              <div className="absolute inset-0 border-2 border-zinc-850 rounded-full scale-110 group-hover:scale-115 transition-transform duration-500"></div>
              <div className="absolute inset-0 border border-zinc-750/50 rounded-full scale-125 group-hover:scale-130 transition-transform duration-700"></div>
              
              <div className={`w-40 h-40 rounded-full bg-gradient-to-br from-zinc-800 to-black shadow-2xl flex items-center justify-center border border-zinc-700 shadow-blue-900/20 transition-all duration-500 ${
                isRecording ? "ring-2 ring-red-500/30" : isSpeaking ? "ring-2 ring-blue-500/30 shadow-blue-800/30" : "hover:border-zinc-500"
              }`}>
                {/* Audio waves visualizer representation inside orb */}
                <div className="flex items-end gap-1.5 h-14">
                  <div className={`w-1.5 bg-blue-500 rounded-full transition-all duration-300 ${isRecording ? "h-11 animate-pulse" : isSpeaking ? "h-9 animate-bounce" : "h-6"}`} style={{ animationDelay: "0ms" }} />
                  <div className={`w-1.5 bg-blue-400 rounded-full transition-all duration-300 ${isRecording ? "h-9 animate-pulse" : isSpeaking ? "h-12 animate-bounce" : "h-8"}`} style={{ animationDelay: "75ms" }} />
                  <div className={`w-1.5 bg-blue-300 rounded-full transition-all duration-300 ${isRecording ? "h-13 animate-pulse" : isSpeaking ? "h-14 animate-bounce" : "h-10"}`} style={{ animationDelay: "150ms" }} />
                  <div className={`w-1.5 bg-blue-400 rounded-full transition-all duration-300 ${isRecording ? "h-8 animate-pulse" : isSpeaking ? "h-10 animate-bounce" : "h-7"}`} style={{ animationDelay: "225ms" }} />
                  <div className={`w-1.5 bg-blue-500 rounded-full transition-all duration-300 ${isRecording ? "h-6 animate-pulse" : isSpeaking ? "h-7 animate-bounce" : "h-5"}`} style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>

            {/* Floating Technical Status logs */}
            <div className="flex flex-col items-center gap-1.5 text-center font-mono z-10 px-4">
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${
                isRecording ? "text-red-400 animate-pulse" :
                isSpeaking ? "text-blue-400" :
                "text-zinc-500"
              }`}>
                {isRecording ? "SYS_MIC_RECORDING ( Hey Tact Active )" :
                 isSpeaking ? "SYS_VOICE_SYNTHESIZING" :
                 "Awaiting Voice Input"}
              </span>
              <h2 className="text-xl font-light tracking-tight text-zinc-100 max-w-md">
                {isRecording ? '"Listening to local sensor feedback..."' : 
                 isSpeaking ? '"Speaking diagnostics report..."' : 
                 `"Hey Tact, analyze the engine schematics."`}
              </h2>
            </div>
          </div>

          {/* Transcript Scroll Log */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/40 max-h-[380px]"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 mb-1">
                    <span>{msg.role === "user" ? "USER_INPUT_PROBE" : "TACT_AI_DIAGNOSIS"}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className={`max-w-[85%] rounded-xl px-4 py-3 border text-xs leading-relaxed shadow ${
                    msg.role === "user"
                      ? "bg-blue-900/20 text-zinc-200 border-blue-500/20 rounded-tr-none"
                      : "bg-zinc-900/60 text-zinc-300 border-zinc-800/80 rounded-tl-none"
                  }`}>
                    {renderMessageContent(msg.text)}

                    {/* Show attachment if sent with diagnostics */}
                    {msg.diagnostics && (
                      <div className="mt-2 pt-2 border-t border-blue-500/10 font-mono text-[9px] text-blue-400/80 flex flex-col gap-0.5">
                        <span className="font-bold">📎 ATTACHED TELEMETRY DATA:</span>
                        <span>• Power Source: {msg.diagnostics.battery?.level}% ({msg.diagnostics.battery?.charging ? "Charging" : "Discharging"})</span>
                        <span>• Net Latency: {msg.diagnostics.network?.latencyMs}ms (Jitter: {msg.diagnostics.network?.jitterMs}ms)</span>
                        <span>• Viewport: {msg.diagnostics.screen?.width}x{msg.diagnostics.screen?.height}px</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-start"
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 mb-1">
                    <span>TACT_AI_DIAGNOSIS</span>
                    <span>•</span>
                    <span>PROBING MODEL CORE...</span>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 font-medium">Analyzing sensor telemetry metrics...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Keyboard Terminal Input Footer */}
          <div className="p-4 bg-zinc-950/30 border-t border-white/5">
            {recognitionError && (
              <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg mb-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="font-mono text-[10px] text-red-400 leading-normal">
                  {recognitionError}
                </p>
              </div>
            )}

            {/* Diagnostic indicator on message input */}
            {activeDiagnostics && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    📎 TELEMETRY ATTACHED: Ready to transmit {activeDiagnostics.network?.latencyMs}ms network, {activeDiagnostics.battery?.level}% battery diagnostics
                  </span>
                </div>
                <button
                  onClick={() => setActiveDiagnostics(null)}
                  className="font-mono text-[9px] text-zinc-400 hover:text-zinc-200 uppercase font-semibold cursor-pointer"
                >
                  Detach
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={triggerManualVoiceInput}
                  className={`h-12 px-8 font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer ${
                    isRecording 
                      ? "bg-red-500 text-white hover:bg-red-600" 
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {isRecording ? "Stop Scan" : "Speak Now"}
                </button>
                <button
                  onClick={() => {
                    if (activeDiagnostics) {
                      setActiveDiagnostics(null);
                    } else {
                      const conn = (navigator as any).connection;
                      const connectionType = conn?.effectiveType || "Ethernet/Wifi";
                      setActiveDiagnostics({
                        battery: batteryState,
                        network: {
                          latencyMs: Math.round(15 + Math.random() * 15),
                          jitterMs: Math.round(1 + Math.random() * 2),
                          connectionType,
                          testedAt: new Date().toLocaleTimeString()
                        },
                        screen: {
                          width: window.innerWidth,
                          height: window.innerHeight,
                          colorDepth: window.screen.colorDepth,
                          pixelRatio: window.devicePixelRatio
                        },
                        browser: {
                          userAgent: navigator.userAgent,
                          platform: navigator.platform,
                          language: navigator.language
                        }
                      });
                    }
                  }}
                  className="h-12 px-8 border border-zinc-700 text-zinc-300 font-bold uppercase text-xs tracking-widest hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Repair Tools
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded border border-zinc-800">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-[11px] font-mono text-zinc-400">LISTENING_LOOP_ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Quick-Action Diagnosis Presets */}
            <div className="mb-4">
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block mb-2 font-bold">Quick Diagnostic Copilots</span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "Dead Pixel Audit",
                    prompt: "I suspect my screen has dead pixels. Can you guide me on how to run a full-screen Dead Pixel Audit to detect stuck subpixels?",
                    color: "border-purple-500/20 hover:border-purple-500/40 text-purple-400 bg-purple-500/5",
                  },
                  {
                    label: "Battery Drain Fix",
                    prompt: "My smartphone and tablet batteries are draining too fast. How can I optimize battery health and limit background cache processes?",
                    color: "border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
                  },
                  {
                    label: "Sound Calibration",
                    prompt: "Let's calibrate my speaker's frequency limit. What sine wave presets should I play to flush dust or test fidelity?",
                    color: "border-blue-500/20 hover:border-blue-500/40 text-blue-400 bg-blue-500/5",
                  },
                  {
                    label: "Optimize Ping Jitter",
                    prompt: "My connection latency is spikey. What troubleshooting steps can I take to optimize local router packet jitter?",
                    color: "border-amber-500/20 hover:border-amber-500/40 text-amber-400 bg-amber-500/5",
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(preset.prompt);
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-semibold transition-all duration-200 hover:scale-[1.02] cursor-pointer ${preset.color}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2.5"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a device symptom (e.g., 'MacBook battery drains instantly', 'dead pixel test')..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all shadow cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* COLUMN B (Lg: 5/12) - PHYSICAL WORKBENCH, AI AGENTS HUB, & WEB SCRAPER */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Panel Selector Tabs */}
          <div className="flex bg-zinc-950/45 p-1 rounded-lg border border-zinc-800/60 shrink-0 gap-1 flex-wrap md:flex-nowrap">
            <button
              onClick={() => setRightPanelTab("agents")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-md font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${
                rightPanelTab === "agents"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/25 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              AI Agents
            </button>
            <button
              onClick={() => setRightPanelTab("workbench")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-md font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${
                rightPanelTab === "workbench"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/25 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Workbench
            </button>
            <button
              onClick={() => setRightPanelTab("scraper")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-md font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${
                rightPanelTab === "scraper"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/25 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Scraper
            </button>
            <button
              onClick={() => setRightPanelTab("samsung")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-md font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${
                rightPanelTab === "samsung"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/25 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Samsung
            </button>
            <button
              onClick={() => setRightPanelTab("wifi")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-md font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${
                rightPanelTab === "wifi"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/25 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              Wi-Fi
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {rightPanelTab === "agents" ? (
              <AgentHub 
                batteryLevel={batteryState.level}
                latencyMs={activeDiagnostics?.network?.latencyMs || 25}
                isNodeOnline={isNodeOnline}
                nodeVersion={nodeVersion}
                onNodeOnlineChange={(online) => {
                  setIsNodeOnline(online);
                  if (online) {
                    playPowerOnTone();
                    setMessages(prev => [...prev, {
                      id: `online-notif-${Date.now()}`,
                      role: "assistant",
                      text: `🟢 **Tact AI Diagnostic Node initialized successfully**: Core system version **${nodeVersion}** is now **ONLINE** and reading real-time telemetry pipelines.`,
                      timestamp: new Date().toLocaleTimeString()
                    }]);
                    speakResponse("Tact diagnostic node is online.");
                  } else {
                    setMessages(prev => [...prev, {
                      id: `offline-notif-${Date.now()}`,
                      role: "assistant",
                      text: `🔴 **Tact AI Diagnostic Node shut down**: Core system status set to **OFFLINE** (standby mode). Remote queries and repair tools are temporarily suspended.`,
                      timestamp: new Date().toLocaleTimeString()
                    }]);
                    speakResponse("Diagnostic node offline.");
                  }
                }}
                onNodeUpgrade={(newVer, logs) => {
                  setNodeVersion(newVer);
                  playUpgradeTone();
                  setMessages(prev => [...prev, {
                    id: `upgrade-notif-${Date.now()}`,
                    role: "assistant",
                    text: `⚙️ **Tact AI Diagnostic Node Upgraded**:\n\nSuccessfully compiled and flashed firmware to **${newVer}**!\n\n**Upgrade logs:**\n\`\`\`bash\n${logs}\n\`\`\`\n\nAll cognitive reasoning capacities have been elevated. Try speaking with me now!`,
                    timestamp: new Date().toLocaleTimeString()
                  }]);
                  speakResponse(`Node upgraded to version ${newVer}.`);
                }}
                onRepairCompleted={(devName, logs) => {
                  setMessages(prev => [...prev, {
                    id: `repair-notif-${Date.now()}`,
                    role: "assistant",
                    text: `🛠️ **Remote Repair Successful**:\n\nAutomated logical remedy applied to **${devName}** successfully!\n\n**Repair summary log:**\n\`\`\`bash\n${logs}\n\`\`\``,
                    timestamp: new Date().toLocaleTimeString()
                  }]);
                  speakResponse(`Automated repair patch applied to ${devName}.`);

                  // Auto-log to Google Sheets if authorized
                  if (googleToken && !isLocalOnly) {
                    const lines = logs.split("\n");
                    const issuePart = lines.find(l => l.includes("[INITIALIZATION]") || l.includes("degraded") || l.includes("noise") || l.includes("error")) || "Telemetry Drift";
                    const fixPart = lines.find(l => l.includes("[CORRECTION]") || l.includes("[COMPLETED]") || l.includes("fixed") || l.includes("remedy")) || "Auto-Correction Applied";

                    logRepairToGoogleSheets(googleToken, devName, issuePart, fixPart, "REPAIRED")
                      .then(() => {
                        setMessages(prev => [...prev, {
                          id: `sheet-log-${Date.now()}`,
                          role: "assistant",
                          text: `📝 **Archived to Google Drive**: Successfully logged repair for **${devName}** to your \`Tact AI Repair Logs\` spreadsheet!`,
                          timestamp: new Date().toLocaleTimeString()
                        }]);
                      })
                      .catch(err => {
                        console.error("[Sheets Auto-Log] Failed:", err);
                      });
                  } else if (googleToken && isLocalOnly) {
                    setMessages(prev => [...prev, {
                      id: `sheet-log-shielded-${Date.now()}`,
                      role: "assistant",
                      text: `🔒 **Privacy Shield Active**: Outbound logging to Google Drive bypassed. Log preserved locally.`,
                      timestamp: new Date().toLocaleTimeString()
                    }]);
                  }
                }}
                setMessages={setMessages}
                googleUser={googleUser}
                googleToken={googleToken}
                onGoogleLogin={handleGoogleLogin}
                onGoogleLogout={handleGoogleLogout}
                isLocalOnly={isLocalOnly}
                onToggleLocalOnly={handleToggleLocalOnly}
              />
            ) : rightPanelTab === "workbench" ? (
              <RepairToolbox
                googleToken={googleToken} 
                onSendDiagnostics={handleReceiveDiagnostics}
                isRecording={isRecording}
                isNodeOnline={isNodeOnline}
                nodeVersion={nodeVersion}
                onNodeOnlineChange={(online) => {
                  setIsNodeOnline(online);
                  if (online) {
                    playPowerOnTone();
                    setMessages(prev => [...prev, {
                      id: `online-notif-${Date.now()}`,
                      role: "assistant",
                      text: `🟢 **Tact AI Diagnostic Node initialized successfully**: Core system version **${nodeVersion}** is now **ONLINE** and reading real-time telemetry pipelines.`,
                      timestamp: new Date().toLocaleTimeString()
                    }]);
                    speakResponse("Tact diagnostic node is online.");
                  } else {
                    setMessages(prev => [...prev, {
                      id: `offline-notif-${Date.now()}`,
                      role: "assistant",
                      text: `🔴 **Tact AI Diagnostic Node shut down**: Core system status set to **OFFLINE** (standby mode). Remote queries and repair tools are temporarily suspended.`,
                      timestamp: new Date().toLocaleTimeString()
                    }]);
                    speakResponse("Diagnostic node offline.");
                  }
                }}
                onNodeUpgrade={(newVer, logs) => {
                  setNodeVersion(newVer);
                  playUpgradeTone();
                  setMessages(prev => [...prev, {
                    id: `upgrade-notif-${Date.now()}`,
                    role: "assistant",
                    text: `⚙️ **Tact AI Diagnostic Node Upgraded**:\n\nSuccessfully compiled and flashed firmware to **${newVer}**!\n\n**Upgrade logs:**\n\`\`\`bash\n${logs}\n\`\`\`\n\nAll cognitive reasoning capacities have been elevated. Try speaking with me now!`,
                    timestamp: new Date().toLocaleTimeString()
                  }]);
                  speakResponse(`Node upgraded to version ${newVer}.`);
                }}
                onRepairCompleted={(devName, logs) => {
                  setMessages(prev => [...prev, {
                    id: `repair-notif-${Date.now()}`,
                    role: "assistant",
                    text: `🛠️ **Remote Repair Successful**:\n\nAutomated logical remedy applied to **${devName}** successfully!\n\n**Repair summary log:**\n\`\`\`bash\n${logs}\n\`\`\``,
                    timestamp: new Date().toLocaleTimeString()
                  }]);
                  speakResponse(`Automated repair patch applied to ${devName}.`);

                  // Auto-log to Google Sheets if authorized
                  if (googleToken && !isLocalOnly) {
                    const lines = logs.split("\n");
                    const issuePart = lines.find(l => l.includes("[INITIALIZATION]") || l.includes("degraded") || l.includes("noise") || l.includes("error")) || "Telemetry Drift";
                    const fixPart = lines.find(l => l.includes("[CORRECTION]") || l.includes("[COMPLETED]") || l.includes("fixed") || l.includes("remedy")) || "Auto-Correction Applied";

                    logRepairToGoogleSheets(googleToken, devName, issuePart, fixPart, "REPAIRED")
                      .then(() => {
                        setMessages(prev => [...prev, {
                          id: `sheet-log-${Date.now()}`,
                          role: "assistant",
                          text: `📝 **Archived to Google Drive**: Successfully logged repair for **${devName}** to your \`Tact AI Repair Logs\` spreadsheet!`,
                          timestamp: new Date().toLocaleTimeString()
                        }]);
                      })
                      .catch(err => {
                        console.error("[Sheets Auto-Log] Failed:", err);
                      });
                  } else if (googleToken && isLocalOnly) {
                    setMessages(prev => [...prev, {
                      id: `sheet-log-shielded-${Date.now()}`,
                      role: "assistant",
                      text: `🔒 **Privacy Shield Active**: Outbound logging to Google Drive bypassed. Log preserved locally.`,
                      timestamp: new Date().toLocaleTimeString()
                    }]);
                  }
                }}
              />
            ) : rightPanelTab === "scraper" ? (
              <WebScraper 
                onTransmitToAI={(scrapedContent) => {
                  handleSend(scrapedContent);
                }}
              />
            ) : rightPanelTab === "samsung" ? (
              <SamsungMembers 
                onTransmitToAI={(scrapedContent) => {
                  handleSend(scrapedContent);
                }}
              />
            ) : (
              <WifiAnalyzer 
                onTransmitToAI={(scrapedContent) => {
                  handleSend(scrapedContent);
                }}
              />
            )}
          </div>
        </div>

      </main>

      {/* 3. Global Control Bar */}
      <footer className="mt-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-400 gap-4 font-mono glass-footer z-10">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span>PORT: 3000</span>
          <span>|</span>
          <span>HOST: 0.0.0.0</span>
          <span>|</span>
          <span>SSL: LOCAL PROXY</span>
        </div>
        <SystemMonitor />
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Gemini Flash Connected
          </span>
          <span>•</span>
          <span className="text-zinc-500">Tact AI Assistant © 2026</span>
        </div>
      </footer>
    </div>
  );
}
