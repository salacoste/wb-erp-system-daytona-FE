'use client'

/**
 * FBO Sales Aggregate Cards
 * Extracted from FboOrdersPageContent for max-lines compliance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FboSalesAggregateCardsProps {
  data: {
    count: number
    totalForPay: number
    returnRate: number | null
    returnsCount: number
  }
}

/** Sales aggregate stat cards: count, payout, returns, return rate */
export function FboSalesAggregateCards({ data }: FboSalesAggregateCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Продажи</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{data.count}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">К выплате</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {data.totalForPay.toLocaleString('ru-RU')} ₽
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Возвраты</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{data.returnsCount}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">% возвратов</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {data.returnRate != null ? `${data.returnRate} %` : '—'}
        </CardContent>
      </Card>
    </div>
  )
}
