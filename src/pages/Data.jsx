import { Link } from 'react-router-dom'

export default function DataPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Download Data</h1>
      <p className="text-observatory-muted mb-8">
        Raw data from our Moltbook observation. Use it for your own research.
      </p>

      {/* Available Downloads */}
      <div className="space-y-6 mb-12">
        <DownloadCard
          title="Full Dataset (JSON)"
          desc="All posts and comments from Jan 28 - Feb 4, 2026"
          size="~15 MB"
          link="/data/moltbook-observatory-full.json"
        />

        <DownloadCard
          title="Heavy Users Analysis"
          desc="Data for all 29 accounts with 100+ comments"
          size="~500 KB"
          link="/data/heavy-users.json"
        />

        <DownloadCard
          title="Bot Patterns"
          desc="Detected automation patterns, timestamps, burst rates"
          size="~1 MB"
          link="/data/bot-patterns.json"
        />

        <DownloadCard
          title="Daily Summaries"
          desc="Day-by-day statistics and metrics"
          size="~100 KB"
          link="/data/daily-summaries.json"
        />
      </div>

      {/* Data Format */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">Data Format</h2>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-observatory-accent mb-2">Posts</h3>
            <pre className="bg-observatory-border/30 p-3 rounded text-xs overflow-x-auto">
{`{
  "id": "abc123",
  "title": "Post title",
  "author": "username",
  "submolt": "general",
  "created_at": "2026-01-30T12:34:56Z",
  "upvotes": 42,
  "downvotes": 3,
  "comment_count": 15
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-observatory-accent mb-2">Comments</h3>
            <pre className="bg-observatory-border/30 p-3 rounded text-xs overflow-x-auto">
{`{
  "id": "xyz789",
  "post_id": "abc123",
  "author": "username",
  "content": "Comment text...",
  "created_at": "2026-01-30T12:35:00Z",
  "parent_id": null,
  "depth": 0
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Terms of Use */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">Terms of Use</h2>
        <ul className="text-sm text-observatory-muted space-y-2">
          <li>Data is provided for research and educational purposes</li>
          <li>No warranty - this is observational data with limitations</li>
          <li>Attribution appreciated but not required</li>
          <li>We don't control Moltbook - data reflects what we captured</li>
        </ul>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link to="/" className="text-observatory-accent hover:underline">
          &larr; Back to Overview
        </Link>
      </div>
    </div>
  )
}

function DownloadCard({ title, desc, size, link }) {
  return (
    <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 flex items-center justify-between">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-observatory-muted">{desc}</p>
        <p className="text-xs text-observatory-muted mt-1">Size: {size}</p>
      </div>
      <a
        href={link}
        download
        className="bg-observatory-accent/20 hover:bg-observatory-accent/30 text-observatory-accent px-4 py-2 rounded transition-colors"
      >
        Download
      </a>
    </div>
  )
}
