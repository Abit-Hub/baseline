import { useEffect, useState } from 'react'

/** The current time, refreshed every minute so things that depend on it appear on their own. */
export function useNow(everyMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), everyMs)
    return () => clearInterval(id)
  }, [everyMs])
  return now
}
