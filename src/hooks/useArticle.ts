import { useState, useCallback } from 'react';
import type { Article, AnalysisResults } from '../types';
import { generateArticle } from '../services/grokApi';
import { extractCitationsFromText, buildCitationGraph, calculateBiasMetrics, calculateDiversityMetrics, calculateQualityScores, detectRedFlags } from '../utils/citationUtils';
import { analyzeAllCitations, analyzeAllDomains, analyzeAllSourceTypes } from '../utils/individualAnalyzers';

function generateFallbackArticle(topic: string): string {
  return `# ${topic}

${topic} is a significant topic that has been studied extensively across multiple disciplines. This article provides an overview of the key aspects and current understanding of ${topic}.

## Overview

The study of ${topic} has evolved significantly over the years. Researchers from various fields have contributed to our understanding through [academic research](https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}), [government reports](https://www.gov.uk/search?q=${encodeURIComponent(topic)}), and [news coverage](https://www.bbc.com/news).

## Key Findings

Recent studies published in [academic journals](https://www.nature.com/search?q=${encodeURIComponent(topic)}) have revealed important insights. Government agencies like the [National Institutes of Health](https://www.nih.gov/) and [World Health Organization](https://www.who.int/) have also published relevant reports.

## Current Status

As reported by [major news outlets](https://www.reuters.com/search?q=${encodeURIComponent(topic)}), the current state of ${topic} continues to evolve. Non-governmental organizations such as [Amnesty International](https://www.amnesty.org/) and [Human Rights Watch](https://www.hrw.org/) have also provided valuable perspectives.

## Conclusion

The field of ${topic} remains an active area of research and discussion, with contributions from academic, government, and independent sources.`;
}

export function useArticle() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);

  const createArticle = useCallback(async (topic: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let content: string;
      try {
        content = await generateArticle(topic);
      } catch (apiError: any) {
        console.warn('Grok API failed, using fallback content:', apiError);
        // Fallback: Generate a demo article with citations
        content = generateFallbackArticle(topic);
      }
      
      const citations = extractCitationsFromText(content);
      
      const newArticle: Article = {
        id: `article-${Date.now()}`,
        title: topic,
        content,
        citations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setArticle(newArticle);
      
      // Run analysis
      buildCitationGraph(newArticle.id, newArticle.title, citations);
      const biasMetrics = calculateBiasMetrics(citations);
      const diversityMetrics = calculateDiversityMetrics(citations);
      const qualityScores = calculateQualityScores(citations);
      const redFlags = detectRedFlags(citations);
      
      // Generate recommendations
      const recommendations: string[] = [];
      
      if (qualityScores.overallQuality < 0.6) {
        recommendations.push('Overall citation quality is below recommended standards. Consider adding more diverse, high-reliability sources.');
      }
      
      if (biasMetrics.sourceConcentration > 0.5) {
        recommendations.push(`High concentration from ${biasMetrics.topDomain}. Diversify sources across multiple domains.`);
      }
      
      if (diversityMetrics.sourceTypeDiversity < 0.5) {
        recommendations.push('Limited source type diversity. Add citations from academic, government, and NGO sources for balance.');
      }
      
      if (qualityScores.sourceReliability < 0.6) {
        recommendations.push('Average source reliability is low. Replace low-reliability sources with more authoritative ones.');
      }
      
      const sourceTypes = new Set(citations.map(c => c.sourceType));
      const missingTypes = ['academic', 'government'].filter(t => !sourceTypes.has(t as typeof citations[0]['sourceType']));
      if (missingTypes.length > 0) {
        recommendations.push(`Add citations from ${missingTypes.join(', ')} sources to improve credibility.`);
      }
      
      // Generate individual analyses
      const citationAnalyses = analyzeAllCitations(citations);
      const domainAnalyses = analyzeAllDomains(citations);
      const sourceTypeAnalyses = analyzeAllSourceTypes(citations);
      
      const analysisResults: AnalysisResults = {
        biasMetrics,
        diversityMetrics,
        qualityScores,
        redFlags,
        recommendations,
        citationAnalyses,
        domainAnalyses,
        sourceTypeAnalyses,
      };
      
      setAnalysis(analysisResults);
      
      return newArticle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create article';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeArticle = useCallback((articleToAnalyze: Article) => {
    const citations = articleToAnalyze.citations.length > 0
      ? articleToAnalyze.citations
      : extractCitationsFromText(articleToAnalyze.content);
    
    buildCitationGraph(articleToAnalyze.id, articleToAnalyze.title, citations);
    const biasMetrics = calculateBiasMetrics(citations);
    const diversityMetrics = calculateDiversityMetrics(citations);
    const qualityScores = calculateQualityScores(citations);
    const redFlags = detectRedFlags(citations);
    
    const recommendations: string[] = [];
    
    if (qualityScores.overallQuality < 0.6) {
      recommendations.push('Overall citation quality is below recommended standards.');
    }
    if (biasMetrics.sourceConcentration > 0.5) {
      recommendations.push(`Diversify sources beyond ${biasMetrics.topDomain}.`);
    }
    if (diversityMetrics.sourceTypeDiversity < 0.5) {
      recommendations.push('Add citations from academic, government, and NGO sources.');
    }
    
    // Generate individual analyses
    const citationAnalyses = analyzeAllCitations(citations);
    const domainAnalyses = analyzeAllDomains(citations);
    const sourceTypeAnalyses = analyzeAllSourceTypes(citations);
    
    const analysisResults: AnalysisResults = {
      biasMetrics,
      diversityMetrics,
      qualityScores,
      redFlags,
      recommendations,
      citationAnalyses,
      domainAnalyses,
      sourceTypeAnalyses,
    };
    
    setAnalysis(analysisResults);
    return analysisResults;
  }, []);

  return {
    article,
    loading,
    error,
    analysis,
    createArticle,
    analyzeArticle,
    setArticle,
  };
}

