import { Link } from '@tanstack/react-router'
import { useAtom } from 'jotai'
import { BookOpen, CalendarDays, Flag, ListChecks, MessageSquarePlus, NotebookPen, Plus, Settings, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLog } from '@/components/log-context'
import { LogSwitcher } from '@/components/log-switcher'
import { NoteDialog } from '@/components/note-dialog'
import { SessionDialog } from '@/components/session-dialog'
import { Button } from '@/components/ui/button'
import { noteDialogAtom, sessionEditorAtom } from '@/state/atoms'

const linkBase =
  'inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
const linkActive = { className: 'bg-accent text-accent-foreground hover:text-accent-foreground' }

export function AppShell({ children }: { children: ReactNode }) {
  const { log, isPlayer, isCoach, coachesAnyone } = useLog()
  const [, setEditor] = useAtom(sessionEditorAtom)
  const [, setNoteOpen] = useAtom(noteDialogAtom)

  const nav = [
    ...(coachesAnyone ? [{ to: '/players', label: 'Players', Icon: Users, exact: false }] : []),
    { to: '/overview', label: 'Overview', Icon: BookOpen, exact: true },
    { to: '/sessions', label: 'Sessions', Icon: NotebookPen, exact: false },
    { to: '/schedule', label: 'Schedule', Icon: CalendarDays, exact: false },
    { to: '/drills', label: 'Drills', Icon: ListChecks, exact: false },
    { to: '/goals', label: 'Goals', Icon: Flag, exact: false },
    { to: '/settings', label: 'Settings', Icon: Settings, exact: false },
  ] as const

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to="/overview" className="flex items-baseline gap-2">
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

      <main className="mx-auto max-w-3xl px-4 py-8 pb-28 md:pb-16">{children}</main>

      <nav aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
        {nav.map(({ to, label, Icon, exact }) => (
          <Link key={to} to={to} activeOptions={{ exact }} activeProps={linkActive}
            className={`${linkBase} flex-col gap-0.5 rounded-none py-2 text-[10px]`}>
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
