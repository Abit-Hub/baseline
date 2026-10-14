import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

/** Goals and drills now live under Progress. This keeps old links and bookmarks working. */
export const Route = createFileRoute('/_app/plan')({
  validateSearch: z.object({ tab: z.enum(['goals', 'drills']).optional() }),
  beforeLoad: ({ search }) => { throw redirect({ to: '/progress', search: { tab: search.tab ?? 'goals' } }) },
})
