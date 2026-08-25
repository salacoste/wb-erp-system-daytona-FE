'use client'

/**
 * Cannibalization Analysis Section — Story 121.3-FE
 * Identifies products where organic sales are strong but ad spend remains high.
 * Uses advertising analytics data (organicContribution + spend per nmId).
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingDown } from 'lucide-react'
import type { AdvertisingItem } from '@/types/advertising-analytics'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CannibalizationSectionProps {
  items: AdvertisingItem[]
  isLoading: boolean
}

interface CannibalizedProduct {
  nmId: string
  spend: number
  organicContribution: number
  organicSales: number
  revenue: number | null
  risk: 'high' | 'medium'
}

// Story 170.1: risk colors → status tokens (was red-600/yellow-600 palette)
const RISK_CONFIG = {
  high: { label: 'Высокий', variant: 'destructive' as const, color: 'text-status-error' },
  medium: { label: 'Средний', variant: 'secondary' as const, color: 'text-status-warning' },
}

function parseNmId(key: string): string {
  const match = key.match(/^sku:(\d+)$/)
  return match ? match[1] : key
}

function computeCannibalizedProducts(items: AdvertisingItem[]): CannibalizedProduct[] {
  return items
    .filter(
      item => item.spend > 0 && item.organic_contribution != null && item.organic_contribution > 40
    )
    .map(item => ({
      nmId: parseNmId(item.key),
      spend: item.spend,
      organicContribution: item.organic_contribution,
      organicSales: item.organic_sales,
      revenue: item.revenue,
      risk: (item.organic_contribution > 70 ? 'high' : 'medium') as CannibalizedProduct['risk'],
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 20)
}

export function CannibalizationSection({ items, isLoading }: CannibalizationSectionProps) {
  const cannibalized = useMemo(() => computeCannibalizedProducts(items), [items])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            Каннибализация рекламы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  if (cannibalized.length === 0) return null

  const highRiskCount = cannibalized.filter(p => p.risk === 'high').length
  const totalWastedSpend = cannibalized
    .filter(p => p.risk === 'high')
    .reduce((sum, p) => sum + p.spend, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-warning" />
          Каннибализация рекламы
          <Badge variant="secondary" className="ml-auto">
            {cannibalized.length} товар(ов)
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Товары с высоким organic contribution (&gt;40 %) и активными расходами на рекламу
        </p>
      </CardHeader>
      <CardContent>
        {highRiskCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-status-error/15 p-3 text-sm text-status-error">
            <TrendingDown className="h-4 w-4 shrink-0" />
            <span>
              <strong>{highRiskCount}</strong> товаров с высоким риском каннибализации.
              Потенциальный перерасход: <strong>{formatCurrency(totalWastedSpend)}</strong>
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Таблица риска каннибализации">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Артикул</th>
                <th className="pb-2 pr-4 font-medium text-right">Расход</th>
                <th className="pb-2 pr-4 font-medium text-right">Органика %</th>
                <th className="pb-2 pr-4 font-medium text-right">Орг. продажи</th>
                <th className="pb-2 font-medium">Риск</th>
              </tr>
            </thead>
            <tbody>
              {cannibalized.map(product => {
                const cfg = RISK_CONFIG[product.risk]
                return (
                  <tr key={product.nmId} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{product.nmId}</td>
                    <td className="py-2 pr-4 text-right">{formatCurrency(product.spend)}</td>
                    <td className="py-2 pr-4 text-right">
                      {formatPercentage(product.organicContribution)}
                    </td>
                    <td className="py-2 pr-4 text-right">{formatCurrency(product.organicSales)}</td>
                    <td className="py-2">
                      <Badge variant={cfg.variant} className="text-xs">
                        {cfg.label}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
