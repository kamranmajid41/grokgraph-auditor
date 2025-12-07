"""Main CLI entry point for Citation Graph Auditor"""
import click
from pathlib import Path
import sys

from article_ingester import ArticleIngester
from graph_builder import CitationGraphBuilder
from graph_analyzer import GraphAnalyzer
from grok_integration import GrokIntegration
from output_generator import OutputGenerator
import config


@click.command()
@click.option('--url', type=str, help='GrokiPedia article URL')
@click.option('--topic', type=str, help='Article topic name')
@click.option('--output-dir', type=str, default=None, help='Output directory (default: forge/output)')
@click.option('--format', type=click.Choice(['json', 'markdown', 'both']), default='both', help='Output format')
@click.option('--no-viz', is_flag=True, help='Disable graph visualization')
@click.option('--skip-grok', is_flag=True, help='Skip Grok API calls (analysis only)')
def main(url, topic, output_dir, format, no_viz, skip_grok):
    """Citation Graph Auditor for GrokiPedia - Graph-theoretic fact-checking and citation diversification"""
    
    # Validate input
    if not url and not topic:
        click.echo("Error: Must provide either --url or --topic", err=True)
        sys.exit(1)
    
    # Set output directory
    if output_dir:
        output_path = Path(output_dir)
    else:
        output_path = config.OUTPUT_DIR
    
    # Disable visualization if requested
    if no_viz:
        config.ENABLE_VISUALIZATION = False
    
    click.echo("=" * 60)
    click.echo("Citation Graph Auditor for GrokiPedia")
    click.echo("=" * 60)
    click.echo()
    
    # Step 1: Article Ingestion
    click.echo("Step 1: Ingesting article...")
    ingester = ArticleIngester()
    
    if url:
        article_data = ingester.fetch_article(url)
    else:
        article_data = ingester.fetch_by_topic(topic)
    
    if not article_data:
        click.echo("Error: Failed to fetch article", err=True)
        sys.exit(1)
    
    click.echo(f"✓ Article: {article_data.get('title', 'Unknown')}")
    click.echo(f"✓ Found {len(article_data.get('citations', []))} citations")
    click.echo()
    
    # Step 2: Build Citation Graph
    click.echo("Step 2: Building citation graph...")
    graph_builder = CitationGraphBuilder()
    graph = graph_builder.build_graph(article_data)
    stats = graph_builder.get_graph_stats()
    
    click.echo(f"✓ Graph: {stats.get('total_nodes', 0)} nodes, {stats.get('total_edges', 0)} edges")
    click.echo(f"✓ Source types: {', '.join(stats.get('source_type_distribution', {}).keys())}")
    click.echo()
    
    # Step 3: Graph Analysis
    click.echo("Step 3: Running graph-theoretic analysis...")
    analyzer = GraphAnalyzer(graph)
    analysis_results = analyzer.analyze()
    
    quality = analysis_results.get("quality_scores", {}).get("overall_quality", 0)
    red_flags_count = len(analysis_results.get("red_flags", []))
    
    click.echo(f"✓ Overall quality: {quality:.1%}")
    click.echo(f"✓ Red flags detected: {red_flags_count}")
    click.echo()
    
    # Step 4: Grok Integration (if enabled)
    citation_suggestions = []
    rewrites = []
    explanation = ""
    
    if not skip_grok:
        try:
            click.echo("Step 4: Generating AI-powered suggestions...")
            grok = GrokIntegration()
            
            # Generate citation suggestions
            click.echo("  → Generating citation suggestions...")
            citation_suggestions = grok.generate_citation_suggestions(
                article_data,
                analysis_results
            )
            click.echo(f"  ✓ Generated {len(citation_suggestions)} citation suggestions")
            
            # Generate rewrites
            click.echo("  → Generating bias-neutral rewrites...")
            rewrites = grok.generate_bias_neutral_rewrites(
                article_data,
                analysis_results
            )
            click.echo(f"  ✓ Generated {len(rewrites)} rewrite suggestions")
            
            # Generate explanation
            click.echo("  → Generating explanation...")
            explanation = grok.generate_explanation(
                article_data,
                analysis_results,
                citation_suggestions
            )
            click.echo("  ✓ Explanation generated")
            click.echo()
            
        except Exception as e:
            click.echo(f"  ⚠ Error with Grok API: {e}", err=True)
            click.echo("  Continuing with analysis-only output...")
            explanation = "Grok API integration unavailable. See analysis results below."
            click.echo()
    else:
        click.echo("Step 4: Skipping Grok API calls (analysis only)")
        explanation = "Analysis completed without AI suggestions. See recommendations below."
        click.echo()
    
    # Step 5: Generate Output
    click.echo("Step 5: Generating output files...")
    output_gen = OutputGenerator(output_path)
    
    outputs = []
    
    if format in ['json', 'both']:
        proposal_path = output_gen.generate_edit_proposal(
            article_data,
            analysis_results,
            citation_suggestions,
            rewrites,
            explanation
        )
        outputs.append(proposal_path)
        click.echo(f"  ✓ Edit proposal: {proposal_path}")
    
    if format in ['markdown', 'both']:
        report_path = output_gen.generate_summary_report(
            article_data,
            analysis_results,
            citation_suggestions,
            rewrites,
            explanation
        )
        outputs.append(report_path)
        click.echo(f"  ✓ Summary report: {report_path}")
    
    if config.ENABLE_VISUALIZATION and not no_viz:
        viz_path = output_gen.generate_visualization(
            graph,
            article_data
        )
        if viz_path:
            outputs.append(viz_path)
            click.echo(f"  ✓ Graph visualization: {viz_path}")
    
    click.echo()
    click.echo("=" * 60)
    click.echo("Analysis Complete!")
    click.echo("=" * 60)
    click.echo()
    click.echo("Output files:")
    for output in outputs:
        click.echo(f"  • {output}")
    click.echo()
    click.echo("Next steps:")
    click.echo("  1. Review the summary report")
    click.echo("  2. Check the edit proposal JSON")
    click.echo("  3. Submit edits to GrokiPedia")
    click.echo()


if __name__ == "__main__":
    main()

