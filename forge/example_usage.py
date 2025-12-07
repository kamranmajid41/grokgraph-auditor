"""Example usage of Citation Graph Auditor"""
from article_ingester import ArticleIngester
from graph_builder import CitationGraphBuilder
from graph_analyzer import GraphAnalyzer
from output_generator import OutputGenerator
import config


def example_analysis_only():
    """Example: Run analysis without Grok API"""
    print("Example: Analysis-only mode")
    print("=" * 60)
    
    # Initialize components
    ingester = ArticleIngester()
    graph_builder = CitationGraphBuilder()
    
    # For demo purposes, you would use a real GrokiPedia URL
    # url = "https://grokipedia.com/article/example-topic"
    # article_data = ingester.fetch_article(url)
    
    # Build graph
    # graph = graph_builder.build_graph(article_data)
    # analyzer = GraphAnalyzer(graph)
    # results = analyzer.analyze()
    
    # Print results
    # print(f"Quality: {results['quality_scores']['overall_quality']:.1%}")
    # print(f"Red flags: {len(results['red_flags'])}")
    
    print("See main.py for full usage examples")


def example_with_grok():
    """Example: Full pipeline with Grok integration"""
    print("Example: Full pipeline with Grok")
    print("=" * 60)
    print("Run: python main.py --url <grokipedia-url>")
    print("Or:  python main.py --topic 'Climate Change'")


if __name__ == "__main__":
    print("Citation Graph Auditor - Example Usage")
    print()
    example_analysis_only()
    print()
    example_with_grok()

