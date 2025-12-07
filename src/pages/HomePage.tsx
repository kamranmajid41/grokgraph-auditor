import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Moon, ArrowUp } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Star background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-baseline">
            <h1 className="text-4xl font-serif text-[#e5e5e5]">Grokipedia</h1>
            <span className="ml-2 text-xs text-[#888] font-sans">v0.2</span>
          </div>
          <div className="flex items-center space-x-4">
            <Moon className="w-5 h-5 text-[#888] cursor-pointer hover:text-[#e5e5e5]" />
            <button className="px-4 py-2 bg-white text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#e5e5e5]">
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
        <form onSubmit={handleSearch} className="w-full max-w-4xl mb-6">
          <div className="relative flex items-center">
            <div className="absolute left-4">
              <Search className="w-5 h-5 text-[#888]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-12 pr-16 py-4 text-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:ring-2 focus:ring-[#3a3a3a] focus:border-[#3a3a3a] focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 p-2 bg-[#2a2a2a] rounded-full hover:bg-[#3a3a3a] transition-colors"
            >
              <ArrowUp className="w-5 h-5 text-[#888]" />
            </button>
          </div>
        </form>

        {/* Recent Activity Card */}
        <div className="w-full max-w-4xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-8">
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
      <div className="relative z-10 border-t border-[#1a1a1a] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="text-sm text-[#888]">
            Articles Available: <span className="text-[#e5e5e5]">1,089,057</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-[#666]">
            <a href="#" className="hover:text-[#e5e5e5] transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-[#e5e5e5] transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-[#e5e5e5] transition-colors">AUP</a>
          </div>
        </div>
      </div>
    </div>
  );
}

