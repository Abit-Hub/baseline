import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Wordmark } from '@/components/wordmark'

export const Route = createFileRoute('/reset-password')({ component: ResetPassword })

/** The page the emailed link opens. Supabase turns the link into a short session, which lets us set a new password. */
function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    void supabase.auth.getSession().then(({ data }) => alive && setReady(Boolean(data.session)))
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => { alive = false; data.subscription.unsubscribe() }
  }, [])

  const save = async () => {
    if (password.length < 8) return void toast.error('Use at least 8 characters')
    if (password !== confirm) return void toast.error('The two passwords do not match')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return void toast.error(error.message)
    toast.success('Password updated')
    await navigate({ to: '/start' })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <header>
        <Link to="/"><Wordmark className="text-3xl" /></Link>
        <h1 className="mt-1 text-5xl leading-none">Choose a new password</h1>
      </header>
      {ready === null && <p className="text-muted-foreground">Checking your link…</p>}
      {ready === false && (
        <>
          <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
            This link has expired or was already used. Ask for a new one.
          </p>
          <Link to="/login" className="self-start text-sm font-medium text-primary underline underline-offset-4">Back to sign in</Link>
        </>
      )}
      {ready && (
        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); void save() }}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Type it again</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" size="lg" disabled={busy}>{busy ? 'One moment…' : 'Save password'}</Button>
        </form>
      )}
    </main>
  )
}
