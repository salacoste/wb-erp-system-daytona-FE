'use client'

/**
 * МС stock table (GET /v1/moysklad/stock-db) — M1 Сток tab.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Date selector defaults to the latest snapshot (no `date` param). Invalid date →
 * 400 surfaced inline (hook `retry:0`). Best-effort МС name from cached mappings
 * keyed by moyskladAssortmentId; falls back to the assortment-id short form.
 *
 * AP#8: stockFree/reserve null → «—»; nmId null → «не привязан».
 */

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMoyskladMappings, useMoyskladStockDb } from '@/hooks/useMoyskladQueries'
import { formatDate, formatDateTime, formatNumber } from '@/lib/formatters'
import type { MoyskladStockSnapshot } from '@/types/moysklad'

/** Last 8 chars of the assortment id — a short, copy-safe label (AP#10: opaque ids). */
function assortmentShort(id: string): string {
  return id.length > 8 ? id.slice(-8) : id
}

export function MoyskladStockTable() {
  // Empty string = latest snapshot (no `date` param sent). Typed as a controlled date input.
  const [date, setDate] = useState('')
  const stock = useMoyskladStockDb(date ? { date } : {})
  // Best-effort МС name lookup: a single `all` mappings page (cached 60s).
  const mappings = useMoyskladMappings()

  const nameById = new Map<string, string | null>()
  for (const m of mappings.data?.rows ?? []) {
    nameById.set(m.moyskladAssortmentId, m.moyskladName)
  }

  const rows = stock.data?.rows ?? []
  const total = stock.data?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="moysklad-stock-date" className="text-sm text-muted-foreground">
          Дата стока
        </label>
        <Input
          id="moysklad-stock-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-auto"
        />
        {stock.data?.date && (
          <span className="text-xs text-muted-foreground">
            Снапшот: {formatDate(stock.data.date)}
          </span>
        )}
      </div>

      {stock.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Не удалось загрузить сток за эту дату. Проверьте дату и повторите попытку.</span>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>МС товар</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>WB товар</TableHead>
              <TableHead>Свободный остаток</TableHead>
              <TableHead>Резерв</TableHead>
              <TableHead>Синхр.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!stock.isLoading && !stock.isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Нет данных о стоке за эту дату
                </TableCell>
              </TableRow>
            )}
            {rows.map(s => (
              <StockRow key={s.id} snapshot={s} nameById={nameById} />
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Показано {rows.length} из {total}
      </p>
    </div>
  )
}

interface StockRowProps {
  snapshot: MoyskladStockSnapshot
  nameById: Map<string, string | null>
}

function StockRow({ snapshot, nameById }: StockRowProps) {
  const name = nameById.get(snapshot.moyskladAssortmentId)
  const label = name ?? assortmentShort(snapshot.moyskladAssortmentId)
  return (
    <TableRow>
      <TableCell className="font-medium truncate max-w-[20rem]">{label}</TableCell>
      <TableCell className="text-muted-foreground">
        {snapshot.date ? formatDate(snapshot.date) : '—'}
      </TableCell>
      <TableCell>
        {snapshot.nmId == null ? (
          <span className="text-muted-foreground">не привязан</span>
        ) : (
          <span>{snapshot.nmId}</span>
        )}
      </TableCell>
      <TableCell>{snapshot.stockFree == null ? '—' : formatNumber(snapshot.stockFree)}</TableCell>
      <TableCell>{snapshot.reserve == null ? '—' : formatNumber(snapshot.reserve)}</TableCell>
      <TableCell className="text-muted-foreground">
        {snapshot.syncedAt ? formatDateTime(snapshot.syncedAt) : '—'}
      </TableCell>
    </TableRow>
  )
}
