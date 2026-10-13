import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { useSetAtom } from 'jotai'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { membersQuery, useRealtime } from '@/data/queries'
import type { Log, Member, Role } from '@/domain/types'
import { activeLogIdAtom } from '@/state/atoms'

interface LogCtx {
  log: Log
  /** Every log this person belongs to. */
  logs: Log[]
  roleOf: (logId: string) => Role
  user: User
  members: Member[]
  /** My role in the active log. */
  myRole: Role
  isPlayer: boolean
  isCoach: boolean
  /** True if I coach anyone, in any log. */
  coachesAnyone: boolean
  playerId: string | null
  playerName: string
  nameOf: (userId: string) => string
  selectLog: (logId: string) => void
}

const Ctx = createContext<LogCtx | null>(null)

export function LogProvider({ log, logs, roles, user, children }: {
  log: Log
  logs: Log[]
  roles: Record<string, Role>
  user: User
  children: ReactNode
}) {
  useRealtime(log.id)
  const { data: members = [] } = useQuery(membersQuery(log.id))
  const select = useSetAtom(activeLogIdAtom)

  const value = useMemo<LogCtx>(() => {
    const myRole = roles[log.id] ?? 'player'
    const player = members.find((m) => m.role === 'player')
    const nameOf = (id: string) => members.find((m) => m.user_id === id)?.profiles?.display_name || 'Someone'
    return {
      log, logs, user, members, myRole, nameOf,
      roleOf: (id) => roles[id] ?? 'player',
      isPlayer: myRole === 'player',
      isCoach: myRole === 'coach',
      coachesAnyone: Object.values(roles).includes('coach'),
      playerId: player?.user_id ?? null,
      playerName: player?.profiles?.display_name || 'the player',
      selectLog: (id) => select(id),
    }
  }, [log, logs, roles, user, members, select])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLog() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLog must be used inside LogProvider')
  return v
}
