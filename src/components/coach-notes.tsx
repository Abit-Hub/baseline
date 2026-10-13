import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLog } from '@/components/log-context'
import { ConfirmButton } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { rowsQuery, useAcknowledgeNote, useDeleteRow, useInsertRow } from '@/data/queries'
import type { CoachNote } from '@/domain/types'

export function NoteList({ notes, showSession }: { notes: CoachNote[]; showSession?: Map<string, string> }) {
  const { log, user, nameOf, isPlayer } = useLog()
  const remove = useDeleteRow('coach_notes', log.id)
  const acknowledge = useAcknowledgeNote(log.id)
  return (
    <ul className="flex flex-col gap-4">
      {notes.map((n) => (
        <li key={n.id} className="border-l-2 border-primary pl-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {n.author_id ? nameOf(n.author_id) : 'Coach'} · {format(parseISO(n.created_at), 'd MMM')}
            {showSession && n.session_id && showSession.get(n.session_id) && ` · session of ${showSession.get(n.session_id)}`}
          </p>
          <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{n.note}</p>
          {isPlayer && !n.acknowledged_at && (
            <Button size="sm" variant="outline" className="mt-2" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate(n.id)}>
              <Check /> Got it
            </Button>
          )}
          {n.acknowledged_at ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" /> {isPlayer ? 'Got it' : `Seen ${format(parseISO(n.acknowledged_at), 'd MMM')}`}
            </p>
          ) : !isPlayer && <p className="mt-1.5 text-xs text-muted-foreground">Not seen yet</p>}
          {n.author_id === user.id && (
            <ConfirmButton variant="ghost" size="xs" className="mt-1 -ml-2" armedLabel="Tap again to delete"
              onConfirm={() => remove.mutate(n.id, { onSuccess: () => toast.success('Note deleted') })}>
              Delete
            </ConfirmButton>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Only coaches see this box. The database also refuses notes from anyone else. */
export function NoteComposer({ sessionId, label, onDone }: { sessionId?: string; label: string; onDone?: () => void }) {
  const { log, isCoach } = useLog()
  const insert = useInsertRow('coach_notes', log.id)
  const [text, setText] = useState('')
  if (!isCoach) return null
  return (
    <form className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const note = text.trim()
        if (!note) return
        insert.mutate({ note, session_id: sessionId ?? null }, {
          onSuccess: () => { setText(''); toast.success('Note added'); onDone?.() },
        })
      }}>
      <Textarea aria-label={label} placeholder={label} rows={2} maxLength={2000} value={text}
        onChange={(e) => setText(e.target.value)} />
      <Button type="submit" size="sm" className="self-start" disabled={!text.trim() || insert.isPending}>Add note</Button>
    </form>
  )
}

/** Notes attached to one session, with the coach's composer underneath. */
export function SessionNotes({ sessionId }: { sessionId: string }) {
  const { log, isCoach } = useLog()
  const { data = [] } = useQuery(rowsQuery('coach_notes', log.id))
  const notes = data.filter((n) => n.session_id === sessionId)
  if (!notes.length && !isCoach) return null
  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted/50 p-3">
      <h3 className="font-display text-xl">Coach notes</h3>
      {notes.length > 0 && <NoteList notes={notes} />}
      <NoteComposer sessionId={sessionId} label="Add a note about this session" />
    </div>
  )
}
