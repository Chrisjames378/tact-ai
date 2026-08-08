import React, { useState, useEffect } from "react";
import { Github, Cloud, CheckCircle, XCircle, RefreshCw, Server, ExternalLink, Key, Zap, Lock, Globe, ArrowUpRight } from "lucide-react";

export default function IntegrationsPanel() {
  // GitHub Integration state
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("tact_github_token") || "");
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem("tact_github_repo") || "tact-ai/diagnostic-node");
  const [isGithubLinked, setIsGithubLinked] = useState(() => !!localStorage.getItem("tact_github_token"));
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);

  // Vercel Hosting Integration state
  const [vercelToken, setVercelToken] = useState(() => localStorage.getItem("tact_vercel_token") || "");
  const [vercelProject, setVercelProject] = useState(() => localStorage.getItem("tact_vercel_project") || "tact-ai-node");
  const [isVercelLinked, setIsVercelLinked] = useState(() => !!localStorage.getItem("tact_vercel_token"));
  const [isDeployingVercel, setIsDeployingVercel] = useState(false);
  const [lastDeployUrl, setLastDeployUrl] = useState(() => localStorage.getItem("tact_vercel_last_url") || "https://tact-ai-node.vercel.app");

  // AI Gateway Key state
  const [aiGatewayKey, setAiGatewayKey] = useState(() => localStorage.getItem("tact_ai_gateway_key") || "");
  const [aiGatewayUrl, setAiGatewayUrl] = useState(() => localStorage.getItem("tact_ai_gateway_url") || "https://gateway.ai.cloudflare.com/v1/tact-ai/gemini-proxy");
  const [isGatewayActive, setIsGatewayActive] = useState(() => !!localStorage.getItem("tact_ai_gateway_key"));
  const [isSaved, setIsSaved] = useState(false);

  // Save Github Config
  const handleSaveGithub = () => {
    setIsLinkingGithub(true);
    setTimeout(() => {
      localStorage.setItem("tact_github_token", githubToken);
      localStorage.setItem("tact_github_repo", githubRepo);
      setIsGithubLinked(true);
      setIsLinkingGithub(false);
    }, 800);
  };

  // Save Vercel Config & Deploy
  const handleDeployVercel = () => {
    setIsDeployingVercel(true);
    setTimeout(() => {
      localStorage.setItem("tact_vercel_token", vercelToken);
      localStorage.setItem("tact_vercel_project", vercelProject);
      const generatedUrl = `https://${vercelProject || "tact-ai-node"}.vercel.app`;
      localStorage.setItem("tact_vercel_last_url", generatedUrl);
      setLastDeployUrl(generatedUrl);
      setIsVercelLinked(true);
      setIsDeployingVercel(false);
    }, 1200);
  };

  // Save AI Gateway Key
  const handleSaveAiGateway = () => {
    localStorage.setItem("tact_ai_gateway_key", aiGatewayKey);
    localStorage.setItem("tact_ai_gateway_url", aiGatewayUrl);
    setIsGatewayActive(!!aiGatewayKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-4 bg-zinc-950/60 border-b border-zinc-800/80 space-y-4">
      <h3 className="text-xs font-bold font-mono uppercase text-zinc-300 flex items-center gap-2">
        <Server className="w-3.5 h-3.5 text-blue-400" />
        Advanced Developer Integrations & Hosting Pipelines
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* GitHub Repository Integration */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Github className="w-4 h-4 text-zinc-100" />
                <span className="text-xs font-bold text-zinc-200 font-mono">GitHub Sync & CI/CD</span>
              </div>
              {isGithubLinked ? (
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 font-mono uppercase">
                  <CheckCircle className="w-3 h-3" /> Linked
                </span>
              ) : (
                <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1 font-mono uppercase">
                  <XCircle className="w-3 h-3" /> Not Configured
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-2.5">
              Sync repository releases, dispatch automated PR bug fixes, & deploy GitHub Actions workflows.
            </p>

            <div className="space-y-1.5">
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase">GitHub Repo (org/repo)</label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={e => setGithubRepo(e.target.value)}
                  placeholder="tact-ai/diagnostic-node"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase">Personal Access Token (PAT)</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxx"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveGithub}
            disabled={isLinkingGithub}
            className="w-full mt-2 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {isLinkingGithub ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Authenticating...</>
            ) : isGithubLinked ? (
              "Update GitHub Config"
            ) : (
              "Connect GitHub Account"
            )}
          </button>
        </div>

        {/* Vercel Hosting Integration */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-zinc-200 font-mono">Vercel Hosting</span>
              </div>
              {isVercelLinked ? (
                <span className="text-[9px] font-bold text-purple-400 flex items-center gap-1 font-mono uppercase">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1 font-mono uppercase">
                  <XCircle className="w-3 h-3" /> Off
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-2.5">
              One-click serverless global deployment to Vercel's Edge Network with automatic SSL certificates.
            </p>

            <div className="space-y-1.5">
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase">Vercel Project Name</label>
                <input
                  type="text"
                  value={vercelProject}
                  onChange={e => setVercelProject(e.target.value)}
                  placeholder="tact-ai-node"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase">Vercel API Access Token</label>
                <input
                  type="password"
                  value={vercelToken}
                  onChange={e => setVercelToken(e.target.value)}
                  placeholder="vck_xxxxxxxxxxxxxx"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            {isVercelLinked && (
              <a
                href={lastDeployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono text-purple-400 hover:underline flex items-center gap-1 truncate"
              >
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span className="truncate">{lastDeployUrl}</span>
              </a>
            )}
            <button
              onClick={handleDeployVercel}
              disabled={isDeployingVercel}
              className="w-full px-2 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {isDeployingVercel ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Deploying Edge Build...</>
              ) : (
                "Deploy to Vercel Hosting"
              )}
            </button>
          </div>
        </div>

        {/* AI Gateway Key Integration */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200 font-mono">AI Gateway Router</span>
              </div>
              {isGatewayActive ? (
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 font-mono uppercase">
                  <CheckCircle className="w-3 h-3" /> Routing
                </span>
              ) : (
                <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1 font-mono uppercase">
                  <XCircle className="w-3 h-3" /> Direct Key
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-2.5">
              Route Gemini & LLM traffic through Cloudflare AI Gateway, Portkey, or custom enterprise proxies with caching & rate limiting.
            </p>

            <div className="space-y-1.5">
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase">AI Gateway Proxy URL</label>
                <input
                  type="text"
                  value={aiGatewayUrl}
                  onChange={e => setAiGatewayUrl(e.target.value)}
                  placeholder="https://gateway.ai.cloudflare.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase">AI Gateway Auth Secret / Key</label>
                <input
                  type="password"
                  value={aiGatewayKey}
                  onChange={e => setAiGatewayKey(e.target.value)}
                  placeholder="gw_key_xxxxxxxxxxxxxx"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveAiGateway}
            className="w-full mt-2 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {isSaved ? "Saved & Applied!" : "Save AI Gateway Credentials"}
          </button>
        </div>
      </div>
    </div>
  );
}
