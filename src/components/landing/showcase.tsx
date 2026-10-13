import { Link } from '@tanstack/react-router'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Doodle } from './doodles'
import { Reveal, prefersReducedMotion, useInView } from './motion'

/* ------------------------------------------------------------- numbers */

function CountUp({ from = 0, to, active }: { from?: number; to: number; active: boolean }) {
  const [v, setV] = useState(prefersReducedMotion() ? to : from)
  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion()) return setV(to)
    const t0 = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1400)
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, from, to])
  return <>{v}</>
}

const FACTS = [
  { from: 0, to: 60, unit: 'sec', title: 'To log a session', body: 'Date, focus, how it felt, one thing to fix. Done before you reach the car park.' },
  { from: 5, to: 1, unit: 'link', title: 'To bring in your coach', body: 'Send it on WhatsApp. They sign up, tap join, and your log is open to them.' },
  { from: 5, to: 0, unit: 'downloads', title: 'To get started', body: 'It runs in the browser. Add it to your home screen if you want it to feel like an app.' },
]

export function Facts() {
  const [ref, seen] = useInView<HTMLDivElement>(0.35)
  return (
    <section aria-label="At a glance" className="border-b bg-card/40">
      <div ref={ref} className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3 md:gap-8 lg:py-20">
        {FACTS.map((f, i) => (
          <Reveal key={f.title} delay={i * 120}>
            <p className="font-display leading-none">
              <span className="tabular text-7xl text-primary sm:text-8xl"><CountUp from={f.from} to={f.to} active={seen} /></span>
              <span className="ml-2 text-3xl text-muted-foreground">{f.unit}</span>
            </p>
            <h3 className="mt-3 text-2xl">{f.title}</h3>
            <p className="mt-1 max-w-xs text-muted-foreground">{f.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ showcase */

function Pips({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn('h-3 w-1.5 rounded-sm', i <= n ? 'bg-primary' : 'bg-border')} />)}
    </span>
  )
}

function PhoneScreen() {
  const pts = [2, 3, 3, 4, 3, 4, 5]
  const line = pts.map((v, i) => `${8 + i * 30},${50 - (v - 1) * 10}`).join(' ')
  return (
    <div className="flex h-full flex-col gap-3 bg-background p-3.5 text-[11px] leading-snug">
      <div className="flex items-center justify-between">
        <span className="font-display text-xl leading-none">Baseline</span>
        <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">+ Log session</span>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[9px] tracking-wide text-muted-foreground uppercase">Next session</p>
        <p className="mt-0.5 font-display text-2xl leading-none">Tomorrow</p>
        <p className="mt-1">4:30pm to 6pm <span className="text-muted-foreground">· Court 1</span></p>
        <div className="mt-2.5 flex items-center justify-between border-t pt-2">
          <span className="text-muted-foreground">Last session · 3 days ago</span><Pips n={4} />
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[9px] tracking-wide text-muted-foreground uppercase">How sessions have felt</p>
        <svg viewBox="0 0 200 60" className="mt-1.5 w-full" aria-hidden>
          <polyline points={line} fill="none" className="stroke-primary" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="188" cy="10" r="3.5" className="fill-primary" />
        </svg>
      </div>
      <div className="rounded-xl border-l-2 border-primary bg-accent/50 p-3">
        <p className="text-[9px] tracking-wide text-muted-foreground uppercase">From your coach</p>
        <p className="mt-0.5">Great session. Your backhand has come a long way.</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[10px] font-medium"><Check className="size-3" /> Got it</span>
      </div>
    </div>
  )
}

function CoachScreen() {
  const rows: [string, string, boolean][] = [
    ['Tunde', 'Nothing logged for Saturday’s session', true],
    ['Ife', 'Your last note has not been seen yet', false],
    ['Chidi', 'Last session 3 days ago', false],
  ]
  return (
    <div className="bg-background p-4 text-sm sm:p-5">
      <div className="flex items-baseline justify-between border-b pb-3">
        <p className="font-display text-3xl leading-none">Players</p>
        <p className="text-xs text-muted-foreground">4 players · 1 to look at</p>
      </div>
      <p className="mt-4 text-[10px] tracking-wide text-muted-foreground uppercase">Today</p>
      <div className="divide-y">
        {[['4:30pm to 6pm', 'Chidi', 'Court 1'], ['6:15pm to 7:30pm', 'Amaka', 'Court 2']].map(([t, n, c]) => (
          <div key={n} className="flex items-center gap-3 py-2.5">
            <span className="tabular w-28 shrink-0 text-xs">{t}</span>
            <span className="flex-1 font-medium">{n}</span>
            <span className="text-xs text-muted-foreground">{c}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] tracking-wide text-muted-foreground uppercase">Your players</p>
      <ul className="mt-2 divide-y rounded-lg border">
        {rows.map(([n, l, flag]) => (
          <li key={n} className="flex items-center gap-3 px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{n}</span>
              <span className={cn('block text-xs', flag ? 'text-destructive' : 'text-muted-foreground')}>{l}</span>
            </span>
            <span className="text-right"><span className="font-display text-xl leading-none">{flag ? '3.0' : '4.2'}</span><span className="block text-[10px] text-muted-foreground">avg feel</span></span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Showcase() {
  return (
    <section id="see" className="dots relative scroll-mt-16 overflow-hidden border-b">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <Reveal><p className="text-sm font-medium tracking-wide text-primary uppercase">See it</p></Reveal>
        <Reveal delay={80}><h2 className="mt-3 max-w-2xl text-5xl leading-none sm:text-6xl">Two screens. One shared picture of the week.</h2></Reveal>
        <Reveal delay={140}><p className="mt-4 max-w-xl text-lg text-muted-foreground">The player writes it down on their phone. The coach sees every player on one page.</p></Reveal>

        <div className="relative mt-16 flex flex-col items-center gap-10 lg:block lg:h-[32rem]">
          <Reveal delay={100} className="w-full max-w-xl lg:absolute lg:top-6 lg:left-[7%] lg:w-[34rem] lg:max-w-none">
            <div className="float-slower overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/15">
              <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-border" /><span className="size-2.5 rounded-full bg-border" /><span className="size-2.5 rounded-full bg-border" />
                <span className="ml-3 rounded-md bg-background px-3 py-0.5 text-[11px] text-muted-foreground">Coach view</span>
              </div>
              <CoachScreen />
            </div>
          </Reveal>
          <Reveal delay={260} className="lg:absolute lg:top-0 lg:right-[13%]">
            <div className="float-slow w-[16.5rem] rounded-[2.6rem] border-[7px] border-foreground/85 bg-foreground/85 shadow-2xl shadow-primary/25 sm:w-[17.5rem]">
              <div className="relative h-[28rem] overflow-hidden rounded-[2rem]">
                <span aria-hidden className="absolute top-2 left-1/2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-foreground/85" />
                <div className="h-full pt-6"><PhoneScreen /></div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-16 flex flex-wrap justify-center gap-3 lg:mt-20">
          <Link to="/demo" className={buttonVariants({ size: 'lg' })}>Try the coach demo</Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ faq */

const FAQ = [
  ['Do my players need to install anything?', 'No. Baseline runs in the browser on any phone or laptop. They can add it to the home screen, and it opens like an app.'],
  ['What can a coach see?', 'Only the players who invited them. A player’s log is theirs: sessions, ratings, drills and goals. The coach can read it, leave notes and suggest goals and drills, but cannot change what the player wrote.'],
  ['What if a player forgets to log?', 'It shows. After a scheduled session ends with nothing logged, that player moves to the top of the coach’s list. The player also gets a one-tap rating prompt right after the session.'],
  ['My training times change every week. Can it cope?', 'Yes. Set the usual weekly times once, then move or cancel a single day without touching the rest. The coach sees every player’s week in one list, in time order.'],
  ['How does a coach get started?', 'Create an account, then ask a player to send you the coach link from their Settings. Open it, tap join, and that player appears on your Players page. Add more players the same way.'],
]

export function Faq() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl scroll-mt-16 px-4 py-24 sm:px-6 lg:py-32">
      <Doodle name="ball" className="top-24 -right-16 size-14" rotate={14} />
      <Reveal><p className="text-sm font-medium tracking-wide text-primary uppercase">Questions</p></Reveal>
      <Reveal delay={80}><h2 className="mt-3 text-5xl leading-none sm:text-6xl">What a coach usually asks.</h2></Reveal>
      <div className="mt-12 divide-y border-y">
        {FAQ.map(([q, a], i) => (
          <Reveal key={q} delay={i * 60}>
            <details className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-5 text-muted-foreground">{a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
