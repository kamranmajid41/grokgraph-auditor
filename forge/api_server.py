#!/usr/bin/env python3
"""
Simple API server to proxy Grokipedia requests and avoid CORS issues.
Run this server and point the frontend to it.

Usage:
    python api_server.py

Then the frontend can call: http://localhost:8000/api/fetch-grokipedia?url=<grokipedia-url>
"""
from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
    cors_available = True
except ImportError:
    cors_available = False
    print("Warning: flask_cors not available. CORS may not work properly.")
    print("Install with: pip install flask-cors")

from grokipedia_crawler import fetch_grokipedia_article
import sys

app = Flask(__name__)
if cors_available:
    CORS(app)  # Enable CORS for all routes
else:
    # Manual CORS headers
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

@app.route('/api/fetch-grokipedia', methods=['GET'])
def fetch_grokipedia():
    """Proxy endpoint to fetch Grokipedia articles by URL or topic"""
    url = request.args.get('url')
    topic = request.args.get('topic')
    
    # If topic provided, try to convert to URL
    if topic and not url:
        # Convert topic to potential Grokipedia URL
        cleaned = topic.strip().replace(' ', '_').replace('__', '_')
        url_variants = [
            f"https://grokipedia.com/page/{cleaned}",
            f"https://grokipedia.com/page/{cleaned.replace('_', '')}",
            f"https://grokipedia.com/article/{cleaned}",
        ]
        
        # Try each variant
        for potential_url in url_variants:
            try:
                result = fetch_grokipedia_article(potential_url)
                if result and result.get('content'):
                    return jsonify({
                        'success': True,
                        'title': result['title'],
                        'content': result['content'],
                        'url': result['url'],
                        'citations': result['citations'],
                        'word_count': result.get('word_count', 0),
                        'citation_count': result.get('citation_count', 0)
                    })
            except:
                continue
        
        return jsonify({'error': f'No Grokipedia article found for topic: {topic}'}), 404
    
    if not url:
        return jsonify({'error': 'Missing url or topic parameter'}), 400
    
    if 'grokipedia.com' not in url.lower():
        return jsonify({'error': 'URL must be from grokipedia.com'}), 400
    
    try:
        result = fetch_grokipedia_article(url)
        
        if result:
            return jsonify({
                'success': True,
                'title': result['title'],
                'content': result['content'],
                'url': result['url'],
                'citations': result['citations'],
                'word_count': result.get('word_count', 0),
                'citation_count': result.get('citation_count', 0)
            })
        else:
            return jsonify({'error': 'Failed to extract article content'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting Grokipedia API server on http://localhost:8000")
    print("Frontend can use: http://localhost:8000/api/fetch-grokipedia?url=<grokipedia-url>")
    app.run(host='0.0.0.0', port=8000, debug=True)
