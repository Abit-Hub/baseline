import { format, parseISO } from 'date-fns'
import { RATINGS } from '@/domain/constants'
import type { Session } from '@/domain/types'

const W = 640, H = 200, L = 64, R = 16, T = 14, B = 30

/** Ratings of the latest sessions, oldest to newest, drawn to one 1–5 scale. */
export function RatingChart({ newestFirst }: { newestFirst: Session[] }) {
  const pts = newestFirst.filter((s) => s.rating).slice(0, 12).reverse()
  if (pts.length < 2)
    return <p className="text-sm text-muted-foreground">Rate two sessions and your progress line shows up here.</p>

  const x = (i: number) => L + (i * (W - L - R)) / (pts.length - 1)
  const y = (v: number) => T + ((5 - v) * (H - T - B)) / 4
  const step = Math.ceil(pts.length / 6)
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.rating!).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full"
      aria-label={`How the last ${pts.length} sessions felt, from ${pts[0].rating} to ${pts[pts.length - 1].rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" />
          <text x={L - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
            {v} {RATINGS[v - 1]}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={p.id} cx={x(i)} cy={y(p.rating!)} r={i === pts.length - 1 ? 6 : 4}
          fill={i === pts.length - 1 ? 'var(--primary)' : 'var(--card)'} stroke="var(--primary)" strokeWidth="2" />
      ))}
      {pts.map((p, i) =>
        i % step === 0 || i === pts.length - 1 ? (
          <text key={p.id} x={x(i)} y={H - 8} fontSize="11" fill="var(--muted-foreground)"
            textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}>
            {format(parseISO(p.session_date), 'd MMM')}
          </text>
        ) : null,
      )}
    </svg>
  )
}
