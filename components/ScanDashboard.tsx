
import React, { useState } from 'react';
import { ScanReport, RiskLevel } from '../types.ts';
import { ShieldAlert, ShieldCheck, ShieldQuestion, ExternalLink, FileText, Lock, Unlock, Loader2, Cpu, BrainCircuit, AlertCircle, Download } from 'lucide-react';
import { generateThreatExplanation } from '../services/geminiService.ts';

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

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case RiskLevel.MALICIOUS: return 'text-red-400 border-red-500/30 bg-red-500/5';
      default: return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl">
      {/* Header */}
      <div className={`p-8 border-b ${getRiskColor(localReport.riskLevel)} flex items-center justify-between transition-colors duration-500`}>
        <div className="flex items-center gap-6">
           <div className="p-4 rounded-2xl bg-slate-950/30 backdrop-blur-sm border border-white/10 shadow-inner">
             {localReport.riskLevel === RiskLevel.SAFE ? <ShieldCheck size={48} /> : localReport.riskLevel === RiskLevel.MALICIOUS ? <ShieldAlert size={48} /> : <ShieldQuestion size={48} />}
           </div>
           <div>
             <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{localReport.riskLevel}</h2>
             <p className="text-sm opacity-80 font-mono mt-2 flex items-center gap-2">
               Score: {Math.round(localReport.score)}/100 • {formatFileSize(localReport.fileSize)} • {localReport.fileName}
             </p>
           </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-3">
           <div className="text-right">
             <div className="text-[10px] font-black opacity-50 mb-1 tracking-widest uppercase">Target Hash (SHA-256)</div>
             <div className="font-mono text-[10px] bg-slate-950/50 px-3 py-1 rounded border border-white/5 select-all">
               {localReport.hash}
             </div>
           </div>
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition text-slate-300"
           >
             <Download size={12} /> Export Report
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 custom-scroll">
        
        <div className="lg:col-span-2 space-y-6">
          {localReport.fileSize > 50 * 1024 * 1024 && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3 text-amber-500">
               <AlertCircle size={20} />
               <p className="text-xs font-bold uppercase tracking-wide leading-tight">Heavy Payload Detected: Static analysis scanning deep layers. Viewing performance may be degraded.</p>
            </div>
          )}

          {/* AI Analysis Section */}
          <div className="bg-slate-950/40 rounded-xl p-6 border border-slate-800 shadow-inner">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-indigo-400">
                 <BrainCircuit size={16} /> Gemini Threat Synthesis
               </h3>
               {!localReport.aiAnalysis && (
                  <button 
                    onClick={handleAiAnalysis}
                    disabled={analyzingAi}
                    className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                  >
                    {analyzingAi ? <Loader2 className="animate-spin" size={12}/> : <Cpu size={12} />}
                    Request AI Scan
                  </button>
               )}
             </div>
             <div className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-4 rounded-lg border border-slate-800 min-h-[80px]">
               {analyzingAi ? (
                 <span className="flex items-center gap-2 text-indigo-400 animate-pulse uppercase text-[10px]">
                   &gt; Syncing with Sentinel Intelligence Node...
                 </span>
               ) : localReport.aiAnalysis ? (
                 <div className="whitespace-pre-line leading-relaxed italic border-l-2 border-indigo-500/50 pl-4">{localReport.aiAnalysis}</div>
               ) : (
                 <span className="opacity-30 italic text-[10px]">&gt; No automated synthesis requested. Data remains raw.</span>
               )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/40 rounded-xl p-6 border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-400">
                <FileText size={16} /> Heuristic Anomalies
              </h3>
              {localReport.heuristics.length === 0 ? (
                <div className="text-emerald-500 text-[10px] font-mono p-4 bg-emerald-500/5 rounded border border-emerald-500/20">
                  [+] 0 Anomalies found. Structure conforms to standard PDF specifications.
                </div>
              ) : (
                <div className="space-y-3">
                  {localReport.heuristics.map((h, idx) => (
                    <div key={idx} className="flex flex-col bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase text-slate-200">{h.type}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${h.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>{h.severity}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono italic leading-tight">{h.description}</div>
                      <div className="mt-2 text-[9px] font-black text-emerald-500/50 uppercase">Instances: {h.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-950/40 rounded-xl p-6 border border-slate-800 flex flex-col">
               <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-400">
                 <ExternalLink size={16} /> Reputation Cloud
               </h3>
               <div className="flex-1 flex flex-col justify-center">
                 <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className={`text-4xl font-black ${localReport.virusTotal.positives > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {localReport.virusTotal.positives}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-black">Malicious Flag</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-slate-700">/{localReport.virusTotal.total || '0'}</div>
                      <div className="text-[9px] text-slate-500 uppercase font-black">Scanning Vendors</div>
                    </div>
                 </div>
                 {localReport.virusTotal.permalink ? (
                   <a href={localReport.virusTotal.permalink} target="_blank" className="text-[9px] text-center p-2 bg-slate-900 border border-slate-800 text-emerald-500 hover:text-emerald-400 font-black uppercase transition-colors rounded">
                     View Complete VT Forensic Profile
                   </a>
                 ) : (
                   <div className="text-[9px] text-slate-600 italic font-mono p-2 bg-slate-950 rounded border border-slate-800 text-center uppercase tracking-tighter">
                     No global reputation data available.
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Col: Actions */}
        <div className="flex flex-col gap-4">
           <div className="bg-slate-950/40 rounded-xl p-6 border border-slate-800 h-full flex flex-col justify-between shadow-2xl">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest mb-3 text-slate-400">Governance Decision</h3>
                <p className="text-[10px] text-slate-500 mb-8 leading-relaxed font-medium">
                  {localReport.isLocked 
                    ? "CORE BLOCK: Automated quarantine enforced. High probability of file-based code execution. External viewing prohibited."
                    : "CORE PERMIT: Document within risk profile. Direct DOM rendering remains restricted, raster isolation recommended."}
                </p>
                
                <div className={`flex items-center justify-center p-10 rounded-full bg-slate-900 border-4 border-double w-32 h-32 mx-auto mb-10 transition-all duration-700
                  ${localReport.isLocked ? 'border-red-900/50 text-red-600 shadow-[0_0_40px_rgba(220,38,38,0.2)]' : 'border-emerald-900/50 text-emerald-600'}`}>
                   {localReport.isLocked ? <Lock size={48} /> : <Unlock size={48} />}
                </div>
              </div>

              <div className="space-y-3">
                 <button
                   onClick={onOpenSafe}
                   disabled={localReport.isLocked}
                   className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 rounded-lg font-black text-xs transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/10"
                 >
                   <ShieldCheck size={16} /> Enter Sandbox
                 </button>
                 
                 {localReport.isLocked && (
                   <button
                     onClick={onForceOpen}
                     className="w-full py-4 bg-transparent border border-red-900/50 text-red-500 hover:bg-red-900/10 rounded-lg font-black text-[10px] transition uppercase tracking-widest flex items-center justify-center gap-2"
                   >
                     <ShieldAlert size={14} /> Force Unsafe Override
                   </button>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
