import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the element has scrolled into view. Stays true. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, threshold])
  return [ref, seen] as const
}

/** Fades and lifts its children in when they scroll into view. */
export function Reveal({ children, delay = 0, as: Tag = 'div', className }: {
  children: ReactNode
  delay?: number
  as?: ElementType
  className?: string
}) {
  const [ref, seen] = useInView<HTMLElement>(0.15)
  return (
    <Tag ref={ref} data-in={seen} className={cn('reveal', className)} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}

/** A thin bar across the top that fills as you scroll the page. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
    }
    const onScroll = () => { frame ||= requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])
  return <div ref={bar} aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-primary" />
}

/** Reveals text one character at a time once `active` turns true. */
export function Typewriter({ text, active, speed = 28 }: { text: string; active: boolean; speed?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) return setN(0)
    if (prefersReducedMotion()) return setN(text.length)
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed)
    return () => clearInterval(id)
  }, [active, text, speed])
  return (
    <>
      {text.slice(0, n)}
      {active && n < text.length && <span className="caret ml-px inline-block h-[1em] w-0.5 translate-y-0.5 bg-primary" />}
    </>
  )
}
