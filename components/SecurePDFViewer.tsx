
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ShieldCheck, Download, Loader2, X, FileText } from 'lucide-react';
import { sanitizeAndFlatten } from '../services/sanitizer.ts';
import { motion } from 'framer-motion';
import clsx from 'clsx';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Props {
  file: File | null;
  onClose: () => void;
}

export const SecurePDFViewer: React.FC<Props> = ({ file, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [sanitizing, setSanitizing] = useState(false);
  const [sanProgress, setSanProgress] = useState(0);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    if (!file) return;
    const loadPdf = async () => {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        setFileBuffer(arrayBuffer);
        // Create a copy for the local viewer so the original isn't detached/neutered
        const doc = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          disableFontFace: true,
          isEvalSupported: false,
          stopAtErrors: true,
        }).promise;
        setPdfDoc(doc);
      } catch (err: any) {
        console.error("SENTINEL_VIEWER_LOAD_ERR:", err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [file]);

  useEffect(() => {
    if (fileBuffer && iframeRef.current) {
      // Small delay to ensure iframe is ready
      setTimeout(renderPage, 100);
    }
  }, [fileBuffer, pageNum, scale]);

  const renderPage = () => {
    if (!fileBuffer || !iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'RENDER',
      data: fileBuffer,
      pageNum,
      scale
    }, '*');
  };

  const handleSanitize = async () => {
    if (!file) return;
    setSanitizing(true);
    setSanProgress(0);
    try {
      const blob = await sanitizeAndFlatten(file, (p) => setSanProgress(p));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanitized_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Sanitization failed", err);
      alert(`Sanitization Error: ${err.message || 'Unknown error'}`);
    } finally {
      setSanitizing(false);
      setSanProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* Top Bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-surface/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-primary/20 rounded-lg text-accent-primary">
              <FileText size={16} />
            </div>
            <span className="font-medium text-sm text-white truncate max-w-[200px]">{file?.name}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <ShieldCheck size={12} className="text-green-500" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Sandbox Active</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center bg-surface border border-white/10 rounded-full p-1">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 hover:bg-white/10 rounded-full text-text-secondary"><ZoomOut size={16} /></button>
            <span className="w-12 text-center text-xs font-mono font-medium">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 hover:bg-white/10 rounded-full text-text-secondary"><ZoomIn size={16} /></button>
          </div>

          <button
            onClick={handleSanitize}
            disabled={sanitizing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold text-xs rounded-full hover:bg-white/90 disabled:opacity-50 transition-all"
          >
            {sanitizing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {sanitizing ? `FLATTENING ${sanProgress}%` : 'DOWNLOAD SAFE COPY'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Floating Page Nav */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-surface/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl">
          <button onClick={() => setPageNum(p => Math.max(1, p - 1))} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-mono font-medium min-w-[80px] text-center">
            {pageNum} / {pdfDoc?.numPages || '--'}
          </span>
          <button onClick={() => setPageNum(p => Math.min(pdfDoc?.numPages || 1, p + 1))} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#0B0C0E] custom-scroll">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-xs text-text-secondary uppercase tracking-widest">Initializing Sandbox...</p>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white rounded-sm overflow-hidden"
            >
              <iframe
                ref={iframeRef}
                src="/sandbox.html"
                className="block border-none"
                width={800 * scale}
                height={1132 * scale} // Approx A4 ratio
                sandbox="allow-scripts"
                title="Ghost-Protocol Sandbox"
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
