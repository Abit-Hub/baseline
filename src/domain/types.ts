export type Role = 'player' | 'coach'

export interface Log {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface Member {
  user_id: string
  role: Role
  profiles: { display_name: string } | null
}

export interface Session {
  id: string
  log_id: string
  session_date: string
  focus: string[]
  rating: number | null
  worked: string
  well: string
  fix: string
  created_at: string
}

export interface Drill {
  id: string
  log_id: string
  name: string
  skill: string
  description: string
  times: number
  last_practised: string | null
  position: number
  created_by: string | null
}

export interface Goal {
  id: string
  log_id: string
  text: string
  target_date: string | null
  done: boolean
  position: number
  created_by: string | null
}

export interface CoachNote {
  id: string
  log_id: string
  session_id: string | null
  note: string
  author_id: string | null
  created_at: string
}

/** One row of the coach dashboard (the my_players() database function). */
export interface PlayerSummary {
  log_id: string
  log_name: string
  player_id: string
  player_name: string
  session_count: number
  last_session: string | null
  avg_recent: number | null
  last_note: string | null
}

export interface Membership {
  log_id: string
  role: Role
}

/** A recurring weekly training time. weekday: 0 = Sunday. Times are "HH:mm:ss". */
export interface ScheduleSlot {
  id: string
  log_id: string
  weekday: number
  start_time: string
  end_time: string | null
  place: string
  created_at: string
}

/** Changes one date of a slot. No new_date means that date is cancelled. */
export interface ScheduleOverride {
  id: string
  log_id: string
  slot_id: string
  on_date: string
  new_date: string | null
  new_start: string | null
  new_end: string | null
}
