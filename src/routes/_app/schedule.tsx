import { createFileRoute } from '@tanstack/react-router'
import { useLog } from '@/components/log-context'
import { SchedulePanel } from '@/components/schedule-panel'
import { PageHeader } from '@/components/ui-bits'

export const Route = createFileRoute('/_app/schedule')({ component: Schedule })

function Schedule() {
  const { isCoach, playerName } = useLog()
  return (
    <>
      <PageHeader title="Schedule" eyebrow={isCoach ? `Training times with ${playerName}` : undefined} />
      <SchedulePanel />
    </>
  )
}
