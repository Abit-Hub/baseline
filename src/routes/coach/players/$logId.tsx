import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { useSetAtom } from 'jotai'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { z } from 'zod'
import { useCoach } from '@/components/coach/coach-context'
import { NoteComposer, NoteList } from '@/components/coach-notes'
import { LogProvider, useLog } from '@/components/log-context'
import { PaymentsSection } from '@/components/payments-section'
import { DrillsPanel } from '@/components/plan/drills-panel'
import { GoalsPanel } from '@/components/plan/goals-panel'
import { RatingChart } from '@/components/rating-chart'
import { ResultBadge } from '@/components/matches'
import { SchedulePanel } from '@/components/schedule-panel'
import { RatingPips, Skeleton } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { myPlayersQuery, rowsQuery, scheduleQuery } from '@/data/queries'
import { naira, statementText } from '@/domain/payments'
import { dayLabel, endsAt, occurrences, timeRange } from '@/domain/schedule'
import { sortSessions } from '@/domain/stats'
import { whatsappTextUrl } from '@/lib/invite'
import { useStanding } from '@/lib/use-standing'
import { cn } from '@/lib/utils'
import { coachNoteAtom } from '@/state/atoms'

const SEGS = [
  { id: 'summary', label: 'Summary' }, { id: 'sessions', label: 'Sessions' }, { id: 'money', label: 'Money' },
  { id: 'notes', label: 'Notes' }, { id: 'schedule', label: 'Schedule' }, { id: 'plan', label: 'Plan' },
] as const

export const Route = createFileRoute('/coach/players/$logId')({
  validateSearch: z.object({ seg: z.enum(['summary', 'sessions', 'money', 'notes', 'schedule', 'plan']).optional() }),
  component: PlayerRoute,
})

function PlayerRoute() {
  const { logId } = Route.useParams()
  const { user, logs, roles } = useCoach()
  const log = logs.find((l) => l.id === logId)
  if (!log || roles[logId] !== 'coach') return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="font-display text-2xl">Player not found</p>
      <p className="mt-1 text-sm text-muted-foreground">They may have removed you, or the link is old.</p>
      <Link to="/coach/players" className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">Back to players</Link>
    </div>
  )
  // The pages for one player (notes, payments, schedule, plan) already read from the log in context.
  return (
    <LogProvider log={log} logs={logs} roles={roles} user={user}>
      <PlayerPage />
    </LogProvider>
  )
}

function PlayerPage() {
  const { log, playerName } = useLog()
  const { seg = 'summary' } = Route.useSearch()
  const setNote = useSetAtom(coachNoteAtom)
  const players = useQuery(myPlayersQuery())
  const summary = players.data?.find((p) => p.log_id === log.id)
  const sessions = useQuery(rowsQuery('sessions', log.id))
  const goals = useQuery(rowsQuery('goals', log.id))
  const matches = useQuery(rowsQuery('matches', log.id))
  const notes = useQuery(rowsQuery('coach_notes', log.id))
  const sched = useQuery(scheduleQuery(log.id))
  const s = useStanding(log.id)

  const name = summary?.player_name || playerName
  const list = sortSessions(sessions.data ?? [])
  const now = new Date()
  const next = occurrences(sched.data?.slots ?? [], sched.data?.overrides ?? [], now, 14).find((o) => !o.cancelled && endsAt(o) >= now)
  const balance = !s ? 'No deal yet' : s.owed > 0 ? naira(s.owed) : s.ahead > 0 ? `${naira(s.ahead)} ahead` : 'Paid up'
  const fix = list.find((x) => x.fix)?.fix
  const open = (goals.data ?? []).filter((g) => !g.done)

  return (
    <>
      <Link to="/coach/players" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Players
      </Link>
      <header className="mb-6">
        <h1 className="text-5xl leading-none">{name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sched.isSuccess ? (next ? <>Next: <span className="text-foreground">{dayLabel(next.date)}, {timeRange(next.start, next.end)}</span></> : 'No session coming up') : ' '}
        </p>
      </header>

      <dl className="mb-5 grid grid-cols-3 gap-4 border-y py-5">
        {[
          ['Average feel', String(summary?.avg_recent ?? '–')],
          ['Sessions', String(summary?.session_count ?? '–')],
          ['Balance', balance],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
            <dd className={cn('tabular mt-1 font-display text-3xl leading-none', label === 'Balance' && s && s.owed > 0 && 'text-primary', label === 'Balance' && !s && 'text-base text-muted-foreground')}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => setNote({ open: true, logId: log.id })}>Add note</Button>
        {s?.active && (
          <a href={whatsappTextUrl(statementText(name, s))} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
            <MessageCircle /> Send statement
          </a>
        )}
        <Link to="/coach/report/$logId" params={{ logId: log.id }} className={buttonVariants({ variant: 'outline' })}>Progress report</Link>
      </div>

      <div role="tablist" aria-label="Player" className="mb-6 flex w-full max-w-full overflow-x-auto rounded-lg border p-0.5 sm:inline-flex sm:w-auto">
        {SEGS.map((x) => (
          <Link key={x.id} to="/coach/players/$logId" params={{ logId: log.id }} search={{ seg: x.id }} replace role="tab" aria-selected={seg === x.id}
            className={cn('shrink-0 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors md:py-1.5', seg === x.id ? 'bg-accent text-accent-foreground' : 'hover:text-foreground')}>
            {x.label}
          </Link>
        ))}
      </div>

      {seg === 'summary' && (
        sessions.isPending ? <Skeleton className="h-48 w-full" /> : (
          <div className="flex flex-col gap-7">
            <RatingChart newestFirst={list} />
            {fix && (
              <blockquote className="border-l-2 border-primary pl-4">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Work on next, from {name}</p>
                <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{fix}</p>
              </blockquote>
            )}
            {open.length > 0 && (
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Open goals</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">{open.map((g) => <li key={g.id}>{g.text}</li>)}</ul>
              </div>
            )}
            {list.length === 0 && <p className="text-sm text-muted-foreground">{name} has not logged a session yet.</p>}
          </div>
        )
      )}

      {seg === 'sessions' && (
        <div className="flex flex-col gap-8">
          {sessions.isPending ? <Skeleton className="h-48 w-full" /> : list.length === 0 ? <p className="text-sm text-muted-foreground">No sessions logged yet.</p> : (
            <ul className="divide-y">
              {list.slice(0, 15).map((x) => (
                <li key={x.id} className="py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="tabular w-16 shrink-0 text-muted-foreground">{format(parseISO(x.session_date), 'd MMM')}</span>
                    <span className="flex-1 font-medium">{x.focus.join(', ') || 'Session'}</span>
                    <RatingPips value={x.rating} />
                  </div>
                  {x.well && <p className="mt-1 pl-[4.75rem] text-muted-foreground">Went well: {x.well}</p>}
                  {x.fix && <p className="mt-1 pl-[4.75rem] text-muted-foreground">Work on next: {x.fix}</p>}
                </li>
              ))}
            </ul>
          )}
          {(matches.data?.length ?? 0) > 0 && (
            <div>
              <h2 className="mb-2 text-2xl">Matches</h2>
              <ul className="divide-y text-sm">
                {matches.data!.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <span className="tabular w-16 shrink-0 text-muted-foreground">{format(parseISO(m.match_date), 'd MMM')}</span>
                    <span className="font-medium">{m.opponent ? `vs ${m.opponent}` : 'Match'}</span>
                    <ResultBadge result={m.result} />
                    {m.score && <span className="tabular text-muted-foreground">{m.score}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {seg === 'money' && <PaymentsSection logId={log.id} bare />}

      {seg === 'notes' && (
        <div className="flex flex-col gap-5">
          {(notes.data?.length ?? 0) > 0 ? <NoteList notes={notes.data ?? []} /> : <p className="text-sm text-muted-foreground">No notes yet.</p>}
          <NoteComposer label={`Write a note for ${name}`} />
        </div>
      )}

      {seg === 'schedule' && <SchedulePanel />}

      {seg === 'plan' && (
        <>
          <GoalsPanel />
          <DrillsPanel />
        </>
      )}
    </>
  )
}
