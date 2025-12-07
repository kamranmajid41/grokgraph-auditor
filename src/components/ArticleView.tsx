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
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      <article className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8 hover-lift hover:border-[#3a3a3a]">
        <h1 className="text-4xl font-bold text-[#e5e5e5] mb-4 tracking-tight">{article.title}</h1>
        
        <div className="flex items-center gap-3 text-sm text-[#888] mb-6 pb-6 border-b border-[#2a2a2a]">
          <span>Last updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
          <span className="text-[#444]">•</span>
          <span className="flex items-center gap-1">
            <span>{citations.length}</span>
            <span>citation{citations.length !== 1 ? 's' : ''}</span>
          </span>
        </div>

        <ArticleContent content={article.content} citations={citations} />
        
        <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
          <h2 className="text-2xl font-semibold mb-6 text-[#e5e5e5] tracking-tight">Citations</h2>
          <CitationList citations={citations} onCitationClick={onCitationClick} />
        </div>
      </article>
    </div>
  );
}

