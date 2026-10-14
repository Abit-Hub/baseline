import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useLog } from '@/components/log-context'
import { PaymentsBlock } from '@/components/payments'
import { Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { moneyQuery, scheduleQuery, useMoneyActions, useScheduleActions, type ArrangementInput } from '@/data/queries'
import { heldSessions, standing, type Arrangement } from '@/domain/payments'
import { endsAt, occurrences } from '@/domain/schedule'
import { digits, withCommas } from '@/lib/money'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'

/** The Payments block on Overview. The coach manages it. The player sees the same numbers. */
export function PaymentsSection({ logId }: { logId: string }) {
  const { isCoach, playerName } = useLog()
  const money = useQuery(moneyQuery(logId))
  const sched = useQuery(scheduleQuery(logId))
  const actions = useMoneyActions(logId)
  const { setOverride, clearOverride } = useScheduleActions(logId)
  const now = useNow()
  const [dialog, setDialog] = useState<'start' | 'edit' | null>(null)

  // Arriving from a player's money line on the Players page: jump to this section once it exists.
  useEffect(() => {
    if (money.isSuccess && sched.isSuccess && window.location.hash === '#payments') document.getElementById('payments')?.scrollIntoView()
  }, [money.isSuccess, sched.isSuccess])

  const slots = sched.data?.slots ?? []
  const overrides = sched.data?.overrides ?? []
  const arrangements = money.data?.arrangements ?? []
  const s = useMemo(
    () => standing(arrangements, money.data?.payments ?? [], (a: Arrangement) => heldSessions(slots, overrides, a.start_date, now, a.ended_on)),
    [arrangements, money.data?.payments, slots, overrides, now],
  )
  if (!money.isSuccess || !sched.isSuccess) return null
  if (!arrangements.length && !isCoach) return null

  const a = s.active
  const recent = a
    ? occurrences(slots, overrides, parseISO(a.start_date), Math.max(1, differenceInCalendarDays(now, parseISO(a.start_date)) + 1))
        .filter((o) => endsAt(o) < now).sort((x, y) => y.date.localeCompare(x.date) || y.start.localeCompare(x.start)).slice(0, 4)
    : []
  const busy = actions.addPayment.isPending || actions.confirm.isPending || setOverride.isPending || clearOverride.isPending
  const fail = (e: Error) => toast.error(e.message)

  return (
    <Section id="payments" title="Payments"
      hint={isCoach ? `${playerName} sees these numbers too. Sessions are counted from the schedule.` : 'Your coach records payments here. Tap “I’ve paid” after you transfer.'}>
      {a ? (
        <PaymentsBlock name={playerName} s={s} payments={money.data.payments} recent={recent} canManage={isCoach} busy={busy}
          actions={isCoach && (
            <>
              <Button size="sm" variant="outline" onClick={() => setDialog('edit')}>Edit deal</Button>
              <Button size="sm" variant="outline" onClick={() => setDialog('start')}>Start a new deal</Button>
            </>
          )}
          onConfirm={(id) => actions.confirm.mutate(id, { onSuccess: () => toast.success('Payment confirmed'), onError: fail })}
          onRecord={(amount) => actions.addPayment.mutate({ amount, pending: !isCoach }, {
            onSuccess: () => toast.success(isCoach ? 'Payment recorded' : 'Sent. Your coach will confirm it.'), onError: fail,
          })}
          onRemove={(id) => actions.removePayment.mutate(id, { onError: fail })}
          onToggleSession={(o) => o.cancelled && o.overrideId
            ? clearOverride.mutate(o.overrideId, { onError: fail })
            : setOverride.mutate({ slot_id: o.slotId, on_date: o.baseDate, new_date: null, new_start: null, new_end: null }, { onError: fail })} />
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground"><Wallet className="size-5" aria-hidden /></span>
          <p className="font-display text-2xl">Set up payments for {playerName}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">A bundle of any size, like 14 sessions for ₦20,000, or a price per session. Then it tracks what is used and what is owed.</p>
          <Button className="mt-4" onClick={() => setDialog('start')}>Set up payments</Button>
        </div>
      )}

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-normal">{dialog === 'edit' ? 'Edit the deal' : a ? 'Start a new deal' : 'Set up payments'}</DialogTitle>
            <DialogDescription>
              {dialog === 'edit' ? 'Fix a mistake in the current deal. Past payments stay as they are.'
                : a ? 'The current deal ends on the start date. What is owed so far carries over.' : 'What did you and the player agree?'}
            </DialogDescription>
          </DialogHeader>
          {dialog && (
            <DealForm key={dialog} initial={dialog === 'edit' ? a : null} busy={actions.start.isPending || actions.edit.isPending}
              onSubmit={(v) => {
                const done = { onSuccess: () => { toast.success('Saved'); setDialog(null) }, onError: fail }
                if (dialog === 'edit' && a?.id) actions.edit.mutate({ id: a.id, ...v }, done)
                else actions.start.mutate(v, done)
              }} />
          )}
        </DialogContent>
      </Dialog>
    </Section>
  )
}

function DealForm({ initial, busy, onSubmit }: { initial: Arrangement | null; busy: boolean; onSubmit: (v: ArrangementInput) => void }) {
  const [kind, setKind] = useState<'package' | 'per_session'>(initial?.kind ?? 'package')
  const [sessions, setSessions] = useState(initial?.sessions ? String(initial.sessions) : '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [start, setStart] = useState(initial?.start_date ?? format(new Date(), 'yyyy-MM-dd'))
  const n = Number(digits(sessions))
  const p = Number(digits(price))
  const valid = p > 0 && (kind === 'per_session' || n > 0) && Boolean(start)

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit({ kind, sessions: kind === 'package' ? n : null, price: p, start_date: start }) }}>
      <fieldset className="grid grid-cols-2 gap-1.5">
        <legend className="mb-1 text-sm font-medium">How do they pay?</legend>
        {([['package', 'A bundle of sessions'], ['per_session', 'Per session']] as const).map(([k, label]) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
            className={cn('rounded-md border py-2.5 text-sm font-medium transition-colors', kind === k ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
            {label}
          </button>
        ))}
      </fieldset>
      {kind === 'package' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="d-sessions">Sessions in the bundle</Label>
          <Input id="d-sessions" inputMode="numeric" className="w-32" placeholder="e.g. 14" value={sessions} onChange={(e) => setSessions(digits(e.target.value))} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="d-price">{kind === 'package' ? 'Price for the whole bundle (₦)' : 'Price per session (₦)'}</Label>
        <Input id="d-price" inputMode="numeric" placeholder={kind === 'package' ? '30,000' : '3,500'} value={withCommas(price)} onChange={(e) => setPrice(digits(e.target.value))} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="d-start">Counting from</Label>
        <Input id="d-start" type="date" className="w-44" value={start} onChange={(e) => setStart(e.target.value)} />
        <p className="text-xs text-muted-foreground">Sessions that took place from this date count towards the deal.</p>
      </div>
      <Button type="submit" disabled={!valid || busy}>{busy ? 'Saving…' : 'Save'}</Button>
    </form>
  )
}

