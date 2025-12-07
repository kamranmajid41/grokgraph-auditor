import { useState, useMemo } from 'react';
import type { Citation } from '../types';
import { ExternalLink, GraduationCap, Building2, Newspaper, Users, MessageSquare, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

interface CitationListProps {
  citations: Citation[];
  onCitationClick?: (citation: Citation) => void;
  itemsPerPage?: number;
}

const sourceTypeIcons = {
  academic: GraduationCap,
  government: Building2,
  news: Newspaper,
  ngo: Users,
  blog: MessageSquare,
  social: MessageSquare,
  other: Globe,
};

const sourceTypeColors = {
  academic: 'text-green-400 bg-green-900/20',
  government: 'text-blue-400 bg-blue-900/20',
  news: 'text-purple-400 bg-purple-900/20',
  ngo: 'text-orange-400 bg-orange-900/20',
  blog: 'text-gray-400 bg-gray-800/20',
  social: 'text-pink-400 bg-pink-900/20',
  other: 'text-gray-400 bg-gray-800/20',
};

const DEFAULT_ITEMS_PER_PAGE = 20;

export function CitationList({ citations, onCitationClick, itemsPerPage = DEFAULT_ITEMS_PER_PAGE }: CitationListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedCitations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return citations.slice(startIndex, endIndex);
  }, [citations, currentPage, itemsPerPage]);
  
  const totalPages = useMemo(() => {
    return Math.ceil(citations.length / itemsPerPage);
  }, [citations.length, itemsPerPage]);
  
  if (citations.length === 0) {
    return (
      <div className="text-[#888] text-center py-8">
        No citations found in this article.
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };
  
  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedCitations.map((citation, index) => {
        const Icon = sourceTypeIcons[citation.sourceType] || Globe;
        const colorClass = sourceTypeColors[citation.sourceType] || sourceTypeColors.other;
        
        return (
          <div
            key={index}
            className="flex items-start p-4 border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] hover:border-[#3a3a3a] cursor-pointer transition-all hover-lift group"
            onClick={() => onCitationClick?.(citation)}
          >
            <div className={`p-2 rounded-lg ${colorClass} mr-4 group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#e5e5e5] truncate">
                  {citation.text}
                </h3>
                <span className="ml-2 text-xs text-[#888]">
                  {(citation.reliability * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="mt-1 flex items-center space-x-3 text-xs text-[#888]">
                <span className="capitalize">{citation.sourceType}</span>
                <span>•</span>
                <span className="truncate">{citation.domain}</span>
              </div>
              
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-flex items-center text-xs text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                {citation.url}
              </a>
            </div>
          </div>
        );
        })}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
          <div className="text-sm text-[#888]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, citations.length)} of {citations.length} citations
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-[#e5e5e5]" />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageClick(pageNum)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#2a2a2a] text-[#e5e5e5] border border-[#3a3a3a]'
                        : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-[#e5e5e5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

