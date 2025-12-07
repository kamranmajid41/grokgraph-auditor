/**
 * Article cache for Grokipedia fetches
 * Uses localStorage for persistence across sessions
 */

interface CachedArticle {
  title: string;
  content: string;
  url: string;
  citations: Array<{ url: string; text: string }>;
  timestamp: number;
  source: 'grokipedia' | 'grok' | 'fallback';
}

const CACHE_PREFIX = 'grokipedia_article_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from topic or URL
 */
function getCacheKey(topicOrUrl: string): string {
  // Normalize: remove protocol, lowercase, remove special chars
  const normalized = topicOrUrl
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 100);
  return `${CACHE_PREFIX}${normalized}`;
}

/**
 * Get cached article if available and not expired
 */
export function getCachedArticle(topicOrUrl: string): CachedArticle | null {
  try {
    const key = getCacheKey(topicOrUrl);
    const cached = localStorage.getItem(key);
    
    if (!cached) {
      return null;
    }
    
    const article: CachedArticle = JSON.parse(cached);
    const now = Date.now();
    
    // Check if expired
    if (now - article.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return article;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
}

/**
 * Cache an article
 */
export function cacheArticle(
  topicOrUrl: string,
  article: Omit<CachedArticle, 'timestamp'>
): void {
  try {
    const key = getCacheKey(topicOrUrl);
    const cached: CachedArticle = {
      ...article,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.warn('Error writing to cache:', error);
    // If storage is full, try to clear old entries
    try {
      clearExpiredCache();
      const key = getCacheKey(topicOrUrl);
      const cached: CachedArticle = {
        ...article,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (e) {
      console.warn('Cache full, cannot store article');
    }
  }
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache(): void {
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || '{}');
        if (now - cached.timestamp > CACHE_TTL) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key); // Remove invalid entries
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Clear all article cache
 */
export function clearAllCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: number } {
  let entries = 0;
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      entries++;
      const value = localStorage.getItem(key) || '';
      totalSize += key.length + value.length;
    }
  }
  
  return {
    size: totalSize,
    entries,
  };
}
