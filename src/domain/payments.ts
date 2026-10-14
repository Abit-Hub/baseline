import { addDays, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import { endsAt, occurrences } from './schedule'
import type { ScheduleOverride, ScheduleSlot } from './types'

/** What a coach and a player agreed. `price` is the whole bundle, or the rate for one session. */
export interface Arrangement {
  id?: string
  kind: 'package' | 'per_session'
  /** Sessions in a bundle. Null for pay per session. */
  sessions: number | null
  price: number
  start_date: string
  /** The day the next arrangement took over (not included). Null/absent while current. */
  ended_on?: string | null
}

export interface Payment {
  id: string
  amount: number
  paid_on: string
  /** The player said they paid. The coach has not confirmed it yet. */
  pending: boolean
}

export const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`

/**
 * Sessions that really took place from `from` up to (not including) `until`, or up to
 * today: in the past, and not cancelled. "Didn't happen" is a cancelled date in the schedule.
 */
export function heldSessions(slots: ScheduleSlot[], overrides: ScheduleOverride[], from: string, now: Date, until?: string | null) {
  const last = until ? addDays(parseISO(until), -1) : startOfDay(now)
  const days = differenceInCalendarDays(last, parseISO(from)) + 1
  if (days < 1) return 0
  return occurrences(slots, overrides, parseISO(from), days).filter((o) => !o.cancelled && endsAt(o) < now).length
}

const isBundle = (a: Arrangement) => a.kind === 'package' && a.sessions != null

/** The running balance across every arrangement, so nothing is lost when a new one starts. */
export function standing(arrangements: Arrangement[], payments: Payment[], heldFor: (a: Arrangement) => number) {
  const active = arrangements.find((a) => !a.ended_on) ?? null
  const cost = arrangements.reduce((sum, a) => sum + (isBundle(a) ? a.price : heldFor(a) * a.price), 0)
  const paid = payments.filter((p) => !p.pending).reduce((sum, p) => sum + p.amount, 0)
  const pending = payments.filter((p) => p.pending).reduce((sum, p) => sum + p.amount, 0)
  const used = active ? heldFor(active) : 0
  return {
    active,
    used,
    left: active && isBundle(active) ? Math.max(0, active.sessions! - used) : null,
    cost,
    paid,
    pending,
    owed: Math.max(0, cost - paid),
    /** Paid more than has been used so far, such as money handed over before sessions. */
    ahead: Math.max(0, paid - cost),
    finished: Boolean(active && isBundle(active) && used >= active.sessions!),
  }
}

export type Standing = ReturnType<typeof standing>

export const arrangementLabel = (a: Arrangement) =>
  isBundle(a) ? `${a.sessions} sessions for ${naira(a.price)}` : `${naira(a.price)} per session`

const sessionsPhrase = (s: Standing) =>
  !s.active ? 'No current deal'
    : s.finished ? 'Bundle finished'
      : isBundle(s.active) ? `${s.used} of ${s.active.sessions} sessions used`
        : `${s.used} session${s.used === 1 ? '' : 's'} at ${naira(s.active.price)}`

/** The one line shown under a player's name. */
export function standingLine(s: Standing) {
  const parts = [sessionsPhrase(s)]
  if (s.left === 1) parts.push('1 left')
  parts.push(s.owed > 0 ? `${naira(s.owed)} owed` : s.ahead > 0 ? `${naira(s.ahead)} ahead` : 'paid up')
  return parts.join(' · ')
}

/** True when the coach should look: money owed, a bundle used up, or one session left. */
export const needsLook = (s: Standing) => s.owed > 0 || s.finished || s.left === 1

/** A short summary a coach can send a player on WhatsApp. */
export function statementText(name: string, s: Standing) {
  const sessions = s.active ? (isBundle(s.active) ? `${s.used} of ${s.active.sessions} sessions used` : `${s.used} session${s.used === 1 ? '' : 's'} at ${naira(s.active.price)}`) : 'no current deal'
  const money = s.owed > 0 ? `Paid ${naira(s.paid)} of ${naira(s.cost)}. Balance: ${naira(s.owed)}.` : s.ahead > 0 ? `Paid ${naira(s.paid)}, which is ${naira(s.ahead)} ahead.` : `Paid ${naira(s.paid)}. Nothing owed.`
  return `Hi ${name}, a quick summary of your training: ${sessions}. ${money} Thank you!`
}
