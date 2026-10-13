import { useAtom } from 'jotai'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { themeAtom, type ThemeChoice } from '@/state/atoms'

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'Match device', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom)
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-lg border p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors',
            theme === value && 'bg-accent text-accent-foreground',
          )}
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
