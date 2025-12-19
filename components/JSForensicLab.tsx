
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

            <div className="flex-1 flex overflow-hidden">
                {/* Code Area */}
                <div className="flex-1 flex flex-col border-r border-slate-800">
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs text-indigo-300 selection:bg-indigo-500/30">
                        <pre className="whitespace-pre-wrap">{scripts[selectedIdx]}</pre>
                    </div>
                    <div className="p-3 bg-slate-900 flex justify-between items-center border-t border-slate-800">
                        <button
                            onClick={copyToClipboard}
                            className="text-[9px] font-bold uppercase text-slate-500 hover:text-white flex items-center gap-1.5 transition"
                        >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy Source'}
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Cpu size={12} />}
                            {analysis[selectedIdx] ? 'Re-Analyze' : 'AI Analysis'}
                        </button>
                    </div>
                </div>

                {/* Analysis Area */}
                <div className="w-80 bg-slate-900/50 overflow-auto p-6 flex flex-col">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
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
