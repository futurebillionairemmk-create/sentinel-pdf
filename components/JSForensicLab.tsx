
import React, { useState } from 'react';
import { Terminal, Cpu, Loader2, AlertTriangle, ShieldCheck, Copy, Check } from 'lucide-react';
import { analyzeScriptSource } from '../services/geminiService';

interface Props {
    scripts: string[];
}

export const JSForensicLab: React.FC<Props> = ({ scripts }) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [analysis, setAnalysis] = useState<Record<number, string>>({});
    const [analyzing, setAnalyzing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async () => {
        if (analysis[selectedIdx]) return;
        setAnalyzing(true);
        const result = await analyzeScriptSource(scripts[selectedIdx]);
        setAnalysis(prev => ({ ...prev, [selectedIdx]: result }));
        setAnalyzing(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(scripts[selectedIdx]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                    <Terminal size={14} /> JS Forensic Lab
                </div>
                <div className="flex gap-1">
                    {scripts.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedIdx(idx)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition ${selectedIdx === idx ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Code Area */}
                <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 min-w-0 relative h-[300px] md:h-auto">
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs text-indigo-300 selection:bg-indigo-500/30">
                        <pre className="whitespace-pre-wrap break-all">{scripts[selectedIdx]}</pre>
                    </div>
                    <div className="p-4 bg-slate-900/90 backdrop-blur flex justify-between items-center border-t border-slate-800 shrink-0">
                        <button
                            onClick={copyToClipboard}
                            className="text-[10px] font-bold uppercase text-slate-500 hover:text-white flex items-center gap-2 transition whitespace-nowrap"
                        >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 whitespace-nowrap ml-4"
                        >
                            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
                            {analysis[selectedIdx] ? 'Re-Analyze' : 'AI Analysis'}
                        </button>
                    </div>
                </div>

                {/* Analysis Area */}
                <div className="w-full md:w-80 bg-slate-900/50 overflow-auto p-6 flex flex-col h-[200px] md:h-auto border-t md:border-t-0 border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2 shrink-0">
                        <AlertTriangle size={12} className="text-amber-500" /> Sentinel Insight
                    </h4>

                    {analysis[selectedIdx] ? (
                        <div className="text-[11px] leading-relaxed text-slate-300 font-medium italic space-y-4">
                            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 border-l-2 border-l-indigo-500 whitespace-pre-line">
                                {analysis[selectedIdx]}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-emerald-500 font-black uppercase tracking-widest">
                                <ShieldCheck size={12} /> Analysis Complete
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 grayscale">
                            <Cpu size={48} className="mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No Active Sync<br />Request Analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
