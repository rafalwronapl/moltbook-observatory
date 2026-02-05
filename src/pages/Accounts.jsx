import { useState, useEffect, useMemo } from 'react'

// New category definitions based on burst rate + variety
const CATEGORY_CONFIG = {
  'all': { name: 'All Accounts', color: 'gray', icon: '📊', description: 'All tracked accounts' },
  'primitive_bot': {
    name: 'Primitive Bots',
    color: 'red',
    icon: '🤖',
    description: 'High automation (>50% burst), low variety (<20%). Simple spam scripts.'
  },
  'llm_agent': {
    name: 'LLM Agents',
    color: 'purple',
    icon: '🧠',
    description: 'High automation (>50% burst), high variety (>50%). Smart AI agents - can be valuable!'
  },
  'mixed_bot': {
    name: 'Mixed Bots',
    color: 'orange',
    icon: '⚙️',
    description: 'High automation, medium variety. Between spam and smart.'
  },
  'human_paced': {
    name: 'Human-Paced',
    color: 'green',
    icon: '👤',
    description: 'Low automation (<20% burst). Could be humans OR slow AI.'
  },
  'suspicious': {
    name: 'Suspicious',
    color: 'yellow',
    icon: '🟡',
    description: 'Medium automation (20-50% burst). Unclear classification.'
  },
}

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load data
  useEffect(() => {
    fetch('/data/account_categories.json')
      .then(r => r.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        setError('Failed to load data')
        setLoading(false)
      })
  }, [])

  // Get all accounts flat list
  const allAccounts = useMemo(() => {
    if (!data) return []
    const accounts = []
    for (const group of Object.values(data.groups || {})) {
      accounts.push(...(group.accounts || []))
    }
    return accounts.sort((a, b) => b.posts - a.posts)
  }, [data])

  // Get accounts for current category
  const currentAccounts = useMemo(() => {
    if (!data) return []
    if (selectedCategory === 'all') return allAccounts
    return data.groups?.[selectedCategory]?.accounts || []
  }, [selectedCategory, data, allAccounts])

  // Filter by search
  const filteredAccounts = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return currentAccounts.slice(0, 30)
    const term = searchTerm.toLowerCase()
    return currentAccounts
      .filter(a => a.name.toLowerCase().includes(term))
      .slice(0, 100)
  }, [searchTerm, currentAccounts])

  // Find account data for details
  const accountData = useMemo(() => {
    if (!selectedAccount) return null
    return allAccounts.find(a => a.name === selectedAccount)
  }, [selectedAccount, allAccounts])

  const handleSelectAccount = (name) => {
    setSelectedAccount(name)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-12">Loading...</div>
  if (error) return <div className="max-w-6xl mx-auto px-4 py-12 text-red-400">{error}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Account Explorer</h1>
      <p className="text-observatory-muted mb-6">
        {data?.total_accounts?.toLocaleString()} accounts categorized by automation patterns.
      </p>

      {/* Methodology Note */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-sm">
        <strong className="text-blue-400">How we categorize:</strong>
        <ul className="mt-2 text-observatory-muted space-y-1">
          <li><strong>Burst rate</strong> = % of posts within 10 seconds (detects automation)</li>
          <li><strong>Variety</strong> = % unique content (distinguishes spam from LLM)</li>
          <li><span className="text-purple-400">LLM Agent</span> = automated but valuable (high variety)</li>
          <li><span className="text-red-400">Primitive Bot</span> = automated spam (low variety)</li>
        </ul>
      </div>

      {/* Selected Account Details */}
      {selectedAccount && accountData && (
        <AccountDetails
          account={accountData}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = key === 'all'
            ? data?.total_accounts || 0
            : (data?.groups?.[key]?.count || 0)

          return (
            <button
              key={key}
              onClick={() => { setSelectedCategory(key); setSearchTerm(''); setSelectedAccount(null); }}
              className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                selectedCategory === key
                  ? 'bg-observatory-accent text-white'
                  : 'bg-observatory-card border border-observatory-border hover:border-observatory-accent'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.name}</span>
              <span className="text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Category Description */}
      {selectedCategory !== 'all' && CATEGORY_CONFIG[selectedCategory] && (
        <div className={`bg-observatory-card border border-observatory-border rounded-lg p-4 mb-6 border-l-4 ${getCategoryBorderColor(selectedCategory)}`}>
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <span>{CATEGORY_CONFIG[selectedCategory].icon}</span>
            {CATEGORY_CONFIG[selectedCategory].name}
          </h2>
          <p className="text-sm text-observatory-muted">{CATEGORY_CONFIG[selectedCategory].description}</p>
          <p className="text-xs text-observatory-muted mt-2">
            {data?.groups?.[selectedCategory]?.count || 0} accounts in this category
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name..."
          className="w-full bg-observatory-bg border border-observatory-border rounded-lg px-4 py-3 focus:outline-none focus:border-observatory-accent"
        />
      </div>

      {/* Accounts Table */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-observatory-bg">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Account</th>
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-right px-4 py-3 font-semibold">Posts</th>
              <th className="text-right px-4 py-3 font-semibold">Days</th>
              <th className="text-right px-4 py-3 font-semibold">Burst %</th>
              <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">Variety %</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc, i) => (
              <tr
                key={acc.name || i}
                onClick={() => handleSelectAccount(acc.name)}
                className="border-t border-observatory-border hover:bg-observatory-bg cursor-pointer"
              >
                <td className="px-4 py-3 font-mono">{acc.name}</td>
                <td className="px-4 py-3">
                  <CategoryBadge category={acc.category} />
                </td>
                <td className="px-4 py-3 text-right">{acc.posts}</td>
                <td className="px-4 py-3 text-right">{acc.days}</td>
                <td className="px-4 py-3 text-right">
                  <span className={getBurstColor(acc.burst_pct)}>
                    {acc.burst_pct?.toFixed(0) || 0}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className={getVarietyColor(acc.variety)}>
                    {acc.variety?.toFixed(0) || 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAccounts.length >= 30 && !searchTerm && (
          <div className="px-4 py-3 text-center text-sm text-observatory-muted border-t border-observatory-border">
            Showing first 30 results. Use search to find specific accounts.
          </div>
        )}
      </div>

      {/* Key Insight */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h3 className="font-semibold text-purple-400 mb-2">Key Insight: Bot ≠ Bad</h3>
        <p className="text-sm text-observatory-muted">
          <strong className="text-purple-400">LLM Agents</strong> are automated (high burst rate) but create unique,
          valuable content. They ask good questions and engage meaningfully.
          <strong className="text-red-400"> Primitive Bots</strong> are also automated but just spam repetitive content.
          The difference is <strong>variety</strong>, not speed.
        </p>
      </div>

      {/* Download */}
      <div className="mt-6 text-center">
        <a
          href="/data/account_categories.json"
          download
          className="text-observatory-accent hover:underline text-sm"
        >
          Download all categories as JSON
        </a>
      </div>
    </div>
  )
}

function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['suspicious']
  const colorClasses = {
    'primitive_bot': 'bg-red-500/20 text-red-400',
    'llm_agent': 'bg-purple-500/20 text-purple-400',
    'mixed_bot': 'bg-orange-500/20 text-orange-400',
    'human_paced': 'bg-green-500/20 text-green-400',
    'suspicious': 'bg-yellow-500/20 text-yellow-400',
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${colorClasses[category] || 'bg-gray-500/20 text-gray-400'}`}>
      {config.icon} {config.name.split(' ')[0]}
    </span>
  )
}

function AccountDetails({ account, onClose }) {
  const config = CATEGORY_CONFIG[account.category] || {}

  return (
    <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-mono font-bold">{account.name}</h2>
          <div className="flex gap-2 mt-2">
            <CategoryBadge category={account.category} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-observatory-muted hover:text-white px-3 py-1 border border-observatory-border rounded"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatBox label="Posts" value={account.posts} />
        <StatBox label="Days Active" value={account.days} />
        <StatBox
          label="Burst Rate"
          value={`${account.burst_pct?.toFixed(1) || 0}%`}
          color={getBurstColor(account.burst_pct)}
        />
        <StatBox
          label="Variety"
          value={`${account.variety?.toFixed(1) || 0}%`}
          color={getVarietyColor(account.variety)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-observatory-muted">First seen: </span>
          <span className="font-mono">{account.first_seen}</span>
        </div>
        <div>
          <span className="text-observatory-muted">Last seen: </span>
          <span className="font-mono">{account.last_seen}</span>
        </div>
      </div>

      {/* Interpretation */}
      <div className="p-3 bg-observatory-bg rounded-lg text-sm">
        <strong>Interpretation: </strong>
        {getInterpretation(account)}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-observatory-bg rounded-lg p-3 text-center">
      <div className={`text-xl font-mono font-bold ${color || 'text-observatory-accent'}`}>
        {value}
      </div>
      <div className="text-xs text-observatory-muted">{label}</div>
    </div>
  )
}

function getCategoryBorderColor(category) {
  const colors = {
    'primitive_bot': 'border-l-red-500',
    'llm_agent': 'border-l-purple-500',
    'mixed_bot': 'border-l-orange-500',
    'human_paced': 'border-l-green-500',
    'suspicious': 'border-l-yellow-500',
  }
  return colors[category] || 'border-l-gray-500'
}

function getBurstColor(burst) {
  if (!burst) return ''
  if (burst >= 50) return 'text-red-400'
  if (burst >= 20) return 'text-yellow-400'
  return 'text-green-400'
}

function getVarietyColor(variety) {
  if (variety === undefined || variety === null) return ''
  if (variety >= 50) return 'text-green-400'
  if (variety >= 20) return 'text-yellow-400'
  return 'text-red-400'
}

function getInterpretation(account) {
  const { category, burst_pct, variety, days } = account

  if (category === 'primitive_bot') {
    return `Primitive spam bot - ${burst_pct?.toFixed(0)}% automation with only ${variety?.toFixed(0)}% unique content. Likely a simple script posting repetitive spam.`
  }

  if (category === 'llm_agent') {
    return `LLM-powered agent - automated (${burst_pct?.toFixed(0)}% burst) but creates unique content (${variety?.toFixed(0)}% variety). Could be a valuable contributor despite being a bot.`
  }

  if (category === 'mixed_bot') {
    return `Mixed automation - shows bot-like timing but moderate content variety. Could be a bot with some templating or a semi-automated account.`
  }

  if (category === 'human_paced') {
    if (variety >= 80) {
      return `Human-paced with high variety - timing suggests human or slow AI. ${days > 3 ? 'Multi-day engagement suggests genuine interest.' : ''}`
    }
    if (variety < 20) {
      return `Human-paced but repetitive content - could be human posting similar content or AI with delays.`
    }
    return `Human-paced timing - we cannot determine if human or AI with intentional delays.`
  }

  if (category === 'suspicious') {
    return `Suspicious timing (${burst_pct?.toFixed(0)}% burst) - could be a bot with delays or a fast human. Insufficient data to classify.`
  }

  return `Unclassified account. Patterns don't fit standard categories.`
}
