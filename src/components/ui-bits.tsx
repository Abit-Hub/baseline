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

export function Section({ title, hint, children, className }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('border-t pt-5 pb-8', className)}>
      <div className="mb-4">
        <h2 className="text-2xl">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      <div className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>
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
