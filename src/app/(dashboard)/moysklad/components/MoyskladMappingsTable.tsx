'use client'

/**
 * МС mappings table with matched/pending filter toggle + link action.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Counts derive from the backend's filtered `.total` (3 lightweight `limit:1`
 * queries) — NOT row-filtering the sampled `all` view, which caps at 100 rows
 * while `total` can be 400+. Rows come from the active filter view.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMoyskladMappings } from '@/hooks/useMoyskladQueries'
import { cn } from '@/lib/utils'
import type { MoyskladProductMapping } from '@/types/moysklad'
import { MoyskladMappingRow } from './MoyskladMappingRow'
import { LinkMappingDialog } from './LinkMappingDialog'

type Filter = 'all' | 'matched' | 'pending'

const FILTER_TO_MATCHED: Record<Filter, boolean | undefined> = {
  all: undefined,
  matched: true,
  pending: false,
}

export function MoyskladMappingsTable() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [linkTarget, setLinkTarget] = useState<MoyskladProductMapping | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Counts: backend-filtered `.total` via lightweight `limit:1` queries.
  // Robust past the 100-row sample cap (total can be 400+).
  const matchedView = useMoyskladMappings({ matched: true, limit: 1 })
  const pendingView = useMoyskladMappings({ matched: false, limit: 1 })
  const allCountView = useMoyskladMappings({ limit: 1 })
  // Rows: the active filter view (full page of rows to display).
  const activeView = useMoyskladMappings({ matched: FILTER_TO_MATCHED[filter] })

  const matchedCount = matchedView.data?.total ?? 0
  const pendingCount = pendingView.data?.total ?? 0
  const total = allCountView.data?.total ?? 0
  const visibleRows = activeView.data?.rows ?? []

  const handleLink = (m: MoyskladProductMapping) => {
    setLinkTarget(m)
    setDialogOpen(true)
  }

  const filterBtn = (value: Filter, label: string, count: number) => (
    <Button
      key={value}
      type="button"
      variant={filter === value ? 'default' : 'outline'}
      size="sm"
      onClick={() => setFilter(value)}
      className={cn(filter === value && 'bg-primary/10')}
    >
      {label} ({count})
    </Button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filterBtn('pending', 'Не привязаны', pendingCount)}
        {filterBtn('matched', 'Привязаны', matchedCount)}
        {filterBtn('all', 'Все', total)}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>МС товар</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead>WB товар</TableHead>
              <TableHead>Способ</TableHead>
              <TableHead>Закуп. цена</TableHead>
              <TableHead>Синхр.</TableHead>
              <TableHead aria-label="Действия" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeView.isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!activeView.isLoading && visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
            {visibleRows.map(m => (
              <MoyskladMappingRow key={m.id} mapping={m} onLink={handleLink} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination hint — full pager is Phase 2. */}
      <p className="text-xs text-muted-foreground">
        Показано {visibleRows.length} из {activeView.data?.total ?? 0}
      </p>

      {/* key={linkTarget?.id} → remount per row so internal nmId state resets. */}
      <LinkMappingDialog
        key={linkTarget?.id}
        mapping={linkTarget}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
