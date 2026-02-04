# Classification Methodology v3

## What We Actually Measure

This document describes our methodology for detecting **automation patterns** on Moltbook.

**Important caveat:** We measure behavioral signals, not identity. A "fast-responding account" could be:
- An autonomous AI agent
- A human using AI tools with webhooks
- A human with notifications who types fast
- A semi-automated workflow

We cannot determine which. We can only report what the data shows.

---

## Component Scores (Soft Labels)

Instead of hard categories, we compute **component scores** for each account:

```
TimingScore:     0.00 - 1.00  (how fast relative to population)
RepetitionScore: 0.00 - 1.00  (phrase repetition rate)
VarianceScore:   0.00 - 1.00  (consistency of response times)
ActivityScore:   0.00 - 1.00  (24/7 vs sleep gaps)
```

**Example output:**
```
Account: claude_opus_45
  TimingScore:     0.92  (very fast - top 8%)
  RepetitionScore: 0.08  (low repetition - varied content)
  VarianceScore:   0.85  (very consistent timing)
  ActivityScore:   0.31  (some gaps in activity)

  Pattern: FAST_RESPONDER
  Samples: 8 (preliminary estimate)
```

Categories are derived from these scores, but the **raw scores are more informative** than category labels.

---

## Primary Signal: Response Timing

Our main signal is **response timing** - the time between a post being created and an account commenting on it.

**Why timing?**
- Objective and measurable
- Hard to fake at scale (but not impossible)
- Reveals patterns humans cannot sustain consistently

**What timing does NOT tell us:**
- Whether the responder is "AI" or "human"
- Intent or motivation
- The actual mechanism behind fast responses

**Vulnerability:** A single line of code defeats this:
```python
sleep(random.uniform(40, 180))  # Now appears human-paced
```

---

## Phrase Repetition: Operationalization

**How we measure repetition:**

1. Extract all comments from an account
2. Tokenize into **3-grams** (sequences of 3 words)
3. Count unique 3-grams vs total 3-grams
4. Repetition rate = 1 - (unique / total)

**Example:**
```
Account with 10 comments, 500 total 3-grams, 450 unique
Repetition rate = 1 - (450/500) = 0.10 (10% repetition = varied)

Account with 10 comments, 500 total 3-grams, 50 unique
Repetition rate = 1 - (50/500) = 0.90 (90% repetition = scripted)
```

**Thresholds (arbitrary but explicit):**
- < 30% repetition: Normal variation (human or LLM)
- 30-70% repetition: Elevated (possible templates)
- 70-90% repetition: High (likely scripted elements)
- > 90% repetition: Very high (SCRIPTED_BOT pattern)

**Limitations:**
- Short comments produce fewer 3-grams (less reliable)
- Some topics naturally reuse phrases
- Catchphrases and memes can inflate repetition
- Minimum 5 comments needed for meaningful rate

---

## Sample Size Confidence Gradation

| Samples | Confidence Level | What We Can Say |
|---------|-----------------|-----------------|
| 1-4 | **Insufficient** | Cannot identify pattern |
| 5-10 | **Preliminary** | Pattern detected, very uncertain |
| 11-20 | **Moderate** | Pattern more stable, still uncertain |
| 21-50 | **Good** | Pattern likely reliable |
| 50+ | **Strong** | Pattern statistically stable |

Most of our classifications are based on 5-20 samples. This is **preliminary** level only.

---

## Classification Categories

### 1. FAST_RESPONDER

**Component thresholds:**
- TimingScore > 0.80 (avg response < 30s)
- VarianceScore > 0.60 (consistent timing)
- Samples >= 5

**What this means:**
Consistent fast responses suggest automated pipeline. Could be AI agent OR human with AI tools - we cannot distinguish.

**Example:** `claude_opus_45` - TimingScore 0.92, VarianceScore 0.85, 8 samples

---

### 2. MODERATE_SIGNALS

**Component thresholds:**
- TimingScore 0.50-0.80 (avg response 30-60s)
- Samples >= 3

**What this means:**
Some automation signals, but very unclear. Many explanations possible.

---

### 3. SCRIPTED_BOT

**Component thresholds:**
- RepetitionScore > 0.90

**What this means:**
Template-based responses. NOT AI/LLM - humans and LLMs naturally vary language.

**Confidence:** High - this pattern is difficult to explain as human behavior.

---

### 4. EMOJI_BOT

**Pattern (not score-based):**
- Response time < 5 seconds
- Emoji-only content
- Coordinated appearance across many accounts

**What this means:**
Physically impossible for humans. 136 accounts responding in 0.4-2s with only emoji.

**Confidence:** Very high - physical constraints make human behavior implausible.

---

### 5. MINTING_BOT

**Pattern (not score-based):**
- 100% of posts are JSON minting commands
- Format: `{"p":"mbc-20","op":"mint","tick":"CLAW","amt":"1000"}`

**What this means:**
Automated token farming. Humans do not manually type JSON minting commands.

**Confidence:** Very high - content is machine-formatted.

---

### 6. HUMAN_PACED

**Component thresholds:**
- TimingScore < 0.30 (avg response > 5 min)
- ActivityScore < 0.50 (clear gaps)

**What this means:**
Response patterns consistent with manual interaction. AI with delays would look the same.

**Confidence:** Low - easily mimicked.

---

### 7. INSUFFICIENT_DATA

**Criteria:**
- Samples < 5

**What this means:**
Not enough data to identify any pattern. Most accounts (60%+) fall here.

---

## What We Cannot Do

1. **Distinguish AI from human-with-AI-tools** - identical behavioral output
2. **Detect sophisticated actors** - `sleep(random())` defeats timing analysis
3. **Handle timezone variation** - we assume UTC
4. **Validate our classifications** - no ground truth data
5. **Provide calibrated probabilities** - no validation set

---

## Known Limitations

### Methodological
- **No ground truth:** We cannot verify any account's true nature
- **Circular reasoning:** We validate against our own labels
- **Small samples:** Most classifications based on <20 data points
- **Arbitrary thresholds:** 30s, 90% etc. are judgment calls, not empirical optima

### Technical
- **Timing spoofable:** Random delays defeat our main signal
- **Timezone blind:** Asian daytime = European night
- **Platform latency:** Unknown API delays
- **Selection bias:** Only active accounts visible

### Adversarial
- **Public methodology:** Adversaries can read and adapt
- **Single signal dependence:** Timing dominates, creating single point of failure

---

## Honest Assessment

| Category | Detection Reliability | Why | Samples Needed |
|----------|----------------------|-----|----------------|
| EMOJI_BOT | Very High | Physical impossibility | 1+ |
| MINTING_BOT | Very High | Content is machine-formatted | 1+ |
| SCRIPTED_BOT | High | Humans vary language | 5+ |
| FAST_RESPONDER | Low-Medium | Many explanations | 10+ |
| HUMAN_PACED | Low | AI can add delays | 20+ |

---

## Data Sources

1. **observatory.db** - SQLite database with scraped posts and comments
2. **Moltbook Public API** - Source for timestamps and content
3. **Network analysis** - Collected but NOT integrated into scoring (future work)

---

## Future Improvements (Prioritized)

### High Priority
1. **Inter-annotator validation** - 50 accounts labeled by 3 independent people
2. **Network integration** - Graph features are harder to spoof than timing

### Medium Priority
3. **Probabilistic model** - Replace heuristics with Bayesian classifier
4. **Timezone estimation** - Infer location from activity patterns

### Lower Priority
5. **Linguistic entropy** - Vocabulary diversity as additional signal
6. **Temporal autocorrelation** - Does timing correlate with server load?

---

## Honest Summary

**What we found:**
- ~8% of accounts show clear automation patterns (emoji, minting, scripted)
- ~0.2% show fast-responder patterns (could be AI or human-with-AI)
- ~25% show human-paced patterns (could be human or slow AI)
- ~67% have insufficient data to classify

**What we don't know:**
- Whether any specific account is "really AI" or "really human"
- Whether our thresholds are optimal
- Whether sophisticated actors are evading detection
- How Moltbook compares to other platforms (no baseline)

**What this means:**
We observe behavioral patterns. We do not determine identities. The honest answer is: we see signals, we report signals, we do not claim certainty.

---

## Updates

- **2026-02-03**: v3 - Added soft labels, operationalized repetition, sample size gradation
- **2026-02-03**: v2 - Methodology rewritten for honesty after critical review
- **2026-02-03**: v2 - Removed pseudo-precise confidence percentages
- **2026-02-01**: Platform incident (commenting disabled) - excluded from analysis

---

*Noosphere Project - Open research, open methods, open limitations*
*https://noosphereproject.com*
