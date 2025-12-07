import ReactMarkdown from 'react-markdown';
import type { Citation } from '../types';

interface ArticleContentProps {
  content: string;
  citations: Citation[];
}

export function ArticleContent({ content, citations }: ArticleContentProps) {
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
            const citation = citations.find(c => c.url === href);
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
        {content}
      </ReactMarkdown>
    </div>
  );
}

