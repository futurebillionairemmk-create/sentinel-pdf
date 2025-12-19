
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Scale, Zap } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

import { createPortal } from 'react-dom';

// ... (ModalProps definition)

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, children }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
                        className="fixed left-1/2 top-1/2 w-[90%] max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl z-[9999] p-6 md:p-8"
                    >
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900/95 backdrop-blur py-2 z-10">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                {icon} {title}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = (props) => (
    <Modal {...props} title="Privacy Policy" icon={<Shield className="text-emerald-400" />}>
        <p><strong>Last Updated: December 2024</strong></p>
        <p>At Sentinel PDF, we prioritize the absolute security and privacy of your documents. Our architecture is built on a zero-trust, local-first principle.</p>

        <h3>1. Local Processing</h3>
        <p>Your documents are primarily processed locally within your browser's sandboxed environment. We do not persistently store your files on our servers. Any temporary transmission for deep heuristic analysis is immediately purged post-session.</p>

        <h3>2. Data Collection</h3>
        <p>We collect minimal telemetry data regarding threat detection rates to improve our heuristic engine. This data is anonymized and never contains personally identifiable information (PII) or document content.</p>

        <h3>3. Third-Party Services</h3>
        <p>We utilize privacy-preserving APIs (such as Google Gemini and VirusTotal) for extended threat intelligence. Only cryptographic hashes or strictly necessary metadata are shared; your raw document is never exposed to third parties without your explicit consent.</p>

        <h3>4. User Rights</h3>
        <p>You retain full ownership of your data. Since we do not store your files, there is no need for a "data deletion" request mechanism—your data vanishes the moment you close the tab.</p>
    </Modal>
);

export const TermsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = (props) => (
    <Modal {...props} title="Terms of Service" icon={<Scale className="text-indigo-400" />}>
        <p><strong>Effective Date: December 2024</strong></p>

        <h3>1. Acceptance of Terms</h3>
        <p>By using Sentinel PDF, you agree to these terms. If you deploy this software in a corporate environment, you represent that you have the authority to bind your organization.</p>

        <h3>2. Usage License</h3>
        <p>Sentinel PDF is open-source software. You are granted a limited, non-exclusive license to use the platform for personal or commercial security analysis purposes.</p>

        <h3>3. Disclaimer of Warranties</h3>
        <p>THE SERVICE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. While our heuristic engine is advanced, no security tool is 100% infallible. We are not liable for any damages arising from missed threats or false positives.</p>

        <h3>4. Prohibited Use</h3>
        <p>You may not use Sentinel PDF to reverse engineer our proprietary heuristic algorithms, test our infrastructure for vulnerabilities without authorization, or facilitate cyber–attacks.</p>

        <h3>5. Governing Law</h3>
        <p>These terms shall be governed by the laws of the jurisdiction in which the core development team resides, without regard to its conflict of law provisions.</p>
    </Modal>
);

export const FeaturesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = (props) => (
    <Modal {...props} title="System Capabilities" icon={<Zap className="text-amber-400" />}>
        <h3>1. Ghost Protocol Sandbox</h3>
        <p>Our flagship isolation technology. Every PDF is rendered inside a secure, cross-origin <code>iframe</code> with strictly limited permissions. This creates an air-gapped environment where malicious JavaScript cannot access your local DOM, cookies, or local storage.</p>

        <h3>2. Deep Heuristic Engine</h3>
        <p>We don't just look for known signatures. Our engine acts like a forensic scientist, analyzing the PDF's internal structure for obfuscated code, suspicious streams, and malformed objects that often hide zero-day exploits.</p>

        <h3>3. Gemini 1.5 Pro Integration</h3>
        <p>When heuristics find a puzzle, Gemini solves it. We pipe extracted code snippets to Google's advanced AI model to de-obfuscate and explain the threat in plain English, giving you context that traditional antiviruses miss.</p>
    </Modal>
);

export const ArchitectureModal: React.FC<{ isOpen: boolean; onClose: () => void }> = (props) => (
    <Modal {...props} title="Security Architecture" icon={<Shield className="text-cyan-400" />}>
        <p><strong>Sentinel PDF is built on a "Local-First, Zero-Trust" philosophy.</strong></p>

        <h3>The Rendering Pipeline</h3>
        <ul className="list-disc pl-5 space-y-2">
            <li><strong>Stage 1: Input Quarantine.</strong> The file is read into memory. No rendering occurs yet.</li>
            <li><strong>Stage 2: Static Analysis.</strong> We parse the raw bytestream to map the PDF structure and extract embedded scripts.</li>
            <li><strong>Stage 3: Decision Gate.</strong> If risk score &gt; 55, the file is locked. You must explicitly override to view it.</li>
            <li><strong>Stage 4: Sandboxed View.</strong> If approved, the PDF is passed to an isolated worker thread and rendered visually in a restricted environment.</li>
        </ul>

        <h3>Privacy & Data Flow</h3>
        <p>Your document never leaves your machine for rendering. Only specific extracted text/code snippets are sent to external APIs (like Gemini) for analysis, and only when you explicitly trigger those features.</p>
    </Modal>
);
