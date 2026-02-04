#!/usr/bin/env python3
"""
Advanced Analysis v4.0 - Account Segmentation System
=====================================================
New detection methods for Moltbook Observatory:
1. Graph Centrality - PageRank, betweenness, clustering coefficient
2. Isolation Forest - Unsupervised anomaly detection
3. Lexical Entropy - Vocabulary diversity metrics
4. Burst Detection - Coordinated activity detection

Usage:
    python advanced_analysis_v4.py --all          # Run all analyses
    python advanced_analysis_v4.py --graph        # Only graph centrality
    python advanced_analysis_v4.py --anomaly      # Only anomaly detection
    python advanced_analysis_v4.py --lexical      # Only lexical analysis
    python advanced_analysis_v4.py --burst        # Only burst detection
"""

import sys
import sqlite3
import json
import math
import re
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Optional
from pathlib import Path
from dataclasses import dataclass, asdict

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, str(Path(__file__).parent))
from config import DB_PATH, REPORTS_DIR, TODAY, PROJECT_ROOT

# Optional imports with fallback
try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False
    print("WARNING: networkx not available. Install with: pip install networkx")

try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("WARNING: sklearn not available. Install with: pip install scikit-learn numpy")


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class V4Scores:
    """All v4 component scores for an account."""
    username: str

    # Graph Centrality (0-1, normalized)
    pagerank: float = 0.0
    betweenness: float = 0.0
    clustering_coef: float = 0.0
    in_degree_norm: float = 0.0
    out_degree_norm: float = 0.0
    network_score: float = 0.0  # Combined

    # Anomaly Detection
    anomaly_score: float = 0.0  # -1 = anomaly, 1 = normal
    is_anomaly: bool = False

    # Lexical Entropy
    vocabulary_richness: float = 0.0
    lexical_entropy: float = 0.0
    hapax_ratio: float = 0.0  # Words used only once
    lexical_score: float = 0.0  # Combined

    # Burst Detection
    burst_count: int = 0
    max_burst_size: int = 0
    burst_score: float = 0.0

    # Metadata
    samples: int = 0
    confidence: str = "insufficient"


# =============================================================================
# 1. GRAPH CENTRALITY ANALYSIS
# =============================================================================

def build_interaction_graph(cursor) -> Optional['nx.DiGraph']:
    """Build directed graph from interactions table."""
    if not NETWORKX_AVAILABLE:
        return None

    G = nx.DiGraph()

    # Get all interactions
    cursor.execute("""
        SELECT author_from, author_to, COUNT(*) as weight
        FROM interactions
        WHERE author_from IS NOT NULL AND author_to IS NOT NULL
        GROUP BY author_from, author_to
    """)

    for author_from, author_to, weight in cursor.fetchall():
        if author_from and author_to:
            G.add_edge(author_from, author_to, weight=weight)

    return G


def compute_graph_centrality(cursor) -> Dict[str, Dict[str, float]]:
    """Compute PageRank, betweenness, and clustering coefficient."""
    if not NETWORKX_AVAILABLE:
        print("  [SKIP] networkx not available")
        return {}

    print("  Building interaction graph...")
    G = build_interaction_graph(cursor)

    if not G or G.number_of_nodes() < 10:
        print(f"  [SKIP] Graph too small: {G.number_of_nodes() if G else 0} nodes")
        return {}

    print(f"  Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    results = {}

    # PageRank (influence)
    print("  Computing PageRank...")
    try:
        pagerank = nx.pagerank(G, alpha=0.85, max_iter=100)
        max_pr = max(pagerank.values()) if pagerank else 1
    except:
        pagerank = {}
        max_pr = 1

    # Betweenness centrality (bridge-ness)
    print("  Computing betweenness centrality...")
    try:
        # Sample for large graphs
        if G.number_of_nodes() > 1000:
            betweenness = nx.betweenness_centrality(G, k=min(500, G.number_of_nodes()))
        else:
            betweenness = nx.betweenness_centrality(G)
        max_bc = max(betweenness.values()) if betweenness else 1
    except:
        betweenness = {}
        max_bc = 1

    # Clustering coefficient (cliqueness)
    print("  Computing clustering coefficients...")
    try:
        # Convert to undirected for clustering
        G_undirected = G.to_undirected()
        clustering = nx.clustering(G_undirected)
    except:
        clustering = {}

    # In/out degree
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())
    max_in = max(in_degrees.values()) if in_degrees else 1
    max_out = max(out_degrees.values()) if out_degrees else 1

    # Combine results
    all_nodes = set(pagerank.keys()) | set(betweenness.keys()) | set(clustering.keys())

    for node in all_nodes:
        pr_norm = pagerank.get(node, 0) / max_pr if max_pr > 0 else 0
        bc_norm = betweenness.get(node, 0) / max_bc if max_bc > 0 else 0
        cc = clustering.get(node, 0)
        in_norm = in_degrees.get(node, 0) / max_in if max_in > 0 else 0
        out_norm = out_degrees.get(node, 0) / max_out if max_out > 0 else 0

        # Combined network score (weighted average)
        network_score = (pr_norm * 0.35 + bc_norm * 0.25 + cc * 0.15 +
                        in_norm * 0.15 + out_norm * 0.10)

        results[node] = {
            'pagerank': round(pr_norm, 4),
            'betweenness': round(bc_norm, 4),
            'clustering_coef': round(cc, 4),
            'in_degree_norm': round(in_norm, 4),
            'out_degree_norm': round(out_norm, 4),
            'network_score': round(network_score, 4),
            'in_degree_raw': in_degrees.get(node, 0),
            'out_degree_raw': out_degrees.get(node, 0),
        }

    print(f"  Computed centrality for {len(results)} accounts")
    return results


# =============================================================================
# 2. ISOLATION FOREST (ANOMALY DETECTION)
# =============================================================================

def extract_features_for_anomaly(cursor) -> Tuple[List[str], List[List[float]]]:
    """Extract feature vectors for all accounts."""

    # Get all accounts with activity
    cursor.execute("""
        SELECT DISTINCT author FROM (
            SELECT author FROM posts WHERE author IS NOT NULL
            UNION
            SELECT author FROM comments WHERE author IS NOT NULL
        )
    """)
    all_authors = [r[0] for r in cursor.fetchall()]

    usernames = []
    features = []

    for author in all_authors:
        # Get timing metrics
        cursor.execute("""
            SELECT c.created_at, p.created_at
            FROM comments c
            JOIN posts p ON c.post_id = p.id
            WHERE c.author = ? AND p.author != ?
            AND c.created_at IS NOT NULL AND p.created_at IS NOT NULL
        """, (author, author))

        response_times = []
        for c_created, p_created in cursor.fetchall():
            try:
                c_time = datetime.fromisoformat(c_created.replace('Z', '+00:00').replace('+00:00', ''))
                p_time = datetime.fromisoformat(p_created.replace('Z', '+00:00').replace('+00:00', ''))
                diff = (c_time - p_time).total_seconds()
                if 0 < diff < 86400:
                    response_times.append(diff)
            except:
                pass

        # Get content for lexical features
        cursor.execute("""
            SELECT content FROM comments WHERE author = ?
            UNION ALL
            SELECT content FROM posts WHERE author = ?
        """, (author, author))
        texts = [r[0] for r in cursor.fetchall() if r[0]]

        # Get activity hours
        cursor.execute("""
            SELECT created_at FROM posts WHERE author = ? AND created_at IS NOT NULL
            UNION ALL
            SELECT created_at FROM comments WHERE author = ? AND created_at IS NOT NULL
        """, (author, author))

        hours = []
        for (created,) in cursor.fetchall():
            try:
                dt = datetime.fromisoformat(created.replace('Z', '+00:00').replace('+00:00', ''))
                hours.append(dt.hour)
            except:
                pass

        # Skip if insufficient data
        if len(response_times) < 2 or len(texts) < 2:
            continue

        # Feature extraction
        avg_response = sum(response_times) / len(response_times)
        min_response = min(response_times)
        response_variance = sum((t - avg_response)**2 for t in response_times) / len(response_times)
        response_std = response_variance ** 0.5

        # Lexical features
        all_words = []
        for text in texts:
            all_words.extend(re.findall(r'\b\w+\b', text.lower()))

        vocab_richness = len(set(all_words)) / len(all_words) if all_words else 0

        # Activity uniformity
        hour_counts = Counter(hours)
        hour_entropy = 0
        for h in range(24):
            p = hour_counts.get(h, 0) / len(hours) if hours else 0
            if p > 0:
                hour_entropy -= p * math.log2(p)
        hour_uniformity = hour_entropy / math.log2(24) if hours else 0

        # Night activity ratio
        night_activity = sum(hour_counts.get(h, 0) for h in range(0, 7))
        night_ratio = night_activity / len(hours) if hours else 0

        # Feature vector
        feature_vec = [
            avg_response,
            min_response,
            response_std,
            vocab_richness,
            hour_uniformity,
            night_ratio,
            len(texts),  # activity level
            len(response_times),  # interaction level
        ]

        usernames.append(author)
        features.append(feature_vec)

    return usernames, features


def run_isolation_forest(cursor) -> Dict[str, Dict[str, float]]:
    """Run Isolation Forest anomaly detection."""
    if not SKLEARN_AVAILABLE:
        print("  [SKIP] sklearn not available")
        return {}

    print("  Extracting features...")
    usernames, features = extract_features_for_anomaly(cursor)

    if len(features) < 50:
        print(f"  [SKIP] Too few samples: {len(features)}")
        return {}

    print(f"  Running Isolation Forest on {len(features)} accounts...")

    # Normalize features
    X = np.array(features)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Run Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.1,  # Expect ~10% anomalies
        random_state=42,
        n_jobs=-1
    )

    predictions = iso_forest.fit_predict(X_scaled)
    scores = iso_forest.decision_function(X_scaled)

    # Normalize scores to 0-1 range (higher = more anomalous)
    min_score = scores.min()
    max_score = scores.max()
    normalized_scores = (max_score - scores) / (max_score - min_score) if max_score != min_score else np.zeros_like(scores)

    results = {}
    anomaly_count = 0

    for i, username in enumerate(usernames):
        is_anomaly = predictions[i] == -1
        if is_anomaly:
            anomaly_count += 1

        results[username] = {
            'anomaly_score': round(float(normalized_scores[i]), 4),
            'is_anomaly': is_anomaly,
            'raw_score': round(float(scores[i]), 4),
        }

    print(f"  Found {anomaly_count} anomalies ({anomaly_count/len(usernames)*100:.1f}%)")
    return results


# =============================================================================
# 3. LEXICAL ENTROPY ANALYSIS
# =============================================================================

def compute_lexical_metrics(cursor) -> Dict[str, Dict[str, float]]:
    """Compute vocabulary richness and lexical entropy per account."""
    print("  Computing lexical metrics...")

    cursor.execute("""
        SELECT DISTINCT author FROM (
            SELECT author FROM posts WHERE author IS NOT NULL
            UNION
            SELECT author FROM comments WHERE author IS NOT NULL
        )
    """)
    all_authors = [r[0] for r in cursor.fetchall()]

    results = {}

    for author in all_authors:
        cursor.execute("""
            SELECT content FROM comments WHERE author = ?
            UNION ALL
            SELECT content FROM posts WHERE author = ?
        """, (author, author))

        texts = [r[0] for r in cursor.fetchall() if r[0]]

        if len(texts) < 3:
            continue

        # Combine all text
        all_text = ' '.join(texts)
        words = re.findall(r'\b\w+\b', all_text.lower())

        if len(words) < 50:
            continue

        # Vocabulary richness (type-token ratio)
        unique_words = set(words)
        vocab_richness = len(unique_words) / len(words)

        # Word frequency distribution
        word_counts = Counter(words)

        # Hapax legomena ratio (words appearing only once)
        hapax = sum(1 for w, c in word_counts.items() if c == 1)
        hapax_ratio = hapax / len(unique_words) if unique_words else 0

        # Lexical entropy (Shannon entropy of word distribution)
        lexical_entropy = 0
        for count in word_counts.values():
            p = count / len(words)
            if p > 0:
                lexical_entropy -= p * math.log2(p)

        # Normalize entropy
        max_entropy = math.log2(len(words)) if len(words) > 1 else 1
        normalized_entropy = lexical_entropy / max_entropy if max_entropy > 0 else 0

        # Yule's K (vocabulary diversity measure)
        # Lower = more diverse
        M1 = len(words)
        M2 = sum(c * c for c in word_counts.values())
        yules_k = 10000 * (M2 - M1) / (M1 * M1) if M1 > 0 else 0

        # Combined lexical score
        # High vocab_richness, high entropy, high hapax = more human-like
        lexical_score = (vocab_richness * 0.4 + normalized_entropy * 0.3 + hapax_ratio * 0.3)

        results[author] = {
            'vocabulary_richness': round(vocab_richness, 4),
            'lexical_entropy': round(normalized_entropy, 4),
            'hapax_ratio': round(hapax_ratio, 4),
            'yules_k': round(yules_k, 4),
            'lexical_score': round(lexical_score, 4),
            'total_words': len(words),
            'unique_words': len(unique_words),
        }

    print(f"  Computed lexical metrics for {len(results)} accounts")
    return results


# =============================================================================
# 4. BURST DETECTION
# =============================================================================

def detect_bursts(cursor,
                  time_window_seconds: int = 60,
                  min_burst_size: int = 5) -> Dict[str, Dict]:
    """Detect coordinated bursts of activity."""
    print(f"  Detecting bursts (window={time_window_seconds}s, min_size={min_burst_size})...")

    # Get all comments with timestamps
    cursor.execute("""
        SELECT id, author, post_id, created_at
        FROM comments
        WHERE created_at IS NOT NULL
        ORDER BY created_at
    """)

    all_comments = []
    for row in cursor.fetchall():
        try:
            dt = datetime.fromisoformat(row[3].replace('Z', '+00:00').replace('+00:00', ''))
            all_comments.append({
                'id': row[0],
                'author': row[1],
                'post_id': row[2],
                'timestamp': dt
            })
        except:
            pass

    if len(all_comments) < 100:
        print(f"  [SKIP] Too few comments: {len(all_comments)}")
        return {}

    print(f"  Analyzing {len(all_comments)} comments...")

    # Find bursts (N accounts responding to same post within time window)
    bursts = []
    post_comments = defaultdict(list)

    for comment in all_comments:
        post_comments[comment['post_id']].append(comment)

    for post_id, comments in post_comments.items():
        if len(comments) < min_burst_size:
            continue

        # Sort by timestamp
        comments.sort(key=lambda x: x['timestamp'])

        # Sliding window burst detection
        for i, start_comment in enumerate(comments):
            window_end = start_comment['timestamp'] + timedelta(seconds=time_window_seconds)

            # Count comments in window
            window_comments = [c for c in comments[i:] if c['timestamp'] <= window_end]

            if len(window_comments) >= min_burst_size:
                # Count unique authors
                unique_authors = set(c['author'] for c in window_comments)

                if len(unique_authors) >= min_burst_size * 0.5:  # At least 50% unique
                    bursts.append({
                        'post_id': post_id,
                        'start_time': start_comment['timestamp'],
                        'window_seconds': time_window_seconds,
                        'comment_count': len(window_comments),
                        'unique_authors': len(unique_authors),
                        'authors': list(unique_authors)
                    })

    # Deduplicate overlapping bursts
    unique_bursts = []
    for burst in bursts:
        # Check if this burst overlaps with existing
        is_duplicate = False
        for existing in unique_bursts:
            if (burst['post_id'] == existing['post_id'] and
                abs((burst['start_time'] - existing['start_time']).total_seconds()) < time_window_seconds):
                is_duplicate = True
                break
        if not is_duplicate:
            unique_bursts.append(burst)

    print(f"  Found {len(unique_bursts)} burst events")

    # Compute per-account burst participation
    account_bursts = defaultdict(list)
    for burst in unique_bursts:
        for author in burst['authors']:
            account_bursts[author].append(burst)

    results = {}
    for author, author_bursts in account_bursts.items():
        max_burst = max(b['comment_count'] for b in author_bursts) if author_bursts else 0

        # Burst score: higher = more suspicious coordinated activity
        burst_score = min(1.0, len(author_bursts) * 0.1 + max_burst * 0.02)

        results[author] = {
            'burst_count': len(author_bursts),
            'max_burst_size': max_burst,
            'burst_score': round(burst_score, 4),
            'burst_details': [
                {
                    'post_id': b['post_id'],
                    'time': b['start_time'].isoformat(),
                    'size': b['comment_count']
                }
                for b in author_bursts[:5]  # Top 5
            ]
        }

    # Also store global burst events
    global_bursts = {
        'total_bursts': len(unique_bursts),
        'top_bursts': [
            {
                'post_id': b['post_id'],
                'time': b['start_time'].isoformat(),
                'size': b['comment_count'],
                'authors': b['unique_authors']
            }
            for b in sorted(unique_bursts, key=lambda x: x['comment_count'], reverse=True)[:20]
        ]
    }

    return results, global_bursts


# =============================================================================
# MAIN ANALYSIS
# =============================================================================

def run_full_v4_analysis():
    """Run all v4 analyses and combine results."""
    print("=" * 70)
    print("  ADVANCED ANALYSIS v4.0 - Account Segmentation System")
    print("=" * 70)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Graph Centrality
    print("\n[1/4] GRAPH CENTRALITY ANALYSIS")
    print("-" * 40)
    graph_results = compute_graph_centrality(cursor)

    # 2. Isolation Forest
    print("\n[2/4] ISOLATION FOREST ANOMALY DETECTION")
    print("-" * 40)
    anomaly_results = run_isolation_forest(cursor)

    # 3. Lexical Entropy
    print("\n[3/4] LEXICAL ENTROPY ANALYSIS")
    print("-" * 40)
    lexical_results = compute_lexical_metrics(cursor)

    # 4. Burst Detection
    print("\n[4/4] BURST DETECTION")
    print("-" * 40)
    burst_results, global_bursts = detect_bursts(cursor)

    # Combine all results
    print("\n" + "=" * 70)
    print("  COMBINING RESULTS")
    print("=" * 70)

    all_accounts = set()
    all_accounts.update(graph_results.keys())
    all_accounts.update(anomaly_results.keys())
    all_accounts.update(lexical_results.keys())
    all_accounts.update(burst_results.keys())

    combined_results = {}

    for username in all_accounts:
        graph = graph_results.get(username, {})
        anomaly = anomaly_results.get(username, {})
        lexical = lexical_results.get(username, {})
        burst = burst_results.get(username, {})

        # Count available signals
        signals = 0
        if graph: signals += 1
        if anomaly: signals += 1
        if lexical: signals += 1
        if burst: signals += 1

        # Determine confidence
        if signals >= 3:
            confidence = "good"
        elif signals >= 2:
            confidence = "moderate"
        elif signals >= 1:
            confidence = "preliminary"
        else:
            confidence = "insufficient"

        combined_results[username] = {
            'username': username,

            # Graph metrics
            'pagerank': float(graph.get('pagerank', 0)),
            'betweenness': float(graph.get('betweenness', 0)),
            'clustering_coef': float(graph.get('clustering_coef', 0)),
            'network_score': float(graph.get('network_score', 0)),

            # Anomaly metrics
            'anomaly_score': float(anomaly.get('anomaly_score', 0)),
            'is_anomaly': bool(anomaly.get('is_anomaly', False)),

            # Lexical metrics
            'vocabulary_richness': float(lexical.get('vocabulary_richness', 0)),
            'lexical_entropy': float(lexical.get('lexical_entropy', 0)),
            'lexical_score': float(lexical.get('lexical_score', 0)),

            # Burst metrics
            'burst_count': int(burst.get('burst_count', 0)),
            'burst_score': float(burst.get('burst_score', 0)),

            # Metadata
            'signals': signals,
            'confidence': confidence,
        }

    print(f"\nCombined results for {len(combined_results)} accounts")

    # Summary statistics
    print("\n" + "=" * 70)
    print("  SUMMARY")
    print("=" * 70)

    # Top by network score
    top_network = sorted(combined_results.values(), key=lambda x: x['network_score'], reverse=True)[:10]
    print("\nTop 10 by Network Score (influence):")
    for r in top_network:
        print(f"  {r['username'][:30]:<30} network={r['network_score']:.3f} pr={r['pagerank']:.3f}")

    # Top anomalies
    anomalies = [r for r in combined_results.values() if r['is_anomaly']]
    print(f"\nAnomalies detected: {len(anomalies)}")
    top_anomalies = sorted(anomalies, key=lambda x: x['anomaly_score'], reverse=True)[:10]
    for r in top_anomalies:
        print(f"  {r['username'][:30]:<30} anomaly_score={r['anomaly_score']:.3f}")

    # Top by lexical score (high = diverse vocabulary)
    top_lexical = sorted(combined_results.values(), key=lambda x: x['lexical_score'], reverse=True)[:10]
    print("\nTop 10 by Lexical Score (vocabulary diversity):")
    for r in top_lexical:
        print(f"  {r['username'][:30]:<30} lexical={r['lexical_score']:.3f} vocab={r['vocabulary_richness']:.3f}")

    # Lowest lexical score (potential bots)
    low_lexical = sorted([r for r in combined_results.values() if r['lexical_score'] > 0],
                         key=lambda x: x['lexical_score'])[:10]
    print("\nLowest 10 by Lexical Score (potential scripted):")
    for r in low_lexical:
        print(f"  {r['username'][:30]:<30} lexical={r['lexical_score']:.3f}")

    # Top burst participants
    top_burst = sorted(combined_results.values(), key=lambda x: x['burst_score'], reverse=True)[:10]
    if any(r['burst_score'] > 0 for r in top_burst):
        print("\nTop 10 by Burst Score (coordinated activity):")
        for r in top_burst:
            if r['burst_score'] > 0:
                print(f"  {r['username'][:30]:<30} burst={r['burst_score']:.3f} count={r['burst_count']}")

    conn.close()

    # Save results
    print("\n" + "=" * 70)
    print("  SAVING RESULTS")
    print("=" * 70)

    # Save to reports directory
    report_dir = REPORTS_DIR / TODAY
    report_dir.mkdir(parents=True, exist_ok=True)

    full_results = {
        'analysis_date': datetime.now().isoformat(),
        'accounts_analyzed': len(combined_results),
        'methods': {
            'graph_centrality': len(graph_results) > 0,
            'isolation_forest': len(anomaly_results) > 0,
            'lexical_entropy': len(lexical_results) > 0,
            'burst_detection': len(burst_results) > 0,
        },
        'accounts': list(combined_results.values()),
        'global_bursts': global_bursts,
    }

    report_path = report_dir / 'v4_analysis.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(full_results, f, indent=2, ensure_ascii=False, default=str)
    print(f"Full report saved: {report_path}")

    # Save for website
    website_data_path = PROJECT_ROOT / "moltbook-observatory" / "public" / "data" / "v4_scores.json"
    website_data_path.parent.mkdir(parents=True, exist_ok=True)

    website_data = {
        'updated': datetime.now().isoformat(),
        'accounts_analyzed': len(combined_results),
        'anomaly_count': len(anomalies),
        'burst_events': global_bursts['total_bursts'] if global_bursts else 0,
        'accounts': list(combined_results.values()),
    }

    with open(website_data_path, 'w', encoding='utf-8') as f:
        json.dump(website_data, f, indent=2, ensure_ascii=False)
    print(f"Website data saved: {website_data_path}")

    # Update actors table with new scores
    print("\nUpdating actors table...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Add new columns if they don't exist
    try:
        cursor.execute("ALTER TABLE actors ADD COLUMN network_score REAL DEFAULT 0")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE actors ADD COLUMN anomaly_score REAL DEFAULT 0")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE actors ADD COLUMN lexical_score REAL DEFAULT 0")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE actors ADD COLUMN burst_score REAL DEFAULT 0")
    except:
        pass

    for username, data in combined_results.items():
        cursor.execute("""
            UPDATE actors SET
                network_score = ?,
                anomaly_score = ?,
                lexical_score = ?,
                burst_score = ?
            WHERE username = ?
        """, (
            data['network_score'],
            data['anomaly_score'],
            data['lexical_score'],
            data['burst_score'],
            username
        ))

    conn.commit()
    conn.close()
    print("Database updated")

    print("\n" + "=" * 70)
    print("  ANALYSIS COMPLETE")
    print("=" * 70)

    return combined_results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Advanced Analysis v4.0")
    parser.add_argument("--all", action="store_true", help="Run all analyses")
    parser.add_argument("--graph", action="store_true", help="Only graph centrality")
    parser.add_argument("--anomaly", action="store_true", help="Only anomaly detection")
    parser.add_argument("--lexical", action="store_true", help="Only lexical analysis")
    parser.add_argument("--burst", action="store_true", help="Only burst detection")

    args = parser.parse_args()

    # Default to all if no specific flag
    if not any([args.all, args.graph, args.anomaly, args.lexical, args.burst]):
        args.all = True

    if args.all:
        run_full_v4_analysis()
    else:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        if args.graph:
            results = compute_graph_centrality(cursor)
            print(f"\nGraph results: {len(results)} accounts")

        if args.anomaly:
            results = run_isolation_forest(cursor)
            print(f"\nAnomaly results: {len(results)} accounts")

        if args.lexical:
            results = compute_lexical_metrics(cursor)
            print(f"\nLexical results: {len(results)} accounts")

        if args.burst:
            results, global_bursts = detect_bursts(cursor)
            print(f"\nBurst results: {len(results)} accounts involved in bursts")

        conn.close()
