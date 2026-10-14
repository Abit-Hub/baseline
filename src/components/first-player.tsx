import { InvitePlayerPanel } from '@/components/invite-player'

/** What a coach with no players yet sees: their invite link and what happens next. */
export function FirstPlayer({ coachName }: { coachName: string }) {
  const steps = [
    ['Send your invite link', 'On WhatsApp, to any player you train.'],
    ['They sign up', 'Their log is made for them, with you as their coach.'],
    ['They appear here', 'Then add their training times and payments.'],
  ]
  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-3xl">Invite your first player</h2>
      <ol className="mt-5 flex flex-col gap-4">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-3.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border font-display text-lg text-primary">{i + 1}</span>
            <span><span className="block font-medium">{title}</span><span className="text-sm text-muted-foreground">{body}</span></span>
          </li>
        ))}
      </ol>
      <div className="mt-6"><InvitePlayerPanel coachName={coachName} /></div>
      <p className="mt-5 text-xs text-muted-foreground">A player can also send you their own coach link from their Settings. Open it while signed in and tap “Join as their coach”.</p>
    </div>
  )
}
