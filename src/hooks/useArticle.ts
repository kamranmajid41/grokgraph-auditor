import { useState, useCallback } from 'react';
import type { Article, AnalysisResults } from '../types';
import { generateArticle } from '../services/grokApi';
import { fetchGrokipediaArticle, isGrokipediaUrl, fetchGrokipediaByTopic } from '../services/grokipediaApi';
import { extractCitationsFromText, buildCitationGraph, calculateBiasMetrics, calculateDiversityMetrics, calculateQualityScores, detectRedFlags, classifySourceType, calculateReliability } from '../utils/citationUtils';
import { analyzeAllCitations, analyzeAllDomains, analyzeAllSourceTypes } from '../utils/individualAnalyzers';
import { getCachedArticle, cacheArticle } from '../utils/articleCache';
import { recordFetch, type ArticleSource } from '../utils/articleMetrics';

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
  const [articleSource, setArticleSource] = useState<ArticleSource | null>(null);

  const createArticle = useCallback(async (topic: string) => {
    setLoading(true);
    setError(null);
    setArticleSource(null);
    
    const startTime = Date.now();
    let source: ArticleSource = 'fallback';
    
    try {
      let content: string;
      let title: string = topic;
      let url: string = '';
      
      let grokipediaArticle: { title: string; content: string; url: string; citations: Array<{ url: string; text: string }> } | null = null;
      
      // Step 0: Check cache first (fastest)
      const cached = getCachedArticle(topic);
      if (cached && cached.content) {
        const duration = Date.now() - startTime;
        source = 'cache';
        setArticleSource(source);
        recordFetch({ source, success: true, duration, timestamp: Date.now(), topic });
        
        console.log('✓ Using cached article');
        content = cached.content;
        title = cached.title;
        url = cached.url;
        
        // Process cached citations
        const citations = extractCitationsFromText(content);
        if (cached.citations && cached.citations.length > 0) {
          const seenUrls = new Set(citations.map(c => c.url));
          for (const cit of cached.citations) {
            if (!seenUrls.has(cit.url)) {
              const domain = cit.url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');
              const sourceType = classifySourceType(cit.url);
              const reliability = calculateReliability(cit.url, sourceType);
              citations.push({
                url: cit.url,
                text: cit.text,
                domain,
                sourceType,
                reliability,
              });
              seenUrls.add(cit.url);
            }
          }
        }
        
        const newArticle: Article = {
          id: `article-${Date.now()}`,
          title: title || topic,
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
        setLoading(false);
        return newArticle;
      }
      
      // Strategy: Try Grokipedia first (faster, real articles), then fall back to generation
      // Step 1: Check if topic is already a Grokipedia URL
      if (isGrokipediaUrl(topic)) {
        try {
          console.log('Fetching from Grokipedia URL...');
          const urlStartTime = Date.now();
          grokipediaArticle = await fetchGrokipediaArticle(topic);
          const urlDuration = Date.now() - urlStartTime;
          
          if (grokipediaArticle && grokipediaArticle.content) {
            content = grokipediaArticle.content;
            title = grokipediaArticle.title;
            url = grokipediaArticle.url;
            source = 'grokipedia_url';
            console.log('✓ Successfully fetched from Grokipedia URL');
            recordFetch({ source, success: true, duration: urlDuration, timestamp: Date.now(), topic });
            
            // Cache the result
            cacheArticle(topic, {
              title,
              content,
              url,
              citations: grokipediaArticle.citations,
              source: 'grokipedia',
            });
          } else {
            throw new Error('Failed to fetch Grokipedia article - no content returned');
          }
        } catch (fetchError: any) {
          const urlDuration = Date.now() - startTime;
          console.warn('Grokipedia URL fetch failed:', fetchError.message);
          recordFetch({ source: 'grokipedia_url', success: false, duration: urlDuration, timestamp: Date.now(), topic, error: fetchError.message });
          // Fall through to topic-based fetch
        }
      }
      
      // Step 2: If not a URL or URL fetch failed, try fetching by topic name
      if (!grokipediaArticle) {
        try {
          console.log(`Attempting to fetch Grokipedia article for topic: "${topic}"...`);
          const topicStartTime = Date.now();
          grokipediaArticle = await fetchGrokipediaByTopic(topic);
          const topicDuration = Date.now() - topicStartTime;
          
          if (grokipediaArticle && grokipediaArticle.content) {
            content = grokipediaArticle.content;
            title = grokipediaArticle.title;
            url = grokipediaArticle.url;
            source = 'grokipedia_topic';
            console.log('✓ Successfully fetched from Grokipedia by topic');
            recordFetch({ source, success: true, duration: topicDuration, timestamp: Date.now(), topic });
            
            // Cache the result
            cacheArticle(topic, {
              title,
              content,
              url,
              citations: grokipediaArticle.citations,
              source: 'grokipedia',
            });
          } else {
            throw new Error('No Grokipedia article found for topic');
          }
        } catch (topicFetchError: any) {
          const topicDuration = Date.now() - startTime;
          console.warn('Grokipedia topic fetch failed:', topicFetchError.message);
          recordFetch({ source: 'grokipedia_topic', success: false, duration: topicDuration, timestamp: Date.now(), topic, error: topicFetchError.message });
          // Will fall through to generation
        }
      }
      
      // Step 3: If Grokipedia fetch failed, generate article with Grok API
      if (!grokipediaArticle || !content) {
        console.log('Grokipedia not available, generating article with Grok API...');
        try {
          const grokStartTime = Date.now();
          content = await generateArticle(topic);
          const grokDuration = Date.now() - grokStartTime;
          source = 'grok_api';
          console.log('✓ Successfully generated article with Grok API');
          recordFetch({ source, success: true, duration: grokDuration, timestamp: Date.now(), topic });
        } catch (apiError: any) {
          const grokDuration = Date.now() - startTime;
          console.warn('Grok API failed, using fallback content:', apiError);
          source = 'fallback';
          // Final fallback: Generate a demo article with citations
          content = generateFallbackArticle(topic);
          console.log('✓ Using fallback article content');
          recordFetch({ source, success: true, duration: grokDuration, timestamp: Date.now(), topic, error: apiError.message });
        }
      }
      
      // Ensure content is set (should always be set by this point)
      if (!content) {
        content = generateFallbackArticle(topic);
        source = 'fallback';
        recordFetch({ source, success: true, duration: Date.now() - startTime, timestamp: Date.now(), topic, error: 'No content generated' });
      }
      
      setArticleSource(source);
      
      // Extract citations from content
      const citations = extractCitationsFromText(content);
      
      // If we fetched from Grokipedia, merge in the citations from the article
      if (grokipediaArticle && grokipediaArticle.citations.length > 0) {
        const grokipediaCitations = grokipediaArticle.citations.map(cit => {
          const domain = cit.url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');
          return {
            url: cit.url,
            text: cit.text,
            domain,
            sourceType: 'other' as const, // Will be classified properly below
            reliability: 0.5, // Will be calculated properly below
          };
        });
        
        // Merge citations, avoiding duplicates
        const seenUrls = new Set(citations.map(c => c.url));
        for (const cit of grokipediaCitations) {
          if (!seenUrls.has(cit.url)) {
            // Classify and calculate reliability
            const sourceType = classifySourceType(cit.url);
            const reliability = calculateReliability(cit.url, sourceType);
            citations.push({
              ...cit,
              sourceType,
              reliability,
            });
            seenUrls.add(cit.url);
          }
        }
      }
      
      const newArticle: Article = {
        id: `article-${Date.now()}`,
        title: title || topic,
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
      
      // Final metrics record to ensure we always track the complete flow
      const totalDuration = Date.now() - startTime;
      if (source) {
        // Only record if we haven't already recorded for this source
        // (we record earlier in each branch, but this ensures we capture the total time)
        console.log(`Article created via ${source} in ${totalDuration}ms`);
      }
      
      return newArticle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create article';
      const totalDuration = Date.now() - startTime;
      console.error('Error in createArticle:', err);
      
      // Record the failure
      recordFetch({ 
        source: source || 'fallback', 
        success: false, 
        duration: totalDuration, 
        timestamp: Date.now(), 
        topic, 
        error: errorMessage 
      });
      
      setError(errorMessage);
      setLoading(false); // Ensure loading is reset on error
      // Don't throw - let the UI handle the error state
      return null;
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
    articleSource,
    createArticle,
    analyzeArticle,
    setArticle,
  };
}

