import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Printer } from 'lucide-react'
import { useMemo } from 'react'
import { z } from 'zod'
import { useLog } from '@/components/log-context'
import { ReportView } from '@/components/report-view'
import { PageHeader, Skeleton } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { rowsQuery } from '@/data/queries'
import { PERIODS, buildReport } from '@/domain/report'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/report')({
  validateSearch: z.object({ period: z.enum(['month', 'quarter', 'all']).optional() }),
  component: ReportPage,
})

function ReportPage() {
  const { log, isCoach, playerName } = useLog()
  const { period = 'month' } = Route.useSearch()
  const sessions = useQuery(rowsQuery('sessions', log.id))
  const goals = useQuery(rowsQuery('goals', log.id))
  const drills = useQuery(rowsQuery('drills', log.id))
  const notes = useQuery(rowsQuery('coach_notes', log.id))
  const matches = useQuery(rowsQuery('matches', log.id))
  const ready = [sessions, goals, drills, notes, matches].every((q) => q.isSuccess)

  const report = useMemo(
    () => ready ? buildReport({ sessions: sessions.data!, goals: goals.data!, drills: drills.data!, notes: notes.data!, matches: matches.data! }, period) : null,
    [ready, period, sessions.data, goals.data, drills.data, notes.data, matches.data],
  )

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Progress report" eyebrow={isCoach ? playerName : 'A one-page summary you can print or send'}>
          <Button onClick={() => window.print()}><Printer /> Print or save as PDF</Button>
        </PageHeader>
        <div role="tablist" aria-label="Period" className="mb-6 inline-flex rounded-lg border p-0.5">
          {PERIODS.map((p) => (
            <Link key={p.id} to="/report" search={{ period: p.id }} replace role="tab" aria-selected={period === p.id}
              className={cn('rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors md:py-1.5',
                period === p.id ? 'bg-accent text-accent-foreground' : 'hover:text-foreground')}>
              {p.label}
            </Link>
          ))}
        </div>
      </div>
      {report ? <ReportView playerName={playerName === 'the player' ? log.name : playerName} report={report} /> : <Skeleton className="h-96 w-full rounded-xl" />}
      <p className="mt-4 text-xs text-muted-foreground print:hidden">
        “Print or save as PDF” opens your browser’s print box. Choose “Save as PDF” as the printer to get a file you can send.
      </p>
    </>
  )
}
