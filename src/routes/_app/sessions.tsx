import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState,
} from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { useAtom, useSetAtom } from 'jotai'
import { ArrowDown, ArrowUp, ArrowUpDown, NotebookPen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLog } from '@/components/log-context'
import { EmptyState, ListSkeleton, PageHeader, RatingPips } from '@/components/ui-bits'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { rowsQuery } from '@/data/queries'
import { focusCounts } from '@/domain/stats'
import type { Session } from '@/domain/types'
import { cn } from '@/lib/utils'
import { focusFilterAtom, sessionEditorAtom } from '@/state/atoms'

export const Route = createFileRoute('/_app/sessions')({ component: Sessions })

const col = createColumnHelper<Session>()

function Sessions() {
  const { log, isPlayer } = useLog()
  const { data = [], isPending } = useQuery(rowsQuery('sessions', log.id))
  const notes = useQuery(rowsQuery('coach_notes', log.id))
  const latestNote = useMemo(() => {
    const m = new Map<string, string>()
    for (const n of notes.data ?? []) if (n.session_id && !m.has(n.session_id)) m.set(n.session_id, n.note)
    return m
  }, [notes.data])
  const [filter, setFilter] = useAtom(focusFilterAtom)
  const setEditor = useSetAtom(sessionEditorAtom)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])

  const rows = useMemo(() => (filter ? data.filter((s) => s.focus.includes(filter)) : data), [data, filter])
  const chips = useMemo(() => focusCounts(data), [data])

  const columns = useMemo(
    () => [
      col.accessor('session_date', {
        id: 'date', header: 'Date',
        cell: (c) => (
          <button type="button" onClick={() => setEditor({ open: true, session: c.row.original })}
            className="text-left font-medium underline-offset-4 hover:underline focus-visible:underline">
            {format(parseISO(c.getValue()), 'EEE d MMM')}
          </button>
        ),
      }),
      col.accessor('focus', {
        header: 'Focus', enableSorting: false,
        cell: (c) => <span className="flex flex-wrap gap-1">{c.getValue().map((f) => (
          <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-xs">{f}</span>))}</span>,
      }),
      col.accessor((s) => s.rating ?? 0, { id: 'rating', header: 'Feel', cell: (c) => <RatingPips value={c.getValue() || null} /> }),
      col.display({
        id: 'notes', header: 'Notes', enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        cell: (c) => {
          const s = c.row.original
          return (
            <div className="max-w-64 text-sm text-muted-foreground">
              {s.fix && <p className="line-clamp-2"><span className="text-foreground">Fix:</span> {s.fix}</p>}
              {latestNote.get(s.id) && <p className="line-clamp-2"><span className="text-foreground">Coach:</span> {latestNote.get(s.id)}</p>}
            </div>
          )
        },
      }),
    ],
    [setEditor, latestNote],
  )

  const table = useReactTable({
    data: rows, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      <PageHeader title="Sessions">
        {isPlayer && <Button onClick={() => setEditor({ open: true, session: null })}>Log session</Button>}
      </PageHeader>

      {isPending ? <ListSkeleton rows={5} /> : data.length === 0 ? (
        <EmptyState title="No sessions yet" icon={NotebookPen}
          action={isPlayer && <Button onClick={() => setEditor({ open: true, session: null })}>Log your first session</Button>}>
          {isPlayer ? 'Log one after your next training. It takes a minute.' : 'The player has not logged a session yet.'}
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by focus">
            {[null, ...chips.map(([n]) => n)].map((name) => (
              <button key={name ?? 'all'} type="button" aria-pressed={filter === name}
                onClick={() => setFilter(name)}
                className={cn('rounded-full border px-3.5 py-2 text-sm md:px-3 md:py-1 transition-colors',
                  filter === name ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                {name ?? 'All'}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => {
                      const dir = h.column.getIsSorted()
                      return (
                        <TableHead key={h.id}
                          className={(h.column.columnDef.meta as { className?: string } | undefined)?.className}
                          aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}>
                          {h.column.getCanSort() ? (
                            <button type="button" className="inline-flex items-center gap-1"
                              onClick={h.column.getToggleSortingHandler()}>
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {dir === 'asc' ? <ArrowUp className="size-3.5" /> : dir === 'desc' ? <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5 opacity-40" />}
                            </button>
                          ) : flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((r) => (
                  <TableRow key={r.id}>
                    {r.getVisibleCells().map((c) => (
                      <TableCell key={c.id} className={(c.column.columnDef.meta as { className?: string } | undefined)?.className}>
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No sessions with that focus.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {isPlayer ? 'Tap a date to read the full entry or edit it.' : 'Tap a date to read the full entry and add a note.'}
          </p>
        </>
      )}
    </>
  )
}
