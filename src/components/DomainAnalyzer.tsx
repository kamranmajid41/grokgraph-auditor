import { useState } from 'react';
import type { DomainAnalysis } from '../types';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Globe } from 'lucide-react';

interface DomainAnalyzerProps {
  analysis: DomainAnalysis;
}

export function DomainAnalyzer({ analysis }: DomainAnalyzerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getMetricColor = (value: number, threshold: number = 0.5) => {
    if (value >= threshold) return 'text-green-400';
    if (value >= threshold * 0.7) return 'text-yellow-400';
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
            <div className="p-2 bg-[#2a2a2a] rounded">
              <Globe className="w-5 h-5 text-[#e5e5e5]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[#e5e5e5] truncate">
                {analysis.domain}
              </h4>
              <div className="flex items-center space-x-3 mt-1 text-xs text-[#888]">
                <span>{analysis.citationCount} citation{analysis.citationCount !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span className={getMetricColor(analysis.averageReliability)}>
                  {(analysis.averageReliability * 100).toFixed(0)}% avg reliability
                </span>
                <span>•</span>
                <span>{analysis.sourceTypes.length} source type{analysis.sourceTypes.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {analysis.issues.length > 0 && (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
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
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#2a2a2a] p-3 rounded">
              <div className="text-xs text-[#888] mb-1">Concentration</div>
              <div className={`text-lg font-bold ${getMetricColor(analysis.metrics.concentration, 0.3)}`}>
                {(analysis.metrics.concentration * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-[#2a2a2a] p-3 rounded">
              <div className="text-xs text-[#888] mb-1">Diversity</div>
              <div className={`text-lg font-bold ${getMetricColor(analysis.metrics.diversity)}`}>
                {(analysis.metrics.diversity * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-[#2a2a2a] p-3 rounded">
              <div className="text-xs text-[#888] mb-1">Quality</div>
              <div className={`text-lg font-bold ${getMetricColor(analysis.metrics.quality)}`}>
                {(analysis.metrics.quality * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          {/* Source Types */}
          <div>
            <h5 className="text-sm font-medium text-[#e5e5e5] mb-2">Source Types</h5>
            <div className="flex flex-wrap gap-2">
              {analysis.sourceTypes.map((type, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-[#2a2a2a] text-[#888] capitalize">
                  {type}
                </span>
              ))}
            </div>
          </div>
          
          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-yellow-400 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Issues
              </h5>
              <ul className="space-y-1">
                {analysis.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-[#888] flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Recommendations
              </h5>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-[#888] flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
