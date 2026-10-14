import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLog } from '@/components/log-context'
import { ConfirmButton, EmptyState, ListSkeleton } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { rowsQuery, useDeleteRow, useInsertRow, useUpdateRow } from '@/data/queries'
import type { Match } from '@/domain/types'
import { cn } from '@/lib/utils'

export function ResultBadge({ result }: { result: Match['result'] }) {
  return (
    <span className={cn('rounded px-2 py-0.5 text-xs font-medium', result === 'win' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
      {result === 'win' ? 'Won' : 'Lost'}
    </span>
  )
}

/** The match list: who you played, how it went, what to take from it. */
export function MatchesPanel() {
  const { log, isPlayer } = useLog()
  const { data = [], isPending } = useQuery(rowsQuery('matches', log.id))
  const [editing, setEditing] = useState<Match | 'new' | null>(null)
  const wins = data.filter((m) => m.result === 'win').length

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">
          {data.length === 0 ? 'Matches you play, with the score and what you learned.'
            : `${data.length} ${data.length === 1 ? 'match' : 'matches'} · ${wins} won, ${data.length - wins} lost`}
        </p>
        {isPlayer && <Button onClick={() => setEditing('new')}>Log match</Button>}
      </div>

      {isPending && <ListSkeleton rows={3} />}
      {!isPending && data.length === 0 && (
        <EmptyState title="No matches yet" icon={Trophy}
          action={isPlayer && <Button onClick={() => setEditing('new')}>Log your first match</Button>}>
          {isPlayer ? 'Record the score and one thing that worked, one thing to fix.' : 'The player has not logged a match yet.'}
        </EmptyState>
      )}

      {data.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {data.map((m) => {
            const body = (
              <>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="tabular w-24 shrink-0 text-sm text-muted-foreground">{format(parseISO(m.match_date), 'EEE d MMM')}</span>
                  <span className="font-medium">{m.opponent ? `vs ${m.opponent}` : 'Match'}</span>
                  <ResultBadge result={m.result} />
                  {m.score && <span className="tabular text-sm text-muted-foreground">{m.score}</span>}
                </span>
                {(m.worked || m.fix) && (
                  <span className="mt-1.5 block space-y-0.5 pl-0 text-sm text-muted-foreground sm:pl-[6.75rem]">
                    {m.worked && <span className="block [overflow-wrap:anywhere]"><span className="text-foreground">Worked:</span> {m.worked}</span>}
                    {m.fix && <span className="block [overflow-wrap:anywhere]"><span className="text-foreground">Fix:</span> {m.fix}</span>}
                  </span>
                )}
              </>
            )
            return (
              <li key={m.id}>
                {isPlayer ? (
                  <button type="button" onClick={() => setEditing(m)}
                    className="block w-full px-4 py-3.5 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50">{body}</button>
                ) : <div className="px-4 py-3.5">{body}</div>}
              </li>
            )
          })}
        </ul>
      )}
      {isPlayer && data.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Tap a match to edit it.</p>}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-normal">{editing === 'new' ? 'Log a match' : 'Edit match'}</DialogTitle>
            <DialogDescription>Straight after the match is best, while you still remember how it went.</DialogDescription>
          </DialogHeader>
          {editing && <MatchForm key={editing === 'new' ? 'new' : editing.id} match={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function MatchForm({ match, onDone }: { match: Match | null; onDone: () => void }) {
  const { log } = useLog()
  const insert = useInsertRow('matches', log.id)
  const update = useUpdateRow('matches', log.id)
  const remove = useDeleteRow('matches', log.id)
  const [v, setV] = useState({
    match_date: match?.match_date ?? format(new Date(), 'yyyy-MM-dd'),
    opponent: match?.opponent ?? '',
    result: match?.result ?? ('win' as Match['result'] | ''),
    score: match?.score ?? '',
    worked: match?.worked ?? '',
    fix: match?.fix ?? '',
  })
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((cur) => ({ ...cur, [k]: value }))
  const busy = insert.isPending || update.isPending
  const save = () => {
    if (!v.match_date || !v.result) return
    const row = { ...v, result: v.result, opponent: v.opponent.trim(), score: v.score.trim() }
    const done = { onSuccess: () => { toast.success('Match saved'); onDone() }, onError: (e: Error) => toast.error(e.message) }
    if (match) update.mutate({ id: match.id, patch: row }, done)
    else insert.mutate(row, done)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save() }}>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-date">Date</Label>
          <Input id="m-date" type="date" className="w-44" value={v.match_date} onChange={(e) => set('match_date', e.target.value)} />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor="m-opp">Opponent</Label>
          <Input id="m-opp" maxLength={80} placeholder="Name or club" value={v.opponent} onChange={(e) => set('opponent', e.target.value)} />
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Result</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {(['win', 'loss'] as const).map((r) => (
            <button key={r} type="button" aria-pressed={v.result === r} onClick={() => set('result', r)}
              className={cn('rounded-md border py-2.5 text-sm font-medium transition-colors', v.result === r ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
              {r === 'win' ? 'Won' : 'Lost'}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="m-score">Score</Label>
        <Input id="m-score" maxLength={60} placeholder="6-4, 3-6, 7-5" value={v.score} onChange={(e) => set('score', e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="m-worked">What worked</Label>
        <Textarea id="m-worked" rows={2} maxLength={2000} value={v.worked} onChange={(e) => set('worked', e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="m-fix">What to fix</Label>
        <Textarea id="m-fix" rows={2} maxLength={2000} value={v.fix} onChange={(e) => set('fix', e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {match ? (
          <ConfirmButton variant="ghost" size="sm" armedLabel="Tap again to delete"
            onConfirm={() => remove.mutate(match.id, { onSuccess: () => { toast.success('Match deleted'); onDone() } })}>
            Delete match
          </ConfirmButton>
        ) : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={busy || !v.result || !v.match_date}>{busy ? 'Saving…' : 'Save match'}</Button>
        </div>
      </div>
    </form>
  )
}
