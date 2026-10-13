import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { useLog } from '@/components/log-context'
import { ConfirmButton, EmptyState, PageHeader, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { rowsQuery, useDeleteRow, useInsertRow, useUpdateRow } from '@/data/queries'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/goals')({ component: Goals })

function Goals() {
  const { log, user, isPlayer, isCoach, playerName } = useLog()
  const goals = useQuery(rowsQuery('goals', log.id))
  const goalUpdate = useUpdateRow('goals', log.id)
  const goalDelete = useDeleteRow('goals', log.id)
  const goalInsert = useInsertRow('goals', log.id)

  const nextPos = (rows: { position: number }[] = []) => rows.reduce((m, r) => Math.max(m, r.position), 0) + 1

  const goalForm = useForm({
    defaultValues: { text: '', target_date: '' },
    onSubmit: async ({ value, formApi }) => {
      if (!value.text.trim()) return
      await goalInsert.mutateAsync({
        text: value.text.trim(), target_date: value.target_date || null, position: nextPos(goals.data),
      })
      formApi.reset()
    },
  })

  return (
    <>
      <PageHeader title="Goals" />

      <Section title="Goals" className="border-t-0 pt-0" hint={isCoach ? `Add a goal to suggest it to ${playerName}. Only ${playerName} can tick goals off.` : undefined}>
        {goals.isSuccess && goals.data.length === 0 && <EmptyState title="No goals yet">Pick one small target for this month.</EmptyState>}
        <ul className="divide-y">
          {goals.data?.map((g) => (
            <li key={g.id} className="flex items-start gap-3 py-3">
              <Checkbox checked={g.done} disabled={!isPlayer} aria-label={`Mark reached: ${g.text}`} className="mt-0.5"
                onCheckedChange={(done) => goalUpdate.mutate({ id: g.id, patch: { done: Boolean(done) } })} />
              <p className={cn('min-w-0 flex-1 [overflow-wrap:anywhere]', g.done && 'text-muted-foreground line-through')}>
                {g.text}
                {g.target_date && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs no-underline">by {format(parseISO(g.target_date), 'd MMM')}</span>}
              </p>
              {(isPlayer || g.created_by === user.id) && (
                <ConfirmButton variant="ghost" size="xs" armedLabel="Tap again" onConfirm={() => goalDelete.mutate(g.id)}>Remove</ConfirmButton>
              )}
            </li>
          ))}
        </ul>
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void goalForm.handleSubmit() }}>
          <goalForm.Field name="text">
            {(f) => <Input aria-label="New goal" className="min-w-48 flex-1" placeholder="e.g. Rally 15 forehands in a row" maxLength={160}
              value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
          </goalForm.Field>
          <goalForm.Field name="target_date">
            {(f) => <Input aria-label="Target date (optional)" type="date" className="w-40"
              value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
          </goalForm.Field>
          <Button type="submit">Add</Button>
        </form>
      </Section>
    </>
  )
}
