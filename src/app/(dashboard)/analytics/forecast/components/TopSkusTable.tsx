'use client'

/**
 * TopSkusTable — displays top SKUs from /v1/ai/trends during 'collecting' state.
 * Reads useAiTrends internally. Exported as View + container for testability.
 *
 * Story 108.4-FE.
 */
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiTrends } from '@/hooks/useAiTrends'
import type { TopSkuEntry } from '@/types/ai/trends-sneak'

// ── Pure view — exported for direct unit testing ──────────────────────────────

interface TopSkusTableViewProps {
  data: TopSkuEntry[]
}

export function TopSkusTableView({ data }: TopSkusTableViewProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Пока нет данных по SKU</p>
  }

  // Note: backend guide wireframe (line 55-57) shows 3 columns; we add 4th
  // (Название/vendorCode) for UX — nmId alone is opaque to sellers who think
  // in product names. Same pattern in SneakPreviewSection. 2-pass review fix.
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-2 pr-4 font-medium">Артикул</th>
          <th className="py-2 pr-4 font-medium">Название</th>
          <th className="py-2 pr-4 font-medium text-right">Заказов/день</th>
          <th className="py-2 font-medium text-right">Объём за неделю</th>
        </tr>
      </thead>
      <tbody>
        {data.map(sku => (
          <tr key={sku.nmId} className="border-b last:border-0">
            <td className="py-2 pr-4 font-mono">{sku.nmId}</td>
            <td className="py-2 pr-4 text-muted-foreground">{sku.vendorCode ?? '—'}</td>
            <td className="py-2 pr-4 text-right font-mono">
              {sku.avgPerDay != null ? sku.avgPerDay.toFixed(1) : '—'}
            </td>
            <td className="py-2 text-right font-mono">
              {sku.weeklyVolume != null ? sku.weeklyVolume : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Container — fetches data ──────────────────────────────────────────────────

export function TopSkusTable() {
  const { data, isLoading, isError } = useAiTrends()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить топ SKU</AlertDescription>
      </Alert>
    )
  }

  return <TopSkusTableView data={data?.topSkus ?? []} />
}
