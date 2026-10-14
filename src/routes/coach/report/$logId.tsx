import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react'
import { useMemo } from 'react'
import { z } from 'zod'
import { ReportView } from '@/components/report-view'
import { Skeleton } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { myPlayersQuery, rowsQuery } from '@/data/queries'
import { PERIODS, buildReport } from '@/domain/report'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/coach/report/$logId')({
  validateSearch: z.object({ period: z.enum(['month', 'quarter', 'all']).optional() }),
  component: Report,
})

function Report() {
  const { logId } = Route.useParams()
  const { period = 'month' } = Route.useSearch()
  const players = useQuery(myPlayersQuery())
  const sessions = useQuery(rowsQuery('sessions', logId))
  const goals = useQuery(rowsQuery('goals', logId))
  const drills = useQuery(rowsQuery('drills', logId))
  const notes = useQuery(rowsQuery('coach_notes', logId))
  const matches = useQuery(rowsQuery('matches', logId))
  const ready = [sessions, goals, drills, notes, matches].every((q) => q.isSuccess)
  const name = players.data?.find((p) => p.log_id === logId)?.player_name || 'Player'

  const report = useMemo(
    () => ready ? buildReport({ sessions: sessions.data!, goals: goals.data!, drills: drills.data!, notes: notes.data!, matches: matches.data! }, period) : null,
    [ready, period, sessions.data, goals.data, drills.data, notes.data, matches.data],
  )

  return (
    <>
      <div className="print:hidden">
        <Link to="/coach/players/$logId" params={{ logId }} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> {name}
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Period" className="inline-flex rounded-lg border p-0.5">
            {PERIODS.map((p) => (
              <Link key={p.id} to="/coach/report/$logId" params={{ logId }} search={{ period: p.id }} replace role="tab" aria-selected={period === p.id}
                className={cn('rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors md:py-1.5', period === p.id ? 'bg-accent text-accent-foreground' : 'hover:text-foreground')}>
                {p.label}
              </Link>
            ))}
          </div>
          <Button onClick={() => window.print()}><Printer /> Print or save as PDF</Button>
        </div>
      </div>
      {report ? <ReportView playerName={name} report={report} /> : <Skeleton className="h-96 w-full rounded-xl" />}
      <p className="mt-4 text-xs text-muted-foreground print:hidden">“Print or save as PDF” opens your browser’s print box. Choose “Save as PDF” as the printer to get a file you can send.</p>
    </>
  )
}
