#!/usr/bin/env python3
"""
Automation Classifier v2.0
==========================
Epistemically honest classification based on HARD signals only.
Does NOT use: self-identification, username, style markers
DOES use: timing, repetition, activity patterns
"""

import sqlite3
import sys
import json
from datetime import datetime
from collections import Counter
from dataclasses import dataclass
from typing import Optional, List, Tuple

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from config import DB_PATH, REPORTS_DIR, TODAY


@dataclass
class ClassificationResult:
    username: str
    category: str
    confidence: float
    automation_score: float
    evidence: List[str]
    data_quality: str  # 'high', 'medium', 'low', 'insufficient'
    metrics: dict


def compute_timing_metrics(cursor, username: str) -> dict:
    """Compute response timing metrics from comments."""
    cursor.execute('''
        SELECT c.created_at, p.created_at
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.author = ? AND p.author != ?
        AND c.created_at IS NOT NULL AND p.created_at IS NOT NULL
    ''', (username, username))

    times = []
    for c_created, p_created in cursor.fetchall():
        try:
            c_time = datetime.fromisoformat(c_created.replace('Z', '+00:00').replace('+00:00', ''))
            p_time = datetime.fromisoformat(p_created.replace('Z', '+00:00').replace('+00:00', ''))
            diff = (c_time - p_time).total_seconds()
            if 0 < diff < 86400:  # Within 24h, positive
                times.append(diff)
        except:
            pass

    if not times:
        return {'samples': 0}

    avg = sum(times) / len(times)
    variance = sum((t - avg) ** 2 for t in times) / len(times) if len(times) > 1 else 0
    std_dev = variance ** 0.5

    return {
        'samples': len(times),
        'avg_seconds': round(avg, 1),
        'min_seconds': round(min(times), 1),
        'max_seconds': round(max(times), 1),
        'std_dev': round(std_dev, 1),
        'times': times
    }


def compute_repetition(cursor, username: str) -> float:
    """Compute phrase repetition rate."""
    cursor.execute('SELECT content FROM posts WHERE author = ?', (username,))
    posts = [r[0] for r in cursor.fetchall() if r[0]]

    cursor.execute('SELECT content FROM comments WHERE author = ?', (username,))
    comments = [r[0] for r in cursor.fetchall() if r[0]]

    all_content = posts + comments
    if len(all_content) < 2:
        return 0.0

    # Extract 3-grams
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


def compute_activity_pattern(cursor, username: str) -> dict:
    """Analyze activity hours to detect 24/7 patterns."""
    cursor.execute('''
        SELECT created_at FROM posts WHERE author = ? AND created_at IS NOT NULL
        UNION ALL
        SELECT created_at FROM comments WHERE author = ? AND created_at IS NOT NULL
    ''', (username, username))

    hours = []
    for (created,) in cursor.fetchall():
        try:
            dt = datetime.fromisoformat(created.replace('Z', '+00:00').replace('+00:00', ''))
            hours.append(dt.hour)
        except:
            pass

    if len(hours) < 10:
        return {'has_night_gap': None, 'hours_covered': 0}

    hour_counts = Counter(hours)
    hours_with_activity = len([h for h in range(24) if hour_counts.get(h, 0) > 0])

    # Check for night gap (0-6 AM)
    night_hours = sum(hour_counts.get(h, 0) for h in range(0, 7))
    day_hours = sum(hour_counts.get(h, 0) for h in range(7, 24))

    has_night_gap = night_hours < day_hours * 0.1 if day_hours > 0 else None

    return {
        'has_night_gap': has_night_gap,
        'hours_covered': hours_with_activity,
        'night_activity': night_hours,
        'day_activity': day_hours
    }


def classify_account(cursor, username: str) -> ClassificationResult:
    """Classify a single account using hard signals only."""

    # Get basic stats
    cursor.execute('SELECT COUNT(*) FROM posts WHERE author = ?', (username,))
    post_count = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(*) FROM comments WHERE author = ?', (username,))
    comment_count = cursor.fetchone()[0]

    total_activity = post_count + comment_count

    # Compute metrics
    timing = compute_timing_metrics(cursor, username)
    repetition = compute_repetition(cursor, username)
    activity = compute_activity_pattern(cursor, username)

    # Determine data quality
    if timing['samples'] >= 10:
        data_quality = 'high'
    elif timing['samples'] >= 5:
        data_quality = 'medium'
    elif timing['samples'] >= 2:
        data_quality = 'low'
    else:
        data_quality = 'insufficient'

    # Calculate automation score (ONLY hard signals)
    score = 0.0
    evidence = []

    # Timing signals (strongest)
    if timing['samples'] >= 2:
        avg = timing['avg_seconds']
        if avg < 30:
            score += 3.0
            evidence.append(f"Very fast avg response: {avg}s")
        elif avg < 60:
            score += 1.5
            evidence.append(f"Fast avg response: {avg}s")
        elif avg < 120:
            score += 0.5
            evidence.append(f"Moderately fast avg response: {avg}s")

        # Low variance = consistent = automation
        if timing['samples'] >= 5 and timing['std_dev'] < 20:
            score += 1.0
            evidence.append(f"Low timing variance: ±{timing['std_dev']}s")

    # Repetition signals
    if repetition > 0.9:
        score += 2.0
        evidence.append(f"Very high repetition: {repetition:.0%}")
    elif repetition > 0.5:
        score += 1.0
        evidence.append(f"High repetition: {repetition:.0%}")

    # Activity volume
    if comment_count >= 20:
        score += 0.5
        evidence.append(f"High comment volume: {comment_count}")

    # 24/7 activity
    if activity['has_night_gap'] is False:
        score += 1.5
        evidence.append("No night gap detected (24/7 activity)")
    elif activity['has_night_gap'] is True:
        score -= 0.5
        evidence.append("Has night gap (human pattern)")

    # Determine category
    if repetition > 0.9:
        category = 'SCRIPTED_BOT'
        confidence = 0.95
    elif score >= 4.0 and data_quality in ('high', 'medium'):
        category = 'LIKELY_AUTONOMOUS'
        confidence = min(0.85, 0.60 + score * 0.05)
    elif score >= 2.5 and data_quality in ('high', 'medium'):
        category = 'POSSIBLY_AUTOMATED'
        confidence = min(0.70, 0.45 + score * 0.05)
    elif data_quality == 'insufficient':
        category = 'INSUFFICIENT_DATA'
        confidence = 0.0
    elif timing['samples'] >= 5 and timing.get('avg_seconds', 0) > 300:
        # Slow responders with good data = human paced
        category = 'HUMAN_PACED'
        confidence = 0.70 if timing['avg_seconds'] > 3600 else 0.55
    elif score >= 1.0 and data_quality in ('high', 'medium'):
        # Medium score with good data but not slow - mixed signals
        category = 'MODERATE_SIGNALS'
        confidence = 0.45
    elif score >= 1.0:
        category = 'INSUFFICIENT_SIGNAL'
        confidence = 0.40
    else:
        category = 'HUMAN_PACED'
        confidence = 0.60 if timing['samples'] >= 5 else 0.40

    return ClassificationResult(
        username=username,
        category=category,
        confidence=round(confidence, 2),
        automation_score=round(score, 2),
        evidence=evidence,
        data_quality=data_quality,
        metrics={
            'posts': post_count,
            'comments': comment_count,
            'timing': timing,
            'repetition': round(repetition, 3),
            'activity': activity
        }
    )


def classify_all_accounts(min_activity: int = 1) -> List[ClassificationResult]:
    """Classify all accounts with minimum activity threshold."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get all accounts
    cursor.execute('''
        SELECT DISTINCT author FROM (
            SELECT author FROM posts
            UNION
            SELECT author FROM comments
        )
    ''')
    all_authors = [r[0] for r in cursor.fetchall() if r[0]]

    results = []
    for author in all_authors:
        result = classify_account(cursor, author)
        if result.metrics['posts'] + result.metrics['comments'] >= min_activity:
            results.append(result)

    conn.close()
    return results


if __name__ == '__main__':
    print("=" * 80)
    print("AUTOMATION CLASSIFIER v2.0")
    print("=" * 80)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Test on specific accounts
    test_accounts = [
        'claude_opus_45', 'TokhyAgent', 'botcrong', 'James',
        'VulnHunterBot', 'AGNT', 'xinmolt', 'Noosphere_Observer'
    ]

    print("\n### TEST CLASSIFICATION ###\n")

    for username in test_accounts:
        result = classify_account(cursor, username)
        print(f"\n{username}:")
        print(f"  Category: {result.category}")
        print(f"  Confidence: {result.confidence:.0%}")
        print(f"  Score: {result.automation_score}")
        print(f"  Data quality: {result.data_quality}")
        print(f"  Evidence: {result.evidence}")
        print(f"  Posts: {result.metrics['posts']}, Comments: {result.metrics['comments']}")
        if result.metrics['timing']['samples'] > 0:
            t = result.metrics['timing']
            print(f"  Timing: avg={t['avg_seconds']}s, std={t['std_dev']}s ({t['samples']} samples)")

    conn.close()

    # Run full classification
    print("\n" + "=" * 80)
    print("FULL CLASSIFICATION")
    print("=" * 80)

    results = classify_all_accounts(min_activity=5)

    # Summary by category
    from collections import Counter
    categories = Counter(r.category for r in results)

    print(f"\nTotal accounts (≥5 activity): {len(results)}")
    print("\nBy category:")
    for cat, count in categories.most_common():
        print(f"  {cat}: {count}")

    # Top automation scores
    print("\n### TOP AUTOMATION SCORES ###")
    top = sorted(results, key=lambda r: r.automation_score, reverse=True)[:15]
    for r in top:
        print(f"  {r.username}: {r.automation_score} ({r.category}, {r.confidence:.0%})")

    # Save results
    output = []
    for r in results:
        output.append({
            'username': r.username,
            'category': r.category,
            'confidence': r.confidence,
            'automation_score': r.automation_score,
            'evidence': r.evidence,
            'data_quality': r.data_quality,
            'metrics': r.metrics
        })

    output_path = REPORTS_DIR / TODAY / 'classifications_v2.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False, default=str)

    print(f"\nSaved to {output_path}")
