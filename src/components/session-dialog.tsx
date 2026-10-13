import { useForm } from '@tanstack/react-form'
import { format, parseISO } from 'date-fns'
import { useAtom } from 'jotai'
import { toast } from 'sonner'
import { z } from 'zod'
import { SessionNotes } from '@/components/coach-notes'
import { useLog } from '@/components/log-context'
import { ConfirmButton, RatingPips } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDeleteRow, useInsertRow, useUpdateRow } from '@/data/queries'
import { RATINGS, SKILLS } from '@/domain/constants'
import type { Session } from '@/domain/types'
import { cn } from '@/lib/utils'
import { sessionEditorAtom } from '@/state/atoms'

const schema = z.object({
  session_date: z.string().min(1, 'Pick a date'),
  focus: z.array(z.string()),
  rating: z.number().int().min(0).max(5),
  worked: z.string().max(2000),
  well: z.string().max(2000),
  fix: z.string().max(2000),
})

export function SessionDialog() {
  const { isPlayer } = useLog()
  const [editor, setEditor] = useAtom(sessionEditorAtom)
  const close = () => setEditor({ open: false, session: null })
  return (
    <Dialog open={editor.open} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">
            {!isPlayer ? 'Session' : editor.session ? 'Edit session' : 'Log a session'}
          </DialogTitle>
          <DialogDescription>
            {isPlayer
              ? 'Write it down while it is fresh. Your coach can add notes after you save.'
              : 'Read the player’s entry and add your note. Only the player can change their entry.'}
          </DialogDescription>
        </DialogHeader>
        {isPlayer ? (
          <SessionForm key={editor.session?.id ?? `new-${editor.date ?? ''}`} session={editor.session} date={editor.date} onDone={close} />
        ) : (
          editor.session && <SessionReadOnly session={editor.session} />
        )}
        {editor.session && isPlayer && <SessionNotes sessionId={editor.session.id} />}
      </DialogContent>
    </Dialog>
  )
}

function SessionForm({ session, date, onDone }: { session: Session | null; date?: string; onDone: () => void }) {
  const { log } = useLog()
  const insert = useInsertRow('sessions', log.id)
  const update = useUpdateRow('sessions', log.id)
  const remove = useDeleteRow('sessions', log.id)

  const form = useForm({
    defaultValues: {
      session_date: session?.session_date ?? date ?? format(new Date(), 'yyyy-MM-dd'),
      focus: session?.focus ?? ([] as string[]),
      rating: session?.rating ?? 0,
      worked: session?.worked ?? '',
      well: session?.well ?? '',
      fix: session?.fix ?? '',
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      const row = { ...value, rating: value.rating || null }
      if (session) await update.mutateAsync({ id: session.id, patch: row })
      else await insert.mutateAsync(row)
      toast.success('Session saved')
      onDone()
    },
  })

  return (
    <form className="flex flex-col gap-5" noValidate
      onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="session_date">
        {(f) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-date">Date</Label>
            <Input id="s-date" type="date" className="max-w-48" value={f.state.value}
              onChange={(e) => f.handleChange(e.target.value)} />
          </div>
        )}
      </form.Field>

      <form.Field name="focus">
        {(f) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">What you worked on</legend>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map((s) => {
                const on = f.state.value.includes(s)
                return (
                  <button key={s} type="button" aria-pressed={on}
                    onClick={() => f.handleChange(on ? f.state.value.filter((x) => x !== s) : [...f.state.value, s])}
                    className={cn('rounded-full border px-3.5 py-2 text-sm md:px-3 md:py-1 transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                    {s}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Field name="rating">
        {(f) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">How did it feel?</legend>
            <div className="grid grid-cols-5 gap-1.5">
              {RATINGS.map((label, i) => {
                const v = i + 1
                const on = f.state.value === v
                return (
                  <button key={label} type="button" aria-pressed={on}
                    onClick={() => f.handleChange(on ? 0 : v)}
                    className={cn('flex flex-col items-center rounded-md border px-1 py-2 transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                    <span className="font-display text-2xl leading-none">{v}</span>
                    <span className="mt-1 text-[11px] leading-none">{label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </form.Field>

      {([
        ['worked', 'Details', 'Drills, rallies, anything you covered'],
        ['well', 'What went well', ''],
        ['fix', 'Fix next time', ''],
      ] as const).map(([name, label, placeholder]) => (
        <form.Field key={name} name={name}>
          {(f) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`s-${name}`}>{label}</Label>
              <Textarea id={`s-${name}`} rows={2} placeholder={placeholder} value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </form.Field>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {session ? (
          <ConfirmButton variant="ghost" size="sm" armedLabel="Tap again to delete"
            onConfirm={() => remove.mutate(session.id, { onSuccess: () => { toast.success('Session deleted'); onDone() } })}>
            Delete session
          </ConfirmButton>
        ) : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(busy) => <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save session'}</Button>}
          </form.Subscribe>
        </div>
      </div>
    </form>
  )
}

function SessionReadOnly({ session }: { session: Session }) {
  const parts: [string, string][] = [
    ['Details', session.worked], ['What went well', session.well], ['Fix next time', session.fix],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{format(parseISO(session.session_date), 'EEEE d MMMM')}</p>
        <RatingPips value={session.rating} />
      </div>
      {session.focus.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {session.focus.map((f) => <span key={f} className="rounded bg-muted px-2 py-0.5 text-sm">{f}</span>)}
        </div>
      )}
      {parts.map(([label, text]) => text && (
        <div key={label}>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</p>
        </div>
      ))}
      <SessionNotes sessionId={session.id} />
    </div>
  )
}
