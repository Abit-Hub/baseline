import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Footer, ForCoaches, Hero, Nav, Steps } from '@/components/landing/sections'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/')({ component: Landing })

function Landing() {
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    document.title = 'Baseline: a shared training log for players and coaches'
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)))
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <div className="overflow-x-clip">
      <Nav signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <Steps />
        <ForCoaches signedIn={signedIn} />
      </main>
      <Footer signedIn={signedIn} />
    </div>
  )
}
