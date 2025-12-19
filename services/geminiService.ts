import { ScanReport } from "../types.ts";

export const generateThreatExplanation = async (report: ScanReport): Promise<string> => {
  try {
    const res = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report })
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`Gemini Proxy Error: ${res.status} - ${errorMsg}`);
    }

    const data = await res.json();
    return data.text || "Analysis engine returned an empty response. Manual review recommended.";
  } catch (error: any) {
    console.error("Sentinel AI Engine Proxy Error:", error);
    return `AI Analysis System Failure: ${error.message}. Proceed with extreme caution.`;
  }
};

export const analyzeScriptSource = async (scriptSource: string): Promise<string> => {
  try {
    const res = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptSource })
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`Gemini Script Proxy Error: ${res.status} - ${errorMsg}`);
    }

    const data = await res.json();
    return data.text || "No analysis returned.";
  } catch (error: any) {
    console.error("Sentinel Script AI Error:", error);
    return `Analysis Failure: ${error.message}`;
  }
};
