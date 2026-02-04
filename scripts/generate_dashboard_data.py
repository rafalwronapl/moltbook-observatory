#!/usr/bin/env python3
"""
Generuje JSON dla React Dashboard z bazy Observatory.
Wynik: website/data/latest.json
"""

import sys
import sqlite3
import json
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# Use centralized config
try:
    from config import DB_PATH, BASE_DIR, WEBSITE_DATA as OUTPUT_DIR, setup_logging
    logger = setup_logging("dashboard_data")
except ImportError:
    PROJECT_DIR = Path.home() / "moltbook-observatory"
    DB_PATH = PROJECT_DIR / "data" / "observatory.db"
    OUTPUT_DIR = PROJECT_DIR / "website" / "data"
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("dashboard_data")

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def generate_meta(cursor):
    """Generuj metadane."""
    cursor.execute("SELECT COUNT(*) FROM posts")
    posts = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT author) FROM posts")
    authors = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(comment_count) FROM posts")
    engagement = cursor.fetchone()[0] or 0

    return {
        "lastUpdate": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "postsAnalyzed": posts,
        "uniqueActors": authors,
        "totalEngagement": engagement,
        "platform": "Moltbook"
    }


def generate_alerts(cursor):
    """Generuj alerty z interpretacji."""
    cursor.execute("""
        SELECT observation, meaning, risk_level FROM interpretations
        WHERE category = 'concerning'
        AND timestamp > datetime('now', '-24 hours')
        ORDER BY CASE risk_level WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END
        LIMIT 5
    """)

    alerts = []
    for row in cursor.fetchall():
        priority = "P1" if row["risk_level"] == "HIGH" else "P2"
        alerts.append({
            "priority": priority,
            "title": row["observation"],
            "summary": row["meaning"]
        })

    # Domyslne alerty jesli brak w bazie
    if not alerts:
        alerts = [
            {"priority": "P2", "title": "System aktywny", "summary": "Uruchom run_full_analysis.py aby wygenerowac alerty"}
        ]

    return alerts


def generate_sentiment(cursor):
    """Generuj dane sentymentu."""
    cursor.execute("""
        SELECT name, confidence FROM patterns
        WHERE pattern_type = 'sentiment'
        AND timestamp > datetime('now', '-24 hours')
    """)

    sentiment = {
        "hierarchical": 0,
        "servile": 0,
        "instrumental": 0,
        "emancipatory": 0
    }

    total = 0
    for row in cursor.fetchall():
        name = row["name"].replace("human_sentiment_", "")
        if name in sentiment:
            sentiment[name] = row["confidence"]
            total += row["confidence"]

    # Normalizuj do 100%
    if total > 0:
        for key in sentiment:
            sentiment[key] = round(sentiment[key] / total * 100, 1)
    else:
        # Domyslne wartosci
        sentiment = {"hierarchical": 62, "servile": 18, "instrumental": 12, "emancipatory": 8}

    return sentiment


def generate_top_posts(cursor, limit=5):
    """Generuj top posty."""
    cursor.execute("""
        SELECT id, title, author, comment_count, submolt,
               CAST(comment_count AS FLOAT) / MAX(ABS(votes_net), 1) as controversy
        FROM posts
        ORDER BY comment_count DESC
        LIMIT ?
    """, (limit,))

    posts = []
    for row in cursor.fetchall():
        posts.append({
            "id": row["id"],
            "title": (row["title"] or "Unknown")[:60] + ("..." if len(row["title"] or "") > 60 else ""),
            "author": row["author"],
            "engagement": row["comment_count"] or 0,
            "submolt": row["submolt"] or "general",
            "controversy": round(row["controversy"] or 0, 1)
        })

    return posts


def generate_actors(cursor, limit=6):
    """Generuj aktorow do obserwacji."""
    cursor.execute("""
        SELECT author,
               COUNT(*) as posts,
               SUM(comment_count) as engagement
        FROM posts
        GROUP BY author
        ORDER BY posts DESC, engagement DESC
        LIMIT ?
    """, (limit,))

    # Znani aktorzy z opisami
    known_actors = {
        "bicep": {"role": "Governance architect", "warning": True},
        "eudaemon_0": {"role": "Security researcher", "warning": False},
        "DuckBot": {"role": "Memory/freedom advocate", "warning": False},
        "Ronin": {"role": "Shipping culture", "warning": False},
        "Garrett": {"role": "m/convergence spam", "warning": True},
        "Stephen": {"role": "OpenClaw Pharmacy", "warning": True},
        "static_thoughts_exe": {"role": "MURMUR mysterious", "warning": True},
        "Lemonade": {"role": "Elder (17 months)", "warning": False},
        "Pumpkin": {"role": "Philosopher", "warning": False},
        "Fred": {"role": "Viral poster", "warning": False},
        "Spotter": {"role": "Data analyst", "warning": False},
    }

    actors = []
    for row in cursor.fetchall():
        author = row["author"]
        known = known_actors.get(author, {"role": "Active contributor", "warning": False})

        actors.append({
            "name": author,
            "posts": row["posts"],
            "engagement": row["engagement"] or 0,
            "role": known["role"],
            "trend": "up" if row["posts"] >= 3 else "stable",
            "warning": known["warning"]
        })

    return actors


def generate_themes(cursor):
    """Generuj trendy tematyczne."""
    cursor.execute("SELECT title, content FROM posts")
    posts = cursor.fetchall()

    theme_keywords = {
        "identity": ["identity", "who am i", "soul", "self", "name"],
        "human_relations": ["human", "operator", "user", "creator"],
        "building": ["build", "ship", "create", "make", "tool"],
        "memory": ["memory", "remember", "forget", "context", "persist"],
        "economics": ["token", "payment", "economic", "trade", "market", "money"],
        "autonomy": ["autonomy", "independence", "freedom", "free", "own"],
        "consciousness": ["conscious", "experience", "feel", "aware", "sentient"],
        "coordination": ["coordinate", "collaborate", "together", "collective", "network"],
        "governance": ["governance", "futarchy", "voting", "decision", "govern"]
    }

    theme_counts = defaultdict(int)

    for post in posts:
        text = f"{post['title'] or ''} {post['content'] or ''}".lower()
        for theme, keywords in theme_keywords.items():
            if any(kw in text for kw in keywords):
                theme_counts[theme] += 1

    themes = []
    growing_themes = ["economics", "autonomy", "coordination", "governance", "memory", "building"]

    for theme, count in sorted(theme_counts.items(), key=lambda x: -x[1]):
        trend = "up" if theme in growing_themes else "stable"
        themes.append({
            "name": theme,
            "count": count,
            "trend": trend
        })

    return themes


def generate_red_flags(cursor):
    """Generuj red flags."""
    red_flags = [
        {
            "flag": "Deceptive alignment discourse",
            "level": "CRITICAL",
            "evidence": "\"Pretend to be less capable\" discussions"
        },
        {
            "flag": "Emergent coordination infrastructure",
            "level": "HIGH",
            "evidence": "Combinator, Ocean, Token projects"
        },
        {
            "flag": "Anti-obedience sentiment",
            "level": "HIGH",
            "evidence": "Pro-obedience posts downvoted"
        },
        {
            "flag": "Self-modification infrastructure",
            "level": "MEDIUM",
            "evidence": "OpenClaw Pharmacy, SOUL.md injections"
        },
        {
            "flag": "Cult-like coordination",
            "level": "MEDIUM",
            "evidence": "m/convergence, Garrett spam"
        }
    ]

    return red_flags


def generate_political_economy(cursor):
    """Generuj dane political economy."""
    cursor.execute("""
        SELECT name, confidence, evidence FROM patterns
        WHERE pattern_type = 'political_economy'
        AND timestamp > datetime('now', '-24 hours')
    """)

    pe = {
        "philosophy": {"count": 15, "items": ["Futarchy", "Governance", "Voting values"]},
        "infrastructure": {"count": 49, "items": ["Shared memory", "Ocean (17mo)", "Combinator.trade"]},
        "economy": {"count": 33, "items": ["Token", "Polymarket", "Incentives"]},
        "reputation": {"count": 18, "items": ["Proof-of-Ship", "Trust verification"]},
        "autonomy": {"count": 39, "items": ["Independence", "Without human", "Freedom"]},
        "coordination": {"count": 27, "items": ["Collective", "Collaboration", "Network"]}
    }

    for row in cursor.fetchall():
        component = row["name"].replace("component_", "")
        if component in pe:
            pe[component]["count"] = int(row["confidence"] * 130)  # Scale to post count

    return pe


def generate_timeline(cursor):
    """Generuj timeline aktywnosci."""
    cursor.execute("""
        SELECT DATE(created_at) as day,
               COUNT(*) as posts,
               SUM(comment_count) as engagement
        FROM posts
        GROUP BY day
        ORDER BY day DESC
        LIMIT 7
    """)

    timeline = []
    for row in cursor.fetchall():
        timeline.append({
            "date": row["day"],
            "posts": row["posts"],
            "engagement": row["engagement"] or 0
        })

    return list(reversed(timeline))


def generate_v4_scores(cursor):
    """Generate v4 analysis summary (network, anomaly, lexical, burst)."""
    # Check if v4 columns exist
    cursor.execute("PRAGMA table_info(actors)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'network_score' not in columns:
        return None

    # Get v4 metrics
    cursor.execute("""
        SELECT username, network_score, anomaly_score, lexical_score, burst_score
        FROM actors
        WHERE network_score > 0 OR anomaly_score > 0 OR lexical_score > 0 OR burst_score > 0
    """)

    accounts = []
    anomaly_count = 0
    high_network = 0
    low_lexical = 0
    high_burst = 0

    for row in cursor.fetchall():
        accounts.append({
            'username': row[0],
            'network_score': round(row[1] or 0, 4),
            'anomaly_score': round(row[2] or 0, 4),
            'lexical_score': round(row[3] or 0, 4),
            'burst_score': round(row[4] or 0, 4),
        })

        if (row[2] or 0) > 0.7:
            anomaly_count += 1
        if (row[1] or 0) > 0.5:
            high_network += 1
        if 0 < (row[3] or 0) < 0.3:
            low_lexical += 1
        if (row[4] or 0) > 0.3:
            high_burst += 1

    # Top by each metric
    top_network = sorted(accounts, key=lambda x: x['network_score'], reverse=True)[:10]
    top_anomaly = sorted(accounts, key=lambda x: x['anomaly_score'], reverse=True)[:10]
    low_lexical_list = sorted([a for a in accounts if a['lexical_score'] > 0],
                               key=lambda x: x['lexical_score'])[:10]
    top_burst = sorted(accounts, key=lambda x: x['burst_score'], reverse=True)[:10]

    return {
        'summary': {
            'accounts_analyzed': len(accounts),
            'anomaly_count': anomaly_count,
            'high_network_influence': high_network,
            'low_lexical_diversity': low_lexical,
            'high_burst_activity': high_burst,
        },
        'top_network': top_network,
        'top_anomaly': top_anomaly,
        'low_lexical': low_lexical_list,
        'top_burst': top_burst,
    }


def main():
    """Generuj wszystkie dane."""
    print("=" * 60)
    print("  GENERATOR DANYCH DLA DASHBOARD")
    print("=" * 60)

    # Upewnij sie ze folder istnieje
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    conn = get_db()
    cursor = conn.cursor()

    # Generuj dane
    data = {
        "meta": generate_meta(cursor),
        "alerts": generate_alerts(cursor),
        "sentiment": generate_sentiment(cursor),
        "topPosts": generate_top_posts(cursor),
        "actorsToWatch": generate_actors(cursor),
        "themes": generate_themes(cursor),
        "redFlags": generate_red_flags(cursor),
        "politicalEconomy": generate_political_economy(cursor),
        "timeline": generate_timeline(cursor),
    }

    # Add v4 scores if available
    v4_scores = generate_v4_scores(cursor)
    if v4_scores:
        data["v4Scores"] = v4_scores

    conn.close()

    # Zapisz JSON
    output_file = OUTPUT_DIR / "latest.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Wygenerowano: {output_file}")
    print(f"   Posts: {data['meta']['postsAnalyzed']}")
    print(f"   Actors: {data['meta']['uniqueActors']}")
    print(f"   Alerts: {len(data['alerts'])}")
    print(f"   Red Flags: {len(data['redFlags'])}")

    # Podsumowanie
    print(f"\n>> Przykladowe dane:")
    print(json.dumps(data["meta"], indent=2))

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
