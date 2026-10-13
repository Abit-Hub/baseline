import { describe, expect, it } from 'vitest'
import { agoLabel, focusCounts, recentAverage, sortSessions, trend } from './stats'
import type { Session } from './types'

const mk = (date: string, rating: number | null, focus: string[] = [], n = 0): Session => ({
  id: `${date}-${n}`, log_id: 'l', session_date: date, focus, rating,
  worked: '', well: '', fix: '', created_at: `2026-01-01T00:00:0${n}Z`,
})

describe('stats', () => {
  const list = sortSessions([
    mk('2026-10-01', 2), mk('2026-10-03', 3), mk('2026-10-05', 3), mk('2026-10-08', 4),
    mk('2026-10-10', 4), mk('2026-10-12', 5, ['Serve']),
  ])

  it('sorts newest first', () => expect(list[0].session_date).toBe('2026-10-12'))
  it('breaks date ties by creation time', () => {
    const t = sortSessions([mk('2026-10-01', 1, [], 1), mk('2026-10-01', 2, [], 2)])
    expect(t[0].rating).toBe(2)
  })
  it('averages the latest ratings', () => expect(recentAverage(list, 3)).toBeCloseTo(13 / 3))
  it('returns null with no ratings', () => expect(recentAverage([mk('2026-10-01', null)])).toBeNull())
  it('computes the trend against the previous three', () =>
    expect(trend(list)).toBeCloseTo((5 + 4 + 4) / 3 - (3 + 3 + 2) / 3))
  it('has no trend with fewer than four ratings', () => expect(trend(list.slice(0, 3))).toBeNull())
  it('counts focus areas', () => expect(focusCounts(list)).toEqual([['Serve', 1]]))
  it('labels dates', () => {
    const now = new Date('2026-10-13T10:00:00')
    expect(agoLabel('2026-10-13', now)).toBe('Today')
    expect(agoLabel('2026-10-12', now)).toBe('Yesterday')
    expect(agoLabel('2026-10-08', now)).toBe('5 days ago')
    expect(agoLabel(null, now)).toBe('Not yet')
  })
})
