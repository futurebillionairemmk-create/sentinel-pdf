
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { hash } = req.query;

  if (!hash || typeof hash !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid hash' });
  }

  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: VT API Key missing' });
  }

  try {
    const vtResponse = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': apiKey }
    });

    if (vtResponse.status === 404) {
      return res.status(200).json({ 
        scanned: true, 
        positives: 0, 
        total: 0, 
        permalink: '', 
        error: 'File hash not found in global database.' 
      });
    }

    if (!vtResponse.ok) {
      const errorData = await vtResponse.json();
      throw new Error(`VT API Error: ${vtResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await vtResponse.json();
    const s = data.data.attributes.last_analysis_stats;
    
    return res.status(200).json({
      scanned: true,
      positives: s.malicious + s.suspicious,
      total: s.malicious + s.suspicious + s.harmless + s.undetected,
      permalink: `https://www.virustotal.com/gui/file/${hash}`
    });
  } catch (error: any) {
    console.error('VT Proxy Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
