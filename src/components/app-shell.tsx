import { Link, useLocation } from '@tanstack/react-router'
import { useAtom } from 'jotai'
import { ArrowLeft, BookOpen, CalendarDays, ListChecks, MessageSquarePlus, NotebookPen, Plus, Settings, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLog } from '@/components/log-context'
import { LogSwitcher } from '@/components/log-switcher'
import { NoteDialog } from '@/components/note-dialog'
import { OfflineBanner } from '@/components/offline-banner'
import { SessionDialog } from '@/components/session-dialog'
import { Button } from '@/components/ui/button'
import { noteDialogAtom, sessionEditorAtom } from '@/state/atoms'

const linkBase =
  'inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
const linkActive = { className: 'bg-accent text-accent-foreground hover:text-accent-foreground' }

export function AppShell({ children }: { children: ReactNode }) {
  const { log, isPlayer, isCoach, coachesAnyone, playerName } = useLog()
  const path = useLocation({ select: (l) => l.pathname })
  const [, setEditor] = useAtom(sessionEditorAtom)
  const [, setNoteOpen] = useAtom(noteDialogAtom)

  const nav = [
    ...(coachesAnyone ? [{ to: '/players', label: 'Players', Icon: Users, exact: false }] : []),
    { to: '/overview', label: 'Overview', Icon: BookOpen, exact: true },
    { to: '/sessions', label: 'Sessions', Icon: NotebookPen, exact: false },
    { to: '/schedule', label: 'Schedule', Icon: CalendarDays, exact: false },
    { to: '/plan', label: 'Plan', Icon: ListChecks, exact: false },
    { to: '/settings', label: 'Settings', Icon: Settings, exact: false },
  ] as const

  return (
    <div className="min-h-svh">
      <OfflineBanner />
      <header className="sticky top-0 z-20 border-b print:hidden bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to={coachesAnyone ? '/players' : '/overview'} className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none">Baseline</span>
          </Link>
          <LogSwitcher />
          <span className="hidden max-w-40 truncate text-sm text-muted-foreground lg:inline">
            {!coachesAnyone && log.name}
          </span>
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map(({ to, label, exact }) => (
              <Link key={to} to={to} activeOptions={{ exact }} activeProps={linkActive}
                className={`${linkBase} px-2.5 py-1.5`}>
                {label}
              </Link>
            ))}
          </nav>
          {isPlayer && (
            <Button size="sm" className="ml-auto md:ml-2" onClick={() => setEditor({ open: true, session: null })}>
              <Plus /> Log session
            </Button>
          )}
          {isCoach && (
            <Button size="sm" className="ml-auto md:ml-2" onClick={() => setNoteOpen(true)}>
              <MessageSquarePlus /> Add note
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-28 md:pb-16 print:max-w-none print:p-0">
        {isCoach && path !== '/players' && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm print:hidden">
            <span className="min-w-0 truncate">Viewing <span className="font-medium">{playerName}</span></span>
            <Link to="/players" className="inline-flex shrink-0 items-center gap-1 font-medium text-accent-foreground underline-offset-4 hover:underline">
              <ArrowLeft className="size-3.5" aria-hidden /> All players
            </Link>
          </div>
        )}
        {children}
      </main>

      <nav aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid border-t print:hidden bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
        {nav.map(({ to, label, Icon, exact }) => (
          <Link key={to} to={to} activeOptions={{ exact }} activeProps={linkActive}
            className={`${linkBase} flex-col gap-0.5 rounded-none py-2 text-[11px]`}>
            <Icon className="size-5" />
            <span className="max-w-full truncate px-0.5">{label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>

      <SessionDialog />
      <NoteDialog />
    </div>
  )
}
