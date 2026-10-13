import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { useSetAtom } from 'jotai'
import { NoteComposer, NoteList } from '@/components/coach-notes'
import { GetStarted } from '@/components/get-started'
import { SessionPrompt } from '@/components/session-prompt'
import { useLog } from '@/components/log-context'
import { RatingChart } from '@/components/rating-chart'
import { EmptyState, PageHeader, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { rowsQuery, scheduleQuery } from '@/data/queries'
import { dayLabel, endsAt, occurrences, timeRange } from '@/domain/schedule'
import { agoLabel, countWithin, daysAgo, focusCounts, recentAverage, sortSessions, trend } from '@/domain/stats'
import { useNow } from '@/lib/use-now'
import { sessionEditorAtom } from '@/state/atoms'

export const Route = createFileRoute('/_app/overview')({ component: Overview })

function Overview() {
  const { log, isPlayer, isCoach, playerName, members } = useLog()
  const setEditor = useSetAtom(sessionEditorAtom)
  const sessions = useQuery(rowsQuery('sessions', log.id))
  const drills = useQuery(rowsQuery('drills', log.id))
  const goals = useQuery(rowsQuery('goals', log.id))
  const notes = useQuery(rowsQuery('coach_notes', log.id))
  const schedule = useQuery(scheduleQuery(log.id))
  const nowDate = useNow()
  const next = occurrences(schedule.data?.slots ?? [], schedule.data?.overrides ?? [], nowDate, 14)
    .find((o) => !o.cancelled && endsAt(o) >= nowDate)

  const list = sortSessions(sessions.data ?? [])
  const latest = list[0]
  const avg = recentAverage(list, 5)
  const tr = trend(list)
  const drillsThisWeek = (drills.data ?? []).filter((d) => d.last_practised && daysAgo(d.last_practised) <= 7).length
  const counts = focusCounts(list)
  const topCount = counts[0]?.[1] ?? 1
  const goalsDone = (goals.data ?? []).filter((g) => g.done).length
  const sessionDates = new Map(list.map((x) => [x.id, format(parseISO(x.session_date), 'd MMM')]))

  return (
    <>
      <PageHeader eyebrow={`${isCoach ? `${playerName} · ` : ''}${format(new Date(), 'EEEE d MMMM')}`} title="Overview" />

      {schedule.isSuccess && (next ? (
        <p className="-mt-4 mb-8 text-sm">
          <span className="text-muted-foreground">Next session </span>
          <Link to="/schedule" className="font-medium underline-offset-4 hover:underline">
            {dayLabel(next.date)}, {timeRange(next.start, next.end)}
          </Link>
        </p>
      ) : schedule.data.slots.length === 0 && isCoach && (
        <p className="-mt-4 mb-8 text-sm">
          <Link to="/schedule" className="font-medium text-primary underline underline-offset-4">Add your training times</Link>
          <span className="text-muted-foreground"> so you both can see what is next.</span>
        </p>
      ))}

      {isPlayer && sessions.isSuccess && schedule.isSuccess && (
        <SessionPrompt logId={log.id} slots={schedule.data.slots} overrides={schedule.data.overrides} sessions={sessions.data} now={nowDate} />
      )}

      {isPlayer && sessions.isSuccess && schedule.isSuccess && (
        <GetStarted hasTimes={schedule.data.slots.length > 0} hasSession={list.length > 0}
          hasCoach={members.some((m) => m.role === 'coach')}
          onLogSession={() => setEditor({ open: true, session: null })} />
      )}

      {sessions.isSuccess && list.length === 0 ? (
        <EmptyState title="Nothing logged yet">
          {isPlayer ? (
            <>
              <p>Add a session right after you leave the court, while it is fresh.</p>
              <Button className="mt-4" onClick={() => setEditor({ open: true, session: null })}>
                Log your first session
              </Button>
            </>
          ) : (
            <p>{playerName} has not logged a session yet. You can still leave a note below.</p>
          )}
        </EmptyState>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-y-6 border-y py-6 sm:grid-cols-4">
            <Stat label="Sessions logged" value={String(list.length)} big />
            <Stat label="Average feel, last 5" value={avg ? avg.toFixed(1) : '–'} />
            <Stat label="Against the 3 before"
              value={tr == null ? '–' : `${tr > 0.05 ? '▲' : tr < -0.05 ? '▼' : '='} ${Math.abs(tr).toFixed(1)}`} />
            <Stat label="Drills this week" value={String(drillsThisWeek)}
              hint={latest ? `${countWithin(list, 7)} session${countWithin(list, 7) === 1 ? '' : 's'} this week` : undefined} />
          </dl>

          <Section title="How sessions have felt" className="border-t-0 pt-8">
            <RatingChart newestFirst={list} />
          </Section>

          {latest?.fix && (
            <Section title="Work on next" hint={`From ${agoLabel(latest.session_date).toLowerCase()}`}>
              <Quote label={isPlayer ? 'Your note' : `${playerName}’s note`}>{latest.fix}</Quote>
            </Section>
          )}

          {counts.length > 0 && (
            <Section title="Where the time went">
              <ul className="flex flex-col gap-2.5">
                {counts.map(([name, n]) => (
                  <li key={name} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm">
                    <span>{name}</span>
                    <span className="h-2.5 rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (n / topCount) * 100)}%` }} />
                    </span>
                    <span className="tabular text-right text-muted-foreground">{n}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {(isCoach || (notes.data?.length ?? 0) > 0) && (
        <Section title={isCoach ? 'Your notes for the player' : 'From your coach'}
          hint={isCoach ? 'Visible to the player. Notes on a specific session are added from Sessions.' : undefined}>
          <div className="flex flex-col gap-5">
            {(notes.data?.length ?? 0) > 0 && <NoteList notes={(notes.data ?? []).slice(0, 3)} showSession={sessionDates} />}
            <NoteComposer label="Write a note for the player" />
          </div>
        </Section>
      )}

      {(goals.data?.length ?? 0) > 0 && (
        <Section title="Goals">
          <p className="text-sm text-muted-foreground">{goalsDone} of {goals.data?.length} goals reached.</p>
          <Link to="/plan" search={{ tab: 'goals' }} className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">
            Open goals
          </Link>
        </Section>
      )}
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

function Quote({ label, children }: { label: string; children: string }) {
  return (
    <blockquote className="border-l-2 border-primary pl-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{children}</p>
    </blockquote>
  )
}
