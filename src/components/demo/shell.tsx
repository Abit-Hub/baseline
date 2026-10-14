import { Link } from '@tanstack/react-router'
import { CalendarCheck, CalendarDays, MessageSquarePlus, UserPlus, Users, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Wordmark } from '@/components/wordmark'
import { cn } from '@/lib/utils'

export type DemoTab = 'today' | 'players' | 'money' | 'schedule'

const TABS = [
  { id: 'today', label: 'Today', Icon: CalendarCheck },
  { id: 'players', label: 'Players', Icon: Users },
  { id: 'money', label: 'Money', Icon: Wallet },
  { id: 'schedule', label: 'Schedule', Icon: CalendarDays },
] as const

const linkBase = 'inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors'

/** The coach demo's frame: four tabs, one main action, and a small account menu. */
export function DemoShell({ tab, onAddNote, onInvite, children }: { tab: DemoTab; onAddNote: () => void; onInvite: () => void; children: ReactNode }) {
  const item = (id: DemoTab, extra: string) => cn(linkBase, extra, tab === id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')
  return (
    <div className="min-h-svh">
      <div className="sticky top-0 z-30 border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
          <span className="font-medium">Sample data. Nothing here is saved.</span>
          <Link to="/login" search={{ mode: 'up', role: 'coach' }} className={cn(buttonVariants({ size: 'xs', variant: 'secondary' }), 'ml-auto')}>Create your account</Link>
        </div>
      </div>

      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to="/demo"><Wordmark className="text-2xl" /></Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            {TABS.map(({ id, label }) => (
              <Link key={id} to="/demo" search={{ tab: id }} className={item(id, 'px-2.5 py-1.5')}>{label}</Link>
            ))}
          </nav>
          <Button size="sm" className="ml-auto" onClick={onAddNote}><MessageSquarePlus /> Add note</Button>
          <details className="relative">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full border bg-card text-sm font-medium [&::-webkit-details-marker]:hidden" aria-label="Account menu">C</summary>
            <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border bg-popover p-1 text-sm shadow-lg">
              <button type="button" onClick={(e) => { e.currentTarget.closest('details')?.removeAttribute('open'); onInvite() }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left hover:bg-accent"><UserPlus className="size-4" /> Invite a player</button>
              <p className="px-3 py-2 text-xs text-muted-foreground">Your profile, your invite link and a switch to player view live here in the real app.</p>
              <Link to="/" className="block rounded-md px-3 py-2.5 hover:bg-accent">Back to site</Link>
            </div>
          </details>
        </div>
      </header>

      <main className="paper-top relative mx-auto max-w-3xl px-4 py-8 pb-28 md:pb-16">{children}</main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {TABS.map(({ id, label, Icon }) => (
          <Link key={id} to="/demo" search={{ tab: id }} className={item(id, 'flex-col gap-0.5 rounded-none py-2.5 text-[11px]')}>
            <Icon className="size-5" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
