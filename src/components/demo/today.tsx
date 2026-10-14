import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { MessageCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { OccRow } from '@/components/demo/occ-row'
import { DayGroups } from '@/components/schedule'
import { PageHeader, Section } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { naira, statementText } from '@/domain/payments'
import { whatsappTextUrl } from '@/lib/invite'
import type { Demo } from '@/lib/demo-state'

interface Item { key: string; text: ReactNode; action: ReactNode }

/** The coach's home: what needs him now, then today's sessions. */
export function TodayTab({ d, openPlayer, askNote }: { d: Demo; openPlayer: (id: string, seg?: 'money') => void; askNote: (id: string) => void }) {
  const items: Item[] = []
  for (const p of d.data.players) {
    const m = d.money.get(p.id)!
    if (m.s.pending > 0) items.push({
      key: `pay-${p.id}`, text: <><b>{p.name}</b> says they paid {naira(m.s.pending)}</>,
      action: <Button size="sm" onClick={() => d.confirmPending(p.id)}>Confirm</Button>,
    })
  }
  for (const { p, reasons } of d.rows) for (const r of reasons) items.push({
    key: `${p.log_id}-${r}`, text: <><b>{p.player_name}</b>: {r}</>,
    action: r.startsWith('New entry')
      ? <Button size="sm" onClick={() => askNote(p.log_id)}>Write a note</Button>
      : <Button size="sm" variant="outline" onClick={() => openPlayer(p.log_id)}>Open</Button>,
  })
  for (const p of d.data.players) {
    const m = d.money.get(p.id)!
    if (m.s.finished) items.push({
      key: `fin-${p.id}`, text: <><b>{p.name}</b>’s bundle is finished{m.s.owed > 0 ? ` · ${naira(m.s.owed)} owed` : ''}</>,
      action: <a href={whatsappTextUrl(statementText(p.name, m.s))} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'sm', variant: 'outline' })}><MessageCircle /> Send statement</a>,
    })
    else if (m.s.left === 1) items.push({
      key: `low-${p.id}`, text: <><b>{p.name}</b> has 1 session left</>,
      action: <Button size="sm" variant="outline" onClick={() => openPlayer(p.id, 'money')}>Open</Button>,
    })
  }
  for (const s of d.summaries) if (s.unseen_notes > 0) items.push({
    key: `seen-${s.log_id}`, text: <><b>{s.player_name}</b> has not seen your last note</>,
    action: <Button size="sm" variant="outline" onClick={() => openPlayer(s.log_id)}>Open</Button>,
  })
  const shown = items.slice(0, 6)

  return (
    <>
      <PageHeader eyebrow={format(d.now, 'EEEE d MMMM')} title="Today" />

      <Section title={shown.length ? `Needs you · ${items.length}` : 'Needs you'} className="border-t-0 pt-0"
        hint={shown.length ? undefined : 'Nothing is waiting for you.'}>
        <ul className="divide-y rounded-lg border">
          {shown.map((i) => (
            <li key={i.key} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{i.text}</span>
              {i.action}
            </li>
          ))}
        </ul>
        {items.length > shown.length && <p className="mt-2 text-xs text-muted-foreground">And {items.length - shown.length} more. Open a player to see everything.</p>}
      </Section>

      <Section title="Today’s sessions">
        {d.todays.length
          ? <DayGroups items={d.todays} skipToday render={(o) => <OccRow d={d} o={o} onOpen={openPlayer} />} />
          : <p className="text-sm text-muted-foreground">Nothing else on today.</p>}
        <Link to="/demo" search={{ tab: 'schedule' }} className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">See the whole week</Link>
      </Section>

      <div className="rounded-lg border border-dashed bg-accent/40 p-4 text-sm">
        <p className="font-medium">Try it</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Confirm Tunde’s payment from the list above.</li>
          <li>Open Amaka, then Money, to record what she still owes.</li>
          <li>Mark a session as not happening in Schedule, and watch the bundle count change.</li>
        </ol>
      </div>
    </>
  )
}
