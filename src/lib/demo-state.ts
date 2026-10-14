import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { heldSessions, naira, standing } from '@/domain/payments'
import { attentionFor, endsAt, isoDate, occurrences, type Occurrence } from '@/domain/schedule'
import { recentAverage, sortSessions } from '@/domain/stats'
import type { CoachNote, PlayerSummary, ScheduleOverride } from '@/domain/types'
import { buildDemo, demoNow } from '@/lib/demo-data'

/** Everything the coach demo shows and changes. All of it lives in memory, so nothing is saved. */
export function useDemo() {
  const data = useMemo(buildDemo, [])
  const now = useMemo(demoNow, [])
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [extraNotes, setExtraNotes] = useState<CoachNote[]>([])
  const [payments, setPayments] = useState(data.payments)

  const notes = [...extraNotes, ...data.notes]
  const nameOf = (id: string) => data.players.find((p) => p.id === id)?.name ?? ''

  const summaries: PlayerSummary[] = data.players.map((p) => {
    const mine = sortSessions(data.sessions.filter((s) => s.log_id === p.id))
    const avg = recentAverage(mine, 5)
    return {
      log_id: p.id, log_name: p.name, player_id: p.id, player_name: p.name,
      session_count: mine.length, last_session: mine[0]?.session_date ?? null,
      avg_recent: avg ? Number(avg.toFixed(1)) : null,
      last_note: notes.filter((n) => n.log_id === p.id).map((n) => n.created_at).sort().at(-1) ?? null,
      unseen_notes: notes.filter((n) => n.log_id === p.id && !n.acknowledged_at).length,
    }
  })

  // Sessions used come from the schedule, so cancelling one changes the count.
  const money = new Map(data.players.map((p) => {
    const a = data.arrangements.find((x) => x.log_id === p.id)!
    const mine = payments.filter((x) => x.log_id === p.id)
    const own = data.slots.filter((x) => x.log_id === p.id)
    return [p.id, { a, mine, s: standing([a], mine, (x) => heldSessions(own, overrides, x.start_date, now, x.ended_on)) }] as const
  }))
  const recentFor = (id: string) => {
    const a = money.get(id)!.a
    const days = Math.max(1, differenceInCalendarDays(now, parseISO(a.start_date)) + 1)
    return occurrences(data.slots.filter((x) => x.log_id === id), overrides, parseISO(a.start_date), days)
      .filter((o) => endsAt(o) < now).sort((x, y) => y.date.localeCompare(x.date) || y.start.localeCompare(x.start)).slice(0, 4)
  }

  const all = occurrences(data.slots, overrides, addDays(now, -7), 15)
  const today = isoDate(now)
  const upcoming = all.filter((o) => endsAt(o) >= now)
  const todays = upcoming.filter((o) => o.date === today)
  const week = upcoming.filter((o) => o.date <= isoDate(addDays(now, 7)))
  const past = all.filter((o) => endsAt(o) < now).sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start))
  const rows = summaries
    .map((p) => ({ p, reasons: attentionFor(p, all.filter((o) => endsAt(o) < now), 7, now) }))
    .sort((a, b) => b.reasons.length - a.reasons.length || a.p.player_name.localeCompare(b.p.player_name))

  const setOverride = (o: Occurrence, v: Pick<ScheduleOverride, 'new_date' | 'new_start' | 'new_end'>) =>
    setOverrides((cur) => [
      ...cur.filter((x) => !(x.slot_id === o.slotId && x.on_date === o.baseDate)),
      { id: `${o.key}`, log_id: o.logId, slot_id: o.slotId, on_date: o.baseDate, ...v },
    ])

  return {
    data, now, notes, nameOf, summaries, money, recentFor, todays, week, past, rows, payments, overrides,
    cancel: (o: Occurrence) => { setOverride(o, { new_date: null, new_start: null, new_end: null }); toast.success('Session marked as not happening') },
    restore: (o: Occurrence) => setOverrides((cur) => cur.filter((x) => x.id !== o.overrideId)),
    move: (o: Occurrence, v: { date: string; start: string; end: string | null }) => { setOverride(o, { new_date: v.date, new_start: v.start, new_end: v.end }); toast.success('Session moved') },
    addNote: (logId: string, note: string) => {
      setExtraNotes((cur) => [{ id: `new-${cur.length}`, log_id: logId, session_id: null, note, author_id: 'coach', created_at: new Date().toISOString(), acknowledged_at: null }, ...cur])
      toast.success(`Note added for ${nameOf(logId)}`)
    },
    confirmPending: (logId: string) => {
      setPayments((cur) => cur.map((x) => (x.log_id === logId && x.pending ? { ...x, pending: false } : x)))
      toast.success('Payment confirmed')
    },
    confirmPayment: (id: string) => { setPayments((cur) => cur.map((x) => (x.id === id ? { ...x, pending: false } : x))); toast.success('Payment confirmed') },
    removePayment: (id: string) => setPayments((cur) => cur.filter((x) => x.id !== id)),
    record: (logId: string, amount: number) => {
      setPayments((cur) => [...cur, { id: `new-${cur.length}`, log_id: logId, amount, paid_on: isoDate(now), pending: false }])
      toast.success(`${naira(amount)} recorded for ${nameOf(logId)}`)
    },
  }
}

export type Demo = ReturnType<typeof useDemo>
