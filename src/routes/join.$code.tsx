import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { useJoinLog } from '@/data/queries'
import { setView } from '@/lib/role'
import { supabase } from '@/lib/supabase'
import { activeLogIdAtom } from '@/state/atoms'
import { Wordmark } from '@/components/wordmark'

export const Route = createFileRoute('/join/$code')({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: Join,
})

function Join() {
  const { code } = Route.useParams()
  const join = useJoinLog()
  const setActive = useSetAtom(activeLogIdAtom)
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <header>
        <Wordmark className="text-3xl" />
        <h1 className="mt-1 text-5xl leading-none">You’ve been invited</h1>
        <p className="mt-3 text-muted-foreground">
          You will join as the coach. You can read the player’s sessions, drills and goals, leave coach notes,
          and suggest drills and goals. Their own entries stay theirs to edit.
        </p>
      </header>
      <Button size="lg" disabled={join.isPending}
        onClick={() => join.mutate({ code }, {
          onSuccess: (id) => { setActive(id); void setView('coach'); void navigate({ to: '/coach/players/$logId', params: { logId: id } }) },
        })}>
        {join.isPending ? 'Joining…' : 'Join as their coach'}
      </Button>
      {join.error && <p className="text-sm text-destructive">{join.error.message}</p>}
    </main>
  )
}
