import { describe, it, expect } from 'vitest'

// Test helper functions
describe('computeCategoryStats', () => {
  const computeCategoryStats = (accounts) => {
    const CATEGORIES = ['LIKELY_AUTONOMOUS', 'POSSIBLY_AUTOMATED', 'MODERATE_SIGNALS',
                        'SCRIPTED_BOT', 'HUMAN_PACED', 'INSUFFICIENT_SIGNAL', 'INSUFFICIENT_DATA']
    const counts = {}
    const samples = {}
    CATEGORIES.forEach(cat => { counts[cat] = 0; samples[cat] = [] })

    accounts.forEach(acc => {
      const cat = acc.category || 'INSUFFICIENT_DATA'
      if (counts[cat] !== undefined) {
        counts[cat]++
        if (samples[cat].length < 5) samples[cat].push(acc.username)
      }
    })
    return { counts, samples }
  }

  it('counts categories correctly', () => {
    const accounts = [
      { username: 'bot1', category: 'LIKELY_AUTONOMOUS' },
      { username: 'bot2', category: 'LIKELY_AUTONOMOUS' },
      { username: 'human1', category: 'HUMAN_PACED' },
      { username: 'unknown', category: null },
    ]

    const { counts } = computeCategoryStats(accounts)

    expect(counts['LIKELY_AUTONOMOUS']).toBe(2)
    expect(counts['HUMAN_PACED']).toBe(1)
    expect(counts['INSUFFICIENT_DATA']).toBe(1) // null category defaults here
  })

  it('collects up to 5 samples per category', () => {
    const accounts = Array.from({ length: 10 }, (_, i) => ({
      username: `user${i}`,
      category: 'HUMAN_PACED'
    }))

    const { samples } = computeCategoryStats(accounts)

    expect(samples['HUMAN_PACED'].length).toBe(5)
    expect(samples['HUMAN_PACED']).toContain('user0')
    expect(samples['HUMAN_PACED']).not.toContain('user9')
  })

  it('handles empty accounts array', () => {
    const { counts, samples } = computeCategoryStats([])

    expect(counts['HUMAN_PACED']).toBe(0)
    expect(samples['HUMAN_PACED']).toEqual([])
  })
})

describe('formatTime', () => {
  const formatTime = (seconds) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  it('formats seconds', () => {
    expect(formatTime(30)).toBe('30.0s')
    expect(formatTime(59)).toBe('59.0s')
  })

  it('formats minutes', () => {
    expect(formatTime(60)).toBe('1.0m')
    expect(formatTime(120)).toBe('2.0m')
    expect(formatTime(3599)).toBe('60.0m')
  })

  it('formats hours', () => {
    expect(formatTime(3600)).toBe('1.0h')
    expect(formatTime(7200)).toBe('2.0h')
    expect(formatTime(27000)).toBe('7.5h')
  })

  it('handles null/undefined', () => {
    expect(formatTime(null)).toBe('N/A')
    expect(formatTime(undefined)).toBe('N/A')
    expect(formatTime(0)).toBe('N/A')
  })
})

describe('summaryStats calculation', () => {
  it('calculates automation total correctly', () => {
    const categoryCounts = {
      'LIKELY_AUTONOMOUS': 4,
      'POSSIBLY_AUTOMATED': 10,
      'MODERATE_SIGNALS': 21,
      'SCRIPTED_BOT': 5,
      'HUMAN_PACED': 770,
      'INSUFFICIENT_SIGNAL': 13,
      'INSUFFICIENT_DATA': 81,
    }

    const automation = categoryCounts['LIKELY_AUTONOMOUS'] +
                       categoryCounts['POSSIBLY_AUTOMATED'] +
                       categoryCounts['MODERATE_SIGNALS'] +
                       categoryCounts['SCRIPTED_BOT']

    expect(automation).toBe(40)
  })

  it('calculates percentages correctly', () => {
    const total = 904
    const automation = 40
    const humanPaced = 770

    const automationPct = ((automation / total) * 100).toFixed(1)
    const humanPacedPct = ((humanPaced / total) * 100).toFixed(1)

    expect(automationPct).toBe('4.4')
    expect(humanPacedPct).toBe('85.2')
  })
})
