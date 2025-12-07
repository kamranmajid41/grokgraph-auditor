import { useState, useCallback } from 'react';
import type { Article, AnalysisResults } from '../types';
import { generateArticle } from '../services/grokApi';
import { extractCitationsFromText, buildCitationGraph, calculateBiasMetrics, calculateDiversityMetrics, calculateQualityScores, detectRedFlags } from '../utils/citationUtils';

export function useArticle() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);

  const createArticle = useCallback(async (topic: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const content = await generateArticle(topic);
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
      
      const analysisResults: AnalysisResults = {
        biasMetrics,
        diversityMetrics,
        qualityScores,
        redFlags,
        recommendations,
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
    
    const analysisResults: AnalysisResults = {
      biasMetrics,
      diversityMetrics,
      qualityScores,
      redFlags,
      recommendations,
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

