import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
}

/** Tells people why saving fails when the connection drops. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <div role="status" className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-sm text-background print:hidden">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      You are offline. What you add will not save until you are back online.
    </div>
  )
}
