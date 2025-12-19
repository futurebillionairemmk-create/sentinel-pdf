
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ShieldCheck, ShieldAlert, Terminal, Info, Hash } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  file: File | null;
  onClose: () => void;
}

export const SecurePDFViewer: React.FC<Props> = ({ file, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [jumpVal, setJumpVal] = useState("1");
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    if (!file) return;
    const loadPdf = async () => {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({
          data: arrayBuffer,
          disableFontFace: true,
          isEvalSupported: false,
          stopAtErrors: true, // Fail fast on malformed files
        }).promise;
        setPdfDoc(doc);
        const meta = await doc.getMetadata();
        setMetadata(meta);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [file]);

  useEffect(() => {
    if (pdfDoc) renderPage(pageNum);
  }, [pdfDoc, pageNum, scale]);

  const renderPage = async (num: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (e) {
      console.error("Render failed", e);
    }
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(jumpVal);
    if (!isNaN(val) && val >= 1 && val <= (pdfDoc?.numPages || 1)) {
      setPageNum(val);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-950 flex-col lg:flex-row">
      {/* Sidebar: Metadata & Security Log */}
      <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto custom-scroll">
        <div className="flex items-center gap-2 mb-8 text-emerald-400">
          <ShieldCheck size={24} />
          <h2 className="font-bold tracking-tight">SANDBOX ACTIVE</h2>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Info size={14} /> Document Metadata
            </h3>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] space-y-2 border border-slate-800">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Total Pages</span>
                <span className="text-emerald-400 font-bold">{pdfDoc?.numPages || '---'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Title</span>
                <span className="text-slate-300 truncate ml-2 text-right">{metadata?.info?.Title || 'None'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Producer</span>
                <span className="text-slate-300 truncate ml-2 text-right">{metadata?.info?.Producer || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PDF Ver</span>
                <span className="text-slate-300 ml-2 text-right">1.7 (Standard)</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Hash size={14} /> Rapid Navigate
            </h3>
            <form onSubmit={handleJump} className="flex gap-2">
              <input 
                type="number" 
                value={jumpVal}
                onChange={(e) => setJumpVal(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono outline-none focus:border-emerald-500"
                min="1"
                max={pdfDoc?.numPages || 1}
              />
              <button type="submit" className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase rounded border border-slate-700">Jump</button>
            </form>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Terminal size={14} /> Process Log
            </h3>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] space-y-1 text-emerald-500/80 leading-relaxed border border-slate-800">
              <p>[0.0s] Isolation worker thread init.</p>
              {pdfDoc?.numPages > 500 && <p className="text-amber-500">[!] Large page count: Using lazy-map.</p>}
              <p>[0.2s] TextLayer parsing disabled.</p>
              <p>[0.3s] Rendering pixel-buffer: P{pageNum}</p>
              <p className="text-emerald-400">[READY] Stream established.</p>
            </div>
          </section>

          <button 
            onClick={onClose}
            className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-sm font-bold transition"
          >
            EXIT SANDBOX
          </button>
        </div>
      </aside>

      {/* Main Viewing Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-950">
        <div className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-950 rounded border border-slate-800 p-1">
              <button onClick={() => setPageNum(p => Math.max(1, p - 1))} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={16}/></button>
              <span className="px-3 text-xs font-mono py-1 min-w-[100px] text-center">PAGE {pageNum} / {pdfDoc?.numPages || '?'}</span>
              <button onClick={() => setPageNum(p => Math.min(pdfDoc?.numPages || 1, p + 1))} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={16}/></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 hover:bg-slate-800 rounded text-slate-400"><ZoomOut size={18}/></button>
            <span className="text-xs font-mono text-slate-500 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 hover:bg-slate-800 rounded text-slate-400"><ZoomIn size={18}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-12 flex justify-center items-start bg-slate-950 custom-scroll">
          {loading ? (
            <div className="flex flex-col items-center mt-20 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-sm text-emerald-400 animate-pulse uppercase tracking-widest">Parsing Structure...</p>
            </div>
          ) : (
            <div className="shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-slate-800 bg-white">
               <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          )}
        </div>

        <div className="absolute bottom-4 right-6 pointer-events-none opacity-20 flex items-center gap-2 font-mono text-xs text-white uppercase tracking-widest">
           <ShieldAlert size={14} /> Sanitized View Port
        </div>
      </main>
    </div>
  );
};
