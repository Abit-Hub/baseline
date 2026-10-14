import { OccRow } from '@/components/demo/occ-row'
import { DayGroups } from '@/components/schedule'
import { PageHeader, Section } from '@/components/ui-bits'
import type { Demo } from '@/lib/demo-state'

/** The whole week across every player, with the last week below for rain-offs. */
export function ScheduleTab({ d, openPlayer }: { d: Demo; openPlayer: (id: string) => void }) {
  return (
    <>
      <PageHeader eyebrow="Every player" title="Schedule" />
      <Section title="This week" className="border-t-0 pt-0" hint="Tap a time for what the player last wrote, plus cancel and move.">
        <DayGroups items={d.week} render={(o) => <OccRow d={d} o={o} onOpen={openPlayer} />} />
      </Section>
      <Section title="Last week" hint="Rained off or missed? Mark it here and it stops counting towards a bundle.">
        <DayGroups items={d.past} render={(o) => <OccRow d={d} o={o} onOpen={openPlayer} />} />
      </Section>
    </>
  )
}
