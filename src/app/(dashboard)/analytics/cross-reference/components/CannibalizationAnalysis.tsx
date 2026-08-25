'use client'

/**
 * Advertising Cannibalization Analysis — Feature 3.6
 * Table classifying products by cannibalization risk:
 * high (organic >70% + top spend), medium (organic >40% + above-median), low (rest).
 */

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CrossReferenceItem } from '../utils/cross-reference-utils'
import { fmtCurrency } from '../utils/cross-reference-utils'
import { classifyCannibalization } from '../utils/ad-search-correlation-utils'
import type { CannibalizationRisk, CannibalizationItem } from '../utils/ad-search-correlation-utils'
import { formatPercentage } from '@/lib/utils'

interface CannibalizationAnalysisProps {
  items: CrossReferenceItem[]
}

// Story 170.6-FE: risk chips → status /15+/30 triplets; emoji risk icons replaced
// with lucide icons (text labels unchanged).
const RISK_STYLES: Record<
  CannibalizationRisk,
  { label: string; className: string; icon: LucideIcon }
> = {
  high: {
    label: 'Высокий',
    className: 'bg-status-error/15 text-status-error border-status-error/30',
    icon: AlertTriangle,
  },
  medium: {
    label: 'Средний',
    className: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    icon: AlertCircle,
  },
  low: {
    label: 'Низкий',
    className: 'bg-status-success/15 text-status-success border-status-success/30',
    icon: CheckCircle,
  },
}

export function CannibalizationAnalysis({ items }: CannibalizationAnalysisProps) {
  const classified = useMemo(() => classifyCannibalization(items), [items])

  const highRiskCount = classified.filter(c => c.risk === 'high').length
  const mediumRiskCount = classified.filter(c => c.risk === 'medium').length

  if (classified.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-5 w-5 text-status-warning" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Анализ каннибализации</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Товары, где рекламные расходы могут замещать органические продажи
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <RiskSummaryCard
          label="Высокий риск"
          count={highRiskCount}
          className="border-status-error/30 bg-status-error/15"
        />
        <RiskSummaryCard
          label="Средний риск"
          count={mediumRiskCount}
          className="border-status-warning/30 bg-status-warning/15"
        />
      </div>

      <div className="rounded-md border overflow-auto">
        <Table aria-label="Анализ каннибализации рекламы">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Артикул</TableHead>
              <TableHead className="text-right">Вклад органики</TableHead>
              <TableHead className="text-right">Расход ₽</TableHead>
              <TableHead className="text-right">Заказы</TableHead>
              <TableHead className="w-[100px]">Риск</TableHead>
              <TableHead>Комментарий</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classified.map(item => (
              <CannibalizationRow key={item.nmId} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RiskSummaryCard({
  label,
  count,
  className,
}: {
  label: string
  count: number
  className: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <p className="text-2xl font-bold">{count}</p>
      </CardContent>
    </Card>
  )
}

function CannibalizationRow({ item }: { item: CannibalizationItem }) {
  const style = RISK_STYLES[item.risk]
  const RiskIcon = style.icon
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{item.vendorCode || item.nmId}</TableCell>
      <TableCell className="text-right">
        {item.organicContribution !== null ? formatPercentage(item.organicContribution) : '—'}
      </TableCell>
      <TableCell className="text-right">{fmtCurrency(item.adSpend)}</TableCell>
      <TableCell className="text-right">{item.totalOrders}</TableCell>
      <TableCell>
        <Badge variant="outline" className={`gap-1 ${style.className}`}>
          <RiskIcon className="h-3 w-3" aria-hidden="true" />
          {style.label}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-[300px]">{item.reason}</TableCell>
    </TableRow>
  )
}
