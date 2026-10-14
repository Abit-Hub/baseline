import { ChevronDown, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { RATINGS } from '@/domain/constants'
import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1 text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-5xl leading-none">{title}</h1>
      </div>
      {children}
    </div>
  )
}

export function Section({ title, hint, children, className, id }: { title: string; hint?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-20 border-t pt-5 pb-8', className)}>
      <div className="mb-4">
        <h2 className="text-2xl">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** A section the reader opens when they want it. Keeps long pages short. */
export function CollapsibleSection({ title, summary, children, className }: { title: string; summary?: string; children: ReactNode; className?: string }) {
  return (
    <details className={cn('group border-t py-1', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-2xl leading-tight">{title}</span>
          {summary && <span className="block text-sm text-muted-foreground">{summary}</span>}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  )
}

export function EmptyState({ title, icon: Icon, action, children }: { title: string; icon?: LucideIcon; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-10 text-center">
      {Icon && (
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <p className="font-display text-2xl">{title}</p>
      <div className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** A grey block that stands in for content while it loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('rounded-md bg-muted motion-safe:animate-pulse', className)} />
}

/** Placeholder rows for a list or table that is still loading. */
export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('divide-y rounded-lg border', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-10" />
        </div>
      ))}
    </div>
  )
}

/** Placeholder for the Overview page. */
export function OverviewSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-8">
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <Skeleton className="h-44 w-full rounded-lg" />
    </div>
  )
}

/** First tap arms the button, second tap confirms. Resets after 3 seconds. */
export function ConfirmButton({ onConfirm, children, armedLabel = 'Tap again to confirm', className, ...rest }: {
  onConfirm: () => void
  children: ReactNode
  armedLabel?: string
  className?: string
  variant?: 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'xs' | 'default'
}) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <Button type="button" {...rest} className={cn(armed && 'text-destructive', className)}
      onClick={() => {
        if (armed) return onConfirm()
        setArmed(true)
        timer.current = setTimeout(() => setArmed(false), 3000)
      }}>
      {armed ? armedLabel : children}
    </Button>
  )
}

export function RatingPips({ value }: { value: number | null }) {
  if (!value) return <span className="text-muted-foreground">–</span>
  return (
    <span className="inline-flex items-center gap-1.5" title={`${value}/5 · ${RATINGS[value - 1]}`}>
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn('h-3 w-1.5 rounded-sm', i <= value ? 'bg-primary' : 'bg-border')} />
        ))}
      </span>
      <span className="sr-only">{`${value} out of 5, ${RATINGS[value - 1]}`}</span>
    </span>
  )
}
