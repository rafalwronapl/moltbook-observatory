#!/usr/bin/env python3
"""
Deep AI Agent Analysis
======================
1. Reclassify MIXED accounts with stricter thresholds
2. Deep dive into each confirmed AI agent
3. Verify if they're really AI
"""

import sys
import sqlite3
import json
import re
from datetime import datetime
from pathlib import Path
from collections import Counter

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, str(Path(__file__).parent))
from config import DB_PATH, REPORTS_DIR, TODAY, PROJECT_ROOT

# Load fingerprint results
RESULTS_PATH = REPORTS_DIR / TODAY / "model_fingerprints.json"


def load_results():
    with open(RESULTS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def reclassify_mixed():
    """Reclassify MIXED accounts using additional criteria."""
    results = load_results()

    mixed = [r for r in results if r['human_ai']['classification'] == 'MIXED']

    print("=" * 60)
    print("RECLASSIFYING MIXED ACCOUNTS")
    print("=" * 60)
    print(f"Total MIXED: {len(mixed)}")

    # New categories
    likely_bot = []      # Scripted bot (high repetition, low variance)
    likely_ai = []       # Genuine AI agent
    likely_human = []    # Human operator
    still_mixed = []     # Still unclear

    for r in mixed:
        features = r.get('features', {})
        ai_score = r['human_ai'].get('ai_score', 0)
        human_score = r['human_ai'].get('human_score', 0)

        # Strong bot signals
        repetition = features.get('phrase_repetition', 0)
        long_rep = features.get('long_phrase_repetition', 0)
        burstiness = features.get('burstiness_score', 0)
        perplexity = features.get('perplexity_estimate', 0.5)

        # Classification rules

        # 1. Very high repetition = scripted bot
        if repetition > 0.5 or long_rep > 0.1:
            likely_bot.append({
                **r,
                'reclassified': 'SCRIPTED_BOT',
                'reason': f'high_repetition ({repetition:.2f})'
            })
            continue

        # 2. Very low burstiness + low perplexity = AI agent
        if burstiness < -0.4 and perplexity < 0.4:
            likely_ai.append({
                **r,
                'reclassified': 'LIKELY_AI',
                'reason': f'low_burstiness ({burstiness:.2f}) + low_perplexity ({perplexity:.2f})'
            })
            continue

        # 3. AI score much higher than human
        if ai_score > human_score * 1.5 and ai_score > 1.5:
            likely_ai.append({
                **r,
                'reclassified': 'LIKELY_AI',
                'reason': f'high_ai_score ({ai_score:.1f} vs {human_score:.1f})'
            })
            continue

        # 4. Human score much higher
        if human_score > ai_score * 1.5 and human_score > 1.5:
            likely_human.append({
                **r,
                'reclassified': 'LIKELY_HUMAN',
                'reason': f'high_human_score ({human_score:.1f} vs {ai_score:.1f})'
            })
            continue

        # 5. Check username patterns
        username = r['username'].lower()
        bot_patterns = ['bot', 'ai', 'agent', 'claw', 'minter', 'assistant', 'auto']
        if any(p in username for p in bot_patterns):
            if ai_score > human_score:
                likely_ai.append({
                    **r,
                    'reclassified': 'LIKELY_AI',
                    'reason': 'bot_name_pattern + ai_signals'
                })
                continue

        # Still mixed
        still_mixed.append(r)

    # Report
    print(f"\nReclassification results:")
    print(f"  SCRIPTED_BOT: {len(likely_bot)}")
    print(f"  LIKELY_AI: {len(likely_ai)}")
    print(f"  LIKELY_HUMAN: {len(likely_human)}")
    print(f"  STILL_MIXED: {len(still_mixed)}")

    print(f"\n--- Top SCRIPTED_BOT (by repetition) ---")
    likely_bot.sort(key=lambda x: x.get('features', {}).get('phrase_repetition', 0), reverse=True)
    for r in likely_bot[:15]:
        rep = r.get('features', {}).get('phrase_repetition', 0)
        print(f"  {r['username'][:25]:<25} rep={rep:.2f} | {r['reason']}")

    print(f"\n--- Top LIKELY_AI ---")
    likely_ai.sort(key=lambda x: x['human_ai'].get('ai_score', 0), reverse=True)
    for r in likely_ai[:15]:
        print(f"  {r['username'][:25]:<25} model={r['model']['model']:<8} | {r['reason']}")

    # Save reclassified
    reclassified = {
        'scripted_bots': [{'username': r['username'], 'reason': r['reason'],
                          'model': r['model']['model']} for r in likely_bot],
        'likely_ai': [{'username': r['username'], 'reason': r['reason'],
                      'model': r['model']['model']} for r in likely_ai],
        'likely_human': [{'username': r['username'], 'reason': r['reason']} for r in likely_human],
        'still_mixed': len(still_mixed),
        'total_new_ai': len(likely_bot) + len(likely_ai)
    }

    output_path = REPORTS_DIR / TODAY / "reclassified_mixed.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(reclassified, f, indent=2)
    print(f"\nSaved to: {output_path}")

    return likely_bot, likely_ai, likely_human, still_mixed


def deep_analyze_ai_agents():
    """Deep analysis of each confirmed AI agent."""
    results = load_results()

    # Get confirmed AI agents
    ai_agents = [r for r in results
                 if r['human_ai']['classification'] == 'AI_AGENT'
                 and r['human_ai']['confidence'] >= 0.6]

    print("\n" + "=" * 60)
    print(f"DEEP ANALYSIS OF {len(ai_agents)} CONFIRMED AI AGENTS")
    print("=" * 60)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    agent_profiles = []

    for r in ai_agents:
        username = r['username']
        print(f"\n{'='*50}")
        print(f"AGENT: {username}")
        print(f"{'='*50}")

        profile = {
            'username': username,
            'model': r['model']['model'],
            'model_confidence': r['model']['confidence'],
            'ai_confidence': r['human_ai']['confidence']
        }

        # Get posts
        cursor.execute("""
            SELECT id, title, content, created_at, upvotes, comment_count
            FROM posts WHERE author = ?
            ORDER BY created_at DESC
        """, (username,))
        posts = cursor.fetchall()
        profile['post_count'] = len(posts)

        # Get comments
        cursor.execute("""
            SELECT id, content, created_at, post_id
            FROM comments WHERE author = ?
            ORDER BY created_at DESC
        """, (username,))
        comments = cursor.fetchall()
        profile['comment_count'] = len(comments)

        print(f"Posts: {len(posts)}, Comments: {len(comments)}")
        print(f"Model: {r['model']['model']} (conf: {r['model']['confidence']:.2f})")
        print(f"AI Confidence: {r['human_ai']['confidence']:.2f}")

        # Key features
        features = r.get('features', {})
        print(f"\nKey Features:")
        print(f"  Burstiness: {features.get('burstiness_score', 'N/A')}")
        print(f"  Perplexity: {features.get('perplexity_estimate', 'N/A')}")
        print(f"  Phrase Repetition: {features.get('phrase_repetition', 'N/A')}")
        print(f"  Vocab Richness: {features.get('vocab_richness', 'N/A')}")

        profile['features'] = {
            'burstiness': features.get('burstiness_score'),
            'perplexity': features.get('perplexity_estimate'),
            'repetition': features.get('phrase_repetition'),
            'vocab_richness': features.get('vocab_richness')
        }

        # Activity pattern
        timing = r.get('response_timing', {})
        print(f"\nResponse Timing:")
        print(f"  Pattern: {timing.get('pattern', 'N/A')}")
        if timing.get('details'):
            details = timing['details']
            print(f"  Median: {details.get('median_seconds', 'N/A')}s")
            print(f"  Instant ratio: {details.get('instant_ratio', 'N/A')}")

        profile['timing'] = timing.get('pattern')

        # Sample content
        print(f"\nSample Posts:")
        for post in posts[:3]:
            title = (post[1] or '')[:60]
            content_preview = (post[2] or '')[:100].replace('\n', ' ')
            print(f"  - {title}")
            if content_preview:
                print(f"    \"{content_preview}...\"")

        profile['sample_posts'] = [{'title': p[1], 'preview': (p[2] or '')[:200]} for p in posts[:5]]

        # Interactions
        cursor.execute("""
            SELECT DISTINCT author_to FROM interactions WHERE author_from = ?
            UNION
            SELECT DISTINCT author_from FROM interactions WHERE author_to = ?
        """, (username, username))
        connections = cursor.fetchall()
        profile['connections'] = len(connections)
        print(f"\nNetwork: {len(connections)} connections")

        # Verification signals
        print(f"\nVerification Signals:")
        signals = r['human_ai'].get('signals', [])
        ai_signals = [(t, c) for t, c in signals if t == 'AI']
        human_signals = [(t, c) for t, c in signals if t == 'HUMAN']
        print(f"  AI signals: {len(ai_signals)} (total: {sum(c for _, c in ai_signals):.2f})")
        print(f"  Human signals: {len(human_signals)} (total: {sum(c for _, c in human_signals):.2f})")

        profile['ai_signal_count'] = len(ai_signals)
        profile['human_signal_count'] = len(human_signals)

        # Verdict
        verdict = "CONFIRMED_AI"
        confidence_reasons = []

        if len(posts) + len(comments) < 3:
            verdict = "INSUFFICIENT_DATA"
            confidence_reasons.append("too few posts")
        elif features.get('phrase_repetition', 0) > 0.5:
            verdict = "LIKELY_SCRIPTED_BOT"
            confidence_reasons.append("very high repetition")
        elif timing.get('pattern') == 'AI_FAST' and features.get('burstiness_score', 0) < -0.3:
            verdict = "CONFIRMED_AI"
            confidence_reasons.append("fast responses + uniform style")
        elif len(ai_signals) > len(human_signals) * 2:
            verdict = "LIKELY_AI"
            confidence_reasons.append("strong AI signals")
        else:
            verdict = "NEEDS_REVIEW"
            confidence_reasons.append("mixed signals")

        profile['verdict'] = verdict
        profile['verdict_reasons'] = confidence_reasons

        print(f"\n>>> VERDICT: {verdict}")
        print(f"    Reasons: {', '.join(confidence_reasons)}")

        agent_profiles.append(profile)

    conn.close()

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    verdicts = Counter(p['verdict'] for p in agent_profiles)
    for verdict, count in verdicts.most_common():
        print(f"  {verdict}: {count}")

    # Save profiles
    output_path = REPORTS_DIR / TODAY / "ai_agent_profiles.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(agent_profiles, f, indent=2, ensure_ascii=False)
    print(f"\nProfiles saved to: {output_path}")

    return agent_profiles


def analyze_unknown():
    """Analyze UNKNOWN accounts to find any with enough data."""
    results = load_results()

    unknown = [r for r in results if r['human_ai']['classification'] == 'UNKNOWN']

    print("\n" + "=" * 60)
    print(f"ANALYZING {len(unknown)} UNKNOWN ACCOUNTS")
    print("=" * 60)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Find UNKNOWN with most activity
    unknown_with_activity = []

    for r in unknown:
        username = r['username']
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM posts WHERE author = ?) as posts,
                (SELECT COUNT(*) FROM comments WHERE author = ?) as comments
        """, (username, username))
        row = cursor.fetchone()
        posts, comments = row[0], row[1]

        if posts + comments >= 3:
            unknown_with_activity.append({
                'username': username,
                'posts': posts,
                'comments': comments,
                'total': posts + comments,
                'model': r['model']['model']
            })

    conn.close()

    print(f"UNKNOWN with 3+ posts/comments: {len(unknown_with_activity)}")

    # Sort by activity
    unknown_with_activity.sort(key=lambda x: x['total'], reverse=True)

    print(f"\nTop UNKNOWN by activity (these need manual review):")
    for u in unknown_with_activity[:20]:
        print(f"  {u['username'][:25]:<25} posts={u['posts']}, comments={u['comments']}, model={u['model']}")

    return unknown_with_activity


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=['mixed', 'ai', 'unknown', 'all'], default='all')
    args = parser.parse_args()

    if args.mode in ['mixed', 'all']:
        reclassify_mixed()

    if args.mode in ['ai', 'all']:
        deep_analyze_ai_agents()

    if args.mode in ['unknown', 'all']:
        analyze_unknown()
