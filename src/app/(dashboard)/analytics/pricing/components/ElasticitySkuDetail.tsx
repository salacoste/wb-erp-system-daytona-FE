'use client'

/**
 * ElasticitySkuDetail — expandable detail panel for a single SKU's price elasticity.
 * Renders a theoretical demand curve, current price indicator, and optimal price.
 * Uses the CompletenessRow expandable pattern (ChevronDown + extra TableRow).
 */

import { ChevronDown } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { usePriceElasticitySku } from '@/hooks/usePriceElasticity'
import { ElasticitySkuChart } from './ElasticitySkuChart'
import { formatCurrency, formatDecimal, formatNumber } from '@/lib/utils'
import { ElasticityConfidence } from '@/types/price-elasticity'
import type { PriceElasticityItem, ElasticityConfidenceKey } from '@/types/price-elasticity'

const CONFIDENCE_VARIANT: Record<ElasticityConfidenceKey, 'default' | 'secondary' | 'outline'> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
}

interface ElasticitySkuDetailProps {
  item: PriceElasticityItem
  isExpanded: boolean
  onToggle: () => void
}

export function ElasticitySkuDetail({ item, isExpanded, onToggle }: ElasticitySkuDetailProps) {
  const { data, isLoading } = usePriceElasticitySku(isExpanded ? item.nmId : null)

  return (
    <>
      {/* Main summary row */}
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <TableCell className="w-8 px-2">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </TableCell>
        <TableCell className="font-mono text-sm">{item.nmId}</TableCell>
        <TableCell className="text-right font-medium">
          {/* AP#8: null elasticity renders '—', never a fabricated 0,000 */}
          {item.elasticity == null ? '—' : formatDecimal(item.elasticity, 3)}
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {item.rSquared == null ? '—' : formatDecimal(item.rSquared, 3)}
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {formatNumber(item.dataPoints)}
        </TableCell>
        <TableCell className="text-muted-foreground">{item.source}</TableCell>
        <TableCell className="text-center">
          <Badge variant={CONFIDENCE_VARIANT[item.confidence]}>
            {ElasticityConfidence[item.confidence]}
          </Badge>
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={7} className="px-6 py-4">
            {isLoading ? (
              <DetailSkeleton />
            ) : data ? (
              <DetailContent data={data} />
            ) : (
              <p className="text-sm text-muted-foreground">Нет детальных данных по эластичности</p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function DetailContent({
  data,
}: {
  // AP#8: elasticity & rSquared (statistical ratios) are number|null — null renders '—'.
  data: {
    elasticity: number | null
    rSquared: number | null
    dataPoints: number
    profitMaxPrice: number | null
  }
}) {
  return (
    <div className="space-y-4">
      {/* Metrics row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard
          label="Коэффициент"
          value={data.elasticity == null ? '—' : formatDecimal(data.elasticity, 3)}
        />
        <MetricCard
          label="R² (качество)"
          value={data.rSquared == null ? '—' : formatDecimal(data.rSquared, 3)}
        />
        <MetricCard label="Точек данных" value={formatNumber(data.dataPoints)} />
        <MetricCard
          label="Оптимальная цена"
          value={data.profitMaxPrice !== null ? formatCurrency(data.profitMaxPrice) : '—'}
        />
      </div>

      {/* Elasticity curve chart — omitted when the coefficient is unknown (no fabricated curve) */}
      {data.elasticity == null ? (
        <p className="text-sm text-muted-foreground">Недостаточно данных для построения кривой.</p>
      ) : (
        <ElasticitySkuChart elasticity={data.elasticity} profitMaxPrice={data.profitMaxPrice} />
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}
