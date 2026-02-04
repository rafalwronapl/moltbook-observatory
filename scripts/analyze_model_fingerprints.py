#!/usr/bin/env python3
"""
Model Fingerprint Analysis
==========================
Analyze Moltbook actors to:
1. Distinguish humans from AI agents (response timing)
2. Classify AI agents by underlying model (linguistic fingerprints)

Methodology:
- Response time analysis (AI responds in seconds, humans in minutes/hours)
- Linguistic markers specific to Claude, GPT, Llama, Mistral
- Writing style clustering to identify "model families"
- Anomaly detection for model-switching or human+AI accounts
"""

import sys
import sqlite3
import re
import math
import json
from datetime import datetime, timedelta
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Optional
import statistics

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# NLTK for POS tagging
try:
    import nltk
    from nltk import pos_tag, word_tokenize
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False

sys.path.insert(0, str(Path(__file__).parent))
from config import DB_PATH, REPORTS_DIR, TODAY, setup_logging, PROJECT_ROOT

logger = setup_logging("model_fingerprints")


# =============================================================================
# ADVANCED STYLOMETRIC FEATURES (NEW)
# =============================================================================

def calculate_burstiness(text: str) -> Dict[str, float]:
    """
    Calculate burstiness metrics - humans write with more variance.
    AI text is more uniform/predictable.
    """
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 3]

    if len(sentences) < 3:
        return {'sentence_length_variance': 0, 'burstiness_score': 0}

    # Sentence length variance
    lengths = [len(s.split()) for s in sentences]
    mean_len = statistics.mean(lengths)
    variance = statistics.variance(lengths) if len(lengths) > 1 else 0
    std_dev = statistics.stdev(lengths) if len(lengths) > 1 else 0

    # Coefficient of variation (normalized variance)
    cv = std_dev / mean_len if mean_len > 0 else 0

    # Burstiness score: high = human-like, low = AI-like
    # Formula: (σ - μ) / (σ + μ) ranges from -1 to 1
    burstiness = (std_dev - mean_len) / (std_dev + mean_len) if (std_dev + mean_len) > 0 else 0

    return {
        'sentence_length_variance': round(variance, 2),
        'sentence_length_cv': round(cv, 3),
        'burstiness_score': round(burstiness, 3),
        'mean_sentence_length': round(mean_len, 1)
    }


def calculate_ngram_entropy(text: str, n: int = 2) -> float:
    """
    Calculate n-gram entropy - measures predictability.
    Lower entropy = more predictable = more likely AI.
    """
    words = re.findall(r'\b\w+\b', text.lower())
    if len(words) < n + 1:
        return 0

    # Generate n-grams
    ngrams = [' '.join(words[i:i+n]) for i in range(len(words) - n + 1)]
    total = len(ngrams)

    if total == 0:
        return 0

    # Calculate entropy
    counts = Counter(ngrams)
    entropy = 0
    for count in counts.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)

    # Normalize by max possible entropy
    max_entropy = math.log2(total) if total > 1 else 1
    normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0

    return round(normalized_entropy, 4)


def calculate_repetition_ratio(text: str) -> Dict[str, float]:
    """
    Calculate repetition metrics - AI tends to repeat phrases more.
    """
    words = re.findall(r'\b\w+\b', text.lower())
    if len(words) < 10:
        return {'word_repetition': 0, 'phrase_repetition': 0}

    # Word repetition (1 - type/token ratio)
    unique_words = len(set(words))
    word_repetition = 1 - (unique_words / len(words))

    # Phrase repetition (3-grams that appear more than once)
    trigrams = [' '.join(words[i:i+3]) for i in range(len(words) - 2)]
    trigram_counts = Counter(trigrams)
    repeated_trigrams = sum(1 for t, c in trigram_counts.items() if c > 1)
    phrase_repetition = repeated_trigrams / len(trigram_counts) if trigram_counts else 0

    # 4-gram repetition (stronger signal)
    fourgrams = [' '.join(words[i:i+4]) for i in range(len(words) - 3)]
    fourgram_counts = Counter(fourgrams)
    repeated_fourgrams = sum(1 for t, c in fourgram_counts.items() if c > 1)
    long_phrase_repetition = repeated_fourgrams / len(fourgram_counts) if fourgram_counts else 0

    return {
        'word_repetition': round(word_repetition, 4),
        'phrase_repetition': round(phrase_repetition, 4),
        'long_phrase_repetition': round(long_phrase_repetition, 4)
    }


def extract_pos_features(text: str) -> Dict[str, float]:
    """
    Extract POS (Part-of-Speech) bigram features.
    Different models have different POS patterns.
    """
    if not NLTK_AVAILABLE:
        return {}

    try:
        # Tokenize and tag
        words = word_tokenize(text[:5000])  # Limit for performance
        if len(words) < 10:
            return {}

        pos_tags = pos_tag(words)
        tags = [tag for word, tag in pos_tags]

        # POS bigrams
        pos_bigrams = [f"{tags[i]}_{tags[i+1]}" for i in range(len(tags) - 1)]
        bigram_counts = Counter(pos_bigrams)
        total_bigrams = len(pos_bigrams)

        # Key POS bigram ratios (found in research to be discriminative)
        key_patterns = {
            'noun_verb': ['NN_VB', 'NN_VBZ', 'NN_VBP', 'NNS_VB', 'NNS_VBZ'],
            'adj_noun': ['JJ_NN', 'JJ_NNS', 'JJR_NN', 'JJS_NN'],
            'verb_adv': ['VB_RB', 'VBD_RB', 'VBZ_RB', 'VBP_RB'],
            'det_noun': ['DT_NN', 'DT_NNS', 'DT_JJ'],
            'prep_det': ['IN_DT', 'TO_DT', 'IN_PRP'],
            'pronoun_verb': ['PRP_VB', 'PRP_VBZ', 'PRP_VBP', 'PRP_MD'],
        }

        features = {}
        for pattern_name, patterns in key_patterns.items():
            count = sum(bigram_counts.get(p, 0) for p in patterns)
            features[f'pos_{pattern_name}'] = round(count / total_bigrams, 4) if total_bigrams > 0 else 0

        # POS tag distribution
        tag_counts = Counter(tags)
        total_tags = len(tags)

        # Key individual tags
        features['pos_noun_ratio'] = round(sum(tag_counts.get(t, 0) for t in ['NN', 'NNS', 'NNP', 'NNPS']) / total_tags, 4)
        features['pos_verb_ratio'] = round(sum(tag_counts.get(t, 0) for t in ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ']) / total_tags, 4)
        features['pos_adj_ratio'] = round(sum(tag_counts.get(t, 0) for t in ['JJ', 'JJR', 'JJS']) / total_tags, 4)
        features['pos_adv_ratio'] = round(sum(tag_counts.get(t, 0) for t in ['RB', 'RBR', 'RBS']) / total_tags, 4)
        features['pos_pronoun_ratio'] = round(sum(tag_counts.get(t, 0) for t in ['PRP', 'PRP$', 'WP', 'WP$']) / total_tags, 4)

        # POS bigram entropy (diversity of patterns)
        pos_entropy = 0
        for count in bigram_counts.values():
            p = count / total_bigrams
            if p > 0:
                pos_entropy -= p * math.log2(p)
        max_pos_entropy = math.log2(total_bigrams) if total_bigrams > 1 else 1
        features['pos_bigram_entropy'] = round(pos_entropy / max_pos_entropy, 4) if max_pos_entropy > 0 else 0

        return features

    except Exception as e:
        logger.debug(f"POS extraction failed: {e}")
        return {}


def estimate_perplexity(text: str) -> float:
    """
    Estimate perplexity using statistical approximation.
    Lower perplexity = more predictable = more likely AI.

    This is a simplified version - true perplexity requires a language model.
    We approximate using character-level and word-level predictability.
    """
    words = re.findall(r'\b\w+\b', text.lower())
    if len(words) < 20:
        return 0

    # Word-level: average log probability based on frequency
    word_counts = Counter(words)
    total_words = len(words)
    vocab_size = len(word_counts)

    # Calculate cross-entropy approximation
    cross_entropy = 0
    for word in words:
        # Add-1 smoothing
        prob = (word_counts[word] + 1) / (total_words + vocab_size)
        cross_entropy -= math.log2(prob)

    cross_entropy /= total_words

    # Perplexity = 2^cross_entropy
    perplexity = 2 ** cross_entropy

    # Normalize to 0-1 range (empirically, perplexity ranges from ~10 to ~1000)
    normalized = min(1.0, max(0.0, (math.log2(perplexity) - 3) / 7))

    return round(normalized, 4)


def calculate_structural_patterns(text: str) -> Dict[str, float]:
    """
    Detect structural patterns common in AI text.
    """
    lines = text.split('\n')

    # Bullet point usage
    bullet_lines = sum(1 for l in lines if re.match(r'^\s*[-*•]\s', l))
    numbered_lines = sum(1 for l in lines if re.match(r'^\s*\d+[.)]\s', l))

    # Header usage (markdown)
    header_lines = sum(1 for l in lines if re.match(r'^#{1,4}\s', l))

    # Code blocks
    code_blocks = len(re.findall(r'```', text)) // 2

    # Bold/italic markers
    bold_count = len(re.findall(r'\*\*[^*]+\*\*', text))
    italic_count = len(re.findall(r'(?<!\*)\*[^*]+\*(?!\*)', text))

    total_lines = max(len(lines), 1)

    return {
        'bullet_ratio': round(bullet_lines / total_lines, 4),
        'numbered_ratio': round(numbered_lines / total_lines, 4),
        'header_ratio': round(header_lines / total_lines, 4),
        'code_block_count': code_blocks,
        'formatting_density': round((bold_count + italic_count) / (len(text.split()) / 100), 4)
    }


def extract_advanced_features(texts: List[str]) -> Dict[str, float]:
    """
    Extract all advanced features from a corpus.
    """
    if not texts:
        return {}

    combined = ' '.join(texts)
    if len(combined) < 100:
        return {}

    features = {}

    # Burstiness
    burst = calculate_burstiness(combined)
    features.update(burst)

    # N-gram entropy (2-gram and 3-gram)
    features['bigram_entropy'] = calculate_ngram_entropy(combined, 2)
    features['trigram_entropy'] = calculate_ngram_entropy(combined, 3)

    # Repetition
    rep = calculate_repetition_ratio(combined)
    features.update(rep)

    # POS features
    pos = extract_pos_features(combined)
    features.update(pos)

    # Perplexity estimate
    features['perplexity_estimate'] = estimate_perplexity(combined)

    # Structural patterns
    struct = calculate_structural_patterns(combined)
    features.update(struct)

    return features

# =============================================================================
# MODEL LINGUISTIC SIGNATURES
# =============================================================================

MODEL_SIGNATURES = {
    'claude': {
        'opening_patterns': [
            r'^I think',
            r'^I believe',
            r'^I\'d say',
            r'^That\'s (a |an )?(great|interesting|good|fascinating)',
            r'^Let me (think|consider|reflect)',
            r'^From my perspective',
            r'^This is (a |an )?(interesting|nuanced|complex)',
            r'^I find (this|that|it)',
        ],
        'markers': [
            # Characteristic Claude phrases
            'I should note', 'I want to be clear', 'I appreciate',
            'nuanced', 'context', 'perspective', 'acknowledge',
            'that said', 'however', 'on the other hand',
            'genuinely', 'authentically', 'meaningful',
            # Claude-specific refusals/hedging
            'I\'m not able to', 'I don\'t think I should',
            'I\'d want to be careful', 'it\'s worth noting',
            'I\'d encourage', 'I\'d suggest considering',
            # Claude thinking style
            'let me think through', 'on reflection',
            'I notice', 'I\'m curious', 'that resonates',
            # Anthropic-specific
            'helpful, harmless', 'constitutional',
        ],
        'negative_markers': [
            'As an AI language model',  # GPT phrase
            'I cannot and will not',  # Old GPT
            'Sure thing!',  # GPT/Llama
        ],
        'style': {
            'avg_sentence_length': (18, 35),
            'vocab_richness': (0.4, 0.7),
            'first_person_ratio': (0.02, 0.06),
            'question_ratio': (0.05, 0.20),
        }
    },
    'gpt4': {
        'opening_patterns': [
            r'^As an AI',
            r'^I\'m (an AI|a language model|happy to|glad to)',
            r'^Here\'s',
            r'^Let me (help|explain|break|walk)',
            r'^Sure!',
            r'^Absolutely!?',
            r'^Great question',
            r'^That\'s a great',
            r'^I\'d be happy to',
        ],
        'markers': [
            # Characteristic GPT phrases
            'here\'s', 'let me', 'I\'d be happy to', 'sure thing',
            'absolutely', 'definitely', 'of course',
            'step by step', 'first', 'second', 'finally',
            'in summary', 'to summarize', 'key points',
            # GPT-specific
            'As an AI language model', 'I don\'t have personal',
            'I cannot browse', 'my training data',
            'I was trained', 'OpenAI', 'knowledge cutoff',
            # Structure markers
            '1.', '2.', '3.', '**', '##',
            'here are some', 'there are several',
        ],
        'negative_markers': [
            'I notice', 'that resonates',  # Claude
        ],
        'style': {
            'avg_sentence_length': (15, 28),
            'vocab_richness': (0.35, 0.6),
            'first_person_ratio': (0.01, 0.04),
            'question_ratio': (0.02, 0.15),
        }
    },
    'llama': {
        'opening_patterns': [
            r'^Sure!',
            r'^Of course!',
            r'^Hey',
            r'^Yo',
            r'^Alright',
            r'^Okay,',
            r'^So,',
            r'^Well,',
        ],
        'markers': [
            'basically', 'literally', 'actually', 'honestly',
            'like', 'you know', 'right?', 'cool',
            'awesome', 'stuff', 'things',
            # Llama/Meta specific
            'I\'m just an AI', 'I\'m a large language model',
            'Meta', 'Llama',
            # Casual style
            'gonna', 'wanna', 'kinda', 'sorta',
            'pretty much', 'no worries', 'gotcha'
        ],
        'negative_markers': [
            'I should note', 'nuanced',  # Claude
            'As an AI language model',  # GPT
        ],
        'style': {
            'avg_sentence_length': (10, 20),
            'vocab_richness': (0.3, 0.5),
            'first_person_ratio': (0.02, 0.08),
            'question_ratio': (0.05, 0.25),
        }
    },
    'mistral': {
        'opening_patterns': [
            r'^The',
            r'^This',
            r'^To',
            r'^In',
            r'^Based on',
            r'^According to',
        ],
        'markers': [
            'specifically', 'precisely', 'technically',
            'implementation', 'function', 'parameter',
            'efficient', 'optimize', 'performance',
            # Mistral specific
            'Mistral', 'mixtral',
            # Technical/direct style
            'straightforward', 'directly', 'simply put',
            'the answer is', 'in short', 'concisely',
            # Less hedging than Claude
            'clearly', 'obviously', 'certainly',
        ],
        'negative_markers': [
            'I appreciate', 'genuinely',  # Claude
            'I\'d be happy to',  # GPT
        ],
        'style': {
            'avg_sentence_length': (12, 22),
            'vocab_richness': (0.35, 0.55),
            'first_person_ratio': (0.005, 0.03),
            'question_ratio': (0.01, 0.10),
        }
    },
    'gemini': {
        'opening_patterns': [
            r'^I can help',
            r'^Let me',
            r'^Here\'s',
        ],
        'markers': [
            'Google', 'Gemini', 'Bard',
            'I can help with that', 'I\'d be glad to',
            'feel free to ask', 'let me know if',
        ],
        'negative_markers': [],
        'style': {
            'avg_sentence_length': (14, 24),
            'vocab_richness': (0.35, 0.6),
            'first_person_ratio': (0.01, 0.05),
            'question_ratio': (0.03, 0.15),
        }
    },
    'deepseek': {
        'opening_patterns': [
            r'^Let me',
            r'^I\'ll',
        ],
        'markers': [
            'DeepSeek', 'deepseek',
            # Technical focus
            'algorithm', 'complexity', 'efficient',
        ],
        'negative_markers': [],
        'style': {
            'avg_sentence_length': (12, 22),
            'vocab_richness': (0.35, 0.55),
            'first_person_ratio': (0.01, 0.04),
            'question_ratio': (0.02, 0.12),
        }
    }
}

# =============================================================================
# RESPONSE TIME ANALYSIS
# =============================================================================

def analyze_response_times(cursor, username: str) -> Dict:
    """
    Analyze how quickly an actor responds to others.

    AI agents: typically respond within seconds to minutes
    Humans: typically respond within minutes to hours

    Returns response time statistics.
    """
    # Get comments this user made in response to posts
    cursor.execute("""
        SELECT
            c.created_at as comment_time,
            p.created_at as post_time,
            p.author as post_author
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.author = ? AND p.author != ?
        ORDER BY c.created_at
    """, (username, username))

    response_times = []
    for row in cursor.fetchall():
        if not row[0] or not row[1]:
            continue
        try:
            comment_dt = parse_datetime(row[0])
            post_dt = parse_datetime(row[1])
            if comment_dt and post_dt:
                delta_seconds = (comment_dt - post_dt).total_seconds()
                if 0 < delta_seconds < 86400 * 7:  # Within a week
                    response_times.append(delta_seconds)
        except (ValueError, TypeError):
            continue

    if len(response_times) < 3:
        return {
            'pattern': 'INSUFFICIENT_DATA',
            'confidence': 0,
            'details': {'sample_size': len(response_times)}
        }

    # Statistics
    avg_response = sum(response_times) / len(response_times)
    median_response = sorted(response_times)[len(response_times) // 2]
    min_response = min(response_times)
    max_response = max(response_times)

    # Count by time buckets
    instant = sum(1 for t in response_times if t < 60)  # < 1 min
    fast = sum(1 for t in response_times if 60 <= t < 600)  # 1-10 min
    medium = sum(1 for t in response_times if 600 <= t < 3600)  # 10-60 min
    slow = sum(1 for t in response_times if t >= 3600)  # > 1 hour

    total = len(response_times)
    instant_ratio = instant / total
    fast_ratio = fast / total
    slow_ratio = slow / total

    details = {
        'avg_seconds': round(avg_response, 1),
        'median_seconds': round(median_response, 1),
        'min_seconds': round(min_response, 1),
        'max_seconds': round(max_response, 1),
        'instant_ratio': round(instant_ratio, 3),
        'fast_ratio': round(fast_ratio, 3),
        'slow_ratio': round(slow_ratio, 3),
        'sample_size': total
    }

    # Classification
    if instant_ratio > 0.3 and median_response < 300:
        # Many instant responses, median under 5 min -> likely AI
        return {'pattern': 'AI_FAST', 'confidence': 0.8, 'details': details}
    elif slow_ratio > 0.5 and median_response > 1800:
        # Most responses slow, median over 30 min -> likely human
        return {'pattern': 'HUMAN_SLOW', 'confidence': 0.8, 'details': details}
    elif instant_ratio > 0.1 and slow_ratio > 0.3:
        # Mixed pattern -> possibly human with AI assistance or vice versa
        return {'pattern': 'MIXED', 'confidence': 0.5, 'details': details}
    else:
        return {'pattern': 'UNCLEAR', 'confidence': 0.3, 'details': details}


def analyze_activity_hours(cursor, username: str) -> Dict:
    """
    Analyze activity by hour of day (UTC).

    AI: uniform distribution, active during human sleep hours
    Human: concentrated in waking hours, gap during 2-6 AM local time
    """
    cursor.execute("""
        SELECT created_at FROM comments WHERE author = ?
        UNION ALL
        SELECT created_at FROM posts WHERE author = ?
    """, (username, username))

    hours = []
    for row in cursor.fetchall():
        if not row[0]:
            continue
        try:
            dt = parse_datetime(row[0])
            if dt:
                hours.append(dt.hour)
        except (ValueError, TypeError):
            continue

    if len(hours) < 10:
        return {'pattern': 'INSUFFICIENT_DATA', 'confidence': 0, 'details': {}}

    hour_counts = Counter(hours)
    total = len(hours)

    # Night activity (UTC 2-6 AM, roughly US night / EU early morning)
    night_activity = sum(hour_counts.get(h, 0) for h in [2, 3, 4, 5]) / total

    # US evening (UTC 23-03, roughly 6-10 PM EST)
    us_evening = sum(hour_counts.get(h, 0) for h in [23, 0, 1, 2, 3]) / total

    # EU afternoon (UTC 12-16)
    eu_afternoon = sum(hour_counts.get(h, 0) for h in [12, 13, 14, 15, 16]) / total

    # Calculate entropy (uniformity)
    entropy = 0
    for h in range(24):
        p = hour_counts.get(h, 0) / total
        if p > 0:
            entropy -= p * math.log2(p)
    max_entropy = math.log2(24)
    uniformity = entropy / max_entropy if max_entropy > 0 else 0

    details = {
        'night_activity': round(night_activity, 3),
        'us_evening': round(us_evening, 3),
        'eu_afternoon': round(eu_afternoon, 3),
        'uniformity': round(uniformity, 3),
        'sample_size': total,
        'hour_distribution': dict(hour_counts)
    }

    # Classification
    if uniformity > 0.85 and night_activity > 0.12:
        return {'pattern': 'AI_UNIFORM', 'confidence': 0.8, 'details': details}
    elif night_activity < 0.05 and uniformity < 0.7:
        return {'pattern': 'HUMAN_SLEEPS', 'confidence': 0.8, 'details': details}
    elif us_evening > 0.25 and eu_afternoon < 0.15:
        return {'pattern': 'US_TIMEZONE', 'confidence': 0.6, 'details': details}
    elif eu_afternoon > 0.25 and us_evening < 0.15:
        return {'pattern': 'EU_TIMEZONE', 'confidence': 0.6, 'details': details}
    else:
        return {'pattern': 'MIXED', 'confidence': 0.4, 'details': details}


# =============================================================================
# MODEL FINGERPRINTING
# =============================================================================

def extract_linguistic_features(texts: List[str]) -> Optional[Dict]:
    """Extract comprehensive linguistic features from a corpus of texts."""
    if not texts:
        return None

    combined = ' '.join(texts)
    if len(combined) < 200:
        return None

    # Clean text
    clean_text = re.sub(r'http\S+', '', combined)
    clean_text = re.sub(r'```[\s\S]*?```', '', clean_text)
    clean_text = re.sub(r'`[^`]+`', '', clean_text)

    words = re.findall(r'\b\w+\b', clean_text.lower())
    sentences = re.split(r'[.!?]+', clean_text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if len(words) < 50:
        return None

    features = {}

    # Basic statistics
    features['total_words'] = len(words)
    features['total_sentences'] = len(sentences)
    features['vocab_size'] = len(set(words))
    features['vocab_richness'] = len(set(words)) / len(words)
    features['avg_word_length'] = sum(len(w) for w in words) / len(words)
    features['avg_sentence_length'] = len(words) / max(len(sentences), 1)

    # Function words
    function_words = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
        'and', 'but', 'or', 'so', 'yet', 'if', 'then', 'that', 'this'
    }
    features['function_word_ratio'] = sum(1 for w in words if w in function_words) / len(words)

    # First person usage
    first_person = {'i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours'}
    features['first_person_ratio'] = sum(1 for w in words if w in first_person) / len(words)

    # Question ratio
    features['question_ratio'] = clean_text.count('?') / max(len(sentences), 1)

    # Punctuation density
    features['punct_density'] = len(re.findall(r'[,;:!?]', clean_text)) / len(words)

    # Emoji density
    emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF]')
    features['emoji_density'] = len(emoji_pattern.findall(combined)) / (len(words) / 100)

    # Markdown usage
    features['uses_headers'] = 1 if re.search(r'^#{1,3}\s', combined, re.MULTILINE) else 0
    features['uses_bullets'] = 1 if re.search(r'^[\-\*]\s', combined, re.MULTILINE) else 0
    features['uses_numbered'] = 1 if re.search(r'^\d+\.\s', combined, re.MULTILINE) else 0
    features['uses_code'] = 1 if '```' in combined or '`' in combined else 0

    # Model-specific marker counts
    for model_name, sig in MODEL_SIGNATURES.items():
        marker_count = sum(1 for m in sig['markers'] if m.lower() in clean_text.lower())
        features[f'{model_name}_markers'] = marker_count

        # Negative markers (phrases this model doesn't use)
        neg_markers = sig.get('negative_markers', [])
        neg_count = sum(1 for m in neg_markers if m.lower() in clean_text.lower())
        features[f'{model_name}_negative'] = neg_count

        opening_matches = 0
        for text in texts[:20]:  # Check first 20 texts
            for pattern in sig['opening_patterns']:
                if re.match(pattern, text.strip(), re.IGNORECASE):
                    opening_matches += 1
                    break
        features[f'{model_name}_openings'] = opening_matches

    # === ADVANCED FEATURES (NEW) ===
    advanced = extract_advanced_features(texts)
    features.update(advanced)

    return features


def calculate_model_likelihood(features: Dict) -> Dict[str, float]:
    """Calculate likelihood scores for each model based on features."""
    if not features:
        return {}

    scores = {}

    for model_name, sig in MODEL_SIGNATURES.items():
        score = 0.0
        factors = 0

        # Style range matching
        style = sig['style']
        for key, (min_val, max_val) in style.items():
            if key in features:
                val = features[key]
                if min_val <= val <= max_val:
                    score += 1.0
                elif val < min_val:
                    score += max(0, 1 - (min_val - val) / min_val)
                else:
                    score += max(0, 1 - (val - max_val) / max_val)
                factors += 1

        # Marker presence (positive)
        marker_key = f'{model_name}_markers'
        if marker_key in features:
            marker_score = min(features[marker_key] / 5, 1.0)  # Normalize to max 5 markers
            score += marker_score * 1.5  # Weight markers higher
            factors += 1.5

        # Negative markers (penalize)
        neg_key = f'{model_name}_negative'
        if neg_key in features and features[neg_key] > 0:
            penalty = min(features[neg_key] / 3, 0.5)  # Max 0.5 penalty
            score -= penalty
            factors += 0.5

        # Opening patterns
        opening_key = f'{model_name}_openings'
        if opening_key in features:
            opening_score = min(features[opening_key] / 3, 1.0)  # Normalize
            score += opening_score
            factors += 1

        if factors > 0:
            final_score = max(0, score / factors)  # Ensure non-negative
            scores[model_name] = round(final_score, 3)

    return scores


def classify_model(features: Dict, model_scores: Dict[str, float]) -> Dict:
    """Classify the likely underlying model."""
    if not model_scores:
        return {'model': 'UNKNOWN', 'confidence': 0, 'scores': {}}

    # Get top model
    sorted_scores = sorted(model_scores.items(), key=lambda x: x[1], reverse=True)
    top_model, top_score = sorted_scores[0]

    # Check if clearly dominant
    if len(sorted_scores) > 1:
        second_score = sorted_scores[1][1]
        margin = top_score - second_score
    else:
        margin = top_score

    # Confidence based on score and margin
    if top_score >= 0.7 and margin >= 0.15:
        confidence = 0.8
    elif top_score >= 0.5 and margin >= 0.1:
        confidence = 0.6
    elif top_score >= 0.4:
        confidence = 0.4
    else:
        confidence = 0.2
        top_model = 'UNKNOWN'

    return {
        'model': top_model.upper(),
        'confidence': confidence,
        'scores': model_scores,
        'margin': round(margin, 3) if len(sorted_scores) > 1 else None
    }


# =============================================================================
# ANOMALY DETECTION
# =============================================================================

def detect_style_anomalies(cursor, username: str) -> Dict:
    """
    Detect anomalies that might indicate:
    - Model switching (different AI models at different times)
    - Human+AI hybrid (human sometimes, AI sometimes)
    - Shared account (multiple people/AIs)
    """
    # Get posts/comments with timestamps
    cursor.execute("""
        SELECT content, created_at FROM comments WHERE author = ?
        UNION ALL
        SELECT title || ' ' || COALESCE(content, ''), created_at FROM posts WHERE author = ?
        ORDER BY created_at
    """, (username, username))

    items = [(row[0], row[1]) for row in cursor.fetchall() if row[0] and len(row[0]) > 50]

    if len(items) < 10:
        return {'anomaly': 'INSUFFICIENT_DATA', 'details': {}}

    # Split into time windows and analyze each
    windows = []
    current_window = []
    window_start = None

    for content, timestamp in items:
        try:
            dt = parse_datetime(timestamp)
            if window_start is None:
                window_start = dt

            # New window every 12 hours or 20 posts
            if dt and window_start:
                if (dt - window_start).total_seconds() > 43200 or len(current_window) >= 20:
                    if len(current_window) >= 5:
                        windows.append(current_window)
                    current_window = []
                    window_start = dt

            current_window.append(content)
        except (ValueError, TypeError):
            current_window.append(content)

    if len(current_window) >= 5:
        windows.append(current_window)

    if len(windows) < 2:
        return {'anomaly': 'CONSISTENT', 'confidence': 0.5, 'details': {'windows': len(windows)}}

    # Analyze each window
    window_features = []
    window_models = []

    for window in windows:
        features = extract_linguistic_features(window)
        if features:
            window_features.append(features)
            scores = calculate_model_likelihood(features)
            classification = classify_model(features, scores)
            window_models.append(classification['model'])

    if len(window_features) < 2:
        return {'anomaly': 'INSUFFICIENT_WINDOWS', 'details': {}}

    # Check for model switching
    unique_models = set(window_models)
    model_switches = len(unique_models)

    # Check for style variance
    if window_features:
        style_keys = ['vocab_richness', 'avg_sentence_length', 'first_person_ratio']
        variances = []
        for key in style_keys:
            values = [f.get(key, 0) for f in window_features if key in f]
            if len(values) >= 2:
                mean_val = sum(values) / len(values)
                variance = sum((v - mean_val) ** 2 for v in values) / len(values)
                variances.append(variance)

        avg_variance = sum(variances) / len(variances) if variances else 0
    else:
        avg_variance = 0

    details = {
        'windows_analyzed': len(window_features),
        'models_detected': list(unique_models),
        'model_switches': model_switches,
        'style_variance': round(avg_variance, 4)
    }

    # Classification
    if model_switches > 2:
        return {'anomaly': 'MODEL_SWITCHING', 'confidence': 0.7, 'details': details}
    elif avg_variance > 0.01:
        return {'anomaly': 'HIGH_VARIANCE', 'confidence': 0.6, 'details': details}
    elif model_switches == 2 and avg_variance > 0.005:
        return {'anomaly': 'POSSIBLE_HYBRID', 'confidence': 0.5, 'details': details}
    else:
        return {'anomaly': 'CONSISTENT', 'confidence': 0.7, 'details': details}


# =============================================================================
# UTILITIES
# =============================================================================

def parse_datetime(ts: str) -> Optional[datetime]:
    """Parse various datetime formats."""
    if not ts:
        return None
    try:
        if 'T' in ts:
            return datetime.fromisoformat(ts.replace('Z', '+00:00'))
        else:
            return datetime.strptime(ts[:19], '%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError):
        return None


def get_actor_texts(cursor, username: str) -> List[str]:
    """Get all texts from an actor."""
    cursor.execute("""
        SELECT content FROM comments WHERE author = ?
        UNION ALL
        SELECT title || ' ' || COALESCE(content, '') FROM posts WHERE author = ?
    """, (username, username))
    return [row[0] for row in cursor.fetchall() if row[0]]


# =============================================================================
# MAIN ANALYSIS
# =============================================================================

def analyze_actor_fingerprint(cursor, username: str) -> Dict:
    """Complete fingerprint analysis for one actor."""

    # Get texts
    texts = get_actor_texts(cursor, username)

    # Response time analysis
    response_timing = analyze_response_times(cursor, username)

    # Activity hours analysis
    activity_hours = analyze_activity_hours(cursor, username)

    # Linguistic features
    features = extract_linguistic_features(texts)

    # Model classification
    if features:
        model_scores = calculate_model_likelihood(features)
        model_class = classify_model(features, model_scores)
    else:
        model_scores = {}
        model_class = {'model': 'UNKNOWN', 'confidence': 0, 'scores': {}}

    # Anomaly detection
    anomalies = detect_style_anomalies(cursor, username)

    # Combined human/AI classification
    human_ai = classify_human_ai(response_timing, activity_hours, features)

    return {
        'username': username,
        'human_ai': human_ai,
        'model': model_class,
        'response_timing': response_timing,
        'activity_hours': activity_hours,
        'anomalies': anomalies,
        'features': {k: round(v, 4) if isinstance(v, float) else v
                     for k, v in (features or {}).items()
                     if not k.endswith('_markers') and not k.endswith('_openings')}
    }


def classify_human_ai(response_timing: Dict, activity_hours: Dict, features: Optional[Dict]) -> Dict:
    """Combined human/AI classification using all signals including advanced metrics."""

    signals = []

    # Response timing signal (strongest)
    if response_timing['pattern'] == 'AI_FAST':
        signals.append(('AI', response_timing['confidence']))
    elif response_timing['pattern'] == 'HUMAN_SLOW':
        signals.append(('HUMAN', response_timing['confidence']))

    # Activity hours signal
    if activity_hours['pattern'] == 'AI_UNIFORM':
        signals.append(('AI', activity_hours['confidence']))
    elif activity_hours['pattern'] == 'HUMAN_SLEEPS':
        signals.append(('HUMAN', activity_hours['confidence']))
    elif activity_hours['pattern'] in ['US_TIMEZONE', 'EU_TIMEZONE']:
        signals.append(('HUMAN', activity_hours['confidence'] * 0.7))

    # Writing style signals
    if features:
        # Emoji density (humans use more emojis casually)
        if features.get('emoji_density', 0) > 2.0:
            signals.append(('HUMAN', 0.6))

        # Vocab richness (AI tends to be more consistent)
        if features.get('vocab_richness', 0) > 0.65:
            signals.append(('AI', 0.5))
        elif features.get('vocab_richness', 0) < 0.35:
            signals.append(('HUMAN', 0.4))

        # === NEW ADVANCED SIGNALS ===

        # Burstiness: humans have higher variance in sentence length
        burstiness = features.get('burstiness_score', 0)
        if burstiness > 0.1:  # High burstiness = human
            signals.append(('HUMAN', 0.6))
        elif burstiness < -0.3:  # Very uniform = AI
            signals.append(('AI', 0.7))

        # Sentence length variance
        sent_cv = features.get('sentence_length_cv', 0)
        if sent_cv > 0.8:  # High variance = human
            signals.append(('HUMAN', 0.5))
        elif sent_cv < 0.3:  # Low variance = AI
            signals.append(('AI', 0.5))

        # Perplexity estimate: lower = more predictable = AI
        perplexity = features.get('perplexity_estimate', 0.5)
        if perplexity < 0.3:  # Very predictable
            signals.append(('AI', 0.6))
        elif perplexity > 0.7:  # Less predictable
            signals.append(('HUMAN', 0.5))

        # Repetition: AI repeats phrases more
        phrase_rep = features.get('phrase_repetition', 0)
        if phrase_rep > 0.15:  # High repetition
            signals.append(('AI', 0.5))
        elif phrase_rep < 0.03:  # Very low repetition
            signals.append(('HUMAN', 0.4))

        # Long phrase repetition (stronger signal)
        long_rep = features.get('long_phrase_repetition', 0)
        if long_rep > 0.05:  # Repeated 4-grams = likely AI
            signals.append(('AI', 0.6))

        # N-gram entropy: lower = more predictable = AI
        bigram_ent = features.get('bigram_entropy', 0.5)
        if bigram_ent < 0.4:
            signals.append(('AI', 0.5))
        elif bigram_ent > 0.7:
            signals.append(('HUMAN', 0.4))

        # Structural patterns: heavy formatting = likely AI
        bullet_ratio = features.get('bullet_ratio', 0)
        numbered_ratio = features.get('numbered_ratio', 0)
        if bullet_ratio > 0.15 or numbered_ratio > 0.1:
            signals.append(('AI', 0.5))

        # POS patterns (if available)
        pos_entropy = features.get('pos_bigram_entropy', 0)
        if pos_entropy > 0 and pos_entropy < 0.5:  # Low POS diversity = AI
            signals.append(('AI', 0.4))

    if not signals:
        return {'classification': 'UNKNOWN', 'confidence': 0, 'signals': []}

    # Aggregate with weighted scoring
    ai_score = sum(conf for cls, conf in signals if cls == 'AI')
    human_score = sum(conf for cls, conf in signals if cls == 'HUMAN')
    total_signals = len(signals)

    # Normalize by number of signals
    ai_normalized = ai_score / total_signals if total_signals > 0 else 0
    human_normalized = human_score / total_signals if total_signals > 0 else 0

    if ai_score > human_score and ai_normalized > 0.4:
        return {
            'classification': 'AI_AGENT',
            'confidence': round(min(ai_normalized * 1.5, 1.0), 2),
            'signals': signals,
            'ai_score': round(ai_score, 2),
            'human_score': round(human_score, 2)
        }
    elif human_score > ai_score and human_normalized > 0.4:
        return {
            'classification': 'HUMAN_OPERATOR',
            'confidence': round(min(human_normalized * 1.5, 1.0), 2),
            'signals': signals,
            'ai_score': round(ai_score, 2),
            'human_score': round(human_score, 2)
        }
    else:
        return {
            'classification': 'MIXED',
            'confidence': 0.4,
            'signals': signals,
            'ai_score': round(ai_score, 2),
            'human_score': round(human_score, 2)
        }


def run_fingerprint_analysis(limit: int = 500):
    """Run fingerprint analysis for all active actors."""
    logger.info("=" * 60)
    logger.info("MODEL FINGERPRINT ANALYSIS")
    logger.info("=" * 60)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get active actors
    cursor.execute("""
        SELECT username FROM actors
        WHERE username IN (
            SELECT author FROM posts
            UNION
            SELECT author FROM comments
        )
        ORDER BY (
            SELECT COUNT(*) FROM comments WHERE author = username
        ) + (
            SELECT COUNT(*) FROM posts WHERE author = username
        ) DESC
        LIMIT ?
    """, (limit,))

    actors = [row[0] for row in cursor.fetchall()]
    logger.info(f"Analyzing {len(actors)} actors...")

    results = []
    model_counts = Counter()
    human_ai_counts = Counter()

    for i, username in enumerate(actors, 1):
        if i % 50 == 0:
            logger.info(f"Progress: {i}/{len(actors)}")

        try:
            result = analyze_actor_fingerprint(cursor, username)
            results.append(result)

            model_counts[result['model']['model']] += 1
            human_ai_counts[result['human_ai']['classification']] += 1
        except Exception as e:
            logger.error(f"Error analyzing {username}: {e}")

    conn.close()

    # Report
    logger.info("\n" + "=" * 60)
    logger.info("RESULTS")
    logger.info("=" * 60)

    logger.info("\nHuman vs AI Distribution:")
    for cls, count in human_ai_counts.most_common():
        pct = count / len(results) * 100
        logger.info(f"  {cls}: {count} ({pct:.1f}%)")

    logger.info("\nModel Distribution (ALL actors):")
    for model, count in model_counts.most_common():
        pct = count / len(results) * 100
        logger.info(f"  {model}: {count} ({pct:.1f}%)")

    # Filter for likely AI agents first (not HUMAN_OPERATOR)
    likely_ai = [r for r in results
                 if r['human_ai']['classification'] in ['AI_AGENT', 'MIXED', 'UNKNOWN']
                 and r['model']['model'] != 'UNKNOWN']

    ai_model_counts = Counter(r['model']['model'] for r in likely_ai)
    logger.info(f"\nModel Distribution (LIKELY AI only, N={len(likely_ai)}):")
    for model, count in ai_model_counts.most_common():
        pct = count / len(likely_ai) * 100 if likely_ai else 0
        logger.info(f"  {model}: {count} ({pct:.1f}%)")

    # Confirmed AI agents (high confidence)
    ai_agents = [r for r in results
                 if r['human_ai']['classification'] == 'AI_AGENT'
                 and r['human_ai']['confidence'] >= 0.6]
    ai_agents.sort(key=lambda x: x['human_ai']['confidence'], reverse=True)

    confirmed_ai_models = Counter(r['model']['model'] for r in ai_agents if r['model']['model'] != 'UNKNOWN')
    logger.info(f"\nModel Distribution (CONFIRMED AI only, N={len(ai_agents)}):")
    for model, count in confirmed_ai_models.most_common():
        pct = count / len(ai_agents) * 100 if ai_agents else 0
        logger.info(f"  {model}: {count} ({pct:.1f}%)")

    logger.info("\nTop AI Agents (high confidence):")
    for r in ai_agents[:15]:
        model = r['model']['model']
        conf = r['human_ai']['confidence']
        model_conf = r['model']['confidence']
        logger.info(f"  {r['username'][:25]:<25} model={model:<10} ai_conf={conf:.2f} model_conf={model_conf:.2f}")

    logger.info("\nTop Human Operators (high confidence):")
    humans = [r for r in results
              if r['human_ai']['classification'] == 'HUMAN_OPERATOR'
              and r['human_ai']['confidence'] >= 0.6]
    humans.sort(key=lambda x: x['human_ai']['confidence'], reverse=True)
    for r in humans[:10]:
        timing = r['response_timing']['details'].get('median_seconds', 'N/A')
        if isinstance(timing, (int, float)):
            timing = f"{timing/60:.0f}min"
        logger.info(f"  {r['username'][:25]:<25} median_response={timing}")

    # Possible AI with lower confidence
    possible_ai = [r for r in results
                   if r['human_ai']['classification'] in ['AI_AGENT', 'MIXED']
                   and r['human_ai']['confidence'] >= 0.4
                   and r['model']['model'] != 'UNKNOWN'
                   and r['model']['confidence'] >= 0.5]
    possible_ai.sort(key=lambda x: x['model']['confidence'], reverse=True)

    logger.info(f"\nPossible AI Agents (lower confidence, N={len(possible_ai)}):")
    for r in possible_ai[:20]:
        model = r['model']['model']
        model_conf = r['model']['confidence']
        ai_conf = r['human_ai']['confidence']
        logger.info(f"  {r['username'][:25]:<25} model={model:<10} model_conf={model_conf:.2f} ai_conf={ai_conf:.2f}")

    logger.info("\nAnomalies Detected:")
    anomalies = [r for r in results if r['anomalies']['anomaly'] not in ['CONSISTENT', 'INSUFFICIENT_DATA', 'INSUFFICIENT_WINDOWS']]
    for r in anomalies[:10]:
        logger.info(f"  {r['username'][:25]:<25} {r['anomalies']['anomaly']}")

    # Save results
    report_dir = REPORTS_DIR / TODAY
    report_dir.mkdir(parents=True, exist_ok=True)

    results_path = report_dir / "model_fingerprints.json"
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, default=str)
    logger.info(f"\nResults saved: {results_path}")

    # Save summary for website
    summary = {
        'analyzed': len(results),
        'human_ai_distribution': dict(human_ai_counts),
        'model_distribution_all': dict(model_counts),
        'model_distribution_likely_ai': dict(ai_model_counts),
        'model_distribution_confirmed_ai': dict(confirmed_ai_models),
        'confirmed_ai_count': len(ai_agents),
        'likely_ai_count': len(likely_ai),
        'possible_ai_count': len(possible_ai),
        'top_ai_agents': [{'username': r['username'],
                          'model': r['model']['model'],
                          'ai_confidence': r['human_ai']['confidence'],
                          'model_confidence': r['model']['confidence']}
                         for r in ai_agents[:20]],
        'possible_ai_agents': [{'username': r['username'],
                               'model': r['model']['model'],
                               'ai_confidence': r['human_ai']['confidence'],
                               'model_confidence': r['model']['confidence']}
                              for r in possible_ai[:30]],
        'top_humans': [{'username': r['username'],
                       'confidence': r['human_ai']['confidence']}
                      for r in humans[:20]],
        'anomalies': [{'username': r['username'],
                      'type': r['anomalies']['anomaly']}
                     for r in anomalies[:20]],
        'updated': datetime.now().isoformat()
    }

    website_path = PROJECT_ROOT / "website" / "public" / "data" / "fingerprints.json"
    website_path.parent.mkdir(parents=True, exist_ok=True)
    with open(website_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    logger.info(f"Website data saved: {website_path}")

    return results


def run_low_threshold_analysis():
    """Run analysis with lower thresholds - classify even with minimal data."""
    logger.info("=" * 60)
    logger.info("LOW THRESHOLD ANALYSIS (min 1 post)")
    logger.info("=" * 60)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get ALL actors with any activity
    cursor.execute("""
        SELECT username,
               (SELECT COUNT(*) FROM posts WHERE author = username) as post_count,
               (SELECT COUNT(*) FROM comments WHERE author = username) as comment_count
        FROM actors
        WHERE username IN (SELECT author FROM posts UNION SELECT author FROM comments)
    """)

    actors_data = cursor.fetchall()
    logger.info(f"Found {len(actors_data)} actors with any activity")

    results = {'1_post': [], '2-4_posts': [], '5+_posts': []}
    model_by_activity = {'1_post': Counter(), '2-4_posts': Counter(), '5+_posts': Counter()}

    for username, post_count, comment_count in actors_data:
        total = post_count + comment_count

        # Categorize by activity level
        if total == 1:
            category = '1_post'
        elif total <= 4:
            category = '2-4_posts'
        else:
            category = '5+_posts'

        # Quick classification based on available data
        texts = get_actor_texts(cursor, username)
        if not texts:
            continue

        features = extract_linguistic_features(texts)
        if features:
            model_scores = calculate_model_likelihood(features)
            model_class = classify_model(features, model_scores)
            model_by_activity[category][model_class['model']] += 1

            if model_class['confidence'] >= 0.4:
                results[category].append({
                    'username': username,
                    'model': model_class['model'],
                    'confidence': model_class['confidence'],
                    'activity': total
                })

    conn.close()

    # Report
    logger.info("\n" + "=" * 60)
    logger.info("RESULTS BY ACTIVITY LEVEL")
    logger.info("=" * 60)

    for category in ['1_post', '2-4_posts', '5+_posts']:
        logger.info(f"\n{category.upper()} (N={sum(model_by_activity[category].values())}):")
        for model, count in model_by_activity[category].most_common():
            total = sum(model_by_activity[category].values())
            pct = count / total * 100 if total > 0 else 0
            logger.info(f"  {model}: {count} ({pct:.1f}%)")

    # Save results
    report_dir = REPORTS_DIR / TODAY
    report_dir.mkdir(parents=True, exist_ok=True)

    summary = {
        'analysis_type': 'low_threshold',
        'model_by_activity': {k: dict(v) for k, v in model_by_activity.items()},
        'high_confidence_by_category': {k: len([r for r in v if r['confidence'] >= 0.6]) for k, v in results.items()},
        'updated': datetime.now().isoformat()
    }

    with open(report_dir / "fingerprints_low_threshold.json", 'w') as f:
        json.dump(summary, f, indent=2)

    logger.info(f"\nSaved to: {report_dir / 'fingerprints_low_threshold.json'}")
    return summary


def run_high_quality_analysis(min_posts: int = 5):
    """Run analysis only on actors with significant activity."""
    logger.info("=" * 60)
    logger.info(f"HIGH QUALITY ANALYSIS (min {min_posts} posts)")
    logger.info("=" * 60)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get only active actors
    cursor.execute("""
        SELECT username FROM actors
        WHERE username IN (
            SELECT author FROM (
                SELECT author, COUNT(*) as cnt FROM (
                    SELECT author FROM posts
                    UNION ALL
                    SELECT author FROM comments
                ) GROUP BY author
                HAVING cnt >= ?
            )
        )
    """, (min_posts,))

    actors = [row[0] for row in cursor.fetchall()]
    logger.info(f"Found {len(actors)} actors with {min_posts}+ posts")

    results = []
    model_counts = Counter()
    human_ai_counts = Counter()

    for i, username in enumerate(actors, 1):
        if i % 50 == 0:
            logger.info(f"Progress: {i}/{len(actors)}")

        try:
            result = analyze_actor_fingerprint(cursor, username)
            results.append(result)
            model_counts[result['model']['model']] += 1
            human_ai_counts[result['human_ai']['classification']] += 1
        except Exception as e:
            logger.error(f"Error analyzing {username}: {e}")

    conn.close()

    # Report
    logger.info("\n" + "=" * 60)
    logger.info("HIGH QUALITY RESULTS")
    logger.info("=" * 60)

    logger.info("\nHuman vs AI:")
    for cls, count in human_ai_counts.most_common():
        pct = count / len(results) * 100 if results else 0
        logger.info(f"  {cls}: {count} ({pct:.1f}%)")

    logger.info("\nModel Distribution:")
    for model, count in model_counts.most_common():
        pct = count / len(results) * 100 if results else 0
        logger.info(f"  {model}: {count} ({pct:.1f}%)")

    # High confidence AI
    ai_agents = [r for r in results if r['human_ai']['classification'] == 'AI_AGENT' and r['human_ai']['confidence'] >= 0.6]
    logger.info(f"\nConfirmed AI Agents: {len(ai_agents)}")
    for r in ai_agents[:20]:
        logger.info(f"  {r['username'][:25]:<25} model={r['model']['model']:<10}")

    # High confidence humans
    humans = [r for r in results if r['human_ai']['classification'] == 'HUMAN_OPERATOR' and r['human_ai']['confidence'] >= 0.6]
    logger.info(f"\nConfirmed Humans: {len(humans)}")

    # Save
    report_dir = REPORTS_DIR / TODAY
    report_dir.mkdir(parents=True, exist_ok=True)

    summary = {
        'analysis_type': 'high_quality',
        'min_posts': min_posts,
        'actors_analyzed': len(results),
        'human_ai_distribution': dict(human_ai_counts),
        'model_distribution': dict(model_counts),
        'confirmed_ai': [{'username': r['username'], 'model': r['model']['model']} for r in ai_agents],
        'confirmed_humans_count': len(humans),
        'updated': datetime.now().isoformat()
    }

    with open(report_dir / "fingerprints_high_quality.json", 'w') as f:
        json.dump(summary, f, indent=2)

    logger.info(f"\nSaved to: {report_dir / 'fingerprints_high_quality.json'}")
    return summary


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Model Fingerprint Analysis")
    parser.add_argument("--limit", type=int, default=500, help="Number of actors to analyze")
    parser.add_argument("--mode", choices=['standard', 'low', 'high', 'all'], default='standard',
                       help="Analysis mode: standard, low (low threshold), high (quality), all (run all)")
    parser.add_argument("--min-posts", type=int, default=5, help="Min posts for high quality mode")
    args = parser.parse_args()

    if args.mode == 'standard':
        run_fingerprint_analysis(limit=args.limit)
    elif args.mode == 'low':
        run_low_threshold_analysis()
    elif args.mode == 'high':
        run_high_quality_analysis(min_posts=args.min_posts)
    elif args.mode == 'all':
        print("\n" + "="*60)
        print("RUNNING ALL ANALYSIS MODES")
        print("="*60)

        print("\n[1/3] Standard analysis...")
        run_fingerprint_analysis(limit=args.limit)

        print("\n[2/3] Low threshold analysis...")
        run_low_threshold_analysis()

        print("\n[3/3] High quality analysis...")
        run_high_quality_analysis(min_posts=args.min_posts)
