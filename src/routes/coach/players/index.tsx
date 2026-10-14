import { Link, createFileRoute } from '@tanstack/react-router'
import { useAtom } from 'jotai'
import { UserPlus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCoach } from '@/components/coach/coach-context'
import { FirstPlayer } from '@/components/first-player'
import { ListSkeleton, PageHeader } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { profileQuery } from '@/data/queries'
import { naira } from '@/domain/payments'
import { agoLabel } from '@/domain/stats'
import { useCoachBoard } from '@/lib/coach-board'
import { cn } from '@/lib/utils'
import { inviteDialogAtom } from '@/state/atoms'

export const Route = createFileRoute('/coach/players/')({ component: Players })

/** One calm list. Each player shows the single most useful thing about them. */
function Players() {
  const { user } = useCoach()
  const board = useCoachBoard()
  const [, setInviting] = useAtom(inviteDialogAtom)
  const profile = useQuery(profileQuery(user.id))

  return (
    <>
      <PageHeader eyebrow={board.loading ? undefined : `${board.players.length} ${board.players.length === 1 ? 'player' : 'players'}`} title="Players">
        {board.players.length > 0 && <Button onClick={() => setInviting(true)}><UserPlus /> Invite a player</Button>}
      </PageHeader>
      {board.error && <p className="text-sm text-destructive">Could not load your players: {board.error.message}</p>}
      {board.loading && <ListSkeleton rows={4} />}
      {!board.loading && !board.error && board.players.length === 0 && <FirstPlayer coachName={profile.data?.display_name ?? ''} />}

      {board.players.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {board.rows.map(({ p, reasons, s }) => {
            const status = s && s.pending > 0 ? { text: `${naira(s.pending)} to confirm`, flag: true }
              : reasons[0] ? { text: reasons[0], flag: true }
                : s && s.owed > 0 ? { text: `${naira(s.owed)} owed`, flag: true }
                  : { text: p.last_session ? `Last session ${agoLabel(p.last_session).toLowerCase()}` : 'No sessions yet', flag: false }
            return (
              <li key={p.log_id}>
                <Link to="/coach/players/$logId" params={{ logId: p.log_id }}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.player_name || 'Unnamed player'}</span>
                    <span className={cn('mt-0.5 block text-sm', status.flag ? 'text-foreground' : 'text-muted-foreground')}>
                      {status.flag && <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" aria-hidden />}
                      {status.text}
                    </span>
                  </span>
                  <span className="tabular text-right">
                    <span className="font-display text-2xl leading-none">{p.avg_recent ?? '–'}</span>
                    <span className="block text-xs text-muted-foreground">avg feel</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
