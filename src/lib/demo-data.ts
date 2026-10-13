import { addDays, startOfDay } from 'date-fns'
import { isoDate } from '@/domain/schedule'
import type { CoachNote, Goal, ScheduleSlot, Session } from '@/domain/types'

/**
 * Sample players for the /demo page. Everything is relative to today, so the
 * demo always looks current: a session today, one tomorrow, a missed log, an
 * unanswered entry. Nothing here touches the database.
 */

export interface DemoPlayer {
  id: string
  name: string
  slots: { offset: number; start: string; end: string; place?: string }[]
  /** [days ago, rating, focus, what went well, work on next] */
  sessions: [number, number, string[], string, string][]
  goals: [string, boolean][]
  /** [days ago, note] */
  notes: [number, string][]
}

const PLAYERS: DemoPlayer[] = [
  {
    id: 'chidi', name: 'Chidi',
    slots: [
      { offset: 0, start: '16:30', end: '18:00', place: 'Court 1' },
      { offset: 3, start: '16:30', end: '18:00', place: 'Court 1' },
      { offset: 4, start: '09:00', end: '12:00' },
    ],
    sessions: [
      [3, 4, ['Forehand', 'Footwork'], 'Rallies are getting longer.', 'Keep the elbow in on the forehand.'],
      [6, 3, ['Serve'], 'Toss felt steadier.', 'Toss lands in the same spot every time.'],
      [10, 4, ['Backhand'], 'Early shoulder turn is working.', 'Finish over the opposite shoulder.'],
      [13, 3, ['Footwork', 'Fitness'], 'Good energy.', 'Recover to the centre after every shot.'],
      [17, 2, ['Forehand'], 'Struggled with timing.', 'Slow the swing down, hit through the ball.'],
      [20, 3, ['Return'], 'Got more returns in.', 'Start the split step earlier.'],
    ],
    goals: [['Rally 15 forehands in a row', false], ['Serve toss in the same spot, 10 times', true], ['Split step before every return', false]],
    notes: [[2, 'Great session. Your backhand has come a long way. Next week we start on the volley.'], [9, 'Watch the grip on the serve. We will fix it together on Saturday.']],
  },
  {
    id: 'amaka', name: 'Amaka',
    slots: [
      { offset: 0, start: '18:15', end: '19:30', place: 'Court 2' },
      { offset: 2, start: '17:00', end: '18:15', place: 'Court 2' },
    ],
    sessions: [
      [5, 4, ['Serve', 'Return'], 'First serves landing more often.', 'Follow the serve to the net.'],
      [8, 4, ['Volley'], 'Soft hands at the net.', 'Move forward as you hit.'],
      [12, 5, ['Match play'], 'Won the practice set.', 'Stay patient on long rallies.'],
      [15, 3, ['Backhand'], 'Better preparation.', 'Do not rush the backswing.'],
    ],
    goals: [['Win a set against Tunde', false], ['Hit 7 of 10 first serves in', false]],
    notes: [[4, 'Strong week. Keep the same routine before every serve.']],
  },
  {
    id: 'tunde', name: 'Tunde',
    slots: [
      { offset: -2, start: '16:00', end: '17:30' },
      { offset: 1, start: '16:00', end: '17:30' },
    ],
    sessions: [
      [6, 3, ['Forehand'], 'Contact point felt better.', 'Hit through the ball, not at it.'],
      [10, 2, ['Fitness'], 'Hard session, finished it.', 'Warm up properly before we start.'],
      [14, 3, ['Backhand'], 'Slice is improving.', 'Keep the racket head up.'],
    ],
    goals: [['Hit 10 backhands cross-court in a row', false]],
    notes: [[5, 'Good work on the forehand. Log your sessions so I can see how you feel.']],
  },
  {
    id: 'ife', name: 'Ife',
    slots: [
      { offset: -1, start: '17:00', end: '18:30', place: 'Court 3' },
      { offset: 3, start: '18:15', end: '19:30', place: 'Court 3' },
    ],
    sessions: [
      [1, 5, ['Serve', 'Match play'], 'Best serving day so far. Won two games in a row.', 'Second serve: add more spin.'],
      [4, 4, ['Return'], 'Read the serve earlier.', 'Take the ball earlier.'],
      [8, 3, ['Footwork'], 'Quicker first step.', 'Keep the knees bent.'],
      [11, 4, ['Forehand'], 'Cleaner contact.', 'Follow through all the way.'],
      [14, 3, ['Volley'], 'Got to the net.', 'Hands in front of the body.'],
    ],
    goals: [['Hold serve three games in a row', false], ['Add spin to the second serve', false]],
    notes: [[5, 'Nice footwork this week. Keep it going.']],
  },
]

/** A fixed "now" of 3pm today, so there is always something later today. */
export function demoNow() {
  const d = new Date()
  d.setHours(15, 0, 0, 0)
  return d
}

const when = (daysAgo: number, time = '20:00:00') => `${isoDate(addDays(startOfDay(new Date()), -daysAgo))}T${time}`

export function buildDemo() {
  const today = startOfDay(new Date())
  const slots: ScheduleSlot[] = []
  const sessions: Session[] = []
  const goals: Goal[] = []
  const notes: CoachNote[] = []

  for (const p of PLAYERS) {
    p.slots.forEach((s, i) => slots.push({
      id: `${p.id}-slot-${i}`, log_id: p.id,
      weekday: addDays(today, s.offset).getDay(),
      start_time: `${s.start}:00`, end_time: `${s.end}:00`, place: s.place ?? '',
      created_at: when(30),
    }))
    p.sessions.forEach(([ago, rating, focus, well, fix], i) => sessions.push({
      id: `${p.id}-s-${i}`, log_id: p.id, session_date: isoDate(addDays(today, -ago)),
      focus, rating, worked: '', well, fix, created_at: when(ago),
    }))
    p.goals.forEach(([text, done], i) => goals.push({
      id: `${p.id}-g-${i}`, log_id: p.id, text, done, target_date: null, position: i + 1, created_by: null,
    }))
    p.notes.forEach(([ago, note], i) => notes.push({
      id: `${p.id}-n-${i}`, log_id: p.id, session_id: null, note, author_id: 'coach', created_at: when(ago, '18:00:00'),
    }))
  }
  return { players: PLAYERS.map(({ id, name }) => ({ id, name })), slots, sessions, goals, notes }
}
