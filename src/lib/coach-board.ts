import { useQuery } from '@tanstack/react-query'
import { addDays } from 'date-fns'
import { useMemo } from 'react'
import { moneyQuery, myPlayersQuery, scheduleQuery } from '@/data/queries'
import { heldSessions, standing, type Standing } from '@/domain/payments'
import { attentionFor, endsAt, isoDate, occurrences } from '@/domain/schedule'
import { useNow } from '@/lib/use-now'

export const STALE_DAYS = 7

/** Everything the coach's screens need about all of their players, worked out once. */
export function useCoachBoard() {
  const players = useQuery(myPlayersQuery())
  const sched = useQuery(scheduleQuery(null))
  const money = useQuery(moneyQuery(null))
  const now = useNow()

  const board = useMemo(() => {
    const list = players.data ?? []
    const mine = new Set(list.map((p) => p.log_id))
    const slots = (sched.data?.slots ?? []).filter((s) => mine.has(s.log_id))
    const overrides = (sched.data?.overrides ?? []).filter((o) => mine.has(o.log_id))
    const arrangements = money.data?.arrangements ?? []
    const payments = money.data?.payments ?? []

    const all = occurrences(slots, overrides, addDays(now, -7), 15)
    const today = isoDate(now)
    const upcoming = all.filter((o) => endsAt(o) >= now)
    const pastAsc = all.filter((o) => endsAt(o) < now)

    const standings = new Map<string, Standing | null>(list.map((p) => {
      const deals = arrangements.filter((a) => a.log_id === p.log_id)
      if (!deals.length) return [p.log_id, null] as const
      const ownSlots = slots.filter((x) => x.log_id === p.log_id)
      const ownOverrides = overrides.filter((x) => x.log_id === p.log_id)
      return [p.log_id, standing(deals, payments.filter((x) => x.log_id === p.log_id),
        (a) => heldSessions(ownSlots, ownOverrides, a.start_date, now, a.ended_on))] as const
    }))
    const pendingIds = new Map<string, string[]>()
    for (const x of payments) if (x.pending) pendingIds.set(x.log_id, [...(pendingIds.get(x.log_id) ?? []), x.id])

    const rows = list
      .map((p) => ({ p, reasons: attentionFor(p, pastAsc, STALE_DAYS, now), s: standings.get(p.log_id) ?? null }))
      .sort((a, b) => b.reasons.length - a.reasons.length || a.p.player_name.localeCompare(b.p.player_name))

    return {
      players: list, rows, standings, pendingIds,
      todays: upcoming.filter((o) => o.date === today),
      week: upcoming.filter((o) => o.date <= isoDate(addDays(now, 7))),
      past: [...pastAsc].sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start)),
    }
  }, [players.data, sched.data, money.data, now])

  return {
    ...board,
    now,
    loading: players.isPending || sched.isPending || money.isPending,
    error: players.error ?? sched.error ?? money.error,
  }
}

export type CoachBoard = ReturnType<typeof useCoachBoard>
