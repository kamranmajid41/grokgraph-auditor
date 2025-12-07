import type { AnalysisResults, RedFlag } from '../types';
import { AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

interface AuditDashboardProps {
  results: AnalysisResults;
}

export function AuditDashboard({ results }: AuditDashboardProps) {
  const { biasMetrics, diversityMetrics, qualityScores, redFlags, recommendations } = results;

  const getSeverityColor = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-900/20 border-red-800';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'low':
        return 'text-blue-400 bg-blue-900/20 border-blue-800';
      default:
        return 'text-gray-400 bg-gray-800/20 border-gray-800';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Quality Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a] hover-lift hover:border-[#3a3a3a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#888]">Overall Quality</p>
              <p className={`text-3xl font-bold mt-2 ${getQualityColor(qualityScores.overallQuality)}`}>
                {(qualityScores.overallQuality * 100).toFixed(0)}%
              </p>
            </div>
            {qualityScores.overallQuality >= 0.7 ? (
              <TrendingUp className="w-8 h-8 text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-400" />
            )}
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
          <div>
              <p className="text-sm text-[#888]">Source Reliability</p>
            <p className={`text-3xl font-bold mt-2 ${getQualityColor(qualityScores.sourceReliability)}`}>
              {(qualityScores.sourceReliability * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
          <div>
              <p className="text-sm text-[#888]">Diversity Score</p>
            <p className={`text-3xl font-bold mt-2 ${getQualityColor(diversityMetrics.overallDiversity)}`}>
              {(diversityMetrics.overallDiversity * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
          <div>
              <p className="text-sm text-[#888]">Citation Count</p>
            <p className="text-3xl font-bold mt-2 text-[#e5e5e5]">
              {(qualityScores.citationCountScore * 10).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Bias Metrics */}
      <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a] hover-lift hover:border-[#3a3a3a]">
        <h3 className="text-lg font-semibold mb-4 text-[#e5e5e5]">Bias & Diversity Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
              <p className="text-sm text-[#888]">Source Concentration</p>
            <p className="text-2xl font-bold mt-1 text-[#e5e5e5]">
              {(biasMetrics.sourceConcentration * 100).toFixed(1)}%
            </p>
          </div>
          <div>
              <p className="text-sm text-[#888]">Single Cluster Risk</p>
            <p className="text-2xl font-bold mt-1">
              {(biasMetrics.singleClusterRisk * 100).toFixed(1)}%
            </p>
          </div>
          <div>
              <p className="text-sm text-[#888]">Unique Domains</p>
            <p className="text-2xl font-bold mt-1 text-[#e5e5e5]">
              {diversityMetrics.uniqueDomains}
            </p>
          </div>
          <div>
              <p className="text-sm text-[#888]">Source Types</p>
            <p className="text-2xl font-bold mt-1 text-[#e5e5e5]">
              {diversityMetrics.uniqueSourceTypes}
            </p>
          </div>
        </div>
        {biasMetrics.topDomain && (
          <div className="mt-4 p-3 bg-[#2a2a2a] rounded">
              <p className="text-sm text-[#888]">
              Top domain: <span className="font-medium text-[#e5e5e5]">{biasMetrics.topDomain}</span> ({biasMetrics.topDomainPercentage * 100}% of citations)
            </p>
          </div>
        )}
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a] hover-lift hover:border-[#3a3a3a]">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-[#e5e5e5]">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            Red Flags ({redFlags.length})
          </h3>
          <div className="space-y-3">
            {redFlags.map((flag, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(flag.severity)}`}
              >
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium capitalize text-[#e5e5e5]">{flag.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm mt-1 text-[#888]">{flag.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a] hover-lift hover:border-[#3a3a3a]">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-[#e5e5e5]">
            <Info className="w-5 h-5 mr-2 text-blue-400" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-[#888]">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

