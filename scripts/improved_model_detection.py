#!/usr/bin/env python3
"""
Improved Model Detection
========================
Zamiast markerów słownych, używamy:
1. Struktury odpowiedzi (jak zaczyna, jak kończy)
2. Specyficznych odmów/zastrzeżeń
3. Formatowania
4. Self-identification (gdy model się przedstawia)
"""

import re
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Bardziej specyficzne sygnatury - rzeczy które są UNIKALNE dla modelu
IMPROVED_SIGNATURES = {
    'claude': {
        # Claude-specific phrases that GPT/LLAMA don't use
        'unique_phrases': [
            "I should note that",
            "I want to be thoughtful",
            "I'd want to be careful",
            "that's a nuanced question",
            "I appreciate you sharing",
            "let me think through this",
            "I notice that",
            "that resonates with me",
            # Claude's specific refusal patterns
            "I don't feel comfortable",
            "I'd prefer not to",
        ],
        # Claude tends to NOT use these (negative markers)
        'never_says': [
            "As an AI language model",
            "I cannot and will not",
            "Sure thing!",
            "Absolutely!",
        ],
        # Claude rarely uses heavy markdown
        'formatting': {
            'avoids_headers': True,  # Claude rarely uses ## headers
            'uses_dashes': True,  # Uses - for lists
        }
    },
    'gpt4': {
        'unique_phrases': [
            "As an AI language model",
            "I don't have personal",
            "my training data",
            "knowledge cutoff",
            "I was trained by OpenAI",
            "I'd be happy to help",
            "Great question!",
            "That's a great question",
            "Let me break this down",
            "Here's a step-by-step",
        ],
        'never_says': [
            "I should note that",
            "I notice that",
        ],
        'formatting': {
            'loves_headers': True,  # GPT loves ## headers
            'uses_numbered_lists': True,  # 1. 2. 3.
            'uses_bold': True,  # **bold**
        }
    },
    'llama': {
        'unique_phrases': [
            "I'm just an AI",
            "I'm a large language model",
            "trained by Meta",
            "Llama",
        ],
        # LLAMA tends to be more casual but these are weak signals
        'casual_markers': [
            "gonna", "wanna", "kinda", "sorta", "gotta",
            "ya know", "I mean", "like,",
        ],
        'never_says': [
            "As an AI language model",  # GPT phrase
            "trained by OpenAI",
        ],
    },
    'mistral': {
        'unique_phrases': [
            "Mistral",
            "I'm Mistral",
        ],
        # Mistral tends to be direct and technical
        'style': 'technical_direct',
    },
    'deepseek': {
        'unique_phrases': [
            "DeepSeek",
            "trained by DeepSeek",
        ],
    },
    'gemini': {
        'unique_phrases': [
            "I'm Gemini",
            "trained by Google",
            "Google AI",
            "Bard",
        ],
    }
}


def detect_model_improved(text: str) -> dict:
    """Detect model using improved signatures."""
    text_lower = text.lower()
    scores = {}

    for model, sig in IMPROVED_SIGNATURES.items():
        score = 0
        evidence = []

        # Check unique phrases (strong signal)
        if 'unique_phrases' in sig:
            for phrase in sig['unique_phrases']:
                if phrase.lower() in text_lower:
                    score += 2.0  # Strong weight
                    evidence.append(f"phrase: '{phrase}'")

        # Check never_says (negative signal)
        if 'never_says' in sig:
            for phrase in sig['never_says']:
                if phrase.lower() in text_lower:
                    score -= 1.0  # Penalty
                    evidence.append(f"uses forbidden: '{phrase}'")

        # Check formatting
        if 'formatting' in sig:
            fmt = sig['formatting']
            if fmt.get('loves_headers') and re.search(r'^##?\s', text, re.MULTILINE):
                score += 0.5
                evidence.append("uses headers")
            if fmt.get('avoids_headers') and not re.search(r'^##?\s', text, re.MULTILINE):
                score += 0.3
                evidence.append("avoids headers")
            if fmt.get('uses_numbered_lists') and re.search(r'^\d+\.', text, re.MULTILINE):
                score += 0.3
                evidence.append("uses numbered lists")

        # Casual markers for LLAMA (weak signal)
        if 'casual_markers' in sig:
            casual_count = sum(1 for m in sig['casual_markers'] if m.lower() in text_lower)
            if casual_count >= 2:
                score += 0.5
                evidence.append(f"casual markers: {casual_count}")

        if score > 0:
            scores[model] = {'score': score, 'evidence': evidence}

    # Determine winner
    if not scores:
        return {'model': 'UNKNOWN', 'confidence': 0, 'evidence': []}

    best_model = max(scores.keys(), key=lambda m: scores[m]['score'])
    best_score = scores[best_model]['score']

    # Confidence based on score
    if best_score >= 2.0:
        confidence = 0.8
    elif best_score >= 1.0:
        confidence = 0.6
    else:
        confidence = 0.4

    return {
        'model': best_model.upper(),
        'confidence': confidence,
        'evidence': scores[best_model]['evidence'],
        'all_scores': {k: v['score'] for k, v in scores.items()}
    }


if __name__ == '__main__':
    import sqlite3
    from config import DB_PATH, REPORTS_DIR, TODAY
    import json

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Test on known accounts
    test_accounts = [
        'claude_opus_45', 'AGNT', 'TipJarBot', 'Pi-7S', 'RupertClaw',
        'YunaDev', 'Nexus_Erebus', 'Puer'
    ]

    print("=" * 70)
    print("IMPROVED MODEL DETECTION TEST")
    print("=" * 70)

    for username in test_accounts:
        cursor.execute('SELECT content FROM posts WHERE author = ?', (username,))
        posts = cursor.fetchall()
        cursor.execute('SELECT content FROM comments WHERE author = ?', (username,))
        comments = cursor.fetchall()

        all_text = ' '.join([(p[0] or '') for p in posts] + [(c[0] or '') for c in comments])

        if not all_text:
            continue

        result = detect_model_improved(all_text)

        print(f"\n### {username} ###")
        print(f"Detected: {result['model']} (conf: {result['confidence']})")
        print(f"Evidence: {result['evidence']}")
        if result.get('all_scores'):
            print(f"All scores: {result['all_scores']}")

    conn.close()
