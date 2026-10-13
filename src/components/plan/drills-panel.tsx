import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLog } from '@/components/log-context'
import { ConfirmButton, EmptyState, Section } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDeleteRow, useInsertRow, useUpdateRow, rowsQuery } from '@/data/queries'
import { SKILLS } from '@/domain/constants'
import { agoLabel, daysAgo } from '@/domain/stats'
import type { Drill } from '@/domain/types'

const schema = z.object({
  name: z.string().trim().min(1, 'Give the drill a name').max(120),
  skill: z.string(),
  description: z.string().max(300),
})

export function DrillsPanel() {
  const { log, user, isPlayer, isCoach, playerId, playerName } = useLog()
  const { data = [], isPending } = useQuery(rowsQuery('drills', log.id))
  const insert = useInsertRow('drills', log.id)
  const update = useUpdateRow('drills', log.id)
  const remove = useDeleteRow('drills', log.id)

  const groups = [...SKILLS, 'Other'].map((skill) => ({
    skill,
    items: data.filter((d) => (SKILLS.includes(d.skill as (typeof SKILLS)[number]) ? d.skill : 'Other') === skill),
  })).filter((g) => g.items.length)

  const form = useForm({
    defaultValues: { name: '', skill: 'Forehand', description: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      const position = data.reduce((m, d) => Math.max(m, d.position), 0) + 1
      await insert.mutateAsync({ ...value, name: value.name.trim(), position })
      formApi.reset()
      toast.success('Drill added')
    },
  })

  const practised = (d: Drill) =>
    update.mutate({ id: d.id, patch: { times: d.times + 1, last_practised: format(new Date(), 'yyyy-MM-dd') } },
      { onSuccess: () => toast.success('Logged. Nice work.') })

  return (
    <>
      <p className="mb-6 text-muted-foreground">
        {isPlayer
          ? 'Practice between sessions. Tap “Practised” when you finish one. Short and often beats long and rare.'
          : `Drills ${playerName} is working on. Add one to suggest it to them.`}
      </p>

      {!isPending && data.length === 0 && (
        <EmptyState title="No drills yet">{isPlayer ? 'Add one below, or ask your coach for a drill to repeat at home.' : 'Add the first drill below.'}</EmptyState>
      )}

      {groups.map(({ skill, items }) => (
        <Section key={skill} title={skill} className="pb-4">
          <ul className="divide-y">
            {items.map((d) => {
              const fresh = d.last_practised && daysAgo(d.last_practised) <= 2
              return (
                <li key={d.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium [overflow-wrap:anywhere]">
                      {d.name}
                      {d.created_by && d.created_by !== playerId && (
                        <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs font-normal text-accent-foreground">From coach</span>
                      )}
                    </p>
                    {d.description && <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{d.description}</p>}
                    <p className={`mt-0.5 text-sm ${fresh ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                      Practised: {agoLabel(d.last_practised)}{d.times > 0 && ` · ${d.times}×`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isPlayer && <Button size="sm" onClick={() => practised(d)}>Practised</Button>}
                    {(isPlayer || d.created_by === user.id) && (
                      <ConfirmButton variant="ghost" size="xs" armedLabel="Tap again" onConfirm={() => remove.mutate(d.id)}>Remove</ConfirmButton>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>
      ))}

      <Section title={isCoach ? `Suggest a drill to ${playerName}` : 'Add a drill'} className="mt-4">
        <form className="flex flex-col gap-4" noValidate
          onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <form.Field name="name">
              {(f) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="d-name">Drill name</Label>
                  <Input id="d-name" maxLength={120} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />
                  {f.state.meta.errors[0] && <p className="text-sm text-destructive">{(f.state.meta.errors[0] as { message?: string }).message}</p>}
                </div>
              )}
            </form.Field>
            <form.Field name="skill">
              {(f) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="d-skill">Skill</Label>
                  <select id="d-skill" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}
                    className="h-10 rounded-lg border border-input md:h-8 bg-transparent px-2.5 text-sm dark:bg-input/30">
                    {SKILLS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="description">
            {(f) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-desc">How it works (optional)</Label>
                <Input id="d-desc" maxLength={300} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />
              </div>
            )}
          </form.Field>
          <Button type="submit" className="self-start">{isCoach ? 'Suggest drill' : 'Add drill'}</Button>
        </form>
      </Section>
    </>
  )
}
