import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FinalCta, Features, Footer, ForCoaches, Hero, HowItWorks, Nav, SkillsMarquee } from '@/components/landing/sections'
import { ScrollProgress } from '@/components/landing/motion'
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
      <ScrollProgress />
      <Nav signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <SkillsMarquee />
        <HowItWorks />
        <Features />
        <ForCoaches signedIn={signedIn} />
        <FinalCta signedIn={signedIn} />
      </main>
      <Footer signedIn={signedIn} />
    </div>
  )
}
