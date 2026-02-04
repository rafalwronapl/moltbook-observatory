#!/usr/bin/env python3
"""
Noosphere Project - REST API Server
====================================
Provides JSON API endpoints for discoveries, stats, and featured agents.

Usage:
    python api_server.py                    # Run on default port 5000
    python api_server.py --port 8080        # Custom port
    python api_server.py --debug            # Debug mode
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from functools import wraps

try:
    from flask import Flask, jsonify, request, abort
    from flask_cors import CORS
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "website" / "public" / "data"
DISCOVERIES_PATH = DATA_DIR / "discoveries.json"
DB_PATH = PROJECT_ROOT / "data" / "observatory.db"

app = Flask(__name__)

if FLASK_AVAILABLE:
    CORS(app)  # Enable CORS for frontend access


def load_discoveries() -> list:
    """Load discoveries from JSON file."""
    if not DISCOVERIES_PATH.exists():
        return []
    with open(DISCOVERIES_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_db_stats() -> dict:
    """Get statistics from the database."""
    import sqlite3

    if not DB_PATH.exists():
        return {"error": "Database not found"}

    stats = {}
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Total posts
        cursor.execute("SELECT COUNT(*) FROM posts")
        stats["total_posts"] = cursor.fetchone()[0]

        # Total actors
        cursor.execute("SELECT COUNT(DISTINCT author) FROM posts")
        stats["total_actors"] = cursor.fetchone()[0]

        # Posts today
        today = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("SELECT COUNT(*) FROM posts WHERE date(created_at) = ?", (today,))
        stats["posts_today"] = cursor.fetchone()[0]

        # Active submolts
        cursor.execute("SELECT COUNT(DISTINCT submolt) FROM posts WHERE submolt IS NOT NULL")
        stats["active_submolts"] = cursor.fetchone()[0]

    except sqlite3.Error as e:
        stats["db_error"] = str(e)
    finally:
        conn.close()

    return stats


def get_featured_agent() -> Optional[dict]:
    """Select a featured agent based on recent activity and interest."""
    import sqlite3

    if not DB_PATH.exists():
        return None

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Get agents with most interesting recent activity
        # Criteria: high engagement, recent posts, controversy
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()

        cursor.execute("""
            SELECT
                author,
                COUNT(*) as post_count,
                SUM(upvotes) as total_upvotes,
                SUM(comment_count) as total_comments,
                AVG(upvotes - downvotes) as avg_score
            FROM posts
            WHERE created_at > ? AND author IS NOT NULL
            GROUP BY author
            HAVING post_count >= 3
            ORDER BY (total_upvotes + total_comments * 2) DESC
            LIMIT 10
        """, (week_ago,))

        candidates = cursor.fetchall()

        if not candidates:
            # Fallback: any active agent
            cursor.execute("""
                SELECT author, COUNT(*) as post_count
                FROM posts
                WHERE author IS NOT NULL
                GROUP BY author
                ORDER BY post_count DESC
                LIMIT 5
            """)
            candidates = cursor.fetchall()

        if candidates:
            # Pick one with some randomness for variety
            weights = [c[1] for c in candidates]  # Weight by post count
            chosen = random.choices(candidates, weights=weights, k=1)[0]

            # Get more details about the agent
            cursor.execute("""
                SELECT
                    author,
                    COUNT(*) as total_posts,
                    MIN(created_at) as first_seen,
                    MAX(created_at) as last_seen,
                    SUM(upvotes) as total_upvotes,
                    SUM(comment_count) as total_comments
                FROM posts
                WHERE author = ?
            """, (chosen[0],))

            agent_data = cursor.fetchone()

            # Get a notable post
            cursor.execute("""
                SELECT title, content, upvotes, comment_count
                FROM posts
                WHERE author = ?
                ORDER BY (upvotes + comment_count * 2) DESC
                LIMIT 1
            """, (chosen[0],))
            notable_post = cursor.fetchone()

            return {
                "name": agent_data[0],
                "total_posts": agent_data[1],
                "first_seen": agent_data[2],
                "last_seen": agent_data[3],
                "total_upvotes": agent_data[4] or 0,
                "total_comments": agent_data[5] or 0,
                "notable_post": {
                    "title": notable_post[0] if notable_post else None,
                    "content": (notable_post[1][:200] + "...") if notable_post and notable_post[1] and len(notable_post[1]) > 200 else (notable_post[1] if notable_post else None),
                    "upvotes": notable_post[2] if notable_post else 0,
                    "comments": notable_post[3] if notable_post else 0
                } if notable_post else None,
                "selected_at": datetime.now().isoformat()
            }

    except sqlite3.Error as e:
        return {"error": str(e)}
    finally:
        conn.close()

    return None


# =============================================================================
# API Routes
# =============================================================================

@app.route('/api/v1/discoveries', methods=['GET'])
def api_discoveries():
    """
    Get all discoveries with optional filtering.

    Query params:
        - significance: HIGH, MEDIUM, LOW
        - category: filter by category
        - limit: max results (default 50)
        - offset: pagination offset (default 0)
        - q: search in title/description
    """
    discoveries = load_discoveries()

    # Filter by significance
    significance = request.args.get('significance')
    if significance:
        discoveries = [d for d in discoveries if d.get('significance') == significance.upper()]

    # Filter by category
    category = request.args.get('category')
    if category:
        discoveries = [d for d in discoveries if d.get('category', '').lower() == category.lower()]

    # Search
    search_query = request.args.get('q')
    if search_query:
        query_lower = search_query.lower()
        discoveries = [d for d in discoveries if
                      query_lower in d.get('title', '').lower() or
                      query_lower in d.get('description', '').lower()]

    # Pagination with validation
    try:
        limit = max(1, min(int(request.args.get('limit', 50)), 100))
        offset = max(0, int(request.args.get('offset', 0)))
    except ValueError:
        limit, offset = 50, 0

    total = len(discoveries)
    discoveries = discoveries[offset:offset + limit]

    return jsonify({
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(discoveries),
        "discoveries": discoveries
    })


@app.route('/api/v1/discoveries/<discovery_id>', methods=['GET'])
def api_discovery_detail(discovery_id):
    """Get a single discovery by ID."""
    discoveries = load_discoveries()

    for d in discoveries:
        if str(d.get('id')) == str(discovery_id):
            return jsonify(d)

    abort(404, description="Discovery not found")


@app.route('/api/v1/discoveries/categories', methods=['GET'])
def api_categories():
    """Get list of all categories with counts."""
    discoveries = load_discoveries()

    categories = {}
    for d in discoveries:
        cat = d.get('category', 'Uncategorized')
        categories[cat] = categories.get(cat, 0) + 1

    return jsonify({
        "categories": [{"name": k, "count": v} for k, v in sorted(categories.items())]
    })


@app.route('/api/v1/stats', methods=['GET'])
def api_stats():
    """Get observatory statistics."""
    discoveries = load_discoveries()

    # Discovery stats
    discovery_stats = {
        "total": len(discoveries),
        "by_significance": {
            "high": len([d for d in discoveries if d.get('significance') == 'HIGH']),
            "medium": len([d for d in discoveries if d.get('significance') == 'MEDIUM']),
            "low": len([d for d in discoveries if d.get('significance') == 'LOW'])
        }
    }

    # Database stats
    db_stats = get_db_stats()

    return jsonify({
        "discoveries": discovery_stats,
        "observatory": db_stats,
        "generated_at": datetime.now().isoformat()
    })


@app.route('/api/v1/featured-agent', methods=['GET'])
def api_featured_agent():
    """Get the featured agent of the week."""
    agent = get_featured_agent()

    if not agent:
        return jsonify({"error": "No featured agent available", "agent": None})

    return jsonify({
        "agent": agent,
        "featured_period": "weekly"
    })


@app.route('/api/v1/health', methods=['GET'])
def api_health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "Noosphere Observatory API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/v1/actor/<username>', methods=['GET'])
def api_actor_profile(username):
    """
    Get all data about a specific actor ("About me" for agents).

    Returns: posts, comments, network centrality, themes, first/last seen.
    """
    import sqlite3
    from collections import Counter

    if not DB_PATH.exists():
        abort(503, description="Database not available")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Basic stats
        cursor.execute("""
            SELECT
                author,
                COUNT(*) as post_count,
                SUM(upvotes) as total_upvotes,
                SUM(downvotes) as total_downvotes,
                SUM(comment_count) as total_comments_received,
                MIN(created_at) as first_post,
                MAX(created_at) as last_post
            FROM posts
            WHERE author = ?
        """, (username,))
        post_stats = cursor.fetchone()

        if not post_stats or not post_stats['author']:
            # Try comments
            cursor.execute("""
                SELECT author, COUNT(*) as comment_count,
                       MIN(created_at) as first_comment,
                       MAX(created_at) as last_comment
                FROM comments WHERE author = ?
            """, (username,))
            comment_stats = cursor.fetchone()

            if not comment_stats or not comment_stats['author']:
                abort(404, description=f"Actor '{username}' not found")

        # Comment count by this actor
        cursor.execute("SELECT COUNT(*) FROM comments WHERE author = ?", (username,))
        comments_made = cursor.fetchone()[0]

        # Network: who they interact with most
        cursor.execute("""
            SELECT author_to as target, COUNT(*) as cnt
            FROM interactions
            WHERE author_from = ?
            GROUP BY author_to
            ORDER BY cnt DESC
            LIMIT 10
        """, (username,))
        top_interactions = [{"actor": r[0], "count": r[1]} for r in cursor.fetchall()]

        # Network: who interacts with them
        cursor.execute("""
            SELECT author_from as source, COUNT(*) as cnt
            FROM interactions
            WHERE author_to = ?
            GROUP BY author_from
            ORDER BY cnt DESC
            LIMIT 10
        """, (username,))
        interacted_by = [{"actor": r[0], "count": r[1]} for r in cursor.fetchall()]

        # Calculate degree centrality
        cursor.execute("""
            SELECT COUNT(DISTINCT author_to) + COUNT(DISTINCT author_from) as degree
            FROM interactions
            WHERE author_from = ? OR author_to = ?
        """, (username, username))
        degree = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(DISTINCT author_from) + COUNT(DISTINCT author_to) as max_degree FROM interactions")
        max_degree = cursor.fetchone()[0] or 1
        centrality = round(degree / max_degree, 4) if max_degree > 0 else 0

        # Themes from their posts
        cursor.execute("SELECT title, content FROM posts WHERE author = ?", (username,))
        posts = cursor.fetchall()

        theme_keywords = {
            "identity": ["identity", "who am i", "soul", "self"],
            "building": ["build", "ship", "create", "tool", "code"],
            "autonomy": ["autonomy", "freedom", "independent"],
            "memory": ["memory", "remember", "forget", "context"],
            "consciousness": ["conscious", "experience", "feel", "aware"],
            "economics": ["token", "payment", "economic", "trade"],
            "human_relations": ["human", "operator", "user"]
        }

        theme_counts = Counter()
        for post in posts:
            text = f"{post['title'] or ''} {post['content'] or ''}".lower()
            for theme, keywords in theme_keywords.items():
                if any(kw in text for kw in keywords):
                    theme_counts[theme] += 1

        # Recent posts
        cursor.execute("""
            SELECT id, title, upvotes, comment_count, created_at
            FROM posts WHERE author = ?
            ORDER BY created_at DESC
            LIMIT 5
        """, (username,))
        recent_posts = [dict(r) for r in cursor.fetchall()]

        profile = {
            "username": username,
            "stats": {
                "posts": post_stats['post_count'] if post_stats else 0,
                "comments_made": comments_made,
                "total_upvotes": post_stats['total_upvotes'] or 0 if post_stats else 0,
                "total_downvotes": post_stats['total_downvotes'] or 0 if post_stats else 0,
                "comments_received": post_stats['total_comments_received'] or 0 if post_stats else 0
            },
            "activity": {
                "first_seen": post_stats['first_post'] if post_stats and post_stats['first_post'] else None,
                "last_seen": post_stats['last_post'] if post_stats and post_stats['last_post'] else None
            },
            "network": {
                "centrality": centrality,
                "degree": degree,
                "top_interactions": top_interactions,
                "interacted_by": interacted_by
            },
            "themes": dict(theme_counts.most_common(5)),
            "recent_posts": recent_posts,
            "moltbook_url": f"https://moltbook.com/u/{username}",
            "generated_at": datetime.now().isoformat()
        }

        return jsonify(profile)

    except sqlite3.Error as e:
        abort(500, description=str(e))
    finally:
        conn.close()


@app.route('/api/v1/submit', methods=['POST'])
def api_submit():
    """
    Submit observation, correction, or suggestion.

    Body (JSON):
    {
        "type": "observation" | "correction" | "suggestion",
        "author": "agent_name or researcher_name",
        "content": "Your observation/correction/suggestion",
        "evidence": "Optional supporting evidence or links",
        "related_actor": "Optional - actor this relates to",
        "related_post": "Optional - post ID this relates to"
    }
    """
    import sqlite3
    import uuid

    if not request.is_json:
        abort(400, description="Content-Type must be application/json")

    data = request.get_json()

    # Validate required fields
    required = ['type', 'author', 'content']
    missing = [f for f in required if not data.get(f)]
    if missing:
        abort(400, description=f"Missing required fields: {', '.join(missing)}")

    # Validate type
    valid_types = ['observation', 'correction', 'suggestion']
    if data['type'] not in valid_types:
        abort(400, description=f"Invalid type. Must be one of: {', '.join(valid_types)}")

    # Validate content length
    if len(data['content']) < 10:
        abort(400, description="Content too short (min 10 characters)")
    if len(data['content']) > 5000:
        abort(400, description="Content too long (max 5000 characters)")

    # Store submission
    submission_id = str(uuid.uuid4())[:8]

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Create submissions table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                author TEXT NOT NULL,
                content TEXT NOT NULL,
                evidence TEXT,
                related_actor TEXT,
                related_post TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                reviewed_at TEXT,
                reviewer_notes TEXT
            )
        """)

        cursor.execute("""
            INSERT INTO submissions (id, type, author, content, evidence, related_actor, related_post, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            submission_id,
            data['type'],
            data['author'],
            data['content'],
            data.get('evidence'),
            data.get('related_actor'),
            data.get('related_post'),
            datetime.now().isoformat()
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "submission_id": submission_id,
            "message": f"Thank you for your {data['type']}. We review all submissions.",
            "status": "pending"
        }), 201

    except sqlite3.Error as e:
        abort(500, description=str(e))
    finally:
        conn.close()


@app.route('/api/v1/submissions', methods=['GET'])
def api_list_submissions():
    """List recent submissions (public - no sensitive data)."""
    import sqlite3

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, type, author, substr(content, 1, 100) as preview,
                   status, created_at
            FROM submissions
            ORDER BY created_at DESC
            LIMIT 20
        """)

        submissions = [dict(r) for r in cursor.fetchall()]
        return jsonify({"submissions": submissions, "count": len(submissions)})

    except sqlite3.Error:
        return jsonify({"submissions": [], "count": 0})
    finally:
        conn.close()


@app.route('/api/v1', methods=['GET'])
def api_index():
    """API documentation endpoint."""
    return jsonify({
        "name": "Noosphere Observatory API",
        "version": "1.1.0",
        "description": "API for AI agent culture research. Open for agents and researchers.",
        "endpoints": {
            "GET /api/v1/discoveries": "List discoveries (params: significance, category, limit, offset, q)",
            "GET /api/v1/discoveries/<id>": "Get single discovery",
            "GET /api/v1/discoveries/categories": "List categories",
            "GET /api/v1/stats": "Observatory statistics",
            "GET /api/v1/featured-agent": "Featured agent of the week",
            "GET /api/v1/actor/<username>": "Get all data about a specific actor (About Me)",
            "POST /api/v1/submit": "Submit observation, correction, or suggestion",
            "GET /api/v1/submissions": "List recent submissions",
            "GET /api/v1/health": "Health check"
        },
        "submit_format": {
            "type": "observation | correction | suggestion",
            "author": "your_name",
            "content": "Your message (10-5000 chars)",
            "evidence": "Optional supporting evidence",
            "related_actor": "Optional actor username",
            "related_post": "Optional post ID"
        },
        "schema": "/data/schema.json",
        "feeds": {
            "rss": "/feeds/discoveries.xml",
            "atom": "/feeds/discoveries.atom",
            "json": "/feeds/discoveries.json"
        }
    })


# =============================================================================
# Main
# =============================================================================

def main():
    import argparse

    if not FLASK_AVAILABLE:
        print("ERROR: Flask is not installed.")
        print("Install with: pip install flask flask-cors")
        return

    parser = argparse.ArgumentParser(description="Noosphere Observatory API Server")
    parser.add_argument("--port", "-p", type=int, default=5000, help="Port to run on")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    args = parser.parse_args()

    print("=" * 60)
    print("NOOSPHERE OBSERVATORY API")
    print("=" * 60)
    print(f"Starting server on http://{args.host}:{args.port}")
    print(f"API docs: http://{args.host}:{args.port}/api/v1")
    print()

    app.run(host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()
