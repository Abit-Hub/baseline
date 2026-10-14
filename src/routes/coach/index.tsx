import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useSetAtom } from 'jotai'
import { MessageCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCoach } from '@/components/coach/coach-context'
import { FirstPlayer } from '@/components/first-player'
import { DayGroups, OccurrenceRow } from '@/components/schedule'
import { ListSkeleton, PageHeader, Section } from '@/components/ui-bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { profileQuery, useConfirmPayments } from '@/data/queries'
import { naira, statementText } from '@/domain/payments'
import { useCoachBoard } from '@/lib/coach-board'
import { whatsappTextUrl } from '@/lib/invite'
import { coachNoteAtom } from '@/state/atoms'

export const Route = createFileRoute('/coach/')({ component: Today })

interface Item { key: string; text: ReactNode; action: ReactNode }

function Today() {
  const { user } = useCoach()
  const board = useCoachBoard()
  const navigate = useNavigate()
  const confirm = useConfirmPayments()
  const setNote = useSetAtom(coachNoteAtom)
  const profile = useQuery(profileQuery(user.id))

  const open = (logId: string, seg?: 'money') => void navigate({ to: '/coach/players/$logId', params: { logId }, search: { seg } })

  if (board.error) return <p className="text-sm text-destructive">Could not load your day: {board.error.message}</p>
  if (board.loading) return <><PageHeader title="Today" /><ListSkeleton rows={4} /></>
  if (board.players.length === 0) return (
    <>
      <PageHeader eyebrow={format(board.now, 'EEEE d MMMM')} title="Today" />
      <FirstPlayer coachName={profile.data?.display_name ?? ''} />
    </>
  )

  const items: Item[] = []
  for (const { p, s } of board.rows) {
    const ids = board.pendingIds.get(p.log_id)
    if (s && s.pending > 0 && ids) items.push({
      key: `pay-${p.log_id}`, text: <><b>{p.player_name}</b> says they paid {naira(s.pending)}</>,
      action: <Button size="sm" disabled={confirm.isPending} onClick={() => confirm.mutate(ids)}>Confirm</Button>,
    })
  }
  for (const { p, reasons } of board.rows) for (const r of reasons) items.push({
    key: `${p.log_id}-${r}`, text: <><b>{p.player_name}</b>: {r}</>,
    action: r.startsWith('New entry')
      ? <Button size="sm" onClick={() => setNote({ open: true, logId: p.log_id })}>Write a note</Button>
      : <Button size="sm" variant="outline" onClick={() => open(p.log_id)}>Open</Button>,
  })
  for (const { p, s } of board.rows) {
    if (!s) continue
    if (s.finished) items.push({
      key: `fin-${p.log_id}`, text: <><b>{p.player_name}</b>’s bundle is finished{s.owed > 0 ? ` · ${naira(s.owed)} owed` : ''}</>,
      action: <a href={whatsappTextUrl(statementText(p.player_name, s))} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'sm', variant: 'outline' })}><MessageCircle /> Send statement</a>,
    })
    else if (s.left === 1) items.push({
      key: `low-${p.log_id}`, text: <><b>{p.player_name}</b> has 1 session left</>,
      action: <Button size="sm" variant="outline" onClick={() => open(p.log_id, 'money')}>Open</Button>,
    })
  }
  for (const { p } of board.rows) if (p.unseen_notes > 0) items.push({
    key: `seen-${p.log_id}`, text: <><b>{p.player_name}</b> has not seen your last note</>,
    action: <Button size="sm" variant="outline" onClick={() => open(p.log_id)}>Open</Button>,
  })
  const shown = items.slice(0, 6)

  return (
    <>
      <PageHeader eyebrow={format(board.now, 'EEEE d MMMM')} title="Today" />

      <Section title={items.length ? `Needs you · ${items.length}` : 'Needs you'} className="border-t-0 pt-0"
        hint={items.length ? undefined : 'Nothing is waiting for you.'}>
        {shown.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {shown.map((i) => (
              <li key={i.key} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{i.text}</span>
                {i.action}
              </li>
            ))}
          </ul>
        )}
        {items.length > shown.length && <p className="mt-2 text-xs text-muted-foreground">And {items.length - shown.length} more. Open a player to see everything.</p>}
      </Section>

      <Section title="Today’s sessions">
        {board.todays.length
          ? <DayGroups items={board.todays} skipToday render={(o) => (
            <OccurrenceRow occ={o} title={board.players.find((p) => p.log_id === o.logId)?.player_name ?? 'Player'} showPrep onOpenLog={() => open(o.logId)} />
          )} />
          : <p className="text-sm text-muted-foreground">{board.week.length ? 'Nothing on today.' : 'No sessions scheduled yet. Add each player’s weekly times from their page.'}</p>}
        <Link to="/coach/schedule" className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">See the whole week</Link>
      </Section>
    </>
  )
}
