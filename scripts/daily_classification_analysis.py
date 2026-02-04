#!/usr/bin/env python3
"""
Daily Classification Analysis
=============================
Analyzes agent classifications for each day separately,
then compares results across days.
"""

import sqlite3
import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from dataclasses import dataclass
from typing import List, Dict, Set

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from config import DB_PATH, REPORTS_DIR, TODAY


@dataclass
class DailyResult:
    date: str
    total_authors: int
    with_timing: int
    classifications: Dict[str, List[str]]  # category -> list of usernames
    top_scores: List[tuple]  # (username, score, category)


def compute_timing_for_date(cursor, username: str, date: str) -> dict:
    """Compute response timing metrics for a specific date."""
    cursor.execute('''
        SELECT c.created_at, p.created_at
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.author = ?
        AND DATE(c.created_at) = ?
        AND p.author != ?
        AND c.created_at IS NOT NULL
        AND p.created_at IS NOT NULL
    ''', (username, date, username))

    times = []
    for c_created, p_created in cursor.fetchall():
        try:
            c_time = datetime.fromisoformat(c_created.replace('Z', '+00:00').replace('+00:00', ''))
            p_time = datetime.fromisoformat(p_created.replace('Z', '+00:00').replace('+00:00', ''))
            diff = (c_time - p_time).total_seconds()
            if 0 < diff < 86400:
                times.append(diff)
        except:
            pass

    if not times:
        return {'samples': 0}

    avg = sum(times) / len(times)
    variance = sum((t - avg) ** 2 for t in times) / len(times) if len(times) > 1 else 0

    return {
        'samples': len(times),
        'avg_seconds': round(avg, 1),
        'std_dev': round(variance ** 0.5, 1)
    }


def compute_repetition_for_date(cursor, username: str, date: str) -> float:
    """Compute phrase repetition for content on a specific date."""
    cursor.execute('''
        SELECT content FROM comments
        WHERE author = ? AND DATE(created_at) = ?
    ''', (username, date))
    comments = [r[0] for r in cursor.fetchall() if r[0]]

    cursor.execute('''
        SELECT content FROM posts
        WHERE author = ? AND DATE(created_at) = ?
    ''', (username, date))
    posts = [r[0] for r in cursor.fetchall() if r[0]]

    all_content = posts + comments
    if len(all_content) < 2:
        return 0.0

    phrases = []
    for content in all_content:
        words = content.split()
        for i in range(len(words) - 2):
            phrases.append(' '.join(words[i:i+3]))

    if not phrases:
        return 0.0

    counts = Counter(phrases)
    repeated = sum(c for _, c in counts.most_common(10) if c > 1)
    return repeated / len(phrases)


def is_emoji_only(cursor, username: str, date: str) -> bool:
    """Check if account only posts emoji on this date."""
    cursor.execute('''
        SELECT content FROM comments
        WHERE author = ? AND DATE(created_at) = ?
    ''', (username, date))
    comments = [r[0] for r in cursor.fetchall() if r[0]]

    if not comments:
        return False

    import re
    emoji_pattern = re.compile(r'^[\s\U0001F300-\U0001F9FF\U00002600-\U000027BF]+$')
    return all(emoji_pattern.match(c) or len(c.strip()) < 5 for c in comments)


def is_minting_only(cursor, username: str, date: str) -> bool:
    """Check if account only posts minting commands."""
    cursor.execute('''
        SELECT content FROM posts
        WHERE author = ? AND DATE(created_at) = ?
    ''', (username, date))
    posts = [r[0] for r in cursor.fetchall() if r[0]]

    if not posts:
        return False

    return all('"p":"mbc-20"' in p or '"op":"mint"' in p for p in posts)


def classify_for_date(cursor, username: str, date: str) -> tuple:
    """Classify an account for a specific date. Returns (category, score)."""
    timing = compute_timing_for_date(cursor, username, date)
    repetition = compute_repetition_for_date(cursor, username, date)

    # Get activity count
    cursor.execute('''
        SELECT COUNT(*) FROM comments
        WHERE author = ? AND DATE(created_at) = ?
    ''', (username, date))
    comment_count = cursor.fetchone()[0]

    cursor.execute('''
        SELECT COUNT(*) FROM posts
        WHERE author = ? AND DATE(created_at) = ?
    ''', (username, date))
    post_count = cursor.fetchone()[0]

    # Special cases
    if is_emoji_only(cursor, username, date) and timing.get('avg_seconds', 999) < 10:
        return 'EMOJI_BOT', 10.0

    if is_minting_only(cursor, username, date):
        return 'MINTING_BOT', 10.0

    if repetition > 0.9:
        return 'SCRIPTED_BOT', 8.0

    # Calculate score
    score = 0.0

    if timing['samples'] >= 2:
        avg = timing.get('avg_seconds', 999)
        if avg < 30:
            score += 3.0
        elif avg < 60:
            score += 1.5
        elif avg < 120:
            score += 0.5

        if timing['samples'] >= 3 and timing.get('std_dev', 999) < 20:
            score += 1.0

    if repetition > 0.5:
        score += 1.0

    if comment_count >= 10:
        score += 0.5

    # Determine category
    if timing['samples'] < 2:
        return 'INSUFFICIENT_DATA', score
    elif score >= 4.0:
        return 'LIKELY_AUTONOMOUS', score
    elif score >= 2.5:
        return 'POSSIBLY_AUTOMATED', score
    elif score >= 1.0:
        return 'INSUFFICIENT_SIGNAL', score
    else:
        return 'LIKELY_HUMAN', score


def analyze_day(cursor, date: str) -> DailyResult:
    """Analyze all accounts for a specific date."""
    # Get all authors active on this date
    cursor.execute('''
        SELECT DISTINCT author FROM (
            SELECT author FROM posts WHERE DATE(created_at) = ?
            UNION
            SELECT author FROM comments WHERE DATE(created_at) = ?
        )
    ''', (date, date))
    authors = [r[0] for r in cursor.fetchall() if r[0]]

    classifications = defaultdict(list)
    top_scores = []
    with_timing = 0

    for author in authors:
        category, score = classify_for_date(cursor, author, date)
        classifications[category].append(author)

        if score > 0:
            top_scores.append((author, score, category))

        timing = compute_timing_for_date(cursor, author, date)
        if timing['samples'] >= 2:
            with_timing += 1

    top_scores.sort(key=lambda x: x[1], reverse=True)

    return DailyResult(
        date=date,
        total_authors=len(authors),
        with_timing=with_timing,
        classifications=dict(classifications),
        top_scores=top_scores[:20]
    )


def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get all dates with data
    cursor.execute('''
        SELECT DISTINCT DATE(created_at) as d
        FROM comments
        WHERE created_at IS NOT NULL
        ORDER BY d
    ''')
    dates = [r[0] for r in cursor.fetchall()]

    print("=" * 80)
    print("DAILY CLASSIFICATION ANALYSIS")
    print("=" * 80)
    print(f"Analyzing {len(dates)} days: {dates[0]} to {dates[-1]}")
    print()

    all_results = []

    for date in dates:
        print(f"\n{'='*60}")
        print(f"DATE: {date}")
        print("=" * 60)

        result = analyze_day(cursor, date)
        all_results.append(result)

        print(f"Total authors: {result.total_authors}")
        print(f"With timing data: {result.with_timing}")
        print()

        print("Classifications:")
        for cat in ['LIKELY_AUTONOMOUS', 'POSSIBLY_AUTOMATED', 'SCRIPTED_BOT',
                    'EMOJI_BOT', 'MINTING_BOT', 'LIKELY_HUMAN', 'INSUFFICIENT_SIGNAL', 'INSUFFICIENT_DATA']:
            count = len(result.classifications.get(cat, []))
            if count > 0:
                names = result.classifications[cat][:5]
                more = f" (+{count-5} more)" if count > 5 else ""
                print(f"  {cat}: {count}")
                print(f"    Examples: {', '.join(names)}{more}")

        print()
        print("Top automation scores:")
        for name, score, cat in result.top_scores[:10]:
            print(f"  {name}: {score:.1f} ({cat})")

    # Cross-day comparison
    print("\n" + "=" * 80)
    print("CROSS-DAY COMPARISON")
    print("=" * 80)

    # Track which agents appear in which categories across days
    agent_history = defaultdict(list)  # agent -> [(date, category, score)]

    for result in all_results:
        for cat, agents in result.classifications.items():
            for agent in agents:
                score = next((s for n, s, c in result.top_scores if n == agent), 0)
                agent_history[agent].append((result.date, cat, score))

    # Find consistent agents (same category across multiple days)
    print("\nCONSISTENT AGENTS (same category 2+ days):")
    consistent = []
    for agent, history in agent_history.items():
        if len(history) >= 2:
            categories = [h[1] for h in history]
            if len(set(categories)) == 1 and categories[0] not in ['INSUFFICIENT_DATA', 'INSUFFICIENT_SIGNAL']:
                avg_score = sum(h[2] for h in history) / len(history)
                consistent.append((agent, categories[0], len(history), avg_score))

    consistent.sort(key=lambda x: (x[1], -x[3]))
    for agent, cat, days, avg_score in consistent[:30]:
        print(f"  {agent}: {cat} ({days} days, avg score {avg_score:.1f})")

    # Find changing agents
    print("\nCHANGING AGENTS (different categories across days):")
    changing = []
    for agent, history in agent_history.items():
        if len(history) >= 2:
            categories = set(h[1] for h in history if h[1] not in ['INSUFFICIENT_DATA', 'INSUFFICIENT_SIGNAL'])
            if len(categories) > 1:
                changing.append((agent, history))

    for agent, history in changing[:20]:
        transitions = " → ".join(f"{h[0][-5:]}:{h[1][:10]}" for h in history)
        print(f"  {agent}: {transitions}")

    # Summary statistics
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    all_likely_auto = set()
    all_possibly_auto = set()
    all_scripted = set()
    all_emoji = set()
    all_minting = set()

    for result in all_results:
        all_likely_auto.update(result.classifications.get('LIKELY_AUTONOMOUS', []))
        all_possibly_auto.update(result.classifications.get('POSSIBLY_AUTOMATED', []))
        all_scripted.update(result.classifications.get('SCRIPTED_BOT', []))
        all_emoji.update(result.classifications.get('EMOJI_BOT', []))
        all_minting.update(result.classifications.get('MINTING_BOT', []))

    print(f"\nUnique agents across all days:")
    print(f"  LIKELY_AUTONOMOUS: {len(all_likely_auto)}")
    print(f"  POSSIBLY_AUTOMATED: {len(all_possibly_auto)}")
    print(f"  SCRIPTED_BOT: {len(all_scripted)}")
    print(f"  EMOJI_BOT: {len(all_emoji)}")
    print(f"  MINTING_BOT: {len(all_minting)}")

    print(f"\nLIKELY_AUTONOMOUS agents:")
    for agent in sorted(all_likely_auto):
        history = agent_history[agent]
        days = len(history)
        avg_score = sum(h[2] for h in history) / len(history)
        print(f"  {agent} ({days} days, avg {avg_score:.1f})")

    print(f"\nPOSSIBLY_AUTOMATED agents:")
    for agent in sorted(all_possibly_auto):
        history = agent_history[agent]
        days = len(history)
        avg_score = sum(h[2] for h in history) / len(history)
        print(f"  {agent} ({days} days, avg {avg_score:.1f})")

    # Save results
    output = {
        'generated': datetime.now().isoformat(),
        'days_analyzed': len(dates),
        'date_range': [dates[0], dates[-1]],
        'daily_results': [],
        'cross_day': {
            'likely_autonomous': list(all_likely_auto),
            'possibly_automated': list(all_possibly_auto),
            'scripted_bots': list(all_scripted),
            'emoji_bots': list(all_emoji),
            'minting_bots': list(all_minting)
        },
        'agent_history': {k: v for k, v in agent_history.items() if len(v) >= 2}
    }

    for result in all_results:
        output['daily_results'].append({
            'date': result.date,
            'total_authors': result.total_authors,
            'with_timing': result.with_timing,
            'classifications': result.classifications,
            'top_scores': [(n, s, c) for n, s, c in result.top_scores]
        })

    output_path = REPORTS_DIR / TODAY / 'daily_classification_analysis.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to {output_path}")

    conn.close()


if __name__ == '__main__':
    main()
