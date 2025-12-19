
import { HeuristicThreat, RiskLevel, VirusTotalResult } from '../types.ts';

export const calculateHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Advanced Heuristic Analysis (Head & Tail Scan)
 */
export const runLocalHeuristics = async (file: File): Promise<HeuristicThreat[]> => {
  const threats: HeuristicThreat[] = [];
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  const CHUNK_SIZE = 128000; // 128KB
  const head = new TextDecoder().decode(bytes.slice(0, CHUNK_SIZE));
  const tail = bytes.length > CHUNK_SIZE 
    ? new TextDecoder().decode(bytes.slice(-CHUNK_SIZE)) 
    : "";

  const content = head + "\n[...SENTINEL_SCAN_BRIDGE...]\n" + tail;

  const patterns = [
    { regex: /\/JS|\/JavaScript|#4a#53/gi, type: 'Active Content', severity: 'high', desc: 'Embedded scripts found. High execution risk.' },
    { regex: /\/OpenAction|\/AA/gi, type: 'Auto-Run Payload', severity: 'critical', desc: 'Auto-executes actions on open.' },
    { regex: /\/Launch/gi, type: 'External Execution', severity: 'critical', desc: 'Attempts to launch OS commands or binaries.' },
    { regex: /\/EmbeddedFile/gi, type: 'Dropped Payload', severity: 'medium', desc: 'Contains embedded binary. Potential dropper.' },
    { regex: /\/RichMedia/gi, type: 'Media Exploit', severity: 'medium', desc: 'Legacy media content detected.' },
    { regex: /\/URI/gi, type: 'Outbound Link', severity: 'low', desc: 'External links found. Phishing risk.' }
  ];

  patterns.forEach(p => {
    const matches = (content.match(p.regex) || []).length;
    if (matches > 0) {
      threats.push({
        type: p.type,
        count: matches,
        description: p.desc,
        severity: p.severity as any
      });
    }
  });

  return threats;
};

/**
 * checkVirusTotal: Production Proxy Logic
 * In production, we call our own API route which holds the secret key.
 */
export const checkVirusTotal = async (
  hash: string, 
  apiKey: string, 
  mock: boolean
): Promise<VirusTotalResult> => {
  // If we are in the browser and no key is provided, we MUST assume we're calling the server-side proxy
  // or using mock data.
  if (mock) {
    await new Promise(r => setTimeout(r, 800));
    return { scanned: true, positives: 0, total: 0, permalink: '', error: 'DEMO MODE: Using simulated reputation data.' };
  }

  try {
    // SECURITY: In a real Vercel deployment, this would be: 
    // const res = await fetch(`/api/vt-proxy?hash=${hash}`);
    
    // For this environment, we handle the key provided in settings
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': apiKey }
    });
    
    if (res.status === 404) {
      return { scanned: true, positives: 0, total: 0, permalink: '', error: 'File hash not found in global database.' };
    }
    
    if (!res.ok) throw new Error(`VT API Error: ${res.status}`);
    
    const data = await res.json();
    const s = data.data.attributes.last_analysis_stats;
    return {
      scanned: true,
      positives: s.malicious + s.suspicious,
      total: s.malicious + s.suspicious + s.harmless + s.undetected,
      permalink: `https://www.virustotal.com/gui/file/${hash}`
    };
  } catch (e: any) {
    return { scanned: false, positives: 0, total: 0, permalink: '', error: e.message };
  }
};

export const calculateRiskScore = (vt: VirusTotalResult, heuristics: HeuristicThreat[]): { score: number, level: RiskLevel } => {
  let score = 0;
  if (vt.positives > 0) score += 60 + (vt.positives * 5);
  
  heuristics.forEach(h => {
    if (h.severity === 'critical') score += 45;
    if (h.severity === 'high') score += 25;
    if (h.severity === 'medium') score += 10;
    if (h.severity === 'low') score += 2;
  });

  score = Math.min(score, 100);
  let level = RiskLevel.SAFE;
  if (score > 60) level = RiskLevel.MALICIOUS;
  else if (score > 25) level = RiskLevel.SUSPICIOUS;

  return { score, level };
};
