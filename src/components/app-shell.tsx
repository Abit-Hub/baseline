import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useAtom } from 'jotai'
import { BookOpen, CalendarDays, NotebookPen, Plus, Settings, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { useLog } from '@/components/log-context'
import { OfflineBanner } from '@/components/offline-banner'
import { SessionDialog } from '@/components/session-dialog'
import { Button } from '@/components/ui/button'
import { profileQuery } from '@/data/queries'
import { setView } from '@/lib/role'
import { sessionEditorAtom } from '@/state/atoms'
import { Wordmark } from '@/components/wordmark'

const linkBase =
  'inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
const linkActive = { className: 'bg-accent text-accent-foreground hover:text-accent-foreground' }

const NAV = [
  { to: '/overview', label: 'Home', Icon: BookOpen, exact: true },
  { to: '/sessions', label: 'Log', Icon: NotebookPen, exact: false },
  { to: '/schedule', label: 'Schedule', Icon: CalendarDays, exact: false },
  { to: '/progress', label: 'Progress', Icon: TrendingUp, exact: false },
] as const

/** The player's frame: four tabs, one main action, and a small account menu. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useLog()
  const [, setEditor] = useAtom(sessionEditorAtom)
  const navigate = useNavigate()
  const path = useLocation({ select: (l) => l.pathname })
  const profile = useQuery(profileQuery(user.id))
  const name = profile.data?.display_name || user.email || 'You'
  const close = (e: { currentTarget: HTMLElement }) => e.currentTarget.closest('details')?.removeAttribute('open')

  return (
    <div className="min-h-svh">
      <OfflineBanner />
      <header className="sticky top-0 z-20 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to="/overview"><Wordmark className="text-2xl" /></Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, exact }) => (
              <Link key={to} to={to} activeOptions={{ exact }} activeProps={linkActive} className={`${linkBase} px-2.5 py-1.5`}>{label}</Link>
            ))}
          </nav>
          <Button size="sm" className="ml-auto" onClick={() => setEditor({ open: true, session: null })}>
            <Plus /> Log session
          </Button>
          <details className="relative">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full border bg-card text-sm font-medium [&::-webkit-details-marker]:hidden" aria-label="Account menu">
              {name.slice(0, 1).toUpperCase()}
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-60 rounded-lg border bg-popover p-1 text-sm shadow-lg">
              <p className="truncate px-3 py-2 text-xs text-muted-foreground">{name}</p>
              <Link to="/settings" onClick={close} className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-accent"><Settings className="size-4" /> Settings</Link>
              <button type="button" className="block w-full rounded-md px-3 py-2.5 text-left hover:bg-accent"
                onClick={(e) => { close(e); void setView('coach').then(() => navigate({ to: '/start' }), (err: Error) => toast.error(err.message)) }}>
                Switch to coach view
              </button>
            </div>
          </details>
        </div>
      </header>

      <main className="paper-top relative mx-auto max-w-3xl px-4 py-8 pb-28 md:pb-16 print:max-w-none print:p-0"><div key={path} className="page-in">{children}</div></main>

      <nav aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
        {NAV.map(({ to, label, Icon, exact }) => (
          <Link key={to} to={to} activeOptions={{ exact }} activeProps={linkActive}
            className={`${linkBase} flex-col gap-0.5 rounded-none py-2.5 text-[11px]`}>
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>

      <SessionDialog />
    </div>
  )
}
