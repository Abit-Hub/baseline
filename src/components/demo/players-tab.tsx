import { UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { naira } from '@/domain/payments'
import { agoLabel } from '@/domain/stats'
import type { Demo } from '@/lib/demo-state'
import { cn } from '@/lib/utils'

/** One calm list. Each player shows the single most useful thing about them. */
export function PlayersTab({ d, openPlayer, onInvite }: { d: Demo; openPlayer: (id: string) => void; onInvite: () => void }) {
  return (
    <>
      <PageHeader eyebrow={`${d.data.players.length} players`} title="Players">
        <Button onClick={onInvite}><UserPlus /> Invite a player</Button>
      </PageHeader>
      <ul className="divide-y rounded-lg border">
        {d.rows.map(({ p, reasons }) => {
          const m = d.money.get(p.log_id)!
          const status = m.s.pending > 0 ? { text: `${naira(m.s.pending)} to confirm`, flag: true }
            : reasons[0] ? { text: reasons[0], flag: true }
              : m.s.owed > 0 ? { text: `${naira(m.s.owed)} owed`, flag: true }
                : { text: p.last_session ? `Last session ${agoLabel(p.last_session).toLowerCase()}` : 'No sessions yet', flag: false }
          return (
            <li key={p.log_id}>
              <button type="button" onClick={() => openPlayer(p.log_id)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.player_name}</span>
                  <span className={cn('mt-0.5 block text-sm', status.flag ? 'text-foreground' : 'text-muted-foreground')}>
                    {status.flag && <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" aria-hidden />}
                    {status.text}
                  </span>
                </span>
                <span className="tabular text-right">
                  <span className="font-display text-2xl leading-none">{p.avg_recent ?? '–'}</span>
                  <span className="block text-xs text-muted-foreground">avg feel</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
