"""Graph-theoretic analysis module for bias detection and citation quality"""
import networkx as nx
from typing import Dict, List, Tuple, Optional
import config
import utils


class GraphAnalyzer:
    """Analyze citation graphs for bias, diversity, and quality issues"""
    
    def __init__(self, graph: nx.DiGraph):
        self.graph = graph
        # Cache for computed metrics to avoid recalculation
        self._bias_metrics_cache: Optional[Dict] = None
        self._diversity_metrics_cache: Optional[Dict] = None
        self._quality_scores_cache: Optional[Dict] = None
        self._source_nodes_cache: Optional[List] = None
    
    def _get_source_nodes(self) -> List:
        """Get source nodes with caching"""
        if self._source_nodes_cache is None:
            self._source_nodes_cache = [
                n for n in self.graph.nodes()
                if self.graph.nodes[n].get("node_type") == "source"
            ]
        return self._source_nodes_cache
    
    def analyze(self) -> Dict:
        """Run comprehensive graph analysis"""
        # Calculate all metrics once
        bias_metrics = self._calculate_bias_metrics()
        diversity_metrics = self._calculate_diversity_metrics()
        quality_scores = self._calculate_quality_scores()
        
        # Use cached metrics for dependent calculations
        red_flags = self._detect_red_flags(bias_metrics, quality_scores)
        recommendations = self._generate_recommendations(bias_metrics, diversity_metrics, quality_scores, red_flags)
        
        return {
            "bias_metrics": bias_metrics,
            "diversity_metrics": diversity_metrics,
            "red_flags": red_flags,
            "quality_scores": quality_scores,
            "recommendations": recommendations
        }
    
    def _calculate_bias_metrics(self) -> Dict:
        """Calculate bias and concentration metrics (with caching)"""
        if self._bias_metrics_cache is not None:
            return self._bias_metrics_cache
        
        source_nodes = self._get_source_nodes()
        
        if not source_nodes:
            return {
                "source_concentration": 0.0,
                "single_cluster_risk": 0.0,
                "top_domain_percentage": 0.0,
                "ideological_cluster_score": 0.0
            }
        
        # Domain concentration
        domains = [
            self.graph.nodes[n].get("domain", "unknown")
            for n in source_nodes
        ]
        domain_counts = {}
        for domain in domains:
            domain_counts[domain] = domain_counts.get(domain, 0) + 1
        
        total = len(domains)
        if total > 0:
            max_domain_count = max(domain_counts.values())
            top_domain_percentage = max_domain_count / total
        else:
            top_domain_percentage = 0.0
        
        # Source type concentration
        source_types = [
            self.graph.nodes[n].get("source_type", "other")
            for n in source_nodes
        ]
        type_counts = {}
        for stype in source_types:
            type_counts[stype] = type_counts.get(stype, 0) + 1
        
        if total > 0:
            max_type_count = max(type_counts.values())
            single_cluster_risk = max_type_count / total
        else:
            single_cluster_risk = 0.0
        
        # Overall concentration score
        source_concentration = (top_domain_percentage + single_cluster_risk) / 2
        
        return {
            "source_concentration": source_concentration,
            "single_cluster_risk": single_cluster_risk,
            "top_domain_percentage": top_domain_percentage,
            "top_domain": max(domain_counts.items(), key=lambda x: x[1])[0] if domain_counts else None,
            "domain_distribution": domain_counts,
            "source_type_distribution": type_counts,
            "ideological_cluster_score": single_cluster_risk  # Simplified for MVP
        }
        
        # Cache the result
        self._bias_metrics_cache = result
        return result
    
    def _calculate_diversity_metrics(self) -> Dict:
        """Calculate citation diversity scores (with caching)"""
        if self._diversity_metrics_cache is not None:
            return self._diversity_metrics_cache
        
        source_nodes = self._get_source_nodes()
        
        if not source_nodes:
            return {
                "domain_diversity": 0.0,
                "source_type_diversity": 0.0,
                "reliability_diversity": 0.0,
                "overall_diversity": 0.0
            }
        
        domains = [self.graph.nodes[n].get("domain", "") for n in source_nodes]
        source_types = [self.graph.nodes[n].get("source_type", "other") for n in source_nodes]
        reliabilities = [self.graph.nodes[n].get("reliability", 0.5) for n in source_nodes]
        
        # Domain diversity
        unique_domains = len(set(domains))
        domain_diversity = unique_domains / len(domains) if domains else 0.0
        
        # Source type diversity
        unique_types = len(set(source_types))
        source_type_diversity = unique_types / len(source_types) if source_types else 0.0
        
        # Reliability diversity (variance in reliability scores)
        if reliabilities:
            avg_reliability = sum(reliabilities) / len(reliabilities)
            reliability_variance = sum((r - avg_reliability) ** 2 for r in reliabilities) / len(reliabilities)
            reliability_diversity = min(1.0, reliability_variance * 4)  # Normalize
        else:
            reliability_diversity = 0.0
        
        # Overall diversity (weighted average)
        overall_diversity = (
            domain_diversity * 0.4 +
            source_type_diversity * 0.4 +
            reliability_diversity * 0.2
        )
        
        return {
            "domain_diversity": domain_diversity,
            "source_type_diversity": source_type_diversity,
            "reliability_diversity": reliability_diversity,
            "overall_diversity": overall_diversity,
            "unique_domains": unique_domains,
            "unique_source_types": unique_types
        }
        
        # Cache the result
        self._diversity_metrics_cache = result
        return result
    
    def _detect_red_flags(self, bias_metrics: Optional[Dict] = None, quality_scores: Optional[Dict] = None) -> List[Dict]:
        """Detect red flag indicators (accepts pre-computed metrics to avoid recalculation)"""
        red_flags = []
        
        source_nodes = self._get_source_nodes()
        
        # Use provided metrics or calculate if not provided
        if bias_metrics is None:
            bias_metrics = self._calculate_bias_metrics()
        if quality_scores is None:
            quality_scores = self._calculate_quality_scores()
        
        if len(source_nodes) < config.MIN_CITATIONS:
            red_flags.append({
                "type": "insufficient_citations",
                "severity": "high",
                "message": f"Article has only {len(source_nodes)} citations (minimum recommended: {config.MIN_CITATIONS})"
            })
        
        # Check for low-reliability sources
        low_reliability_sources = [
            n for n in source_nodes
            if self.graph.nodes[n].get("reliability", 0.5) < 0.4
        ]
        if len(low_reliability_sources) > len(source_nodes) * 0.5:
            red_flags.append({
                "type": "low_reliability_dominance",
                "severity": "medium",
                "message": f"Over 50% of citations are from low-reliability sources"
            })
        
        # Check source concentration (using provided metrics)
        if bias_metrics["source_concentration"] > config.BIAS_THRESHOLD:
            red_flags.append({
                "type": "high_source_concentration",
                "severity": "high",
                "message": f"Over {config.BIAS_THRESHOLD*100}% of citations from top domain: {bias_metrics.get('top_domain', 'unknown')}"
            })
        
        if bias_metrics["single_cluster_risk"] > config.CLUSTER_RISK_THRESHOLD:
            red_flags.append({
                "type": "single_cluster_risk",
                "severity": "high",
                "message": f"Over {config.CLUSTER_RISK_THRESHOLD*100}% of citations from single source type cluster"
            })
        
        # Check for missing viewpoint diversity
        source_types = [
            self.graph.nodes[n].get("source_type", "other")
            for n in source_nodes
        ]
        required_types = ["academic", "government", "news"]
        missing_types = [t for t in required_types if t not in source_types]
        if missing_types:
            red_flags.append({
                "type": "missing_viewpoint_diversity",
                "severity": "medium",
                "message": f"Missing citations from: {', '.join(missing_types)}"
            })
        
        return red_flags
    
    def _calculate_quality_scores(self) -> Dict:
        """Calculate overall quality scores"""
        source_nodes = [
            n for n in self.graph.nodes()
            if self.graph.nodes[n].get("node_type") == "source"
        ]
        
        if not source_nodes:
            return {
                "citation_quality": 0.0,
                "source_reliability": 0.0,
                "diversity_score": 0.0,
                "overall_quality": 0.0
            }
        
        # Average reliability
        reliabilities = [
            self.graph.nodes[n].get("reliability", 0.5)
            for n in source_nodes
        ]
        source_reliability = sum(reliabilities) / len(reliabilities)
        
        # Diversity score (use cached if available)
        diversity_metrics = self._calculate_diversity_metrics()
        diversity_score = diversity_metrics["overall_diversity"]
        
        # Citation count score (normalized)
        citation_count = len(source_nodes)
        citation_count_score = min(1.0, citation_count / 10.0)  # 10 citations = perfect score
        
        # Overall quality (weighted)
        overall_quality = (
            source_reliability * 0.4 +
            diversity_score * 0.3 +
            citation_count_score * 0.3
        )
        
        return {
            "citation_quality": overall_quality,
            "source_reliability": source_reliability,
            "diversity_score": diversity_score,
            "citation_count_score": citation_count_score,
            "overall_quality": overall_quality
        }
        
        # Cache the result
        self._quality_scores_cache = result
        return result
    
    def _generate_recommendations(
        self, 
        bias_metrics: Optional[Dict] = None,
        diversity_metrics: Optional[Dict] = None,
        quality_scores: Optional[Dict] = None,
        red_flags: Optional[List[Dict]] = None
    ) -> List[str]:
        """Generate high-level recommendations (accepts pre-computed metrics to avoid recalculation)"""
        recommendations = []
        
        # Use provided metrics or calculate if not provided
        if bias_metrics is None:
            bias_metrics = self._calculate_bias_metrics()
        if diversity_metrics is None:
            diversity_metrics = self._calculate_diversity_metrics()
        if quality_scores is None:
            quality_scores = self._calculate_quality_scores()
        if red_flags is None:
            red_flags = self._detect_red_flags(bias_metrics, quality_scores)
        
        if quality_scores["overall_quality"] < 0.6:
            recommendations.append("Overall citation quality is below recommended standards. Consider adding more diverse, high-reliability sources.")
        
        if bias_metrics["source_concentration"] > 0.5:
            recommendations.append(f"High concentration from {bias_metrics.get('top_domain', 'one domain')}. Diversify sources across multiple domains.")
        
        if diversity_metrics["source_type_diversity"] < 0.5:
            recommendations.append("Limited source type diversity. Add citations from academic, government, and NGO sources for balance.")
        
        if quality_scores["source_reliability"] < 0.6:
            recommendations.append("Average source reliability is low. Replace low-reliability sources with more authoritative ones.")
        
        missing_types = []
        source_nodes = self._get_source_nodes()
        source_types = set([
            self.graph.nodes[n].get("source_type", "other")
            for n in source_nodes
        ])
        for req_type in ["academic", "government"]:
            if req_type not in source_types:
                missing_types.append(req_type)
        
        if missing_types:
            recommendations.append(f"Add citations from {', '.join(missing_types)} sources to improve credibility.")
        
        return recommendations

