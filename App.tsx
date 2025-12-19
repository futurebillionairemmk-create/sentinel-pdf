
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppConfig, RiskLevel, ScanReport, HistoryItem } from './types.ts';
import { calculateHash, calculateRiskScore, checkVirusTotal, runLocalHeuristics } from './services/scanner.ts';
import { SmoothScroll } from './components/SmoothScroll.tsx';
import { ScanDashboard } from './components/ScanDashboard.tsx';
import { SecurePDFViewer } from './components/SecurePDFViewer.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Shield, UploadCloud, Activity, Database, Info, ShieldCheck, Zap, Lock, FileSearch } from 'lucide-react';
import { PrivacyModal, TermsModal, FeaturesModal, ArchitectureModal } from './components/LegalModals.tsx';
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
  const [viewMode, setViewMode] = useState<'dashboard' | 'viewer'>('dashboard');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('sentinel_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    sessionStorage.setItem('sentinel_history', JSON.stringify(history));
  }, [history]);

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Only PDF files are supported.");
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
      }, ...prev].slice(0, 10));

    } catch (error) {
      console.error("Analysis Failed", error);
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

  if (viewMode === 'viewer') {
    return (
      <ErrorBoundary>
        <SecurePDFViewer file={currentFile} onClose={() => setViewMode('dashboard')} />
      </ErrorBoundary>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-text-primary selection:bg-accent-primary/30 relative overflow-hidden font-sans"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <SmoothScroll />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <FeaturesModal isOpen={showFeatures} onClose={() => setShowFeatures(false)} />
      <ArchitectureModal isOpen={showArchitecture} onClose={() => setShowArchitecture(false)} />

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-primary/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-secondary/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col items-center min-h-screen">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full flex justify-between items-center mb-24"
        >
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="relative">
              <div className="absolute inset-0 bg-accent-primary/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-white/10 group-hover:border-accent-primary/50 transition-colors">
                <Shield size={24} className="text-accent-primary" />
                <div className="absolute -bottom-1 -right-1 bg-accent-secondary p-0.5 rounded-full border-2 border-slate-950">
                  <ShieldCheck size={10} className="text-white" />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none">Sentinel <span className="text-accent-primary">PDF</span></span>
              <span className="text-[10px] font-mono text-accent-primary tracking-widest uppercase opacity-70">Defense Protocol</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <button onClick={() => setShowFeatures(true)} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => setShowArchitecture(true)} className="hover:text-white transition-colors">Architecture</button>
            <button onClick={() => alert("History module active in local session.")} className="hover:text-white transition-colors opacity-50 cursor-not-allowed" title="Local Session Only">History</button>
          </nav>
        </motion.header>

        {/* Hero Section */}
        <motion.div
          id="hero"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Secure PDF Analysis.
          </h1>
          <p className="text-xl text-text-secondary leading-relaxed mb-12">
            Sanitize, analyze, and neutralize potential threats in your documents with
            <span className="text-accent-primary"> military-grade isolation</span>.
            <br className="hidden md:block" />
            <span className="block mt-4 text-lg opacity-80">Upload your PDF and find out if it's safe or compromised.</span>
          </p>

          {/* Upload Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-5xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-surface border border-white/5 p-2 rounded-5xl backdrop-blur-xl">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "h-64 rounded-4xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                  isDragging ? "bg-accent-primary/10 border-accent-primary" : "hover:bg-white/5 hover:border-white/20"
                )}
              >
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} accept="application/pdf" className="hidden" />

                {isScanning ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    <p className="font-mono text-sm text-accent-primary animate-pulse">ANALYZING KERNEL...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-surfaceHighlight rounded-full mb-6 text-accent-secondary group-hover:scale-110 transition-transform duration-500">
                      <UploadCloud size={32} />
                    </div>
                    <p className="text-lg font-medium mb-2">Drop your PDF here</p>
                    <p className="text-sm text-text-secondary">or click to browse local files</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scan Report (Conditional Reveal) */}
        <AnimatePresence>
          {scanReport && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-4xl mb-32"
            >
              <ScanDashboard report={scanReport} onOpenSafe={() => setViewMode('viewer')} onForceOpen={() => setViewMode('viewer')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl scroll-mt-32">
          <FeatureCard
            icon={<ShieldCheck size={32} />}
            title="Ghost Protocol"
            desc="Our proprietary zero-trust rendering engine isolates every PDF in a secure, ephemeral iframe sandbox. This prevents malicious scripts from ever accessing your DOM or local credentials."
            delay={0.4}
          />
          <FeatureCard
            icon={<FileSearch size={32} />}
            title="Heuristic Analysis"
            desc="Goes beyond simple signature matching. We perform deep packet inspection to analyze obfuscated JavaScript, hidden extraction payloads, and anomalous structure patterns in real-time."
            delay={0.5}
          />
          <FeatureCard
            icon={<Zap size={32} />}
            title="AI Synthesis"
            desc="Powered by Google Gemini 1.5 Pro, our neural threat engine decodes complex attack vectors, explaining the 'why' behind every alert in plain, human-readable language."
            delay={0.6}
          />
        </div>

        <footer className="mt-32 py-12 w-full border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p>© 2025 Sentinel PDF. Generatively Engineered by Google Gemini.</p>
          </div>
          <div className="flex gap-8">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacy Protocol</button>
            <button onClick={() => setShowTerms(true)} className="hover:text-white transition-colors">Terms of Engagement</button>
            <a href="https://github.com/futurebillionairemmk-create/sentinel-pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
              GitHub <FileSearch size={14} />
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="p-8 rounded-4xl bg-surface border border-white/5 hover:border-white/10 transition-colors group"
  >
    <div className="w-16 h-16 rounded-3xl bg-surfaceHighlight flex items-center justify-center text-accent-primary mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-black/20">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <p className="text-text-secondary leading-relaxed text-sm">
      {desc}
    </p>
  </motion.div>
);

export default App;
