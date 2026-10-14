import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type View = 'coach' | 'player'

/** The view a person chose when they signed up, or later in their menu. Null for accounts made before the choice existed. */
export const viewOf = (user: User | null | undefined): View | null => {
  const r = user?.user_metadata?.role
  return r === 'coach' || r === 'player' ? r : null
}

export async function setView(view: View) {
  const { error } = await supabase.auth.updateUser({ data: { role: view } })
  if (error) throw new Error(error.message)
}
