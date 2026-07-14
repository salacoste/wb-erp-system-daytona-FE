/**
 * FBO Aggregate Cards — summary metric cards for FBO orders.
 * Russian locale for all labels.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface FboAggregateCardsProps {
  count: number
  totalPrice: number
  totalFinishedPrice: number
  cancelledCount: number
  cancelRate: number | null
}

export function FboAggregateCards({
  count,
  totalPrice,
  totalFinishedPrice,
  cancelledCount,
  cancelRate,
}: FboAggregateCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Заказы</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{count.toLocaleString('ru-RU')}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Сумма заказов</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{formatCurrency(totalPrice)}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Итого со скидкой</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {formatCurrency(totalFinishedPrice)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Отмены</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {cancelledCount.toLocaleString('ru-RU')}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">% отмен</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {cancelRate != null ? formatPercentage(cancelRate, 1) : '—'}
        </CardContent>
      </Card>
    </div>
  )
}
