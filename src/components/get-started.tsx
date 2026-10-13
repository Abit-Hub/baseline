import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Step {
  done: boolean
  title: string
  hint: string
  action: ReactNode
}

/** A short checklist for a new player. It disappears once everything is done. */
export function GetStarted({ hasTimes, hasSession, hasCoach, onLogSession }: {
  hasTimes: boolean
  hasSession: boolean
  hasCoach: boolean
  onLogSession: () => void
}) {
  const link = 'font-medium text-primary underline underline-offset-4'
  const steps: Step[] = [
    { done: hasTimes, title: 'Add your training times', hint: 'So you both see what is next.',
      action: <Link to="/schedule" className={link}>Add times</Link> },
    { done: hasSession, title: 'Log your first session', hint: 'A minute, right after you leave the court.',
      action: <button type="button" onClick={onLogSession} className={link}>Log session</button> },
    { done: hasCoach, title: 'Invite your coach', hint: 'One link on WhatsApp. They read and reply.',
      action: <Link to="/settings" className={link}>Send invite</Link> },
  ]
  const done = steps.filter((s) => s.done).length
  if (done === steps.length) return null

  return (
    <section aria-label="Get started" className="mb-10 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Get started</h2>
        <p className="tabular text-sm text-muted-foreground">{done} of {steps.length}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 divide-y">
        {steps.map((s) => (
          <li key={s.title} className="flex items-center gap-3 py-3">
            <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
              s.done ? 'pop border-primary bg-primary text-primary-foreground' : 'border-input')}>
              {s.done && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block font-medium', s.done && 'text-muted-foreground line-through')}>{s.title}</span>
              {!s.done && <span className="block text-sm text-muted-foreground">{s.hint}</span>}
            </span>
            {!s.done && <span className="shrink-0 text-sm">{s.action}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}
