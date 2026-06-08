'use client'

/**
 * Price Elasticity Section — batch summary + per-SKU table
 * Integrated into Pricing page as an "Elasticity" card section.
 */

import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { usePriceElasticityBatch } from '@/hooks/usePriceElasticity'
import { formatDecimal, formatNumber } from '@/lib/utils'
import { ElasticityConfidence } from '@/types/price-elasticity'
import type { ElasticityConfidenceKey } from '@/types/price-elasticity'

/** Color map for confidence badges */
const CONFIDENCE_VARIANT: Record<ElasticityConfidenceKey, 'default' | 'secondary' | 'outline'> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
}

function ElasticityLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Эластичность цен
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-40" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ElasticitySection() {
  const { data, isLoading, isError } = usePriceElasticityBatch({ limit: 50 })

  if (isLoading) return <ElasticityLoadingSkeleton />

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Эластичность цен
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Не удалось загрузить данные по эластичности. Попробуйте позже.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { items, total, byConfidence } = data

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Эластичность цен
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Данные по эластичности пока недоступны. Необходимо больше истории продаж для расчёта.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Эластичность цен
          <span className="text-sm font-normal text-muted-foreground">({total} SKU)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence distribution */}
        <div className="grid gap-4 sm:grid-cols-3">
          {(['high', 'medium', 'low'] as const).map(level => (
            <div key={level} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground mb-1">
                {ElasticityConfidence[level]} точность
              </div>
              <div className="text-2xl font-bold">{formatNumber(byConfidence[level])}</div>
              <div className="text-xs text-muted-foreground">SKU</div>
            </div>
          ))}
        </div>

        {/* Per-SKU table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">nmId</TableHead>
                <TableHead className="text-right">Эластичность</TableHead>
                <TableHead className="text-right">R²</TableHead>
                <TableHead className="text-right">Точки</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead className="text-center">Точность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.nmId}>
                  <TableCell className="font-mono text-sm">{item.nmId}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatDecimal(item.elasticity, 3)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDecimal(item.rSquared, 3)}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
