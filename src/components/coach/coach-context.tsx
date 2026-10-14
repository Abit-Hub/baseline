import type { User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { Log, Role } from '@/domain/types'

interface CoachCtx { user: User; logs: Log[]; roles: Record<string, Role> }
export const CoachContext = createContext<CoachCtx | null>(null)

export function useCoach() {
  const v = useContext(CoachContext)
  if (!v) throw new Error('useCoach must be used inside the coach layout')
  return v
}
