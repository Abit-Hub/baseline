import { useQuery } from '@tanstack/react-query'
import { Copy, MessageCircle, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { coachInviteQuery, useRotateCoachInvite } from '@/data/queries'
import { playerInviteMessage, whatsappTextUrl } from '@/lib/invite'

/** A coach's own invite link, with WhatsApp, share and copy. A player who accepts gets a log with this coach in it. */
export function InvitePlayerPanel({ coachName }: { coachName: string }) {
  const invite = useQuery(coachInviteQuery())
  const rotate = useRotateCoachInvite()
  if (invite.isError) return <p className="text-sm text-destructive">Could not make your link: {invite.error.message}</p>
  if (!invite.data) return <p className="text-sm text-muted-foreground">Making your link…</p>

  const link = `${window.location.origin}/invite/${invite.data}`
  const message = playerInviteMessage(coachName || 'your coach', link)
  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(() => toast.success('Copied'), () => toast.error('Copy failed. Select the link and copy it by hand.'))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <a href={whatsappTextUrl(message)} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })}>
          <MessageCircle /> Send on WhatsApp
        </a>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button type="button" size="lg" variant="outline"
            onClick={() => void navigator.share({ title: 'Baseline', text: message }).catch(() => undefined)}>
            <Share2 /> Share
          </Button>
        )}
      </div>
      <Label htmlFor="player-invite-link" className="sr-only">Your invite link</Label>
      <div className="flex gap-2">
        <Input id="player-invite-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        <Button type="button" variant="outline" onClick={() => void copy(link)}><Copy /> Copy</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The same link works for every player. Each one signs up, and their log is made with you as their coach.
      </p>
      <ConfirmButton variant="ghost" size="sm" className="self-start" armedLabel="Tap again to cancel the old link"
        onConfirm={() => rotate.mutate(undefined, { onSuccess: () => toast.success('New link made. The old one no longer works.') })}>
        Make a new link
      </ConfirmButton>
    </div>
  )
}
