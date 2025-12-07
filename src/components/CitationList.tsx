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
  academic: 'text-green-600 bg-green-50',
  government: 'text-blue-600 bg-blue-50',
  news: 'text-purple-600 bg-purple-50',
  ngo: 'text-orange-600 bg-orange-50',
  blog: 'text-gray-600 bg-gray-50',
  social: 'text-pink-600 bg-pink-50',
  other: 'text-gray-600 bg-gray-50',
};

export function CitationList({ citations, onCitationClick }: CitationListProps) {
  if (citations.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
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
            className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onCitationClick?.(citation)}
          >
            <div className={`p-2 rounded-lg ${colorClass} mr-4`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {citation.text}
                </h3>
                <span className="ml-2 text-xs text-gray-500">
                  {(citation.reliability * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                <span className="capitalize">{citation.sourceType}</span>
                <span>•</span>
                <span className="truncate">{citation.domain}</span>
              </div>
              
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
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

