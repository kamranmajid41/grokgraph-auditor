"""xAI API (Grok) integration for generating edit suggestions"""
from openai import OpenAI
from typing import Dict, List, Optional
import json
import config
import utils


class GrokIntegration:
    """Interface with xAI API to generate citation fixes and rewrites"""
    
    def __init__(self):
        if not config.XAI_API_KEY:
            raise ValueError("XAI_API_KEY not set in environment variables")
        
        self.client = OpenAI(
            api_key=config.XAI_API_KEY,
            base_url=config.XAI_API_BASE
        )
        self.model = config.XAI_MODEL
    
    def generate_citation_suggestions(
        self,
        article_data: Dict,
        analysis_results: Dict
    ) -> List[Dict]:
        """Generate 5-10 new high-quality citation suggestions"""
        
        prompt = self._build_citation_suggestion_prompt(article_data, analysis_results)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a citation expert helping improve GrokiPedia articles with diverse, reliable sources."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            suggestions_text = response.choices[0].message.content
            return self._parse_citation_suggestions(suggestions_text, article_data)
            
        except Exception as e:
            print(f"Error generating citation suggestions: {e}")
            return []
    
    def generate_bias_neutral_rewrites(
        self,
        article_data: Dict,
        analysis_results: Dict
    ) -> List[Dict]:
        """Generate bias-neutral paragraph rewrites"""
        
        prompt = self._build_rewrite_prompt(article_data, analysis_results)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an editor helping rewrite GrokiPedia content to be more neutral and well-cited."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=3000
            )
            
            rewrites_text = response.choices[0].message.content
            return self._parse_rewrites(rewrites_text)
            
        except Exception as e:
            print(f"Error generating rewrites: {e}")
            return []
    
    def generate_explanation(
        self,
        article_data: Dict,
        analysis_results: Dict,
        suggestions: List[Dict]
    ) -> str:
        """Generate traceable reasoning explanation"""
        
        prompt = self._build_explanation_prompt(article_data, analysis_results, suggestions)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert explaining citation analysis and recommendations in clear, actionable terms."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return "Explanation generation failed."
    
    def _build_citation_suggestion_prompt(
        self,
        article_data: Dict,
        analysis_results: Dict
    ) -> str:
        """Build prompt for citation suggestions"""
        
        existing_citations = article_data.get("citations", [])
        bias_metrics = analysis_results.get("bias_metrics", {})
        diversity_metrics = analysis_results.get("diversity_metrics", {})
        red_flags = analysis_results.get("red_flags", [])
        
        prompt = f"""Analyze this GrokiPedia article and suggest 5-10 new high-quality citations to improve diversity and reliability.

Article Title: {article_data.get('title', 'Unknown')}
Topic: {article_data.get('title', 'Unknown')}

Current Citation Analysis:
- Total citations: {len(existing_citations)}
- Source concentration: {bias_metrics.get('source_concentration', 0):.2%}
- Top domain: {bias_metrics.get('top_domain', 'N/A')}
- Diversity score: {diversity_metrics.get('overall_diversity', 0):.2%}
- Source types present: {', '.join(set(c.get('source_type', 'other') for c in existing_citations))}

Issues Detected:
{chr(10).join(f"- {flag.get('message', '')}" for flag in red_flags[:5])}

Current Citations:
{chr(10).join(f"- [{c.get('source_type', 'other')}] {c.get('domain', 'unknown')}: {c.get('url', '')}" for c in existing_citations[:10])}

Please suggest 5-10 new citations that:
1. Come from diverse, high-reliability sources (academic, government, reputable news)
2. Fill gaps in source type diversity
3. Provide different viewpoints on the topic
4. Are recent and relevant

Format your response as JSON array with this structure:
[
  {{
    "url": "https://example.com/source",
    "title": "Source Title",
    "source_type": "academic|government|news|ngo",
    "reason": "Why this source improves diversity/reliability",
    "reliability_score": 0.0-1.0,
    "recency": "2024 or recent"
  }}
]

Return ONLY valid JSON, no markdown formatting."""
        
        return prompt
    
    def _build_rewrite_prompt(
        self,
        article_data: Dict,
        analysis_results: Dict
    ) -> str:
        """Build prompt for bias-neutral rewrites"""
        
        content = article_data.get("content", "")[:2000]  # Limit content length
        bias_metrics = analysis_results.get("bias_metrics", {})
        
        prompt = f"""Rewrite specific paragraphs from this GrokiPedia article to be more neutral and better cited.

Article Title: {article_data.get('title', 'Unknown')}

Bias Analysis:
- Source concentration: {bias_metrics.get('source_concentration', 0):.2%}
- Single cluster risk: {bias_metrics.get('single_cluster_risk', 0):.2%}

Article Content (excerpt):
{content}

Identify 2-3 paragraphs that:
1. Show ideological bias or loaded language
2. Lack proper citations
3. Could benefit from more neutral wording

For each paragraph, provide:
- Original paragraph
- Rewritten version (more neutral, better cited)
- Explanation of changes

Format as JSON array:
[
  {{
    "original": "original paragraph text",
    "rewritten": "rewritten paragraph text",
    "explanation": "why changes were made",
    "suggested_citations": ["url1", "url2"]
  }}
]

Return ONLY valid JSON, no markdown formatting."""
        
        return prompt
    
    def _build_explanation_prompt(
        self,
        article_data: Dict,
        analysis_results: Dict,
        suggestions: List[Dict]
    ) -> str:
        """Build prompt for explanation generation"""
        
        bias_metrics = analysis_results.get("bias_metrics", {})
        quality_scores = analysis_results.get("quality_scores", {})
        recommendations = analysis_results.get("recommendations", [])
        
        prompt = f"""Explain the citation analysis and recommendations for this GrokiPedia article in clear, actionable terms.

Article: {article_data.get('title', 'Unknown')}

Key Findings:
- Overall quality: {quality_scores.get('overall_quality', 0):.2%}
- Source concentration: {bias_metrics.get('source_concentration', 0):.2%}
- Top domain: {bias_metrics.get('top_domain', 'N/A')}

Recommendations:
{chr(10).join(f"- {rec}" for rec in recommendations)}

Suggested Citations: {len(suggestions)}

Provide a clear explanation that:
1. Summarizes the main issues found
2. Explains why they matter (bias, reliability, diversity)
3. Describes how the suggested citations address these issues
4. Makes it easy for editors to understand and act on

Write in a professional but accessible tone, suitable for GrokiPedia editors."""
        
        return prompt
    
    def _parse_citation_suggestions(
        self,
        suggestions_text: str,
        article_data: Dict
    ) -> List[Dict]:
        """Parse citation suggestions from Grok response"""
        suggestions = []
        
        try:
            # Try to extract JSON from response
            # Remove markdown code blocks if present
            text = suggestions_text.strip()
            if text.startswith("```"):
                # Extract JSON from code block
                lines = text.split("\n")
                text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            
            # Parse JSON
            parsed = json.loads(text)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict) and "url" in item:
                        # Enrich with metadata
                        item["source_type"] = item.get("source_type", utils.classify_source_type(item["url"]))
                        item["domain"] = utils.normalize_domain(item["url"])
                        item["reliability"] = item.get("reliability_score", utils.calculate_reliability_score(
                            item["url"],
                            item["source_type"]
                        ))
                        suggestions.append(item)
        except json.JSONDecodeError:
            # Fallback: try to extract URLs and basic info
            import re
            urls = re.findall(r'https?://[^\s<>"\'\)]+', suggestions_text)
            for url in urls[:10]:
                suggestions.append({
                    "url": url,
                    "title": "Suggested Source",
                    "source_type": utils.classify_source_type(url),
                    "domain": utils.normalize_domain(url),
                    "reliability": utils.calculate_reliability_score(
                        url,
                        utils.classify_source_type(url)
                    ),
                    "reason": "AI-suggested citation"
                })
        
        return suggestions
    
    def _parse_rewrites(self, rewrites_text: str) -> List[Dict]:
        """Parse rewrite suggestions from Grok response"""
        rewrites = []
        
        try:
            # Try to extract JSON from response
            text = rewrites_text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            
            parsed = json.loads(text)
            if isinstance(parsed, list):
                rewrites = parsed
        except json.JSONDecodeError:
            # Fallback: return empty list
            pass
        
        return rewrites

