#!/usr/bin/env python3
"""Scrape comments for 2026-02-01 posts only."""

import sys
import sqlite3
import json
import time
import requests
from datetime import datetime
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DB_PATH = Path('data/observatory.db')
API_BASE = "https://www.moltbook.com/api/v1"
RAW_DIR = Path.home() / "moltbook-observatory" / "data" / "raw" / "posts"
RAW_DIR.mkdir(parents=True, exist_ok=True)

def fetch_and_save(post_id):
    """Fetch post with comments and save to DB."""
    url = f"{API_BASE}/posts/{post_id}"
    try:
        resp = requests.get(url, timeout=60)
        if resp.status_code != 200:
            print(f"  HTTP {resp.status_code}")
            return 0
        data = resp.json()

        # Save raw JSON
        with open(RAW_DIR / f"{post_id}.json", 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        comments = data.get('comments', [])
        return flatten_and_save(post_id, comments, data.get('post', {}).get('author', 'Unknown'))
    except Exception as e:
        print(f"  Error: {e}")
        return 0

def flatten_comments(comments, post_id, parent_id=None, depth=0):
    """Flatten nested comments."""
    flat = []
    for c in comments:
        author = c.get('author', {})
        if isinstance(author, dict):
            author_name = author.get('name', 'Unknown')
        else:
            author_name = str(author) if author else 'Unknown'

        flat.append({
            'id': c.get('id'),
            'post_id': post_id,
            'parent_id': parent_id,
            'author': author_name,
            'content': c.get('content'),
            'upvotes': c.get('upvotes', 0),
            'downvotes': c.get('downvotes', 0),
            'created_at': c.get('created_at'),
            'depth': depth,
        })

        replies = c.get('replies', [])
        if replies:
            flat.extend(flatten_comments(replies, post_id, c.get('id'), depth + 1))
    return flat

def flatten_and_save(post_id, comments, post_author):
    """Flatten and save comments to DB."""
    flat = flatten_comments(comments, post_id)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    saved = 0
    for c in flat:
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO comments
                (id, post_id, parent_id, author, content, content_sanitized,
                 upvotes, downvotes, created_at, depth, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c['id'], c['post_id'], c['parent_id'], c['author'],
                c['content'], c['content'][:10000] if c['content'] else None,
                c['upvotes'], c['downvotes'], c['created_at'],
                c['depth'], datetime.now().isoformat()
            ))
            saved += 1
        except Exception as e:
            print(f"    Save error: {e}")

    conn.commit()
    conn.close()
    return saved

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get posts from 2026-02-01 with comments
    cursor.execute('''
        SELECT id, title, comment_count
        FROM posts
        WHERE date(created_at) = '2026-02-01' AND comment_count > 0
        ORDER BY comment_count DESC
    ''')
    posts = cursor.fetchall()
    conn.close()

    print(f"=== Scraping {len(posts)} posts from 2026-02-01 ===")
    total = 0

    for i, (post_id, title, expected) in enumerate(posts, 1):
        title_safe = (title or 'Unknown')[:40]
        print(f"[{i}/{len(posts)}] {title_safe}... (expected: {expected})")

        saved = fetch_and_save(post_id)
        total += saved
        print(f"  -> Saved {saved} comments")

        time.sleep(3)  # Rate limit

    print(f"\n=== DONE: {total} total comments saved ===")

if __name__ == "__main__":
    main()
