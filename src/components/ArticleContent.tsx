import type { Citation } from '../types';

interface ArticleContentProps {
  content: string;
  citations: Citation[];
}

export function ArticleContent({ content, citations }: ArticleContentProps) {
  // Convert markdown links to React Router links or external links
  const processContent = (text: string) => {
    // Split by markdown links
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    
    // Match markdown links: [text](url)
    const markdownPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
    let match;
    
    while ((match = markdownPattern.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      const linkText = match[1];
      const url = match[2];
      const citation = citations.find(c => c.url === url);
      
      // Add the link
      if (url.startsWith('http')) {
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
            title={citation ? `Source: ${citation.domain} (${citation.sourceType})` : undefined}
          >
            {linkText}
          </a>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={url}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {linkText}
          </a>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  const processedContent = processContent(content);

  return (
    <div className="prose prose-lg max-w-none">
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {processedContent.map((part, index) => (
          <span key={index}>{part}</span>
        ))}
      </div>
    </div>
  );
}

