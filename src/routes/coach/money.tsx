import { Link, createFileRoute } from '@tanstack/react-router'
import { Wallet } from 'lucide-react'
import { MoneySummary, PaymentLine } from '@/components/payments'
import { EmptyState, ListSkeleton, PageHeader, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { useConfirmPayments } from '@/data/queries'
import { naira } from '@/domain/payments'
import type { Standing } from '@/domain/payments'
import { useCoachBoard } from '@/lib/coach-board'

export const Route = createFileRoute('/coach/money')({ component: Money })

/** Who owes, who has paid, whose bundle is running out. */
function Money() {
  const board = useCoachBoard()
  const confirm = useConfirmPayments()
  const withDeals = board.rows.filter((r): r is typeof r & { s: Standing } => r.s != null)
    .sort((a, b) => b.s.owed - a.s.owed || b.s.pending - a.s.pending)
  const without = board.rows.filter((r) => r.s == null)

  return (
    <>
      <PageHeader eyebrow="Payments" title="Money" />
      {board.loading && <ListSkeleton rows={3} />}
      {!board.loading && board.players.length === 0 && (
        <EmptyState title="No players yet" icon={Wallet}>Once a player joins, set up what they pay and it is tracked here.</EmptyState>
      )}
      {withDeals.length > 0 && <MoneySummary standings={withDeals.map((r) => r.s)} />}

      {withDeals.length > 0 && (
        <Section title="Players" className="border-t-0 pt-0" hint="Tap a player to record a payment or send a statement.">
          <ul className="divide-y rounded-lg border">
            {withDeals.map(({ p, s }) => {
              const ids = board.pendingIds.get(p.log_id)
              return (
                <li key={p.log_id} className="flex items-center gap-3 px-4 py-3.5">
                  <Link to="/coach/players/$logId" params={{ logId: p.log_id }} search={{ seg: 'money' }} className="min-w-0 flex-1 text-left">
                    <span className="block font-medium">{p.player_name}</span>
                    <PaymentLine s={s} />
                  </Link>
                  <span className="tabular text-right">
                    <span className="font-display text-2xl leading-none">{s.owed > 0 ? naira(s.owed) : '–'}</span>
                    <span className="block text-xs text-muted-foreground">owed</span>
                  </span>
                  {s.pending > 0 && ids && <Button size="sm" disabled={confirm.isPending} onClick={() => confirm.mutate(ids)}>Confirm</Button>}
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      {without.length > 0 && (
        <Section title="No deal yet" className={withDeals.length ? undefined : 'border-t-0 pt-0'} hint="Set up a bundle or a price per session to start tracking.">
          <ul className="divide-y rounded-lg border">
            {without.map(({ p }) => (
              <li key={p.log_id}>
                <Link to="/coach/players/$logId" params={{ logId: p.log_id }} search={{ seg: 'money' }}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-accent/50">
                  <span className="font-medium">{p.player_name}</span>
                  <span className="text-sm text-primary underline underline-offset-4">Set up payments</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  )
}
