# Quick Start Guide

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure API key:**
```bash
cp .env.example .env
# Edit .env and add your XAI_API_KEY
```

## Basic Usage

### Analyze a GrokiPedia article by URL:
```bash
python main.py --url "https://grokipedia.com/article/topic"
```

### Analyze by topic name:
```bash
python main.py --topic "Climate Change"
```

### Analysis-only mode (skip Grok API):
```bash
python main.py --url "..." --skip-grok
```

### Custom output directory:
```bash
python main.py --url "..." --output-dir ./my-reports
```

### JSON-only output:
```bash
python main.py --url "..." --format json
```

## Output Files

After running, you'll find in the output directory:

- **edit_proposal.json** - Ready-to-submit GrokiPedia edit package
- **summary_report.md** - Human-readable analysis report
- **citation_graph.html** - Interactive graph visualization (if enabled)

## Understanding the Output

### Quality Scores
- **Overall Quality**: Composite score (0-1) based on reliability, diversity, and citation count
- **Source Reliability**: Average reliability of all cited sources
- **Diversity Score**: How diverse the citation sources are

### Red Flags
- **Insufficient Citations**: Article has too few citations
- **Low Reliability Dominance**: Too many low-quality sources
- **High Source Concentration**: Over-reliance on single domain
- **Single Cluster Risk**: All citations from similar source types
- **Missing Viewpoint Diversity**: Lacks citations from key source types

### Recommendations
The system provides actionable recommendations for:
- Adding diverse, high-reliability citations
- Improving source type balance
- Replacing low-quality sources

## Troubleshooting

### "XAI_API_KEY not set"
- Make sure you've created `.env` file with your API key
- Or set environment variable: `export XAI_API_KEY=your_key`

### "Failed to fetch article"
- Check that the URL is correct and accessible
- GrokiPedia may require authentication or have rate limits

### "Error with Grok API"
- Verify your API key is valid
- Check API rate limits
- Use `--skip-grok` to run analysis-only mode

## Next Steps

1. Review the `summary_report.md` for insights
2. Check `edit_proposal.json` for structured edit data
3. Open `citation_graph.html` to visualize citation relationships
4. Submit recommended edits to GrokiPedia

