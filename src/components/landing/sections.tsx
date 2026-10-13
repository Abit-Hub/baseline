import { Link } from '@tanstack/react-router'
import { ArrowRight, Lock } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { SKILLS } from '@/domain/constants'
import { cn } from '@/lib/utils'
import { BallDot, CourtSketch, Doodle, HeroBall, useBallTrail } from './doodles'
import { HeroNotebook } from './hero-notebook'
import { Reveal, prefersReducedMotion, useInView } from './motion'

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

function Cta({ signedIn, size = 'lg', label = 'Start your log' }: { signedIn: boolean; size?: 'lg' | 'default'; label?: string }) {
  return signedIn ? (
    <Link to="/overview" className={cn(buttonVariants({ size }), 'group')}>
      Open your log <ArrowRight className="transition-transform group-hover:translate-x-1" />
    </Link>
  ) : (
    <Link to="/login" search={{ mode: 'up' }} className={cn(buttonVariants({ size }), 'group')}>
      {label} <ArrowRight className="transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

/* ------------------------------------------------------------------ nav */

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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="font-display text-3xl leading-none">Baseline</Link>
        <nav aria-label="Sections" className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {[['how', 'How it works'], ['see', 'See it'], ['features', 'Features'], ['coaches', 'For coaches'], ['faq', 'Questions']].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="transition-colors hover:text-foreground">{label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {!signedIn && <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Sign in</Link>}
          <Cta signedIn={signedIn} size="default" label="Get started" />
        </div>
      </div>
    </header>
  )
}

/* ----------------------------------------------------------------- hero */

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
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24 lg:pb-32">
        <div className="in-view pl-0 sm:pl-6 lg:pl-10">
          <p className="rise mb-5 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur" style={delay(0)}>
            <span className="relative flex size-2">
              <span className="ping-ring absolute inline-flex size-full rounded-full bg-primary/60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            A shared notebook for players and coaches
          </p>
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
          <p className="rise mt-7 max-w-xl text-lg text-muted-foreground" style={delay(900)}>
            Baseline is where you log every lawn tennis session, rate how it felt, and get notes back from your coach.
            Walk into the next session knowing exactly where the last one stopped.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={delay(1050)}>
            <Cta signedIn={signedIn} />
            <Link to="/demo" className={buttonVariants({ variant: 'outline', size: 'lg' })}>See the coach view</Link>
          </div>
          <p className="rise mt-5 text-sm text-muted-foreground" style={delay(1200)}>Works on your phone. Your coach joins with one link.</p>
        </div>
        <div className="rise lg:pr-4" style={delay(500)}><HeroNotebook /></div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- marquee */

export function SkillsMarquee() {
  const row = [...SKILLS, ...SKILLS]
  return (
    <div aria-hidden className="relative overflow-hidden border-y bg-card/50 py-5 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex gap-10">
            {row.map((s, i) => (
              <span key={i} className="flex items-center gap-10 font-display text-3xl text-muted-foreground/80">
                {s}<span className="size-1.5 rounded-full bg-primary/50" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- how it works */

const STEPS = [
  { n: '1', title: 'Write it down', body: 'Right after you leave the court, log the date, what you worked on and how it felt. It takes a minute.' },
  { n: '2', title: 'Your coach replies', body: 'They read your entry, leave a note, and suggest a drill or a goal. You see it the moment they save it.' },
  { n: '3', title: 'Pick up where you stopped', body: 'Before the next session, you both see the last notes and the goals still open. No more starting from memory.' },
]

export function HowItWorks() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const refs = useRef<(HTMLElement | null)[]>([])

  // On wide screens the court follows whichever step is in the middle of the screen.
  useEffect(() => {
    if (!matchMedia('(min-width: 1024px)').matches) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step) as 1 | 2 | 3) }),
      { rootMargin: '-42% 0px -42% 0px' },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="how" className="relative mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6 lg:py-32">
      <Reveal><p className="text-sm font-medium tracking-wide text-primary uppercase">How it works</p></Reveal>
      <Reveal delay={80}><h2 className="mt-3 max-w-2xl text-5xl leading-none sm:text-6xl">Three steps, and the notebook runs itself.</h2></Reveal>
      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_20rem] lg:gap-20">
        <ol className="flex flex-col gap-12 lg:gap-0">
          {STEPS.map((s, i) => (
            <li key={s.n} ref={(el) => { refs.current[i] = el }} data-step={s.n}
              className={cn('relative border-l-2 pl-7 transition-all duration-500 lg:min-h-[17rem] lg:py-6',
                step === 0 || step === i + 1 ? 'border-primary opacity-100' : 'border-border opacity-45')}>
              <span className="absolute top-0 -left-[1.1rem] grid size-9 place-items-center rounded-full border bg-background font-display text-xl text-primary shadow-sm lg:top-6">{s.n}</span>
              <Reveal delay={i * 100}>
                <h3 className="text-3xl sm:text-4xl">{s.title}</h3>
                <p className="mt-2 max-w-md text-lg text-muted-foreground">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="lg:relative">
          <div className="lg:sticky lg:top-24"><CourtSketch step={step} /></div>
        </div>
      </div>
      <Doodle name="racket" className="top-24 right-[4%] h-28 w-20" rotate={18} />
    </section>
  )
}

/* -------------------------------------------------------------- features */

function Card({ className, children, delay: d = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={d} className={cn('group overflow-hidden rounded-2xl border bg-card p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10 sm:p-8', className)}>
      {children}
    </Reveal>
  )
}

const FEEL = [2, 3, 3, 4, 3, 4, 5]
const pt = (i: number) => [20 + i * 60, 140 - (FEEL[i] - 1) * 28] as const

// A shallow arc from each point to the next, so the ball seems to bounce between sessions.
const arc = (i: number) => {
  const [x1, y1] = pt(i), [x2, y2] = pt(i + 1)
  return `Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 34} ${x2} ${y2}`
}
const BOUNCE = `M${pt(0).join(' ')} ${FEEL.slice(1).map((_, i) => arc(i)).join(' ')}`
// The same path with its start moved to the origin, for the ball that rides it.
const RIDE = `M0 0 ${FEEL.slice(1).map((_, i) => arc(i).replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${Number(x) - pt(0)[0]} ${Number(y) - pt(0)[1]}`)).join(' ')}`

function FeelChart() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4)
  const line = FEEL.map((_, i) => pt(i).join(',')).join(' ')
  const still = prefersReducedMotion()
  return (
    <div ref={ref} className={cn(seen && 'in-view')}>
      <svg viewBox="0 0 380 170" className="w-full overflow-visible" role="img" aria-label="Example chart of session ratings rising over seven sessions, drawn as a ball bouncing from one session to the next">
        {[1, 3, 5].map((r) => <line key={r} x1="0" x2="380" y1={140 - (r - 1) * 28} y2={140 - (r - 1) * 28} className="stroke-border" strokeDasharray="3 5" />)}
        <polygon className="fade-after fill-primary/10" style={delay(1300)} points={`20,140 ${line} 380,140`} />
        <polyline className="draw stroke-primary/30" pathLength="1" points={line} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path className="draw stroke-primary" pathLength="1" d={BOUNCE} fill="none" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1" />
        {FEEL.map((_, i) => (
          <ellipse key={i} cx={pt(i)[0]} cy={pt(i)[1] + 6} rx="7" ry="2" className={cn('fill-foreground/15 opacity-0', seen && 'pop')} style={{ ...delay(250 + i * 200), transformBox: 'fill-box', transformOrigin: 'center' }} />
        ))}
        {FEEL.map((_, i) => (
          <circle key={i} cx={pt(i)[0]} cy={pt(i)[1]} r="4.5" className={cn('fill-card stroke-primary opacity-0', seen && 'pop')} strokeWidth="2.5"
            style={{ ...delay(250 + i * 200), transformOrigin: 'center', transformBox: 'fill-box' }} />
        ))}
        {seen && (
          <g transform={`translate(${(still ? pt(FEEL.length - 1) : pt(0)).join(' ')})`}>
            <BallDot r={9} />
            {!still && <animateMotion dur="7s" begin="1.8s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" path={RIDE} />}
          </g>
        )}
      </svg>
    </div>
  )
}

function SyncPulse() {
  return (
    <div className="relative mt-8 flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-medium text-accent-foreground">You</span>
      <div className="relative h-px flex-1 bg-border"><span className="travel absolute -top-[3px] size-2 rounded-full bg-primary" /></div>
      <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
        <span className="ping-ring absolute inset-0 rounded-full bg-primary/40" />
        <span className="relative">Coach</span>
      </span>
    </div>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TRAIN = new Set(['Tue', 'Fri', 'Sat'])

function WeekStrip() {
  const [ref, seen] = useInView<HTMLDivElement>(0.5)
  return (
    <div ref={ref}>
      <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-xs">
        {DAYS.map((d, i) => (
          <span key={d} className={cn('rounded-lg border py-3 transition-colors', TRAIN.has(d) ? 'border-primary/40 bg-accent font-medium text-accent-foreground' : 'text-muted-foreground', TRAIN.has(d) && seen && 'pop')}
            style={delay(i * 90)}>{d}</span>
        ))}
      </div>
      <p className="mt-5 text-sm"><span className="text-muted-foreground">Next session </span><span className="font-medium">Tuesday, 4:30pm to 6pm</span></p>
      <div className="mt-3 flex gap-2 text-xs">
        <span className="rounded-md border px-2.5 py-1">Move</span>
        <span className="rounded-md border px-2.5 py-1">Cancel this one</span>
      </div>
    </div>
  )
}

function Goals() {
  const items = ['Rally 15 forehands in a row', 'Serve toss in the same spot, 10 times', 'Split step before every return']
  return (
    <ul className="mt-6 flex flex-col gap-3.5">
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-3 text-[0.95rem]">
          <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5" className="stroke-border" strokeWidth="1.8" />
            <path d="M7 12.5l3.2 3.2L17 8.5" pathLength="1" className="tick-loop stroke-primary" style={{ '--d': `${i * 0.9}s` } as CSSProperties} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t}
        </li>
      ))}
    </ul>
  )
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t bg-muted/40">
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <Doodle name="ball" className="top-20 right-[6%] size-16" rotate={-12} />
        <Doodle name="arrow" className="top-36 right-[16%] h-14 w-20" rotate={8} />
        <Reveal><p className="text-sm font-medium tracking-wide text-primary uppercase">Features</p></Reveal>
        <Reveal delay={80}><h2 className="mt-3 max-w-2xl text-5xl leading-none sm:text-6xl">Everything the two of you need, nothing you don’t.</h2></Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Card className="md:col-span-4">
            <h3 className="text-3xl">See your game improve</h3>
            <p className="mt-2 max-w-md text-muted-foreground">Rate every session. Baseline charts how they felt, compares your latest three against the three before, and shows where your time is going.</p>
            <div className="mt-6"><FeelChart /></div>
          </Card>
          <Card className="md:col-span-2" delay={120}>
            <h3 className="text-3xl">Live, for both of you</h3>
            <p className="mt-2 text-muted-foreground">When one of you saves something, the other sees it straight away. No refresh, no chasing on chat.</p>
            <SyncPulse />
          </Card>
          <Card className="md:col-span-3" delay={80}>
            <h3 className="text-3xl">Training times that stay straight</h3>
            <p className="mt-2 text-muted-foreground">Set the usual weekly times. Move or cancel a single day when life gets in the way.</p>
            <WeekStrip />
          </Card>
          <Card className="md:col-span-3" delay={160}>
            <h3 className="text-3xl">Drills and goals</h3>
            <p className="mt-2 text-muted-foreground">Keep a drill list, set small targets, and let your coach suggest the next one. You tick them off.</p>
            <Goals />
          </Card>
          <Card className="md:col-span-6" delay={80}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Lock className="size-5" /></span>
              <div>
                <h3 className="text-3xl">Private by design</h3>
                <p className="mt-1 max-w-3xl text-muted-foreground">Every player has their own log. A coach sees only the players who invited them, and a player never sees anyone else’s. Your coach can add notes and suggestions, but can’t change what you wrote.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- coaches */

const COACH_POINTS = [
  ['One screen for the whole week', 'Today and the days ahead, across every player you train, in time order.'],
  ['Prepared before you walk on', 'Tap a time to see what that player last wrote, your last note, and their open goals.'],
  ['Know who needs a look', 'Nothing logged since a session, or an entry you haven’t answered, shows up first.'],
  ['A note from the car', 'One button, one box. Write it right after the session while it is fresh.'],
]

export function ForCoaches({ signedIn }: { signedIn: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.35)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!seen) return
    const id = setTimeout(() => setOpen(true), 1500)
    return () => clearTimeout(id)
  }, [seen])

  return (
    <section id="coaches" className="mx-auto grid max-w-6xl scroll-mt-16 items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:py-32">
      <div>
        <Reveal><p className="text-sm font-medium tracking-wide text-primary uppercase">For coaches</p></Reveal>
        <Reveal delay={80}><h2 className="mt-3 text-5xl leading-none sm:text-6xl">Coaching a full week? Open one screen.</h2></Reveal>
        <ul className="mt-9 flex flex-col gap-6">
          {COACH_POINTS.map(([title, body], i) => (
            <Reveal as="li" key={title} delay={i * 110} className="flex gap-4">
              <span className="mt-2.5 h-px w-6 shrink-0 bg-primary" />
              <span><span className="block text-lg font-medium">{title}</span><span className="text-muted-foreground">{body}</span></span>
            </Reveal>
          ))}
        </ul>
        <Reveal delay={200} className="mt-10 flex flex-wrap gap-3">
          <Link to="/demo" className={buttonVariants({ size: 'lg' })}>Try the coach demo</Link>
          <Cta signedIn={signedIn} label="Create an account" />
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div ref={ref} className="rounded-2xl border bg-card p-5 shadow-xl shadow-primary/10 sm:p-6">
          <div className="flex items-baseline justify-between border-b pb-3">
            <p className="font-display text-3xl">Players</p>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Example</p>
          </div>
          <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">Today</p>
          <div className="divide-y">
            {[['4:30pm to 6pm', 'Chidi', true], ['6:15pm to 7:30pm', 'Amaka', false]].map(([time, name, expands], i) => (
              <div key={name as string} className={cn('py-3', seen ? 'rise' : 'opacity-0')} style={delay(i * 180)}>
                <div className="flex items-center gap-3">
                  <span className="tabular w-32 shrink-0 text-sm">{time}</span>
                  <span className="flex-1 font-medium">{name}</span>
                </div>
                {expands && (
                  <div className={cn('grid transition-all duration-700 ease-out', open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <div className="overflow-hidden">
                      <dl className="flex flex-col gap-2.5 rounded-lg bg-muted/60 p-3 text-sm">
                        <div><dt className="text-xs tracking-wide text-muted-foreground uppercase">Last session · 3 days ago · felt solid</dt><dd>Work on next: keep the elbow in on the forehand.</dd></div>
                        <div><dt className="text-xs tracking-wide text-muted-foreground uppercase">Open goals</dt><dd>Rally 15 forehands in a row</dd></div>
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs tracking-wide text-muted-foreground uppercase">Your players</p>
          <ul className="mt-2 divide-y rounded-lg border">
            {[['Tunde', 'Nothing logged for Saturday’s session', true], ['Ife', 'Last session yesterday', false], ['Chidi', 'Last session 3 days ago', false]].map(([name, line, flag], i) => (
              <li key={name as string} className={cn('flex items-center justify-between gap-3 px-4 py-3', seen ? 'rise' : 'opacity-0')} style={delay(500 + i * 150)}>
                <span>
                  <span className="block text-sm font-medium">{name}</span>
                  <span className={cn('block text-sm', flag ? 'text-destructive' : 'text-muted-foreground')}>{line}</span>
                </span>
                {flag && <span className="size-2 shrink-0 rounded-full bg-destructive" />}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}

/* ------------------------------------------------------------ closing */

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="ruled margin-line relative overflow-hidden border-t">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/0 to-background" />
      <Doodle name="bottle" className="bottom-16 left-[14%] h-24 w-20" rotate={-10} />
      <Doodle name="racket" className="top-14 right-[12%] h-32 w-24" rotate={22} />
      <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 lg:py-36">
        <Reveal><h2 className="text-[clamp(3rem,8vw,5.5rem)] leading-none">Start your log tonight.</h2></Reveal>
        <Reveal delay={100}><p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Make an account, log your first session, and send your coach the invite link.</p></Reveal>
        <Reveal delay={200} className="mt-9 flex justify-center"><Cta signedIn={signedIn} /></Reveal>
      </div>
    </section>
  )
}

export function Footer({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
        <span className="font-display text-2xl">Baseline</span>
        <p className="text-sm text-muted-foreground">A shared training log for players and the coaches who train them.</p>
        <div className="ml-auto flex items-center gap-4 text-sm">
          {!signedIn && <Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link>}
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}
