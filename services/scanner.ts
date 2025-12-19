
import { HeuristicThreat, RiskLevel, VirusTotalResult } from '../types.ts';

export const calculateHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Advanced Heuristic Analysis: Deep Multi-Pass Scan
 */
export const runLocalHeuristics = async (file: File): Promise<HeuristicThreat[]> => {
  const threats: HeuristicThreat[] = [];
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 1. Coverage Strategy: Head, Heart, and Tail
  // We scan the first 256KB, the middle 128KB, and the last 128KB.
  const CHUNK_SIZE = 256000;
  const chunks: string[] = [];

  // Head
  chunks.push(new TextDecoder().decode(bytes.slice(0, CHUNK_SIZE)));

  // Heart (Middle)
  if (bytes.length > CHUNK_SIZE * 3) {
    const mid = Math.floor(bytes.length / 2);
    chunks.push(new TextDecoder().decode(bytes.slice(mid - 64000, mid + 64000)));
  }

  // Tail
  if (bytes.length > CHUNK_SIZE) {
    chunks.push(new TextDecoder().decode(bytes.slice(-128000)));
  }

  const content = chunks.join("\n[...SENTINEL_SCAN_BRIDGE...]\n");

  // 2. Multi-Pass Pattern Library
  // Includes both literal and common PDF hex-obfuscated signatures
  const patterns = [
    {
      regex: /\/JS|\/JavaScript|#2f#4a#53|#2f#4a#61#76#61#53#63#72#69#70#74/gi,
      type: 'Active Content', severity: 'high',
      desc: 'Embedded scripts found. Detection includes hex-obfuscated /JS markers.'
    },
    {
      regex: /\/OpenAction|\/AA|#2f#4f#70#65#6e#41#63#74#69#6f#6e/gi,
      type: 'Auto-Run Payload', severity: 'critical',
      desc: 'Auto-executes actions on open. High probability of worm/exploit behavior.'
    },
    {
      regex: /\/Launch|#2f#4c#61#75#6e#63#68/gi,
      type: 'External Execution', severity: 'critical',
      desc: 'Attempts to launch OS commands or binaries. Highly suspicious in PDFs.'
    },
    {
      regex: /\/EmbeddedFile|#2f#45#6d#62#65#64#64#65#64#46#69#6c#65/gi,
      type: 'Dropped Payload', severity: 'medium',
      desc: 'Contains embedded binary. Commonly used for multi-stage "dropper" attacks.'
    },
    {
      regex: /\/RichMedia|#2f#52#69#63#68#4d#65#64#69#61/gi,
      type: 'Media Exploit', severity: 'medium',
      desc: 'Legacy media content detected. Often targets Flash or older reader vulnerabilities.'
    },
    {
      regex: /\/URI|#2f#55#52#49/gi,
      type: 'Outbound Link', severity: 'low',
      desc: 'External links found. Validates phishing potential.'
    },
    // New: Filter Stacking (Obfuscation)
    {
      regex: /\/Filter\s*\[\s*\/FlateDecode\s*\/FlateDecode/gi,
      type: 'Double Encoding', severity: 'high',
      desc: 'Multiple compression layers detected. Often used to evade antivirus scanners.'
    }
  ];

  patterns.forEach(p => {
    const matches = content.matchAll(p.regex);
    const matchArray = Array.from(matches);

    if (matchArray.length > 0) {
      const extractedScripts: string[] = [];

      // If the threat is JS-related, attempt to extract the payload
      if (p.type === 'Active Content' || p.type === 'Auto-Run Payload') {
        matchArray.forEach(m => {
          if (m.index !== undefined) {
            // Find the start of the JS block (usually follows the marker)
            // PDF scripts often look like /JS ( console.log('hi') ) or /JS <74657374...>
            const startSearch = m.index;
            const fragment = content.slice(startSearch, startSearch + 2000); // Look ahead 2KB

            // Try to find content between ( ) or < >
            const bracketMatch = fragment.match(/\(([\s\S]*?)\)/) || fragment.match(/<([\s\S]*?)>/);
            if (bracketMatch && bracketMatch[1].length > 5) {
              extractedScripts.push(bracketMatch[1].trim());
            }
          }
        });
      }

      threats.push({
        type: p.type,
        count: matchArray.length,
        description: p.desc,
        severity: p.severity as any,
        extractedScripts: extractedScripts.length > 0 ? extractedScripts : undefined
      });
    }
  });

  // 3. Structural Anomaly Check
  // Check for suspicious EOF markings which can hide trailing payloads
  const hexTail = Array.from(bytes.slice(-32)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (!content.includes('%%EOF') && !hexTail.includes('2525454f46')) {
    threats.push({
      type: 'Malformed Structure',
      count: 1,
      severity: 'medium',
      description: 'Missing or obscured %%EOF marker. May contain hidden trailing data.'
    });
  }

  return threats;
};

/**
 * checkVirusTotal: Production Proxy Logic
 * We call our internal Vercel proxy which holds the secret key.
 */
export const checkVirusTotal = async (
  hash: string,
  mock: boolean
): Promise<VirusTotalResult> => {
  if (mock) {
    await new Promise(r => setTimeout(r, 800));
    return { scanned: true, positives: 0, total: 0, permalink: '', error: 'DEMO MODE: Using simulated reputation data.' };
  }

  try {
    const res = await fetch(`/api/vt-proxy?hash=${hash}`);

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`VT Proxy Error: ${res.status} - ${errorMsg}`);
    }

    return await res.json();
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
