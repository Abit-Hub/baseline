import { Check } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { RATINGS } from '@/domain/constants'
import { cn } from '@/lib/utils'
import { Typewriter, prefersReducedMotion } from './motion'

// Milliseconds from the start of each loop to the moment each step begins.
const STEPS = { focus: 700, feel: 1800, note: 3000, saved: 5400, coach: 6400, end: 12500 }
const NOTE = 'Keep the elbow in on the forehand. Split step before every return.'
const COACH_NOTE = 'Good work today. Next time, start the split step before they hit.'

/** The hero's moving picture: a session being written, saved, and answered. */
export function HeroNotebook() {
  const [t, setT] = useState(0)
  const card = useRef<HTMLDivElement>(null)

  // One loop of the story: each step switches on at its time, then everything resets.
  useEffect(() => {
    if (prefersReducedMotion()) return setT(STEPS.end - 1)
    let start = performance.now()
    const id = setInterval(() => {
      const elapsed = performance.now() - start
      if (elapsed > STEPS.end) start = performance.now()
      setT(elapsed > STEPS.end ? 0 : elapsed)
    }, 120)
    return () => clearInterval(id)
  }, [])

  const showFocus = t >= STEPS.focus
  const feel = t >= STEPS.feel ? 4 : 0
  const typing = t >= STEPS.note
  const saved = t >= STEPS.saved
  const coach = t >= STEPS.coach

  // A small tilt that follows the pointer, only where there is a real pointer.
  const tilt = (e: React.PointerEvent) => {
    const el = card.current
    if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1100px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`
  }
  const untilt = () => { if (card.current) card.current.style.transform = '' }

  return (
    <div className="relative mx-auto w-full max-w-md" onPointerMove={tilt} onPointerLeave={untilt}>
      <div aria-hidden className="float-slow absolute -top-6 -right-4 size-24 rounded-full bg-primary/15 blur-2xl" />
      <div aria-hidden className="float-slower absolute -bottom-8 -left-6 size-32 rounded-full bg-primary/10 blur-3xl" />

      <div ref={card} className="relative rounded-2xl border bg-card p-5 shadow-xl shadow-primary/10 transition-transform duration-200 ease-out sm:p-6">
        <div className="flex items-baseline justify-between border-b pb-3">
          <p className="font-display text-2xl">Tuesday 14 October</p>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Session</p>
        </div>

        <div className="mt-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Worked on</p>
          <div className="mt-2 flex min-h-8 flex-wrap gap-2">
            {showFocus && ['Forehand', 'Footwork', 'Serve'].map((s, i) => (
              <span key={s} className="pop rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground" style={{ '--d': `${i * 140}ms` } as CSSProperties}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">How it felt</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex gap-1" aria-hidden>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={cn('h-5 w-2.5 rounded-sm bg-border transition-all duration-500', i <= feel && 'bg-primary')}
                  style={{ transitionDelay: i <= feel ? `${i * 110}ms` : '0ms', transform: i <= feel ? 'scaleY(1)' : 'scaleY(0.6)' }} />
              ))}
            </div>
            <span className={cn('text-sm font-medium transition-opacity duration-500', feel ? 'opacity-100' : 'opacity-0')}>{RATINGS[3]}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Work on next</p>
          <p className="mt-2 min-h-[3.25rem] text-[0.95rem] leading-snug">
            <Typewriter text={NOTE} active={typing} />
          </p>
        </div>

        <div className={cn('mt-4 flex items-center gap-2 text-sm text-muted-foreground transition-all duration-500', saved ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}>
          <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" strokeWidth={3} /></span>
          Saved. Your coach can see it now.
        </div>
      </div>

      <div className={cn('relative z-10 -mt-3 ml-auto w-[88%] rounded-xl border-l-4 border-primary bg-card p-4 shadow-lg transition-all duration-700 ease-out',
        coach ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0')}>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">From your coach</p>
        <p className="mt-1 text-[0.95rem] leading-snug">{COACH_NOTE}</p>
      </div>
    </div>
  )
}
