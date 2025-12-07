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
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Quality Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Quality</p>
              <p className={`text-3xl font-bold mt-2 ${getQualityColor(qualityScores.overallQuality)}`}>
                {(qualityScores.overallQuality * 100).toFixed(0)}%
              </p>
            </div>
            {qualityScores.overallQuality >= 0.7 ? (
              <TrendingUp className="w-8 h-8 text-green-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600" />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Source Reliability</p>
            <p className={`text-3xl font-bold mt-2 ${getQualityColor(qualityScores.sourceReliability)}`}>
              {(qualityScores.sourceReliability * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Diversity Score</p>
            <p className={`text-3xl font-bold mt-2 ${getQualityColor(diversityMetrics.overallDiversity)}`}>
              {(diversityMetrics.overallDiversity * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Citation Count</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">
              {(qualityScores.citationCountScore * 10).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Bias Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Bias & Diversity Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Source Concentration</p>
            <p className="text-2xl font-bold mt-1">
              {(biasMetrics.sourceConcentration * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Single Cluster Risk</p>
            <p className="text-2xl font-bold mt-1">
              {(biasMetrics.singleClusterRisk * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unique Domains</p>
            <p className="text-2xl font-bold mt-1">
              {diversityMetrics.uniqueDomains}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Source Types</p>
            <p className="text-2xl font-bold mt-1">
              {diversityMetrics.uniqueSourceTypes}
            </p>
          </div>
        </div>
        {biasMetrics.topDomain && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Top domain: <span className="font-medium">{biasMetrics.topDomain}</span> ({biasMetrics.topDomainPercentage * 100}% of citations)
            </p>
          </div>
        )}
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
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
                    <p className="font-medium capitalize">{flag.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm mt-1">{flag.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

