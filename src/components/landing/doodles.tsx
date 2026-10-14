import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
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
