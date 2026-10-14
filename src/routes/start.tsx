import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

/** Where signing in, the installed app and "Open your log" begin. A coach lands on Players, a player on Overview. */
export const Route = createFileRoute('/start')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw redirect({ to: '/login', search: { redirect: '/start' } })
    const { data: coaching } = await supabase.from('log_members').select('role')
      .eq('user_id', data.session.user.id).eq('role', 'coach').limit(1)
    throw redirect({ to: coaching?.length ? '/players' : '/overview' })
  },
})
