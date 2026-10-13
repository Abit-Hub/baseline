import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLog } from '@/components/log-context'
import { DayGroups, OccurrenceRow, SlotForm } from '@/components/schedule'
import { ConfirmButton, EmptyState, ListSkeleton, PageHeader, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { scheduleQuery, useScheduleActions } from '@/data/queries'
import { WEEKDAYS_LONG, WEEK_ORDER, endsAt, occurrences, timeRange } from '@/domain/schedule'

export const Route = createFileRoute('/_app/schedule')({ component: Schedule })

function Schedule() {
  const { log, isCoach, playerName } = useLog()
  const { data, isPending } = useQuery(scheduleQuery(log.id))
  const { addSlot, updateSlot, removeSlot } = useScheduleActions(log.id)
  const [editing, setEditing] = useState<string | null>(null)

  const slots = [...(data?.slots ?? [])].sort(
    (a, b) => WEEK_ORDER.indexOf(a.weekday as never) - WEEK_ORDER.indexOf(b.weekday as never) || a.start_time.localeCompare(b.start_time),
  )
  const now = new Date()
  const coming = occurrences(data?.slots ?? [], data?.overrides ?? [], now, 14).filter((o) => endsAt(o) >= now)

  return (
    <>
      <PageHeader title="Schedule" eyebrow={isCoach ? `Training times with ${playerName}` : undefined} />

      <Section title="Coming up" hint="The next two weeks. Tap a time to cancel it or move it for one day only." className="border-t-0 pt-0">
        {isPending && <ListSkeleton rows={3} />}
        {!isPending && coming.length === 0 && (
          <EmptyState title="Nothing coming up" icon={CalendarDays}>Add the usual weekly times below and they will show here.</EmptyState>
        )}
        <DayGroups items={coming} render={(o) => <OccurrenceRow occ={o} title={isCoach ? playerName : 'Training'} showPrep={isCoach} />} />
      </Section>

      <Section title="Usual weekly times" hint="Either of you can change these. A time that shifts for one week is easier to move above.">
        {slots.length > 0 && (
          <ul className="mb-5 divide-y">
            {slots.map((s) => (
              <li key={s.id} className="py-3">
                {editing === s.id ? (
                  <SlotForm slot={s} submitLabel="Save" pending={updateSlot.isPending} onCancel={() => setEditing(null)}
                    onSubmit={(v) => updateSlot.mutate({ id: s.id, ...v }, { onSuccess: () => { setEditing(null); toast.success('Time updated') } })} />
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="min-w-0 flex-1">
                      <span className="font-medium">{WEEKDAYS_LONG[s.weekday]}</span>
                      <span className="tabular ml-3 text-sm text-muted-foreground">{timeRange(s.start_time, s.end_time)}</span>
                      {s.place && <span className="ml-3 text-sm text-muted-foreground">{s.place}</span>}
                    </p>
                    <Button variant="ghost" size="xs" onClick={() => setEditing(s.id)}>Edit</Button>
                    <ConfirmButton variant="ghost" size="xs" armedLabel="Tap again"
                      onConfirm={() => removeSlot.mutate(s.id)}>Remove</ConfirmButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mb-3 text-sm font-medium">Add a weekly time</p>
        <SlotForm submitLabel="Add time" pending={addSlot.isPending}
          onSubmit={(v) => addSlot.mutate(v, { onSuccess: () => toast.success('Time added') })} />
      </Section>
    </>
  )
}
