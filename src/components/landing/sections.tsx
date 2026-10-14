import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { Wordmark } from '@/components/wordmark'
import { cn } from '@/lib/utils'
import { BallDot, Doodle, HeroBall, useBallTrail } from './doodles'
import { HeroNotebook } from './hero-notebook'
import { Reveal } from './motion'

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

function Cta({ signedIn, size = 'lg', label = 'Start your log', role }: { signedIn: boolean; size?: 'lg' | 'default'; label?: string; role?: 'coach' }) {
  return signedIn ? (
    <Link to="/start" className={cn(buttonVariants({ size }), 'group')}>
      Open Baseline <ArrowRight className="transition-transform group-hover:translate-x-1" />
    </Link>
  ) : (
    <Link to="/login" search={{ mode: 'up', role }} className={cn(buttonVariants({ size }), 'group')}>
      {label} <ArrowRight className="transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

export function Nav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={cn('sticky top-0 z-40 pt-[env(safe-area-inset-top)] transition-all duration-300', scrolled ? 'border-b bg-background/85 backdrop-blur' : 'border-b border-transparent')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/"><Wordmark className="text-3xl" /></Link>
        <div className="ml-auto flex items-center gap-2">
          {!signedIn && <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Sign in</Link>}
          <Cta signedIn={signedIn} size="default" label="Get started" />
        </div>
      </div>
    </header>
  )
}

const HEADLINE = ['Your', 'game,', 'written', 'down.', 'Your', 'coach,']

export function Hero({ signedIn }: { signedIn: boolean }) {
  const trail = useBallTrail()
  return (
    <section ref={trail} className="ruled margin-line relative overflow-hidden">
      <span data-ball aria-hidden className="pointer-events-none absolute top-0 left-0 z-10 size-5 opacity-0 transition-opacity duration-300">
        <svg viewBox="-10 -10 20 20" className="size-full"><BallDot r={10} /></svg>
      </span>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background" />
      <div aria-hidden className="float-slow pointer-events-none absolute -top-20 right-[-6rem] size-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="float-slower pointer-events-none absolute bottom-0 left-[20%] size-[22rem] rounded-full bg-[oklch(0.9_0.15_100/0.25)] blur-3xl dark:bg-[oklch(0.8_0.12_100/0.08)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24 lg:pb-28">
        <div className="in-view pl-0 sm:pl-6 lg:pl-10">
          <h1 className="text-[clamp(3.2rem,8.5vw,6.5rem)] leading-[0.95] tracking-tight">
            {HEADLINE.map((w, i) => (
              <span key={i} className="rise mr-[0.22em] inline-block" style={delay(120 + i * 80)}>{w}</span>
            ))}
            <span className="rise marker relative inline-block whitespace-nowrap text-primary italic" style={delay(120 + HEADLINE.length * 80)}>
              in the loop<HeroBall />
              <svg aria-hidden viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-3 w-full overflow-visible">
                <path className="draw text-primary" style={delay(1100)} pathLength="1" d="M2 9 C 60 2, 120 13, 180 6 S 270 4, 298 8"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="rise mt-7 max-w-md text-lg text-muted-foreground" style={delay(800)}>
            Log each session. Get notes back from your coach. See what’s next.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={delay(950)}>
            <Cta signedIn={signedIn} />
            <Link to="/demo" className={buttonVariants({ variant: 'outline', size: 'lg' })}>See the coach view</Link>
          </div>
        </div>
        <div className="rise lg:pr-4" style={delay(500)}><HeroNotebook /></div>
      </div>
    </section>
  )
}

const STEPS = [
  ['Write it down', 'A minute after each session.'],
  ['Your coach replies', 'Notes, goals and drills.'],
  ['Pick up where you stopped', 'Both see the last notes.'],
]

export function Steps() {
  return (
    <section className="border-y bg-card/40">
      <ol className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 md:gap-8 lg:py-16">
        {STEPS.map(([title, body], i) => (
          <Reveal as="li" key={title} delay={i * 110} className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border bg-background font-display text-2xl text-primary">{i + 1}</span>
            <span>
              <span className="block font-display text-3xl leading-none">{title}</span>
              <span className="mt-1.5 block text-muted-foreground">{body}</span>
            </span>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

export function ForCoaches({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative">
      <Doodle name="ball" className="top-16 left-[10%] size-14" rotate={-12} />
      <Doodle name="racket" className="top-14 right-[10%] h-28 w-20" rotate={20} />
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <Reveal><p className="text-sm font-medium tracking-wide text-primary uppercase">For coaches</p></Reveal>
        <Reveal delay={80}><h2 className="mt-3 text-5xl leading-none sm:text-6xl">Train a few players? Run the week from one screen.</h2></Reveal>
        <Reveal delay={160}><p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">Sessions, notes and payments for every player.</p></Reveal>
        <Reveal delay={240} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/demo" className={buttonVariants({ size: 'lg' })}>Try the coach demo</Link>
          <Cta signedIn={signedIn} label="Create a coach account" role="coach" />
        </Reveal>
      </div>
    </section>
  )
}

export function Footer({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
        <Wordmark className="text-2xl" />
        <div className="ml-auto flex items-center gap-4 text-sm">
          {!signedIn && <Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link>}
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}
