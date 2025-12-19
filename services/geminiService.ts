
import { GoogleGenAI } from "@google/genai";
import { ScanReport } from "../types.ts";

export const generateThreatExplanation = async (report: ScanReport): Promise<string> => {
  try {
    // Initializing precisely as per the security-first architecture requirements
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a high-level Cybersecurity Analyst at a Tier-1 SOC.
      Analyze the following PDF scan results for a file named "${report.fileName}".
      
      CRITICAL DATA:
      - Risk Score: ${report.score}/100
      - Local Heuristics: ${JSON.stringify(report.heuristics)}
      - VirusTotal Detections: ${report.virusTotal.positives}/${report.virusTotal.total}
      
      TASK:
      Provide a "Chief Information Security Officer (CISO) Summary" of exactly 3 sentences.
      1. Explain the primary attack vector detected.
      2. State the potential impact if opened in a non-sandboxed environment.
      3. Give a final "Go/No-Go" recommendation.
      
      TONE: Professional, urgent, technical but concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4, // Lower temperature for more factual, deterministic security analysis
        topP: 0.8,
        thinkingConfig: { thinkingBudget: 0 } // Flash-lite speed focus
      }
    });

    return response.text || "Analysis engine returned an empty response. Manual review recommended.";
  } catch (error: any) {
    console.error("Sentinel AI Engine Error:", error);
    return `AI Analysis System Failure: ${error.message}. Proceed with extreme caution.`;
  }
};
