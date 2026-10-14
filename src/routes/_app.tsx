import { useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'
import { LogProvider } from '@/components/log-context'
import { Onboarding } from '@/components/onboarding'
import { ListSkeleton, Skeleton } from '@/components/ui-bits'
import { logsQuery, myMembershipsQuery } from '@/data/queries'
import type { Role } from '@/domain/types'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { user: data.session.user }
  },
  component: AppLayout,
})

function AppLayout() {
  const { user } = Route.useRouteContext()
  const logsQ = useQuery(logsQuery())
  const memberships = useQuery(myMembershipsQuery(user.id))

  const error = logsQ.error ?? memberships.error
  if (error) return <p className="p-6 text-destructive">Could not load your log: {error.message}</p>
  const logs = logsQ.data
  const mine = memberships.data
  if (!logs || !mine) return (
    <div role="status" aria-label="Opening your log" className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <ListSkeleton rows={3} />
    </div>
  )
  // This side of the app is the person's own training log. Coaches see their players in the coach view.
  const roles: Record<string, Role> = Object.fromEntries(mine.map((m) => [m.log_id, m.role]))
  const log = logs.find((l) => roles[l.id] === 'player')
  if (!log) return <Onboarding />
  return (
    <LogProvider log={log} logs={logs} roles={roles} user={user}>
      <AppShell>
        <Outlet />
      </AppShell>
    </LogProvider>
  )
}
