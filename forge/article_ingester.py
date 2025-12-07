"""Article ingestion module for extracting GrokiPedia articles and citations"""
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import re
import config
import utils


class ArticleIngester:
    """Extract article content, citations, and metadata from GrokiPedia"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CitationGraphAuditor/1.0'
        })
    
    def fetch_article(self, url: str) -> Optional[Dict]:
        """Fetch article from GrokiPedia URL"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return self._parse_article(response.text, url)
        except Exception as e:
            print(f"Error fetching article: {e}")
            return None
    
    def fetch_by_topic(self, topic: str) -> Optional[Dict]:
        """Fetch article by topic name (searches GrokiPedia)"""
        # For MVP, assume topic maps to URL pattern
        # In production, would use GrokiPedia search API
        url = f"{config.GROKIPEDIA_BASE_URL}/article/{topic.replace(' ', '_')}"
        return self.fetch_article(url)
    
    def _parse_article(self, html: str, url: str) -> Dict:
        """Parse HTML content to extract article data"""
        soup = BeautifulSoup(html, 'lxml')
        
        # Extract title
        title = self._extract_title(soup)
        
        # Extract main content
        content = self._extract_content(soup)
        
        # Extract citations
        citations = self._extract_citations(soup, content)
        
        # Extract metadata
        metadata = self._extract_metadata(soup, url)
        
        return {
            "url": url,
            "title": title,
            "content": content,
            "citations": citations,
            "metadata": metadata,
            "word_count": len(content.split()),
            "citation_count": len(citations)
        }
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract article title"""
        # Try various title selectors
        title_selectors = [
            'h1.article-title',
            'h1',
            '.title',
            'title'
        ]
        
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        
        return "Untitled Article"
    
    def _extract_content(self, soup: BeautifulSoup) -> str:
        """Extract main article content"""
        # Try various content selectors
        content_selectors = [
            '.article-content',
            '.main-content',
            'article',
            '.content',
            'main'
        ]
        
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element:
                # Remove script and style elements
                for script in element(["script", "style", "nav", "footer", "header"]):
                    script.decompose()
                return element.get_text(separator='\n', strip=True)
        
        # Fallback: get body text
        body = soup.find('body')
        if body:
            for script in body(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            return body.get_text(separator='\n', strip=True)
        
        return ""
    
    def _extract_citations(self, soup: BeautifulSoup, content: str) -> List[Dict]:
        """Extract all citations from article"""
        citations = []
        
        # Extract from HTML links
        links = soup.find_all('a', href=True)
        for link in links:
            href = link.get('href', '')
            if self._is_valid_citation_url(href):
                text = link.get_text(strip=True) or href
                citations.append({
                    "url": href,
                    "text": text,
                    "type": "html",
                    "source_type": utils.classify_source_type(href),
                    "domain": utils.normalize_domain(href),
                    "reliability": utils.calculate_reliability_score(
                        href, 
                        utils.classify_source_type(href)
                    )
                })
        
        # Also extract from text patterns
        text_citations = utils.extract_citations_from_text(content)
        for cit in text_citations:
            if self._is_valid_citation_url(cit["url"]):
                # Avoid duplicates
                if not any(c["url"] == cit["url"] for c in citations):
                    citations.append({
                        "url": cit["url"],
                        "text": cit.get("text", cit["url"]),
                        "type": cit.get("type", "text"),
                        "source_type": utils.classify_source_type(cit["url"]),
                        "domain": utils.normalize_domain(cit["url"]),
                        "reliability": utils.calculate_reliability_score(
                            cit["url"],
                            utils.classify_source_type(cit["url"])
                        )
                    })
        
        # Remove duplicates and normalize
        unique_citations = []
        seen_urls = set()
        for cit in citations:
            normalized_url = cit["url"].rstrip('/')
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                unique_citations.append(cit)
        
        return unique_citations
    
    def _is_valid_citation_url(self, url: str) -> bool:
        """Check if URL is a valid citation (not internal link)"""
        if not url or not url.startswith(('http://', 'https://')):
            return False
        
        # Filter out internal GrokiPedia links
        if config.GROKIPEDIA_BASE_URL in url.lower():
            return False
        
        # Filter out common non-citation URLs
        excluded = ['mailto:', 'javascript:', '#', 'tel:']
        if any(url.startswith(ex) for ex in excluded):
            return False
        
        return True
    
    def _extract_metadata(self, soup: BeautifulSoup, url: str) -> Dict:
        """Extract article metadata"""
        metadata = {
            "url": url,
            "last_modified": None,
            "authors": [],
            "categories": []
        }
        
        # Try to extract last modified date
        date_selectors = [
            '.last-modified',
            '.date',
            'time',
            '[datetime]'
        ]
        for selector in date_selectors:
            element = soup.select_one(selector)
            if element:
                date_str = element.get('datetime') or element.get_text(strip=True)
                if date_str:
                    metadata["last_modified"] = date_str
                    break
        
        # Try to extract authors
        author_selectors = [
            '.author',
            '.byline',
            '[rel="author"]'
        ]
        for selector in author_selectors:
            elements = soup.select(selector)
            for elem in elements:
                author = elem.get_text(strip=True)
                if author:
                    metadata["authors"].append(author)
        
        return metadata

