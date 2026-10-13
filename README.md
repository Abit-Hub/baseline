# Baseline

A training log shared between a player and their coach. The player logs sessions, rates how they felt, and tracks drills and goals. Coaches read the log, leave notes and suggest drills and goals. A coach can follow any number of players. Changes appear live for everyone.

## Stack

Vite · React 19 · TypeScript · pnpm · TanStack Router (file routes) · TanStack Query · TanStack Form · TanStack Table · Jotai · Supabase (Postgres, Auth, Realtime) · Tailwind CSS v4 · shadcn/ui · Zod · date-fns · Vitest · oxlint

## Run it locally

Use Node 20.19+ (Node 24 recommended).

```bash
pnpm install
cp .env.example .env.local   # then fill in the two Supabase values
pnpm dev                     # http://localhost:5173
pnpm check                   # typecheck + lint + unit tests
```

## 1. Create the Supabase project (free)

1. Sign up at supabase.com and create a project. Save the database password somewhere safe.
2. Open **SQL Editor** and run the five files in `supabase/migrations/`, in order, one after the other: `20261013000000_init.sql`, `20261013000001_roles.sql`, `20261013000002_remove_club.sql`, then `20261013000003_schedule.sql`, then `20261013000004_note_seen.sql`. Together they create the tables, row-level security, the player and coach rules and the invite functions.
3. **Project Settings → API**: copy the Project URL and the publishable (anon) key into `.env.local`.
4. **Authentication → Providers → Email**: for a quick start, turn off "Confirm email". Leave it on if you prefer, but then set the URLs in the next step first.

## 2. Deploy it (Vercel, free)

1. Push this folder to a GitHub repository.
2. In Vercel choose **Add New → Project**, import the repo. Framework preset: Vite. Add the same two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
3. Deploy. `vercel.json` already rewrites every path to `index.html`, so links like `/join/abc123` work.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel address and add it to **Redirect URLs** (also `http://localhost:5173` for development).

Netlify and Cloudflare Pages work the same way (build command `pnpm build`, output `dist`, plus a single-page-app redirect to `/index.html`).

## 3. Players and coaches

| | Player | Coach |
|---|---|---|
| Own log | One each, created at sign-up | Joins each player's log by invite link |
| Sessions | Create, edit, delete | Read only |
| Coach notes | Read | Write on a session or in general. Edit and delete only their own |
| Drills and goals | Full control. Can remove a coach's suggestions | Suggest new ones. Edit and delete only their own. Cannot tick off or practise |
| Invite link | Create and replace the coach link. Remove a coach | None |
| Schedule | Weekly times; cancel or move one date | Same. Both can change the schedule |
| Dashboard | None | **Players** page: today and the rest of the week across all players (tap a time for the player's last notes), then everyone they coach with flags for who needs a look |

How to start: the player signs up, chooses "I am a player" and creates their log. In **Settings → Invite your coach** they copy the link and send it. The coach signs up, chooses "I am a coach", opens the link and taps "Join this log as coach". A coach repeats this for every player and switches between them from the **Players** page or the switcher in the header. Each player's log stays separate: a coach never sees a player's data unless that player invited them, and another player can never see it.

## How it fits together

```
src/
  routes/       file-based routes: /login, /join/$code, and the signed-in app under _app (overview, sessions, schedule, plan, settings)
  data/         TanStack Query options and mutations (optimistic toggles) plus the Supabase realtime hook
  domain/       types, constants and pure stats (unit tested)
  state/        Jotai atoms: theme, active log, sessions filter, session editor
  components/   app shell, session form (TanStack Form + Zod), rating chart, shadcn/ui
supabase/       SQL migrations, run in order
```

- **Access:** every table has row-level security. A signed-in person can only read or change rows of a log they belong to, checked by `is_log_member()`. People are added to a log only through the `create_log` and `join_log` functions, so nobody can add themselves to someone else's log.
- **Live updates:** `useRealtime` listens to Postgres changes for the active log and refreshes the matching queries.
- **Roles are enforced in the database,** not just hidden in the screens. `is_log_player()` and `is_log_coach()` back the row-level security policies in `20261013000001_roles.sql`, so a coach's own browser cannot edit a player's entries even by calling the API directly. Invite links always add a coach; the person who created the log is its only player.
- **Coach dashboard:** the `my_players()` function returns one summary row per player a coach follows.

## Not included yet

Password reset email flow, a native mobile app, video attachments and push reminders. TanStack Virtual, Store and Pacer are left out on purpose: the lists are short and Query and Jotai cover the state.

## Install on a phone

The app has a web manifest and icons. On iPhone open it in Safari, tap Share, then **Add to Home Screen**. On Android open it in Chrome, then menu, **Install app** (or **Add to Home screen**). It then opens full screen like an app. It needs a connection to load, there is no offline mode.
