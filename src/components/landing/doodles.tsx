import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { prefersReducedMotion, useInView } from './motion'

/** The one tennis colour on the page: a ball. Used sparingly, never behind text. */
export const BALL = 'oklch(0.88 0.17 112)'

export function BallDot({ r = 10, className, style }: { r?: number; className?: string; style?: CSSProperties }) {
  const k = r / 10
  return (
    <g className={className} style={style}>
      <circle r={r} fill={BALL} stroke="oklch(0.45 0.1 112)" strokeWidth={0.9 * k} />
      <path d={`M${-7.4 * k} ${-4.6 * k}C${-2 * k} ${-2.5 * k} ${-2 * k} ${2.5 * k} ${-7.4 * k} ${4.6 * k}`} fill="none" stroke="white" strokeWidth={1.3 * k} strokeLinecap="round" />
      <path d={`M${7.4 * k} ${-4.6 * k}C${2 * k} ${-2.5 * k} ${2 * k} ${2.5 * k} ${7.4 * k} ${4.6 * k}`} fill="none" stroke="white" strokeWidth={1.3 * k} strokeLinecap="round" />
    </g>
  )
}

/** The ball that bounces to a stop at the end of the hero headline. It stands in for a full stop. */
export function HeroBall() {
  return (
    <span aria-hidden className="hero-ball ml-[0.06em] inline-block size-[0.3em] align-baseline">
      <svg viewBox="-10 -10 20 20" className="size-full overflow-visible"><BallDot r={10} /></svg>
    </span>
  )
}

/* -------------------------------------------------------------- doodles */

type Name = 'racket' | 'ball' | 'bottle' | 'arrow'

const PATHS: Record<Name, ReactNode> = {
  racket: (
    <>
      <path pathLength="1" d="M32 6c-12 0-20 9-20 21s8 21 20 21 20-9 20-21S44 6 32 6Z" />
      <path pathLength="1" d="M32 48v18M28 66h8l-1 14h-6Z" />
      <path pathLength="1" d="M22 14c4 4 4 28 0 32M32 8v38M42 14c-4 4-4 28 0 32M16 22c10 3 22 3 32 0M15 32c11 3 23 3 34 0M18 41c9 2 19 2 28 0" opacity=".55" />
    </>
  ),
  ball: (
    <>
      <circle pathLength="1" cx="32" cy="32" r="22" />
      <path pathLength="1" d="M12 20c10 4 14 20 6 32M52 20c-10 4-14 20-6 32" />
    </>
  ),
  bottle: (
    <>
      <path pathLength="1" d="M26 8h12v8l5 8v44a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V24l5-8Z" />
      <path pathLength="1" d="M23 36c5 3 13 3 18 0M23 50c5 3 13 3 18 0" opacity=".55" />
    </>
  ),
  arrow: (
    <>
      <path pathLength="1" d="M6 52C14 20 44 8 80 22" />
      <path pathLength="1" d="M66 10l15 12-18 8" />
    </>
  ),
}

const BOX: Record<Name, string> = { racket: '0 0 64 84', ball: '0 0 64 64', bottle: '0 0 64 80', arrow: '0 0 90 64' }

/**
 * A pen doodle that draws itself when it scrolls into view. Decorative, so it is
 * hidden from screen readers and on small screens, where the margins are tight.
 */
export function Doodle({ name, className, rotate = 0 }: { name: Name; className?: string; rotate?: number }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.3)
  return (
    <span ref={ref} aria-hidden className={cn('pointer-events-none absolute hidden text-primary/45 md:block', seen && 'in-view', className)}>
      <svg viewBox={BOX[name]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="float-slow size-full overflow-visible" style={{ transform: `rotate(${rotate}deg)` }}>
        <g className="doodle-draw">{PATHS[name]}</g>
      </svg>
    </span>
  )
}

/* ---------------------------------------------------------- court sketch */

// A doubles court seen from above, in feet scaled by 7.78: 36 wide, 78 long.
const LINES = [
  'M20 20H300V620H20Z',
  'M55 20V620M265 20V620',
  'M55 158H265M55 482H265',
  'M160 158V482',
  'M160 20v12M160 620v-12',
]

const grow = (on: boolean, ms = 1100): CSSProperties => ({
  strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset ${ms}ms cubic-bezier(0.5, 0, 0.2, 1)`,
})
const fade = (on: boolean, d = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity 600ms ease ${d}ms` })

/**
 * The how-it-works picture: a court drawn like a notebook sketch. `step` picks what
 * is marked on it (1 write, 2 coach replies, 3 pick up), 0 shows all three.
 */
export function CourtSketch({ step }: { step: 0 | 1 | 2 | 3 }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.25)
  const on = (n: number) => step === 0 || step === n
  const [bounce, setBounce] = useState(false)
  useEffect(() => { setBounce(seen && !prefersReducedMotion()) }, [seen])

  return (
    <div ref={ref} className={cn('relative mx-auto w-full max-w-[19rem] rounded-2xl border bg-card p-4 shadow-xl shadow-primary/10', seen && 'in-view')}>
      <svg viewBox="0 0 320 640" role="img" className="h-auto w-full" fontFamily="var(--font-display)"
        aria-label="A tennis court sketched from above: you at the baseline, your coach at the far end, and a ball travelling between you">
        {/* the court */}
        <rect x="20" y="320" width="280" height="300" className="fill-primary/[0.04]" />
        <g fill="none" className="stroke-foreground/70" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {LINES.map((d, i) => <path key={d} d={d} pathLength="1" className="draw" style={{ '--d': `${i * 220}ms` } as CSSProperties} />)}
        </g>
        {/* the net */}
        <g className="fade-after" style={{ '--d': '1.2s' } as CSSProperties}>
          <path d="M6 320H314" className="stroke-primary" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" fill="none" />
          <circle cx="6" cy="320" r="4" className="fill-primary" /><circle cx="314" cy="320" r="4" className="fill-primary" />
          <text x="146" y="311" textAnchor="end" fontSize="15" fontStyle="italic" className="fill-muted-foreground">net</text>
        </g>

        {/* 1 · you write it down */}
        <g style={fade(on(1))}>
          <circle cx="160" cy="596" r="9" className="fill-primary" />
          <circle cx="160" cy="596" r="15" fill="none" className="stroke-primary/40" strokeWidth="1.5" />
          <text x="182" y="602" fontSize="24" fontStyle="italic" className="fill-foreground">you</text>
          <text x="64" y="556" fontSize="19" fontStyle="italic" className="fill-primary">log it after</text>
          <path d="M122 562C134 576 140 586 146 592M139 590l8 3-1-9" fill="none" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 2 · the coach replies */}
        <g style={fade(on(2))}>
          <path d="M160 580C60 470 70 190 196 96" fill="none" className="stroke-primary/30" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 7" />
          <path d="M160 580C60 470 70 190 196 96" fill="none" className="stroke-primary" strokeWidth="2.4" strokeLinecap="round" pathLength="1" style={grow(on(2), 1400)} />
          <circle cx="206" cy="64" r="9" className="fill-foreground" />
          <text x="226" y="70" fontSize="24" fontStyle="italic" className="fill-foreground">coach</text>
          <g transform="translate(196 96)" style={fade(on(2), 900)}><BallDot r={9} /></g>
          <text x="184" y="196" fontSize="19" fontStyle="italic" className="fill-primary">a note</text>
          <text x="184" y="218" fontSize="19" fontStyle="italic" className="fill-primary">comes back</text>
        </g>

        {/* 3 · pick up where you stopped */}
        <g style={fade(on(3))}>
          <rect x="165" y="327" width="95" height="150" rx="6" className="fill-primary/15 stroke-primary" strokeWidth="2" strokeDasharray="4 5" />
          <text x="212" y="392" textAnchor="middle" fontSize="19" fontStyle="italic" className="fill-foreground">last time:</text>
          <text x="212" y="416" textAnchor="middle" fontSize="19" fontStyle="italic" className="fill-primary">elbow in</text>
          <path d="M238 345c14 4 14 20 0 24" fill="none" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* a ball that keeps rallying while nothing is selected */}
        {bounce && step === 0 && (
          <g transform="translate(90 590)">
            <BallDot r={8} />
            <animateMotion dur="3.6s" repeatCount="indefinite" path="M0 0 Q70 -170 140 0 T0 0" />
          </g>
        )}
      </svg>
    </div>
  )
}

/** A ball that follows the cursor across a section, a few pixels behind it. Mouse only. */
export function useBallTrail() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return
    let frame = 0, tx = 0, ty = 0, x = 0, y = 0
    const ball = el.querySelector<HTMLElement>('[data-ball]')
    if (!ball) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = e.clientX - r.left; ty = e.clientY - r.top
      ball.style.opacity = '1'
      frame ||= requestAnimationFrame(step)
    }
    const step = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12
      ball.style.transform = `translate(${x - 10}px, ${y - 10}px)`
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(step) : 0
    }
    const leave = () => { ball.style.opacity = '0' }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(frame) }
  }, [])
  return ref
}
