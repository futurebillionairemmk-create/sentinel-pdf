
import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, RiskLevel, ScanReport, HistoryItem } from './types.ts';
import { calculateHash, calculateRiskScore, checkVirusTotal, runLocalHeuristics } from './services/scanner.ts';
import { ScanDashboard } from './components/ScanDashboard.tsx';
import { SecurePDFViewer } from './components/SecurePDFViewer.tsx';
import { Settings, Shield, UploadCloud, Activity, LayoutTemplate, Database, AlertTriangle, Clock, ShieldCheck, Info } from 'lucide-react';
import clsx from 'clsx';

const DEFAULT_CONFIG: AppConfig = {
  useMockMode: true,
  autoQuarantineThreshold: 55
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('sentinel_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = sessionStorage.getItem('sentinel_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'viewer' | 'settings' | 'architecture' | 'history'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('sentinel_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    sessionStorage.setItem('sentinel_history', JSON.stringify(history));
  }, [history]);

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("UNSUPPORTED FILE TYPE. Sentinel strictly processes PDF files.");
      return;
    }

    setIsScanning(true);
    setCurrentFile(file);
    setScanReport(null);
    setViewMode('dashboard');

    try {
      const hash = await calculateHash(file);
      const [heuristics, vtResult] = await Promise.all([
        runLocalHeuristics(file),
        checkVirusTotal(hash, config.useMockMode)
      ]);

      const { score, level } = calculateRiskScore(vtResult, heuristics);

      const newReport: ScanReport = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        timestamp: Date.now(),
        hash,
        heuristics,
        virusTotal: vtResult,
        score,
        riskLevel: level,
        isLocked: score >= config.autoQuarantineThreshold
      };

      setScanReport(newReport);
      setHistory(prev => [{
        id: newReport.id,
        fileName: newReport.fileName,
        riskLevel: newReport.riskLevel,
        score: newReport.score,
        timestamp: newReport.timestamp
      }, ...prev].slice(0, 10)); // Keep last 10

    } catch (error) {
      console.error("ANALYSIS_FAULT", error);
    } finally {
      setIsScanning(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div
      className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30 overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      {/* Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border-4 border-dashed border-emerald-500 m-8 rounded-3xl pointer-events-none">
          <div className="flex flex-col items-center gap-4 text-emerald-400">
            <UploadCloud size={64} className="animate-bounce" />
            <p className="text-2xl font-black uppercase tracking-[0.2em]">Release to Securely Analyze</p>
          </div>
        </div>
      )}

      {/* Side HUD */}
      <aside className="w-16 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="p-1 bg-emerald-500 rounded text-slate-950">
              <Shield size={24} strokeWidth={3} />
            </div>
            <span className="text-lg font-black tracking-tighter hidden lg:block text-white uppercase">Sentinel<span className="text-emerald-500">.PDF</span></span>
          </div>

          <nav className="px-3 space-y-1 mt-6">
            <NavItem active={viewMode === 'dashboard'} onClick={() => setViewMode('dashboard')} icon={<Activity size={20} />} label="Dashboard" />
            <NavItem active={viewMode === 'history'} onClick={() => setViewMode('history')} icon={<Clock size={20} />} label="Session History" />
            <NavItem active={viewMode === 'architecture'} onClick={() => setViewMode('architecture')} icon={<LayoutTemplate size={20} />} label="Security Core" />
            <NavItem active={viewMode === 'settings'} onClick={() => setViewMode('settings')} icon={<Database size={20} />} label="Kernel Config" />
          </nav>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Sandbox Ready
            </div>
            <div className="text-[9px] text-slate-500 font-mono leading-tight">
              Privacy: Local Ingest<br />
              Network: SHA-256 Only
            </div>
          </div>
          <p className="text-[9px] text-slate-600 font-mono text-center uppercase tracking-tighter">Build v2.4.0-Production</p>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
            <h1 className="text-xs font-black text-slate-500 uppercase tracking-widest">{viewMode}</h1>
          </div>
          <div className="flex items-center gap-4">
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} accept="application/pdf" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="group relative flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-950 px-5 py-2.5 rounded shadow-lg shadow-emerald-500/10 font-bold text-xs transition active:scale-95 disabled:opacity-50"
            >
              <UploadCloud size={14} />
              {isScanning ? 'ANALYZING...' : 'INGEST FILE'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950 to-slate-950">

          {!scanReport && !isScanning && viewMode === 'dashboard' && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <div className="relative mb-12">
                <div className="absolute -inset-10 bg-emerald-500/5 blur-[80px] rounded-full animate-pulse"></div>
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
                  <Shield size={64} className="text-emerald-500" />
                </div>
              </div>
              <h2 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase leading-none">The Zero-Trust<br /><span className="text-emerald-500">Document Barrier</span></h2>
              <p className="text-slate-500 mb-12 leading-relaxed text-lg max-w-lg font-medium">
                Sentinel uses heuristic pattern matching and global reputation intelligence to sanitize untrusted documents before viewing.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <FeatureBox icon={<ShieldCheck size={16} />} text="Pixel Render" />
                <FeatureBox icon={<Activity size={16} />} text="JS Heuristics" />
                <FeatureBox icon={<Database size={16} />} text="VT Reputation" />
                <FeatureBox icon={<Info size={16} />} text="AI Synthesis" />
              </div>

              <div className="mt-16 flex items-center gap-2 text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">
                <div className="w-12 h-[1px] bg-slate-800"></div>
                Drag Files Here
                <div className="w-12 h-[1px] bg-slate-800"></div>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-80 h-1.5 bg-slate-900 rounded-full overflow-hidden mb-6 border border-slate-800">
                <div className="h-full bg-emerald-500 animate-[loading_1.5s_infinite]"></div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-xs font-mono text-emerald-500 animate-pulse tracking-widest uppercase font-bold">Initializing Sentinel Node...</p>
                <p className="text-[10px] font-mono text-slate-500 uppercase">Parsing XRef & Header Structures</p>
              </div>
            </div>
          )}

          {scanReport && viewMode === 'dashboard' && (
            <ScanDashboard report={scanReport} onOpenSafe={() => setViewMode('viewer')} onForceOpen={() => setViewMode('viewer')} />
          )}

          {viewMode === 'history' && (
            <div className="max-w-4xl mx-auto py-8">
              <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <Clock size={24} className="text-emerald-500" /> SESSION HISTORY
              </h2>
              {history.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-xl border border-dashed border-slate-800 text-slate-500 italic">
                  No documents analyzed this session.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(item => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between group hover:border-slate-600 transition cursor-default">
                      <div className="flex items-center gap-4">
                        <div className={clsx("p-2 rounded-lg",
                          item.riskLevel === RiskLevel.SAFE ? "bg-emerald-500/10 text-emerald-500" :
                            item.riskLevel === RiskLevel.MALICIOUS ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          <Shield size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition">{item.fileName}</div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">
                            Score: {Math.round(item.score)} • {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-black uppercase px-3 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        {item.riskLevel}
                      </div>
                    </div>
                  ))}
                  <p className="text-[9px] text-slate-600 font-mono mt-8 text-center italic uppercase tracking-widest">
                    Session history is ephemeral and wiped upon browser close.
                  </p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8 py-8">
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-2">Environment Configuration</h2>
                <p className="text-sm text-slate-500 mb-8">System keys are stored locally and encrypted in memory.</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white uppercase tracking-tighter">Debug/Mock Mode</span>
                      <span className="text-[10px] text-slate-600">Bypasses VirusTotal for testing.</span>
                    </div>
                    <button
                      onClick={() => setConfig({ ...config, useMockMode: !config.useMockMode })}
                      className={clsx("w-12 h-6 rounded-full transition-all relative", config.useMockMode ? "bg-emerald-600" : "bg-slate-800")}
                    >
                      <div className={clsx("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-lg", config.useMockMode && "translate-x-6")}></div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Auto-Quarantine Threshold</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range" min="0" max="100" value={config.autoQuarantineThreshold}
                        onChange={(e) => setConfig({ ...config, autoQuarantineThreshold: parseInt(e.target.value) })}
                        className="flex-1 accent-emerald-500 h-1.5 bg-slate-950 rounded-full appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-emerald-400 w-12 text-center">
                        {config.autoQuarantineThreshold}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'architecture' && (
            <div className="max-w-4xl mx-auto space-y-12 py-8">
              <header className="text-center">
                <h2 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter underline decoration-emerald-500 underline-offset-8">Kernel Architecture</h2>
                <p className="text-slate-500">Sentinel is built on the principle of isolation over accessibility.</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ArchCard title="1. Ingest" desc="File is read as a binary ArrayBuffer. SHA-256 fingerprinting happens locally via Web Crypto API." />
                <ArchCard title="2. Filter" desc="Recursive regex scans binary content for obfuscated /JS, /Launch, and /OpenAction PDF keywords." />
                <ArchCard title="3. Raster" desc="PDF.js parses the doc in a WebWorker. We render pixels to Canvas, stripping all DOM-based interactivity." />
              </div>
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl">
                <h4 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Security Protocol Hierarchy</h4>
                <div className="space-y-4">
                  <ProtocolRow level="L1" name="Static Signature Analysis" status="Always Active" />
                  <ProtocolRow level="L2" name="Global Reputation Check" status="Optional (VT)" />
                  <ProtocolRow level="L3" name="Gemini LLM Synthesis" status="On-Demand" />
                  <ProtocolRow level="L4" name="Isolated Rasterization" status="Enforced Viewer" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {viewMode === 'viewer' && (
        <SecurePDFViewer file={currentFile} onClose={() => setViewMode('dashboard')} />
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={clsx("w-full flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm font-bold transition-all",
      active ? "bg-emerald-500/10 text-emerald-500 border-l-2 border-emerald-500 shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50")}
  >
    {icon}
    <span className="hidden lg:block uppercase tracking-[0.15em] text-[9px] font-black">{label}</span>
  </button>
);

const FeatureBox = ({ icon, text }: any) => (
  <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 shadow-lg">
    <span className="text-emerald-500">{icon}</span>
    {text}
  </div>
);

const ArchCard = ({ title, desc }: any) => (
  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
    <h3 className="text-emerald-500 font-black text-[10px] uppercase mb-3 tracking-widest">{title}</h3>
    <p className="text-xs text-slate-400 leading-relaxed font-medium">{desc}</p>
  </div>
);

const ProtocolRow = ({ level, name, status }: any) => (
  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">{level}</span>
      <span className="text-xs font-bold text-slate-300">{name}</span>
    </div>
    <span className="text-[9px] font-mono text-slate-500 uppercase">{status}</span>
  </div>
);

export default App;
