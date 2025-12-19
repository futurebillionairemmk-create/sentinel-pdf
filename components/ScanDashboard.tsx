
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanReport, RiskLevel } from '../types.ts';
import { ShieldAlert, ShieldCheck, ShieldQuestion, ExternalLink, FileText, Lock, Unlock, Loader2, Cpu, BrainCircuit, AlertCircle, Download, ChevronRight } from 'lucide-react';
import { generateThreatExplanation } from '../services/geminiService.ts';
import { JSForensicLab } from './JSForensicLab.tsx';
import clsx from 'clsx';

interface Props {
  report: ScanReport;
  onOpenSafe: () => void;
  onForceOpen: () => void;
}

export const ScanDashboard: React.FC<Props> = ({ report, onOpenSafe, onForceOpen }) => {
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [localReport, setLocalReport] = useState(report);

  const handleAiAnalysis = async () => {
    if (localReport.aiAnalysis) return;
    setAnalyzingAi(true);
    const analysis = await generateThreatExplanation(localReport);
    setLocalReport(prev => ({ ...prev, aiAnalysis: analysis }));
    setAnalyzingAi(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(localReport, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel-report-${localReport.hash.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isSafe = localReport.riskLevel === RiskLevel.SAFE;
  const isMalicious = localReport.riskLevel === RiskLevel.MALICIOUS;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface/80 backdrop-blur-2xl rounded-4xl border border-white/5 overflow-hidden shadow-2xl pb-12"
    >
      {/* Header Banner */}
      <div className={clsx(
        "relative p-10 overflow-hidden",
        isSafe ? "bg-emerald-500/5" : isMalicious ? "bg-red-500/5" : "bg-amber-500/5"
      )}>
        {/* Glow Effects */}
        <div className={clsx("absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2",
          isSafe ? "bg-emerald-500" : isMalicious ? "bg-red-500" : "bg-amber-500"
        )} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={clsx(
              "p-4 rounded-3xl backdrop-blur-md border shadow-lg",
              isSafe ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                isMalicious ? "bg-red-500/10 border-red-500/20 text-red-500" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-500"
            )}>
              {isSafe ? <ShieldCheck size={40} /> : isMalicious ? <ShieldAlert size={40} /> : <ShieldQuestion size={40} />}
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">{localReport.riskLevel}</h2>
              <div className="flex items-center gap-3 text-sm font-medium text-text-secondary">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">Score: {Math.round(localReport.score)}</span>
                <span>•</span>
                <span>{localReport.fileName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <Download size={14} /> JSON Export
            </button>
            <div className="px-4 py-2 rounded-xl bg-surface border border-white/5 text-[10px] font-mono text-text-secondary select-all">
              HASH: {localReport.hash.slice(0, 12)}...
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-10 flex flex-col gap-8">

        {/* Top Grid: Analysis & Governance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          {/* Left Column: Intelligence Core */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* AI Threat Engine */}
            <div className="p-8 rounded-3xl bg-surfaceHighlight/30 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-50" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-accent-primary">
                  <BrainCircuit size={18} /> Gemini Threat Engine
                </h3>
                {!localReport.aiAnalysis && (
                  <button
                    onClick={handleAiAnalysis}
                    disabled={analyzingAi}
                    className="px-4 py-2 rounded-lg bg-accent-primary text-white text-xs font-bold hover:bg-accent-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {analyzingAi ? <Loader2 className="animate-spin" size={14} /> : <Cpu size={14} />}
                    Ignite Synthesis
                  </button>
                )}
              </div>

              <div className="min-h-[100px] text-sm leading-relaxed text-text-secondary/80 font-mono">
                {analyzingAi ? (
                  <div className="flex items-center gap-3 text-accent-primary animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-accent-primary" />
                    Connecting to neural interface...
                  </div>
                ) : localReport.aiAnalysis ? (
                  <div className="whitespace-pre-line pl-4 border-l-2 border-accent-primary/20">{localReport.aiAnalysis}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                    <BrainCircuit size={32} className="mb-2" />
                    <p>No AI synthesis active. Request logic core activation.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Heuristics & Reputation Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              <div className="p-6 rounded-3xl bg-surfaceHighlight/20 border border-white/5 h-full">
                <h4 className="text-xs font-bold uppercase text-text-secondary mb-6 flex items-center gap-2">
                  <FileText size={14} /> Static Heuristics
                </h4>

                {localReport.heuristics.length === 0 ? (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium flex items-center gap-2">
                    <ShieldCheck size={14} /> Zero Anomalies Detected
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localReport.heuristics.map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-white uppercase">{h.type}</span>
                          <span className={clsx(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            h.severity === 'critical' ? "bg-red-500 text-white" : "bg-white/10 text-text-secondary"
                          )}>{h.severity}</span>
                        </div>
                        <p className="text-[10px] text-text-secondary leading-normal">{h.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 rounded-3xl bg-surfaceHighlight/20 border border-white/5 flex flex-col h-full">
                <h4 className="text-xs font-bold uppercase text-text-secondary mb-6 flex items-center gap-2">
                  <ExternalLink size={14} /> Global Reputation
                </h4>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 mb-2">
                    {localReport.virusTotal.positives} <span className="text-lg text-text-secondary font-medium">/ {localReport.virusTotal.total || 0}</span>
                  </div>
                  <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mb-6">Vendor Flags</p>

                  {localReport.virusTotal.permalink ? (
                    <a
                      href={localReport.virusTotal.permalink}
                      target="_blank"
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      View on VirusTotal <ChevronRight size={12} />
                    </a>
                  ) : (
                    <span className="text-[10px] opacity-50">Local Analysis Only</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Governance (Matches Height) */}
          <div className="space-y-6 h-full">
            <div className="p-8 rounded-4xl bg-surface border border-white/5 h-full flex flex-col shadow-xl">
              <div className="flex-1">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">Governance Protocol</h3>

                <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-8">
                  <div className={clsx("absolute inset-0 rounded-full blur-[40px] opacity-20",
                    localReport.isLocked ? "bg-red-500" : "bg-emerald-500"
                  )} />
                  <div className={clsx("relative z-10 p-8 rounded-full border-4 text-white",
                    localReport.isLocked ? "border-red-500 bg-red-500/10" : "border-emerald-500 bg-emerald-500/10"
                  )}>
                    {localReport.isLocked ? <Lock size={40} /> : <Unlock size={40} />}
                  </div>
                </div>

                <p className="text-sm text-center text-text-secondary leading-relaxed mb-8">
                  {localReport.isLocked
                    ? "File has triggered the auto-quarantine threshold. Direct rendering is strictly prohibited due to high risk factors."
                    : "File is within acceptable risk parameters. Sentinel Sandbox is ready for isolated rendering."}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <button
                  onClick={onOpenSafe}
                  disabled={localReport.isLocked}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 group"
                >
                  <ShieldCheck className="group-hover:scale-110 transition-transform" size={18} />
                  ENTER SANDBOX
                </button>

                {localReport.isLocked && (
                  <button
                    onClick={onForceOpen}
                    className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors"
                  >
                    OVERRIDE & FORCE OPEN
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Full Width Forensic Lab */}
        {localReport.heuristics.some(h => h.extractedScripts && h.extractedScripts.length > 0) && (
          <div className="w-full">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> Javascript Deep Inspection Layer
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>
            <JSForensicLab scripts={localReport.heuristics.flatMap(h => h.extractedScripts || [])} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
