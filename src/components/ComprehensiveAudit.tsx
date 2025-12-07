import { useState } from 'react';
import type { AnalysisResults, Article } from '../types';
import { CitationAnalyzer } from './CitationAnalyzer';
import { DomainAnalyzer } from './DomainAnalyzer';
import { SourceTypeAnalyzer } from './SourceTypeAnalyzer';
import { FileText, Globe, Tag, BarChart3, AlertTriangle } from 'lucide-react';

interface ComprehensiveAuditProps {
  article: Article;
  analysis: AnalysisResults;
}

export function ComprehensiveAudit({ analysis }: ComprehensiveAuditProps) {
  const [activeTab, setActiveTab] = useState<'citations' | 'domains' | 'sourceTypes' | 'summary'>('summary');
  
  const citationAnalyses = analysis.citationAnalyses || [];
  const domainAnalyses = analysis.domainAnalyses || [];
  const sourceTypeAnalyses = analysis.sourceTypeAnalyses || [];
  
  // Calculate summary statistics
  const avgCitationScore = citationAnalyses.length > 0
    ? citationAnalyses.reduce((sum, a) => sum + a.score, 0) / citationAnalyses.length
    : 0;
  
  const highQualityCitations = citationAnalyses.filter(a => a.score >= 80).length;
  const lowQualityCitations = citationAnalyses.filter(a => a.score < 60).length;
  
  const problematicDomains = domainAnalyses.filter(d => d.issues.length > 0).length;
  const problematicSourceTypes = sourceTypeAnalyses.filter(s => s.issues.length > 0).length;
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
              activeTab === 'summary'
                ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('citations')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
              activeTab === 'citations'
                ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Citations ({citationAnalyses.length})
          </button>
          <button
            onClick={() => setActiveTab('domains')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
              activeTab === 'domains'
                ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
            }`}
          >
            <Globe className="w-4 h-4 mr-2" />
            Domains ({domainAnalyses.length})
          </button>
          <button
            onClick={() => setActiveTab('sourceTypes')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center ${
              activeTab === 'sourceTypes'
                ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
            }`}
          >
            <Tag className="w-4 h-4 mr-2" />
            Source Types ({sourceTypeAnalyses.length})
          </button>
        </div>
      </div>
      
      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#888] mb-1">Avg Citation Score</div>
              <div className={`text-2xl font-bold ${avgCitationScore >= 80 ? 'text-green-400' : avgCitationScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {avgCitationScore.toFixed(0)}
              </div>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#888] mb-1">High Quality</div>
              <div className="text-2xl font-bold text-green-400">
                {highQualityCitations}
              </div>
              <div className="text-xs text-[#888] mt-1">
                {citationAnalyses.length > 0 ? ((highQualityCitations / citationAnalyses.length) * 100).toFixed(0) : 0}% of citations
              </div>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#888] mb-1">Low Quality</div>
              <div className="text-2xl font-bold text-red-400">
                {lowQualityCitations}
              </div>
              <div className="text-xs text-[#888] mt-1">
                {citationAnalyses.length > 0 ? ((lowQualityCitations / citationAnalyses.length) * 100).toFixed(0) : 0}% of citations
              </div>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#888] mb-1">Problematic Areas</div>
              <div className="text-2xl font-bold text-yellow-400">
                {problematicDomains + problematicSourceTypes}
              </div>
              <div className="text-xs text-[#888] mt-1">
                {problematicDomains} domains, {problematicSourceTypes} source types
              </div>
            </div>
          </div>
          
          {/* Top Issues */}
          {(analysis.redFlags.length > 0 || problematicDomains > 0 || problematicSourceTypes > 0) && (
            <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-[#e5e5e5]">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                Key Issues
              </h3>
              <div className="space-y-3">
                {analysis.redFlags.slice(0, 5).map((flag, i) => (
                  <div key={i} className="p-3 bg-[#2a2a2a] rounded border-l-4 border-yellow-400">
                    <div className="text-sm font-medium text-[#e5e5e5] capitalize mb-1">
                      {flag.type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-[#888]">{flag.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
              <h4 className="text-sm font-medium text-[#e5e5e5] mb-3">Domain Distribution</h4>
              <div className="space-y-2">
                {domainAnalyses.slice(0, 5).map((domain, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-[#888] truncate flex-1">{domain.domain}</span>
                    <span className="text-xs text-[#e5e5e5] ml-2">{domain.citationCount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
              <h4 className="text-sm font-medium text-[#e5e5e5] mb-3">Source Type Distribution</h4>
              <div className="space-y-2">
                {sourceTypeAnalyses.map((sourceType, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-[#888] capitalize">{sourceType.sourceType}</span>
                    <span className="text-xs text-[#e5e5e5] ml-2">{sourceType.citationCount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Citations Tab */}
      {activeTab === 'citations' && (
        <div className="space-y-3">
          {citationAnalyses.length === 0 ? (
            <div className="text-center py-8 text-[#888]">No citation analyses available</div>
          ) : (
            citationAnalyses.map((citationAnalysis, index) => (
              <CitationAnalyzer key={index} analysis={citationAnalysis} index={index} />
            ))
          )}
        </div>
      )}
      
      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="space-y-3">
          {domainAnalyses.length === 0 ? (
            <div className="text-center py-8 text-[#888]">No domain analyses available</div>
          ) : (
            domainAnalyses.map((domainAnalysis, index) => (
              <DomainAnalyzer key={index} analysis={domainAnalysis} />
            ))
          )}
        </div>
      )}
      
      {/* Source Types Tab */}
      {activeTab === 'sourceTypes' && (
        <div className="space-y-3">
          {sourceTypeAnalyses.length === 0 ? (
            <div className="text-center py-8 text-[#888]">No source type analyses available</div>
          ) : (
            sourceTypeAnalyses.map((sourceTypeAnalysis, index) => (
              <SourceTypeAnalyzer key={index} analysis={sourceTypeAnalysis} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
