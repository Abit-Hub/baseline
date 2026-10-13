import { useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { AppShell } from '@/components/app-shell'
import { LogProvider } from '@/components/log-context'
import { Onboarding } from '@/components/onboarding'
import { logsQuery, myMembershipsQuery } from '@/data/queries'
import type { Role } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import { activeLogIdAtom } from '@/state/atoms'

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
  const storedId = useAtomValue(activeLogIdAtom)

  const error = logsQ.error ?? memberships.error
  if (error) return <p className="p-6 text-destructive">Could not load your log: {error.message}</p>
  const logs = logsQ.data
  const mine = memberships.data
  if (!logs || !mine) return <p className="p-6 text-muted-foreground">Opening your log…</p>
  if (!logs.length) return <Onboarding />

  const roles: Record<string, Role> = Object.fromEntries(mine.map((m) => [m.log_id, m.role]))
  // Open the saved log, otherwise the person's own log, otherwise the first one.
  const log = logs.find((l) => l.id === storedId) ?? logs.find((l) => roles[l.id] === 'player') ?? logs[0]
  return (
    <LogProvider log={log} logs={logs} roles={roles} user={user}>
      <AppShell>
        <Outlet />
      </AppShell>
    </LogProvider>
  )
}
