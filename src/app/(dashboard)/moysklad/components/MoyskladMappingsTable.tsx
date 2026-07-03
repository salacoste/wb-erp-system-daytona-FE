'use client'

/**
 * МС mappings table with matched/pending filter toggle, link action, + pager (M4).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Counts derive from the backend's filtered `.total` (3 lightweight `limit:1`
 * queries) — NOT row-filtering the sampled `all` view, which caps at 100 rows
 * while `total` can be 400+. Rows come from the active filter view.
 *
 * Pager (M4): page size 20, limit/offset on the active view so all 400+ pending
 * are reachable (the backend default caps ~100). Page resets to 0 on filter
 * change so switching matched/pending never lands on an out-of-range page.
 */

import { useEffect, useState } from 'react'
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
import { MoyskladMappingsPager } from './MoyskladMappingsPager'

type Filter = 'all' | 'matched' | 'pending'

const FILTER_TO_MATCHED: Record<Filter, boolean | undefined> = {
  all: undefined,
  matched: true,
  pending: false,
}

const PAGE_SIZE = 20

export function MoyskladMappingsTable() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [page, setPage] = useState(0)
  const [linkTarget, setLinkTarget] = useState<MoyskladProductMapping | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Reset page when the filter changes (avoid out-of-range offset).
  useEffect(() => {
    setPage(0)
  }, [filter])

  // Counts: backend-filtered `.total` via lightweight `limit:1` queries.
  // Robust past the 100-row sample cap (total can be 400+).
  const matchedView = useMoyskladMappings({ matched: true, limit: 1 })
  const pendingView = useMoyskladMappings({ matched: false, limit: 1 })
  const allCountView = useMoyskladMappings({ limit: 1 })
  // Rows: the active filter view (paginated — full reach past the 100-row cap).
  const activeView = useMoyskladMappings({
    matched: FILTER_TO_MATCHED[filter],
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const matchedCount = matchedView.data?.total ?? 0
  const pendingCount = pendingView.data?.total ?? 0
  const total = allCountView.data?.total ?? 0
  const visibleRows = activeView.data?.rows ?? []
  const activeTotal = activeView.data?.total ?? 0

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

      <MoyskladMappingsPager
        page={page}
        pageSize={PAGE_SIZE}
        rowsCount={visibleRows.length}
        total={activeTotal}
        onPageChange={setPage}
      />

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
