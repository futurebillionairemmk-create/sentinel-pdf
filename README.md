# Sentinel PDF 🛡️

**Sentinel PDF** is a high-security, browser-based PDF analysis and viewing tool designed to enforce a Zero Trust architecture for document handling. Unlike standard PDF viewers that parse content directly into the DOM, Sentinel analyzes files for malware signatures and heuristic anomalies before rendering them in a strictly isolated sandbox.

## 🚀 Key Features

### 1. Multi-Layer Threat Detection
*   **Static Heuristics**: Scans raw binary data for suspicious PDF tags (e.g., `/JS`, `/OpenAction`, `/Launch`) that indicate malicious scripts or auto-execution behavior.
*   **Threat Intelligence**: Integrates with the **VirusTotal API** to check file hashes against global antivirus databases.
*   **AI Threat Explanation**: Uses **Google Gemini 2.5 Flash** to translate technical threat vectors into human-readable risk assessments.

### 2. Sandboxed Rendering
*   **Canvas-Based Output**: Uses `pdf.js` to rasterize pages onto an HTML5 `<canvas>`.
*   **Zero-DOM Injection**: No PDF objects (fonts, forms, annotations) are added to the DOM, neutralizing XSS and DOM-based exploits.
*   **Script Blocking**: JavaScript execution within the PDF is completely disabled.

### 3. Quarantine Logic
*   **Risk Scoring**: Calculates a composite risk score (0-100) based on heuristics and reputation.
*   **Auto-Quarantine**: Automatically locks access to files exceeding the risk threshold.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **PDF Core**: `pdfjs-dist`
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Icons**: Lucide React

## ⚙️ Configuration

### Environment Variables
To enable AI explanations, create a `.env` file (or configure your environment):

```bash
API_KEY=your_google_gemini_api_key
```

### In-App Settings
Click the **Settings** tab in the UI to configure:
1.  **VirusTotal API Key**: Required for live reputation checks.
2.  **Mock Mode**: Simulates API responses for testing without consuming quotas.
3.  **Quarantine Threshold**: Adjust the sensitivity of the automatic locking mechanism.

## 📦 Usage

1.  **Scan**: Upload a PDF. The system calculates SHA-256 hashes and runs local heuristics immediately.
2.  **Review**: Check the Scan Dashboard for risk scores and specific threat indicators.
3.  **View**: If safe, open the file in the "Secure Sandbox." This opens a modal where the PDF is rendered as pure pixels.

## ⚠️ Disclaimer
While Sentinel PDF significantly reduces the attack surface, no security tool is 100% impenetrable. Always exercise caution with untrusted files.