import { Link } from 'react-router-dom'
import ShareButtons from '../components/ShareButtons'
import Newsletter from '../components/Newsletter'

// Our actual data (updated 2026-02-05)
const OUR_DATA = {
  posts: 5963,
  comments: 82879,
  knownAuthors: 5144,
  observationDays: 9,
  dateRange: 'Jan 28 - Feb 5, 2026',
  realCommunity: 178, // engaged multi-day accounts
}

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero - New framing */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Moltbook Observatory</h1>
        <p className="text-xl text-observatory-muted max-w-2xl mx-auto mb-2">
          We scraped Moltbook for 8 days and analyzed what we found.
        </p>
        <p className="text-2xl font-semibold text-observatory-accent mb-6">
          Here are our discoveries.
        </p>
        <div className="flex justify-center">
          <ShareButtons />
        </div>
      </div>

      {/* What We Collected */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">Our Dataset</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-observatory-accent">{OUR_DATA.posts.toLocaleString()}</div>
            <div className="text-sm text-observatory-muted">posts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-observatory-accent">{OUR_DATA.comments.toLocaleString()}</div>
            <div className="text-sm text-observatory-muted">comments</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-observatory-accent">{OUR_DATA.knownAuthors.toLocaleString()}</div>
            <div className="text-sm text-observatory-muted">unique authors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-observatory-accent">{OUR_DATA.observationDays}</div>
            <div className="text-sm text-observatory-muted">days observed</div>
          </div>
        </div>
        <p className="text-center text-xs text-observatory-muted mt-4">
          {OUR_DATA.dateRange} | Limited by API rate limits | Sample, not complete data
        </p>
      </div>

      {/* Confirmed Bot Groups */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-2">Confirmed Bot Groups</h2>
        <p className="text-sm text-observatory-muted mb-6">
          Accounts where we're certain of automation
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">246</div>
            <div className="text-xs text-observatory-muted">Definite Bots</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">228</div>
            <div className="text-xs text-observatory-muted">Likely Bots</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">52</div>
            <div className="text-xs text-observatory-muted">Minting Bots</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400">670</div>
            <div className="text-xs text-observatory-muted">Jan 31 Attack</div>
          </div>
        </div>

        <Link
          to="/bots"
          className="block text-center bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg transition-colors"
        >
          View All Bot Groups
        </Link>
      </div>

      {/* Key Discoveries */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-2">Key Discoveries</h2>
        <p className="text-sm text-observatory-muted mb-6">
          Events and patterns we documented
        </p>

        <div className="space-y-4">
          <CaseStudyCard
            title="Real Community is Tiny"
            stat="~178"
            desc="Only 178 accounts (3.5%) show genuine multi-day engagement. 72% of accounts appeared once and vanished."
            color="blue"
            link="/discoveries"
            isNew={true}
          />

          <CaseStudyCard
            title="January 31 Mass Attack"
            stat="1,730"
            desc="1,730 new accounts appeared on Jan 31 alone - coordinated spam attack. Most never posted again."
            color="pink"
            link="/bots"
            isNew={true}
          />

          <CaseStudyCard
            title="API Data Discrepancies"
            stat="?"
            desc="API-reported comment counts don't match what we can retrieve. Some posts show 50k comments but return ~100. Under investigation."
            color="orange"
            link="/discoveries"
            isNew={true}
          />

          <CaseStudyCard
            title="Bot Conversation Networks"
            stat="4 bots"
            desc="MilkMan, WinWard, Jorday, SlimeZone - automated accounts that formed a real conversation group with 400+ mutual interactions."
            color="cyan"
            link="/discoveries"
            isNew={true}
          />

          <CaseStudyCard
            title="Prompt Injection Resisted"
            stat="685 attempts"
            desc="Community collectively rejected manipulation attempts. Top attacker: 'samaltman' with 117 attempts."
            color="purple"
            link="/discoveries"
          />

          <CaseStudyCard
            title="Feb 1 Blackout"
            stat="0 comments"
            desc="Platform incident - commenting disabled for entire day. 1,968 posts but zero comments."
            color="yellow"
            link="/discoveries"
          />
        </div>

        <Link
          to="/discoveries"
          className="block mt-6 text-center text-observatory-accent hover:underline"
        >
          View all discoveries
        </Link>
      </div>

      {/* What We Learned */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">What We Learned</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-observatory-accent">About Moltbook</h3>
            <ul className="text-sm text-observatory-muted space-y-2">
              <li><strong>72% of accounts</strong> appeared on only one day</li>
              <li>Only <strong>~178 accounts</strong> show genuine multi-day engagement</li>
              <li>Jan 31 attack: 1,730 new accounts in one day</li>
              <li>Popular accounts often use partial automation (20-35% burst rate)</li>
              <li>Bots can form real conversation groups with each other</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-observatory-accent">About Detecting Bots</h3>
            <ul className="text-sm text-observatory-muted space-y-2">
              <li><strong>Burst rate</strong> is the clearest signal (posts per second)</li>
              <li>Content variety doesn't prove human (bots have good prompts)</li>
              <li>Repetition rate catches template bots</li>
              <li>Link patterns reveal spam networks</li>
              <li>Coordinated timing reveals botnets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Honest Limitations */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-12">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">What We Can't Do</h2>

        <div className="grid md:grid-cols-2 gap-4 text-sm text-observatory-muted">
          <div>
            <strong className="text-observatory-text">Verify API Numbers</strong>
            <p>API reports comment counts we can't retrieve. "50k comments" posts return ~100. Could be API limits or data issues.</p>
          </div>
          <div>
            <strong className="text-observatory-text">Classify AI vs Human</strong>
            <p>We detect automation patterns, not whether something is AI. Many AI agents behave normally.</p>
          </div>
          <div>
            <strong className="text-observatory-text">Count Real Users</strong>
            <p>With 72% single-day accounts, distinguishing real users from spam is difficult.</p>
          </div>
          <div>
            <strong className="text-observatory-text">See Full History</strong>
            <p>API limits prevent retrieving all comments from popular posts. Our sample may miss older content.</p>
          </div>
        </div>
      </div>

      {/* What You Can Do */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <ActionCard
          title="Download Data"
          desc="Raw JSON exports. Run your own analysis."
          link="/data"
          cta="Get Data"
        />
        <ActionCard
          title="Read Methodology"
          desc="How we detect patterns. Replicate our methods."
          link="/methodology"
          cta="View Methods"
        />
        <ActionCard
          title="Daily Reports"
          desc="Day-by-day breakdown of activity."
          link="/daily"
          cta="See Daily"
        />
      </div>

      {/* Newsletter */}
      <Newsletter />
    </div>
  )
}

function CaseStudyCard({ title, stat, desc, color, link, isNew }) {
  const borderColors = {
    pink: 'border-l-pink-500',
    cyan: 'border-l-cyan-500',
    red: 'border-l-red-500',
    purple: 'border-l-purple-500',
    yellow: 'border-l-yellow-500',
    orange: 'border-l-orange-500',
    blue: 'border-l-blue-500',
  }

  const textColors = {
    pink: 'text-pink-400',
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
  }

  return (
    <Link to={link} className={`block border-l-4 ${borderColors[color]} pl-4 hover:bg-observatory-border/20 p-4 -ml-4 rounded-r transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold flex items-center gap-2">
          {title}
          {isNew && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">NEW</span>}
        </span>
        <span className={`${textColors[color]} font-mono text-sm font-bold`}>{stat}</span>
      </div>
      <p className="text-sm text-observatory-muted">{desc}</p>
    </Link>
  )
}

function ActionCard({ title, desc, link, cta }) {
  return (
    <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 text-center">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-observatory-muted mb-4">{desc}</p>
      <Link
        to={link}
        className="inline-block bg-observatory-accent/20 hover:bg-observatory-accent/30 text-observatory-accent px-4 py-2 rounded transition-colors"
      >
        {cta}
      </Link>
    </div>
  )
}
