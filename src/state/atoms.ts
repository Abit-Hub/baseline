import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type ThemeChoice = 'system' | 'light' | 'dark'

export const themeAtom = atomWithStorage<ThemeChoice>('baseline-theme', 'system')
export const activeLogIdAtom = atomWithStorage<string | null>('baseline-active-log', null)
/** Skill chip selected on the Sessions page (null = all). */
export const focusFilterAtom = atom<string | null>(null)

/** The session editor is opened from several pages, so its state lives here. */
export const sessionEditorAtom = atom<{ open: boolean; session: import('@/domain/types').Session | null; date?: string }>({
  open: false,
  session: null,
})

/** The coach's quick note box, opened from the header. */
export const noteDialogAtom = atom(false)

/** Session prompts the player has chosen to skip, so they do not come back. */
export const dismissedPromptsAtom = atomWithStorage<string[]>('baseline-dismissed-prompts', [])
