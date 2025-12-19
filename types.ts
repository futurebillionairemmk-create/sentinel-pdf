
export enum RiskLevel {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  MALICIOUS = 'MALICIOUS',
  UNKNOWN = 'UNKNOWN',
}

export interface HeuristicThreat {
  type: string;
  count: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VirusTotalResult {
  scanned: boolean;
  positives: number;
  total: number;
  permalink: string;
  error?: string;
}

export interface ScanReport {
  id: string;
  fileName: string;
  fileSize: number;
  hash: string;
  timestamp: number;
  riskLevel: RiskLevel;
  score: number;
  heuristics: HeuristicThreat[];
  virusTotal: VirusTotalResult;
  aiAnalysis?: string;
  isLocked: boolean;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  riskLevel: RiskLevel;
  score: number;
  timestamp: number;
}

export interface AppConfig {
  virusTotalApiKey: string;
  useMockMode: boolean;
  autoQuarantineThreshold: number;
}
