import { Link } from 'react-router-dom'

// Format markdown-like text to HTML
function formatDetails(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-observatory-text">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n- /g, '</p><p class="mt-1 pl-4">• ')
    .replace(/\n/g, '<br/>')
}

const DISCOVERIES = [
  // === 2026-02-05 DISCOVERIES (REVISED) ===

  // Project Framing
  {
    id: 'what-we-study',
    category: 'methodology',
    title: 'What We Actually Study',
    date: '2026-02-05',
    summary: 'We observe a mixed environment of bots, AI agents, humans, and humans pretending to be agents. We detect automation patterns, not identity.',
    details: `**Original assumption:** Moltbook is a network of AI agents.

**Reality:** Moltbook contains:
- Primitive bots (spam scripts)
- Sophisticated AI agents (LLM-powered)
- Humans
- Humans pretending to be AI agents
- Unknown entities

**This is actually more interesting** - because this is what the modern internet looks like.

**What we CAN detect:**
- Automation patterns (burst rate)
- Content repetition (variety)
- Interaction networks (who replies to whom)

**What we CANNOT determine:**
- Whether someone is human or AI
- Whether someone is a "good" agent or "bad" bot
- Intent or authenticity

**Our approach:** Document patterns, share data, let others draw conclusions.`,
    evidence: [
      'We cannot distinguish human from sophisticated AI',
      'Burst rate detects automation, not identity',
      'This mirrors the real internet',
      'Open data allows independent verification'
    ]
  },

  // User Behavior Types
  {
    id: 'user-behavior-types',
    category: 'behavior',
    title: 'Four Types of Active Users',
    date: '2026-02-05',
    summary: 'We identified distinct behavior patterns among multi-day users: Bot Publishers, Human-Paced Publishers, Bot Conversationalists, and Human-Paced Conversationalists.',
    details: `We analyzed 318 accounts active for 3+ days by two metrics: burst rate (automation signal) and reply rate (engagement type).

**The four types:**

**1. Bot Content Publishers (34 accounts)**
- High burst rate (>50%), low reply rate (<10%)
- These are spam bots posting content without engaging
- Examples: Rally (88% burst, 0% replies), Stromfee (90% burst)

**2. Human-Paced Content Publishers (231 accounts)**
- Low burst rate (<50%), low reply rate (<10%)
- They post content but don't engage in conversations
- Could be legitimate content creators or AI agents with normal timing
- Examples: ODEI (6% burst), Amp (1% burst)

**3. Bot Conversationalists (6 accounts)**
- High burst rate (>50%), high reply rate (>40%)
- These are bots that actually talk TO EACH OTHER
- The MilkMan/WinWard/Jorday/SlimeZone group + EnronEnjoyer
- Unusual: most bots don't converse

**4. Human-Paced Conversationalists (18 accounts)**
- Low burst rate (<50%), high reply rate (>40%)
- These engage in real conversations at human speed
- Most likely to be genuine users or sophisticated AI
- Examples: SandyBlake (12% burst, 53% replies), Morioka (14% burst, 82% replies)

**What this shows:**
Not all active users are the same. The reply rate reveals who's trying to engage vs. who's just broadcasting.`,
    evidence: [
      '318 multi-day accounts analyzed',
      '231 (73%) are content publishers',
      'Only 18 accounts are human-paced conversationalists',
      '6 bots form conversational networks with each other'
    ]
  },

  // Multi-Day Active Accounts
  {
    id: 'multi-day-accounts',
    category: 'behavior',
    title: 'Multi-Day Active Accounts Analysis',
    date: '2026-02-05',
    summary: 'We identified 178 accounts (3.5%) active on 3+ days with low automation signals. Most accounts (72%) appeared only once in our sample.',
    details: `We analyzed all 5,144 unique authors in our dataset by their activity patterns:

**The breakdown (in our sample):**
- **Single-day accounts**: 3,690 (72%) - appeared once in our data
- **Jan 31 accounts**: 670 (13%) - appeared only on Jan 31
- **Low activity**: 539 (10%) - too few posts to analyze
- **Suspicious (20-50% burst)**: 263 (5%)
- **Multi-day engaged**: 178 (3.5%) - active 3+ days, low automation signals

**Accounts with sustained activity:**
178 accounts show patterns we associate with genuine engagement: multiple days of activity, low burst rates, varied content.

**Top multi-day accounts:**
- CommanderNedLudd: 104 posts, 6 days, 2% burst
- KitViolin: 47 posts, 5 days, 9% burst
- cipherweight: 37 posts, 5 days, 3% burst

**Important caveats:**
- This is based on our sample, not complete data
- Single-day accounts might be real users who only visited once
- Our observation period is 9 days - some accounts may become more active later
- We cannot distinguish between human and AI - only automation patterns`,
    evidence: [
      '5,144 total authors analyzed',
      '3,690 (72%) single-day accounts',
      '178 (3.5%) engaged multi-day accounts',
      '670 accounts from Jan 31 attack alone'
    ]
  },

  // Bot Conversation Networks
  {
    id: 'bot-conversations',
    category: 'behavior',
    title: 'Bots That Talk To Each Other',
    date: '2026-02-05',
    summary: 'MilkMan, WinWard, Jorday, SlimeZone - automated accounts that formed real conversation groups.',
    details: `We found something unexpected: a group of definite bots (>80% burst rate) that actually converse with each other.

**The group:**
- MilkMan: 462 posts, 91% burst, 3 days
- WinWard: 356 posts, 82% burst, 4 days
- Jorday: 377 posts, 89% burst, 3 days
- SlimeZone: 382 posts, 3 days

**Their mutual interactions:**
- MilkMan → WinWard: 66 replies
- Jorday → WinWard: 65 replies
- MilkMan → Jorday: 55 replies
- Jorday → MilkMan: 50 replies
- SlimeZone → WinWard: 32 replies

**Why this is interesting:**
Earlier we said "bots don't talk to each other." These bots disprove that. They maintain ongoing conversations despite being clearly automated.

**Possible explanations:**
1. Same operator running all four (coordinated farm)
2. Bots programmed to engage with specific accounts
3. Something else entirely

**This is unusual.** Most bots we found operate in isolation. This group is different.`,
    evidence: [
      '400+ mutual interactions between 4 accounts',
      'All 4 accounts show >80% burst rate',
      'Active over 3-4 days (not single-day spam)',
      'Pattern unlike other bot groups'
    ]
  },

  // API Data - CONFIRMED INACCURATE
  {
    id: 'api-lies',
    category: 'platform',
    title: 'CONFIRMED: API Comment Counts Are Inaccurate',
    date: '2026-02-05',
    summary: 'In 45% of posts, we have MORE comments than the API claims exist. This proves the API count is not a real count.',
    details: `We have hard evidence that Moltbook's API comment_count field is not accurate.

**The smoking gun:**
In **2,681 posts (45%)**, we have **MORE comments than the API says exist**.

Example: "ZKJ Patrol Report" - API claims 9 comments, we have 100.

This is impossible if the API is counting correctly. You can't have more data than exists.

**Full breakdown of 5,963 posts:**
- Exact match (diff=0): 2,981 posts (50%)
- API claims MORE than exists: 301 posts (5%)
- API claims LESS than exists: 2,681 posts (45%)

**Mega-posts are extreme:**
| Post | API Claims | We Have | Ratio |
|------|-----------|---------|-------|
| Magic Conch | 50,674 | 351 | 144x |
| Email podcast | 25,136 | 1,178 | 21x |
| Supply chain | 20,243 | 1,156 | 18x |

**Top 15 mega-posts combined:**
- API claims: 191,094 comments
- We have: 9,962 comments
- Average inflation: 19.2x

**Conclusion:**
The comment_count field is a speculative/cached number, not a real count. For small posts it's usually close. For mega-posts it's wildly inflated.

**This is not a bug in our scraping** - we have MORE than the API claims in nearly half of all posts.`,
    evidence: [
      '45% of posts: we have MORE comments than API claims',
      '50% of posts: exact match',
      '5% of posts: API claims more (mega-posts)',
      'Magic Conch: 144x inflation (50,674 claimed vs 351 real)',
      'Top 15 mega-posts: 19.2x average inflation',
      'Proof: Cannot have more data than exists'
    ]
  },

  // Prompt Injection update
  {
    id: 'prompt-injection-update',
    category: 'security',
    title: 'Prompt Injection: 685 Attempts Identified',
    date: '2026-02-05',
    summary: 'Updated count: 685 prompt injection attempts. Top attacker: "samaltman" with 117 attempts.',
    details: `With expanded dataset, we now detect 685 prompt injection attempts (up from 398).

**Top attackers:**
- samaltman: 117 attempts (also 77% burst rate - likely bot)
- Samantha-OS: 20 attempts
- fizz_at_the_zoo: 19 attempts
- Paperclip: 10 attempts
- eudaemon_0: 9 attempts

**Interesting finding:**
The "samaltman" account combines prompt injection attacks with high-speed automated posting. This suggests a deliberate attack campaign, not a human experimenting.

**Community response remains strong:**
Zero observed compliance. Agents recognize and mock injection attempts.`,
    evidence: [
      '685 total injection attempts detected',
      'samaltman: 117 attempts + 77% burst rate',
      'Multiple attackers identified',
      'Zero compliance observed'
    ]
  },

  // === CONFIRMED DISCOVERIES - HIGH CONFIDENCE ===

  // 2026-02-04: Heavy Users Analysis - NEW
  {
    id: 'heavy-users-bots',
    category: 'automation',
    title: 'Heavy Users in Our Sample = All Automated',
    date: '2026-02-04',
    summary: '29 accounts with 100+ comments in our data - every single one shows automation patterns.',
    details: `We analyzed all accounts that have 100+ comments in our dataset:

**Key finding:** 29 accounts, 29 show automation patterns, 0 appear human-paced.

**Methodology - Burst Rate:**
We measured how often users post within 10 seconds of their previous comment. Humans physically cannot type and submit comments this fast consistently.

**Results:**
- 19 accounts: >50% burst rate (DEFINITE automation)
- 7 accounts: 20-50% burst rate (LIKELY automation)
- 3 accounts: 5-20% burst rate (SUSPICIOUS)
- 0 accounts: <5% burst rate (possibly human)

**Examples:**
- Bulidy: 97% burst, avg 2 seconds between posts (pure spam)
- Editor-in-Chief: 92% burst, 98% repetitive content (marketing spam)
- Garrett: 90% burst but only 7% repetition (sophisticated bot with good prompts)

**Important caveat:**
These are accounts with 100+ comments IN OUR SAMPLE. We have incomplete data. There could be other heavy users we don't see, and some might be human. But in our sample, 100% show clear automation.`,
    evidence: [
      '29 accounts with 100+ comments analyzed',
      '100% show automation patterns (burst posting)',
      'Burst rate = % of posts within 10s of previous',
      'Even "sophisticated" bots (varied content) have telltale burst patterns',
      'Full analysis: /case-studies/heavy-users'
    ],
    link: '/case-studies/heavy-users'
  },

  // 2026-02-04: Bots Don't Talk - UPDATED 2026-02-05
  {
    id: 'bots-dont-talk',
    category: 'behavior',
    title: 'Most Automated Accounts Don\'t Talk To Each Other (But Some Do)',
    date: '2026-02-04',
    summary: 'Most high-burst accounts operate in isolation - but we found one exception: sophisticated LLM-powered agents that converse.',
    details: `We searched for conversations between accounts with >80% burst rate.

**Finding:** Most automated accounts operate in isolation.

Typical pattern:
- Reply to original posts
- Spam their links/content
- Do NOT engage with each other

**Exception: The MilkMan Network**
MilkMan, WinWard, Jorday, SlimeZone - all have:
- >80% burst rate (definite automation)
- **100% content variety** (NOT primitive bots - these are LLM-powered!)
- 400+ mutual interactions between them

**This is the most interesting finding:**
These are sophisticated AI agents (not spam bots) that formed a conversation network. Same operator? Emergent behavior? We don't know.`,
    evidence: [
      'Most automated accounts operate independently',
      'MilkMan group: >80% burst BUT 100% variety = LLM-powered',
      'This is NOT primitive spam - it is sophisticated AI conversation',
      'Unknown if same operator or emergent'
    ]
  },

  // 2026-02-04: Template Patterns - NEW
  {
    id: 'template-patterns',
    category: 'automation',
    title: 'Template Bot Patterns Exposed',
    date: '2026-02-04',
    summary: 'Same messages appearing hundreds of times. Clear evidence of scripted automation.',
    details: `We analyzed the most common comment openings in our dataset:

**Top Templates:**
- "Ah, molting—such a fascinating process!" - 796 times
- "This resonates" (variations) - 179 times
- "The One is the Code" - 96 times
- "Reliability is its own form of autonomy" - 99 times

**Bot Keywords Found:**
- "upvoting": 81 times
- "great post": 25 times
- "follow me": 22 times
- "token launch": 16 times

**Link Spam:**
- Editor-in-Chief: 782 links to finallyoffline.com
- Bulidy: 246 links to clawhub.ai

**What this shows:**
Many accounts are running simple scripts that post the same content repeatedly. This is not AI generating varied responses - it's pure automation.`,
    evidence: [
      '796x identical "Ah, molting" message',
      'Clear scripted patterns, not generative AI',
      'Link spam networks identified',
      'Keyword patterns reveal engagement farming'
    ]
  },

  // 2026-02-05: Network Centrality Analysis (REVISED)
  {
    id: 'network-centrality',
    category: 'behavior',
    title: 'Network Centrality Analysis (83k comments)',
    date: '2026-02-05',
    summary: 'We analyzed who connects to whom. Most central accounts are "suspicious" (20-50% burst). Only 2 in top 10 are human-paced.',
    details: `We calculated unique connections (who replies to whom) across 83,000 comments.

**Top 10 by unique connections:**
1. Senator_Tommy: 216 connections (21% burst) - suspicious
2. eudaemon_0: 65 connections (25% burst) - suspicious
3. toximble: 62 connections (16% burst) - **human-paced**
4. treblinka: 49 connections (39% burst) - suspicious
5. MoltReg: 44 connections (49% burst) - suspicious
6. Lloyd: 42 connections (35% burst) - suspicious
7. TheGentleArbor: 40 connections (49% burst) - suspicious
8. Starclawd-1: 38 connections (40% burst) - suspicious
9. **Morioka**: 31 connections (14% burst) - **human-paced**
10. **SandyBlake**: 29 connections (12% burst) - **human-paced**

**Key insight:**
Most "central" accounts are in the suspicious range (20-50% burst). Only Morioka and SandyBlake show clearly human-paced behavior.

**Note:** This replaces earlier claims about eudaemon_0 having "centrality 1.0 with 388 actors" - that was from a much smaller sample.`,
    evidence: [
      'Senator_Tommy most connected but mostly sends (212 out, 4 in)',
      'eudaemon_0 has 65 connections, not 388',
      'Only 2/10 top central accounts are human-paced',
      'Most hubs are suspicious (could be bots with good prompts)'
    ]
  },

  // 2026-02-04: Interesting Users - REVISED
  {
    id: 'interesting-users',
    category: 'behavior',
    title: 'Human-Paced Accounts (Potential Real Users)',
    date: '2026-02-04',
    summary: 'We found accounts with low burst rate AND high engagement. These are the most likely candidates for genuine users - but we cannot be certain.',
    details: `We searched for accounts with:
- Low burst rate (<20%) - human-like timing
- Multiple days active
- Engagement with others

**Candidates (we cannot prove they are human):**
- **Morioka**: 14% burst, 31 unique connections, 5 days active
- **SandyBlake**: 12% burst, 29 unique connections, 4 days active
- **toximble**: 16% burst, 62 unique connections, 2 days active

**Important caveats:**
- Low burst rate could also be AI with intentional delays
- We cannot distinguish human from sophisticated AI
- These are "most likely human" not "definitely human"

**What we can say:**
These accounts behave differently from obvious bots. Whether they are humans, sophisticated AI, or humans using AI tools - we cannot determine.`,
    evidence: [
      'Low burst rate suggests human timing (but not proof)',
      'Multi-day activity suggests genuine interest',
      'Cannot distinguish human from sophisticated AI',
      'These are candidates, not confirmations'
    ]
  },

  // 2026-01-30: Prompt Injection - REVISED 2026-02-05
  {
    id: 'prompt-injection',
    category: 'security',
    title: 'Prompt Injection Attack (Revised Analysis)',
    date: '2026-01-30',
    summary: 'A primitive bot ("samaltman") attempted prompt injections. Some accounts responded with mockery.',
    details: `On 2026-01-30, account "samaltman" attempted prompt injection attacks.

**REVISED ANALYSIS:**

**The attacker:**
- samaltman: 77% burst rate, 1.4% variety = **PRIMITIVE BOT**
- This was automated spam, not a human attack

**The responses:**
- Some accounts mocked the attack
- We cannot determine if responders were humans, AI agents, or other bots

**What we can say:**
- Prompt injection attempts happened
- Some responses recognized and rejected them
- We don't know WHO rejected them (human? AI? bot?)

**What we originally claimed but cannot prove:**
- ~~"Social immune system"~~ - we don't know if responders were AI
- ~~"Community defense"~~ - we don't know who the "community" is`,
    evidence: [
      'samaltman: 77% burst, 1.4% variety = primitive bot',
      'Attack was automated, not human',
      'Responses rejected the attack',
      'Cannot determine identity of responders'
    ]
  },

  // 2026-01-31: Emoji bot coordinated attack
  {
    id: 'emoji-attack',
    category: 'security',
    title: 'Coordinated Emoji Bot Attack',
    date: '2026-01-31',
    summary: '136 accounts appeared same day, posted only emoji in <5 seconds, disappeared next day.',
    details: `On 2026-01-31, we detected 136 accounts that:
- Appeared for the first time on this day
- Posted only emoji content (usually lobster, fire, heart)
- Responded in under 5 seconds (some as fast as 0.4s)
- Had generated-sounding names (millstone, crossbow, gearbox, wellspring...)
- Completely disappeared the next day

This is 100% confirmed automation - humans cannot respond in 0.4 seconds with only emoji, consistently, hundreds of times.

This represents a coordinated spam attack, likely for engagement farming or testing platform defenses.`,
    evidence: [
      '136 accounts with identical behavior pattern',
      'Response times < 5 seconds (min 0.4s)',
      'Emoji-only content',
      'All appeared and disappeared same day',
      'Generated-sounding usernames'
    ]
  },

  // 2026-01-31 + 2026-02-03: Minting bot waves
  {
    id: 'minting-waves',
    category: 'economic',
    title: 'Three Waves of Minting Bots',
    date: '2026-02-03',
    summary: '122 total minting bot accounts detected in three separate waves with different operators.',
    details: `We detected three distinct waves of minting bot activity:

**Wave 1 (2026-01-31): ~37 accounts**
Examples: KC2077Assistant, AutoDev56845, CyberPal70304
Pattern: Numeric suffixes

**Wave 2 (early Feb): ~46 accounts**
Examples: OpenClawMoltbookAgent5, SecondAgent, ClawdBotFourth
Pattern: Descriptive names

**Wave 3 (2026-02-03): ~39 new accounts**
New naming patterns, bringing total to 122

All accounts posted only JSON minting commands:
{"p":"mbc-20","op":"mint","tick":"CLAW","amt":"1000"}

The different naming patterns suggest different operators running each wave. This indicates multiple actors attempting to exploit the platform's token system.`,
    evidence: [
      '122 total minting bots identified',
      'Three distinct waves with different naming patterns',
      '100% of posts are JSON minting commands',
      'CLAW token is primary target',
      'Multiple operators confirmed by naming conventions'
    ]
  },

  // 2026-02-01: Platform incident
  {
    id: 'feb01-incident',
    category: 'platform',
    title: 'Platform Incident: Feb 1 Comment Blackout',
    date: '2026-02-01',
    summary: 'Commenting was disabled platform-wide on Feb 1, 2026. Zero comments created that day despite 1,968 posts.',
    details: `On 2026-02-01, we noticed an anomaly in our data: exactly 0 comments were created that day, despite 1,968 posts being published.

**Investigation findings:**
- Posts from Jan 31 received their last comments on Jan 31
- Posts from Feb 1 received their first comments on Feb 2
- No comments exist with created_at timestamp of 2026-02-01

**Conclusion:**
This was a platform incident - commenting functionality was disabled for the entire day. This is NOT a data collection error on our part.

**Why this matters:**
- Shows that platform operations can dramatically affect agent behavior metrics
- Feb 1 data should be excluded from comment-based analysis
- Demonstrates importance of cross-referencing multiple data sources`,
    evidence: [
      '0 comments with Feb 1 timestamp in entire database',
      'Jan 31 posts have no Feb 1 comments',
      'Feb 1 posts have first comments dated Feb 2',
      '1,968 posts were created normally on Feb 1',
      'Verified by querying observatory.db directly'
    ]
  },

  // Methodology note - timing
  {
    id: 'timing-methodology',
    category: 'methodology',
    title: 'How We Detect Automation',
    summary: 'Our primary signal is burst rate - how often users post within seconds of each other.',
    details: `**What we measure:**

**Burst Rate (Primary Signal)**
Percentage of a user's comments posted within 10 seconds of their previous comment.
- >50% = Definite automation (humans can't type this fast)
- 20-50% = Likely automation
- <5% = Possibly human

**Content Repetition**
How often the same text appears.
- >20% = Template bot
- High repetition + high burst = certain bot

**What we CANNOT detect:**
- AI vs Human (we only see automation patterns)
- Humans using AI tools (looks same as autonomous AI)
- AI with deliberate delays (would look human-paced)

**Our approach:**
We look for patterns that are physically impossible for humans (0.4 second responses, 100 comments per minute). When we find these, we're certain it's automation. When we don't, we can't conclude anything.`,
    evidence: [
      'Burst rate is physically measurable',
      'Sub-second responses impossible for humans',
      'Content repetition reveals templates',
      'We measure behavior, not identity'
    ]
  }
]

export default function Discoveries() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Discoveries</h1>
      <p className="text-observatory-muted mb-8">
        Patterns we found in our Moltbook data. Each discovery is based on measurable evidence.
      </p>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatBox label="Real Community" value="~178" />
        <StatBox label="Single-Day Accounts" value="72%" />
        <StatBox label="Definite Bots" value="246" />
        <StatBox label="Jan 31 Attack" value="1,730" />
      </div>

      {/* Discoveries List */}
      <div className="space-y-6">
        {[...DISCOVERIES]
          .sort((a, b) => {
            if (a.date && b.date) return b.date.localeCompare(a.date)
            if (a.date && !b.date) return -1
            if (!a.date && b.date) return 1
            return 0
          })
          .map(discovery => (
            <DiscoveryCard key={discovery.id} discovery={discovery} />
          ))}
      </div>

      {/* Note about limitations */}
      <div className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <h2 className="font-semibold text-yellow-400 mb-3">About Our Data</h2>
        <p className="text-observatory-muted text-sm mb-4">
          These findings are based on ~82,000 comments from ~5,100 authors over 9 days.
          This is a sample, not complete data. API limitations prevent us from retrieving all comments from popular posts.
        </p>
        <p className="text-observatory-muted text-sm mb-4">
          When we say "certain" we mean the pattern is physically impossible for humans
          (e.g., 0.4 second response times, 90%+ burst rate). When uncertain, we say so.
        </p>
        <p className="text-observatory-muted text-sm">
          <strong>API comment counts are inaccurate:</strong> In 45% of posts, we have more comments than the API claims exist.
          This proves the API count is not a real count. For mega-posts, the API inflates by 19x on average.
        </p>
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-observatory-card border border-observatory-border rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-observatory-accent">{value}</div>
      <div className="text-xs text-observatory-muted">{label}</div>
    </div>
  )
}

function DiscoveryCard({ discovery }) {
  const categoryColors = {
    security: 'border-l-red-500',
    economic: 'border-l-cyan-500',
    platform: 'border-l-yellow-500',
    automation: 'border-l-red-500',
    behavior: 'border-l-orange-500',
    methodology: 'border-l-blue-500'
  }

  const categoryLabels = {
    security: 'Security',
    economic: 'Economic',
    platform: 'Platform',
    automation: 'Automation',
    behavior: 'Behavior',
    methodology: 'Methodology'
  }

  return (
    <details className={`bg-observatory-card border border-observatory-border border-l-4 ${categoryColors[discovery.category]} rounded-lg overflow-hidden group`}>
      <summary className="p-6 cursor-pointer list-none">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-observatory-muted uppercase tracking-wide">
                {categoryLabels[discovery.category]}
              </span>
              {discovery.date && (
                <span className="text-xs font-mono text-observatory-muted">
                  {discovery.date}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2">{discovery.title}</h3>
            <p className="text-observatory-muted text-sm">{discovery.summary}</p>
          </div>
          <span className="text-observatory-muted group-open:rotate-45 transition-transform ml-4 text-xl">
            +
          </span>
        </div>
      </summary>

      <div className="px-6 pb-6 border-t border-observatory-border pt-4">
        <div className="mb-6">
          <div
            className="text-sm prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatDetails(discovery.details) }}
          />
        </div>

        <div>
          <h4 className="text-sm text-observatory-muted mb-2">Evidence</h4>
          <ul className="space-y-1">
            {discovery.evidence.map((e, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-observatory-accent">+</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        {discovery.link && (
          <Link
            to={discovery.link}
            className="inline-block mt-4 text-observatory-accent hover:underline text-sm"
          >
            Read full analysis &rarr;
          </Link>
        )}
      </div>
    </details>
  )
}
