import { addDays, addHours, format, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns'
import type { PlayerSummary, ScheduleOverride, ScheduleSlot } from './types'

/** Monday first, the way people read a week. Values are JavaScript weekdays (0 = Sunday). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const hhmm = (t: string) => t.slice(0, 5)
export const isoDate = (d: Date) => format(d, 'yyyy-MM-dd')

/** "16:30" becomes "4:30pm". */
export function formatTime(t: string) {
  const [h, m] = hhmm(t).split(':').map(Number)
  const h12 = h % 12 || 12
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h >= 12 ? 'pm' : 'am'}`
}

export const timeRange = (start: string, end: string | null) =>
  end ? `${formatTime(start)} to ${formatTime(end)}` : `from ${formatTime(start)}`

export function dayLabel(date: string) {
  const d = parseISO(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEEE d MMM')
}

/** One real date a slot falls on, after any cancel or move is applied. */
export interface Occurrence {
  key: string
  slotId: string
  logId: string
  /** The date the slot normally falls on. Overrides are keyed by it. */
  baseDate: string
  date: string
  start: string
  end: string | null
  place: string
  cancelled: boolean
  moved: boolean
  overrideId: string | null
}

/** Every occurrence between `from` and `days` days later, sorted by time. */
export function occurrences(slots: ScheduleSlot[], overrides: ScheduleOverride[], from: Date, days: number): Occurrence[] {
  const start = startOfDay(from)
  const first = isoDate(start)
  const last = isoDate(addDays(start, days - 1))
  const found = new Map(overrides.map((o) => [`${o.slot_id}|${o.on_date}`, o]))
  const out: Occurrence[] = []
  // Look a week either side so a session moved into the window from outside still shows.
  for (let i = -7; i < days + 7; i++) {
    const day = addDays(start, i)
    const baseDate = isoDate(day)
    for (const s of slots) {
      if (s.weekday !== day.getDay()) continue
      const o = found.get(`${s.id}|${baseDate}`)
      const moved = Boolean(o?.new_date && o.new_start)
      const occ: Occurrence = {
        key: `${s.id}|${baseDate}`,
        slotId: s.id,
        logId: s.log_id,
        baseDate,
        date: moved ? o!.new_date! : baseDate,
        start: hhmm(moved ? o!.new_start! : s.start_time),
        end: moved ? (o!.new_end ? hhmm(o!.new_end) : null) : s.end_time ? hhmm(s.end_time) : null,
        place: s.place,
        cancelled: Boolean(o) && !moved,
        moved,
        overrideId: o?.id ?? null,
      }
      if (occ.date >= first && occ.date <= last) out.push(occ)
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
}

const at = (date: string, time: string) => new Date(`${date}T${time}:00`)

/** Sessions often run long, so with no end time we allow two hours. */
export const endsAt = (o: Occurrence) => (o.end ? at(o.date, o.end) : addHours(at(o.date, o.start), 2))

/** Reasons a coach may want to look at this player, most urgent first. */
export function attentionFor(p: PlayerSummary, past: Occurrence[], staleDays: number, now = new Date()): string[] {
  const reasons: string[] = []
  const missed = past
    .filter((o) => o.logId === p.log_id && !o.cancelled && endsAt(o) < now)
    .at(-1)
  if (missed && (!p.last_session || p.last_session < missed.date)) {
    reasons.push(`Nothing logged for ${WEEKDAYS_LONG[parseISO(missed.date).getDay()]}’s session`)
  } else if (p.last_session && !missed) {
    const idle = Math.floor((now.getTime() - parseISO(p.last_session).getTime()) / 86_400_000)
    if (idle >= staleDays) reasons.push(`Nothing logged for ${idle} days`)
  }
  if (p.last_session && (!p.last_note || p.last_note.slice(0, 10) < p.last_session)) {
    reasons.push('New entry with no note from you yet')
  }
  return reasons
}
