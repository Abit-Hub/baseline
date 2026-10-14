import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { ResultBadge } from '@/components/matches'
import { RatingChart } from '@/components/rating-chart'
import type { Report } from '@/domain/report'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="tabular mt-1 font-display text-5xl leading-none">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t pt-4 pb-6">
      <h2 className="mb-3 text-2xl">{title}</h2>
      {children}
    </section>
  )
}

/** A one-page summary of a player's period. Plain data in, so the demo can show it too. */
export function ReportView({ playerName, report: r }: { playerName: string; report: Report }) {
  const top = r.focus[0]?.[1] ?? 1
  const change = r.change == null ? undefined : `${r.change > 0.05 ? '▲' : r.change < -0.05 ? '▼' : '='} ${Math.abs(r.change).toFixed(1)} on the period before`
  return (
    <article className="print-exact rounded-xl border bg-card p-5 sm:p-8 print:rounded-none print:border-0 print:p-0">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2 border-b pb-5">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Progress report</p>
          <h1 className="mt-1 text-5xl leading-none">{playerName}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{r.rangeLabel}</p>
      </header>

      <dl className="mb-7 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Sessions" value={String(r.sessions.length)} hint={r.drillsPractised ? `${r.drillsPractised} drill${r.drillsPractised === 1 ? '' : 's'} practised` : undefined} />
        <Stat label="Average feel" value={r.avg ? r.avg.toFixed(1) : '–'} hint={change} />
        <Stat label="Matches" value={r.matches.length ? `${r.wins}–${r.losses}` : '–'} hint={r.matches.length ? 'won – lost' : undefined} />
        <Stat label="Goals reached" value={`${r.goalsDone.length}`} hint={r.goalsOpen.length ? `${r.goalsOpen.length} still open` : undefined} />
      </dl>

      {r.sessions.some((s) => s.rating) && (
        <Block title="How sessions have felt"><RatingChart newestFirst={r.sessions} /></Block>
      )}

      {r.focus.length > 0 && (
        <Block title="What was worked on">
          <ul className="flex flex-col gap-2.5">
            {r.focus.map(([name, n]) => (
              <li key={name} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span>{name}</span>
                <span className="h-2.5 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (n / top) * 100)}%` }} /></span>
                <span className="tabular text-right text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {r.matches.length > 0 && (
        <Block title="Matches">
          <ul className="divide-y">
            {r.matches.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <span className="tabular w-24 shrink-0 text-muted-foreground">{format(parseISO(m.match_date), 'd MMM')}</span>
                <span className="font-medium">{m.opponent ? `vs ${m.opponent}` : 'Match'}</span>
                <ResultBadge result={m.result} />
                {m.score && <span className="tabular text-muted-foreground">{m.score}</span>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {(r.goalsDone.length > 0 || r.goalsOpen.length > 0) && (
        <Block title="Goals">
          <ul className="flex flex-col gap-2 text-sm">
            {r.goalsDone.map((g) => (
              <li key={g.id} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> <span><span className="sr-only">Reached: </span>{g.text}</span></li>
            ))}
            {r.goalsOpen.map((g) => (
              <li key={g.id} className="flex items-start gap-2 text-muted-foreground"><span className="mt-1 size-3.5 shrink-0 rounded border" aria-hidden /> <span><span className="sr-only">Open: </span>{g.text}</span></li>
            ))}
          </ul>
        </Block>
      )}

      {(r.notes.length > 0 || r.workOnNext) && (
        <Block title="From the coach and what is next">
          <div className="flex flex-col gap-4">
            {r.notes.map((n) => (
              <blockquote key={n.id} className="border-l-2 border-primary pl-4 text-sm">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">{format(parseISO(n.created_at), 'd MMM')}</p>
                <p className="mt-0.5 whitespace-pre-wrap [overflow-wrap:anywhere]">{n.note}</p>
              </blockquote>
            ))}
            {r.workOnNext && (
              <p className="text-sm"><span className="text-xs tracking-wide text-muted-foreground uppercase">Work on next </span><br />{r.workOnNext}</p>
            )}
          </div>
        </Block>
      )}

      {r.sessions.length === 0 && r.matches.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing was logged in this period. Try a longer one.</p>
      )}

      <footer className="border-t pt-4 text-xs text-muted-foreground">Made with Baseline · {format(new Date(), 'd MMMM yyyy')}</footer>
    </article>
  )
}
