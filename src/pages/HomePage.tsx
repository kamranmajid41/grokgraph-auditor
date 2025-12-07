import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, TrendingUp, Shield } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/article?topic=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          GrokiPedia
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Citation Graph Auditor - Graph-theoretic fact-checking and bias analysis
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for an article or create a new one..."
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          </div>
          <button
            type="submit"
              disabled={!searchQuery.trim()}
            className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Search or Create Article
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <FileText className="w-10 h-10 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Article Analysis</h3>
          <p className="text-gray-600">
            Extract citations, build citation graphs, and analyze article quality with graph-theoretic methods.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <TrendingUp className="w-10 h-10 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Bias Detection</h3>
          <p className="text-gray-600">
            Detect source concentration, ideological clustering, and missing viewpoint diversity.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Shield className="w-10 h-10 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Quality Scoring</h3>
          <p className="text-gray-600">
            Get reliability scores, diversity metrics, and actionable recommendations.
          </p>
        </div>
      </div>

      <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>Enter a topic or search for an existing article</li>
          <li>Our system generates or analyzes the article content</li>
          <li>Citations are extracted and classified by source type</li>
          <li>Graph-theoretic analysis identifies bias and quality issues</li>
          <li>Get recommendations for improving citation diversity and reliability</li>
        </ol>
      </div>
    </div>
  );
}

