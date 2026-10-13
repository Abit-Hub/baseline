import { useForm } from '@tanstack/react-form'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

const search = z.object({ redirect: z.string().optional(), mode: z.enum(['in', 'up']).optional() })

export const Route = createFileRoute('/login')({
  validateSearch: search,
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession()
    if (data.session) throw redirect({ to: search.redirect ?? '/overview' })
  },
  component: Login,
})

const schema = z.object({
  name: z.string(),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

function Login() {
  const { redirect: back, mode: startMode } = Route.useSearch()
  const [mode, setMode] = useState<'in' | 'up'>(startMode ?? 'in')
  const [notice, setNotice] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setNotice(null)
      if (mode === 'up') {
        if (!value.name.trim()) return void toast.error('Add your name so your coach sees who you are')
        const { data, error } = await supabase.auth.signUp({
          email: value.email,
          password: value.password,
          options: { data: { display_name: value.name.trim() } },
        })
        if (error) return void toast.error(error.message)
        if (!data.session) return setNotice('Check your email to confirm your account, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: value.email,
          password: value.password,
        })
        if (error) return void toast.error(error.message)
      }
      await navigate({ to: back ?? '/overview' })
    },
  })

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <header>
        <Link to="/" className="text-sm font-medium tracking-wide text-primary uppercase">Baseline</Link>
        <h1 className="mt-1 text-5xl leading-none">
          {mode === 'in' ? 'Welcome back' : 'Start your log'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          A shared training notebook for you and your coach.
        </p>
      </header>

      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        {mode === 'up' && (
          <form.Field name="name">
            {(f) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" autoComplete="name" value={f.state.value} onBlur={f.handleBlur}
                  onChange={(e) => f.handleChange(e.target.value)} />
              </div>
            )}
          </form.Field>
        )}
        <form.Field name="email">
          {(f) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={f.state.value}
                onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              <FieldMessage errors={f.state.meta.errors} />
            </div>
          )}
        </form.Field>
        <form.Field name="password">
          {(f) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password"
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                value={f.state.value} onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)} />
              <FieldMessage errors={f.state.meta.errors} />
            </div>
          )}
        </form.Field>

        {notice && <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">{notice}</p>}

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(busy) => (
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="text-sm text-muted-foreground">
        {mode === 'in' ? 'New here?' : 'Already have an account?'}{' '}
        <button
          type="button"
          className="font-medium text-primary underline underline-offset-4"
          onClick={() => {
            setMode(mode === 'in' ? 'up' : 'in')
            setNotice(null)
          }}
        >
          {mode === 'in' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </main>
  )
}

function FieldMessage({ errors }: { errors: unknown[] }) {
  const first = errors[0]
  const text = typeof first === 'string' ? first : (first as { message?: string } | undefined)?.message
  return text ? <p className="text-sm text-destructive">{text}</p> : null
}
