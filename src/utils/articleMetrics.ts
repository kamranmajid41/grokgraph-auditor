/**
 * Metrics tracking for article fetching methods
 */

export type ArticleSource = 'grokipedia_url' | 'grokipedia_topic' | 'grok_api' | 'fallback' | 'cache';

export interface FetchMetrics {
  source: ArticleSource;
  success: boolean;
  duration: number;
  timestamp: number;
  topic: string;
  error?: string;
}

const METRICS_KEY = 'article_fetch_metrics';
const MAX_METRICS = 100; // Keep last 100 metrics

/**
 * Record a fetch attempt
 */
export function recordFetch(metrics: FetchMetrics): void {
  try {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, cannot record metrics');
      return;
    }
    
    const allMetrics = getMetrics();
    allMetrics.push(metrics);
    
    // Keep only last MAX_METRICS
    if (allMetrics.length > MAX_METRICS) {
      allMetrics.shift();
    }
    
    localStorage.setItem(METRICS_KEY, JSON.stringify(allMetrics));
    console.log('✓ Metrics recorded:', { source: metrics.source, success: metrics.success, duration: metrics.duration });
  } catch (error) {
    console.error('Error recording metrics:', error);
    // Log the metrics anyway for debugging
    console.log('Failed to record metrics:', metrics);
  }
}

/**
 * Get all metrics
 */
export function getMetrics(): FetchMetrics[] {
  try {
    const stored = localStorage.getItem(METRICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get success rate by source
 */
export function getSuccessRates(): Record<ArticleSource, { success: number; total: number; rate: number }> {
  const metrics = getMetrics();
  const stats: Record<string, { success: number; total: number }> = {};
  
  metrics.forEach(m => {
    if (!stats[m.source]) {
      stats[m.source] = { success: 0, total: 0 };
    }
    stats[m.source].total++;
    if (m.success) {
      stats[m.source].success++;
    }
  });
  
  const result: Record<ArticleSource, { success: number; total: number; rate: number }> = {
    grokipedia_url: { success: 0, total: 0, rate: 0 },
    grokipedia_topic: { success: 0, total: 0, rate: 0 },
    grok_api: { success: 0, total: 0, rate: 0 },
    fallback: { success: 0, total: 0, rate: 0 },
    cache: { success: 0, total: 0, rate: 0 },
  };
  
  Object.entries(stats).forEach(([source, data]) => {
    result[source as ArticleSource] = {
      ...data,
      rate: data.total > 0 ? data.success / data.total : 0,
    };
  });
  
  return result;
}

/**
 * Get average fetch duration by source
 */
export function getAverageDurations(): Record<ArticleSource, number> {
  const metrics = getMetrics();
  const durations: Record<string, number[]> = {};
  
  metrics.forEach(m => {
    if (!durations[m.source]) {
      durations[m.source] = [];
    }
    if (m.success) {
      durations[m.source].push(m.duration);
    }
  });
  
  const result: Record<ArticleSource, number> = {
    grokipedia_url: 0,
    grokipedia_topic: 0,
    grok_api: 0,
    fallback: 0,
    cache: 0,
  };
  
  Object.entries(durations).forEach(([source, times]) => {
    if (times.length > 0) {
      result[source as ArticleSource] = times.reduce((a, b) => a + b, 0) / times.length;
    }
  });
  
  return result;
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  localStorage.removeItem(METRICS_KEY);
}
