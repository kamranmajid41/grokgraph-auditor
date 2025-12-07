/**
 * Debug utilities for metrics
 * Use these in browser console to check metrics
 */

import { getMetrics, getSuccessRates, getAverageDurations } from './articleMetrics';

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugMetrics = {
    getAll: () => {
      const metrics = getMetrics();
      console.table(metrics);
      return metrics;
    },
    getSuccessRates: () => {
      const rates = getSuccessRates();
      console.table(rates);
      return rates;
    },
    getAverageDurations: () => {
      const durations = getAverageDurations();
      console.table(durations);
      return durations;
    },
    clear: () => {
      localStorage.removeItem('article_fetch_metrics');
      console.log('Metrics cleared');
    },
    count: () => {
      const metrics = getMetrics();
      console.log(`Total metrics: ${metrics.length}`);
      return metrics.length;
    },
  };
  
  console.log('Metrics debug tools available. Use: window.debugMetrics.getAll()');
}
