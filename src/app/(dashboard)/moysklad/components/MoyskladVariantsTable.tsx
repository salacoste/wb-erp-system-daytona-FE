'use client'

/**
 * МС live variants table (GET /v1/moysklad/variants) — M3 «МС модификации» tab.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Mirror of MoyskladProductsTable (M2), different fields. Key contract point:
 * variants LACK `article` — there is NO «Артикул» column here (unlike M2).
 *
 * LIVE read-through to МойСклад (v1-boundary #2) — the call may fail at runtime;
 * the hook surfaces the error inline (graceful banner, no crash).
 *
 * Pager: page size 20, limit/offset. «Показано N–M из total» + Назад/Вперёд.
 *
 * AP#8: code/updated/parentProductHref null → «—»; barcodesCount is a count (?? 0).
 */

import { useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useMoyskladVariants } from '@/hooks/useMoyskladQueries'
import { formatDate } from '@/lib/formatters'
import type { MoyskladVariant } from '@/types/moysklad'

const PAGE_SIZE = 20

export function MoyskladVariantsTable() {
  const [offset, setOffset] = useState(0)
  const variants = useMoyskladVariants({ limit: PAGE_SIZE, offset })

  const rows = variants.data?.rows ?? []
  const total = variants.data?.total ?? 0
  const hasPrevious = offset > 0
  const hasNext = offset + rows.length < total
  // 1-based range for the «Показано N–M из total» hint (only when rows exist).
  const shownFrom = rows.length > 0 ? offset + 1 : 0
  const shownTo = offset + rows.length

  return (
    <div className="space-y-4">
      {variants.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Не удалось загрузить модификации из МойСклад — проверьте подключение.</span>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Модификация</TableHead>
              <TableHead>Код</TableHead>
              <TableHead>Родит. товар</TableHead>
              <TableHead>Штрихкоды</TableHead>
              <TableHead>Обновлён</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!variants.isLoading && !variants.isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Нет модификаций в МойСклад
                </TableCell>
              </TableRow>
            )}
            {rows.map(v => (
              <VariantRow key={v.id} variant={v} />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {rows.length > 0 ? (
            <>
              Показано {shownFrom}–{shownTo} из {total}
            </>
          ) : (
            <>Показано 0 из {total}</>
          )}
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={!hasNext}
          >
            Вперёд
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface VariantRowProps {
  variant: MoyskladVariant
}

function VariantRow({ variant }: VariantRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium truncate max-w-[20rem]">{variant.name ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">{variant.code ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground truncate max-w-[16rem]">
        {variant.parentProductHref ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground">{variant.barcodesCount}</TableCell>
      <TableCell className="text-muted-foreground">
        {variant.updated ? formatDate(variant.updated) : '—'}
      </TableCell>
    </TableRow>
  )
}
