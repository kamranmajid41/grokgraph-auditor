import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/article?topic=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-baseline">
            <h1 className="text-2xl font-serif text-[#e5e5e5] tracking-tight">Grokipedia</h1>
            <span className="ml-2 text-xs text-[#888] font-sans font-medium">v0.2</span>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-8">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all hover:border-[#3a3a3a]"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666] w-5 h-5 group-focus-within:text-[#e5e5e5] transition-colors pointer-events-none" />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}

