import React from "react";
import { DollarSign, Target, Briefcase, Zap } from "lucide-react";

export default function MonetizationPanel() {
  return (
    <div className="p-4 bg-zinc-950/40 border-b border-zinc-800/40">
      <h3 className="text-xs font-bold font-mono uppercase text-emerald-400 mb-3 flex items-center gap-2">
        <DollarSign className="w-3.5 h-3.5" />
        Commercialization Strategy
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-zinc-300 leading-relaxed">
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-zinc-100 flex items-center gap-1"><Target className="w-3 h-3 text-blue-400" /> Target Markets (Who)</h4>
            <ul className="list-disc pl-5 text-[10px] text-zinc-400 mt-1 space-y-1">
              <li><strong>Independent Repair Shops:</strong> Small to medium electronics repair businesses needing automated diagnostic tools.</li>
              <li><strong>Enterprise IT Helpdesks:</strong> Internal IT teams at large corporations for remote employee device troubleshooting.</li>
              <li><strong>Device Refurbishers:</strong> Companies buying/selling used electronics that need verifiable diagnostic audit reports.</li>
              <li><strong>SaaS for MSPs:</strong> Managed Service Providers managing fleets of devices.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-100 flex items-center gap-1"><Briefcase className="w-3 h-3 text-purple-400" /> Marketplaces (Where)</h4>
            <ul className="list-disc pl-5 text-[10px] text-zinc-400 mt-1 space-y-1">
              <li><strong>B2B Direct Sales:</strong> Direct outreach via LinkedIn to IT Directors and Repair Shop owners.</li>
              <li><strong>Tech Forums & Communities:</strong> Louis Rossmann Repair Forums, Hacker News (Show HN), Reddit (r/sysadmin, r/techsupport).</li>
              <li><strong>Product Hunt:</strong> Launch as a specialized B2B SaaS tool for technicians.</li>
              <li><strong>GitHub Marketplace:</strong> Offer the GitHub Review Agent as a CI/CD app.</li>
            </ul>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-zinc-100 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Pricing Models (How Much)</h4>
            <ul className="list-disc pl-5 text-[10px] text-zinc-400 mt-1 space-y-1">
              <li><strong>Tier 1: Solo Technician ($29-$49/mo)</strong><br/>Basic diagnostics, PDF reports, limited AI agent queries.</li>
              <li><strong>Tier 2: Repair Shop / SMB ($99-$199/mo)</strong><br/>Unlimited reports, Cloud Run optimization, full AI Hub access, Google Drive sync.</li>
              <li><strong>Tier 3: Enterprise / MSP ($499+/mo)</strong><br/>API access, custom branding on PDF logs, GitHub CI/CD integration, fleet telemetry.</li>
              <li><strong>One-off / Lifetime Deal ($299)</strong><br/>Great for initial launch on platforms like AppSumo to generate early capital and feedback.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
