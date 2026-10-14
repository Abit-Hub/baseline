import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function NoteBox({ players, playerId, onClose, onSave }: {
  players: { id: string; name: string }[]
  playerId: string | null
  onClose: () => void
  onSave: (logId: string, note: string) => void
}) {
  const [who, setWho] = useState(playerId)
  const [text, setText] = useState('')
  useEffect(() => { setWho(playerId); setText('') }, [playerId])
  return (
    <Dialog open={Boolean(playerId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Add a note</DialogTitle>
          <DialogDescription>The player sees it on their home screen straight away.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Player">
          {players.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={who === p.id} onClick={() => setWho(p.id)}
              className={cn('rounded-full border px-3.5 py-2 text-sm md:px-3 md:py-1 transition-colors', who === p.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
              {p.name}
            </button>
          ))}
        </div>
        <Textarea aria-label="Note" placeholder="What should they know or work on?" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
        <Button disabled={!who || !text.trim()} onClick={() => who && onSave(who, text.trim())}>Add note</Button>
      </DialogContent>
    </Dialog>
  )
}
