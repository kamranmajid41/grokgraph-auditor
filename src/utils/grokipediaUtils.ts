/**
 * Utilities for working with Grokipedia URLs and topic names
 */

/**
 * Convert a topic name to a potential Grokipedia URL
 * Grokipedia uses /page/ format: https://grokipedia.com/page/Topic_Name
 */
export function topicToGrokipediaUrl(topic: string): string {
  // Clean and format topic name
  const cleaned = topic
    .trim()
    .replace(/\s+/g, '_')  // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_]/g, '')  // Remove special characters
    .replace(/_+/g, '_')  // Collapse multiple underscores
    .replace(/^_|_$/g, '');  // Remove leading/trailing underscores
  
  // Capitalize first letter of each word (Title Case)
  const titleCase = cleaned
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
  
  return `https://grokipedia.com/page/${titleCase}`;
}

/**
 * Generate alternative URL patterns for a topic
 * Some topics might use different URL formats
 */
export function generateGrokipediaUrlVariants(topic: string): string[] {
  const base = topic.trim().replace(/\s+/g, '_');
  const variants: string[] = [];
  
  // Pattern 1: /page/Topic_Name (most common)
  variants.push(`https://grokipedia.com/page/${base}`);
  
  // Pattern 2: /page/TopicName (no underscores)
  variants.push(`https://grokipedia.com/page/${base.replace(/_/g, '')}`);
  
  // Pattern 3: /article/Topic_Name (alternative)
  variants.push(`https://grokipedia.com/article/${base}`);
  
  // Pattern 4: Title case with underscores
  const titleCase = base
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
  variants.push(`https://grokipedia.com/page/${titleCase}`);
  
  return variants;
}

/**
 * Check if a topic is likely to exist on Grokipedia
 * Simple heuristic: topics with common words, proper nouns, etc.
 */
export function isLikelyGrokipediaTopic(topic: string): boolean {
  const t = topic.toLowerCase().trim();
  
  // Skip if it's already a URL
  if (t.startsWith('http://') || t.startsWith('https://')) {
    return false;
  }
  
  // Skip very short topics
  if (t.length < 2) {
    return false;
  }
  
  // Skip if it looks like a search query (has question words)
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
  if (questionWords.some(word => t.startsWith(word + ' '))) {
    return false;
  }
  
  // Likely topics: proper nouns, specific terms, etc.
  // For now, assume most topics are worth trying
  return true;
}
