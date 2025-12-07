/**
 * Grokipedia API - Fetch articles from Grokipedia.com
 * 
 * CORS Explanation:
 * Browsers block cross-origin requests for security. When your frontend (localhost:5174)
 * tries to fetch from grokipedia.com, the browser blocks it because:
 * 1. Different origins (localhost vs grokipedia.com)
 * 2. Grokipedia doesn't send CORS headers allowing your origin
 * 
 * Solution: Use a backend proxy (see forge/api_server.py)
 */

const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:8000';

export interface GrokipediaArticle {
  title: string;
  content: string;
  url: string;
  citations: Array<{ url: string; text: string }>;
}

/**
 * Extract markdown content from Grokipedia's Next.js RSC payload
 */
function extractMarkdownContent(html: string): string {
  // Find all __next_f.push chunks
  const pattern = /self\.__next_f\.push\(\[1,"(.+?)"\]\)<\/script>/g;
  const matches: string[] = [];
  let match;
  
  while ((match = pattern.exec(html)) !== null) {
    matches.push(match[1]);
  }
  
  if (matches.length === 0) {
    return '';
  }
  
  // Find the chunk containing the article (starts with # Title)
  let markdown = '';
  for (const chunk of matches) {
    if (chunk.startsWith('# ') || chunk.substring(0, 100).includes('\\n#')) {
      markdown = chunk;
      break;
    }
  }
  
  if (!markdown) {
    return '';
  }
  
  // Unescape the string
  markdown = markdown.replace(/\\n/g, '\n');
  markdown = markdown.replace(/\\t/g, '\t');
  markdown = markdown.replace(/\\"/g, '"');
  markdown = markdown.replace(/\\'/g, "'");
  markdown = markdown.replace(/\\\\/g, '\\');
  
  // Clean up the markdown:
  // 1. Remove image references
  markdown = markdown.replace(/!\[[^\]]*\]\([^)]*(?:\\\)[^)]*)*\)/g, '');
  
  // 2. Remove inline reference links with empty text
  markdown = markdown.replace(/\[\]\([^)]+\)/g, '');
  
  // 3. Clean up stray parentheses/brackets
  markdown = markdown.replace(/^\s*\)*\s*$/gm, '');
  
  // 4. Convert Grokipedia internal links to just text
  markdown = markdown.replace(/\[([^\]]+)\]\(https:\/\/grokipedia\.com\/[^)]*\)/g, '$1');
  
  // 5. Keep external reference links for citation extraction
  
  // 6. Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  return markdown.trim();
}

/**
 * Extract title from markdown (first # heading)
 */
function extractTitleFromMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return 'Untitled Article';
}

/**
 * Fetch article from Grokipedia URL via backend proxy (avoids CORS)
 */
async function fetchViaProxy(url: string, topic?: string): Promise<GrokipediaArticle | null> {
  try {
    // If topic provided, use topic parameter (server will try multiple URL patterns)
    const params = topic 
      ? `topic=${encodeURIComponent(topic)}`
      : `url=${encodeURIComponent(url)}`;
    
    const proxyUrl = `${API_PROXY_URL}/api/fetch-grokipedia?${params}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.content) {
      return {
        title: data.title,
        content: data.content,
        url: data.url,
        citations: data.citations || [],
      };
    }
    
    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Proxy took too long to respond');
    }
    throw error;
  }
}

/**
 * Fetch article from Grokipedia URL
 * Tries backend proxy first, falls back to direct fetch (which will likely fail due to CORS)
 */
export async function fetchGrokipediaArticle(url: string): Promise<GrokipediaArticle | null> {
  // First, try the backend proxy if available
  if (API_PROXY_URL && API_PROXY_URL !== '') {
    try {
      console.log('Attempting to fetch via backend proxy...');
      const result = await fetchViaProxy(url);
      if (result) {
        return result;
      }
    } catch (proxyError: any) {
      console.warn('Backend proxy failed:', proxyError.message);
      // Fall through to direct fetch attempt
    }
  }
  
  // Fallback: Try direct fetch (will likely fail due to CORS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const markdown = extractMarkdownContent(html);
    
    if (!markdown) {
      return null;
    }
    
    const title = extractTitleFromMarkdown(markdown);
    
    const citations: Array<{ url: string; text: string }> = [];
    const citationPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    
    while ((match = citationPattern.exec(markdown)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      
      if (!linkUrl.toLowerCase().includes('grokipedia.com')) {
        citations.push({
          text: linkText,
          url: linkUrl,
        });
      }
    }
    
    return {
      title,
      content: markdown,
      url,
      citations,
    };
  } catch (fetchError: any) {
    // CORS error detection
    if (
      fetchError.name === 'TypeError' || 
      fetchError.message?.includes('CORS') || 
      fetchError.message?.includes('Failed to fetch') ||
      fetchError.message?.includes('NetworkError') ||
      fetchError.message?.includes('Network request failed')
    ) {
      const errorMsg = `CORS Error: Cannot fetch directly from browser. 
      
To fix this:
1. Start the backend API server: cd forge && python api_server.py
2. Or set VITE_API_PROXY_URL in your .env file

The browser blocks cross-origin requests for security. The backend proxy avoids this.`;
      
      console.warn(errorMsg);
      // Return null instead of throwing - let the caller handle it
      return null;
    }
    
    if (fetchError.name === 'AbortError') {
      console.warn('Request timeout: Grokipedia took too long to respond');
      return null;
    }
    
    // For other errors, log and return null
    console.warn('Error fetching Grokipedia article:', fetchError.message || fetchError);
    return null;
  }
}

/**
 * Check if a URL is a Grokipedia URL
 */
export function isGrokipediaUrl(url: string): boolean {
  return url.toLowerCase().includes('grokipedia.com');
}

/**
 * Retry with exponential backoff
 * Skips retry for CORS errors (they won't succeed on retry)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry CORS errors - they won't succeed
      if (error?.message?.includes('CORS_ERROR') || error?.message?.includes('CORS')) {
        throw error;
      }
      
      // Don't retry timeout errors
      if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
        throw error;
      }
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

/**
 * Try to fetch article from Grokipedia by topic name
 * Uses backend proxy which tries multiple URL patterns
 */
export async function fetchGrokipediaByTopic(topic: string): Promise<GrokipediaArticle | null> {
  // Import here to avoid circular dependencies - use dynamic import
  const grokipediaUtils = await import('../utils/grokipediaUtils');
  const { isLikelyGrokipediaTopic, generateGrokipediaUrlVariants } = grokipediaUtils;
  
  // Quick check if topic is worth trying
  if (!isLikelyGrokipediaTopic(topic)) {
    return null;
  }
  
  // First, try via backend proxy (faster, tries multiple patterns server-side)
  if (API_PROXY_URL && API_PROXY_URL !== '') {
    try {
      console.log(`Trying backend proxy for topic: "${topic}"...`);
      const result = await retryWithBackoff(
        () => fetchViaProxy('', topic),
        2, // 2 retries
        500 // 500ms base delay
      );
      if (result) {
        console.log(`✓ Found Grokipedia article via proxy for topic: "${topic}"`);
        return result;
      }
    } catch (proxyError: any) {
      console.warn('Backend proxy failed for topic:', proxyError.message);
      // Fall through to client-side URL variants
    }
  }
  
  // Fallback: Try URL variants client-side with retry
  const urlVariants = generateGrokipediaUrlVariants(topic);
  
  // Try each URL variant with retry, return first success
  for (const url of urlVariants) {
    try {
      const result = await retryWithBackoff(
        () => fetchGrokipediaArticle(url),
        2,
        500
      );
      if (result) {
        console.log(`✓ Found Grokipedia article at: ${url}`);
        return result;
      }
    } catch (error: any) {
      // If it's a CORS error, don't try other variants (they'll all fail)
      if (error?.message?.includes('CORS_ERROR') || error?.message?.includes('CORS')) {
        console.warn('CORS error detected, skipping remaining URL variants');
        break; // Exit loop early
      }
      // Continue to next variant for other errors
      continue;
    }
  }
  
  return null;
}
