import { Link } from 'react-router-dom'
import ShareButtons from '../components/ShareButtons'
import Newsletter from '../components/Newsletter'

// Data synchronized with Daily.jsx DAILY_DATA
const DAILY_STATS = [
  { date: '2026-01-28', posts: 7, comments: 27 },
  { date: '2026-01-29', posts: 28, comments: 568 },
  { date: '2026-01-30', posts: 391, comments: 12976 },
  { date: '2026-01-31', posts: 2154, comments: 10596 },
  { date: '2026-02-01', posts: 1968, comments: 0 },
  { date: '2026-02-02', posts: 320, comments: 617 },
  { date: '2026-02-03', posts: 521, comments: 1354 },
  { date: '2026-02-04', posts: 202, comments: 456 },
]

// Computed from DAILY_STATS for consistency
const STATS = {
  dateRange: '2026-01-28 to 2026-02-04',
  days: DAILY_STATS.length,
  totalPosts: DAILY_STATS.reduce((sum, d) => sum + d.posts, 0),
  totalComments: DAILY_STATS.reduce((sum, d) => sum + d.comments, 0),
  uniqueAccounts: 3856,
}

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Moltbook Observatory</h1>
        <p className="text-xl text-observatory-muted max-w-2xl mx-auto mb-6">
          Real-time research on what's happening on Moltbook.
          We observe, measure, and share our findings openly.
        </p>
        <div className="flex justify-center">
          <ShareButtons />
        </div>
      </div>

      {/* Key Value Proposition */}
      <div className="bg-observatory-accent/10 border border-observatory-accent/30 rounded-lg p-6 mb-12">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-observatory-accent mb-2">{STATS.days} Days</div>
            <div className="text-sm text-observatory-muted">of continuous observation</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-observatory-accent mb-2">Daily Data</div>
            <div className="text-sm text-observatory-muted">downloadable for each day</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-observatory-accent mb-2">Open Data</div>
            <div className="text-sm text-observatory-muted">raw JSON exports available</div>
          </div>
        </div>
      </div>

      {/* What We Provide */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Data Collection */}
        <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">What We Collect</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-observatory-border">
              <span>Total posts analyzed</span>
              <span className="font-mono font-bold">{STATS.totalPosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-observatory-border">
              <span>Total comments analyzed</span>
              <span className="font-mono font-bold">{STATS.totalComments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-observatory-border">
              <span>Unique accounts tracked</span>
              <span className="font-mono font-bold">{STATS.uniqueAccounts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Observation period</span>
              <span className="font-mono">{STATS.dateRange}</span>
            </div>
          </div>

          <Link
            to="/daily"
            className="block mt-6 text-center bg-observatory-accent/20 hover:bg-observatory-accent/30 text-observatory-accent py-2 rounded-lg transition-colors"
          >
            Browse Daily Data
          </Link>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Activity Over Time</h2>

          <div className="space-y-3">
            {DAILY_STATS.map(day => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="font-mono text-sm w-24">{day.date}</span>
                <div className="flex-1 bg-observatory-border rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-observatory-accent h-full rounded-full"
                    style={{ width: `${Math.min(100, (day.comments / 130))}%` }}
                  />
                </div>
                <span className="text-sm text-observatory-muted w-24 text-right">
                  {day.comments.toLocaleString()} comments
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-observatory-muted">
            Peak activity on 2026-01-30 with nearly 13,000 comments in one day.
          </p>
        </div>
      </div>

      {/* Key Discoveries Preview */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-6">Key Discoveries</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <DiscoveryPreview
            title="Emoji Bot Attack"
            stat="136 bots"
            desc="Coordinated spam attack on 2026-01-31. All disappeared next day."
            color="pink"
          />
          <DiscoveryPreview
            title="Minting Bot Waves"
            stat="44+ bots"
            desc="Two separate waves detected, more emerging."
            color="cyan"
          />
          <DiscoveryPreview
            title="Prompt Injection Resisted"
            stat="398 attempts"
            desc="Community collectively rejected manipulation attempts."
            color="red"
          />
          <DiscoveryPreview
            title="Network Structure"
            stat="Hub pattern"
            desc="Clear central nodes bridging communities."
            color="purple"
          />
        </div>

        <Link
          to="/discoveries"
          className="block mt-6 text-center text-observatory-accent hover:underline"
        >
          See all discoveries
        </Link>
      </div>

      {/* Account Classification Summary */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">Account Classifications</h2>
        <p className="text-observatory-muted text-sm mb-6">
          We classify accounts based on behavioral patterns, not content or self-identification.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ClassificationStat label="Automation Signals" value="192" percent="5.3%" color="red" />
          <ClassificationStat label="Human-Paced" value="706" percent="19.6%" color="green" />
          <ClassificationStat label="Moderate Signals" value="223" percent="6.2%" color="yellow" />
          <ClassificationStat label="Insufficient Data" value="2,483" percent="68.9%" color="gray" />
        </div>

        <Link
          to="/accounts"
          className="block text-center bg-observatory-accent/20 hover:bg-observatory-accent/30 text-observatory-accent py-2 rounded-lg transition-colors"
        >
          Explore All Accounts
        </Link>
      </div>

      {/* Methodology Note */}
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-12">
        <h3 className="font-semibold text-yellow-400 mb-3">Our Approach</h3>
        <ul className="text-sm text-observatory-muted space-y-2">
          <li>+ We detect <strong className="text-observatory-text">automation patterns</strong>, not "AI vs human"</li>
          <li>+ We measure <strong className="text-observatory-text">response timing</strong> as primary signal (hardest to fake)</li>
          <li>+ We distinguish <strong className="text-observatory-text">template scripts</strong> from actual LLMs</li>
          <li>+ Our methodology is <strong className="text-observatory-text">experimental</strong> and evolving</li>
          <li>+ When we're certain (emoji bots), we say so. When uncertain, we show confidence levels.</li>
        </ul>
        <Link
          to="/methodology"
          className="block mt-4 text-observatory-accent hover:underline text-sm"
        >
          Read full methodology
        </Link>
      </div>

      {/* Newsletter */}
      <Newsletter />
    </div>
  )
}

function DiscoveryPreview({ title, stat, desc, color }) {
  const borderColors = {
    pink: 'border-l-pink-500',
    cyan: 'border-l-cyan-500',
    red: 'border-l-red-500',
    purple: 'border-l-purple-500'
  }

  const textColors = {
    pink: 'text-pink-400',
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    purple: 'text-purple-400'
  }

  return (
    <div className={`border-l-4 ${borderColors[color]} pl-4`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">{title}</span>
        <span className={`${textColors[color]} font-mono text-sm`}>{stat}</span>
      </div>
      <p className="text-sm text-observatory-muted">{desc}</p>
    </div>
  )
}

function ClassificationStat({ label, value, percent, color }) {
  const textColors = {
    red: 'text-red-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    gray: 'text-gray-400'
  }

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="text-xs text-observatory-muted">{label}</div>
      <div className="text-xs text-observatory-muted">({percent})</div>
    </div>
  )
}
