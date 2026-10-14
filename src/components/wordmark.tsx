import { BallDot } from '@/components/landing/doodles'
import { cn } from '@/lib/utils'

/** The name, with a tennis ball for a full stop. Used wherever the brand shows. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display leading-none', className)}>
      Baseline
      <svg aria-hidden viewBox="-10 -10 20 20" className="ml-[0.07em] inline-block size-[0.26em] align-baseline"><BallDot r={10} /></svg>
    </span>
  )
}
