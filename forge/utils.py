"""Utility functions for Citation Graph Auditor"""
import re
import tldextract
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
import config


def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        return domain.lower()
    except:
        return url.lower()


def classify_source_type(url: str) -> str:
    """Classify source type based on URL patterns"""
    domain = extract_domain(url)
    ext = tldextract.extract(domain)
    
    # Check TLD first
    if ext.suffix in ["edu", "ac.uk", "edu.au"]:
        return "academic"
    if ext.suffix == "gov" or ext.suffix.startswith("gov."):
        return "government"
    if ext.suffix == "org":
        return "ngo"
    
    # Check domain patterns
    domain_lower = domain.lower()
    for category, keywords in config.SOURCE_CATEGORIES.items():
        if category == "other":
            continue
        for keyword in keywords:
            if keyword in domain_lower:
                return category
    
    return "other"


def calculate_reliability_score(url: str, source_type: str) -> float:
    """Calculate reliability score for a source"""
    base_score = config.RELIABILITY_SCORES.get(source_type, 0.5)
    
    # Boost for trusted domains
    ext = tldextract.extract(extract_domain(url))
    if ext.suffix in config.TRUSTED_DOMAINS:
        base_score += 0.1
    
    # Penalize suspicious patterns
    domain = extract_domain(url).lower()
    suspicious = ["blogspot", "wordpress", "tumblr", "wix"]
    if any(s in domain for s in suspicious):
        base_score -= 0.2
    
    return max(0.0, min(1.0, base_score))


def extract_citations_from_text(text: str) -> List[Dict]:
    """Extract citation URLs and metadata from article text (optimized single-pass)"""
    citations = []
    seen_urls = set()  # Track seen URLs to avoid duplicates
    
    # Combined pattern to match all citation types in a single pass
    # Order matters: markdown first, then HTML, then bare URLs
    # Using a more efficient approach: find all potential URLs first, then classify
    
    # First pass: Extract markdown links [text](url)
    markdown_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
    for match in re.finditer(markdown_pattern, text):
        url = match.group(2).strip()
        if url.startswith(('http://', 'https://')):
            normalized_url = url.rstrip('.,;:!?)')
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                citations.append({
                    "text": match.group(1),
                    "url": normalized_url,
                    "type": "markdown"
                })
    
    # Second pass: Extract HTML links <a href="url">text</a>
    html_pattern = r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>'
    for match in re.finditer(html_pattern, text, re.IGNORECASE):
        url = match.group(1).strip()
        if url.startswith(('http://', 'https://')):
            normalized_url = url.rstrip('.,;:!?)')
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                citations.append({
                    "text": match.group(2).strip(),
                    "url": normalized_url,
                    "type": "html"
                })
    
    # Third pass: Extract bare URLs (only if not already found)
    # Use a more precise pattern that avoids matching URLs already in markdown/HTML
    url_pattern = r'https?://[^\s<>"\'\)\[\]]+'
    for match in re.finditer(url_pattern, text):
        url = match.group(0).rstrip('.,;:!?)')
        # Check if this URL is not part of a markdown or HTML link
        start_pos = match.start()
        end_pos = match.end()
        # Simple heuristic: if there's a ]( or <a before this URL, skip it
        context_before = text[max(0, start_pos-10):start_pos]
        if '](' not in context_before and '<a' not in context_before.lower():
            if url not in seen_urls:
                seen_urls.add(url)
                citations.append({
                    "text": url,
                    "url": url,
                    "type": "bare"
                })
    
    return citations


def normalize_domain(url: str) -> str:
    """Normalize domain for grouping"""
    ext = tldextract.extract(extract_domain(url))
    if ext.domain and ext.suffix:
        return f"{ext.domain}.{ext.suffix}"
    return extract_domain(url)


def calculate_diversity_score(domains: List[str]) -> float:
    """Calculate diversity score based on domain distribution"""
    if not domains:
        return 0.0
    
    domain_counts = {}
    for domain in domains:
        normalized = normalize_domain(domain)
        domain_counts[normalized] = domain_counts.get(normalized, 0) + 1
    
    total = len(domains)
    unique = len(domain_counts)
    
    # Diversity = unique domains / total citations (normalized)
    diversity = unique / total if total > 0 else 0.0
    
    # Penalize if top domain dominates
    if domain_counts:
        max_count = max(domain_counts.values())
        concentration = max_count / total
        diversity *= (1 - concentration * 0.5)  # Reduce diversity if concentrated
    
    return diversity


def format_citation_summary(citations: List[Dict]) -> str:
    """Format citation list for display"""
    if not citations:
        return "No citations found"
    
    summary = f"Found {len(citations)} citations:\n"
    for i, cit in enumerate(citations[:10], 1):  # Show first 10
        domain = normalize_domain(cit["url"])
        source_type = classify_source_type(cit["url"])
        summary += f"  {i}. [{source_type}] {domain}\n"
    
    if len(citations) > 10:
        summary += f"  ... and {len(citations) - 10} more\n"
    
    return summary

