import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArticleView } from '../components/ArticleView';
import { AuditDashboard } from '../components/AuditDashboard';
import { CitationGraph } from '../components/CitationGraph';
import { useArticle } from '../hooks/useArticle';
import { buildCitationGraph } from '../utils/citationUtils';
import { Loader2, ArrowLeft, BarChart3 } from 'lucide-react';

export function ArticlePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic') || '';
  const { article, loading, error, analysis, createArticle, analyzeArticle } = useArticle();
  const [activeTab, setActiveTab] = useState<'article' | 'analysis' | 'graph'>('article');

  useEffect(() => {
    if (topic && !article && !loading) {
      createArticle(topic).catch(console.error);
    } else if (article && !analysis) {
      analyzeArticle(article);
    }
  }, [topic, article, loading, analysis, createArticle, analyzeArticle]);

  if (loading && !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#e5e5e5] mx-auto mb-4" />
          <p className="text-[#888]">Creating article about "{topic}"...</p>
        </div>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#1a1a1a] text-[#e5e5e5] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-[#888] mb-4">No article found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#1a1a1a] text-[#e5e5e5] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a]"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const graph = buildCitationGraph(article.id, article.title, article.citations);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-[#888] hover:text-[#e5e5e5]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>
            
            <div className="flex space-x-1 bg-[#1a1a1a] rounded-lg p-1 border border-[#2a2a2a]">
              <button
                onClick={() => setActiveTab('article')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'article'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                    : 'text-[#888] hover:text-[#e5e5e5]'
                }`}
              >
                Article
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                    : 'text-[#888] hover:text-[#e5e5e5]'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  activeTab === 'graph'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                    : 'text-[#888] hover:text-[#e5e5e5]'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Graph
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'article' && (
          <ArticleView article={article} />
        )}

        {activeTab === 'analysis' && analysis && (
          <div>
            <AuditDashboard results={analysis} />
          </div>
        )}

        {activeTab === 'graph' && (
          <div>
            <CitationGraph graph={graph} />
          </div>
        )}
      </div>
    </div>
  );
}

