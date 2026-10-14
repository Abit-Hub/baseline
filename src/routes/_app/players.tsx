import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { addDays } from 'date-fns'
import { AlertCircle, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { FeedbackForm } from '@/components/feedback'
import { InvitePlayerPanel } from '@/components/invite-player'
import { MoneySummary, PaymentLine } from '@/components/payments'
import { useLog } from '@/components/log-context'
import { DayGroups, OccurrenceRow } from '@/components/schedule'
import { ListSkeleton, PageHeader, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { moneyQuery, myPlayersQuery, scheduleQuery } from '@/data/queries'
import { heldSessions, standing } from '@/domain/payments'
import { attentionFor, endsAt, isoDate, occurrences } from '@/domain/schedule'
import { agoLabel } from '@/domain/stats'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/players')({ component: Players })

const STALE_DAYS = 7

function Players() {
  const { selectLog, log, nameOf, user } = useLog()
  const myName = nameOf(user.id) === 'Someone' ? '' : nameOf(user.id)
  const [inviting, setInviting] = useState(false)
  const navigate = useNavigate()
  const { data: players = [], isPending, error } = useQuery(myPlayersQuery())
  const sched = useQuery(scheduleQuery(null))
  const money = useQuery(moneyQuery(null))

  const openLog = (logId: string, hash?: string) => { selectLog(logId); void navigate({ to: '/overview', hash }) }
  const playerNames = new Map(players.map((p) => [p.log_id, p.player_name || 'Unnamed player']))

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
    <OccurrenceRow occ={o} title={playerNames.get(o.logId) ?? 'Player'} showPrep onOpenLog={() => openLog(o.logId)} />
  )

  return (
    <>
      <PageHeader
        eyebrow={`${players.length} ${players.length === 1 ? 'player' : 'players'}${needAttention ? ` · ${needAttention} to look at` : ''}`}
        title="Players">
        {players.length > 0 && <Button onClick={() => setInviting(true)}><UserPlus /> Invite a player</Button>}
      </PageHeader>
      {error && <p className="text-sm text-destructive">Could not load your players: {error.message}</p>}
      {!isPending && !error && players.length === 0 && <FirstPlayer coachName={myName} />}
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
                  className={cn('flex w-full items-center gap-4 px-4 pt-3.5 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50', standings.get(p.log_id) ? 'pb-1.5' : 'pb-3.5')}>
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
                {standings.get(p.log_id) && (
                  <button type="button" onClick={() => openLog(p.log_id, 'payments')} aria-label={`Payments for ${p.player_name}`}
                    className="block w-full px-4 pb-3.5 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50">
                    <PaymentLine s={standings.get(p.log_id)!} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Players who need a look are listed first: nothing logged since a session, no log for {STALE_DAYS} days, or an entry you haven’t answered.
          </p>
        </Section>
      )}

      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-normal">Invite a player</DialogTitle>
            <DialogDescription>Send this link. They sign up, and their log is made with you as their coach.</DialogDescription>
          </DialogHeader>
          <InvitePlayerPanel coachName={myName} />
        </DialogContent>
      </Dialog>

      <Section title="Tell us what to fix" hint="Something confusing or missing? It goes straight to the person building Baseline.">
        <FeedbackForm />
      </Section>
    </>
  )
}

/** What a coach with no players yet sees: their invite link and what happens next. */
function FirstPlayer({ coachName }: { coachName: string }) {
  const steps = [
    ['Send your invite link', 'On WhatsApp, to any player you train.'],
    ['They sign up', 'Their log is made for them, with you as their coach.'],
    ['They appear here', 'Add their training times and payments from their Overview.'],
  ]
  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-3xl">Invite your first player</h2>
      <ol className="mt-5 flex flex-col gap-4">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-3.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border font-display text-lg text-primary">{i + 1}</span>
            <span><span className="block font-medium">{title}</span><span className="text-sm text-muted-foreground">{body}</span></span>
          </li>
        ))}
      </ol>
      <div className="mt-6"><InvitePlayerPanel coachName={coachName} /></div>
      <p className="mt-5 text-xs text-muted-foreground">A player can also send you their own coach link from their Settings. Open it while signed in and tap “Join as their coach”.</p>
    </div>
  )
}
