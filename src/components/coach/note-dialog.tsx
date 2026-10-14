import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { myPlayersQuery, useAddNote } from '@/data/queries'
import { cn } from '@/lib/utils'
import { coachNoteAtom } from '@/state/atoms'

/** A note for any player, from any coach screen. Pick the player, write, send. */
export function CoachNoteDialog() {
  const [state, setState] = useAtom(coachNoteAtom)
  const players = useQuery(myPlayersQuery())
  const add = useAddNote()
  const [who, setWho] = useState<string | null>(null)
  const [text, setText] = useState('')
  const list = players.data ?? []

  useEffect(() => {
    if (state.open) { setWho(state.logId ?? list[0]?.log_id ?? null); setText('') }
  }, [state.open, state.logId]) // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => setState({ open: false, logId: null })
  const name = list.find((p) => p.log_id === who)?.player_name
  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Add a note</DialogTitle>
          <DialogDescription>{list.length ? 'The player sees it on their home screen straight away.' : 'Invite a player first, then you can leave them notes.'}</DialogDescription>
        </DialogHeader>
        {list.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Player">
              {list.map((p) => (
                <button key={p.log_id} type="button" role="radio" aria-checked={who === p.log_id} onClick={() => setWho(p.log_id)}
                  className={cn('rounded-full border px-3.5 py-2 text-sm md:px-3 md:py-1 transition-colors', who === p.log_id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                  {p.player_name || 'Unnamed'}
                </button>
              ))}
            </div>
            <Textarea aria-label="Note" placeholder="What should they know or work on?" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
            <Button disabled={!who || !text.trim() || add.isPending}
              onClick={() => who && add.mutate({ logId: who, note: text.trim() }, {
                onSuccess: () => { toast.success(`Note added for ${name ?? 'the player'}`); close() },
                onError: (e) => toast.error(e.message),
              })}>
              {add.isPending ? 'Sending…' : 'Add note'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
