import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useAtom, useSetAtom } from 'jotai'
import { CalendarCheck, CalendarDays, MessageSquarePlus, Settings, UserPlus, Users, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { useCoach } from '@/components/coach/coach-context'
import { InvitePlayerPanel } from '@/components/invite-player'
import { OfflineBanner } from '@/components/offline-banner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CoachNoteDialog } from '@/components/coach/note-dialog'
import { profileQuery } from '@/data/queries'
import { setView } from '@/lib/role'
import { cn } from '@/lib/utils'
import { coachNoteAtom, inviteDialogAtom } from '@/state/atoms'
import { Wordmark } from '@/components/wordmark'

const TABS = [
  { to: '/coach', label: 'Today', Icon: CalendarCheck, exact: true },
  { to: '/coach/players', label: 'Players', Icon: Users, exact: false },
  { to: '/coach/money', label: 'Money', Icon: Wallet, exact: false },
  { to: '/coach/schedule', label: 'Schedule', Icon: CalendarDays, exact: false },
] as const

const linkBase = 'inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors'

/** The coach's frame: four tabs, one main action, and a small account menu. */
export function CoachShell({ children }: { children: ReactNode }) {
  const { user } = useCoach()
  const path = useLocation({ select: (l) => l.pathname })
  const navigate = useNavigate()
  const setNote = useSetAtom(coachNoteAtom)
  const [inviting, setInviting] = useAtom(inviteDialogAtom)
  const profile = useQuery(profileQuery(user.id))
  const name = profile.data?.display_name || user.email || 'You'

  const active = (to: string, exact: boolean) => (exact ? path === to : path.startsWith(to))
  const cls = (to: string, exact: boolean, extra: string) =>
    cn(linkBase, extra, active(to, exact) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')

  const toPlayer = () => {
    setView('player').then(() => navigate({ to: '/start' }), (e: Error) => toast.error(e.message))
  }

  return (
    <div className="min-h-svh">
      <OfflineBanner />
      <header className="sticky top-0 z-20 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to="/coach"><Wordmark className="text-2xl" /></Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            {TABS.map(({ to, label, exact }) => <Link key={to} to={to} className={cls(to, exact, 'px-2.5 py-1.5')}>{label}</Link>)}
          </nav>
          <Button size="sm" className="ml-auto" onClick={() => setNote({ open: true, logId: null })}><MessageSquarePlus /> Add note</Button>
          <details className="relative">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full border bg-card text-sm font-medium [&::-webkit-details-marker]:hidden" aria-label="Account menu">
              {name.slice(0, 1).toUpperCase()}
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-60 rounded-lg border bg-popover p-1 text-sm shadow-lg">
              <p className="truncate px-3 py-2 text-xs text-muted-foreground">{name}</p>
              <button type="button" onClick={(e) => { e.currentTarget.closest('details')?.removeAttribute('open'); setInviting(true) }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left hover:bg-accent"><UserPlus className="size-4" /> Invite a player</button>
              <Link to="/coach/settings" onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-accent"><Settings className="size-4" /> Settings</Link>
              <button type="button" onClick={toPlayer} className="block w-full rounded-md px-3 py-2.5 text-left hover:bg-accent">Switch to player view</button>
            </div>
          </details>
        </div>
      </header>

      <main className="paper-top relative mx-auto max-w-3xl px-4 py-8 pb-28 md:pb-16 print:max-w-none print:p-0"><div key={path} className="page-in">{children}</div></main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
        {TABS.map(({ to, label, Icon, exact }) => (
          <Link key={to} to={to} className={cls(to, exact, 'flex-col gap-0.5 rounded-none py-2.5 text-[11px]')}>
            <Icon className="size-5" /> {label}
          </Link>
        ))}
      </nav>

      <CoachNoteDialog />
      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-normal">Invite a player</DialogTitle>
            <DialogDescription>Send this link. They sign up, and their log is made with you as their coach.</DialogDescription>
          </DialogHeader>
          <InvitePlayerPanel coachName={profile.data?.display_name ?? ''} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
