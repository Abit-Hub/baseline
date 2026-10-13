import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DrillsPanel } from '@/components/plan/drills-panel'
import { GoalsPanel } from '@/components/plan/goals-panel'
import { PageHeader } from '@/components/ui-bits'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/plan')({
  validateSearch: z.object({ tab: z.enum(['goals', 'drills']).optional() }),
  component: Plan,
})

const TABS = [
  { id: 'goals', label: 'Goals' },
  { id: 'drills', label: 'Drills' },
] as const

function Plan() {
  const { tab = 'goals' } = Route.useSearch()
  return (
    <>
      <PageHeader title="Plan" />
      <div role="tablist" aria-label="Plan" className="mb-8 inline-flex rounded-lg border p-0.5">
        {TABS.map((t) => (
          <Link key={t.id} to="/plan" search={{ tab: t.id }} replace role="tab" aria-selected={tab === t.id}
            className={cn('rounded-md px-5 py-2 text-sm font-medium text-muted-foreground transition-colors md:px-4 md:py-1.5',
              tab === t.id ? 'bg-accent text-accent-foreground' : 'hover:text-foreground')}>
            {t.label}
          </Link>
        ))}
      </div>
      {tab === 'goals' ? <GoalsPanel /> : <DrillsPanel />}
    </>
  )
}
