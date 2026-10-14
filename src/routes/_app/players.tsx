import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { addDays } from 'date-fns'
import { AlertCircle, Copy, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { FeedbackForm } from '@/components/feedback'
import { MoneySummary, PaymentLine } from '@/components/payments'
import { useLog } from '@/components/log-context'
import { DayGroups, OccurrenceRow } from '@/components/schedule'
import { ListSkeleton, PageHeader, Section } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { moneyQuery, myPlayersQuery, scheduleQuery } from '@/data/queries'
import { heldSessions, standing } from '@/domain/payments'
import { attentionFor, endsAt, isoDate, occurrences } from '@/domain/schedule'
import { agoLabel } from '@/domain/stats'
import { askPlayerMessage, whatsappTextUrl } from '@/lib/invite'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/players')({ component: Players })

const STALE_DAYS = 7

function Players() {
  const { selectLog, log } = useLog()
  const navigate = useNavigate()
  const { data: players = [], isPending, error } = useQuery(myPlayersQuery())
  const sched = useQuery(scheduleQuery(null))
  const money = useQuery(moneyQuery(null))

  const openLog = (logId: string) => { selectLog(logId); void navigate({ to: '/overview' }) }
  const nameOf = new Map(players.map((p) => [p.log_id, p.player_name || 'Unnamed player']))

  // Only the logs I coach. A coach may also keep a log of their own.
  const mine = new Set(players.map((p) => p.log_id))
  const slots = (sched.data?.slots ?? []).filter((s) => mine.has(s.log_id))
  const overrides = (sched.data?.overrides ?? []).filter((o) => mine.has(o.log_id))

  const now = new Date()
  const today = isoDate(now)
  const all = occurrences(slots, overrides, addDays(now, -7), 15)
  const upcoming = all.filter((o) => endsAt(o) >= now)
  const todays = upcoming.filter((o) => o.date === today)
  const later = upcoming.filter((o) => o.date > today && o.date <= isoDate(addDays(now, 7)))
  const past = all.filter((o) => endsAt(o) < now)

  // Each player's running balance, from their deal, their payments and what actually took place.
  const standings = new Map(players.map((p) => {
    const mine = (money.data?.arrangements ?? []).filter((a) => a.log_id === p.log_id)
    const ownSlots = slots.filter((x) => x.log_id === p.log_id)
    const ownOverrides = overrides.filter((x) => x.log_id === p.log_id)
    return [p.log_id, mine.length ? standing(mine, (money.data?.payments ?? []).filter((x) => x.log_id === p.log_id),
      (a) => heldSessions(ownSlots, ownOverrides, a.start_date, now, a.ended_on)) : null] as const
  }))
  const withDeals = [...standings.values()].filter((x) => x != null)

  const rows = players
    .map((p) => ({ p, reasons: attentionFor(p, past, STALE_DAYS, now) }))
    .sort((a, b) => b.reasons.length - a.reasons.length || a.p.player_name.localeCompare(b.p.player_name))
  const needAttention = rows.filter((r) => r.reasons.length).length

  const row = (o: (typeof all)[number]) => (
    <OccurrenceRow occ={o} title={nameOf.get(o.logId) ?? 'Player'} showPrep onOpenLog={() => openLog(o.logId)} />
  )

  return (
    <>
      <PageHeader
        eyebrow={`${players.length} ${players.length === 1 ? 'player' : 'players'}${needAttention ? ` · ${needAttention} to look at` : ''}`}
        title="Players" />
      {error && <p className="text-sm text-destructive">Could not load your players: {error.message}</p>}
      {!isPending && !error && players.length === 0 && <FirstPlayer />}
      {isPending && <ListSkeleton rows={4} />}

      {players.length > 0 && withDeals.length > 0 && <MoneySummary standings={withDeals} />}

      {players.length > 0 && (
        <>
          <Section title="Today" className="border-t-0 pt-0"
            hint={slots.length === 0 ? 'Add each player’s usual times from their Schedule page and your day will build itself here.' : undefined}>
            {todays.length ? <DayGroups items={todays} render={row} skipToday />
              : slots.length > 0 && <p className="text-sm text-muted-foreground">Nothing else on today.</p>}
          </Section>

          {later.length > 0 && (
            <Section title="Rest of the week" hint="Tap a time for what each player last wrote, plus cancel and move.">
              <DayGroups items={later} render={row} />
            </Section>
          )}
        </>
      )}

      {players.length > 0 && (
        <Section title="Your players">
          <ul className="divide-y rounded-lg border">
            {rows.map(({ p, reasons }) => (
              <li key={p.log_id}>
                <button type="button" onClick={() => openLog(p.log_id)} aria-current={p.log_id === log.id ? 'true' : undefined}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.player_name || 'Unnamed player'}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {p.last_session ? `Last session ${agoLabel(p.last_session).toLowerCase()}` : 'No sessions logged yet'}
                    </span>
                    {p.unseen_notes > 0 && (
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {p.unseen_notes === 1 ? 'Your last note has not been seen yet' : `${p.unseen_notes} notes not seen yet`}
                      </span>
                    )}
                    {standings.get(p.log_id) && <PaymentLine s={standings.get(p.log_id)!} />}
                    {reasons.map((r) => (
                      <span key={r} className={cn('mt-0.5 flex items-center gap-1 text-sm text-destructive')}>
                        <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {r}
                      </span>
                    ))}
                  </span>
                  <span className="tabular text-right text-sm">
                    <span className="font-display text-2xl leading-none">{p.avg_recent ?? '–'}</span>
                    <span className="block text-xs text-muted-foreground">avg feel</span>
                  </span>
                  <span className="tabular w-14 text-right text-sm">
                    <span className="font-display text-2xl leading-none">{p.session_count}</span>
                    <span className="block text-xs text-muted-foreground">sessions</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Players who need a look are listed first: nothing logged since a session, no log for {STALE_DAYS} days, or an entry you haven’t answered.
          </p>
        </Section>
      )}

      <Section title="Tell us what to fix" hint="Something confusing or missing? It goes straight to the person building Baseline.">
        <FeedbackForm />
      </Section>
    </>
  )
}

/** What a coach with no players yet sees: three steps and a message ready to send. */
function FirstPlayer() {
  const message = askPlayerMessage(window.location.origin)
  const steps = [
    ['Ask a player to sign up', 'Send them this message. It has the sign-up link.'],
    ['They send you their coach link', 'From their Settings, one tap on WhatsApp.'],
    ['Open it and tap “Join this log as coach”', 'Make sure you are signed in first. They appear here straight away.'],
  ]
  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-3xl">Add your first player</h2>
      <ol className="mt-5 flex flex-col gap-4">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-3.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border font-display text-lg text-primary">{i + 1}</span>
            <span><span className="block font-medium">{title}</span><span className="text-sm text-muted-foreground">{body}</span></span>
          </li>
        ))}
      </ol>
      <p className="mt-6 rounded-lg bg-muted/60 p-3.5 text-sm text-muted-foreground">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={whatsappTextUrl(message)} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })}>
          <MessageCircle /> Send on WhatsApp
        </a>
        <Button type="button" size="lg" variant="outline"
          onClick={() => void navigator.clipboard.writeText(message).then(() => toast.success('Message copied'), () => toast.error('Copy failed'))}>
          <Copy /> Copy message
        </Button>
      </div>
    </div>
  )
}
