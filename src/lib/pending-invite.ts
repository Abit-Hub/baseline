const KEY = 'baseline-pending-invite'

/**
 * A player who opens a coach's invite link has to sign up and confirm their email first,
 * which can take them away from the page. This remembers the link so they come back to it.
 */
export const pendingInvite = {
  get: () => { try { return localStorage.getItem(KEY) } catch { return null } },
  set: (code: string) => { try { localStorage.setItem(KEY, code) } catch { /* private window */ } },
  clear: () => { try { localStorage.removeItem(KEY) } catch { /* private window */ } },
}
