import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDays } from 'date-fns'
import { useAtom, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RATINGS } from '@/domain/constants'
import { dayLabel, endsAt, occurrences, timeRange } from '@/domain/schedule'
import type { ScheduleOverride, ScheduleSlot, Session } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { dismissedPromptsAtom, sessionEditorAtom } from '@/state/atoms'

/**
 * After a scheduled session ends, asks how it went. One tap on a rating saves the session.
 * Shows the latest finished session that has no log yet, from the last three days.
 */
export function SessionPrompt({ logId, slots, overrides, sessions, now }: {
  logId: string
  slots: ScheduleSlot[]
  overrides: ScheduleOverride[]
  sessions: Session[]
  now: Date
}) {
  const qc = useQueryClient()
  const setEditor = useSetAtom(sessionEditorAtom)
  const [dismissed, setDismissed] = useAtom(dismissedPromptsAtom)

  const save = useMutation({
    mutationFn: async (v: { date: string; rating: number }) => {
      const { data, error } = await supabase.from('sessions')
        .insert({ log_id: logId, session_date: v.date, rating: v.rating, focus: [], worked: '', well: '', fix: '' })
        .select().single()
      if (error) throw new Error(error.message)
      return data as Session
    },
    onSuccess: (session) => {
      void qc.invalidateQueries({ queryKey: ['sessions', logId] })
      toast.success('Session saved', { action: { label: 'Add details', onClick: () => setEditor({ open: true, session }) } })
    },
  })

  const logged = new Set(sessions.map((s) => s.session_date))
  const due = occurrences(slots, overrides, addDays(now, -3), 4)
    .filter((o) => !o.cancelled && endsAt(o) <= now && !logged.has(o.date) && !dismissed.includes(o.key + o.date))
    .at(-1)
  if (!due) return null

  return (
    <section aria-label="Log your session" className="mb-8 rounded-xl border border-primary/30 bg-accent/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">{dayLabel(due.date)} · {timeRange(due.start, due.end)}</p>
          <h2 className="mt-1 text-3xl leading-none">How was your session?</h2>
        </div>
        <Button variant="ghost" size="xs" onClick={() => setDismissed([...dismissed, due.key + due.date].slice(-50))}>Not now</Button>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2" role="group" aria-label="How it felt">
        {RATINGS.map((label, i) => (
          <button key={label} type="button" disabled={save.isPending} onClick={() => save.mutate({ date: due.date, rating: i + 1 })}
            className="flex flex-col items-center gap-2 rounded-lg border bg-card px-1 py-3 transition hover:border-primary hover:bg-accent active:scale-95 disabled:opacity-50">
            <span className="flex gap-0.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((j) => <span key={j} className={cn('h-3.5 w-1.5 rounded-sm', j <= i + 1 ? 'bg-primary' : 'bg-border')} />)}
            </span>
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="mt-3 text-sm font-medium text-primary underline underline-offset-4"
        onClick={() => setEditor({ open: true, session: null, date: due.date })}>
        Add the details instead
      </button>
    </section>
  )
}
