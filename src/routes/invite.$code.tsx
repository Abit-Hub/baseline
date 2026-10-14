import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { coachInviteInfoQuery, useAcceptCoachInvite } from '@/data/queries'
import { pendingInvite } from '@/lib/pending-invite'
import { supabase } from '@/lib/supabase'
import { activeLogIdAtom } from '@/state/atoms'
import { Wordmark } from '@/components/wordmark'

export const Route = createFileRoute('/invite/$code')({
  beforeLoad: async ({ params, location }) => {
    // Remember the link: signing up and confirming an email can take the player away from this page.
    pendingInvite.set(params.code)
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw redirect({ to: '/login', search: { redirect: location.href, mode: 'up' } })
  },
  component: Invite,
})

function Invite() {
  const { code } = Route.useParams()
  const info = useQuery(coachInviteInfoQuery(code))
  const accept = useAcceptCoachInvite()
  const setActive = useSetAtom(activeLogIdAtom)
  const navigate = useNavigate()
  const coach = info.data

  // A link that is not valid should not bring the person back here every time they sign in.
  useEffect(() => { if (info.isSuccess && !info.data) pendingInvite.clear() }, [info.isSuccess, info.data])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <header>
        <Wordmark className="text-3xl" />
        {info.isPending ? (
          <h1 className="mt-1 text-5xl leading-none">One moment…</h1>
        ) : coach ? (
          <>
            <h1 className="mt-1 text-5xl leading-none">{coach} invited you</h1>
            <p className="mt-3 text-muted-foreground">
              Baseline is your training notebook. Log your sessions, see {coach}’s notes, your schedule and your goals in one place.
              Your entries stay yours to edit, and {coach} can read them and leave notes.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-5xl leading-none">This link is not valid</h1>
            <p className="mt-3 text-muted-foreground">It may have been replaced by a newer one. Ask your coach to send it again.</p>
          </>
        )}
      </header>

      {coach && (
        <div className="flex flex-col gap-3">
          <Button size="lg" disabled={accept.isPending}
            onClick={() => accept.mutate(code, {
              onSuccess: (id) => { pendingInvite.clear(); setActive(id); void navigate({ to: '/overview' }) },
              onError: () => pendingInvite.clear(),
            })}>
            {accept.isPending ? 'Setting up…' : `Start my log with ${coach}`}
          </Button>
          {accept.error && <p className="text-sm text-destructive">{accept.error.message}</p>}
          <Link to="/start" onClick={() => pendingInvite.clear()} className="self-start text-sm text-muted-foreground underline underline-offset-4">
            Not now
          </Link>
        </div>
      )}
    </main>
  )
}
