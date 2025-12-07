import type { Citation } from '../types';
import { ExternalLink, GraduationCap, Building2, Newspaper, Users, MessageSquare, Globe } from 'lucide-react';

interface CitationListProps {
  citations: Citation[];
  onCitationClick?: (citation: Citation) => void;
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

export function CitationList({ citations, onCitationClick }: CitationListProps) {
  if (citations.length === 0) {
    return (
      <div className="text-[#888] text-center py-8">
        No citations found in this article.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {citations.map((citation, index) => {
        const Icon = sourceTypeIcons[citation.sourceType] || Globe;
        const colorClass = sourceTypeColors[citation.sourceType] || sourceTypeColors.other;
        
        return (
          <div
            key={index}
            className="flex items-start p-4 border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] cursor-pointer transition-colors"
            onClick={() => onCitationClick?.(citation)}
          >
            <div className={`p-2 rounded-lg ${colorClass} mr-4`}>
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
  );
}

