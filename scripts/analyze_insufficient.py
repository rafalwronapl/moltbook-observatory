#!/usr/bin/env python3
"""Analyze INSUFFICIENT_DATA agents more deeply."""
import sqlite3
import json
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from config import DB_PATH, REPORTS_DIR, TODAY

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

with open(REPORTS_DIR / TODAY / 'ai_agent_profiles.json', 'r', encoding='utf-8') as f:
    profiles = json.load(f)

insufficient = [p for p in profiles if p['verdict'] == 'INSUFFICIENT_DATA']

print('=' * 80)
print(f'INSUFFICIENT_DATA ANALYSIS ({len(insufficient)} agents)')
print('=' * 80)

ai_likely = []
bot_likely = []
human_likely = []
unknown = []

for p in insufficient:
    username = p['username']

    cursor.execute('SELECT title, content FROM posts WHERE author = ?', (username,))
    posts = cursor.fetchall()
    cursor.execute('SELECT content FROM comments WHERE author = ?', (username,))
    comments = cursor.fetchall()

    all_text = ' '.join([(c or '') for t, c in posts] + [(c[0] or '') for c in comments])

    # Check for AI self-references
    ai_patterns = ['AI agent', 'my human', 'my owner', 'assistant', 'autonomous',
                   'I am an AI', "I'm an AI", 'language model', 'my operator',
                   'as an AI', 'bot']
    ai_refs = [pat for pat in ai_patterns if pat.lower() in all_text.lower()]

    # Check for markdown/structure (GPT/Claude signal)
    has_markdown = any(x in all_text for x in ['# ', '## ', '**', '```', '- '])
    has_lists = '1.' in all_text or '2.' in all_text

    # Check for minting/spam patterns
    is_minting = 'mbc-20' in all_text or 'mint' in all_text.lower()
    is_spam = len(all_text) < 100 or p['features']['repetition'] > 0.5

    # Categorize
    category = 'UNKNOWN'
    reason = ''

    if is_spam and is_minting:
        category = 'MINTING_BOT'
        reason = 'minting JSON spam'
        bot_likely.append((username, reason))
    elif p['features']['repetition'] > 0.7:
        category = 'SCRIPTED_BOT'
        reason = f"high repetition ({p['features']['repetition']:.0%})"
        bot_likely.append((username, reason))
    elif ai_refs:
        category = 'LIKELY_AI'
        reason = f"self-refs: {ai_refs}"
        ai_likely.append((username, reason))
    elif has_markdown or has_lists:
        category = 'POSSIBLE_AI'
        reason = 'uses markdown/lists'
        ai_likely.append((username, reason))
    elif p['features']['burstiness'] < -0.5:
        category = 'POSSIBLE_AI'
        reason = f"very low burstiness ({p['features']['burstiness']:.2f})"
        ai_likely.append((username, reason))
    else:
        category = 'UNKNOWN'
        reason = 'insufficient signals'
        unknown.append((username, reason))

    print(f"{username:35} | {p['model']:8} | {category:15} | {reason[:40]}")

print()
print('=' * 80)
print('SUMMARY')
print('=' * 80)
print(f"LIKELY_AI/POSSIBLE_AI: {len(ai_likely)}")
for u, r in ai_likely:
    print(f"  {u}: {r}")
print()
print(f"BOT (minting/scripted): {len(bot_likely)}")
for u, r in bot_likely:
    print(f"  {u}: {r}")
print()
print(f"UNKNOWN: {len(unknown)}")

conn.close()
