import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PaymentsBlock } from '@/components/payments'
import { RatingChart } from '@/components/rating-chart'
import { ReportView } from '@/components/report-view'
import { RatingPips } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { naira, statementText } from '@/domain/payments'
import { buildReport } from '@/domain/report'
import { dayLabel, timeRange } from '@/domain/schedule'
import { sortSessions } from '@/domain/stats'
import { whatsappTextUrl } from '@/lib/invite'
import type { Demo } from '@/lib/demo-state'
import { cn } from '@/lib/utils'

export type Seg = 'summary' | 'sessions' | 'money' | 'notes'
const SEGS: { id: Seg; label: string }[] = [
  { id: 'summary', label: 'Summary' }, { id: 'sessions', label: 'Sessions' }, { id: 'money', label: 'Money' }, { id: 'notes', label: 'Notes' },
]

/** One player, one page. A short header and four plain sections, instead of the player's own app. */
export function PlayerPage({ d, id, seg, setSeg, askNote }: { d: Demo; id: string; seg: Seg; setSeg: (s: Seg) => void; askNote: (id: string) => void }) {
  const player = d.data.players.find((p) => p.id === id)
  const [report, setReport] = useState(false)
  const sessions = sortSessions(d.data.sessions.filter((s) => s.log_id === id))
  const notes = d.notes.filter((n) => n.log_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at))
  const m = d.money.get(id)
  const summary = d.summaries.find((s) => s.log_id === id)
  const next = d.week.find((o) => o.logId === id && !o.cancelled)
  const goals = d.data.goals.filter((g) => g.log_id === id)
  const reportData = useMemo(() => buildReport({
    sessions: d.data.sessions.filter((s) => s.log_id === id), goals: goals, drills: [],
    notes: d.notes.filter((n) => n.log_id === id), matches: d.data.matches.filter((x) => x.log_id === id),
  }, 'quarter'), [d.data, d.notes, id, goals])
  if (!player || !m || !summary) return null

  return (
    <>
      <Link to="/demo" search={{ tab: 'players' }} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Players
      </Link>
      <header className="mb-6">
        <h1 className="text-5xl leading-none">{player.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {next ? <>Next: <span className="text-foreground">{dayLabel(next.date)}, {timeRange(next.start, next.end)}</span></> : 'No session coming up'}
        </p>
      </header>

      <dl className="mb-5 grid grid-cols-3 gap-4 border-y py-5">
        {[
          ['Average feel', String(summary.avg_recent ?? '–')],
          ['Sessions', String(summary.session_count)],
          ['Balance', m.s.owed > 0 ? naira(m.s.owed) : m.s.ahead > 0 ? `${naira(m.s.ahead)} ahead` : 'Paid up'],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
            <dd className={cn('tabular mt-1 font-display text-3xl leading-none', label === 'Balance' && m.s.owed > 0 && 'text-primary')}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => askNote(id)}>Add note</Button>
        <a href={whatsappTextUrl(statementText(player.name, m.s))} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
          <MessageCircle /> Send statement
        </a>
        <Button variant="outline" onClick={() => setReport(true)}>Progress report</Button>
      </div>

      <div role="tablist" aria-label="Player" className="mb-6 inline-flex rounded-lg border p-0.5">
        {SEGS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={seg === s.id} onClick={() => setSeg(s.id)}
            className={cn('rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors md:py-1.5', seg === s.id ? 'bg-accent text-accent-foreground' : 'hover:text-foreground')}>
            {s.label}
          </button>
        ))}
      </div>

      {seg === 'summary' && (
        <div className="flex flex-col gap-7">
          <RatingChart newestFirst={sessions} />
          {sessions.find((s) => s.fix) && (
            <blockquote className="border-l-2 border-primary pl-4">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Work on next, from {player.name}</p>
              <p className="mt-1">{sessions.find((s) => s.fix)!.fix}</p>
            </blockquote>
          )}
          {goals.some((g) => !g.done) && (
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Open goals</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">{goals.filter((g) => !g.done).map((g) => <li key={g.id}>{g.text}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {seg === 'sessions' && (
        <ul className="divide-y">
          {sessions.slice(0, 6).map((s) => (
            <li key={s.id} className="py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="tabular w-16 shrink-0 text-muted-foreground">{format(parseISO(s.session_date), 'd MMM')}</span>
                <span className="flex-1 font-medium">{s.focus.join(', ')}</span>
                <RatingPips value={s.rating} />
              </div>
              {s.fix && <p className="mt-1 pl-[4.75rem] text-muted-foreground">Work on next: {s.fix}</p>}
            </li>
          ))}
        </ul>
      )}

      {seg === 'money' && (
        <PaymentsBlock name={player.name} s={m.s} payments={m.mine} canManage recent={d.recentFor(id)}
          onToggleSession={(o) => (o.cancelled ? d.restore(o) : d.cancel(o))}
          onConfirm={d.confirmPayment} onRemove={d.removePayment} onRecord={(amount) => d.record(id, amount)} />
      )}

      {seg === 'notes' && (
        <div className="flex flex-col gap-4">
          {notes.map((n) => (
            <blockquote key={n.id} className="border-l-2 border-primary pl-3 text-sm">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">{format(parseISO(n.created_at), 'd MMM')}</span>
              <p className="mt-0.5">{n.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">{n.acknowledged_at ? `Seen ${format(parseISO(n.acknowledged_at), 'd MMM')}` : 'Not seen yet'}</p>
            </blockquote>
          ))}
          <Button variant="outline" className="self-start" onClick={() => askNote(id)}>Add a note</Button>
        </div>
      )}

      <Dialog open={report} onOpenChange={setReport}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Progress report for {player.name}</DialogTitle>
            <DialogDescription>A one-page summary you can print or send to a player or a parent.</DialogDescription>
          </DialogHeader>
          <ReportView playerName={player.name} report={reportData} />
        </DialogContent>
      </Dialog>
    </>
  )
}
