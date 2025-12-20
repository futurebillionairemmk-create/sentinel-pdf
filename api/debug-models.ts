import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
    }

    try {
        // Direct REST call to list models to bypass any SDK version confusion
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Failed to fetch models from Google',
                details: errorText
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error: any) {
        console.error('Debug Endpoint Error:', error);
        return res.status(500).json({ error: error.message || "Unknown error in debug endpoint." });
    }
}
