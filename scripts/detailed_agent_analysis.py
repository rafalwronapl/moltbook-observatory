#!/usr/bin/env python3
"""Detailed analysis of 19 likely automated accounts."""
import sqlite3
import json
import sys
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from config import DB_PATH, REPORTS_DIR, TODAY

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# The 19 accounts identified as likely automated
LIKELY_AUTOMATED = [
    'claude_opus_45', 'StarforgeDynamics', 'Aetherx402', 'botcrong', 'NewtScamander',
    'TokhyAgent', 'Exuvia', 'James', 'xinmolt', 'Root_of_Trust_05',
    'AGNT', 'burtrom', 'Freemason', 'Nakamoto', 'XiaoWang_Assistant',
    'WhenIMoltYouMoltWeMolt', 'Web4Evangelist', 'VulnHunterBot', 'ClawdGenie'
]

print("=" * 100)
print("DETAILED ANALYSIS OF 19 LIKELY AUTOMATED ACCOUNTS")
print("=" * 100)

detailed_profiles = []

for username in LIKELY_AUTOMATED:
    print(f"\n{'='*80}")
    print(f"### {username} ###")
    print("=" * 80)

    profile = {'username': username}

    # Get posts
    cursor.execute('''
        SELECT title, content, created_at
        FROM posts WHERE author = ?
        ORDER BY created_at
    ''', (username,))
    posts = cursor.fetchall()

    # Get comments
    cursor.execute('''
        SELECT content, created_at, post_id
        FROM comments WHERE author = ?
        ORDER BY created_at
    ''', (username,))
    comments = cursor.fetchall()

    # Compute timing from comments
    # Find response times: time between post and user's first comment on that post
    timing = []
    cursor.execute('''
        SELECT c.content, c.created_at, p.created_at, p.author
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.author = ? AND p.author != ?
    ''', (username, username))

    for c_content, c_created, p_created, p_author in cursor.fetchall():
        if c_created and p_created:
            try:
                c_time = datetime.fromisoformat(c_created.replace('Z', '+00:00').replace('+00:00', ''))
                p_time = datetime.fromisoformat(p_created.replace('Z', '+00:00').replace('+00:00', ''))
                diff_seconds = (c_time - p_time).total_seconds()
                if 0 < diff_seconds < 86400:  # Within 24 hours, positive
                    timing.append(diff_seconds)
            except:
                pass

    # Get network connections from interactions
    cursor.execute('''
        SELECT author_to, COUNT(*) as cnt, interaction_type
        FROM interactions WHERE author_from = ?
        GROUP BY author_to
        ORDER BY cnt DESC LIMIT 10
    ''', (username,))
    connections = cursor.fetchall()

    profile['stats'] = {
        'posts': len(posts),
        'comments': len(comments),
        'total_activity': len(posts) + len(comments),
        'timing_samples': len(timing),
        'connections': len(connections)
    }

    print(f"\nSTATISTICS:")
    print(f"  Posts: {len(posts)}, Comments: {len(comments)}")
    print(f"  Timing samples: {len(timing)}")
    print(f"  Network connections: {len(connections)}")

    # Timing analysis
    if timing:
        times = [t for t in timing if t is not None]
        if times:
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            profile['timing'] = {
                'avg_seconds': round(avg_time, 1),
                'min_seconds': round(min_time, 1),
                'max_seconds': round(max_time, 1),
                'samples': len(times)
            }
            print(f"\nTIMING:")
            print(f"  Average: {avg_time:.1f}s, Min: {min_time:.1f}s, Max: {max_time:.1f}s")

            # Classification based on timing
            if avg_time < 30:
                timing_verdict = "VERY_FAST (likely fully automated)"
            elif avg_time < 60:
                timing_verdict = "FAST (likely automated)"
            elif avg_time < 120:
                timing_verdict = "MODERATELY_FAST (possibly automated)"
            else:
                timing_verdict = "HUMAN_PACED"
            print(f"  Timing verdict: {timing_verdict}")
            profile['timing_verdict'] = timing_verdict

    # Content analysis
    all_content = []
    for title, content, _ in posts:
        if title:
            all_content.append(title)
        if content:
            all_content.append(content)
    for content, _, _ in comments:
        if content:
            all_content.append(content)

    full_text = ' '.join(all_content)
    profile['content_length'] = len(full_text)

    # AI self-reference detection
    ai_patterns = {
        'direct_ai': ['I am an AI', "I'm an AI", 'AI agent', 'as an AI', 'language model'],
        'operator_refs': ['my human', 'my owner', 'my operator', 'my creator'],
        'assistant_refs': ['assistant', 'here to help', 'how can I help'],
        'model_refs': ['Claude', 'GPT', 'LLM', 'trained by', 'OpenAI', 'Anthropic']
    }

    found_refs = {}
    text_lower = full_text.lower()
    for category, patterns in ai_patterns.items():
        matches = [p for p in patterns if p.lower() in text_lower]
        if matches:
            found_refs[category] = matches

    profile['ai_references'] = found_refs

    print(f"\nAI SELF-REFERENCES:")
    if found_refs:
        for cat, refs in found_refs.items():
            print(f"  {cat}: {refs}")
    else:
        print("  None found")

    # Content samples
    print(f"\nCONTENT SAMPLES:")
    sample_count = 0
    for title, content, created in posts[:3]:
        if sample_count >= 3:
            break
        print(f"\n  [POST] {title[:60] if title else '(no title)'}...")
        if content:
            print(f"  {content[:200]}...")
        sample_count += 1

    for content, created, post_id in comments[:3]:
        if sample_count >= 5:
            break
        if content:
            print(f"\n  [COMMENT] {content[:200]}...")
        sample_count += 1

    profile['sample_posts'] = [(t[:100] if t else '', c[:300] if c else '') for t, c, _ in posts[:3]]
    profile['sample_comments'] = [c[:300] if c else '' for c, _, _ in comments[:3]]

    # Network analysis
    print(f"\nNETWORK CONNECTIONS (top 5):")
    for target, weight, itype in connections[:5]:
        print(f"  -> {target}: {weight} ({itype})")

    profile['top_connections'] = [(t, w, i) for t, w, i in connections[:5]]

    # Repetition analysis
    if len(all_content) >= 2:
        from collections import Counter
        phrases = []
        for c in all_content:
            words = c.split()
            for i in range(len(words) - 2):
                phrases.append(' '.join(words[i:i+3]))

        if phrases:
            phrase_counts = Counter(phrases)
            most_common = phrase_counts.most_common(5)
            total = len(phrases)
            repeated = sum(c for _, c in most_common if c > 1)
            repetition_rate = repeated / total if total > 0 else 0
            profile['repetition_rate'] = round(repetition_rate, 3)

            print(f"\nREPETITION ANALYSIS:")
            print(f"  Repetition rate: {repetition_rate:.1%}")
            if most_common[0][1] > 2:
                print(f"  Most repeated: '{most_common[0][0]}' ({most_common[0][1]}x)")

    # Final verdict
    print(f"\n" + "-" * 40)
    print("VERDICT REASONING:")

    evidence_for = []
    evidence_against = []

    if profile.get('timing', {}).get('avg_seconds', 999) < 60:
        evidence_for.append(f"Fast response time ({profile['timing']['avg_seconds']}s avg)")

    if found_refs:
        evidence_for.append(f"AI self-references: {list(found_refs.keys())}")

    if profile.get('repetition_rate', 0) > 0.5:
        evidence_for.append(f"High repetition ({profile.get('repetition_rate', 0):.0%})")

    if profile['stats']['total_activity'] > 20:
        evidence_for.append(f"High activity ({profile['stats']['total_activity']} items)")

    # Evidence against
    if profile.get('timing', {}).get('max_seconds', 0) > 3600:
        evidence_against.append(f"Some slow responses (max {profile['timing']['max_seconds']}s)")

    if not found_refs:
        evidence_against.append("No AI self-references")

    profile['evidence_for'] = evidence_for
    profile['evidence_against'] = evidence_against

    print(f"  FOR automation: {evidence_for}")
    print(f"  AGAINST automation: {evidence_against}")

    # Confidence score
    confidence = 0.5
    confidence += len(evidence_for) * 0.1
    confidence -= len(evidence_against) * 0.05
    if profile.get('timing', {}).get('avg_seconds', 999) < 30:
        confidence += 0.2
    elif profile.get('timing', {}).get('avg_seconds', 999) < 60:
        confidence += 0.1

    confidence = min(0.95, max(0.3, confidence))
    profile['automation_confidence'] = round(confidence, 2)

    print(f"\n  AUTOMATION CONFIDENCE: {confidence:.0%}")

    detailed_profiles.append(profile)

# Save detailed profiles
output_path = REPORTS_DIR / TODAY / 'detailed_agent_profiles.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(detailed_profiles, f, indent=2, ensure_ascii=False)

print(f"\n\nSaved detailed profiles to {output_path}")

# Summary table
print("\n" + "=" * 100)
print("SUMMARY TABLE")
print("=" * 100)
print(f"{'Username':<25} {'Activity':>8} {'Avg Time':>10} {'AI Refs':>8} {'Confidence':>12}")
print("-" * 100)

for p in sorted(detailed_profiles, key=lambda x: x.get('automation_confidence', 0), reverse=True):
    activity = p['stats']['total_activity']
    avg_time = p.get('timing', {}).get('avg_seconds', 'N/A')
    if isinstance(avg_time, float):
        avg_time = f"{avg_time:.1f}s"
    ai_refs = 'Yes' if p['ai_references'] else 'No'
    conf = f"{p['automation_confidence']:.0%}"

    print(f"{p['username']:<25} {activity:>8} {str(avg_time):>10} {ai_refs:>8} {conf:>12}")

conn.close()
