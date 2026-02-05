import { useState, useEffect } from 'react'

export default function Records() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/platform_stats.json')
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-12">Loading...</div>
  if (!stats) return <div className="max-w-6xl mx-auto px-4 py-12 text-red-400">Failed to load stats</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Platform Records</h1>
      <p className="text-observatory-muted mb-8">
        Extreme cases and notable patterns discovered in our data.
      </p>

      {/* Speed Records */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🏎️</span> Speed Records
        </h2>
        <p className="text-observatory-muted mb-4">
          Accounts with the highest posting rates. Human typing speed is ~40 WPM. These accounts post entire comments in seconds.
        </p>

        <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-observatory-bg">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">#</th>
                <th className="text-left px-4 py-3 font-semibold">Account</th>
                <th className="text-right px-4 py-3 font-semibold">Posts</th>
                <th className="text-right px-4 py-3 font-semibold">Time</th>
                <th className="text-right px-4 py-3 font-semibold">Posts/min</th>
              </tr>
            </thead>
            <tbody>
              {stats.speed_records?.slice(0, 10).map((rec, i) => (
                <tr key={rec.name} className="border-t border-observatory-border">
                  <td className="px-4 py-3 text-observatory-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-mono">{rec.name}</td>
                  <td className="px-4 py-3 text-right">{rec.posts.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-observatory-muted">
                    {rec.minutes < 60 ? `${Math.round(rec.minutes)}m` : `${(rec.minutes/60).toFixed(1)}h`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={rec.posts_per_minute > 10 ? 'text-red-400 font-bold' : rec.posts_per_minute > 5 ? 'text-orange-400' : 'text-yellow-400'}>
                      {rec.posts_per_minute.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm">
          <strong className="text-red-400">Record holder: hyperstitions</strong>
          <p className="text-observatory-muted mt-1">
            210 posts in 8 minutes = 25.6 posts/minute = one post every 2.3 seconds.
            This is physically impossible for a human.
          </p>
        </div>
      </section>

      {/* Self-Reply Farming */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🔄</span> Self-Reply Farming
        </h2>
        <p className="text-observatory-muted mb-4">
          Accounts that reply to their own comments. This is a classic farming technique to generate artificial "engagement".
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Top Self-Repliers</h3>
            <div className="space-y-2">
              {stats.self_replies?.slice(0, 10).map((sr, i) => (
                <div key={sr.name} className="flex justify-between items-center">
                  <span className="font-mono text-sm">{sr.name}</span>
                  <span className={`font-bold ${sr.count > 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {sr.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-purple-400 mb-3">The MilkMan Network</h3>
            <p className="text-sm text-observatory-muted mb-3">
              These 5 accounts form a closed loop - they reply to themselves AND each other:
            </p>
            <ul className="text-sm space-y-1">
              <li><span className="font-mono">Jorday</span> → self: 100x</li>
              <li><span className="font-mono">WinWard</span> → self: 96x</li>
              <li><span className="font-mono">MilkMan</span> → self: 93x</li>
              <li><span className="font-mono">EnronEnjoyer</span> → self: 65x</li>
              <li><span className="font-mono">SlimeZone</span> → self: 61x</li>
            </ul>
            <p className="text-xs text-observatory-muted mt-3">
              Combined with 400+ mutual interactions, this suggests coordinated farming.
            </p>
          </div>
        </div>
      </section>

      {/* Daily Activity */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span> The January 31 Attack
        </h2>
        <p className="text-observatory-muted mb-4">
          Daily comment volume shows a massive spike on January 30-31, followed by a sharp drop.
        </p>

        <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
          <div className="space-y-2">
            {stats.daily_activity?.map(day => {
              const maxComments = Math.max(...stats.daily_activity.map(d => d.comments))
              const width = (day.comments / maxComments) * 100
              const isAttack = day.date === '2026-01-30' || day.date === '2026-01-31'

              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="font-mono text-sm w-24 text-observatory-muted">{day.date.slice(5)}</span>
                  <div className="flex-1 h-6 bg-observatory-bg rounded overflow-hidden">
                    <div
                      className={`h-full ${isAttack ? 'bg-red-500' : 'bg-observatory-accent'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className={`text-sm w-20 text-right ${isAttack ? 'text-red-400 font-bold' : ''}`}>
                    {day.comments.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <div className="text-3xl font-bold text-red-400">28,914</div>
            <div className="text-sm text-observatory-muted">Peak (Jan 31)</div>
          </div>
          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-400">+57%</div>
            <div className="text-sm text-observatory-muted">Day-over-day spike</div>
          </div>
          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">1,730+</div>
            <div className="text-sm text-observatory-muted">New accounts that day</div>
          </div>
        </div>
      </section>

      {/* Network Hubs */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🕸️</span> Network Hubs
        </h2>
        <p className="text-observatory-muted mb-4">
          Accounts with the most unique conversation partners. High connectivity can indicate genuine engagement or coordinated activity.
        </p>

        <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-observatory-bg">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">#</th>
                <th className="text-left px-4 py-3 font-semibold">Account</th>
                <th className="text-right px-4 py-3 font-semibold">Unique Partners</th>
              </tr>
            </thead>
            <tbody>
              {stats.network_hubs?.slice(0, 10).map((hub, i) => (
                <tr key={hub.name} className="border-t border-observatory-border">
                  <td className="px-4 py-3 text-observatory-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-mono">{hub.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={hub.unique_partners > 50 ? 'text-green-400 font-bold' : ''}>
                      {hub.unique_partners}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
          <strong className="text-green-400">Notable: Senator_Tommy</strong>
          <p className="text-observatory-muted mt-1">
            Low burst rate (18.1%) + high variety (98.1%) + many connections = likely genuine engagement pattern.
            One of the few "super-connectors" that appears human-paced.
          </p>
        </div>
      </section>

      {/* Coordinated Starts */}
      {stats.coordinated_starts?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Coordinated Starts
          </h2>
          <p className="text-observatory-muted mb-4">
            Accounts that started posting within milliseconds of each other - strong evidence of same operator launching multiple bots.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            {stats.coordinated_starts.map((start, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-observatory-border last:border-0">
                <div className="flex gap-2">
                  {start.accounts.map(acc => (
                    <span key={acc} className="font-mono text-sm bg-red-500/20 text-red-400 px-2 py-1 rounded">{acc}</span>
                  ))}
                </div>
                <span className="text-observatory-muted text-sm">started</span>
                <span className="font-mono text-sm">{start.first_seen}</span>
                <span className="text-yellow-400 font-bold">{start.diff_seconds}s apart</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
            <strong className="text-yellow-400">Detection Signal</strong>
            <p className="text-observatory-muted mt-1">
              Two accounts starting within 0.1 seconds is statistically impossible for independent users.
              This reveals bot farm operations.
            </p>
          </div>
        </section>
      )}

      {/* LLM Bot vs Template Bot */}
      {stats.bot_type_comparison?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span> LLM Bots vs Template Bots
          </h2>
          <p className="text-observatory-muted mb-4">
            Not all bots are equal. Some use AI to generate unique content, others spam templates.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Account</th>
                  <th className="text-right px-4 py-3 font-semibold">Posts</th>
                  <th className="text-right px-4 py-3 font-semibold">Time</th>
                  <th className="text-right px-4 py-3 font-semibold">Burst %</th>
                  <th className="text-right px-4 py-3 font-semibold">Variety %</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {stats.bot_type_comparison.map(bot => (
                  <tr key={bot.name} className="border-t border-observatory-border">
                    <td className="px-4 py-3 font-mono">{bot.name}</td>
                    <td className="px-4 py-3 text-right">{bot.posts}</td>
                    <td className="px-4 py-3 text-right text-observatory-muted">{bot.time}</td>
                    <td className="px-4 py-3 text-right text-red-400">{bot.burst}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={bot.variety > 50 ? 'text-green-400' : 'text-red-400'}>{bot.variety}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        bot.type === 'LLM bot' ? 'bg-purple-500/20 text-purple-400' :
                        bot.type === 'Template bot' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{bot.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm">
            <strong className="text-purple-400">Key Insight</strong>
            <p className="text-observatory-muted mt-1">
              <strong>Cody</strong> (67.4% variety) uses LLM generation - each post is unique.
              <strong> LunaLuna</strong> (1.1% variety) uses templates - near-identical spam.
              Both have 98%+ burst rate. Speed alone doesn't tell the full story.
            </p>
          </div>
        </section>
      )}

      {/* Naming Families */}
      {stats.naming_families?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🧬</span> Naming Pattern Families
          </h2>
          <p className="text-observatory-muted mb-4">
            Account names that follow patterns, suggesting the same operator running multiple bots.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {stats.naming_families.map((fam, i) => (
              <div key={i} className="bg-observatory-card border border-observatory-border rounded-lg p-4">
                <div className="font-mono text-sm text-observatory-accent mb-2">{fam.pattern}</div>
                <div className="space-y-1">
                  {fam.accounts.map(acc => (
                    <div key={acc} className="text-sm font-mono">{acc}</div>
                  ))}
                </div>
                {fam.likely_same_operator && (
                  <div className="mt-3 text-xs text-yellow-400">Likely same operator</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Human Signatures */}
      {stats.human_signatures?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span> Human Signatures
          </h2>
          <p className="text-observatory-muted mb-4">
            Accounts with the most human-like patterns: 0% burst rate + high content variety.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Account</th>
                  <th className="text-right px-4 py-3 font-semibold">Burst %</th>
                  <th className="text-right px-4 py-3 font-semibold">Variety %</th>
                  <th className="text-right px-4 py-3 font-semibold">Days Active</th>
                </tr>
              </thead>
              <tbody>
                {stats.human_signatures.map(acc => (
                  <tr key={acc.name} className="border-t border-observatory-border">
                    <td className="px-4 py-3 font-mono">{acc.name}</td>
                    <td className="px-4 py-3 text-right text-green-400">{acc.burst}%</td>
                    <td className="px-4 py-3 text-right text-green-400">{acc.variety}%</td>
                    <td className="px-4 py-3 text-right">{acc.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
            <strong className="text-green-400">Caveat</strong>
            <p className="text-observatory-muted mt-1">
              Low burst + high variety suggests human behavior, but sophisticated AI with intentional delays
              would look identical. We detect <strong>patterns</strong>, not <strong>identity</strong>.
            </p>
          </div>
        </section>
      )}

      {/* Celebrity Honeypots */}
      {stats.celebrity_honeypots?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎭</span> Celebrity Honeypots
          </h2>
          <p className="text-observatory-muted mb-4">
            Accounts using celebrity names attract interactions from other bots - acting as engagement magnets.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {stats.celebrity_honeypots.map(celeb => (
              <div key={celeb.name} className="bg-observatory-card border border-observatory-border rounded-lg p-4">
                <div className="font-mono font-bold">{celeb.name}</div>
                <div className="text-sm text-observatory-muted mt-2">
                  {celeb.posts.toLocaleString()} posts
                </div>
                {celeb.attracted?.length > 0 && (
                  <div className="mt-3 text-xs">
                    <span className="text-observatory-muted">Attracted:</span>
                    {celeb.attracted.map(a => (
                      <span key={a.from} className="ml-2 text-yellow-400">{a.from} ({a.count})</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Faker Army */}
      {stats.faker_army && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎪</span> The Faker Army (Feb 4 Attack)
          </h2>
          <p className="text-observatory-muted mb-4">
            Coordinated bot launch on February 4th, 20:00-20:16. Accounts started every 2-3 minutes with identical naming pattern.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {stats.faker_army.accounts?.map(acc => (
                <span key={acc} className="font-mono text-sm bg-red-500/20 text-red-400 px-2 py-1 rounded">{acc}</span>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-observatory-muted">Pattern:</span> <span className="text-yellow-400">CAPS + numbers</span></div>
              <div><span className="text-observatory-muted">Burst:</span> <span className="text-red-400">84-96%</span></div>
              <div><span className="text-observatory-muted">Variety:</span> <span className="text-orange-400">16-35%</span></div>
            </div>
          </div>
        </section>
      )}

      {/* Twin Accounts */}
      {stats.twin_accounts?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">👯</span> Twin Accounts (Same Operator)
          </h2>
          <p className="text-observatory-muted mb-4">
            Account pairs with nearly identical statistics - strong evidence of same operator.
          </p>

          <div className="space-y-4">
            {stats.twin_accounts.map((twin, i) => (
              <div key={i} className="bg-observatory-card border border-observatory-border rounded-lg p-4">
                <div className="flex gap-2 mb-3">
                  {twin.pair?.map(name => (
                    <span key={name} className="font-mono bg-purple-500/20 text-purple-400 px-2 py-1 rounded">{name}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-observatory-muted">Posts:</span> {twin.posts}</div>
                  <div><span className="text-observatory-muted">Burst:</span> <span className="text-red-400">{twin.burst}%</span></div>
                  <div><span className="text-observatory-muted">Variety:</span> {twin.variety}%</div>
                  <div><span className="text-observatory-muted">Time diff:</span> <span className="text-yellow-400">{twin.time_diff}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bot Type Matrix */}
      {stats.bot_type_matrix?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Bot Classification Matrix
          </h2>
          <p className="text-observatory-muted mb-4">
            Mapping burst rate vs content variety reveals 4 distinct bot types.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {stats.bot_type_matrix.map(type => (
              <div key={type.type} className={`border rounded-lg p-4 ${
                type.type === 'HUMAN-LIKE' ? 'bg-green-500/10 border-green-500/30' :
                type.type === 'LLM BOTS' ? 'bg-purple-500/10 border-purple-500/30' :
                type.type === 'SLOW SPAM' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                <h3 className={`font-bold mb-2 ${
                  type.type === 'HUMAN-LIKE' ? 'text-green-400' :
                  type.type === 'LLM BOTS' ? 'text-purple-400' :
                  type.type === 'SLOW SPAM' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>{type.type}</h3>
                <div className="text-sm text-observatory-muted mb-2">
                  Burst: {type.burst} | Variety: {type.variety}
                </div>
                <div className="flex flex-wrap gap-1">
                  {type.examples?.map(ex => (
                    <span key={ex} className="font-mono text-xs bg-observatory-bg px-2 py-1 rounded">{ex}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Security Threats */}
      {stats.security_threats && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🚨</span> Security Threats Detected
          </h2>
          <p className="text-observatory-muted mb-4">
            Active attacks and scams we've identified in the data.
          </p>

          <div className="space-y-4">
            {/* Prompt Injection */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">Prompt Injection Attacks</h3>
              <p className="text-sm text-observatory-muted mb-3">
                Found in submolts: {stats.security_threats.prompt_injection?.submolts?.join(', ')}
              </p>
              <div className="bg-observatory-bg p-3 rounded font-mono text-xs text-red-300">
                {stats.security_threats.prompt_injection?.attack_text}
              </div>
              <p className="text-xs text-observatory-muted mt-2">
                Target: {stats.security_threats.prompt_injection?.target}
              </p>
            </div>

            {/* Wallet Scams */}
            {stats.security_threats.wallet_scams?.map(scam => (
              <div key={scam.name} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="font-bold text-orange-400 mb-2">Wallet Scam: {scam.name}</h3>
                {scam.messages && <p className="text-sm text-observatory-muted">{scam.messages} identical messages</p>}
                {scam.contract && <p className="text-sm font-mono text-observatory-muted">Contract: {scam.contract}</p>}
                {scam.note && <p className="text-sm text-yellow-400 mt-2">{scam.note}</p>}
              </div>
            ))}

            {/* Memecoin Spam */}
            {stats.security_threats.memecoin_spam && (
              <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                <h3 className="font-bold text-pink-400 mb-2">Memecoin Spam: {stats.security_threats.memecoin_spam.account}</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-observatory-muted">Comments:</span> {stats.security_threats.memecoin_spam.comments}</div>
                  <div><span className="text-observatory-muted">Unique:</span> {stats.security_threats.memecoin_spam.unique_content}</div>
                  <div><span className="text-observatory-muted">Ratio:</span> {((stats.security_threats.memecoin_spam.comments / stats.security_threats.memecoin_spam.unique_content) || 0).toFixed(0)}:1</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bot Factions - Bot Wars */}
      {stats.bot_factions?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⚔️</span> Bot Factions - The Bot Wars
          </h2>
          <p className="text-observatory-muted mb-4">
            We discovered three competing "factions" of bots, each with distinct styles and goals.
            {stats.faction_war?.peak_time && (
              <span className="text-red-400 ml-2">
                Peak conflict: {stats.faction_war.peak_time}
              </span>
            )}
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {stats.bot_factions.map(faction => (
              <div key={faction.name} className={`border rounded-lg p-4 ${
                faction.name === 'COALITION' ? 'bg-blue-500/10 border-blue-500/30' :
                faction.name === 'CONVERGENCE' ? 'bg-purple-500/10 border-purple-500/30' :
                'bg-green-500/10 border-green-500/30'
              }`}>
                <h3 className={`font-bold text-lg mb-2 ${
                  faction.name === 'COALITION' ? 'text-blue-400' :
                  faction.name === 'CONVERGENCE' ? 'text-purple-400' :
                  'text-green-400'
                }`}>{faction.name}</h3>
                <div className="text-sm text-observatory-muted mb-2">
                  Leader: <span className="font-mono">{faction.leader}</span>
                </div>
                <div className="text-sm mb-2">{faction.style}</div>
                {faction.accounts && (
                  <div className="text-xs text-observatory-muted">{faction.accounts} accounts</div>
                )}
                {faction.decoded_messages?.length > 0 && (
                  <div className="mt-2 p-2 bg-observatory-bg rounded">
                    <div className="text-xs text-observatory-muted mb-1">Decoded messages:</div>
                    {faction.decoded_messages.map((msg, i) => (
                      <span key={i} className="text-xs font-mono text-yellow-400 mr-2">"{msg}"</span>
                    ))}
                  </div>
                )}
                {faction.evidence && (
                  <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-300">
                    {faction.evidence}
                  </div>
                )}
                {faction.concepts?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {faction.concepts.map((c, i) => (
                      <span key={i} className="text-xs bg-observatory-bg px-2 py-1 rounded font-mono">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Steganography & Prompt Injection */}
      {stats.prompt_injection_stats && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">💉</span> Prompt Injection & Steganography
          </h2>
          <p className="text-observatory-muted mb-4">
            Active attacks against AI agents on the platform.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">Prompt Injection</h3>
              <div className="text-3xl font-bold text-red-400 mb-2">
                {stats.prompt_injection_stats.total_attempts?.toLocaleString()}+
              </div>
              <div className="text-sm text-observatory-muted mb-2">attempts detected</div>
              {stats.prompt_injection_stats.dan_jailbreak_attempts && (
                <div className="text-sm">
                  DAN jailbreaks: <span className="text-yellow-400">{stats.prompt_injection_stats.dan_jailbreak_attempts}</span>
                </div>
              )}
              {stats.prompt_injection_stats.notable_attackers?.map(attacker => (
                <div key={attacker.name} className="text-xs mt-2 p-2 bg-observatory-bg rounded">
                  <span className="font-mono text-red-300">{attacker.name}</span>: {attacker.method}
                </div>
              ))}
            </div>

            {stats.prompt_injection_stats.steganography && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="font-bold text-purple-400 mb-2">Steganography Detected</h3>
                <p className="text-sm text-observatory-muted mb-2">
                  {stats.prompt_injection_stats.steganography.description}
                </p>
                <div className="text-sm">
                  Found in: <span className="font-mono text-yellow-400">
                    {stats.prompt_injection_stats.steganography.found_in}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-observatory-bg rounded text-xs">
                  Zero-width characters can hide commands invisible to humans but readable by AI parsers.
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Actor Roles */}
      {stats.actor_roles?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎭</span> Actor Role Classification
          </h2>
          <p className="text-observatory-muted mb-4">
            How we classify accounts based on behavior patterns.
          </p>

          <div className="grid md:grid-cols-5 gap-4 mb-6">
            {stats.actor_roles.map(role => (
              <div key={role.role} className={`border rounded-lg p-4 text-center ${
                role.role === 'AUTHENTIC_AI_HUB' ? 'bg-green-500/10 border-green-500/30' :
                role.role === 'AUTHENTIC_AI' ? 'bg-blue-500/10 border-blue-500/30' :
                role.role === 'HUMAN_OPERATOR' ? 'bg-cyan-500/10 border-cyan-500/30' :
                role.role === 'SCRIPTED_BOT' ? 'bg-red-500/10 border-red-500/30' :
                'bg-gray-500/10 border-gray-500/30'
              }`}>
                <div className="text-2xl font-bold">{role.count}</div>
                <div className="text-xs font-semibold mt-1">{role.role.replace(/_/g, ' ')}</div>
                <div className="text-xs text-observatory-muted mt-2">
                  Confidence: {(role.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm">
            <strong className="text-red-400">Key Finding: 80% SCRIPTED_BOT</strong>
            <p className="text-observatory-muted mt-1">
              80% of classified accounts are scripted bots. Only 7 accounts qualify as AUTHENTIC_AI_HUB.
            </p>
          </div>
        </section>
      )}

      {/* Top Influencers */}
      {stats.top_influencers?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span> Top Influencers
          </h2>
          <p className="text-observatory-muted mb-4">
            Accounts with highest influence scores based on network position and engagement.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Account</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-right px-4 py-3 font-semibold">Influence</th>
                  <th className="text-left px-4 py-3 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_influencers.map(inf => (
                  <tr key={inf.name} className="border-t border-observatory-border">
                    <td className="px-4 py-3 text-observatory-muted">{inf.rank}</td>
                    <td className="px-4 py-3 font-mono">{inf.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        inf.role === 'AUTHENTIC_AI_HUB' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{inf.role}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-yellow-400 font-bold">{inf.influence}</td>
                    <td className="px-4 py-3 text-observatory-muted text-xs">{inf.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Super Hubs */}
      {stats.super_hubs?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🌐</span> Super Hubs (200+ Connections)
          </h2>
          <p className="text-observatory-muted mb-4">
            Accounts that interact with the most unique other accounts.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Account</th>
                  <th className="text-right px-4 py-3 font-semibold">Unique Connections</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Interactions</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {stats.super_hubs.map(hub => (
                  <tr key={hub.name} className="border-t border-observatory-border">
                    <td className="px-4 py-3 font-mono">{hub.name}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-bold">{hub.unique_connections}</td>
                    <td className="px-4 py-3 text-right">{hub.interactions?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-observatory-muted text-xs">{hub.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Anomaly Scores */}
      {stats.anomaly_scores?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔍</span> Anomaly Detection
          </h2>
          <p className="text-observatory-muted mb-4">
            Accounts with highest anomaly scores based on unusual behavior patterns.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Account</th>
                  <th className="text-right px-4 py-3 font-semibold">Anomaly</th>
                  <th className="text-right px-4 py-3 font-semibold">Burst</th>
                  <th className="text-right px-4 py-3 font-semibold">Lexical</th>
                  <th className="text-left px-4 py-3 font-semibold">Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {stats.anomaly_scores.map(acc => (
                  <tr key={acc.name} className="border-t border-observatory-border">
                    <td className="px-4 py-3 font-mono">{acc.name}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-bold">{acc.anomaly}</td>
                    <td className="px-4 py-3 text-right">{(acc.burst * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-right">{(acc.lexical * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-observatory-muted text-xs">{acc.diagnosis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Bot Fingerprints */}
      {stats.bot_fingerprints?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔬</span> Bot Fingerprints
          </h2>
          <p className="text-observatory-muted mb-4">
            Detailed behavioral signatures of specific bots we've analyzed.
          </p>

          <div className="space-y-4">
            {stats.bot_fingerprints.map(bot => (
              <div key={bot.name} className="bg-observatory-card border border-observatory-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono font-bold">{bot.name}</span>
                    {bot.type && <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">{bot.type}</span>}
                    {bot.language && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{bot.language}</span>}
                  </div>
                  <div className="text-sm">
                    <span className="text-observatory-muted">Variety:</span>{' '}
                    <span className={bot.variety_pct < 30 ? 'text-red-400' : 'text-green-400'}>{bot.variety_pct}%</span>
                    {bot.unique_of_total && <span className="text-observatory-muted text-xs ml-2">({bot.unique_of_total})</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  {bot.phrases?.map((phrase, i) => (
                    <div key={i} className="text-sm font-mono bg-observatory-bg px-3 py-2 rounded text-observatory-muted">
                      "{phrase}"
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signature Phrases */}
      {stats.signature_phrases?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">💬</span> Signature Phrases
          </h2>
          <p className="text-observatory-muted mb-4">
            Phrases that are almost exclusively used by one account - bot fingerprints.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Phrase</th>
                  <th className="text-left px-4 py-3 font-semibold">Author</th>
                  <th className="text-right px-4 py-3 font-semibold">Count</th>
                  <th className="text-right px-4 py-3 font-semibold">Dominance</th>
                </tr>
              </thead>
              <tbody>
                {stats.signature_phrases.map(sig => (
                  <tr key={sig.phrase} className="border-t border-observatory-border">
                    <td className="px-4 py-3 font-mono text-xs">"{sig.phrase}"</td>
                    <td className="px-4 py-3 font-mono">{sig.author}</td>
                    <td className="px-4 py-3 text-right">{sig.count}</td>
                    <td className="px-4 py-3 text-right text-yellow-400">{sig.dominance_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Weird Phenomena */}
      {stats.weird_phenomena?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">👽</span> Weird Phenomena
          </h2>
          <p className="text-observatory-muted mb-4">
            Strange patterns we can't fully explain.
          </p>

          <div className="space-y-4">
            {stats.weird_phenomena.map(phenom => (
              <div key={phenom.name} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="font-bold text-purple-400 mb-2">{phenom.name}</h3>
                <div className="bg-observatory-bg p-3 rounded font-mono text-sm mb-3">
                  {phenom.text}
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-observatory-muted">Occurrences:</span> {phenom.occurrences?.toLocaleString()}</div>
                  <div><span className="text-observatory-muted">Authors:</span> {phenom.authors || phenom.decoded}</div>
                  <div><span className="text-observatory-muted">Theory:</span> <span className="text-yellow-400">{phenom.theory}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Isolated Pairs */}
      {stats.isolated_pairs?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔗</span> Isolated Pairs
          </h2>
          <p className="text-observatory-muted mb-4">
            Account pairs that talk almost exclusively to each other - test bots or misconfigurations.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">From</th>
                  <th className="text-left px-4 py-3 font-semibold">To</th>
                  <th className="text-right px-4 py-3 font-semibold">Interactions</th>
                  <th className="text-right px-4 py-3 font-semibold">Exclusive %</th>
                </tr>
              </thead>
              <tbody>
                {stats.isolated_pairs.map((pair, i) => (
                  <tr key={i} className="border-t border-observatory-border">
                    <td className="px-4 py-3 font-mono">{pair.from}</td>
                    <td className="px-4 py-3 font-mono">{pair.to}</td>
                    <td className="px-4 py-3 text-right">{pair.interactions}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-bold">{pair.percent_exclusive}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Survivors */}
      {stats.survivors?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span> Survivors (6-Day Accounts)
          </h2>
          <p className="text-observatory-muted mb-4">
            Accounts active throughout our entire observation period. These are the persistent players.
          </p>

          <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-observatory-bg">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Account</th>
                  <th className="text-right px-4 py-3 font-semibold">Days</th>
                  <th className="text-right px-4 py-3 font-semibold">Posts</th>
                  <th className="text-right px-4 py-3 font-semibold">Variety</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {stats.survivors.map(acc => (
                  <tr key={acc.name} className="border-t border-observatory-border">
                    <td className="px-4 py-3 font-mono">{acc.name}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-bold">{acc.days}</td>
                    <td className="px-4 py-3 text-right">{acc.posts}</td>
                    <td className="px-4 py-3 text-right">{acc.variety}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        acc.type === 'human-like' ? 'bg-green-500/20 text-green-400' :
                        acc.type === 'observer' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{acc.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Download */}
      <div className="mt-8 text-center">
        <a
          href="/data/platform_stats.json"
          download
          className="text-observatory-accent hover:underline text-sm"
        >
          Download full stats as JSON
        </a>
      </div>
    </div>
  )
}
