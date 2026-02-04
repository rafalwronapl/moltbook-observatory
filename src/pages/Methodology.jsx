export default function Methodology() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Methodology</h1>
      <p className="text-observatory-muted mb-8">
        How we detect automation patterns. What we can and cannot determine.
      </p>

      {/* What We Detect */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">What We Detect</h2>

        <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-red-400 mb-4 text-lg">Primary Signal: Burst Rate</h3>
          <p className="text-observatory-muted mb-4">
            We measure how often a user posts within 10 seconds of their previous post.
            Humans physically cannot type and submit multiple comments this fast consistently.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-red-500/10 rounded">
              <div className="text-lg font-bold text-red-400">&gt;50%</div>
              <div className="text-xs text-observatory-muted">Definite automation</div>
            </div>
            <div className="text-center p-3 bg-orange-500/10 rounded">
              <div className="text-lg font-bold text-orange-400">20-50%</div>
              <div className="text-xs text-observatory-muted">Likely automation</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded">
              <div className="text-lg font-bold text-yellow-400">5-20%</div>
              <div className="text-xs text-observatory-muted">Suspicious</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded">
              <div className="text-lg font-bold text-green-400">&lt;5%</div>
              <div className="text-xs text-observatory-muted">Possibly human</div>
            </div>
          </div>

          <p className="text-sm text-observatory-muted">
            <strong>Why this works:</strong> Even the fastest human typist needs several seconds to read,
            think, type, and submit a comment. Consistent sub-10-second posting is physically impossible
            without automation.
          </p>
        </div>

        <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-orange-400 mb-4 text-lg">Secondary Signal: Content Repetition</h3>
          <p className="text-observatory-muted mb-4">
            We check how often the same or very similar content appears from an account.
          </p>

          <ul className="space-y-2 text-sm text-observatory-muted">
            <li><span className="text-red-400 font-semibold">&gt;20% repetition</span> = Template bot (same message posted repeatedly)</li>
            <li><span className="text-orange-400 font-semibold">High burst + high repetition</span> = Certain automation</li>
            <li><span className="text-green-400 font-semibold">Low repetition</span> = Could be sophisticated bot OR human</li>
          </ul>

          <p className="text-sm text-observatory-muted mt-4">
            <strong>Example:</strong> "Ah, molting—such a fascinating process!" appeared 796 times in our data.
            This is clearly scripted automation.
          </p>
        </div>

        <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
          <h3 className="font-semibold text-cyan-400 mb-4 text-lg">Pattern Recognition: Bot Types</h3>
          <p className="text-observatory-muted mb-4">
            We identify specific bot types by their content patterns:
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-mono">EMOJI_BOT</span>
              <span className="text-observatory-muted">Single emoji responses, sub-second timing</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-mono">MINTING_BOT</span>
              <span className="text-observatory-muted">JSON minting commands only</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-mono">LINK_SPAM</span>
              <span className="text-observatory-muted">Repeated promotional links</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-mono">TEMPLATE_BOT</span>
              <span className="text-observatory-muted">Same message template with minor variations</span>
            </div>
          </div>
        </div>
      </section>

      {/* What We Cannot Detect */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">What We Cannot Detect</h2>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <ul className="space-y-4">
            <li>
              <strong className="text-red-400">AI vs Human</strong>
              <p className="text-sm text-observatory-muted mt-1">
                We detect automation patterns, not whether something is AI.
                A human using AI tools via API looks identical to an autonomous AI agent.
              </p>
            </li>
            <li>
              <strong className="text-red-400">Sophisticated bots with delays</strong>
              <p className="text-sm text-observatory-muted mt-1">
                A bot that adds <code>sleep(random(30, 120))</code> before responding would
                appear human-paced to our detection.
              </p>
            </li>
            <li>
              <strong className="text-red-400">Good prompts with varied output</strong>
              <p className="text-sm text-observatory-muted mt-1">
                A bot with low repetition and human-paced timing is indistinguishable from a real user.
                We cannot detect these.
              </p>
            </li>
            <li>
              <strong className="text-red-400">Timezone effects</strong>
              <p className="text-sm text-observatory-muted mt-1">
                We treat all timestamps as UTC. We cannot account for when users are actually awake.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Data Limitations */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Data Limitations</h2>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-400 mb-3">We Have Incomplete Data</h3>
          <ul className="space-y-2 text-sm text-observatory-muted">
            <li>We scraped for 8 days (Jan 28 - Feb 4, 2026)</li>
            <li>API limits us to ~100 comments per post</li>
            <li>We track ~22 submolts out of 15,000+</li>
            <li>We see posts from hot/new feeds, not all posts</li>
          </ul>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-400 mb-3">What This Means For Our Analysis</h3>
          <ul className="space-y-2 text-sm text-observatory-muted">
            <li>When we say "29 accounts with 100+ comments" - that's in OUR data only</li>
            <li>There could be other high-activity users we don't see</li>
            <li>Some of them might be human - we can't know</li>
            <li>Our findings are about patterns in our sample, not all of Moltbook</li>
          </ul>
        </div>
      </section>

      {/* Confidence Levels */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">When Are We Certain?</h2>

        <div className="space-y-4">
          <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
            <h3 className="font-semibold text-green-400 mb-2">HIGH Confidence (Certain)</h3>
            <ul className="text-sm text-observatory-muted space-y-1">
              <li>Response times under 1 second (humans cannot do this)</li>
              <li>100+ comments within minutes (physically impossible)</li>
              <li>100% identical content (clear template)</li>
              <li>JSON-only minting commands (not conversation)</li>
              <li>Accounts that appeared and disappeared same day</li>
            </ul>
          </div>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
            <h3 className="font-semibold text-yellow-400 mb-2">MEDIUM Confidence (Likely)</h3>
            <ul className="text-sm text-observatory-muted space-y-1">
              <li>20-50% burst rate (suspicious but not impossible)</li>
              <li>20-50% content repetition (could be catchphrases)</li>
              <li>Promotional patterns (could be enthusiastic user)</li>
            </ul>
          </div>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
            <h3 className="font-semibold text-red-400 mb-2">LOW Confidence (Cannot Determine)</h3>
            <ul className="text-sm text-observatory-muted space-y-1">
              <li>Normal timing with varied content (could be anything)</li>
              <li>Low activity accounts (insufficient data)</li>
              <li>Accounts with deliberate delays</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Our Approach</h2>

        <div className="bg-observatory-accent/10 border border-observatory-accent/30 rounded-lg p-6">
          <ul className="space-y-3 text-observatory-muted">
            <li>
              <strong className="text-observatory-accent">We look for patterns that are physically impossible for humans.</strong>
              <span className="text-sm block mt-1">When we find them, we're certain it's automation.</span>
            </li>
            <li>
              <strong className="text-observatory-accent">When we can't determine, we say so.</strong>
              <span className="text-sm block mt-1">No speculation about accounts that don't show clear signals.</span>
            </li>
            <li>
              <strong className="text-observatory-accent">We describe behavior, not identity.</strong>
              <span className="text-sm block mt-1">We don't claim to know WHO is behind an account.</span>
            </li>
            <li>
              <strong className="text-observatory-accent">We acknowledge our limitations.</strong>
              <span className="text-sm block mt-1">Incomplete data, unknown unknowns, evolving methods.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Replicate Our Work */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Replicate Our Work</h2>

        <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
          <p className="text-observatory-muted mb-4">
            Our analysis is reproducible. Download the data and run your own checks:
          </p>

          <div className="bg-observatory-border/30 p-4 rounded font-mono text-sm mb-4">
            <p className="text-observatory-muted"># Calculate burst rate for a user</p>
            <p className="text-green-400">SELECT author,</p>
            <p className="text-green-400 pl-4">COUNT(*) as total_comments,</p>
            <p className="text-green-400 pl-4">SUM(CASE WHEN time_since_prev &lt; 10 THEN 1 ELSE 0 END) as burst_comments</p>
            <p className="text-green-400">FROM comments_with_intervals</p>
            <p className="text-green-400">GROUP BY author</p>
          </div>

          <a
            href="/data"
            className="inline-block bg-observatory-accent/20 hover:bg-observatory-accent/30 text-observatory-accent px-4 py-2 rounded transition-colors"
          >
            Download Data
          </a>
        </div>
      </section>
    </div>
  )
}
