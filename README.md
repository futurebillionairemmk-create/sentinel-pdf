# 🛡️ Sentinel PDF

**The Secure PDF Friend & Analyzer**

Sentinel PDF is a security-focused tool designed to analyze, sanitize, and neutralize potentially malicious PDF documents. It leverages advanced heuristics and AI to detect threats without exposing the user to risk.

## 🌟 Features

### 👻 Ghost-Protocol Sandbox
- **Zero-Trust Rendering**: PDFs are rendered in a completely isolated, cross-origin iframe (`sandbox.html`).
- **Script Blocking**: Strict logic prevents embedded JavaScript execution during rendering.
- **Sanitize & Flatten**: Converts dynamic PDF content into a safe, flattened image stream, stripping all active payloads.

### 🧠 JS Forensic Lab
- **Heuristic Scanning**: scours PDF structure for suspicious elements (OpenAction, AA, JS).
- **Script Extraction**: Automatically extracts hidden JavaScript for inspection.
- **AI Analysis**: Integrates with Google Gemini to de-obfuscate and warn about malicious code snippets.

### 🌐 Cloud Intelligence
- **VirusTotal Integration**: Checks file hashes against the VirusTotal database for known threats.
- **AI Threat Synthesis**: Combines heuristic data with AI models to provide a human-readable risk assessment.

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/fbmmk/sentinel-pdf.git
    cd sentinel-pdf
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript
- **PDF Core**: PDF.js (Custom Worker Implementation)
- **Styling**: TailwindCSS (via Utility Classes)
- **Security**:
    - `vite-env.d.ts` for safe type definitions.
    - `sandbox.html` for isolated rendering.
    - `sanitizer.ts` for flattening logic.

## 📝 License

MIT
