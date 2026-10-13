import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { SetupNotice } from '@/components/setup-notice'
import { Toaster } from '@/components/ui/sonner'
import { applyTheme } from '@/lib/theme'
import { isConfigured } from '@/lib/supabase'
import { themeAtom } from '@/state/atoms'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Root,
})

function Root() {
  const theme = useAtomValue(themeAtom)
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyTheme('system')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [theme])

  return (
    <>
      {isConfigured ? <Outlet /> : <SetupNotice />}
      <Toaster position="bottom-center" />
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      )}
    </>
  )
}
