import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { InvitePlayerPanel } from '@/components/invite-player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateLog } from '@/data/queries'
import { pendingInvite } from '@/lib/pending-invite'
import { supabase } from '@/lib/supabase'
import { activeLogIdAtom } from '@/state/atoms'

/** Everyone starts as a player. Coaches get their role by joining a player's log through an invite link. */
export function Onboarding() {
  const [name, setName] = useState('')
  const create = useCreateLog()
  const setActive = useSetAtom(activeLogIdAtom)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const me = useQuery({ queryKey: ['me-name'], queryFn: async () => (await supabase.auth.getUser()).data.user?.user_metadata?.display_name as string | undefined })

  // Someone who opened a coach's invite link and then signed up is sent back to it.
  useEffect(() => {
    const code = pendingInvite.get()
    if (code) void navigate({ to: '/invite/$code', params: { code } })
  }, [navigate])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <header>
        <p className="text-sm font-medium tracking-wide text-primary uppercase">Baseline</p>
        <h1 className="mt-1 text-5xl leading-none">Set up your log</h1>
        <p className="mt-3 text-muted-foreground">
          This is your training notebook. You can invite your coach from Settings. They can read it and add notes,
          and your entries stay yours to edit.
        </p>
      </header>

      <form className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate({ name: name.trim(), withStarter: true }, {
            onSuccess: (id) => { setActive(id); void navigate({ to: '/overview' }) },
          })
        }}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="log-name">Name your log</Label>
          <Input id="log-name" required maxLength={80} placeholder="e.g. Tunde’s training" value={name}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" size="lg" disabled={!name.trim() || create.isPending}>
          {create.isPending ? 'Creating…' : 'Create my log'}
        </Button>
      </form>

      <details className="group rounded-lg border px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium marker:text-muted-foreground">
          I’m a coach
        </summary>
        <p className="mt-3 text-muted-foreground">
          Send this link to your players. Each one signs up and gets a log with you as their coach. They appear on your Players page.
        </p>
        <div className="mt-3"><InvitePlayerPanel coachName={me.data ?? ''} /></div>
        <Button type="button" variant="outline" size="sm" className="mt-3"
          onClick={() => { void qc.invalidateQueries({ queryKey: ['logs'] }); void qc.invalidateQueries({ queryKey: ['memberships'] }) }}>
          A player has joined: check now
        </Button>
        <p className="mt-4 text-muted-foreground">
          A player already sent you their coach link instead? Open it while signed in and tap “Join as their coach”.
          You can also create your own log above if you train as well.
        </p>
      </details>

      <button type="button" className="self-start text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => void supabase.auth.signOut().then(() => navigate({ to: '/login' }))}>
        Sign out
      </button>
    </main>
  )
}
