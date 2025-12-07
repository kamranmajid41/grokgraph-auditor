# Citation Graph Auditor for GrokiPedia

Graph-theoretic fact-checking, bias analysis, and citation diversification tool for GrokiPedia articles.

## Features

- **Article Ingestion**: Extract article text, citations, and metadata from GrokiPedia
- **Citation Graph Building**: Create weighted graphs of article-source relationships
- **Graph Analysis**: Compute bias metrics, diversity scores, and red flag indicators
- **AI-Powered Suggestions**: Generate citation fixes and bias-neutral rewrites using Grok
- **Export Ready**: Output JSON edit proposals and human-readable reports

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your XAI_API_KEY
```

3. Run the auditor:
```bash
python main.py --url "https://grokipedia.com/article/topic"
# or
python main.py --topic "Climate Change"
```

## Project Structure

```
forge/
├── main.py                 # CLI entry point
├── config.py              # Configuration settings
├── article_ingester.py    # Extract articles and citations
├── graph_builder.py       # Build citation graphs
├── graph_analyzer.py      # Graph-theoretic analysis
├── grok_integration.py    # xAI API integration
├── output_generator.py    # Generate reports and proposals
├── utils.py               # Helper functions
└── requirements.txt       # Python dependencies
```

## Usage Examples

### Basic Analysis
```bash
python main.py --url "https://grokipedia.com/article/example"
```

### With Custom Output
```bash
python main.py --url "..." --output-dir ./reports --format both
```

### Batch Processing
```bash
python main.py --batch urls.txt
```

## Output

The tool generates:
- `edit_proposal.json`: Ready-to-submit GrokiPedia edit package
- `summary_report.md`: Human-readable analysis summary
- `citation_graph.html`: Interactive graph visualization (optional)

## Stretch Goals

See the main project documentation for planned features including:
- Ideological cluster detection
- Cross-article consistency checking
- Real-time citation updates
- Visual dashboards
- Editor collaboration UI

