import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useLog } from '@/components/log-context'
import { DrillsPanel } from '@/components/plan/drills-panel'
import { GoalsPanel } from '@/components/plan/goals-panel'
import { RatingChart } from '@/components/rating-chart'
import { EmptyState, PageHeader, Section, Skeleton } from '@/components/ui-bits'
import { rowsQuery } from '@/data/queries'
import { countWithin, daysAgo, focusCounts, recentAverage, sortSessions, trend } from '@/domain/stats'
import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/_app/progress')({
  validateSearch: z.object({ tab: z.enum(['summary', 'goals', 'drills']).optional() }),
  component: Progress,
})

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'goals', label: 'Goals' },
  { id: 'drills', label: 'Drills' },
] as const

/** How it is going: the numbers and chart, then goals and drills. */
function Progress() {
  const { tab = 'summary' } = Route.useSearch()
  return (
    <>
      <PageHeader title="Progress" />
      <div role="tablist" aria-label="Progress" className="mb-8 inline-flex rounded-lg border p-0.5">
        {TABS.map((t) => (
          <Link key={t.id} to="/progress" search={{ tab: t.id }} replace role="tab" aria-selected={tab === t.id}
            className={cn('rounded-md px-5 py-2 text-sm font-medium text-muted-foreground transition-colors md:px-4 md:py-1.5',
              tab === t.id ? 'bg-accent text-accent-foreground' : 'hover:text-foreground')}>
            {t.label}
          </Link>
        ))}
      </div>
      {tab === 'summary' ? <Summary /> : tab === 'goals' ? <GoalsPanel /> : <DrillsPanel />}
    </>
  )
}

function Summary() {
  const { log } = useLog()
  const sessions = useQuery(rowsQuery('sessions', log.id))
  const drills = useQuery(rowsQuery('drills', log.id))
  if (sessions.isPending) return <Skeleton className="h-64 w-full" />
  const list = sortSessions(sessions.data ?? [])
  if (list.length === 0) return (
    <EmptyState title="Nothing to show yet" icon={TrendingUp}>Log a session and your progress shows up here: how sessions felt, and what you spent your time on.</EmptyState>
  )
  const avg = recentAverage(list, 5)
  const tr = trend(list)
  const drillsThisWeek = (drills.data ?? []).filter((d) => d.last_practised && daysAgo(d.last_practised) <= 7).length
  const counts = focusCounts(list)
  const top = counts[0]?.[1] ?? 1

  return (
    <>
      <dl className="grid grid-cols-2 gap-y-6 border-y py-6 sm:grid-cols-4">
        <Stat label="Sessions logged" value={String(list.length)} big />
        <Stat label="Average feel, last 5" value={avg ? avg.toFixed(1) : '–'} />
        <Stat label="Against the 3 before" value={tr == null ? '–' : `${tr > 0.05 ? '▲' : tr < -0.05 ? '▼' : '='} ${Math.abs(tr).toFixed(1)}`} />
        <Stat label="Drills this week" value={String(drillsThisWeek)}
          hint={`${countWithin(list, 7)} session${countWithin(list, 7) === 1 ? '' : 's'} this week`} />
      </dl>

      <Section title="How sessions have felt" className="border-t-0 pt-8"><RatingChart newestFirst={list} /></Section>

      {counts.length > 0 && (
        <Section title="Where the time went">
          <ul className="flex flex-col gap-2.5">
            {counts.map(([name, n]) => (
              <li key={name} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span>{name}</span>
                <span className="h-2.5 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (n / top) * 100)}%` }} /></span>
                <span className="tabular text-right text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Progress report">
        <p className="text-sm text-muted-foreground">A one-page summary of your sessions, matches and goals. Save it as a PDF to send to a parent or a coach.</p>
        <Link to="/report" className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">Open the report</Link>
      </Section>
    </>
  )
}

function Stat({ label, value, hint, big }: { label: string; value: string; hint?: string; big?: boolean }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={`tabular font-display leading-none ${big ? 'mt-1 text-6xl text-primary' : 'mt-2 text-4xl'}`}>{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
