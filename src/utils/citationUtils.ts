import type { Citation, CitationGraph, GraphNode, GraphEdge, BiasMetrics, DiversityMetrics, QualityScores, RedFlag } from '../types';

// Cache for expensive calculations
const calculationCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

function getCached<T>(key: string): T | null {
  const entry = calculationCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    calculationCache.delete(key);
    return null;
  }
  
  return entry.value;
}

function setCached<T>(key: string, value: T): void {
  calculationCache.set(key, {
    value,
    timestamp: Date.now(),
  });
}

function createCacheKey(prefix: string, citations: Citation[]): string {
  // Create a hash from citation URLs for cache key
  const urls = citations.map(c => c.url).sort().join('|');
  return `${prefix}:${urls.length}:${urls.slice(0, 100)}`;
}

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
  const seenUrls = new Set<string>(); // Track seen URLs to avoid duplicates efficiently
  
  // Match markdown links: [text](url)
  const markdownPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
  let match;
  
  while ((match = markdownPattern.exec(text)) !== null) {
    const url = match[2].trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const normalizedUrl = url.replace(/[.,;:!?)]+$/, '');
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        const domain = extractDomain(normalizedUrl);
        const sourceType = classifySourceType(normalizedUrl);
        const reliability = calculateReliability(normalizedUrl, sourceType);
        
        citations.push({
          url: normalizedUrl,
          text: match[1],
          domain,
          sourceType,
          reliability,
        });
      }
    }
  }
  
  // Match HTML links: <a href="url">text</a>
  const htmlPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  while ((match = htmlPattern.exec(text)) !== null) {
    const url = match[1].trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const normalizedUrl = url.replace(/[.,;:!?)]+$/, '');
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        const domain = extractDomain(normalizedUrl);
        const sourceType = classifySourceType(normalizedUrl);
        const reliability = calculateReliability(normalizedUrl, sourceType);
        
        citations.push({
          url: normalizedUrl,
          text: match[2].trim(),
          domain,
          sourceType,
          reliability,
        });
      }
    }
  }
  
  // Match bare URLs (only if not already found in markdown/HTML)
  // Use a more precise pattern that avoids matching URLs already in markdown/HTML
  const urlPattern = /https?:\/\/[^\s<>"\'\)\[\]]+/g;
  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0].replace(/[.,;:!?)]+$/, '');
    // Check if this URL is not part of a markdown or HTML link
    const startPos = match.index;
    const contextBefore = text.substring(Math.max(0, startPos - 10), startPos);
    // Skip if it's part of a markdown or HTML link
    if (!contextBefore.includes('](') && !contextBefore.toLowerCase().includes('<a')) {
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        const domain = extractDomain(url);
        const sourceType = classifySourceType(url);
        const reliability = calculateReliability(url, sourceType);
        
        citations.push({
          url,
          text: url,
          domain,
          sourceType,
          reliability,
        });
      }
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
  
  // Check cache
  const cacheKey = createCacheKey('bias', citations);
  const cached = getCached<BiasMetrics>(cacheKey);
  if (cached) return cached;
  
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
  
  const result = {
    sourceConcentration,
    singleClusterRisk,
    topDomain,
    topDomainPercentage,
    domainDistribution: domainCounts,
    sourceTypeDistribution: sourceTypeCounts,
  };
  
  setCached(cacheKey, result);
  return result;
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
  
  // Check cache
  const cacheKey = createCacheKey('diversity', citations);
  const cached = getCached<DiversityMetrics>(cacheKey);
  if (cached) return cached;
  
  const uniqueDomains = new Set(citations.map(c => c.domain)).size;
  const uniqueSourceTypes = new Set(citations.map(c => c.sourceType)).size;
  
  const domainDiversity = uniqueDomains / citations.length;
  const sourceTypeDiversity = uniqueSourceTypes / citations.length;
  
  const reliabilities = citations.map(c => c.reliability);
  const avgReliability = reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length;
  const reliabilityVariance = reliabilities.reduce((sum, r) => sum + Math.pow(r - avgReliability, 2), 0) / reliabilities.length;
  const reliabilityDiversity = Math.min(1, reliabilityVariance * 4);
  
  const overallDiversity = domainDiversity * 0.4 + sourceTypeDiversity * 0.4 + reliabilityDiversity * 0.2;
  
  const result = {
    domainDiversity,
    sourceTypeDiversity,
    reliabilityDiversity,
    overallDiversity,
    uniqueDomains,
    uniqueSourceTypes,
  };
  
  setCached(cacheKey, result);
  return result;
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
  
  // Check cache
  const cacheKey = createCacheKey('quality', citations);
  const cached = getCached<QualityScores>(cacheKey);
  if (cached) return cached;
  
  const sourceReliability = citations.reduce((sum, c) => sum + c.reliability, 0) / citations.length;
  const diversityMetrics = calculateDiversityMetrics(citations);
  const citationCountScore = Math.min(1, citations.length / 10);
  
  const overallQuality = sourceReliability * 0.4 + diversityMetrics.overallDiversity * 0.3 + citationCountScore * 0.3;
  
  const result = {
    citationQuality: overallQuality,
    sourceReliability,
    diversityScore: diversityMetrics.overallDiversity,
    citationCountScore,
    overallQuality,
  };
  
  setCached(cacheKey, result);
  return result;
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

