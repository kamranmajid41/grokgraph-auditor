"""Output generator for edit proposals and reports"""
import json
from pathlib import Path
from typing import Dict, List
from datetime import datetime
import config
try:
    import plotly.graph_objects as go
    import plotly.express as px
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False


class OutputGenerator:
    """Generate JSON edit proposals, reports, and visualizations"""
    
    def __init__(self, output_dir: Path = None):
        self.output_dir = output_dir or config.OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_edit_proposal(
        self,
        article_data: Dict,
        analysis_results: Dict,
        citation_suggestions: List[Dict],
        rewrites: List[Dict],
        explanation: str,
        filename: str = "edit_proposal.json"
    ) -> Path:
        """Generate JSON edit proposal ready for GrokiPedia submission"""
        
        proposal = {
            "metadata": {
                "article_url": article_data.get("url", ""),
                "article_title": article_data.get("title", ""),
                "generated_at": datetime.now().isoformat(),
                "tool_version": "1.0.0"
            },
            "analysis_summary": {
                "overall_quality": analysis_results.get("quality_scores", {}).get("overall_quality", 0.0),
                "citation_count": len(article_data.get("citations", [])),
                "red_flags_count": len(analysis_results.get("red_flags", [])),
                "diversity_score": analysis_results.get("diversity_metrics", {}).get("overall_diversity", 0.0)
            },
            "recommended_citations": citation_suggestions,
            "recommended_rewrites": rewrites,
            "explanation": explanation,
            "edit_instructions": self._generate_edit_instructions(
                citation_suggestions,
                rewrites
            )
        }
        
        output_path = self.output_dir / filename
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(proposal, f, indent=2, ensure_ascii=False)
        
        return output_path
    
    def generate_summary_report(
        self,
        article_data: Dict,
        analysis_results: Dict,
        citation_suggestions: List[Dict],
        rewrites: List[Dict],
        explanation: str,
        filename: str = "summary_report.md"
    ) -> Path:
        """Generate human-readable markdown summary report"""
        
        report_lines = [
            "# Citation Graph Audit Report",
            "",
            f"**Article:** {article_data.get('title', 'Unknown')}",
            f"**URL:** {article_data.get('url', 'N/A')}",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "---",
            "",
            "## Executive Summary",
            "",
            explanation,
            "",
            "---",
            "",
            "## Analysis Results",
            "",
            "### Quality Scores",
            ""
        ]
        
        quality_scores = analysis_results.get("quality_scores", {})
        report_lines.extend([
            f"- **Overall Quality:** {quality_scores.get('overall_quality', 0):.1%}",
            f"- **Source Reliability:** {quality_scores.get('source_reliability', 0):.1%}",
            f"- **Diversity Score:** {quality_scores.get('diversity_score', 0):.1%}",
            f"- **Citation Count Score:** {quality_scores.get('citation_count_score', 0):.1%}",
            ""
        ])
        
        bias_metrics = analysis_results.get("bias_metrics", {})
        report_lines.extend([
            "### Bias & Diversity Metrics",
            "",
            f"- **Source Concentration:** {bias_metrics.get('source_concentration', 0):.1%}",
            f"- **Single Cluster Risk:** {bias_metrics.get('single_cluster_risk', 0):.1%}",
            f"- **Top Domain:** {bias_metrics.get('top_domain', 'N/A')}",
            f"- **Domain Diversity:** {analysis_results.get('diversity_metrics', {}).get('domain_diversity', 0):.1%}",
            ""
        ])
        
        red_flags = analysis_results.get("red_flags", [])
        if red_flags:
            report_lines.extend([
                "### Red Flags",
                ""
            ])
            for flag in red_flags:
                report_lines.append(
                    f"- **[{flag.get('severity', 'unknown').upper()}]** {flag.get('message', '')}"
                )
            report_lines.append("")
        
        recommendations = analysis_results.get("recommendations", [])
        if recommendations:
            report_lines.extend([
                "### Recommendations",
                ""
            ])
            for i, rec in enumerate(recommendations, 1):
                report_lines.append(f"{i}. {rec}")
            report_lines.append("")
        
        if citation_suggestions:
            report_lines.extend([
                "---",
                "",
                "## Recommended Citations",
                "",
                f"The following {len(citation_suggestions)} citations are recommended to improve diversity and reliability:",
                ""
            ])
            for i, cit in enumerate(citation_suggestions, 1):
                report_lines.extend([
                    f"### {i}. {cit.get('title', cit.get('url', 'Unknown'))}",
                    "",
                    f"- **URL:** {cit.get('url', 'N/A')}",
                    f"- **Source Type:** {cit.get('source_type', 'unknown')}",
                    f"- **Reliability:** {cit.get('reliability', 0):.1%}",
                    f"- **Reason:** {cit.get('reason', 'Improves citation diversity')}",
                    ""
                ])
        
        if rewrites:
            report_lines.extend([
                "---",
                "",
                "## Recommended Rewrites",
                ""
            ])
            for i, rewrite in enumerate(rewrites, 1):
                report_lines.extend([
                    f"### Rewrite {i}",
                    "",
                    "**Original:**",
                    "",
                    f"> {rewrite.get('original', '')}",
                    "",
                    "**Rewritten:**",
                    "",
                    f"> {rewrite.get('rewritten', '')}",
                    "",
                    f"**Explanation:** {rewrite.get('explanation', '')}",
                    ""
                ])
        
        report_lines.extend([
            "---",
            "",
            "## Next Steps",
            "",
            "1. Review the recommended citations and verify their relevance",
            "2. Add the suggested citations to the article",
            "3. Consider applying the recommended rewrites for improved neutrality",
            "4. Submit the edits through the GrokiPedia submission portal",
            ""
        ])
        
        output_path = self.output_dir / filename
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(report_lines))
        
        return output_path
    
    def generate_visualization(
        self,
        graph,
        article_data: Dict,
        filename: str = "citation_graph.html"
    ) -> Optional[Path]:
        """Generate interactive graph visualization"""
        if not PLOTLY_AVAILABLE or not config.ENABLE_VISUALIZATION:
            return None
        
        try:
            import networkx as nx
            
            # Prepare node positions
            pos = nx.spring_layout(graph, k=1, iterations=50)
            
            # Separate nodes by type
            article_nodes = [
                n for n in graph.nodes()
                if graph.nodes[n].get("node_type") == "article"
            ]
            source_nodes = [
                n for n in graph.nodes()
                if graph.nodes[n].get("node_type") == "source"
            ]
            
            # Create edge traces
            edge_x = []
            edge_y = []
            for edge in graph.edges():
                x0, y0 = pos[edge[0]]
                x1, y1 = pos[edge[1]]
                edge_x.extend([x0, x1, None])
                edge_y.extend([y0, y1, None])
            
            edge_trace = go.Scatter(
                x=edge_x, y=edge_y,
                line=dict(width=0.5, color='#888'),
                hoverinfo='none',
                mode='lines'
            )
            
            # Create source node traces
            source_x = [pos[node][0] for node in source_nodes]
            source_y = [pos[node][1] for node in source_nodes]
            source_text = [
                f"{graph.nodes[node].get('domain', 'unknown')}<br>"
                f"Type: {graph.nodes[node].get('source_type', 'other')}<br>"
                f"Reliability: {graph.nodes[node].get('reliability', 0):.2f}"
                for node in source_nodes
            ]
            
            source_trace = go.Scatter(
                x=source_x, y=source_y,
                mode='markers',
                hoverinfo='text',
                text=source_text,
                marker=dict(
                    size=10,
                    color=[graph.nodes[node].get('reliability', 0.5) for node in source_nodes],
                    colorscale='Viridis',
                    showscale=True,
                    colorbar=dict(title="Reliability")
                ),
                name='Sources'
            )
            
            # Create article node trace
            if article_nodes:
                article_x = [pos[node][0] for node in article_nodes]
                article_y = [pos[node][1] for node in article_nodes]
                article_text = [
                    f"{graph.nodes[node].get('title', 'Article')}<br>"
                    f"Citations: {graph.nodes[node].get('citation_count', 0)}"
                    for node in article_nodes
                ]
                
                article_trace = go.Scatter(
                    x=article_x, y=article_y,
                    mode='markers',
                    hoverinfo='text',
                    text=article_text,
                    marker=dict(
                        size=20,
                        color='red',
                        symbol='star'
                    ),
                    name='Article'
                )
            
            # Create figure
            fig = go.Figure(
                data=[edge_trace, source_trace] + ([article_trace] if article_nodes else []),
                layout=go.Layout(
                    title=f"Citation Graph: {article_data.get('title', 'Article')}",
                    showlegend=True,
                    hovermode='closest',
                    margin=dict(b=20, l=5, r=5, t=40),
                    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
                )
            )
            
            output_path = self.output_dir / filename
            fig.write_html(str(output_path))
            return output_path
            
        except Exception as e:
            print(f"Error generating visualization: {e}")
            return None
    
    def _generate_edit_instructions(
        self,
        citation_suggestions: List[Dict],
        rewrites: List[Dict]
    ) -> str:
        """Generate human-readable edit instructions"""
        instructions = []
        
        if citation_suggestions:
            instructions.append(f"Add {len(citation_suggestions)} new citations:")
            for i, cit in enumerate(citation_suggestions, 1):
                instructions.append(
                    f"  {i}. Add citation to: {cit.get('url', 'N/A')} "
                    f"({cit.get('reason', 'Improves diversity')})"
                )
        
        if rewrites:
            instructions.append(f"\nApply {len(rewrites)} paragraph rewrites:")
            for i, rewrite in enumerate(rewrites, 1):
                instructions.append(
                    f"  {i}. Replace paragraph with rewritten version "
                    f"(see 'recommended_rewrites' section)"
                )
        
        return "\n".join(instructions)

