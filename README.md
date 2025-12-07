# GrokiPedia - Citation Graph Auditor

A Vite React application that clones GrokiPedia with graph-theoretic fact-checking, bias analysis, and citation diversification capabilities.

## Features

- **Article Generation**: Create articles on any topic using Grok AI
- **Citation Extraction**: Automatically extract and classify citations from article content
- **Graph Analysis**: Build citation graphs and analyze source relationships
- **Bias Detection**: Identify source concentration, ideological clustering, and missing viewpoints
- **Quality Scoring**: Calculate reliability scores, diversity metrics, and overall quality
- **Visual Dashboards**: Interactive charts and graphs showing citation distribution
- **Recommendations**: Get actionable suggestions for improving citation diversity

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **TanStack Query** for data fetching
- **xAI Grok API** for article generation and analysis
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kamranmajid41/grokgraph-auditor.git
cd grokgraph-auditor
```

2. Install dependencies:
```bash
npm install
```

3. The Grok API key is already configured in the code. If you need to change it, edit `src/services/grokApi.ts`.

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Usage

1. **Search or Create Article**: Enter a topic in the search bar on the home page
2. **View Article**: Read the generated article with extracted citations
3. **Analyze Citations**: Switch to the "Analysis" tab to see bias metrics and quality scores
4. **View Graph**: Check the "Graph" tab for visual citation distribution

## Project Structure

```
grokgraph-auditor/
├── src/
│   ├── components/       # React components
│   │   ├── Header.tsx
│   │   ├── ArticleView.tsx
│   │   ├── ArticleContent.tsx
│   │   ├── CitationList.tsx
│   │   ├── CitationGraph.tsx
│   │   └── AuditDashboard.tsx
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   └── ArticlePage.tsx
│   ├── services/         # API services
│   │   └── grokApi.ts
│   ├── hooks/            # Custom React hooks
│   │   └── useArticle.ts
│   ├── utils/            # Utility functions
│   │   └── citationUtils.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

## Key Features Explained

### Citation Extraction
The system automatically extracts citations from article content using multiple patterns:
- Markdown links: `[text](url)`
- HTML links: `<a href="url">text</a>`
- Bare URLs: `https://example.com`

### Source Classification
Citations are classified into categories:
- **Academic**: .edu domains, scholarly sources
- **Government**: .gov domains, official sources
- **News**: News media, press sources
- **NGO**: .org domains, nonprofit organizations
- **Blog**: Personal blogs, Medium, Substack
- **Social**: Twitter, Facebook, Reddit
- **Other**: Unclassified sources

### Reliability Scoring
Each citation receives a reliability score (0-1) based on:
- Source type (academic > government > news > blog > social)
- Domain trust indicators (.edu, .gov, .org)
- Suspicious patterns (blogspot, wordpress, etc.)

### Graph Analysis
The citation graph analysis computes:
- **Bias Metrics**: Source concentration, single cluster risk
- **Diversity Metrics**: Domain diversity, source type diversity
- **Quality Scores**: Overall quality, reliability, citation count
- **Red Flags**: Insufficient citations, low reliability, missing viewpoints

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## API Configuration

The Grok API is configured in `src/services/grokApi.ts`. The API key is currently hardcoded. For production, consider using environment variables.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
