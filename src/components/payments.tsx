import { format, parseISO } from 'date-fns'
import { MessageCircle, Wallet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ConfirmButton } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { arrangementLabel, naira, needsLook, standingLine, statementText, type Payment, type Standing } from '@/domain/payments'
import { formatTime, type Occurrence } from '@/domain/schedule'
import { whatsappTextUrl } from '@/lib/invite'
import { digits, withCommas } from '@/lib/money'
import { cn } from '@/lib/utils'

/** The money line under a player's name. */
export function PaymentLine({ s }: { s: Standing }) {
  return (
    <span className={cn('mt-0.5 flex items-center gap-1.5 text-sm', needsLook(s) ? 'text-foreground' : 'text-muted-foreground')}>
      <Wallet className="size-3.5 shrink-0" aria-hidden />
      <span>{standingLine(s)}{s.pending > 0 && <span className="text-primary"> · {naira(s.pending)} to confirm</span>}</span>
    </span>
  )
}

/** Three numbers across the top of a coach's Players page. */
export function MoneySummary({ standings }: { standings: Standing[] }) {
  const owed = standings.reduce((sum, s) => sum + s.owed, 0)
  const pending = standings.reduce((sum, s) => sum + s.pending, 0)
  const owing = standings.filter((s) => s.owed > 0).length
  const low = standings.filter((s) => s.finished || s.left === 1).length
  const items: [string, string, string, boolean][] = [
    ['Owed to you', naira(owed), owing ? `${owing} player${owing === 1 ? '' : 's'}` : 'all paid up', owed > 0],
    ['To confirm', naira(pending), pending ? 'players say they paid' : 'nothing waiting', pending > 0],
    ['Running low', String(low), 'bundles almost used', false],
  ]
  return (
    <dl className="mb-8 grid grid-cols-3 gap-4 rounded-xl border bg-card p-4 sm:p-5">
      {items.map(([label, value, hint, strong]) => (
        <div key={label}>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
          <dd className={cn('tabular mt-1 font-display text-3xl leading-none sm:text-4xl', strong && 'text-primary')}>{value}</dd>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      ))}
    </dl>
  )
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={cn('tabular mt-1 font-display text-3xl leading-none', strong && 'text-primary')}>{value}</dd>
    </div>
  )
}

/**
 * One player's agreement, progress and payment history. The coach records and confirms
 * payments and says which sessions did not happen. The player can say "I've paid".
 */
export function PaymentsBlock({ name, s, payments, recent, canManage, actions, busy, onConfirm, onRecord, onRemove, onToggleSession }: {
  name: string
  s: Standing
  payments: Payment[]
  /** The latest sessions of the current arrangement, newest first. */
  recent: Occurrence[]
  canManage: boolean
  /** Buttons for changing the arrangement. */
  actions?: ReactNode
  busy?: boolean
  onConfirm: (id: string) => void
  /** The coach records money received. The player records "I've paid". */
  onRecord: (amount: number) => void
  onRemove: (id: string) => void
  onToggleSession: (o: Occurrence) => void
}) {
  const [amount, setAmount] = useState('')
  const a = s.active
  if (!a) return null
  const value = Number(digits(amount))
  const used = a.sessions ? Math.min(1, s.used / a.sessions) : 0
  const sorted = [...payments].sort((x, y) => y.paid_on.localeCompare(x.paid_on))

  return (
    <div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm">{a.kind === 'package' ? 'Bundle of sessions' : 'Pay per session'} · <span className="font-medium">{arrangementLabel(a)}</span></p>
        {a.kind === 'package' && a.sessions != null && (
          <div className="mt-3">
            <div className="h-2.5 rounded-full bg-muted" role="img" aria-label={`${s.used} of ${a.sessions} sessions used`}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${used * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {s.used} of {a.sessions} used{s.left != null && s.left > 0 ? ` · ${s.left} left` : ''}{s.finished ? ' · finished' : ''} · counted since {format(parseISO(a.start_date), 'd MMM')}
            </p>
          </div>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-4">
          <Figure label="Paid" value={naira(s.paid)} />
          <Figure label={a.kind === 'package' ? 'Bundle price' : 'Sessions so far'} value={naira(s.cost)} />
          {s.owed === 0 && s.ahead > 0
            ? <Figure label="Ahead" value={naira(s.ahead)} />
            : <Figure label="Owed" value={naira(s.owed)} strong={s.owed > 0} />}
        </dl>
        {actions && <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">{actions}</div>}
      </div>

      {recent.length > 0 && (
        <div className="mt-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Sessions counted</p>
          {canManage && <p className="mb-1 text-xs text-muted-foreground">Only sessions that took place count. Tap “Didn’t happen” for a rain-off or a no-show.</p>}
          <ul className="divide-y text-sm">
            {recent.map((o) => (
              <li key={o.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="tabular w-24 shrink-0 text-muted-foreground">{format(parseISO(o.date), 'EEE d MMM')}</span>
                <span className={cn('flex-1', o.cancelled && 'text-muted-foreground line-through')}>{formatTime(o.start)}</span>
                <span className="text-xs text-muted-foreground">{o.cancelled ? 'Not counted' : 'Counted'}</span>
                {canManage && <Button size="xs" variant="ghost" disabled={busy} onClick={() => onToggleSession(o)}>{o.cancelled ? 'Undo' : 'Didn’t happen'}</Button>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sorted.length > 0 && (
        <ul className="mt-3 divide-y text-sm">
          {sorted.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className="tabular w-16 shrink-0 text-muted-foreground">{format(parseISO(p.paid_on), 'd MMM')}</span>
              <span className="tabular flex-1 font-medium">{naira(p.amount)}</span>
              {p.pending ? (
                canManage ? (
                  <>
                    <span className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">{name} says paid</span>
                    <Button size="xs" disabled={busy} onClick={() => onConfirm(p.id)}>Confirm received</Button>
                  </>
                ) : <span className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">Waiting for your coach to confirm</span>
              ) : <span className="text-xs text-muted-foreground">Received</span>}
              {(canManage || p.pending) && (
                <ConfirmButton variant="ghost" size="xs" armedLabel="Tap again" onConfirm={() => onRemove(p.id)}>Remove</ConfirmButton>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (value > 0) { onRecord(value); setAmount('') } }}>
        <div className="flex min-w-36 flex-1 flex-col gap-1.5">
          <label htmlFor="pay-amount" className="text-sm font-medium">{canManage ? 'Record a payment' : 'Tell your coach you paid'}</label>
          <Input id="pay-amount" inputMode="numeric" placeholder="₦ amount" value={withCommas(amount)} onChange={(e) => setAmount(digits(e.target.value))} />
        </div>
        <Button type="submit" variant="outline" disabled={busy || !(value > 0)}>{canManage ? 'Add' : 'I’ve paid'}</Button>
        {canManage && (
          <a href={whatsappTextUrl(statementText(name, s))} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'ghost' })}>
            <MessageCircle /> Send statement
          </a>
        )}
      </form>
    </div>
  )
}
