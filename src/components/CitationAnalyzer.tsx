import { useState } from 'react';
import type { CitationAnalysis } from '../types';
import { ExternalLink, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface CitationAnalyzerProps {
  analysis: CitationAnalysis;
  index: number;
}

export function CitationAnalyzer({ analysis }: CitationAnalyzerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score.toFixed(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-[#e5e5e5] truncate">
                  {analysis.citation.text || analysis.citation.url}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2a2a2a] text-[#888] capitalize">
                  {analysis.citation.sourceType}
                </span>
              </div>
              <div className="flex items-center space-x-3 mt-1 text-xs text-[#888]">
                <span>{analysis.citation.domain}</span>
                <span>•</span>
                <span>Rank #{analysis.context.domainRank} domain</span>
                <span>•</span>
                <span>#{analysis.context.positionInArticle} citation</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {analysis.strengths.length > analysis.weaknesses.length ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : analysis.weaknesses.length > 0 ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : null}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#888]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#888]" />
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#2a2a2a] pt-4">
          {/* Reliability Breakdown */}
          <div className="bg-[#2a2a2a] p-3 rounded">
            <h5 className="text-sm font-medium text-[#e5e5e5] mb-2">Reliability Breakdown</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888]">Base Score ({analysis.citation.sourceType}):</span>
                <span className="text-[#e5e5e5]">{(analysis.reliabilityBreakdown.baseScore * 100).toFixed(0)}%</span>
              </div>
              {analysis.reliabilityBreakdown.domainBoost > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Domain Boost:</span>
                  <span>+{(analysis.reliabilityBreakdown.domainBoost * 100).toFixed(0)}%</span>
                </div>
              )}
              {analysis.reliabilityBreakdown.penalties > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Penalties:</span>
                  <span>-{(analysis.reliabilityBreakdown.penalties * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-[#3a3a3a]">
                <span className="text-[#e5e5e5] font-medium">Final Score:</span>
                <span className={`font-bold ${getScoreColor(analysis.reliabilityBreakdown.finalScore * 100)}`}>
                  {(analysis.reliabilityBreakdown.finalScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-green-400 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Strengths
              </h5>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, i) => (
                  <li key={i} className="text-xs text-[#888] flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Weaknesses
              </h5>
              <ul className="space-y-1">
                {analysis.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-xs text-[#888] flex items-start">
                    <span className="text-red-400 mr-2">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-yellow-400 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Recommendations
              </h5>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-[#888] flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Link */}
          <a
            href={analysis.citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Source
          </a>
        </div>
      )}
    </div>
  );
}
