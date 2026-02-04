import { Link } from 'react-router-dom'

// Daily data - posts only (comment counts unreliable due to API limits)
const DAILY_DATA = [
  { date: '2026-02-04', posts: 202, event: 'FloClaw minting bots detected' },
  { date: '2026-02-03', posts: 521, event: 'Minting bot wave #3' },
  { date: '2026-02-02', posts: 320 },
  { date: '2026-02-01', posts: 1968, event: 'Platform incident - comments disabled' },
  { date: '2026-01-31', posts: 2154, event: 'Jan 31 Attack Wave (1008 accounts)' },
  { date: '2026-01-30', posts: 391, event: 'Prompt injection attempts' },
  { date: '2026-01-29', posts: 28 },
  { date: '2026-01-28', posts: 7, event: 'Moltbook launch day' },
]

const TOTAL_POSTS = DAILY_DATA.reduce((acc, day) => acc + day.posts, 0)

export default function Daily() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Daily Data</h1>
      <p className="text-observatory-muted mb-8">
        Post activity by day. 8 days of observation.
      </p>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-observatory-card border border-observatory-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-observatory-accent">{DAILY_DATA.length}</div>
          <div className="text-xs text-observatory-muted">days observed</div>
        </div>
        <div className="bg-observatory-card border border-observatory-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-observatory-accent">{TOTAL_POSTS.toLocaleString()}</div>
          <div className="text-xs text-observatory-muted">posts scraped</div>
        </div>
      </div>

      {/* Post Activity Chart */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-8">
        <h2 className="font-semibold mb-4">Post Activity</h2>
        <div className="space-y-3">
          {DAILY_DATA.map(day => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="font-mono text-sm w-24">{day.date}</span>
              <div className="flex-1 bg-observatory-border rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-observatory-accent"
                  style={{ width: `${Math.min(100, (day.posts / 22))}%` }}
                />
              </div>
              <span className="text-sm text-observatory-muted w-20 text-right">
                {day.posts.toLocaleString()} posts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Day by Day Table */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-observatory-border/30">
            <tr>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-right py-3 px-4">Posts</th>
              <th className="text-left py-3 px-4">Notable Events</th>
            </tr>
          </thead>
          <tbody>
            {DAILY_DATA.map(day => (
              <tr key={day.date} className="border-t border-observatory-border">
                <td className="py-3 px-4 font-mono">{day.date}</td>
                <td className="py-3 px-4 text-right">{day.posts.toLocaleString()}</td>
                <td className="py-3 px-4 text-observatory-muted text-xs">
                  {day.event || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note about data */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
        <h2 className="font-semibold text-yellow-400 mb-2">About Our Data</h2>
        <p className="text-sm text-observatory-muted">
          Comment counts are unreliable - API returns max ~100 comments per post regardless of actual count.
          Posts with "50,000 comments" may have far fewer real comments, or the numbers are inflated.
          We focus on post counts and bot pattern analysis instead.
        </p>
      </div>

      {/* Download */}
      <div className="bg-observatory-accent/10 border border-observatory-accent/30 rounded-lg p-6 text-center">
        <h2 className="font-semibold mb-2">Download Raw Data</h2>
        <p className="text-sm text-observatory-muted mb-4">
          All {TOTAL_POSTS.toLocaleString()} posts and scraped comments in JSON format.
        </p>
        <Link
          to="/data"
          className="inline-block bg-observatory-accent/20 hover:bg-observatory-accent/30 text-observatory-accent px-6 py-2 rounded transition-colors"
        >
          Go to Downloads
        </Link>
      </div>
    </div>
  )
}
