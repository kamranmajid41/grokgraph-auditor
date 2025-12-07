import { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Citation } from '../types';

interface ArticleContentProps {
  content: string;
  citations: Citation[];
  chunkSize?: number; // Number of characters per chunk
}

const DEFAULT_CHUNK_SIZE = 5000; // Render 5KB chunks at a time
const INITIAL_CHUNKS = 2; // Load first 2 chunks immediately

export function ArticleContent({ content, citations, chunkSize = DEFAULT_CHUNK_SIZE }: ArticleContentProps) {
  const [visibleChunks, setVisibleChunks] = useState(INITIAL_CHUNKS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  // Split content into chunks
  const chunks = useMemo(() => {
    if (content.length <= chunkSize) {
      return [content];
    }
    
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    return chunks;
  }, [content, chunkSize]);
  
  const visibleContent = useMemo(() => {
    return chunks.slice(0, visibleChunks).join('');
  }, [chunks, visibleChunks]);
  
  const hasMore = visibleChunks < chunks.length;
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          // Load next chunk with a small delay to prevent jank
          setTimeout(() => {
            setVisibleChunks(prev => Math.min(prev + 1, chunks.length));
            setIsLoadingMore(false);
          }, 100);
        }
      },
      { rootMargin: '200px' } // Start loading 200px before reaching the trigger
    );
    
    observerRef.current.observe(loadMoreRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, chunks.length, isLoadingMore]);
  
  // Memoize citations lookup for performance
  const citationMap = useMemo(() => {
    const map = new Map<string, Citation>();
    citations.forEach(c => map.set(c.url, c));
    return map;
  }, [citations]);
  
  // Use citationMap in the link component
  
  return (
    <div className="prose prose-lg max-w-none prose-invert">
      <ReactMarkdown
        components={{
          // Style headings
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold text-[#e5e5e5] mt-8 mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-semibold text-[#e5e5e5] mt-6 mb-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-semibold text-[#e5e5e5] mt-4 mb-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xl font-semibold text-[#e5e5e5] mt-3 mb-2" {...props} />
          ),
          // Style paragraphs
          p: ({ node, ...props }) => (
            <p className="text-[#e5e5e5] leading-relaxed mb-4" {...props} />
          ),
          // Style links
          a: ({ node, href, children, ...props }) => {
            const citation = citationMap.get(href || '');
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
                title={citation ? `Source: ${citation.domain} (${citation.sourceType})` : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Style lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside text-[#e5e5e5] mb-4 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside text-[#e5e5e5] mb-4 space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-[#e5e5e5]" {...props} />
          ),
          // Style strong/bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-[#e5e5e5]" {...props} />
          ),
          // Style emphasis/italic
          em: ({ node, ...props }) => (
            <em className="italic text-[#e5e5e5]" {...props} />
          ),
          // Style code
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className || !className.includes('language-');
            if (isInline) {
              return (
                <code className="bg-[#2a2a2a] text-[#e5e5e5] px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-[#2a2a2a] text-[#e5e5e5] p-4 rounded mb-4 overflow-x-auto" {...props}>
                {children}
              </code>
            );
          },
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-[#3a3a3a] pl-4 italic text-[#888] my-4" {...props} />
          ),
          // Style horizontal rules
          hr: ({ node, ...props }) => (
            <hr className="border-[#2a2a2a] my-6" {...props} />
          ),
        }}
      >
        {visibleContent}
      </ReactMarkdown>
      
      {/* Lazy loading trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-8">
          {isLoadingMore ? (
            <div className="text-[#888] text-sm">Loading more content...</div>
          ) : (
            <div className="text-[#888] text-sm">
              Scroll to load more ({chunks.length - visibleChunks} chunk{chunks.length - visibleChunks !== 1 ? 's' : ''} remaining)
            </div>
          )}
        </div>
      )}
      
      {/* Progress indicator */}
      {chunks.length > 1 && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
          <div className="flex items-center justify-between text-sm text-[#888]">
            <span>Content loaded: {Math.round((visibleChunks / chunks.length) * 100)}%</span>
            <span>{visibleChunks} of {chunks.length} sections</span>
          </div>
          <div className="mt-2 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(visibleChunks / chunks.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

