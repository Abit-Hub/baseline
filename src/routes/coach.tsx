import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CoachContext } from '@/components/coach/coach-context'
import { CoachShell } from '@/components/coach/shell'
import { ListSkeleton, Skeleton } from '@/components/ui-bits'
import { logsQuery, myMembershipsQuery } from '@/data/queries'
import type { Role } from '@/domain/types'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/coach')({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { user: data.session.user }
  },
  component: CoachLayout,
})

function CoachLayout() {
  const { user } = Route.useRouteContext()
  const qc = useQueryClient()
  const logs = useQuery(logsQuery())
  const memberships = useQuery(myMembershipsQuery(user.id))

  // New players, payments and notes show up without a refresh.
  useEffect(() => {
    const channel = supabase.channel('coach-live')
    const on = (table: string, keys: unknown[][], filter?: string) =>
      channel.on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, () =>
        keys.forEach((queryKey) => void qc.invalidateQueries({ queryKey })))
    on('log_members', [['logs'], ['memberships'], ['players']], `user_id=eq.${user.id}`)
    on('payments', [['money']])
    on('arrangements', [['money']])
    on('coach_notes', [['coach_notes'], ['players']])
    on('sessions', [['sessions'], ['players']])
    on('schedule_slots', [['schedule']])
    on('schedule_overrides', [['schedule']])
    channel.subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [qc, user.id])

  const error = logs.error ?? memberships.error
  if (error) return <p className="p-6 text-destructive">Could not load your players: {error.message}</p>
  if (!logs.data || !memberships.data) return (
    <div role="status" aria-label="Opening" className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <Skeleton className="h-8 w-40" /><Skeleton className="h-28 w-full rounded-lg" /><ListSkeleton rows={3} />
    </div>
  )
  const roles: Record<string, Role> = Object.fromEntries(memberships.data.map((m) => [m.log_id, m.role]))
  return (
    <CoachContext.Provider value={{ user, logs: logs.data, roles }}>
      <CoachShell><Outlet /></CoachShell>
    </CoachContext.Provider>
  )
}
