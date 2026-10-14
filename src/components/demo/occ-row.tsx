import { PrepView, OccurrenceView } from '@/components/schedule'
import type { Occurrence } from '@/domain/schedule'
import { sortSessions } from '@/domain/stats'
import type { Demo } from '@/lib/demo-state'

/** One training time in the demo. Tap it for what the player last wrote, and to move or cancel it. */
export function OccRow({ d, o, onOpen }: { d: Demo; o: Occurrence; onOpen: (logId: string) => void }) {
  const sessions = sortSessions(d.data.sessions.filter((s) => s.log_id === o.logId))
  const lastNote = d.notes.filter((n) => n.log_id === o.logId).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.note
  return (
    <OccurrenceView occ={o} title={d.nameOf(o.logId)} onOpenLog={() => onOpen(o.logId)}
      prep={<PrepView latest={sessions[0]} lastNote={lastNote} openGoals={d.data.goals.filter((g) => g.log_id === o.logId && !g.done).slice(0, 3).map((g) => g.text)} />}
      actions={{ cancel: () => d.cancel(o), restore: () => d.restore(o), move: (v) => d.move(o, v) }} />
  )
}
