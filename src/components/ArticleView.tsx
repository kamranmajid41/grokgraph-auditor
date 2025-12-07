import type { Article, Citation } from '../types';
import { extractCitationsFromText } from '../utils/citationUtils';
import { CitationList } from './CitationList';
import { ArticleContent } from './ArticleContent';

interface ArticleViewProps {
  article: Article;
  onCitationClick?: (citation: Citation) => void;
}

export function ArticleView({ article, onCitationClick }: ArticleViewProps) {
  // Extract citations from content if not already extracted
  const citations = article.citations.length > 0 
    ? article.citations 
    : extractCitationsFromText(article.content);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <h1 className="text-4xl font-bold text-[#e5e5e5] mb-4">{article.title}</h1>
        
        <div className="text-sm text-[#888] mb-6">
          <span>Last updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>{citations.length} citations</span>
        </div>

        <ArticleContent content={article.content} citations={citations} />
        
        <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
          <h2 className="text-2xl font-semibold mb-4 text-[#e5e5e5]">Citations</h2>
          <CitationList citations={citations} onCitationClick={onCitationClick} />
        </div>
      </article>
    </div>
  );
}

