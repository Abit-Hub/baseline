import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { useSetAtom } from 'jotai'
import { NotebookPen } from 'lucide-react'
import { NoteList } from '@/components/coach-notes'
import { GetStarted } from '@/components/get-started'
import { useLog } from '@/components/log-context'
import { PaymentsSection } from '@/components/payments-section'
import { SessionPrompt } from '@/components/session-prompt'
import { EmptyState, OverviewSkeleton, PageHeader, RatingPips, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { rowsQuery, scheduleQuery } from '@/data/queries'
import { dayLabel, endsAt, occurrences, timeRange } from '@/domain/schedule'
import { agoLabel, sortSessions } from '@/domain/stats'
import { useNow } from '@/lib/use-now'
import { sessionEditorAtom } from '@/state/atoms'

export const Route = createFileRoute('/_app/overview')({ component: Home })

/** The player's home: what is next, what the coach said, what to work on. Everything else is one tap away. */
function Home() {
  const { log, members } = useLog()
  const setEditor = useSetAtom(sessionEditorAtom)
  const sessions = useQuery(rowsQuery('sessions', log.id))
  const notes = useQuery(rowsQuery('coach_notes', log.id))
  const schedule = useQuery(scheduleQuery(log.id))
  const now = useNow()
  const next = occurrences(schedule.data?.slots ?? [], schedule.data?.overrides ?? [], now, 14).find((o) => !o.cancelled && endsAt(o) >= now)

  const loading = sessions.isPending || schedule.isPending
  const list = sortSessions(sessions.data ?? [])
  const latest = list[0]
  const unseen = (notes.data ?? []).filter((n) => !n.acknowledged_at).length
  const sessionDates = new Map(list.map((x) => [x.id, format(parseISO(x.session_date), 'd MMM')]))
  const fix = list.find((x) => x.fix)

  return (
    <>
      <PageHeader eyebrow={format(new Date(), 'EEEE d MMMM')} title="Home" />

      {loading ? <OverviewSkeleton /> : (
        <div className="mb-8 rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Next session</p>
              {next ? (
                <>
                  <Link to="/schedule" className="mt-1 block font-display text-4xl leading-none underline-offset-4 hover:underline sm:text-5xl">{dayLabel(next.date)}</Link>
                  <p className="tabular mt-2 text-sm">{timeRange(next.start, next.end)}{next.place && <span className="text-muted-foreground"> · {next.place}</span>}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 font-display text-3xl leading-none">Nothing scheduled</p>
                  <p className="mt-2 text-sm">
                    <Link to="/schedule" className="font-medium text-primary underline underline-offset-4">Add your training times</Link>
                    <span className="text-muted-foreground"> so you and your coach can see what is next.</span>
                  </p>
                </>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Last session</p>
              {latest ? (
                <p className="mt-2 flex items-center gap-2.5 sm:justify-end"><span className="text-sm">{agoLabel(latest.session_date)}</span><RatingPips value={latest.rating} /></p>
              ) : <p className="mt-2 text-sm text-muted-foreground">Nothing logged yet</p>}
            </div>
          </div>
        </div>
      )}

      {sessions.isSuccess && schedule.isSuccess && (
        <SessionPrompt logId={log.id} slots={schedule.data.slots} overrides={schedule.data.overrides} sessions={sessions.data} now={now} />
      )}

      {sessions.isSuccess && schedule.isSuccess && (
        <GetStarted hasTimes={schedule.data.slots.length > 0} hasSession={list.length > 0}
          hasCoach={members.some((m) => m.role === 'coach')} onLogSession={() => setEditor({ open: true, session: null })} />
      )}

      {!loading && list.length === 0 && (
        <EmptyState title="Nothing logged yet" icon={NotebookPen}
          action={<Button onClick={() => setEditor({ open: true, session: null })}>Log your first session</Button>}>
          Add a session right after you leave the court, while it is fresh.
        </EmptyState>
      )}

      {(notes.data?.length ?? 0) > 0 && (
        <Section id="coach-notes" title="From your coach" hint={unseen > 0 ? `${unseen} new` : undefined} className="border-t-0 pt-0">
          <NoteList notes={(notes.data ?? []).slice(0, 3)} showSession={sessionDates} />
        </Section>
      )}

      {fix && (
        <Section title="Work on next" hint={`From ${agoLabel(fix.session_date).toLowerCase()}`} className={(notes.data?.length ?? 0) > 0 ? undefined : 'border-t-0 pt-0'}>
          <blockquote className="border-l-2 border-primary pl-4">
            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{fix.fix}</p>
          </blockquote>
        </Section>
      )}

      {!loading && <PaymentsSection logId={log.id} />}

      {!loading && list.length > 0 && (
        <p className="border-t pt-5 text-sm">
          <Link to="/progress" className="font-medium text-primary underline underline-offset-4">See your progress</Link>
          <span className="text-muted-foreground"> · your chart, goals and drills</span>
        </p>
      )}
    </>
  )
}
