import { createFileRoute, redirect } from '@tanstack/react-router'
import { pendingInvite } from '@/lib/pending-invite'
import { viewOf } from '@/lib/role'
import { supabase } from '@/lib/supabase'

/** Where signing in, the installed app and "Open your log" begin. A coach lands on Players, a player on Overview. */
export const Route = createFileRoute('/start')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw redirect({ to: '/login', search: { redirect: '/start' } })
    const invite = pendingInvite.get()
    if (invite) throw redirect({ to: '/invite/$code', params: { code: invite } })
    // The view someone chose. Accounts from before the choice existed go by whether they coach anyone.
    const chosen = viewOf(data.session.user)
    if (chosen) throw redirect({ to: chosen === 'coach' ? '/coach' : '/overview' })
    const { data: coaching } = await supabase.from('log_members').select('role')
      .eq('user_id', data.session.user.id).eq('role', 'coach').limit(1)
    throw redirect({ to: coaching?.length ? '/coach' : '/overview' })
  },
})
