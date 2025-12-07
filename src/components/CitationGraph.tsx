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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Citation Distribution by Domain</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="domain" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Citations" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Source Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={sourceTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#10b981" name="Count" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

