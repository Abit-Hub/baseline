import { PaymentLine, MoneySummary } from '@/components/payments'
import { PageHeader, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { naira } from '@/domain/payments'
import type { Demo } from '@/lib/demo-state'

/** Who owes, who has paid, whose bundle is running out. */
export function MoneyTab({ d, openPlayer }: { d: Demo; openPlayer: (id: string, seg?: 'money') => void }) {
  const rows = d.data.players.map((p) => ({ p, m: d.money.get(p.id)! })).sort((a, b) => b.m.s.owed - a.m.s.owed || b.m.s.pending - a.m.s.pending)
  return (
    <>
      <PageHeader eyebrow="Payments" title="Money" />
      <MoneySummary standings={rows.map((r) => r.m.s)} />
      <Section title="Players" className="border-t-0 pt-0" hint="Tap a player to record a payment or send a statement.">
        <ul className="divide-y rounded-lg border">
          {rows.map(({ p, m }) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3.5">
              <button type="button" onClick={() => openPlayer(p.id, 'money')} className="min-w-0 flex-1 text-left">
                <span className="block font-medium">{p.name}</span>
                <PaymentLine s={m.s} />
              </button>
              <span className="tabular text-right">
                <span className="font-display text-2xl leading-none">{m.s.owed > 0 ? naira(m.s.owed) : '–'}</span>
                <span className="block text-xs text-muted-foreground">owed</span>
              </span>
              {m.s.pending > 0 && <Button size="sm" onClick={() => d.confirmPending(p.id)}>Confirm</Button>}
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
