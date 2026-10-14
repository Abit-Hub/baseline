import { useNavigate } from '@tanstack/react-router'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateLog } from '@/data/queries'
import { pendingInvite } from '@/lib/pending-invite'
import { setView } from '@/lib/role'
import { supabase } from '@/lib/supabase'
import { activeLogIdAtom } from '@/state/atoms'
import { Wordmark } from '@/components/wordmark'

/** Everyone starts as a player. Coaches get their role by joining a player's log through an invite link. */
export function Onboarding() {
  const [name, setName] = useState('')
  const create = useCreateLog()
  const setActive = useSetAtom(activeLogIdAtom)
  const navigate = useNavigate()

  // Someone who opened a coach's invite link and then signed up is sent back to it.
  useEffect(() => {
    const code = pendingInvite.get()
    if (code) void navigate({ to: '/invite/$code', params: { code } })
  }, [navigate])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <header>
        <Wordmark className="text-3xl" />
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

      <div className="rounded-lg border px-4 py-3 text-sm">
        <p className="font-medium">Are you a coach?</p>
        <p className="mt-1 text-muted-foreground">Switch to the coach view to invite players and see them all in one place. You don’t need a log of your own.</p>
        <Button type="button" variant="outline" size="sm" className="mt-3"
          onClick={() => void setView('coach').then(() => navigate({ to: '/start' }))}>
          Open the coach view
        </Button>
      </div>

      <button type="button" className="self-start text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => void supabase.auth.signOut().then(() => navigate({ to: '/login' }))}>
        Sign out
      </button>
    </main>
  )
}
