import { useNavigate } from '@tanstack/react-router'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateLog } from '@/data/queries'
import { supabase } from '@/lib/supabase'
import { activeLogIdAtom } from '@/state/atoms'

/** Everyone starts as a player. Coaches get their role by joining a player's log through an invite link. */
export function Onboarding() {
  const [name, setName] = useState('')
  const create = useCreateLog()
  const setActive = useSetAtom(activeLogIdAtom)
  const navigate = useNavigate()

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
          I’m a coach and have an invite link
        </summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Open the link your player sent you, while signed in here.</li>
          <li>Tap “Join this log as coach”.</li>
          <li>Repeat for every player. They all appear on your Players page.</li>
        </ol>
        <p className="mt-3 text-muted-foreground">
          No link yet? Ask the player to open Settings and copy their coach link. You can also create your own log
          above if you train as well.
        </p>
      </details>

      <button type="button" className="self-start text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => void supabase.auth.signOut().then(() => navigate({ to: '/login' }))}>
        Sign out
      </button>
    </main>
  )
}
