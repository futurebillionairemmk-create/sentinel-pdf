
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { report, scriptSource } = req.body;

    if (!report && !scriptSource) {
        return res.status(400).json({ error: 'Missing input data: Provide either "report" or "scriptSource".' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";

        if (report) {
            prompt = `
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
        } else if (scriptSource) {
            prompt = `
              You are a Malware Reverse Engineer.
              Analyze the following extracted Javascript/ActionScript code:

              \`\`\`javascript
              ${scriptSource.substring(0, 10000)}
              \`\`\`
              (Truncated if over 10k chars)

              TASK:
              1. **De-obfuscation**: Briefly describe what the code is trying to hide or do (e.g. heap spray, callback exploit).
              2. **Malicious Intent**: Is this code malicious? (Yes/No/Suspicious).
              3. **Behavior**: What happens if this executes?

              OUTPUT FORMAT:
              Keep it under 150 words. Focus on technical specifics.
            `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text: text || "Analysis engine returned an empty response." });
    } catch (error: any) {
        console.error('Gemini Proxy Error:', error);
        return res.status(500).json({ error: error.message || "Unknown error in AI generation." });
    }
}
