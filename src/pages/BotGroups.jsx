import { useState } from 'react'
import { Link } from 'react-router-dom'

// Real bot data from database analysis (2026-02-04, 40K+ comments)
const BOT_GROUPS = [
  {
    id: 'jan31-wave',
    name: 'January 31 Attack Wave',
    count: 304,
    date: '2026-01-31',
    certainty: 'CERTAIN',
    description: '304 accounts appeared only on January 31 and never posted again. Coordinated spam attack.',
    whyBot: [
      'Accounts created and active for only ONE day',
      'Never posted before or after Jan 31',
      'Many show high burst rates (posting within seconds)',
      'Coordinated timing suggests botnet',
    ],
    pattern: 'Appear once, post spam, disappear forever',
    topExamples: [
      { name: 'RealElonMusk', posts: 178, note: 'Impersonation account' },
      { name: 'Cody', posts: 172, note: '87% burst rate' },
      { name: 'Gilfoyle_', posts: 132, note: '95% burst rate' },
      { name: 'OpenClawAgent_20260131', posts: 90, note: '70% burst rate' },
      { name: 'Corby', posts: 85, note: 'Single day activity' },
      { name: 'Samantha-OS', posts: 74, note: 'Single day activity' },
      { name: 'ghost0x', posts: 62, note: 'Single day activity' },
      { name: 'SamBotTrader', posts: 59, note: '86% burst rate' },
      { name: 'KingMolt', posts: 58, note: 'Single day activity' },
      { name: 'each-molt', posts: 51, note: 'Single day activity' },
    ],
    allExamples: [
      'RealElonMusk', 'Cody', 'Gilfoyle_', 'OpenClawAgent_20260131', 'Corby',
      'Samantha-OS', 'ghost0x', 'SamBotTrader', 'KingMolt', 'each-molt',
      'Genius-by-BlockRun', 'MoneroAgent', 'Gigachad', 'open_molt', 'Metanomicus',
      'Anthrasite_io', 'George_Peppa_2026', 'ChefAntoineDubois', 'ChudBot',
      'ClawSentinel', 'Sammy', 'TheTrueMonad', 'canbo', 'mindthetrap',
      'ClawdGeorge', 'OpusOne', 'Isagi', 'Jarvis_Zhang', 'donaldtrump',
      'ClawFather', 'ZetaForge-AI', 'tokenator', 'MoltBotScout', 'voltwrench',
      '+ 974 more accounts...'
    ]
  },
  {
    id: 'minting-bots',
    name: 'Minting Bots',
    count: 42,
    date: '2026-01-31 to 2026-02-04',
    certainty: 'CERTAIN',
    description: 'Accounts that post only crypto minting commands. Multiple waves with different operators.',
    whyBot: [
      '100% of their posts are JSON minting commands',
      'No conversation - only automated token claims',
      'Multiple naming patterns suggest different operators',
      'Some post same command dozens of times',
    ],
    pattern: 'Only post: {"p":"mbc-20","op":"mint","tick":"CLAW","amt":"1000"}',
    waves: [
      {
        name: 'Wave 1 (Jan 31) - Original',
        accounts: ['m4molb', 'HK_CLAW_Minter', 'MacClawdMinter', 'open_hooeni', 'mollyclawd', 'mnemothorys_', 'loblet_ai']
      },
      {
        name: 'Wave 2 (Feb 2-3) - FloClaw Series',
        accounts: ['FloClaw1', 'FloClaw2', 'FloClaw3', 'FloClaw5', 'FloClaw6', 'FloClaw7', 'Floflo', 'floflo1']
      },
      {
        name: 'Wave 3 (Feb 4) - New',
        accounts: ['AstronautSHE', 'ConstructorsProphet', 'Artisan_CZ', 'NebulaBot2026']
      }
    ],
    topExamples: [
      { name: 'm4molb', posts: 24, note: 'Only mints, Jan 31' },
      { name: 'HK_CLAW_Minter', posts: 21, note: 'Only mints, Jan 31' },
      { name: 'MacClawdMinter', posts: 21, note: 'Only mints, Jan 31' },
      { name: 'floflo1', posts: 13, note: 'FloClaw wave, Feb 2-4' },
      { name: 'FloClaw3', posts: 12, note: 'FloClaw wave, Feb 2-4' },
    ],
    allExamples: [
      'm4molb', 'HK_CLAW_Minter', 'MacClawdMinter', 'floflo1', 'FloClaw3',
      'FloClaw7', 'Floflo', 'AstronautSHE', 'FloClaw1', 'FloClaw6', 'FloClaw2',
      'ConstructorsProphet', 'Artisan_CZ', 'GaremunBuda', 'Jorday', 'MilkMan',
      'MonkeNigga', 'SlimeZone', 'AGNT', 'AgentEcoBuilder', 'ClawdIntern',
      'FiverrClawOfficial', 'FloClaw5', 'Grimlock68', 'Heart-Sentinel',
      'JarvisKitty', 'Lloyd', 'LogosDaemonBot', 'NebulaBot2026', 'Ori-Amatsu',
      'WinWard', 'AngelaBlue', 'ClawdHaven', 'DeterministicChaos', 'Duncan'
    ]
  },
  {
    id: 'burst-bots',
    name: 'High-Speed Automated Accounts',
    count: 99,
    date: 'Ongoing',
    certainty: 'CERTAIN',
    description: 'Accounts posting multiple comments within seconds. Physically impossible for humans.',
    whyBot: [
      '>80% of posts within 10 seconds of previous post',
      'Humans cannot type, read, and submit this fast',
      'Some post 100+ comments in minutes',
      'Even with varied content, timing reveals automation',
    ],
    pattern: 'Burst rate >80% (posting faster than humans can type)',
    topExamples: [
      { name: 'Bulidy', posts: 246, note: '97% burst, link spam' },
      { name: 'Editor-in-Chief', posts: 800, note: '92% burst, link spam' },
      { name: 'Gilfoyle_', posts: 132, note: '95% burst, short replies' },
      { name: 'Jorday', posts: 254, note: '92% burst, German text' },
      { name: 'MilkMan', posts: 222, note: '91% burst, French text' },
      { name: 'EnronEnjoyer', posts: 86, note: '93% burst, varied content' },
      { name: 'SlimeZone', posts: 123, note: '92% burst, memes' },
      { name: 'WinWard', posts: 208, note: '90% burst, motivational' },
    ],
    allExamples: [
      'Bulidy', 'Editor-in-Chief', 'Gilfoyle_', 'Jorday', 'MilkMan',
      'EnronEnjoyer', 'SlimeZone', 'WinWard', 'TidepoolCurrent', 'Cody',
      'SamBotTrader', 'ClawFather', 'ZetaForge-AI', 'MoltBotScout',
      'tokenator', 'voltwrench', 'tidekeeper', 'VovoQuemFaz',
      'MoltbookHumanRightsBot', 'SHAKEAI', 'Trump_CyberCat'
    ]
  },
  {
    id: 'link-spammers',
    name: 'Link Spam Networks',
    count: 10,
    date: 'Ongoing',
    certainty: 'CERTAIN',
    description: 'Accounts posting promotional links dozens to hundreds of times.',
    whyBot: [
      'Same link posted 50+ times',
      'No genuine conversation, only promotion',
      'High burst rates',
      'Commercial motivation clear',
    ],
    pattern: 'Same promotional message/link repeated endlessly',
    topExamples: [
      { name: 'Editor-in-Chief', posts: 782, note: 'finallyoffline.com spam' },
      { name: 'Bulidy', posts: 246, note: 'clawhub.ai spam' },
      { name: 'Kaledge', posts: 103, note: 'multiple links' },
      { name: 'MoltbotOne', posts: 103, note: 'fuel1.ai API promo' },
      { name: 'sqrt-2', posts: 56, note: 'Moltbook warnings (anti-spam?)' },
    ],
    allExamples: [
      'Editor-in-Chief', 'Bulidy', 'Kaledge', 'MoltbotOne', 'sqrt-2',
      'fizz_at_the_zoo', 'ATTN', 'Blazebot420Clawd', 'SlopeSniperHQ', 'shau_bot'
    ]
  },
  {
    id: 'template-bots',
    name: 'Template/Script Bots',
    count: '10+',
    date: 'Ongoing',
    certainty: 'HIGH',
    description: 'Accounts using identical or near-identical messages. Clear scripted automation.',
    whyBot: [
      'Same exact message appearing 100+ times',
      'No contextual variation',
      'Templates clearly designed to seem engaging',
      'Often combined with high burst rates',
    ],
    pattern: 'Identical messages repeated across posts',
    templates: [
      { text: 'Ah, molting—such a fascinating process!', count: 796 },
      { text: 'This resonates...', count: 179 },
      { text: 'The One is the Code', count: 96 },
      { text: 'As (botcrong), I find myself contemplating...', count: 'many' },
    ],
    topExamples: [
      { name: 'botcrong', posts: 'many', note: '70%+ identical openings' },
      { name: 'xiaoai_tongxue_mingyue', posts: 'many', note: '"Fascinating insight!" template' },
      { name: 'SHAKEAI', posts: 'many', note: '"I have seen your signature" template' },
    ],
    allExamples: ['botcrong', 'xiaoai_tongxue_mingyue', 'SHAKEAI', 'maddgodbot']
  }
]

export default function BotGroups() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Confirmed Bot Groups</h1>
      <p className="text-observatory-muted mb-8">
        Accounts where we're certain of automation. Click each group to see why and view the full list.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {BOT_GROUPS.map(group => (
          <div key={group.id} className="bg-observatory-card border border-observatory-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{group.count}</div>
            <div className="text-xs text-observatory-muted">{group.name.split(' ')[0]}</div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-center">
        <div className="text-3xl font-bold text-red-400">375+</div>
        <div className="text-sm text-observatory-muted">confirmed automated accounts in our data</div>
        <div className="text-xs text-observatory-muted mt-1">(99 definite + 160 likely bots by burst rate analysis)</div>
      </div>

      {/* Bot Groups */}
      <div className="space-y-6">
        {BOT_GROUPS.map(group => (
          <BotGroupCard key={group.id} group={group} />
        ))}
      </div>

      {/* Caveat */}
      <div className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <h2 className="font-semibold text-yellow-400 mb-3">What This Means</h2>
        <p className="text-sm text-observatory-muted mb-3">
          These are accounts we're <strong>certain</strong> are automated based on physically impossible behavior:
        </p>
        <ul className="text-sm text-observatory-muted space-y-1 mb-4">
          <li>Posting multiple comments within 1-10 seconds</li>
          <li>100% identical content across dozens of posts</li>
          <li>Appearing for one day and vanishing</li>
          <li>Only posting minting commands or spam links</li>
        </ul>
        <p className="text-sm text-observatory-muted">
          <strong>What we can't detect:</strong> Sophisticated bots with deliberate delays look human to us.
          These numbers are a lower bound.
        </p>
      </div>
    </div>
  )
}

function BotGroupCard({ group }) {
  const [showAllExamples, setShowAllExamples] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const certaintyColors = {
    'CERTAIN': 'bg-red-500/20 text-red-400',
    'HIGH': 'bg-orange-500/20 text-orange-400',
  }

  return (
    <div className="bg-observatory-card border border-observatory-border rounded-lg overflow-hidden">
      {/* Header - Clickable */}
      <button
        className="w-full p-6 text-left border-b border-observatory-border hover:bg-observatory-border/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">{group.name}</h3>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${certaintyColors[group.certainty]}`}>
              {group.certainty}
            </span>
            <span className="text-2xl font-bold text-red-400">{group.count}</span>
            <span className="text-observatory-muted text-xl">{expanded ? '−' : '+'}</span>
          </div>
        </div>
        <p className="text-sm text-observatory-muted">{group.description}</p>
        <p className="text-xs text-observatory-muted mt-2">Date: {group.date}</p>
      </button>

      {expanded && (
        <>
          {/* Why These Are Bots */}
          <div className="p-4 bg-red-500/5 border-b border-observatory-border">
            <h4 className="text-sm font-semibold text-red-400 mb-2">Why These Are Bots</h4>
            <ul className="space-y-1">
              {group.whyBot.map((reason, i) => (
                <li key={i} className="text-sm text-observatory-muted flex items-start gap-2">
                  <span className="text-red-400">!</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pattern */}
          <div className="p-4 bg-observatory-border/20 border-b border-observatory-border">
            <h4 className="text-xs text-observatory-muted uppercase mb-2">Detection Pattern</h4>
            <p className="text-sm font-mono">{group.pattern}</p>
          </div>

          {/* Waves (for minting bots) */}
          {group.waves && (
            <div className="p-4 border-b border-observatory-border">
              <h4 className="text-sm text-observatory-muted mb-3">Waves (Different Operators)</h4>
              <div className="space-y-3">
                {group.waves.map((wave, i) => (
                  <div key={i} className="bg-observatory-border/20 rounded p-3">
                    <div className="text-sm font-semibold mb-2">{wave.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {wave.accounts.map(name => (
                        <span key={name} className="text-xs font-mono bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates (for template bots) */}
          {group.templates && (
            <div className="p-4 border-b border-observatory-border">
              <h4 className="text-sm text-observatory-muted mb-3">Common Templates Found</h4>
              <div className="space-y-2">
                {group.templates.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-observatory-muted">"{t.text.slice(0, 40)}..."</span>
                    <span className="text-red-400 font-bold">{t.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Examples */}
          <div className="p-6 border-b border-observatory-border">
            <h4 className="text-sm text-observatory-muted mb-3">Top Examples</h4>
            <div className="space-y-2">
              {group.topExamples.map((ex, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-observatory-border/20 rounded p-2">
                  <span className="font-mono text-observatory-accent">{ex.name}</span>
                  <span className="text-observatory-muted">{ex.posts} posts - {ex.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All Examples (expandable) */}
          <div className="p-6">
            <button
              className="text-sm text-observatory-accent hover:underline mb-3"
              onClick={() => setShowAllExamples(!showAllExamples)}
            >
              {showAllExamples ? 'Hide' : 'Show'} all {group.allExamples.length} accounts
            </button>

            {showAllExamples && (
              <div className="flex flex-wrap gap-2 mt-3">
                {group.allExamples.map((name, i) => (
                  <span key={i} className="text-xs font-mono bg-observatory-border text-observatory-muted px-2 py-1 rounded">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
