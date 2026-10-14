import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Copy, MessageCircle, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FeedbackForm } from '@/components/feedback'
import { useLog } from '@/components/log-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { ConfirmButton, PageHeader, Section } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLeaveLog, useRemoveCoach, useRotateInvite } from '@/data/queries'
import { inviteMessage, whatsappUrl } from '@/lib/invite'
import { setView } from '@/lib/role'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app/settings')({ component: Settings })

function Settings() {
  const { log, user, members, isPlayer, playerName } = useLog()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const rotate = useRotateInvite(log.id)
  const leave = useLeaveLog(log.id, user.id)
  const removeCoach = useRemoveCoach(log.id)

  const me = members.find((m) => m.user_id === user.id)
  const [myName, setMyName] = useState<string | null>(null)
  const saveName = useMutation({
    mutationFn: async (display_name: string) => {
      const { error } = await supabase.from('profiles').update({ display_name }).eq('id', user.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Name updated')
      void qc.invalidateQueries({ queryKey: ['members'] })
      void qc.invalidateQueries({ queryKey: ['players'] })
    },
  })

  const link = `${window.location.origin}/join/${log.invite_code}`
  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(() => toast.success('Link copied'), () => toast.error('Copy failed. Select the link and copy it by hand.'))

  let first = true
  const top = () => { const t = first; first = false; return t ? 'border-t-0 pt-0' : undefined }

  return (
    <>
      <PageHeader title="Settings" />

      {isPlayer && (
        <Section title="Invite your coach" className={top()}
          hint="Anyone with this link can join your log as a coach. Send it only to the person who trains you.">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <a href={whatsappUrl(link)} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })}>
                <MessageCircle /> Send on WhatsApp
              </a>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button type="button" size="lg" variant="outline"
                  onClick={() => void navigator.share({ title: 'Baseline', text: inviteMessage(link) }).catch(() => undefined)}>
                  <Share2 /> Share
                </Button>
              )}
            </div>
            <Label htmlFor="invite-link" className="sr-only">Coach invite link</Label>
            <div className="flex gap-2">
              <Input id="invite-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" onClick={() => void copy(link)}><Copy /> Copy</Button>
            </div>
            <ConfirmButton variant="ghost" size="sm" className="self-start" armedLabel="Tap again to cancel the old link"
              onConfirm={() => rotate.mutate(undefined, { onSuccess: () => toast.success('New link created. The old one no longer works.') })}>
              Make a new link
            </ConfirmButton>
          </div>
        </Section>
      )}

      <Section title="Your coach" className={top()}
        hint={isPlayer ? 'Coaches can read your log and add notes. They cannot change your entries.' : `You are a coach in ${playerName}’s log.`}>
        {members.some((m) => m.role === 'coach') ? (
          <ul className="divide-y">
            {members.filter((m) => m.role === 'coach').map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate">{m.profiles?.display_name || 'Unnamed'}{m.user_id === user.id && <span className="text-muted-foreground"> (you)</span>}</span>
                {isPlayer && (
                  <ConfirmButton variant="ghost" size="xs" armedLabel="Tap again to remove"
                    onConfirm={() => removeCoach.mutate(m.user_id, { onSuccess: () => toast.success('Coach removed') })}>
                    Remove
                  </ConfirmButton>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No coach yet. Send the invite link above.</p>}
      </Section>

      <Section title="Your name" hint="Your coach sees this on your page.">
        <form className="flex items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); const v = (myName ?? me?.profiles?.display_name ?? '').trim(); if (v) saveName.mutate(v) }}>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="my-name" className="sr-only">Your name</Label>
            <Input id="my-name" maxLength={80} value={myName ?? me?.profiles?.display_name ?? ''} onChange={(e) => setMyName(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">Save</Button>
        </form>
      </Section>

      <Section title="Tell us what to fix" hint="Baseline is new. If something confuses you or you wish it did more, say so here. It goes straight to the person building it.">
        <FeedbackForm />
      </Section>

      <Section title="Appearance">
        <ThemeToggle />
      </Section>

      <Section title="Account" className="pb-0">
        <p className="mb-3 text-sm text-muted-foreground">Signed in as {user.email}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void setView('coach').then(() => navigate({ to: '/start' }), (e: Error) => toast.error(e.message))}>
            Switch to coach view
          </Button>
          <Button variant="outline" onClick={() => void supabase.auth.signOut().then(() => { qc.clear(); return navigate({ to: '/login' }) })}>
            Sign out
          </Button>
          {!isPlayer && (
            <ConfirmButton variant="ghost" armedLabel="Tap again to stop coaching this player"
              onConfirm={() => leave.mutate(undefined, { onSuccess: () => { toast.success('You left this log'); void navigate({ to: '/overview' }) } })}>
              Stop coaching {playerName}
            </ConfirmButton>
          )}
        </div>
        {!isPlayer && <p className="mt-2 text-xs text-muted-foreground">You lose access to this log. {playerName} keeps everything.</p>}
      </Section>
    </>
  )
}
