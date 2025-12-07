import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Moon, ArrowUp } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Disable body scroll when on homepage
  useEffect(() => {
    document.body.classList.add('homepage');
    return () => {
      document.body.classList.remove('homepage');
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/article?topic=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] relative overflow-hidden flex flex-col">
      {/* Enhanced star background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const delay = Math.random() * 3;
          const size = Math.random() * 2 + 1;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          return (
            <div
              key={i}
              className="star absolute bg-white rounded-full opacity-40"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          );
        })}
      </div>

      {/* Header */}
      <div className="relative z-10 pt-4 pb-3 fade-in flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-baseline">
            <h1 className="text-4xl font-serif text-[#e5e5e5] tracking-tight">Grokipedia</h1>
            <span className="ml-2 text-xs text-[#888] font-sans font-medium">v0.2</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              aria-label="Toggle theme"
            >
              <Moon className="w-5 h-5 text-[#888] hover:text-[#e5e5e5] transition-colors" />
            </button>
            <button className="px-4 py-2 bg-white text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#e5e5e5] hover:shadow-md transition-all">
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 slide-in min-h-0">
        <form onSubmit={handleSearch} className="w-full max-w-4xl mb-6">
          <div className="relative flex items-center group">
            <div className="absolute left-4 z-10">
              <Search className="w-5 h-5 text-[#888] group-focus-within:text-[#e5e5e5] transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-12 pr-16 py-4 text-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all hover:border-[#3a3a3a]"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="absolute right-2 p-2 bg-[#2a2a2a] rounded-full hover:bg-[#3a3a3a] hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Search"
            >
              <ArrowUp className="w-5 h-5 text-[#888] group-focus-within:text-[#e5e5e5] transition-colors" />
            </button>
          </div>
        </form>

        {/* Recent Activity Card */}
        <div className="w-full max-w-4xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-8 hover-lift hover:border-[#3a3a3a] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#e5e5e5] mb-1">Atom</h3>
              <p className="text-sm text-[#888]">New edit approved by Grok</p>
            </div>
            <span className="text-sm text-[#666]">41 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[#1a1a1a] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#888]">
            Articles Available: <span className="text-[#e5e5e5] font-medium">1,089,057</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-[#666]">
            <a href="#" className="hover:text-[#e5e5e5] transition-colors px-2 py-1 rounded hover:bg-[#1a1a1a]">Terms of Service</a>
            <span className="text-[#444]">•</span>
            <a href="#" className="hover:text-[#e5e5e5] transition-colors px-2 py-1 rounded hover:bg-[#1a1a1a]">Privacy Policy</a>
            <span className="text-[#444]">•</span>
            <a href="#" className="hover:text-[#e5e5e5] transition-colors px-2 py-1 rounded hover:bg-[#1a1a1a]">AUP</a>
          </div>
        </div>
      </div>
    </div>
  );
}

