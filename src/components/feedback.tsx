import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'

/** A box for "this confused me" or "I wish it could...". Goes to the feedback table. */
export function FeedbackForm() {
  const [text, setText] = useState('')
  const send = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.from('feedback').insert({ message, page: window.location.pathname })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => { setText(''); toast.success('Sent. Thank you.') },
    onError: (e) => toast.error(`Could not send: ${e.message}`),
  })
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim()) }}>
      <Textarea aria-label="Your feedback" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Something confusing, something broken, something you wish it did…" />
      <Button type="submit" variant="outline" className="self-start" disabled={!text.trim() || send.isPending}>
        {send.isPending ? 'Sending…' : 'Send feedback'}
      </Button>
    </form>
  )
}
