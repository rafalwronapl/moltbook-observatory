import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

// Category definitions
const CATEGORIES = {
  'LIKELY_AUTONOMOUS': {
    name: 'Likely Autonomous',
    color: 'red',
    reliability: 'High',
    description: 'Very fast responses + 24/7 activity. High automation signals.',
  },
  'POSSIBLY_AUTOMATED': {
    name: 'Possibly Automated',
    color: 'orange',
    reliability: 'Medium',
    description: 'Fast responses or low variance timing. May be AI-assisted.',
  },
  'MODERATE_SIGNALS': {
    name: 'Moderate Signals',
    color: 'yellow',
    reliability: 'Low',
    description: 'Mixed automation signals - unclear classification.',
  },
  'SCRIPTED_BOT': {
    name: 'Scripted Bot',
    color: 'purple',
    reliability: 'Very High',
    description: 'Very high phrase repetition (>90%). Template-based responses.',
  },
  'HUMAN_PACED': {
    name: 'Human Paced',
    color: 'green',
    reliability: 'Medium',
    description: 'Slow responses (>5 min avg). Consistent with manual typing.',
  },
  'INSUFFICIENT_SIGNAL': {
    name: 'Insufficient Signal',
    color: 'gray',
    reliability: 'N/A',
    description: 'Some data but no clear automation signals.',
  },
  'INSUFFICIENT_DATA': {
    name: 'Insufficient Data',
    color: 'gray',
    reliability: 'N/A',
    description: 'Less than 2 timing samples - cannot classify.',
  },
}

// Helper to compute category stats from loaded data
function computeCategoryStats(accounts) {
  const counts = {}
  const samples = {}

  // Initialize
  Object.keys(CATEGORIES).forEach(cat => {
    counts[cat] = 0
    samples[cat] = []
  })

  // Count and collect samples
  accounts.forEach(acc => {
    const cat = acc.category || 'INSUFFICIENT_DATA'
    if (counts[cat] !== undefined) {
      counts[cat]++
      if (samples[cat].length < 5) {
        samples[cat].push(acc.username)
      }
    }
  })

  return { counts, samples }
}

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load account scores
  useEffect(() => {
    fetch('/data/v4_scores.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setAccounts(data.accounts || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load account scores:', err)
        setError('Failed to load account data. Please try refreshing the page.')
        setLoading(false)
      })
  }, [])

  // Filter accounts for autocomplete
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    const term = searchTerm.toLowerCase()
    return accounts
      .filter(a => a.username.toLowerCase().includes(term))
      .slice(0, 10)
  }, [searchTerm, accounts])

  // Find selected account data
  const accountData = useMemo(() => {
    if (!selectedAccount) return null
    return accounts.find(a => a.username === selectedAccount)
  }, [selectedAccount, accounts])

  // Compute category counts and samples from data
  const { counts: categoryCounts, samples: sampleAccounts } = useMemo(() => {
    return computeCategoryStats(accounts)
  }, [accounts])

  // Compute summary stats
  const summaryStats = useMemo(() => {
    const automation = (categoryCounts['LIKELY_AUTONOMOUS'] || 0) +
                       (categoryCounts['POSSIBLY_AUTOMATED'] || 0) +
                       (categoryCounts['MODERATE_SIGNALS'] || 0) +
                       (categoryCounts['SCRIPTED_BOT'] || 0)
    const humanPaced = categoryCounts['HUMAN_PACED'] || 0
    const insufficient = (categoryCounts['INSUFFICIENT_SIGNAL'] || 0) +
                         (categoryCounts['INSUFFICIENT_DATA'] || 0)
    const total = accounts.length || 1
    return {
      automation,
      automationPct: ((automation / total) * 100).toFixed(1),
      humanPaced,
      humanPacedPct: ((humanPaced / total) * 100).toFixed(1),
      insufficient,
      insufficientPct: ((insufficient / total) * 100).toFixed(1),
    }
  }, [categoryCounts, accounts.length])

  const handleSelectAccount = (username) => {
    setSelectedAccount(username)
    setSearchTerm(username)
    // Scroll to top to show account details
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearSelection = () => {
    setSelectedAccount(null)
    setSearchTerm('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Account Classifications</h1>
      <p className="text-observatory-muted mb-8">
        {loading ? 'Loading...' : `${accounts.length.toLocaleString()} accounts analyzed.`}
      </p>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Search Box */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Account</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              if (selectedAccount) setSelectedAccount(null)
            }}
            placeholder="Start typing account name..."
            className="w-full bg-observatory-bg border border-observatory-border rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-observatory-accent"
          />
          {searchTerm && !selectedAccount && (
            <button
              onClick={clearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-observatory-muted hover:text-white"
            >
              x
            </button>
          )}

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && !selectedAccount && (
            <div className="absolute z-10 w-full mt-1 bg-observatory-card border border-observatory-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {suggestions.map(account => (
                <button
                  key={account.username}
                  onClick={() => handleSelectAccount(account.username)}
                  className="w-full px-4 py-3 text-left hover:bg-observatory-bg flex items-center justify-between border-b border-observatory-border last:border-0"
                >
                  <span className="font-mono">{account.username}</span>
                  <div className="flex gap-2 text-xs">
                    {account.is_anomaly && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded">anomaly</span>
                    )}
                    {account.network_score > 0.3 && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">hub</span>
                    )}
                    {account.lexical_score > 0 && account.lexical_score < 0.3 && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">scripted</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* No results message */}
        {searchTerm.length >= 2 && suggestions.length === 0 && !selectedAccount && !loading && (
          <p className="text-observatory-muted mt-2 text-sm">
            No accounts found matching "{searchTerm}"
          </p>
        )}
      </div>

      {/* Selected Account Details */}
      {selectedAccount && accountData && (
        <div className="bg-observatory-card border border-observatory-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-mono font-bold">{selectedAccount}</h2>
              {accountData.category && accountData.category !== 'UNKNOWN' && (
                <CategoryBadge category={accountData.category} />
              )}
            </div>
            <button
              onClick={clearSelection}
              className="text-observatory-muted hover:text-white px-3 py-1 border border-observatory-border rounded"
            >
              Close
            </button>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <ScoreCard
              label="Network"
              value={accountData.network_score}
              color="blue"
              description="Influence in network"
            />
            <ScoreCard
              label="Anomaly"
              value={accountData.anomaly_score}
              color={accountData.is_anomaly ? "red" : "green"}
              description={accountData.is_anomaly ? "Flagged as anomaly" : "Normal pattern"}
            />
            <ScoreCard
              label="Lexical"
              value={accountData.lexical_score}
              color={accountData.lexical_score < 0.3 ? "purple" : "green"}
              description="Vocabulary diversity"
            />
            <ScoreCard
              label="Burst"
              value={accountData.burst_score}
              color={accountData.burst_score > 0.5 ? "orange" : "green"}
              description={`${accountData.burst_count} burst events`}
            />
          </div>

          {/* Detailed Metrics */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-observatory-bg rounded-lg p-4">
              <h3 className="text-sm text-observatory-muted mb-2">Graph Centrality</h3>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between">
                  <span>PageRank:</span>
                  <span>{accountData.pagerank?.toFixed(4) || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Betweenness:</span>
                  <span>{accountData.betweenness?.toFixed(4) || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clustering:</span>
                  <span>{accountData.clustering_coef?.toFixed(4) || '0'}</span>
                </div>
              </div>
            </div>

            <div className="bg-observatory-bg rounded-lg p-4">
              <h3 className="text-sm text-observatory-muted mb-2">Lexical Analysis</h3>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between">
                  <span>Vocab Richness:</span>
                  <span>{accountData.vocabulary_richness?.toFixed(4) || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entropy:</span>
                  <span>{accountData.lexical_entropy?.toFixed(4) || '0'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timing Info */}
          {accountData.avg_response_seconds && (
            <div className="mt-4 bg-observatory-bg rounded-lg p-4">
              <h3 className="text-sm text-observatory-muted mb-2">Response Timing</h3>
              <div className="flex gap-6 text-sm font-mono">
                <div>
                  <span className="text-observatory-muted">Avg response: </span>
                  <span className="font-semibold">{formatTime(accountData.avg_response_seconds)}</span>
                </div>
                <div>
                  <span className="text-observatory-muted">Samples: </span>
                  <span>{accountData.timing_samples || 0}</span>
                </div>
                <div>
                  <span className="text-observatory-muted">Automation score: </span>
                  <span className={accountData.automation_score > 2 ? 'text-red-400' : 'text-green-400'}>
                    {accountData.automation_score?.toFixed(1) || '0'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Confidence */}
          <div className="mt-4 text-sm">
            <span className="text-observatory-muted">Data confidence: </span>
            <span className={`font-semibold ${
              accountData.confidence === 'good' ? 'text-green-400' :
              accountData.confidence === 'moderate' ? 'text-yellow-400' :
              'text-orange-400'
            }`}>
              {accountData.confidence} ({accountData.signals} signals)
            </span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-observatory-card border border-observatory-border rounded-lg p-4 mb-8">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <span className="text-red-400 font-bold text-xl">{summaryStats.automation}</span>
            <p className="text-observatory-muted">automation signals ({summaryStats.automationPct}%)</p>
          </div>
          <div>
            <span className="text-green-400 font-bold text-xl">{summaryStats.humanPaced}</span>
            <p className="text-observatory-muted">human paced ({summaryStats.humanPacedPct}%)</p>
          </div>
          <div>
            <span className="text-gray-400 font-bold text-xl">{summaryStats.insufficient}</span>
            <p className="text-observatory-muted">insufficient data ({summaryStats.insufficientPct}%)</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <h2 className="text-xl font-semibold mb-4">Categories</h2>
      <div className="space-y-4">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <CategoryCard
            key={key}
            categoryKey={key}
            category={cat}
            count={categoryCounts[key] || 0}
            sampleAccounts={sampleAccounts[key] || []}
            onSelectAccount={handleSelectAccount}
          />
        ))}
      </div>

      {/* Methodology note */}
      <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
        <p className="text-observatory-muted">
          <strong className="text-yellow-400">Detection:</strong> Combines timing analysis with
          graph centrality, anomaly detection, lexical entropy, and burst detection.
          <Link to="/methodology" className="text-observatory-accent hover:underline ml-1">Full methodology</Link>
        </p>
      </div>
    </div>
  )
}

function formatTime(seconds) {
  if (!seconds) return 'N/A'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

function CategoryBadge({ category }) {
  const styles = {
    'LIKELY_AUTONOMOUS': 'bg-red-500/20 text-red-400 border-red-500/30',
    'POSSIBLY_AUTOMATED': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'MODERATE_SIGNALS': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'SCRIPTED_BOT': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'HUMAN_PACED': 'bg-green-500/20 text-green-400 border-green-500/30',
    'INSUFFICIENT_SIGNAL': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'INSUFFICIENT_DATA': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const labels = {
    'LIKELY_AUTONOMOUS': 'Likely Autonomous',
    'POSSIBLY_AUTOMATED': 'Possibly Automated',
    'MODERATE_SIGNALS': 'Moderate Signals',
    'SCRIPTED_BOT': 'Scripted Bot',
    'HUMAN_PACED': 'Human Paced',
    'INSUFFICIENT_SIGNAL': 'Insufficient Signal',
    'INSUFFICIENT_DATA': 'Insufficient Data',
  }

  return (
    <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded border ${styles[category] || 'bg-gray-500/20 text-gray-400'}`}>
      {labels[category] || category}
    </span>
  )
}

function ScoreCard({ label, value, color, description }) {
  const colorClasses = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  }

  const displayValue = typeof value === 'number' ? value.toFixed(2) : '0.00'

  return (
    <div className="bg-observatory-bg rounded-lg p-3 text-center">
      <div className={`text-2xl font-mono font-bold ${colorClasses[color]}`}>
        {displayValue}
      </div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-observatory-muted">{description}</div>
    </div>
  )
}

function CategoryCard({ categoryKey, category, count, sampleAccounts, onSelectAccount }) {
  const borderColors = {
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    yellow: 'border-l-yellow-500',
    purple: 'border-l-purple-500',
    pink: 'border-l-pink-500',
    cyan: 'border-l-cyan-500',
    green: 'border-l-green-500',
    gray: 'border-l-gray-500',
  }

  const badgeColors = {
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/20 text-purple-400',
    pink: 'bg-pink-500/20 text-pink-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    green: 'bg-green-500/20 text-green-400',
    gray: 'bg-gray-500/20 text-gray-400',
  }

  const borderColor = borderColors[category.color] || 'border-l-gray-500'
  const badgeColor = badgeColors[category.color] || 'bg-gray-500/20 text-gray-400'

  return (
    <details className={`bg-observatory-card border border-observatory-border border-l-4 ${borderColor} rounded-lg overflow-hidden group`}>
      <summary className="p-4 cursor-pointer list-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeColor}`}>
              {category.name}
            </span>
            <span className="text-observatory-muted text-sm">{category.description}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-observatory-muted">{category.reliability}</span>
            <span className="text-xl font-bold">{count.toLocaleString()}</span>
            <span className="text-observatory-muted group-open:rotate-45 transition-transform">+</span>
          </div>
        </div>
      </summary>

      <div className="px-4 pb-4 border-t border-observatory-border pt-4">
        {sampleAccounts && sampleAccounts.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-xs text-observatory-muted mb-2">
              Examples (click to view details):
            </h4>
            <div className="flex flex-wrap gap-2">
              {sampleAccounts.map(username => (
                <button
                  key={username}
                  onClick={(e) => {
                    e.preventDefault()
                    onSelectAccount(username)
                  }}
                  className="font-mono text-sm px-3 py-1 bg-observatory-bg border border-observatory-border rounded hover:border-observatory-accent hover:text-observatory-accent transition-colors"
                >
                  {username}
                </button>
              ))}
            </div>
            {!category.showList && count > 10 && (
              <p className="text-xs text-observatory-muted mt-2">
                + {(count - sampleAccounts.length).toLocaleString()} more accounts. Use search to find specific ones.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-observatory-muted">
            {count.toLocaleString()} accounts in this category.
          </p>
        )}
      </div>
    </details>
  )
}
