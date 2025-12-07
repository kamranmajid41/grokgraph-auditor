"""Citation graph builder module"""
import networkx as nx
from typing import Dict, List, Optional
import config
import utils


class CitationGraphBuilder:
    """Build weighted citation graphs from article data"""
    
    def __init__(self):
        self.graph = nx.DiGraph()
    
    def build_graph(self, article_data: Dict) -> nx.DiGraph:
        """Build citation graph from article data"""
        self.graph = nx.DiGraph()
        
        article_id = article_data["url"]
        citations = article_data.get("citations", [])
        
        # Add article node
        self.graph.add_node(
            article_id,
            node_type="article",
            title=article_data.get("title", ""),
            word_count=article_data.get("word_count", 0),
            citation_count=len(citations)
        )
        
        # Add source nodes and edges
        for citation in citations:
            source_id = citation["url"]
            
            # Add source node if not exists
            if not self.graph.has_node(source_id):
                self.graph.add_node(
                    source_id,
                    node_type="source",
                    domain=citation.get("domain", ""),
                    source_type=citation.get("source_type", "other"),
                    reliability=citation.get("reliability", 0.5)
                )
            
            # Calculate edge weight
            weight = self._calculate_edge_weight(citation, article_data)
            
            # Add edge: article -> source
            self.graph.add_edge(
                article_id,
                source_id,
                weight=weight,
                citation_text=citation.get("text", "")
            )
        
        return self.graph
    
    def _calculate_edge_weight(self, citation: Dict, article_data: Dict) -> float:
        """Calculate edge weight based on reliability and diversity signals"""
        base_weight = citation.get("reliability", 0.5)
        
        # Boost for domain diversity
        all_domains = [c.get("domain", "") for c in article_data.get("citations", [])]
        diversity = utils.calculate_diversity_score(all_domains)
        diversity_boost = diversity * 0.2
        
        # Boost for source type diversity
        source_types = [c.get("source_type", "other") for c in article_data.get("citations", [])]
        unique_types = len(set(source_types))
        type_boost = min(0.1, unique_types * 0.02)
        
        # Final weight
        weight = base_weight + diversity_boost + type_boost
        return min(1.0, max(0.0, weight))
    
    def get_graph_stats(self) -> Dict:
        """Get basic graph statistics"""
        if not self.graph:
            return {}
        
        nodes = list(self.graph.nodes())
        edges = list(self.graph.edges())
        
        # Count node types
        article_nodes = [n for n in nodes if self.graph.nodes[n].get("node_type") == "article"]
        source_nodes = [n for n in nodes if self.graph.nodes[n].get("node_type") == "source"]
        
        # Count source types
        source_type_counts = {}
        for node in source_nodes:
            source_type = self.graph.nodes[node].get("source_type", "other")
            source_type_counts[source_type] = source_type_counts.get(source_type, 0) + 1
        
        # Calculate average reliability
        reliabilities = [
            self.graph.nodes[n].get("reliability", 0.5)
            for n in source_nodes
        ]
        avg_reliability = sum(reliabilities) / len(reliabilities) if reliabilities else 0.0
        
        return {
            "total_nodes": len(nodes),
            "article_nodes": len(article_nodes),
            "source_nodes": len(source_nodes),
            "total_edges": len(edges),
            "source_type_distribution": source_type_counts,
            "average_reliability": avg_reliability,
            "graph_density": nx.density(self.graph) if len(nodes) > 1 else 0.0
        }
    
    def get_source_clusters(self) -> Dict[str, List[str]]:
        """Group sources by domain and source type"""
        clusters = {}
        
        for node in self.graph.nodes():
            node_data = self.graph.nodes[node]
            if node_data.get("node_type") == "source":
                domain = node_data.get("domain", "unknown")
                source_type = node_data.get("source_type", "other")
                
                # Create cluster key
                cluster_key = f"{source_type}:{domain}"
                
                if cluster_key not in clusters:
                    clusters[cluster_key] = []
                clusters[cluster_key].append(node)
        
        return clusters

