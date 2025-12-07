import type { Citation, CitationGraph, GraphNode, GraphEdge, BiasMetrics, DiversityMetrics, QualityScores, RedFlag } from '../types';

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function classifySourceType(url: string): Citation['sourceType'] {
  const domain = extractDomain(url).toLowerCase();
  
  if (domain.includes('.edu') || domain.includes('academic') || domain.includes('scholar')) {
    return 'academic';
  }
  if (domain.includes('.gov') || domain.includes('government')) {
    return 'government';
  }
  if (domain.includes('.org') || domain.includes('ngo') || domain.includes('nonprofit')) {
    return 'ngo';
  }
  if (domain.includes('news') || domain.includes('media') || domain.includes('press')) {
    return 'news';
  }
  if (domain.includes('twitter') || domain.includes('facebook') || domain.includes('reddit')) {
    return 'social';
  }
  if (domain.includes('blog') || domain.includes('medium') || domain.includes('substack')) {
    return 'blog';
  }
  
  return 'other';
}

export function calculateReliability(url: string, sourceType: Citation['sourceType']): number {
  const baseScores: Record<Citation['sourceType'], number> = {
    academic: 0.9,
    government: 0.85,
    ngo: 0.75,
    news: 0.7,
    blog: 0.5,
    social: 0.3,
    other: 0.5,
  };
  
  let score = baseScores[sourceType] || 0.5;
  
  const domain = extractDomain(url).toLowerCase();
  
  // Boost for trusted TLDs
  if (domain.endsWith('.edu') || domain.endsWith('.gov') || domain.endsWith('.org')) {
    score += 0.1;
  }
  
  // Penalize suspicious patterns
  if (domain.includes('blogspot') || domain.includes('wordpress') || domain.includes('tumblr')) {
    score -= 0.2;
  }
  
  return Math.max(0, Math.min(1, score));
}

export function extractCitationsFromText(text: string): Citation[] {
  const citations: Citation[] = [];
  
  // Match markdown links: [text](url)
  const markdownPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
  let match;
  
  while ((match = markdownPattern.exec(text)) !== null) {
    const url = match[2];
    const text = match[1];
    const domain = extractDomain(url);
    const sourceType = classifySourceType(url);
    const reliability = calculateReliability(url, sourceType);
    
    citations.push({
      url,
      text,
      domain,
      sourceType,
      reliability,
    });
  }
  
  // Match HTML links: <a href="url">text</a>
  const htmlPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  while ((match = htmlPattern.exec(text)) !== null) {
    const url = match[1];
    const text = match[2].trim();
    const domain = extractDomain(url);
    const sourceType = classifySourceType(url);
    const reliability = calculateReliability(url, sourceType);
    
    // Avoid duplicates
    if (!citations.some(c => c.url === url)) {
      citations.push({
        url,
        text,
        domain,
        sourceType,
        reliability,
      });
    }
  }
  
  // Match bare URLs
  const urlPattern = /https?:\/\/[^\s<>"\'\)]+/g;
  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0].replace(/[.,;:!?)]+$/, '');
    const domain = extractDomain(url);
    const sourceType = classifySourceType(url);
    const reliability = calculateReliability(url, sourceType);
    
    if (!citations.some(c => c.url === url)) {
      citations.push({
        url,
        text: url,
        domain,
        sourceType,
        reliability,
      });
    }
  }
  
  return citations;
}

export function buildCitationGraph(articleId: string, articleTitle: string, citations: Citation[]): CitationGraph {
  const nodes: GraphNode[] = [
    {
      id: articleId,
      type: 'article',
      label: articleTitle,
    },
  ];
  
  const edges: GraphEdge[] = [];
  
  citations.forEach((citation, index) => {
    const sourceId = `source-${index}`;
    
    nodes.push({
      id: sourceId,
      type: 'source',
      label: citation.domain,
      domain: citation.domain,
      sourceType: citation.sourceType,
      reliability: citation.reliability,
    });
    
    edges.push({
      source: articleId,
      target: sourceId,
      weight: citation.reliability,
    });
  });
  
  return { nodes, edges };
}

export function calculateBiasMetrics(citations: Citation[]): BiasMetrics {
  if (citations.length === 0) {
    return {
      sourceConcentration: 0,
      singleClusterRisk: 0,
      topDomain: '',
      topDomainPercentage: 0,
      domainDistribution: {},
      sourceTypeDistribution: {},
    };
  }
  
  const domainCounts: Record<string, number> = {};
  const sourceTypeCounts: Record<string, number> = {};
  
  citations.forEach(citation => {
    domainCounts[citation.domain] = (domainCounts[citation.domain] || 0) + 1;
    sourceTypeCounts[citation.sourceType] = (sourceTypeCounts[citation.sourceType] || 0) + 1;
  });
  
  const total = citations.length;
  const maxDomainCount = Math.max(...Object.values(domainCounts));
  const topDomain = Object.entries(domainCounts).find(([_, count]) => count === maxDomainCount)?.[0] || '';
  const topDomainPercentage = maxDomainCount / total;
  
  const maxSourceTypeCount = Math.max(...Object.values(sourceTypeCounts));
  const singleClusterRisk = maxSourceTypeCount / total;
  
  const sourceConcentration = (topDomainPercentage + singleClusterRisk) / 2;
  
  return {
    sourceConcentration,
    singleClusterRisk,
    topDomain,
    topDomainPercentage,
    domainDistribution: domainCounts,
    sourceTypeDistribution: sourceTypeCounts,
  };
}

export function calculateDiversityMetrics(citations: Citation[]): DiversityMetrics {
  if (citations.length === 0) {
    return {
      domainDiversity: 0,
      sourceTypeDiversity: 0,
      reliabilityDiversity: 0,
      overallDiversity: 0,
      uniqueDomains: 0,
      uniqueSourceTypes: 0,
    };
  }
  
  const uniqueDomains = new Set(citations.map(c => c.domain)).size;
  const uniqueSourceTypes = new Set(citations.map(c => c.sourceType)).size;
  
  const domainDiversity = uniqueDomains / citations.length;
  const sourceTypeDiversity = uniqueSourceTypes / citations.length;
  
  const reliabilities = citations.map(c => c.reliability);
  const avgReliability = reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length;
  const reliabilityVariance = reliabilities.reduce((sum, r) => sum + Math.pow(r - avgReliability, 2), 0) / reliabilities.length;
  const reliabilityDiversity = Math.min(1, reliabilityVariance * 4);
  
  const overallDiversity = domainDiversity * 0.4 + sourceTypeDiversity * 0.4 + reliabilityDiversity * 0.2;
  
  return {
    domainDiversity,
    sourceTypeDiversity,
    reliabilityDiversity,
    overallDiversity,
    uniqueDomains,
    uniqueSourceTypes,
  };
}

export function calculateQualityScores(citations: Citation[]): QualityScores {
  if (citations.length === 0) {
    return {
      citationQuality: 0,
      sourceReliability: 0,
      diversityScore: 0,
      citationCountScore: 0,
      overallQuality: 0,
    };
  }
  
  const sourceReliability = citations.reduce((sum, c) => sum + c.reliability, 0) / citations.length;
  const diversityMetrics = calculateDiversityMetrics(citations);
  const citationCountScore = Math.min(1, citations.length / 10);
  
  const overallQuality = sourceReliability * 0.4 + diversityMetrics.overallDiversity * 0.3 + citationCountScore * 0.3;
  
  return {
    citationQuality: overallQuality,
    sourceReliability,
    diversityScore: diversityMetrics.overallDiversity,
    citationCountScore,
    overallQuality,
  };
}

export function detectRedFlags(citations: Citation[]): RedFlag[] {
  const flags: RedFlag[] = [];
  
  if (citations.length < 3) {
    flags.push({
      type: 'insufficient_citations',
      severity: 'high',
      message: `Article has only ${citations.length} citations (minimum recommended: 3)`,
    });
  }
  
  const lowReliabilityCount = citations.filter(c => c.reliability < 0.4).length;
  if (lowReliabilityCount > citations.length * 0.5) {
    flags.push({
      type: 'low_reliability_dominance',
      severity: 'medium',
      message: `Over 50% of citations are from low-reliability sources`,
    });
  }
  
  const biasMetrics = calculateBiasMetrics(citations);
  if (biasMetrics.sourceConcentration > 0.7) {
    flags.push({
      type: 'high_source_concentration',
      severity: 'high',
      message: `Over 70% of citations from top domain: ${biasMetrics.topDomain}`,
    });
  }
  
  if (biasMetrics.singleClusterRisk > 0.8) {
    flags.push({
      type: 'single_cluster_risk',
      severity: 'high',
      message: `Over 80% of citations from single source type cluster`,
    });
  }
  
  const sourceTypes = new Set(citations.map(c => c.sourceType));
  const requiredTypes: Citation['sourceType'][] = ['academic', 'government', 'news'];
  const missingTypes = requiredTypes.filter(t => !sourceTypes.has(t));
  
  if (missingTypes.length > 0) {
    flags.push({
      type: 'missing_viewpoint_diversity',
      severity: 'medium',
      message: `Missing citations from: ${missingTypes.join(', ')}`,
    });
  }
  
  return flags;
}

