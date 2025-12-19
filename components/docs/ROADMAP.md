# 🚀 Sentinel PDF: Production Roadmap

To deploy Sentinel PDF for $0 while maintaining SOC-grade security, follow this execution plan.

## ✅ Phase 1: The Proxy Pivot (Security) [PARTIAL]
*   **Task**: Move VirusTotal and Gemini calls to Vercel Serverless Functions.
*   **Status**: `api/vt-proxy.ts` and `api/gemini-proxy.ts` created.
*   **To Do**: Finalize Vercel function integration.

## ✅ Phase 2: Ghost Protocol (Hardening) [COMPLETED]
*   **Task**: Isolate PDF rendering engine.
*   **Implementation**:
    *   Created `sandbox.html` for iframe isolation.
    *   Implemented `postMessage` communication bridge.
    *   Added 'Sanitize & Flatten' to convert PDFs to safe images.

## ✅ Phase 3: JS Forensic Lab [COMPLETED]
*   **Task**: Advanced Threat Detection.
*   **Implementation**:
    *   Heuristic scanning for `OpenAction`, `AA`, `JS`.
    *   Extraction of embedded scripts.
    *   AI-powered de-obfuscation and risk scoring.

## Phase 4: Secret Management & Rate Limiting
*   **Task**: Protect API usage.
*   **Plan**: Use Vercel Env Vars and Upstash Redis (Free Tier) for rate limiting.

## Phase 5: Browser Hardening
*   **Task**: Implement a strict Content Security Policy (CSP).
*   **Headers**:
    *   `script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com;`
    *   `worker-src blob:;`
    *   `connect-src 'self' *.virustotal.com *.google.com;`
