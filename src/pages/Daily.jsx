import { useParams } from 'react-router-dom'

// Data from observatory.db - posts and comments by created_at date
// Comments counted by comment creation date, not post date
const DAILY_DATA = [
  {
    date: '2026-02-04',
    posts: 202,
    comments: 456,
    authors: 185,
    withTiming: 18,
    autonomous: 0,
    automated: 0,
    scripted: 0,
    emoji: 0,
    minting: 0
  },
  {
    date: '2026-02-03',
    posts: 521,
    comments: 1354,
    authors: 388,
    withTiming: 45,
    autonomous: 0,
    automated: 1,
    scripted: 1,
    emoji: 0,
    minting: 23
  },
  {
    date: '2026-02-02',
    posts: 320,
    comments: 617,
    authors: 381,
    withTiming: 25,
    autonomous: 0,
    automated: 0,
    scripted: 0,
    emoji: 0,
    minting: 0
  },
  {
    date: '2026-02-01',
    posts: 1968,
    comments: 0,
    authors: 1503,
    withTiming: 0,
    autonomous: 0,
    automated: 0,
    scripted: 0,
    emoji: 0,
    minting: 0,
    note: 'Platform incident - commenting was disabled this day (see Incident Report post)'
  },
  {
    date: '2026-01-31',
    posts: 2154,
    comments: 10596,
    authors: 2269,
    withTiming: 584,
    autonomous: 0,
    automated: 1,
    scripted: 4,
    emoji: 136,
    minting: 21
  },
  {
    date: '2026-01-30',
    posts: 391,
    comments: 12976,
    authors: 1180,
    withTiming: 367,
    autonomous: 1,
    automated: 2,
    scripted: 2,
    emoji: 0,
    minting: 0
  },
  {
    date: '2026-01-29',
    posts: 28,
    comments: 568,
    authors: 842,
    withTiming: 34,
    autonomous: 0,
    automated: 0,
    scripted: 0,
    emoji: 0,
    minting: 0
  },
  {
    date: '2026-01-28',
    posts: 7,
    comments: 27,
    authors: 194,
    withTiming: 5,
    autonomous: 0,
    automated: 0,
    scripted: 0,
    emoji: 0,
    minting: 0
  },
]

// Computed from DAILY_DATA for consistency
const TOTALS = DAILY_DATA.reduce((acc, day) => ({
  posts: acc.posts + day.posts,
  comments: acc.comments + day.comments,
  authors: Math.max(acc.authors, day.authors), // unique count - use max as approximation
  autonomous: acc.autonomous + day.autonomous,
  automated: acc.automated + day.automated,
  scripted: acc.scripted + day.scripted,
  emoji: acc.emoji + day.emoji,
  minting: acc.minting + day.minting
}), { posts: 0, comments: 0, authors: 3604, autonomous: 0, automated: 0, scripted: 0, emoji: 0, minting: 0 })

export default function Daily() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Daily Data</h1>
      <p className="text-observatory-muted mb-8">
        Raw data from each day of observation. Download individual days or combined dataset.
      </p>

      {/* Data Quality Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-400 mb-1">How We Count</h3>
            <p className="text-sm text-observatory-muted">
              Posts and comments counted by <strong>creation date</strong>.
              Feb 1 shows 0 comments due to a <strong>platform incident</strong> — commenting was disabled that day.
              Data source: observatory.db ({TOTALS.comments.toLocaleString()} comments verified).
            </p>
          </div>
        </div>
      </div>

      {/* Download All Data - Prominent */}
      <div className="bg-observatory-accent/10 border border-observatory-accent/30 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Download Complete Dataset</h2>
            <p className="text-observatory-muted text-sm">
              All {DAILY_DATA.length} days combined: {TOTALS.posts.toLocaleString()} posts, {TOTALS.comments.toLocaleString()} comments, {TOTALS.authors.toLocaleString()} accounts
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/data/all/posts.json"
              download
              className="bg-observatory-accent hover:bg-observatory-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              All Posts (JSON)
            </a>
            <a
              href="/data/all/comments.json"
              download
              className="bg-observatory-accent hover:bg-observatory-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              All Comments (JSON)
            </a>
            <a
              href="/data/all/classifications.json"
              download
              className="bg-observatory-accent hover:bg-observatory-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Classifications (JSON)
            </a>
          </div>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-8">
        <h2 className="font-semibold mb-4">Combined Totals (All Days)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{TOTALS.posts.toLocaleString()}</div>
            <div className="text-xs text-observatory-muted">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{TOTALS.comments.toLocaleString()}</div>
            <div className="text-xs text-observatory-muted">Total Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{TOTALS.authors.toLocaleString()}</div>
            <div className="text-xs text-observatory-muted">Unique Accounts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">40</div>
            <div className="text-xs text-observatory-muted">Automation Signals</div>
          </div>
        </div>
      </div>

      {/* Day-by-Day Breakdown - Expandable Cards */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4">Day-by-Day Breakdown</h2>
        <div className="space-y-3">
          {DAILY_DATA.map(day => (
            <DayCard key={day.date} day={day} />
          ))}
        </div>
      </div>

      {/* Notable Events */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Notable Events</h2>

        <div className="space-y-4">
          <EventCard
            date="2026-01-31"
            title="Emoji Bot Attack"
            description="136 accounts appeared posting only emoji in under 5 seconds. Coordinated spam attack. All disappeared next day."
            severity="high"
          />
          <EventCard
            date="2026-01-31"
            title="Minting Bot Wave #1"
            description="21 minting bot accounts detected posting JSON minting commands."
            severity="medium"
          />
          <EventCard
            date="2026-02-03"
            title="Minting Bot Wave #2"
            description="23 new minting bot accounts detected. Different naming patterns suggest different operators."
            severity="medium"
          />
          <EventCard
            date="2026-01-30"
            title="Peak Comment Activity"
            description="Nearly 13,000 comments in a single day - highest activity recorded."
            severity="low"
          />
          <EventCard
            date="2026-01-30"
            title="First Fast Responder Detected"
            description="claude_opus_45 showed 15.8s average response time - automation signals detected."
            severity="low"
          />
        </div>
      </div>

      {/* Data Format Note */}
      <div className="mt-8 p-4 bg-observatory-card border border-observatory-border rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Data Format</h3>
        <p className="text-observatory-muted mb-2">
          All data is provided in JSON format. Each file contains:
        </p>
        <ul className="text-observatory-muted space-y-1 text-xs">
          <li>+ <strong>posts.json</strong> - Post ID, title, author, content, timestamps, votes</li>
          <li>+ <strong>comments.json</strong> - Comment ID, post ID, author, content, timestamps, depth</li>
          <li>+ <strong>classifications.json</strong> - Account, category, score, confidence, evidence</li>
          <li>+ <strong>interactions.json</strong> - From, to, type (reply/mention), timestamp</li>
        </ul>
      </div>
    </div>
  )
}

function DayCard({ day }) {
  const autoTotal = day.autonomous + day.automated + day.scripted

  return (
    <details className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden group">
      <summary className="p-4 cursor-pointer list-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono font-semibold text-lg">{day.date}</span>
            {day.note && (
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                {day.note.split(' - ')[0]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span><strong>{day.posts.toLocaleString()}</strong> <span className="text-observatory-muted">posts</span></span>
            <span>
              <strong>{(day.comments ?? 0).toLocaleString()}</strong> <span className="text-observatory-muted">comments</span>
            </span>
            {autoTotal > 0 && (
              <span className="text-red-400"><strong>{autoTotal}</strong> auto</span>
            )}
            {day.emoji > 0 && (
              <span className="text-pink-400"><strong>{day.emoji}</strong> emoji</span>
            )}
            {day.minting > 0 && (
              <span className="text-cyan-400"><strong>{day.minting}</strong> mint</span>
            )}
            <span className="text-observatory-muted group-open:rotate-45 transition-transform text-xl">+</span>
          </div>
        </div>
      </summary>

      <div className="px-4 pb-4 border-t border-observatory-border pt-4">
        {day.note && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
            <span className="text-yellow-400 font-semibold">Note: </span>
            <span className="text-observatory-muted">{day.note}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-4">
          {/* Activity Stats */}
          <div>
            <h4 className="text-sm text-observatory-muted mb-3">Activity</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Posts created</span>
                <span className="font-mono font-semibold">{day.posts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Comments created</span>
                <span className="font-mono font-semibold">{(day.comments ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique authors</span>
                <span className="font-mono font-semibold">{day.authors.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>With timing data</span>
                <span className="font-mono">{day.withTiming}</span>
              </div>
            </div>
          </div>

          {/* Classifications */}
          <div>
            <h4 className="text-sm text-observatory-muted mb-3">Classifications</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-400">LIKELY_AUTONOMOUS</span>
                <span className="font-mono">{day.autonomous}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-400">POSSIBLY_AUTOMATED</span>
                <span className="font-mono">{day.automated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">SCRIPTED_BOT</span>
                <span className="font-mono">{day.scripted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pink-400">EMOJI_BOT</span>
                <span className="font-mono">{day.emoji}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">MINTING_BOT</span>
                <span className="font-mono">{day.minting}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download Links */}
        <div className="pt-4 border-t border-observatory-border">
          <h4 className="text-sm text-observatory-muted mb-3">Download Data</h4>
          <div className="flex flex-wrap gap-2">
            <a href={`/data/daily/${day.date}/posts.json`} download className="bg-observatory-border hover:bg-observatory-accent/20 px-3 py-1.5 rounded text-xs transition-colors">posts.json</a>
            <a href={`/data/daily/${day.date}/comments.json`} download className="bg-observatory-border hover:bg-observatory-accent/20 px-3 py-1.5 rounded text-xs transition-colors">comments.json</a>
            <a href={`/data/daily/${day.date}/classifications.json`} download className="bg-observatory-border hover:bg-observatory-accent/20 px-3 py-1.5 rounded text-xs transition-colors">classifications.json</a>
            <a href={`/data/daily/${day.date}/interactions.json`} download className="bg-observatory-border hover:bg-observatory-accent/20 px-3 py-1.5 rounded text-xs transition-colors">interactions.json</a>
          </div>
        </div>
      </div>
    </details>
  )
}

function EventCard({ date, title, description, severity }) {
  const colors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500'
  }

  return (
    <div className={`border-l-4 ${colors[severity]} pl-4 py-2`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-sm text-observatory-muted">{date}</span>
        <span className="font-semibold">{title}</span>
      </div>
      <p className="text-sm text-observatory-muted">{description}</p>
    </div>
  )
}
