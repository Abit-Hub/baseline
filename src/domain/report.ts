import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { isoDate } from './schedule'
import { focusCounts, recentAverage, sortSessions } from './stats'
import type { CoachNote, Drill, Goal, Match, Session } from './types'

export type Period = 'month' | 'quarter' | 'all'

export const PERIODS: { id: Period; label: string; days: number | null }[] = [
  { id: 'month', label: 'Last 30 days', days: 30 },
  { id: 'quarter', label: 'Last 3 months', days: 90 },
  { id: 'all', label: 'All time', days: null },
]

export interface ReportInput {
  sessions: Session[]
  goals: Goal[]
  drills: Drill[]
  notes: CoachNote[]
  matches: Match[]
}

const within = (date: string, from: string | null, to: string) => (!from || date >= from) && date <= to

/** Everything the progress report shows, for one period. */
export function buildReport(input: ReportInput, period: Period, now = new Date()) {
  const days = PERIODS.find((p) => p.id === period)?.days ?? null
  const day = startOfDay(now)
  const to = isoDate(day)
  const from = days ? isoDate(addDays(day, -(days - 1))) : null
  const prevFrom = days ? isoDate(addDays(day, -(2 * days - 1))) : null
  const prevTo = days ? isoDate(addDays(day, -days)) : to

  const sessions = sortSessions(input.sessions.filter((s) => within(s.session_date, from, to)))
  const before = days ? input.sessions.filter((s) => within(s.session_date, prevFrom, prevTo)) : []
  const avg = recentAverage(sessions, sessions.length)
  const prevAvg = recentAverage(sortSessions(before), before.length)

  const matches = input.matches.filter((m) => within(m.match_date, from, to)).sort((a, b) => b.match_date.localeCompare(a.match_date))
  const notes = input.notes.filter((n) => within(n.created_at.slice(0, 10), from, to)).sort((a, b) => b.created_at.localeCompare(a.created_at))

  const earliest = [...input.sessions.map((s) => s.session_date), ...input.matches.map((m) => m.match_date)].sort()[0]
  const start = from ?? earliest ?? to
  return {
    period, from: start, to,
    rangeLabel: from ? `${format(parseISO(from), 'd MMM yyyy')} to ${format(parseISO(to), 'd MMM yyyy')}` : earliest ? `Since ${format(parseISO(earliest), 'd MMM yyyy')}` : 'All time',
    sessions,
    avg,
    /** Change in average feel against the period before. Null for "all time" or without ratings in both. */
    change: avg != null && prevAvg != null ? avg - prevAvg : null,
    focus: focusCounts(sessions),
    matches,
    wins: matches.filter((m) => m.result === 'win').length,
    losses: matches.filter((m) => m.result === 'loss').length,
    notes: notes.slice(0, 4),
    goalsDone: input.goals.filter((g) => g.done),
    goalsOpen: input.goals.filter((g) => !g.done),
    drillsPractised: input.drills.filter((d) => d.last_practised && within(d.last_practised, from, to)).length,
    workOnNext: sessions.find((s) => s.fix)?.fix ?? null,
  }
}

export type Report = ReturnType<typeof buildReport>
