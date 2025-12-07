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
}

export function CitationGraph({ graph }: CitationGraphProps) {
  const chartData = useMemo(() => {
    const sourceNodes = graph.nodes.filter(n => n.type === 'source');
    
    // Group by domain
    const domainData: Record<string, { domain: string; count: number; avgReliability: number }> = {};
    
    sourceNodes.forEach(node => {
      const domain = node.domain || 'unknown';
      if (!domainData[domain]) {
        domainData[domain] = { domain, count: 0, avgReliability: 0 };
      }
      domainData[domain].count += 1;
      domainData[domain].avgReliability += node.reliability || 0;
    });
    
    return Object.values(domainData).map(d => ({
      ...d,
      avgReliability: d.avgReliability / d.count,
    })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [graph]);

  const sourceTypeData = useMemo(() => {
    const sourceNodes = graph.nodes.filter(n => n.type === 'source');
    const typeCounts: Record<string, number> = {};
    
    sourceNodes.forEach(node => {
      const type = node.sourceType || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
    }));
  }, [graph]);

  // Custom tooltip and styling for dark theme
  const CustomTooltip = ({ active, payload }: any) => {
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

  return (
    <div className="space-y-6">
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
            <Tooltip content={<CustomTooltip />} />
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
            <Tooltip content={<CustomTooltip />} />
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

