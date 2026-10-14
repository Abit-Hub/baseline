import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCoach } from '@/components/coach/coach-context'
import { FeedbackForm } from '@/components/feedback'
import { InvitePlayerPanel } from '@/components/invite-player'
import { ThemeToggle } from '@/components/theme-toggle'
import { PageHeader, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { profileQuery } from '@/data/queries'
import { setView } from '@/lib/role'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/coach/settings')({ component: CoachSettings })

function CoachSettings() {
  const { user } = useCoach()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const profile = useQuery(profileQuery(user.id))
  const [name, setName] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: async (display_name: string) => {
      const { error } = await supabase.from('profiles').update({ display_name }).eq('id', user.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => { toast.success('Name updated'); void qc.invalidateQueries({ queryKey: ['profile'] }); void qc.invalidateQueries({ queryKey: ['members'] }) },
    onError: (e) => toast.error(e.message),
  })
  const value = name ?? profile.data?.display_name ?? ''

  return (
    <>
      <PageHeader title="Settings" />

      <Section title="Invite players" className="border-t-0 pt-0" hint="The same link works for every player. They sign up, and their log is made with you as their coach.">
        <InvitePlayerPanel coachName={profile.data?.display_name ?? ''} />
      </Section>

      <Section title="Your name" hint="Players see this on your notes.">
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (value.trim()) save.mutate(value.trim()) }}>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="coach-name" className="sr-only">Your name</Label>
            <Input id="coach-name" maxLength={80} value={value} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={save.isPending}>Save</Button>
        </form>
      </Section>

      <Section title="Tell us what to fix" hint="Something confusing or missing? It goes straight to the person building Baseline.">
        <FeedbackForm />
      </Section>

      <Section title="Appearance"><ThemeToggle /></Section>

      <Section title="Account" className="pb-0">
        <p className="mb-3 text-sm text-muted-foreground">Signed in as {user.email}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void setView('player').then(() => navigate({ to: '/start' }), (e: Error) => toast.error(e.message))}>
            Switch to player view
          </Button>
          <Button variant="outline" onClick={() => void supabase.auth.signOut().then(() => { qc.clear(); return navigate({ to: '/login' }) })}>Sign out</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Player view is your own training log, if you play as well.</p>
      </Section>
    </>
  )
}
