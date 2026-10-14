import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { moneyQuery, scheduleQuery } from '@/data/queries'
import { heldSessions, standing } from '@/domain/payments'
import { useNow } from '@/lib/use-now'

/** One log's running balance, or null when no deal has been set up. */
export function useStanding(logId: string) {
  const money = useQuery(moneyQuery(logId))
  const sched = useQuery(scheduleQuery(logId))
  const now = useNow()
  return useMemo(() => {
    if (!money.data || !sched.data || !money.data.arrangements.length) return null
    return standing(money.data.arrangements, money.data.payments,
      (a) => heldSessions(sched.data.slots, sched.data.overrides, a.start_date, now, a.ended_on))
  }, [money.data, sched.data, now])
}
