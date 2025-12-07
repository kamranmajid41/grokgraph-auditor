import type { CitationGraph as GraphType } from '../types';
import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CitationGraphProps {
  graph: GraphType;
  maxDomains?: number; // Limit number of domains shown
  maxSourceTypes?: number; // Limit number of source types shown
}

const DEFAULT_MAX_DOMAINS = 15;
const DEFAULT_MAX_SOURCE_TYPES = 10;
const LARGE_GRAPH_THRESHOLD = 50; // Consider graph large if more than 50 nodes

export function CitationGraph({ graph, maxDomains = DEFAULT_MAX_DOMAINS, maxSourceTypes = DEFAULT_MAX_SOURCE_TYPES }: CitationGraphProps) {
  const isLargeGraph = graph.nodes.length > LARGE_GRAPH_THRESHOLD;
  
  const chartData = useMemo(() => {
    const sourceNodes = graph.nodes.filter(n => n.type === 'source');
    
    if (sourceNodes.length === 0) return [];
    
    // Group by domain (optimized for large graphs)
    const domainData: Record<string, { domain: string; count: number; avgReliability: number; reliabilitySum: number }> = {};
    
    // Single pass aggregation
    for (const node of sourceNodes) {
      const domain = node.domain || 'unknown';
      if (!domainData[domain]) {
        domainData[domain] = { domain, count: 0, avgReliability: 0, reliabilitySum: 0 };
      }
      domainData[domain].count += 1;
      domainData[domain].reliabilitySum += node.reliability || 0;
    }
    
    // Calculate averages and sort
    const result = Object.values(domainData).map(d => ({
      domain: d.domain,
      count: d.count,
      avgReliability: d.reliabilitySum / d.count,
    })).sort((a, b) => b.count - a.count);
    
    // For large graphs, limit and add "Others" category
    if (isLargeGraph && result.length > maxDomains) {
      const topDomains = result.slice(0, maxDomains - 1);
      const others = result.slice(maxDomains - 1);
      const othersCount = others.reduce((sum, d) => sum + d.count, 0);
      const othersAvgReliability = others.reduce((sum, d) => sum + d.avgReliability * d.count, 0) / othersCount;
      
      return [
        ...topDomains,
        {
          domain: `Others (${others.length} more)`,
          count: othersCount,
          avgReliability: othersAvgReliability,
        }
      ];
    }
    
    return result.slice(0, maxDomains);
  }, [graph, maxDomains, isLargeGraph]);

  const sourceTypeData = useMemo(() => {
    const sourceNodes = graph.nodes.filter(n => n.type === 'source');
    if (sourceNodes.length === 0) return [];
    
    const typeCounts: Record<string, number> = {};
    
    // Single pass aggregation
    for (const node of sourceNodes) {
      const type = node.sourceType || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    const result = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count);
    
    // Limit for large graphs
    return result.slice(0, maxSourceTypes);
  }, [graph, maxSourceTypes]);
  
  // Memoize tooltip component to prevent re-renders
  const CustomTooltip = useMemo(() => {
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 shadow-lg">
            <p className="text-[#e5e5e5] font-medium">{payload[0].name}</p>
            <p className="text-[#888] text-sm">
              {payload[0].value} {payload[0].name === 'Citations' ? 'citations' : 'sources'}
            </p>
          </div>
        );
      }
      return null;
    };
  }, []);

  return (
    <div className="space-y-6">
      {isLargeGraph && (
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 text-sm text-blue-300">
          <p className="font-medium mb-1">Large Graph Detected</p>
          <p className="text-blue-400/80">
            Showing top {maxDomains} domains and {maxSourceTypes} source types for performance. 
            Total nodes: {graph.nodes.length}
          </p>
        </div>
      )}
      <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a] hover-lift">
        <h3 className="text-lg font-semibold mb-4 text-[#e5e5e5]">Citation Distribution by Domain</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis 
              dataKey="domain" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <Tooltip content={CustomTooltip} />
            <Legend 
              wrapperStyle={{ color: '#e5e5e5' }}
              iconType="square"
            />
            <Bar 
              dataKey="count" 
              fill="#3b82f6" 
              name="Citations"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a] hover-lift">
        <h3 className="text-lg font-semibold mb-4 text-[#e5e5e5]">Source Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={sourceTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis 
              dataKey="type" 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <Tooltip content={CustomTooltip} />
            <Legend 
              wrapperStyle={{ color: '#e5e5e5' }}
              iconType="square"
            />
            <Bar 
              dataKey="count" 
              fill="#10b981" 
              name="Count"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

