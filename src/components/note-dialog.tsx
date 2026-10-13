import { useAtom } from 'jotai'
import { NoteComposer } from '@/components/coach-notes'
import { useLog } from '@/components/log-context'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { noteDialogAtom } from '@/state/atoms'

/** A quick note from anywhere in the app, for the coach on court or in the car. */
export function NoteDialog() {
  const { isCoach, playerName } = useLog()
  const [open, setOpen] = useAtom(noteDialogAtom)
  if (!isCoach) return null
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Note for {playerName}</DialogTitle>
          <DialogDescription>They see it on their overview straight away.</DialogDescription>
        </DialogHeader>
        <NoteComposer label="What should they know or work on?" onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
