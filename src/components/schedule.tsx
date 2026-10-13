import { useQuery } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { rowsQuery, useScheduleActions, type SlotInput } from '@/data/queries'
import { RATINGS } from '@/domain/constants'
import { WEEKDAYS_SHORT, WEEK_ORDER, dayLabel, hhmm, isoDate, timeRange, type Occurrence } from '@/domain/schedule'
import { agoLabel, sortSessions } from '@/domain/stats'
import type { ScheduleSlot, Session } from '@/domain/types'
import { cn } from '@/lib/utils'

export interface PrepData {
  latest: Session | undefined
  lastNote: string | undefined
  openGoals: string[]
}

/** What a coach wants in front of them before a session: where the player left off. */
export function PrepView({ latest, lastNote, openGoals }: PrepData) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <Fact label={latest ? `Last session · ${agoLabel(latest.session_date).toLowerCase()}${latest.rating ? ` · felt ${RATINGS[latest.rating - 1].toLowerCase()}` : ''}` : 'Last session'}>
        {latest ? (
          <>
            {latest.focus.length > 0 && <span className="text-muted-foreground">{latest.focus.join(', ')}. </span>}
            {latest.fix ? <>Work on next: {latest.fix}</> : latest.well || latest.worked || 'No written notes.'}
          </>
        ) : 'Nothing logged yet.'}
      </Fact>
      {lastNote && <Fact label="Your last note">{lastNote}</Fact>}
      {openGoals.length > 0 && <Fact label="Open goals">{openGoals.join(' · ')}</Fact>}
    </dl>
  )
}

export function PrepCard({ logId }: { logId: string }) {
  const sessions = useQuery(rowsQuery('sessions', logId))
  const notes = useQuery(rowsQuery('coach_notes', logId))
  const goals = useQuery(rowsQuery('goals', logId))
  if (sessions.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>
  return (
    <PrepView
      latest={sortSessions(sessions.data ?? [])[0]}
      lastNote={notes.data?.[0]?.note}
      openGoals={(goals.data ?? []).filter((g) => !g.done).slice(0, 3).map((g) => g.text)} />
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

export interface OccurrenceActions {
  cancel: () => void
  restore: () => void
  move: (v: { date: string; start: string; end: string | null }) => void
  pending?: boolean
}

/** One training time. Tap to open: prep notes, cancel, move. Knows nothing about where data lives. */
export function OccurrenceView({ occ, title, prep, actions, onOpenLog }: {
  occ: Occurrence
  title: string
  prep?: ReactNode
  actions: OccurrenceActions
  onOpenLog?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [moving, setMoving] = useState(false)

  const move = useForm({
    defaultValues: { date: occ.date, start: occ.start, end: occ.end ?? '' },
    onSubmit: ({ value }) => {
      if (!value.date || !value.start) return
      if (value.end && value.end <= value.start) return void toast.error('The end time must be after the start time')
      actions.move({ date: value.date, start: value.start, end: value.end || null })
      setMoving(false)
    },
  })

  return (
    <div className="py-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left">
        <span className={cn('tabular w-36 shrink-0 text-sm', occ.cancelled && 'text-muted-foreground line-through')}>
          {timeRange(occ.start, occ.end)}
        </span>
        <span className={cn('min-w-0 flex-1 truncate font-medium', occ.cancelled && 'text-muted-foreground line-through')}>
          {title}
          {occ.place && <span className="ml-2 font-normal text-muted-foreground">{occ.place}</span>}
        </span>
        {occ.cancelled && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">Cancelled</span>}
        {occ.moved && <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">Moved</span>}
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-4 rounded-md bg-muted/50 p-3">
          {!occ.cancelled && prep}

          {moving ? (
            <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); void move.handleSubmit() }}>
              <move.Field name="date">
                {(f) => <Input aria-label="New date" type="date" className="w-40" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
              </move.Field>
              <move.Field name="start">
                {(f) => <Input aria-label="New start time" type="time" className="w-32" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
              </move.Field>
              <move.Field name="end">
                {(f) => <Input aria-label="New end time (optional)" type="time" className="w-32" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
              </move.Field>
              <Button type="submit" size="sm" disabled={actions.pending}>Save</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMoving(false)}>Back</Button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onOpenLog && <Button size="sm" onClick={onOpenLog}>Open log</Button>}
              {occ.cancelled || occ.moved ? (
                <Button size="sm" variant="outline" disabled={actions.pending} onClick={actions.restore}>Back to the usual time</Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setMoving(true)}>Move</Button>
                  <Button size="sm" variant="outline" disabled={actions.pending} onClick={actions.cancel}>Cancel this one</Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** The real thing: reads prep notes from, and saves changes to, the player's log. */
export function OccurrenceRow({ occ, title, showPrep, onOpenLog }: {
  occ: Occurrence
  title: string
  showPrep?: boolean
  onOpenLog?: () => void
}) {
  const { setOverride, clearOverride } = useScheduleActions(occ.logId)
  const cancelled = { slot_id: occ.slotId, on_date: occ.baseDate, new_date: null, new_start: null, new_end: null }
  return (
    <OccurrenceView occ={occ} title={title} onOpenLog={onOpenLog}
      prep={showPrep ? <PrepCard logId={occ.logId} /> : undefined}
      actions={{
        pending: setOverride.isPending || clearOverride.isPending,
        cancel: () => setOverride.mutate(cancelled, { onSuccess: () => toast.success('Session cancelled for this date') }),
        restore: () => occ.overrideId && clearOverride.mutate(occ.overrideId, { onSuccess: () => toast.success('Back to the usual time') }),
        move: (v) => setOverride.mutate(
          { slot_id: occ.slotId, on_date: occ.baseDate, new_date: v.date, new_start: v.start, new_end: v.end },
          { onSuccess: () => toast.success('Session moved') },
        ),
      }} />
  )
}

/** Occurrences under a heading per day. */
export function DayGroups({ items, render, skipToday }: {
  items: Occurrence[]
  render: (o: Occurrence) => ReactNode
  skipToday?: boolean
}) {
  const days = [...new Set(items.map((o) => o.date))]
  return (
    <div className="flex flex-col gap-5">
      {days.map((d) => (
        <section key={d}>
          {!(skipToday && d === isoDate(new Date())) && (
            <h3 className="text-xs tracking-wide text-muted-foreground uppercase">{dayLabel(d)}</h3>
          )}
          <div className="divide-y">{items.filter((o) => o.date === d).map((o) => <div key={o.key}>{render(o)}</div>)}</div>
        </section>
      ))}
    </div>
  )
}

/** Add or edit a weekly time. */
export function SlotForm({ slot, submitLabel, pending, onSubmit, onCancel }: {
  slot?: ScheduleSlot
  submitLabel: string
  pending: boolean
  onSubmit: (v: SlotInput) => void
  onCancel?: () => void
}) {
  const form = useForm({
    defaultValues: {
      weekday: slot?.weekday ?? 2,
      start: slot ? hhmm(slot.start_time) : '16:30',
      end: slot?.end_time ? hhmm(slot.end_time) : '18:00',
      place: slot?.place ?? '',
    },
    onSubmit: ({ value, formApi }) => {
      if (!value.start) return void toast.error('Pick a start time')
      if (value.end && value.end <= value.start) return void toast.error('The end time must be after the start time')
      onSubmit({ weekday: value.weekday, start_time: value.start, end_time: value.end || null, place: value.place.trim() })
      if (!slot) formApi.reset()
    },
  })
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="weekday">
        {(f) => (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Day of the week">
            {WEEK_ORDER.map((d) => (
              <button key={d} type="button" role="radio" aria-checked={f.state.value === d} onClick={() => f.handleChange(d)}
                className={cn('rounded-full border px-3 py-1 text-sm transition-colors',
                  f.state.value === d ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                {WEEKDAYS_SHORT[d]}
              </button>
            ))}
          </div>
        )}
      </form.Field>
      <div className="flex flex-wrap items-center gap-2">
        <form.Field name="start">
          {(f) => <Input aria-label="Usual start time" type="time" className="w-32" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
        </form.Field>
        <span className="text-sm text-muted-foreground">to about</span>
        <form.Field name="end">
          {(f) => <Input aria-label="Usual finish (optional)" type="time" className="w-32" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
        </form.Field>
        <form.Field name="place">
          {(f) => <Input aria-label="Court or place (optional)" className="min-w-36 flex-1" placeholder="Court (optional)" maxLength={80}
            value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
        </form.Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{submitLabel}</Button>
        {onCancel && <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  )
}
