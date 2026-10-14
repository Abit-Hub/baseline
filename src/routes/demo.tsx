import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { MoneyTab } from '@/components/demo/money-tab'
import { NoteBox } from '@/components/demo/note-box'
import { PlayerPage, type Seg } from '@/components/demo/player-page'
import { PlayersTab } from '@/components/demo/players-tab'
import { ScheduleTab } from '@/components/demo/schedule-tab'
import { DemoShell } from '@/components/demo/shell'
import { TodayTab } from '@/components/demo/today'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { playerInviteMessage, whatsappTextUrl } from '@/lib/invite'
import { useDemo } from '@/lib/demo-state'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/demo')({
  validateSearch: z.object({
    tab: z.enum(['today', 'players', 'money', 'schedule']).optional(),
    player: z.string().optional(),
    seg: z.enum(['summary', 'sessions', 'money', 'notes']).optional(),
  }),
  component: Demo,
})

function Demo() {
  const d = useDemo()
  const { tab = 'today', player, seg = 'summary' } = Route.useSearch()
  const navigate = useNavigate()
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  useEffect(() => { document.title = 'Coach demo · Baseline' }, [])

  const openPlayer = (id: string, s?: Seg) => void navigate({ to: '/demo', search: { tab: 'players', player: id, seg: s } })
  const askNote = (id: string) => setNoteFor(id)
  const link = `${typeof window === 'undefined' ? '' : window.location.origin}/invite/your-link`

  return (
    <DemoShell tab={player ? 'players' : tab}
      onAddNote={() => setNoteFor(player ?? d.rows.find((r) => r.reasons.length)?.p.log_id ?? d.data.players[0].id)}
      onInvite={() => setInviting(true)}>
      {player ? <PlayerPage d={d} id={player} seg={seg} askNote={askNote} setSeg={(s) => void navigate({ to: '/demo', search: { tab: 'players', player, seg: s }, replace: true })} />
        : tab === 'players' ? <PlayersTab d={d} openPlayer={openPlayer} onInvite={() => setInviting(true)} />
          : tab === 'money' ? <MoneyTab d={d} openPlayer={openPlayer} />
            : tab === 'schedule' ? <ScheduleTab d={d} openPlayer={openPlayer} />
              : <TodayTab d={d} openPlayer={openPlayer} askNote={askNote} />}

      <div className="mt-10 rounded-lg bg-muted/60 p-5 text-center">
        <p className="font-display text-2xl">Like what you see?</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Create an account, send your invite link to a player, and this is your real week.</p>
        <Link to="/login" search={{ mode: 'up', role: 'coach' }} className={cn(buttonVariants(), 'mt-4')}>Create your account</Link>
      </div>

      <NoteBox players={d.data.players} playerId={noteFor} onClose={() => setNoteFor(null)}
        onSave={(id, note) => { d.addNote(id, note); setNoteFor(null) }} />

      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-normal">Invite a player</DialogTitle>
            <DialogDescription>In the real app this is your own link. A player who opens it signs up and gets a log with you as their coach.</DialogDescription>
          </DialogHeader>
          <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Sample invite link" />
          <a href={whatsappTextUrl(playerInviteMessage('your coach', link))} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })}>
            <MessageCircle /> Send on WhatsApp
          </a>
        </DialogContent>
      </Dialog>
    </DemoShell>
  )
}
