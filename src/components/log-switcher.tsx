import { useLog } from '@/components/log-context'

/** Shown when the person belongs to more than one log, for example a coach with several players. */
export function LogSwitcher() {
  const { log, logs, roleOf, selectLog } = useLog()
  if (logs.length < 2) return null
  return (
    <label className="flex min-w-0 items-center">
      <span className="sr-only">Switch log</span>
      <select value={log.id} onChange={(e) => selectLog(e.target.value)}
        className="h-8 max-w-44 truncate rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30">
        {logs.map((l) => (
          <option key={l.id} value={l.id}>{l.name}{roleOf(l.id) === 'player' ? ' (mine)' : ''}</option>
        ))}
      </select>
    </label>
  )
}
