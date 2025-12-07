import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArticleView } from '../components/ArticleView';
import { AuditDashboard } from '../components/AuditDashboard';
import { CitationGraph } from '../components/CitationGraph';
import { ComprehensiveAudit } from '../components/ComprehensiveAudit';
import { useArticle } from '../hooks/useArticle';
import { buildCitationGraph } from '../utils/citationUtils';
import { Loader2, ArrowLeft, BarChart3 } from 'lucide-react';

export function ArticlePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic') || '';
  const { article, loading, error, analysis, articleSource, createArticle, analyzeArticle } = useArticle();
  const [activeTab, setActiveTab] = useState<'article' | 'analysis' | 'graph' | 'deep'>('article');

  useEffect(() => {
    if (topic && !article && !loading) {
      createArticle(topic).catch(console.error);
    }
  }, [topic]); // Only depend on topic to avoid infinite loops
  
  useEffect(() => {
    if (article && !analysis) {
      analyzeArticle(article);
    }
  }, [article]); // Only depend on article

  if (loading && !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#e5e5e5] mx-auto mb-4" />
          <p className="text-[#888]">
            {topic.toLowerCase().includes('grokipedia.com') || topic.toLowerCase().includes('http')
              ? `Fetching article from ${topic.substring(0, 50)}...`
              : `Creating article about "${topic}"...`}
          </p>
          <p className="text-xs text-[#666] mt-2">
            {topic.toLowerCase().includes('grokipedia.com') 
              ? 'Note: Direct browser fetching may fail due to CORS. Using fallback if needed...'
              : ''}
          </p>
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'article'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5] shadow-sm'
                    : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
                }`}
              >
                Article
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'analysis'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5] shadow-sm'
                    : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${
                  activeTab === 'graph'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5] shadow-sm'
                    : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Graph
              </button>
              <button
                onClick={() => setActiveTab('deep')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${
                  activeTab === 'deep'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5] shadow-sm'
                    : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
                }`}
              >
                Deep Audit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'article' && (
          <ArticleView article={article} source={articleSource} />
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

        {activeTab === 'deep' && analysis && (
          <div>
            <ComprehensiveAudit article={article} analysis={analysis} />
          </div>
        )}
      </div>
    </div>
  );
}

