import type { Citation, BiasMetrics } from '../../types';

export interface DetailedBiasAnalysis {
  metrics: BiasMetrics;
  domainAnalysis: DomainAnalysis[];
  sourceTypeAnalysis: SourceTypeAnalysis[];
  concentrationRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface DomainAnalysis {
  domain: string;
  count: number;
  percentage: number;
  risk: 'low' | 'medium' | 'high';
  sourceTypes: Record<string, number>;
  avgReliability: number;
}

export interface SourceTypeAnalysis {
  sourceType: string;
  count: number;
  percentage: number;
  risk: 'low' | 'medium' | 'high';
  domains: string[];
  avgReliability: number;
}

export function analyzeBias(citations: Citation[]): DetailedBiasAnalysis {
  if (citations.length === 0) {
    return {
      metrics: {
        sourceConcentration: 0,
        singleClusterRisk: 0,
        topDomain: '',
        topDomainPercentage: 0,
        domainDistribution: {},
        sourceTypeDistribution: {},
      },
      domainAnalysis: [],
      sourceTypeAnalysis: [],
      concentrationRisk: 'low',
      recommendations: [],
    };
  }

  // Calculate domain distribution with detailed metrics
  const domainMap = new Map<string, { citations: Citation[] }>();
  citations.forEach(citation => {
    if (!domainMap.has(citation.domain)) {
      domainMap.set(citation.domain, { citations: [] });
    }
    domainMap.get(citation.domain)!.citations.push(citation);
  });

  const domainAnalysis: DomainAnalysis[] = Array.from(domainMap.entries())
    .map(([domain, data]) => {
      const count = data.citations.length;
      const percentage = count / citations.length;
      const avgReliability = data.citations.reduce((sum, c) => sum + c.reliability, 0) / count;
      
      const sourceTypeCounts: Record<string, number> = {};
      data.citations.forEach(c => {
        sourceTypeCounts[c.sourceType] = (sourceTypeCounts[c.sourceType] || 0) + 1;
      });

      let risk: 'low' | 'medium' | 'high' = 'low';
      if (percentage > 0.5) risk = 'high';
      else if (percentage > 0.3) risk = 'medium';

      return {
        domain,
        count,
        percentage,
        risk,
        sourceTypes: sourceTypeCounts,
        avgReliability,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Calculate source type distribution with detailed metrics
  const sourceTypeMap = new Map<string, { citations: Citation[] }>();
  citations.forEach(citation => {
    if (!sourceTypeMap.has(citation.sourceType)) {
      sourceTypeMap.set(citation.sourceType, { citations: [] });
    }
    sourceTypeMap.get(citation.sourceType)!.citations.push(citation);
  });

  const sourceTypeAnalysis: SourceTypeAnalysis[] = Array.from(sourceTypeMap.entries())
    .map(([sourceType, data]) => {
      const count = data.citations.length;
      const percentage = count / citations.length;
      const avgReliability = data.citations.reduce((sum, c) => sum + c.reliability, 0) / count;
      const domains = Array.from(new Set(data.citations.map(c => c.domain)));

      let risk: 'low' | 'medium' | 'high' = 'low';
      if (percentage > 0.6) risk = 'high';
      else if (percentage > 0.4) risk = 'medium';

      return {
        sourceType,
        count,
        percentage,
        risk,
        domains,
        avgReliability,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Calculate overall metrics
  const topDomain = domainAnalysis[0];
  const topSourceType = sourceTypeAnalysis[0];
  
  const sourceConcentration = topDomain 
    ? (topDomain.percentage + (topSourceType?.percentage || 0)) / 2 
    : 0;
  
  const singleClusterRisk = topSourceType?.percentage || 0;

  // Determine overall concentration risk
  let concentrationRisk: 'low' | 'medium' | 'high' = 'low';
  if (sourceConcentration > 0.6) concentrationRisk = 'high';
  else if (sourceConcentration > 0.4) concentrationRisk = 'medium';

  // Generate specific recommendations
  const recommendations: string[] = [];
  
  if (topDomain && topDomain.percentage > 0.5) {
    recommendations.push(
      `High concentration from ${topDomain.domain} (${(topDomain.percentage * 100).toFixed(1)}%). ` +
      `Diversify sources across multiple domains to reduce bias.`
    );
  }
  
  if (topSourceType && topSourceType.percentage > 0.6) {
    recommendations.push(
      `Over-reliance on ${topSourceType.sourceType} sources (${(topSourceType.percentage * 100).toFixed(1)}%). ` +
      `Add citations from other source types for balanced perspective.`
    );
  }
  
  if (domainAnalysis.length < 3) {
    recommendations.push(
      `Limited domain diversity (${domainAnalysis.length} unique domains). ` +
      `Aim for at least 5-7 different domains for comprehensive coverage.`
    );
  }

  return {
    metrics: {
      sourceConcentration,
      singleClusterRisk,
      topDomain: topDomain?.domain || '',
      topDomainPercentage: topDomain?.percentage || 0,
      domainDistribution: Object.fromEntries(
        domainAnalysis.map(d => [d.domain, d.count])
      ),
      sourceTypeDistribution: Object.fromEntries(
        sourceTypeAnalysis.map(s => [s.sourceType, s.count])
      ),
    },
    domainAnalysis,
    sourceTypeAnalysis,
    concentrationRisk,
    recommendations,
  };
}
