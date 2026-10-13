import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Session } from './types'

export const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0

/** Newest first, with creation time as the tie-break. */
export function sortSessions(sessions: Session[]) {
  return [...sessions].sort(
    (a, b) =>
      b.session_date.localeCompare(a.session_date) ||
      b.created_at.localeCompare(a.created_at),
  )
}

export const ratedValues = (newestFirst: Session[]) =>
  newestFirst.flatMap((s) => (s.rating ? [s.rating] : []))

/** Average of the latest `n` ratings. */
export function recentAverage(newestFirst: Session[], n = 5) {
  const r = ratedValues(newestFirst).slice(0, n)
  return r.length ? average(r) : null
}

/** Latest 3 ratings against the 3 before them. Null until there are 4+. */
export function trend(newestFirst: Session[]) {
  const r = ratedValues(newestFirst)
  if (r.length < 4) return null
  const latest = r.slice(0, 3)
  const before = r.slice(3, 6)
  return average(latest) - average(before)
}

export function focusCounts(sessions: Session[]) {
  const counts = new Map<string, number>()
  for (const s of sessions) for (const f of s.focus) counts.set(f, (counts.get(f) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export const daysAgo = (isoDate: string, now = new Date()) =>
  differenceInCalendarDays(now, parseISO(isoDate))

export function agoLabel(isoDate: string | null, now = new Date()) {
  if (!isoDate) return 'Not yet'
  const n = daysAgo(isoDate, now)
  if (n <= 0) return 'Today'
  if (n === 1) return 'Yesterday'
  return `${n} days ago`
}

export const countWithin = (sessions: Session[], days: number, now = new Date()) =>
  sessions.filter((s) => daysAgo(s.session_date, now) <= days).length
