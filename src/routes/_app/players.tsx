import { createFileRoute, redirect } from '@tanstack/react-router'

/** The coach's players list moved into the coach view. This keeps old links and bookmarks working. */
export const Route = createFileRoute('/_app/players')({
  beforeLoad: () => { throw redirect({ to: '/coach/players' }) },
})
