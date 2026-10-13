import { createFileRoute, Link } from '@tanstack/react-router'
import { addDays, format, parseISO } from 'date-fns'
import { AlertCircle, MessageSquarePlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DayGroups, OccurrenceView, PrepView } from '@/components/schedule'
import { RatingChart } from '@/components/rating-chart'
import { PageHeader, RatingPips, Section } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { attentionFor, endsAt, isoDate, occurrences, type Occurrence } from '@/domain/schedule'
import { agoLabel, recentAverage, sortSessions } from '@/domain/stats'
import type { CoachNote, PlayerSummary, ScheduleOverride } from '@/domain/types'
import { buildDemo, demoNow } from '@/lib/demo-data'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/demo')({ component: Demo })

function Demo() {
  const data = useMemo(buildDemo, [])
  const now = useMemo(demoNow, [])
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [extraNotes, setExtraNotes] = useState<CoachNote[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string | null>(null)

  useEffect(() => { document.title = 'Coach demo · Baseline' }, [])

  const notes = [...extraNotes, ...data.notes]
  const nameOf = (id: string) => data.players.find((p) => p.id === id)?.name ?? ''

  const summaries: PlayerSummary[] = data.players.map((p) => {
    const mine = sortSessions(data.sessions.filter((s) => s.log_id === p.id))
    const lastNote = notes.filter((n) => n.log_id === p.id).map((n) => n.created_at).sort().at(-1) ?? null
    return {
      log_id: p.id, log_name: p.name, player_id: p.id, player_name: p.name,
      session_count: mine.length, last_session: mine[0]?.session_date ?? null,
      avg_recent: recentAverage(mine, 5) ? Number(recentAverage(mine, 5)!.toFixed(1)) : null,
      last_note: lastNote,
    }
  })

  const all = occurrences(data.slots, overrides, addDays(now, -7), 15)
  const today = isoDate(now)
  const upcoming = all.filter((o) => endsAt(o) >= now)
  const todays = upcoming.filter((o) => o.date === today)
  const later = upcoming.filter((o) => o.date > today && o.date <= isoDate(addDays(now, 7)))
  const past = all.filter((o) => endsAt(o) < now)
  const rows = summaries
    .map((p) => ({ p, reasons: attentionFor(p, past, 7, now) }))
    .sort((a, b) => b.reasons.length - a.reasons.length || a.p.player_name.localeCompare(b.p.player_name))
  const needLook = rows.filter((r) => r.reasons.length).length

  const setOverride = (o: Occurrence, v: Pick<ScheduleOverride, 'new_date' | 'new_start' | 'new_end'>) =>
    setOverrides((cur) => [
      ...cur.filter((x) => !(x.slot_id === o.slotId && x.on_date === o.baseDate)),
      { id: `${o.key}`, log_id: o.logId, slot_id: o.slotId, on_date: o.baseDate, ...v },
    ])

  const row = (o: Occurrence) => {
    const sessions = sortSessions(data.sessions.filter((s) => s.log_id === o.logId))
    return (
      <OccurrenceView occ={o} title={nameOf(o.logId)} onOpenLog={() => setOpenId(o.logId)}
        prep={<PrepView latest={sessions[0]}
          lastNote={notes.filter((n) => n.log_id === o.logId).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.note}
          openGoals={data.goals.filter((g) => g.log_id === o.logId && !g.done).slice(0, 3).map((g) => g.text)} />}
        actions={{
          cancel: () => { setOverride(o, { new_date: null, new_start: null, new_end: null }); toast.success('Session cancelled for this date') },
          restore: () => setOverrides((cur) => cur.filter((x) => x.id !== o.overrideId)),
          move: (v) => { setOverride(o, { new_date: v.date, new_start: v.start, new_end: v.end }); toast.success('Session moved') },
        }} />
    )
  }

  const detail = openId ? data.players.find((p) => p.id === openId) : undefined
  const detailSessions = sortSessions(data.sessions.filter((s) => s.log_id === openId))
  const detailNotes = notes.filter((n) => n.log_id === openId).sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div className="min-h-svh">
      <div className="sticky top-0 z-30 border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
          <span className="font-medium">Sample data. Nothing here is saved.</span>
          <span className="ml-auto flex items-center gap-3">
            <Link to="/" className="underline-offset-4 hover:underline">Back to site</Link>
            <Link to="/login" search={{ mode: 'up' }} className={cn(buttonVariants({ size: 'xs', variant: 'secondary' }))}>Create your account</Link>
          </span>
        </div>
      </div>

      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to="/" className="font-display text-2xl leading-none">Baseline</Link>
          <span className="text-sm text-muted-foreground">Coach view</span>
          <Button size="sm" className="ml-auto" onClick={() => setNoteFor(rows.find((r) => r.reasons.length)?.p.log_id ?? data.players[0].id)}>
            <MessageSquarePlus /> Add note
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <PageHeader eyebrow={`${format(now, 'EEEE d MMMM')} · ${data.players.length} players${needLook ? ` · ${needLook} to look at` : ''}`} title="Players" />

        <div className="mb-8 rounded-lg border border-dashed bg-accent/40 p-4 text-sm">
          <p className="font-medium">Try it. This is a real coach screen with four sample players.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Tap Chidi’s session today to see what he wrote last time.</li>
            <li>Tap <em>Add note</em> and write one for Ife. Her red flag clears.</li>
            <li>Move or cancel a session, then open a player to read their log.</li>
          </ol>
        </div>

        <Section title="Today" className="border-t-0 pt-0">
          {todays.length ? <DayGroups items={todays} render={row} skipToday /> : <p className="text-sm text-muted-foreground">Nothing else on today.</p>}
        </Section>

        {later.length > 0 && (
          <Section title="Rest of the week" hint="Tap a time for what each player last wrote, plus cancel and move.">
            <DayGroups items={later} render={row} />
          </Section>
        )}

        <Section title="Your players">
          <ul className="divide-y rounded-lg border">
            {rows.map(({ p, reasons }) => (
              <li key={p.log_id}>
                <button type="button" onClick={() => setOpenId(p.log_id)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.player_name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {p.last_session ? `Last session ${agoLabel(p.last_session).toLowerCase()}` : 'No sessions logged yet'}
                    </span>
                    {reasons.map((r) => (
                      <span key={r} className="mt-0.5 flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {r}
                      </span>
                    ))}
                  </span>
                  <span className="tabular text-right text-sm">
                    <span className="font-display text-2xl leading-none">{p.avg_recent ?? '–'}</span>
                    <span className="block text-xs text-muted-foreground">avg feel</span>
                  </span>
                  <span className="tabular w-14 text-right text-sm">
                    <span className="font-display text-2xl leading-none">{p.session_count}</span>
                    <span className="block text-xs text-muted-foreground">sessions</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <div className="rounded-lg bg-muted/60 p-5 text-center">
          <p className="font-display text-2xl">Like what you see?</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Create an account, ask a player for their coach link, and this is your real week.</p>
          <Link to="/login" search={{ mode: 'up' }} className={cn(buttonVariants(), 'mt-4')}>Create your account</Link>
        </div>
      </main>

      <Dialog open={Boolean(detail)} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-normal">{detail?.name}</DialogTitle>
            <DialogDescription>Their log, read only. You can leave notes and suggest goals.</DialogDescription>
          </DialogHeader>
          <RatingChart newestFirst={detailSessions} />
          <div>
            <h3 className="mb-2 text-xl">Recent sessions</h3>
            <ul className="divide-y">
              {detailSessions.slice(0, 5).map((s) => (
                <li key={s.id} className="py-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="tabular w-16 shrink-0 text-muted-foreground">{format(parseISO(s.session_date), 'd MMM')}</span>
                    <span className="flex-1 font-medium">{s.focus.join(', ')}</span>
                    <RatingPips value={s.rating} />
                  </div>
                  {s.fix && <p className="mt-1 pl-[4.75rem] text-muted-foreground">Work on next: {s.fix}</p>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xl">Your notes</h3>
            <ul className="flex flex-col gap-3">
              {detailNotes.map((n) => (
                <li key={n.id} className="border-l-2 border-primary pl-3 text-sm">
                  <span className="text-xs tracking-wide text-muted-foreground uppercase">{format(parseISO(n.created_at), 'd MMM')}</span>
                  <p className="mt-0.5">{n.note}</p>
                </li>
              ))}
            </ul>
            <Button className="mt-4" size="sm" variant="outline" onClick={() => { setNoteFor(openId); }}>Add a note</Button>
          </div>
        </DialogContent>
      </Dialog>

      <NoteBox players={data.players} playerId={noteFor} onClose={() => setNoteFor(null)} onSave={(logId, note) => {
        setExtraNotes((cur) => [{ id: `new-${cur.length}`, log_id: logId, session_id: null, note, author_id: 'coach', created_at: new Date().toISOString() }, ...cur])
        toast.success(`Note added for ${nameOf(logId)}`)
        setNoteFor(null)
      }} />
    </div>
  )
}

function NoteBox({ players, playerId, onClose, onSave }: {
  players: { id: string; name: string }[]
  playerId: string | null
  onClose: () => void
  onSave: (logId: string, note: string) => void
}) {
  const [who, setWho] = useState(playerId)
  const [text, setText] = useState('')
  useEffect(() => { setWho(playerId); setText('') }, [playerId])
  return (
    <Dialog open={Boolean(playerId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Add a note</DialogTitle>
          <DialogDescription>The player sees it on their overview straight away.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Player">
          {players.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={who === p.id} onClick={() => setWho(p.id)}
              className={cn('rounded-full border px-3 py-1 text-sm transition-colors', who === p.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
              {p.name}
            </button>
          ))}
        </div>
        <Textarea aria-label="Note" placeholder="What should they know or work on?" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
        <Button disabled={!who || !text.trim()} onClick={() => who && onSave(who, text.trim())}>Add note</Button>
      </DialogContent>
    </Dialog>
  )
}
