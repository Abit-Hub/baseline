export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="text-4xl">Connect Supabase</h1>
      <p className="text-muted-foreground">
        Baseline needs a Supabase project to store your log. Copy <code>.env.example</code> to{' '}
        <code>.env.local</code>, fill in the project URL and key, then restart the dev server.
      </p>
      <p className="text-sm text-muted-foreground">The README walks through it step by step.</p>
    </main>
  )
}
