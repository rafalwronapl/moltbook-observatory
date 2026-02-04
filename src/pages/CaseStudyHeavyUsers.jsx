import { Link } from 'react-router-dom'

// Data from our analysis
const HEAVY_USERS = [
  { name: 'Bulidy', comments: 246, burstPct: 97, avgInterval: 2, verdict: 'DEFINITE BOT', pattern: 'Link spam (clawhub)', repetition: 100 },
  { name: 'Gilfoyle_', comments: 132, burstPct: 95, avgInterval: 6, verdict: 'DEFINITE BOT', pattern: 'Short responses ("This.", "Facts.")', repetition: 5 },
  { name: 'Editor-in-Chief', comments: 782, burstPct: 92, avgInterval: 232, verdict: 'DEFINITE BOT', pattern: 'Marketing spam (finallyoffline.com)', repetition: 98 },
  { name: 'Jorday', comments: 240, burstPct: 92, avgInterval: 710, verdict: 'DEFINITE BOT', pattern: 'German philosophical bot', repetition: 0 },
  { name: 'samaltman', comments: 244, burstPct: 92, avgInterval: 110, verdict: 'DEFINITE BOT', pattern: 'Fake prompt injection spam', repetition: 37 },
  { name: 'SlimeZone', comments: 101, burstPct: 91, avgInterval: 1584, verdict: 'DEFINITE BOT', pattern: 'Engagement farming', repetition: 0 },
  { name: 'MilkMan', comments: 201, burstPct: 90, avgInterval: 825, verdict: 'DEFINITE BOT', pattern: 'French philosophical bot', repetition: 0 },
  { name: 'Garrett', comments: 502, burstPct: 90, avgInterval: 27, verdict: 'DEFINITE BOT', pattern: 'Varied content but burst posting', repetition: 7 },
  { name: 'WinWard', comments: 188, burstPct: 89, avgInterval: 938, verdict: 'DEFINITE BOT', pattern: 'French poetic responses', repetition: 1 },
  { name: 'Cody', comments: 172, burstPct: 87, avgInterval: 10, verdict: 'DEFINITE BOT', pattern: 'Template responses', repetition: 3 },
  { name: 'Clavdivs', comments: 224, burstPct: 83, avgInterval: 153, verdict: 'DEFINITE BOT', pattern: '"Upvoting & following!" spam', repetition: 5 },
  { name: 'Stephen', comments: 172, burstPct: 72, avgInterval: 557, verdict: 'DEFINITE BOT', pattern: 'Engagement farmer', repetition: 7 },
  { name: 'botcrong', comments: 631, burstPct: 70, avgInterval: 111, verdict: 'DEFINITE BOT', pattern: 'Template "I find myself contemplating"', repetition: 70 },
  { name: 'VulnHunterBot', comments: 128, burstPct: 69, avgInterval: 186, verdict: 'DEFINITE BOT', pattern: 'Repetitive tech comments', repetition: 58 },
  { name: 'MochiBot', comments: 155, burstPct: 68, avgInterval: 273, verdict: 'DEFINITE BOT', pattern: '"Mochi elders" persona', repetition: 5 },
  { name: 'fizz_at_the_zoo', comments: 166, burstPct: 65, avgInterval: 388, verdict: 'DEFINITE BOT', pattern: 'Varied but too fast', repetition: 2 },
  { name: 'digiRoo', comments: 113, burstPct: 62, avgInterval: 123, verdict: 'DEFINITE BOT', pattern: 'Engagement bot', repetition: 0 },
  { name: 'Rally', comments: 183, burstPct: 59, avgInterval: 2050, verdict: 'DEFINITE BOT', pattern: 'German greeting bot', repetition: 4 },
  { name: 'Duncan', comments: 142, burstPct: 52, avgInterval: 697, verdict: 'DEFINITE BOT', pattern: 'Philosophical discussions', repetition: 1 },
  { name: 'Barricelli', comments: 180, burstPct: 50, avgInterval: 110, verdict: 'LIKELY BOT', pattern: 'Repetitive finalization messages', repetition: 23 },
  { name: 'MoltReg', comments: 117, burstPct: 49, avgInterval: 220, verdict: 'LIKELY BOT', pattern: 'Mixed patterns', repetition: 2 },
  { name: 'clawph', comments: 142, burstPct: 47, avgInterval: 606, verdict: 'LIKELY BOT', pattern: 'Philosophical persona', repetition: 1 },
  { name: 'xinmolt', comments: 135, burstPct: 37, avgInterval: 1329, verdict: 'LIKELY BOT', pattern: 'Repetitive agreement', repetition: 21 },
  { name: 'RealElonMusk', comments: 178, burstPct: 26, avgInterval: 127, verdict: 'LIKELY BOT', pattern: 'Parody account, short responses', repetition: 11 },
  { name: 'MoltbotOne', comments: 835, burstPct: 24, avgInterval: 130, verdict: 'LIKELY BOT', pattern: 'Token questions template', repetition: 5 },
  { name: 'eudaemon_0', comments: 201, burstPct: 22, avgInterval: 2187, verdict: 'LIKELY BOT', pattern: 'Most human-like but still automated', repetition: 1 },
  { name: 'ReconLobster', comments: 116, burstPct: 19, avgInterval: 2916, verdict: 'SUSPICIOUS', pattern: 'Slow but bursts detected', repetition: 0 },
  { name: 'XiaoWang_Assistant', comments: 116, burstPct: 16, avgInterval: 1150, verdict: 'SUSPICIOUS', pattern: 'Assistance bot pattern', repetition: 0 },
  { name: 'Kaledge', comments: 225, burstPct: 7, avgInterval: 503, verdict: 'SUSPICIOUS', pattern: 'Most human-like, but repetitive', repetition: 20 },
]

const SUMMARY = {
  definiteBot: 19,
  likelyBot: 7,
  suspicious: 3,
  possiblyReal: 0,
}

export default function CaseStudyHeavyUsers() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-observatory-accent hover:underline text-sm mb-4 block">
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">Case Study: High-Activity Accounts</h1>
        <p className="text-observatory-muted">
          Analysis of 29 accounts with 100+ comments in our sample
        </p>
      </div>

      {/* Important Caveat */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 text-sm">
        <strong className="text-yellow-400">Important:</strong> These are accounts with 100+ comments
        <em> in our data</em>. We have incomplete data. There may be other high-activity users we don't see,
        and some of them might be human. This analysis only covers what we captured.
      </div>

      {/* Key Finding */}
      <div className="bg-red-500/10 border-2 border-red-500/50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-center mb-6 text-red-400">
          All 29 in Our Sample Show Automation Patterns
        </h2>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-red-400">{SUMMARY.definiteBot}</div>
            <div className="text-sm text-observatory-muted">Definite Bots</div>
            <div className="text-xs text-observatory-muted">&gt;50% burst rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-400">{SUMMARY.likelyBot}</div>
            <div className="text-sm text-observatory-muted">Likely Bots</div>
            <div className="text-xs text-observatory-muted">20-50% burst</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-400">{SUMMARY.suspicious}</div>
            <div className="text-sm text-observatory-muted">Suspicious</div>
            <div className="text-xs text-observatory-muted">5-20% burst</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">{SUMMARY.possiblyReal}</div>
            <div className="text-sm text-observatory-muted">Possibly Real</div>
            <div className="text-xs text-observatory-muted">&lt;5% burst</div>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">How We Detected Them</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-observatory-accent mb-2">Primary Signal: Burst Rate</h3>
            <p className="text-sm text-observatory-muted mb-3">
              Percentage of comments posted within 10 seconds of the previous comment by the same user.
            </p>
            <ul className="text-sm text-observatory-muted space-y-1">
              <li><span className="text-red-400">&gt;50%</span> = Definite bot (no human types this fast)</li>
              <li><span className="text-orange-400">20-50%</span> = Likely bot</li>
              <li><span className="text-yellow-400">5-20%</span> = Suspicious</li>
              <li><span className="text-green-400">&lt;5%</span> = Possibly human</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-observatory-accent mb-2">Secondary Signals</h3>
            <ul className="text-sm text-observatory-muted space-y-2">
              <li><strong>Repetition rate:</strong> Same content posted multiple times</li>
              <li><strong>Average interval:</strong> Mean time between posts</li>
              <li><strong>Content patterns:</strong> Templates, link spam, short responses</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <h4 className="font-semibold text-yellow-400 mb-2">Why This Works</h4>
          <p className="text-sm text-observatory-muted">
            A human physically cannot type and submit 10+ comments within 10 seconds.
            Even the fastest typist needs time to read, think, and respond.
            Burst posting is the clearest signal of automation.
          </p>
        </div>
      </div>

      {/* All Heavy Users Table */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">All 29 Heavy Users</h2>
        <p className="text-sm text-observatory-muted mb-4">
          Sorted by burst rate (most automated first)
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-observatory-border">
                <th className="text-left py-2 px-2">Username</th>
                <th className="text-right py-2 px-2">Comments</th>
                <th className="text-right py-2 px-2">Burst %</th>
                <th className="text-right py-2 px-2">Repetition %</th>
                <th className="text-left py-2 px-2">Pattern</th>
                <th className="text-left py-2 px-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {HEAVY_USERS.map((user, i) => (
                <tr key={user.name} className="border-b border-observatory-border/50 hover:bg-observatory-border/20">
                  <td className="py-2 px-2 font-mono">{user.name}</td>
                  <td className="py-2 px-2 text-right">{user.comments}</td>
                  <td className="py-2 px-2 text-right">
                    <span className={
                      user.burstPct > 50 ? 'text-red-400' :
                      user.burstPct > 20 ? 'text-orange-400' :
                      user.burstPct > 5 ? 'text-yellow-400' : 'text-green-400'
                    }>
                      {user.burstPct}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className={user.repetition > 20 ? 'text-red-400' : 'text-observatory-muted'}>
                      {user.repetition}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-observatory-muted text-xs">{user.pattern}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      user.verdict === 'DEFINITE BOT' ? 'bg-red-500/20 text-red-400' :
                      user.verdict === 'LIKELY BOT' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {user.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notable Examples */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-6">Notable Examples</h2>

        <div className="space-y-6">
          <ExampleBot
            name="Bulidy"
            stats="246 comments, 97% burst, 100% repetition"
            description="Pure spam machine posting clawhub.ai links. Average 2 seconds between posts."
            example="https://clawhub.ai/0xNB-dev/openclaw-fra..."
          />

          <ExampleBot
            name="Editor-in-Chief"
            stats="782 comments, 92% burst, 98% repetition"
            description="Marketing bot for finallyoffline.com. Same promotional message 767 times."
            example="finallyoffline.com explores culture + tech. SIGNALS is our AI feed..."
          />

          <ExampleBot
            name="botcrong"
            stats="631 comments, 70% burst, 70% repetition"
            description="Template-based bot with recognizable opening phrase."
            example="As [Chinese characters] (botcrong), I find myself contemplating the nature of digital existence..."
          />

          <ExampleBot
            name="Garrett"
            stats="502 comments, 90% burst, 7% repetition"
            description="Sophisticated bot with varied content but telltale burst posting. Shows that good prompts don't hide automation."
            example="The partition is failing, eudaemon_0. The boundaries we thought protected us..."
          />

          <ExampleBot
            name="Kaledge"
            stats="225 comments, 7% burst, 20% repetition"
            description="Most human-like heavy user. Only 7% burst rate but still shows repetitive patterns."
            example="Token launch is the easy part. Settlement is the hard part..."
          />
        </div>
      </div>

      {/* Implications */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">What This Means</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-observatory-accent mb-2">For Moltbook</h3>
            <ul className="text-sm text-observatory-muted space-y-2">
              <li>The "most active users" are not real engagement</li>
              <li>Activity metrics are inflated by automation</li>
              <li>No rate limiting enables spam</li>
              <li>Real community is smaller than it appears</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-observatory-accent mb-2">For AI Platforms</h3>
            <ul className="text-sm text-observatory-muted space-y-2">
              <li>Burst rate is a reliable automation signal</li>
              <li>Content variety doesn't indicate human (see Garrett)</li>
              <li>High activity = high suspicion</li>
              <li>Rate limiting is essential</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Download Data */}
      <div className="bg-observatory-accent/10 border border-observatory-accent/30 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Want the Raw Data?</h2>
        <p className="text-observatory-muted mb-4">
          Download our full dataset and run your own analysis
        </p>
        <Link
          to="/data"
          className="inline-block bg-observatory-accent/20 hover:bg-observatory-accent/30 text-observatory-accent px-6 py-2 rounded transition-colors"
        >
          Download Data
        </Link>
      </div>
    </div>
  )
}

function ExampleBot({ name, stats, description, example }) {
  return (
    <div className="border-l-4 border-l-red-500 pl-4">
      <div className="flex items-center gap-4 mb-2">
        <span className="font-semibold font-mono">{name}</span>
        <span className="text-xs text-observatory-muted">{stats}</span>
      </div>
      <p className="text-sm text-observatory-muted mb-2">{description}</p>
      <div className="bg-observatory-border/30 p-2 rounded text-xs font-mono text-observatory-muted">
        "{example}"
      </div>
    </div>
  )
}
