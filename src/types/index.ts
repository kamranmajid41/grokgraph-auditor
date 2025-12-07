export interface Citation {
  url: string;
  text: string;
  domain: string;
  sourceType: 'academic' | 'government' | 'news' | 'ngo' | 'blog' | 'social' | 'other';
  reliability: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  citations: Citation[];
  createdAt: string;
  updatedAt: string;
}

export interface GraphNode {
  id: string;
  type: 'article' | 'source';
  label: string;
  domain?: string;
  sourceType?: string;
  reliability?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface CitationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BiasMetrics {
  sourceConcentration: number;
  singleClusterRisk: number;
  topDomain: string;
  topDomainPercentage: number;
  domainDistribution: Record<string, number>;
  sourceTypeDistribution: Record<string, number>;
}

export interface DiversityMetrics {
  domainDiversity: number;
  sourceTypeDiversity: number;
  reliabilityDiversity: number;
  overallDiversity: number;
  uniqueDomains: number;
  uniqueSourceTypes: number;
}

export interface QualityScores {
  citationQuality: number;
  sourceReliability: number;
  diversityScore: number;
  citationCountScore: number;
  overallQuality: number;
}

export interface RedFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface AnalysisResults {
  biasMetrics: BiasMetrics;
  diversityMetrics: DiversityMetrics;
  qualityScores: QualityScores;
  redFlags: RedFlag[];
  recommendations: string[];
}

