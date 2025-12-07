#!/usr/bin/env python3
"""
Grokipedia Crawler - Extracts raw text from Grokipedia.com article pages.
"""
import re
import requests
from typing import Optional, Dict


def fetch_page(url: str) -> str:
    """Fetch the HTML content of a page."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    return response.text


def extract_markdown_content(html: str) -> str:
    """
    Extract markdown content from Grokipedia's Next.js RSC payload.
    
    Grokipedia uses Next.js Server Components which stream content via
    self.__next_f.push() calls. The article markdown is in one of these chunks.
    """
    # Find all __next_f.push chunks
    pattern = r'self\.__next_f\.push\(\[1,"(.+?)"\]\)</script>'
    matches = re.findall(pattern, html)
    
    if not matches:
        return ""
    
    # Find the chunk containing the article (starts with # Title)
    markdown = ""
    for chunk in matches:
        if chunk.startswith("# ") or "\\n# " in chunk[:100]:
            markdown = chunk
            break
    
    if not markdown:
        return ""
    
    # Unescape the string
    markdown = markdown.replace("\\n", "\n")
    markdown = markdown.replace("\\t", "\t")
    markdown = markdown.replace('\\"', '"')
    markdown = markdown.replace("\\'", "'")
    markdown = markdown.replace("\\\\", "\\")
    
    # Clean up the markdown:
    # 1. Remove image references: ![alt](url) - handle escaped parentheses in URLs
    markdown = re.sub(r'!\[[^\]]*\]\([^)]*(?:\\\)[^)]*)*\)', '', markdown)
    
    # 2. Remove inline reference links: [](url) - empty link text with just refs
    markdown = re.sub(r'\[\]\([^)]+\)', '', markdown)
    
    # 3. Clean up stray parentheses/brackets left from image removal
    markdown = re.sub(r'^\s*\)*\s*$', '', markdown, flags=re.MULTILINE)
    
    # 4. Convert Grokipedia internal links to just text: [Text](https://grokipedia.com/...)
    markdown = re.sub(r'\[([^\]]+)\]\(https://grokipedia\.com/[^)]*\)', r'\1', markdown)
    
    # 5. Keep external reference links for citation extraction
    # Don't remove them - we want to extract citations from them
    
    # 6. Clean up excessive whitespace
    markdown = re.sub(r'\n{3,}', '\n\n', markdown)
    
    return markdown.strip()


def extract_title_from_markdown(markdown: str) -> str:
    """Extract the title from markdown (first # heading)."""
    lines = markdown.split('\n')
    for line in lines:
        if line.startswith('# '):
            return line[2:].strip()
    return "Untitled Article"


def fetch_grokipedia_article(url: str) -> Optional[Dict]:
    """
    Fetch and extract article from Grokipedia URL.
    
    Returns:
        Dict with 'title', 'content', 'url', 'citations' (extracted from markdown links)
    """
    try:
        html = fetch_page(url)
        markdown = extract_markdown_content(html)
        
        if not markdown:
            return None
        
        title = extract_title_from_markdown(markdown)
        
        # Extract citations from markdown links (external URLs only)
        citations = []
        citation_pattern = r'\[([^\]]+)\]\((https?://[^)]+)\)'
        for match in re.finditer(citation_pattern, markdown):
            link_text = match.group(1)
            link_url = match.group(2)
            
            # Skip Grokipedia internal links
            if 'grokipedia.com' not in link_url.lower():
                citations.append({
                    "text": link_text,
                    "url": link_url,
                    "type": "markdown"
                })
        
        return {
            "url": url,
            "title": title,
            "content": markdown,
            "citations": citations,
            "word_count": len(markdown.split()),
            "citation_count": len(citations)
        }
        
    except Exception as e:
        print(f"Error fetching Grokipedia article: {e}")
        return None


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        url = sys.argv[1]
        result = fetch_grokipedia_article(url)
        if result:
            print(f"Title: {result['title']}")
            print(f"Citations: {result['citation_count']}")
            print(f"\nContent:\n{result['content'][:500]}...")
        else:
            print("Failed to fetch article")
            sys.exit(1)
    else:
        print("Usage: python grokipedia_crawler.py <url>")
