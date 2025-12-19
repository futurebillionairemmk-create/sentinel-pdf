
# 🚀 Sentinel PDF: Vercel $0 Production Roadmap

To deploy Sentinel PDF for $0 while maintaining SOC-grade security, follow this 5-phase execution plan.

## Phase 1: The Proxy Pivot (Security)
*   **Task**: Move VirusTotal and Gemini calls to Vercel Serverless Functions.
*   **Reason**: Browser-side API calls expose keys in the 'Network' tab. 
*   **Action**: 
    *   Create `/api/vt-proxy.ts` to handle hash lookups.
    *   Create `/api/ai-proxy.ts` to handle Gemini threat synthesis.

## Phase 2: Secret Management
*   **Task**: Configure Vercel Environment Variables.
*   **Keys Required**:
    *   `API_KEY`: Your Google Gemini API Key.
    *   `VT_API_KEY`: Your VirusTotal V3 API Key.
*   **Security**: Ensure these are NOT prefixed with `NEXT_PUBLIC_` or `VITE_` to keep them server-side only.

## Phase 3: Defensive Rate Limiting
*   **Task**: Protect your $0 budget from abuse.
*   **Solution**: Use **Upstash Redis** (Free Tier).
*   **Logic**: 
    *   Limit to 5 scans per hour per IP.
    *   Cache VirusTotal results for 24 hours to avoid redundant API calls for common files.

## Phase 4: Edge Optimization
*   **Task**: Reduce latency.
*   **Action**: Deploy the Gemini Proxy as an **Edge Function**. 
*   **Benefits**: Lower TTFB (Time to First Byte) and globally distributed execution.

## Phase 5: Browser Hardening
*   **Task**: Implement a strict Content Security Policy (CSP).
*   **Headers**:
    *   `script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com;`
    *   `worker-src blob:;`
    *   `connect-src 'self' *.virustotal.com *.google.com;`
