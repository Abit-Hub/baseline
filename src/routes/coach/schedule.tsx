import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarDays } from 'lucide-react'
import { DayGroups, OccurrenceRow } from '@/components/schedule'
import { EmptyState, ListSkeleton, PageHeader, Section } from '@/components/ui-bits'
import { useCoachBoard } from '@/lib/coach-board'

export const Route = createFileRoute('/coach/schedule')({ component: Schedule })

/** The whole week across every player, with last week below for rain-offs. */
function Schedule() {
  const board = useCoachBoard()
  const navigate = useNavigate()
  const open = (logId: string) => void navigate({ to: '/coach/players/$logId', params: { logId }, search: { seg: 'schedule' } })
  const name = (id: string) => board.players.find((p) => p.log_id === id)?.player_name ?? 'Player'
  const row = (o: Parameters<typeof OccurrenceRow>[0]['occ']) => <OccurrenceRow occ={o} title={name(o.logId)} showPrep onOpenLog={() => open(o.logId)} />

  return (
    <>
      <PageHeader eyebrow="Every player" title="Schedule" />
      {board.loading && <ListSkeleton rows={4} />}
      {!board.loading && board.week.length === 0 && (
        <EmptyState title="Nothing scheduled this week" icon={CalendarDays}>Open a player and add their usual weekly times. They all show here, in time order.</EmptyState>
      )}
      {board.week.length > 0 && (
        <Section title="This week" className="border-t-0 pt-0" hint="Tap a time for what the player last wrote, plus cancel and move.">
          <DayGroups items={board.week} render={row} />
        </Section>
      )}
      {board.past.length > 0 && (
        <Section title="Last week" hint="Rained off or missed? Mark it here and it stops counting towards a bundle.">
          <DayGroups items={board.past} render={(o) => <OccurrenceRow occ={o} title={name(o.logId)} onOpenLog={() => open(o.logId)} />} />
        </Section>
      )}
    </>
  )
}
