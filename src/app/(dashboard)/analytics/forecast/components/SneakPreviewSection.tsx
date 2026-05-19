'use client'

/**
 * SneakPreviewSection — full sneak-preview state UI with disclaimer,
 * low-confidence SKU forecasts, trend icons, and 7-day range.
 *
 * Story 108.5-FE (expanded from 108.3 placeholder).
 */
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useAiSneakPreview } from '@/hooks/useAiSneakPreview'
import type { AiStatusResponse } from '@/types/ai/status'
import { pluralize, WEEK_FORMS } from '@/lib/russian-plural'
import type { SneakPreviewSkuForecast, TrendDirection } from '@/types/ai/trends-sneak'

interface Props {
  status: AiStatusResponse
}

// ── Trend indicator (icon + Russian label) ───────────────────────────────────
// Fix from 2-pass review (HIGH): per epic spec line 134 + WCAG 2.1 AA, trends
// must have visible Russian text label AND aria-label. Icon-only fails both.

const TREND_LABELS: Record<TrendDirection, string> = {
  up: 'Растёт',
  stable: 'Стабильно',
  down: 'Снижается',
}

function TrendIndicator({ trend }: { trend: TrendDirection }) {
  const label = TREND_LABELS[trend]
  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />}
      {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />}
      {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      <span className="text-xs">{label}</span>
    </span>
  )
}

// ── Pure view — exported for direct unit testing ──────────────────────────────

interface SneakPreviewTableViewProps {
  skuForecasts: SneakPreviewSkuForecast[]
}

export function SneakPreviewTableView({ skuForecasts }: SneakPreviewTableViewProps) {
  if (skuForecasts.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-2 pr-4 font-medium">Артикул</th>
          <th className="py-2 pr-4 font-medium">Название</th>
          <th className="py-2 pr-4 font-medium text-right">Среднее/день</th>
          <th className="py-2 pr-4 font-medium text-center">Тренд</th>
          <th className="py-2 font-medium text-right">Диапазон 7 дней</th>
        </tr>
      </thead>
      <tbody>
        {skuForecasts.map(sku => (
          <tr key={sku.nmId} className="border-b last:border-0">
            <td className="py-2 pr-4 font-mono">{sku.nmId}</td>
            <td className="py-2 pr-4 text-muted-foreground">{sku.vendorCode ?? '—'}</td>
            <td className="py-2 pr-4 text-right font-mono">
              {sku.avgPerDay != null ? sku.avgPerDay.toFixed(1) : '—'}
            </td>
            <td className="py-2 pr-4 flex justify-center">
              <TrendIndicator trend={sku.trend} />
            </td>
            <td className="py-2 text-right font-mono">
              {sku.estimatedRange.low != null && sku.estimatedRange.high != null
                ? `${sku.estimatedRange.low.toFixed(0)} – ${sku.estimatedRange.high.toFixed(0)}`
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Container ─────────────────────────────────────────────────────────────────

export function SneakPreviewSection({ status }: Props) {
  const { weeksCollected, weeksRequired } = status
  const { data, isLoading, isError } = useAiSneakPreview()

  const disclaimer = data?.disclaimer || 'Низкая уверенность — сбор данных продолжается'

  return (
    <div className="space-y-4">
      {/* Disclaimer — always visible */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold">AI: предварительный прогноз — низкая уверенность</p>
          <p className="text-xs mt-1">{disclaimer}</p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Status block */}
          <p className="text-sm text-muted-foreground">
            Собрано {weeksCollected} {pluralize(WEEK_FORMS, weeksCollected)}.
            {weeksRequired != null && weeksRequired > 0
              ? ` Полная AI активируется при достижении ${weeksRequired} ${pluralize(WEEK_FORMS, weeksRequired)}.`
              : ' Полная AI активируется при сборе достаточного количества данных.'}
          </p>

          {/* Forecast table */}
          <h3 className="text-base font-semibold">Предварительный прогноз — топ SKU</h3>

          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {isError && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Не удалось загрузить прогнозы</AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && (
            <SneakPreviewTableView skuForecasts={data?.skuForecasts ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
