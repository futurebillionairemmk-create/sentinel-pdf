# AI Context: Sentinel PDF

## Project Overview
React-based Secure PDF Viewer and Scanner.
**Goal**: Analyze PDFs for malware/heuristics and render them safely without executing scripts.

## Directory Structure
*   `App.tsx`: Main controller. Handles routing (Dashboard/Settings/Viewer) and file upload flow.
*   `types.ts`: Domain models (`ScanReport`, `RiskLevel`, `AppConfig`).
*   `services/`:
    *   `scanner.ts`: Logic for SHA-256 hashing, Regex Heuristics, and VirusTotal fetch.
    *   `geminiService.ts`: Generates text summary of threats using `google-genai`.
*   `components/`:
    *   `ScanDashboard.tsx`: UI for displaying risk scores, VT results, and AI analysis.
    *   `SecurePDFViewer.tsx`: The Sandbox. Renders PDF pages to `<canvas>` using `pdfjs-dist`.

## Key Interfaces

```typescript
// The central data structure flowing through the app
interface ScanReport {
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';
  score: number; // 0-100
  heuristics: HeuristicThreat[]; // Local findings
  virusTotal: VirusTotalResult; // Remote findings
  isLocked: boolean; // Quarantine status
}

// Heuristic Findings
interface HeuristicThreat {
  type: string; // e.g., "Embedded Scripts"
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
}
```

## Security Rules (Do Not Break)
1.  **Canvas Only**: The viewer must NEVER render PDF content to the DOM (no `div`, `span`, `svg`). Only `<canvas>`.
2.  **No Auto-Run**: The `SecurePDFViewer` must not execute actions automatically.
3.  **API Keys**: Keys (VT, Gemini) must be handled securely via config or env vars.

## API Usage
*   **Gemini**: Used for `generateContent` with `gemini-2.5-flash`.
*   **VirusTotal**: V3 API file report endpoint (`/files/{hash}`).
*   **PDF.js**: Used in `GlobalWorkerOptions` mode.

## Development Context
*   **Styling**: Tailwind CSS classes. Dark mode default (`slate-950`).
*   **Icons**: Lucide React.
