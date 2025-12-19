
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { report } = req.body;

    if (!report) {
        return res.status(400).json({ error: 'Missing scan report data' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
    }

    try {
        const ai = new GoogleGenAI(apiKey);
        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.4,
                topP: 0.8,
            }
        });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text: text || "Analysis engine returned an empty response." });
    } catch (error: any) {
        console.error('Gemini Proxy Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
