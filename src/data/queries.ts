import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { STARTER_DRILLS } from '@/domain/constants'
import type { CoachNote, Drill, Goal, Log, Member, Membership, PlayerSummary, ScheduleOverride, ScheduleSlot, Session } from '@/domain/types'
import { supabase } from '@/lib/supabase'

export type TableName = 'sessions' | 'drills' | 'goals' | 'coach_notes'
interface RowMap {
  sessions: Session
  drills: Drill
  goals: Goal
  coach_notes: CoachNote
}

const ORDER: Record<TableName, { column: string; ascending: boolean }> = {
  sessions: { column: 'session_date', ascending: false },
  drills: { column: 'position', ascending: true },
  goals: { column: 'position', ascending: true },
  coach_notes: { column: 'created_at', ascending: false },
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

/* ------------------------------------------------------------- queries */

export const logsQuery = () =>
  queryOptions({
    queryKey: ['logs'],
    queryFn: async () =>
      check(await supabase.from('logs').select('*').order('created_at')) as Log[],
  })

export const myMembershipsQuery = (userId: string) =>
  queryOptions({
    queryKey: ['memberships', userId],
    queryFn: async () =>
      check(
        await supabase.from('log_members').select('log_id, role').eq('user_id', userId),
      ) as Membership[],
  })

export const myPlayersQuery = () =>
  queryOptions({
    queryKey: ['players'],
    queryFn: async () => check(await supabase.rpc('my_players')) as PlayerSummary[],
  })

export const membersQuery = (logId: string) =>
  queryOptions({
    queryKey: ['members', logId],
    queryFn: async () =>
      check(
        await supabase
          .from('log_members')
          .select('user_id, role, profiles(display_name)')
          .eq('log_id', logId),
      ) as unknown as Member[],
  })

export const rowsQuery = <T extends TableName>(table: T, logId: string) =>
  queryOptions({
    queryKey: [table, logId],
    queryFn: async () => {
      const { column, ascending } = ORDER[table]
      return check(
        await supabase.from(table).select('*').eq('log_id', logId).order(column, { ascending }),
      ) as RowMap[T][]
    },
  })

/* ----------------------------------------------------------- row mutations */

export function useInsertRow<T extends TableName>(table: T, logId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Partial<Omit<RowMap[T], 'id' | 'log_id'>>) =>
      check(await supabase.from(table).insert({ ...row, log_id: logId })),
    onSettled: () => qc.invalidateQueries({ queryKey: [table, logId] }),
  })
}

/** Updates a row and patches the cache straight away so toggles feel instant. */
export function useUpdateRow<T extends TableName>(table: T, logId: string) {
  const qc = useQueryClient()
  const key = [table, logId]
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<RowMap[T]> }) =>
      check(await supabase.from(table).update(patch as Record<string, unknown>).eq('id', id)),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<RowMap[T][]>(key)
      qc.setQueryData<RowMap[T][]>(key, (rows) =>
        rows?.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(key, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteRow<T extends TableName>(table: T, logId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => check(await supabase.from(table).delete().eq('id', id)),
    onSettled: () => qc.invalidateQueries({ queryKey: [table, logId] }),
  })
}

/* --------------------------------------------------------------- schedule */

/** One log's weekly times, or every log I belong to when logId is null. */
export const scheduleQuery = (logId: string | null) =>
  queryOptions({
    queryKey: ['schedule', logId ?? 'all'],
    queryFn: async () => {
      const scope = logId ? { log_id: logId } : {}
      const [slots, overrides] = await Promise.all([
        supabase.from('schedule_slots').select('*').match(scope),
        supabase.from('schedule_overrides').select('*').match(scope),
      ])
      return { slots: check(slots) as ScheduleSlot[], overrides: check(overrides) as ScheduleOverride[] }
    },
  })

export interface SlotInput {
  weekday: number
  start_time: string
  end_time: string | null
  place: string
}

export interface OverrideInput {
  slot_id: string
  on_date: string
  new_date: string | null
  new_start: string | null
  new_end: string | null
}

export function useScheduleActions(logId: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['schedule'] })
  return {
    addSlot: useMutation({
      mutationFn: async (v: SlotInput) =>
        check(await supabase.from('schedule_slots').insert({ ...v, log_id: logId })),
      onSuccess: refresh,
    }),
    updateSlot: useMutation({
      mutationFn: async (v: { id: string } & SlotInput) => {
        const { id, ...patch } = v
        return check(await supabase.from('schedule_slots').update(patch).eq('id', id))
      },
      onSuccess: refresh,
    }),
    removeSlot: useMutation({
      mutationFn: async (id: string) => check(await supabase.from('schedule_slots').delete().eq('id', id)),
      onSuccess: refresh,
    }),
    /** Cancel (no new_date) or move one date of a slot. */
    setOverride: useMutation({
      mutationFn: async (v: OverrideInput) =>
        check(await supabase.from('schedule_overrides').upsert({ ...v, log_id: logId }, { onConflict: 'slot_id,on_date' })),
      onSuccess: refresh,
    }),
    clearOverride: useMutation({
      mutationFn: async (id: string) => check(await supabase.from('schedule_overrides').delete().eq('id', id)),
      onSuccess: refresh,
    }),
  }
}

/** The player taps "Got it" on a coach's note. The database only lets the player do this. */
export function useAcknowledgeNote(logId: string) {
  const qc = useQueryClient()
  const key = ['coach_notes', logId]
  return useMutation({
    mutationFn: async (id: string) => check(await supabase.rpc('acknowledge_note', { _id: id })),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<CoachNote[]>(key)
      qc.setQueryData<CoachNote[]>(key, (rows) =>
        rows?.map((n) => (n.id === id ? { ...n, acknowledged_at: new Date().toISOString() } : n)))
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(key, ctx.previous),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key })
      void qc.invalidateQueries({ queryKey: ['players'] })
    },
  })
}

/* ------------------------------------------------------------ log actions */

export function useCreateLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { name: string; withStarter: boolean }) => {
      const id = check(await supabase.rpc('create_log', { _name: v.name })) as string
      if (v.withStarter) {
        check(
          await supabase.from('drills').insert(
            STARTER_DRILLS.map((d, i) => ({ ...d, log_id: id, position: i + 1 })),
          ),
        )
      }
      return id
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['logs'] })
      void qc.invalidateQueries({ queryKey: ['memberships'] })
    },
  })
}

export function useJoinLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { code: string }) =>
      check(await supabase.rpc('join_log', { _code: v.code })) as string,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['logs'] })
      void qc.invalidateQueries({ queryKey: ['memberships'] })
      void qc.invalidateQueries({ queryKey: ['players'] })
    },
  })
}

export function useUpdateLog(logId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: { name?: string }) =>
      check(await supabase.from('logs').update(patch).eq('id', logId)),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['logs'] })
      const previous = qc.getQueryData<Log[]>(['logs'])
      qc.setQueryData<Log[]>(['logs'], (rows) => rows?.map((l) => (l.id === logId ? { ...l, ...patch } : l)))
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(['logs'], ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['logs'] }),
  })
}

export function useRotateInvite(logId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => check(await supabase.rpc('rotate_invite_code', { _log: logId })) as string,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logs'] }),
  })
}

export function useLeaveLog(logId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      check(await supabase.from('log_members').delete().eq('log_id', logId).eq('user_id', userId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['logs'] })
      void qc.invalidateQueries({ queryKey: ['memberships'] })
      void qc.invalidateQueries({ queryKey: ['players'] })
    },
  })
}

/** The player removes a coach from their log. */
export function useRemoveCoach(logId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) =>
      check(await supabase.from('log_members').delete().eq('log_id', logId).eq('user_id', userId)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['members', logId] }),
  })
}

/* --------------------------------------------------------------- realtime */

/** Refreshes the cache whenever the other person changes something. */
export function useRealtime(logId: string) {
  const qc = useQueryClient()
  useEffect(() => {
    const channel = supabase.channel(`log-${logId}`)
    const watch = (table: string, filter: string, key: unknown[]) =>
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter }, () =>
        qc.invalidateQueries({ queryKey: key }),
      )
    for (const t of ['sessions', 'drills', 'goals', 'coach_notes'] as const)
      watch(t, `log_id=eq.${logId}`, [t, logId])
    watch('log_members', `log_id=eq.${logId}`, ['members', logId])
    watch('schedule_slots', `log_id=eq.${logId}`, ['schedule'])
    watch('schedule_overrides', `log_id=eq.${logId}`, ['schedule'])
    watch('logs', `id=eq.${logId}`, ['logs'])
    channel.subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [logId, qc])
}
