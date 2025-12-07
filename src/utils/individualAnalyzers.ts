import type { Citation, CitationAnalysis, DomainAnalysis, SourceTypeAnalysis } from '../types';
import { calculateReliability, classifySourceType, extractDomain } from './citationUtils';

/**
 * Analyze individual citations for detailed insights
 */
export function analyzeCitation(
  citation: Citation,
  allCitations: Citation[],
  index: number
): CitationAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  
  // Reliability breakdown
  const domain = extractDomain(citation.url).toLowerCase();
  const sourceType = citation.sourceType;
  const baseScore = getBaseReliabilityScore(sourceType);
  
  let domainBoost = 0;
  if (domain.endsWith('.edu') || domain.endsWith('.gov') || domain.endsWith('.org')) {
    domainBoost = 0.1;
    strengths.push('Trusted domain extension (.edu, .gov, or .org)');
  }
  
  let penalties = 0;
  if (domain.includes('blogspot') || domain.includes('wordpress') || domain.includes('tumblr')) {
    penalties = 0.2;
    weaknesses.push('Low-reliability hosting platform detected');
  }
  
  const finalScore = Math.max(0, Math.min(1, baseScore + domainBoost - penalties));
  
  // Context analysis
  const domainRank = getDomainRank(citation.domain, allCitations);
  const sourceTypeRank = getSourceTypeRank(citation.sourceType, allCitations);
  
  // Strengths
  if (citation.reliability >= 0.8) {
    strengths.push('High reliability source');
  }
  if (sourceType === 'academic' || sourceType === 'government') {
    strengths.push('Authoritative source type');
  }
  if (domainRank === 1) {
    strengths.push('Unique domain (not duplicated)');
  }
  
  // Weaknesses
  if (citation.reliability < 0.5) {
    weaknesses.push('Low reliability score');
  }
  if (sourceType === 'social' || sourceType === 'blog') {
    weaknesses.push('Less authoritative source type');
  }
  if (domainRank > 3) {
    weaknesses.push(`Domain appears ${domainRank} times (potential over-reliance)`);
  }
  
  // Recommendations
  if (citation.reliability < 0.6) {
    recommendations.push('Consider replacing with a more authoritative source');
  }
  if (sourceType === 'social') {
    recommendations.push('Supplement with academic or government sources');
  }
  if (domainRank > 2) {
    recommendations.push('Diversify sources - this domain is over-represented');
  }
  
  // Calculate overall score (0-100)
  const score = citation.reliability * 100;
  
  return {
    citation,
    score,
    strengths,
    weaknesses,
    recommendations,
    reliabilityBreakdown: {
      baseScore,
      domainBoost,
      penalties,
      finalScore,
    },
    context: {
      positionInArticle: index + 1,
      domainRank,
      sourceTypeRank,
    },
  };
}

/**
 * Analyze all citations individually
 */
export function analyzeAllCitations(citations: Citation[]): CitationAnalysis[] {
  if (!citations || citations.length === 0) {
    return [];
  }
  
  return citations.map((citation, index) => 
    analyzeCitation(citation, citations, index)
  );
}

/**
 * Analyze a specific domain
 */
export function analyzeDomain(
  domain: string,
  allCitations: Citation[]
): DomainAnalysis {
  const domainCitations = allCitations.filter(c => c.domain === domain);
  const citationCount = domainCitations.length;
  
  if (citationCount === 0) {
    return {
      domain,
      citationCount: 0,
      averageReliability: 0,
      sourceTypes: [],
      citations: [],
      metrics: {
        concentration: 0,
        diversity: 0,
        quality: 0,
      },
      issues: ['No citations found for this domain'],
      recommendations: [],
    };
  }
  
  const averageReliability = domainCitations.reduce((sum, c) => sum + c.reliability, 0) / citationCount;
  
  const sourceTypes = Array.from(new Set(domainCitations.map(c => c.sourceType)));
  const totalCitations = allCitations.length;
  const concentration = citationCount / totalCitations;
  
  // Calculate diversity within domain
  const uniqueSourceTypes = sourceTypes.length;
  const diversity = uniqueSourceTypes / citationCount;
  
  // Quality score
  const quality = averageReliability * 0.7 + diversity * 0.3;
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (concentration > 0.3) {
    issues.push(`High concentration: ${(concentration * 100).toFixed(1)}% of all citations`);
    recommendations.push('Diversify sources across multiple domains');
  }
  
  if (averageReliability < 0.6) {
    issues.push(`Low average reliability: ${(averageReliability * 100).toFixed(0)}%`);
    recommendations.push('Replace low-reliability citations from this domain');
  }
  
  if (uniqueSourceTypes === 1) {
    issues.push('Single source type from this domain');
    recommendations.push('Add citations from different source types');
  }
  
  if (citationCount > 5) {
    issues.push(`High citation count (${citationCount}) from single domain`);
    recommendations.push('Consider reducing reliance on this domain');
  }
  
  return {
    domain,
    citationCount,
    averageReliability,
    sourceTypes,
    citations: domainCitations,
    metrics: {
      concentration,
      diversity,
      quality,
    },
    issues,
    recommendations,
  };
}

/**
 * Analyze all domains
 */
export function analyzeAllDomains(citations: Citation[]): DomainAnalysis[] {
  if (!citations || citations.length === 0) {
    return [];
  }
  
  const domains = Array.from(new Set(citations.map(c => c.domain)));
  return domains
    .map(domain => analyzeDomain(domain, citations))
    .sort((a, b) => b.citationCount - a.citationCount);
}

/**
 * Analyze a specific source type
 */
export function analyzeSourceType(
  sourceType: Citation['sourceType'],
  allCitations: Citation[]
): SourceTypeAnalysis {
  const typeCitations = allCitations.filter(c => c.sourceType === sourceType);
  const citationCount = typeCitations.length;
  const totalCitations = allCitations.length;
  const representation = citationCount / totalCitations;
  
  const averageReliability = typeCitations.reduce((sum, c) => sum + c.reliability, 0) / citationCount;
  
  const domains = Array.from(new Set(typeCitations.map(c => c.domain)));
  const domainDiversity = domains.length / citationCount;
  
  const averageQuality = averageReliability * 0.8 + domainDiversity * 0.2;
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (representation > 0.5) {
    issues.push(`Over-representation: ${(representation * 100).toFixed(1)}% of citations`);
    recommendations.push('Diversify source types for better balance');
  }
  
  if (representation < 0.1 && (sourceType === 'academic' || sourceType === 'government')) {
    issues.push(`Under-representation: Only ${(representation * 100).toFixed(1)}% of citations`);
    recommendations.push(`Add more ${sourceType} sources for credibility`);
  }
  
  if (averageReliability < 0.6 && (sourceType === 'academic' || sourceType === 'government')) {
    issues.push(`Lower than expected reliability for ${sourceType} sources`);
    recommendations.push('Verify source quality and consider replacing low-quality citations');
  }
  
  if (domainDiversity < 0.3) {
    issues.push('Low domain diversity within this source type');
    recommendations.push('Add citations from different domains');
  }
  
  return {
    sourceType,
    citationCount,
    averageReliability,
    domains,
    citations: typeCitations,
    metrics: {
      representation,
      averageQuality,
      diversity: domainDiversity,
    },
    issues,
    recommendations,
  };
}

/**
 * Analyze all source types
 */
export function analyzeAllSourceTypes(citations: Citation[]): SourceTypeAnalysis[] {
  if (!citations || citations.length === 0) {
    return [];
  }
  
  const sourceTypes: Citation['sourceType'][] = ['academic', 'government', 'news', 'ngo', 'blog', 'social', 'other'];
  return sourceTypes
    .filter(type => citations.some(c => c.sourceType === type))
    .map(type => analyzeSourceType(type, citations))
    .sort((a, b) => b.citationCount - a.citationCount);
}

// Helper functions
function getBaseReliabilityScore(sourceType: Citation['sourceType']): number {
  const scores: Record<Citation['sourceType'], number> = {
    academic: 0.9,
    government: 0.85,
    ngo: 0.75,
    news: 0.7,
    blog: 0.5,
    social: 0.3,
    other: 0.5,
  };
  return scores[sourceType] || 0.5;
}

function getDomainRank(domain: string, allCitations: Citation[]): number {
  const domainCounts: Record<string, number> = {};
  allCitations.forEach(c => {
    domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
  });
  const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
  const index = sorted.findIndex(([d]) => d === domain);
  return index >= 0 ? index + 1 : allCitations.length;
}

function getSourceTypeRank(sourceType: Citation['sourceType'], allCitations: Citation[]): number {
  const typeCounts: Record<string, number> = {};
  allCitations.forEach(c => {
    typeCounts[c.sourceType] = (typeCounts[c.sourceType] || 0) + 1;
  });
  const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const index = sorted.findIndex(([t]) => t === sourceType);
  return index >= 0 ? index + 1 : allCitations.length;
}
