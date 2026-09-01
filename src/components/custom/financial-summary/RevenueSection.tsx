/**
 * Revenue Section of Financial Summary Table
 * Displays sales, returns, and payout data
 */

import type { FinanceSummary } from '@/hooks/useDashboard'
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricRow } from './MetricRow'

interface RevenueSectionProps {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}

export function RevenueSection({ summary, comparisonSummary, isComparison }: RevenueSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Доходы</CardTitle>
        <CardDescription>Выручка и начисления от Wildberries</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">Доходы</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Показатель</TableHead>
              <TableHead className="text-right">Значение</TableHead>
              {isComparison && (
                <>
                  <TableHead className="text-right">Сравнение</TableHead>
                  <TableHead className="text-right">Изменение</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Request #41: Separate sales and returns tracking */}
            <MetricRow
              label="Продажи (gross)"
              value={summary.sales_gross_total ?? summary.sales_gross}
              comparisonValue={
                comparisonSummary?.sales_gross_total ?? comparisonSummary?.sales_gross
              }
              isComparison={isComparison}
            />
            <MetricRow
              label="Возвраты (gross)"
              value={summary.returns_gross_total ?? summary.returns_gross}
              comparisonValue={
                comparisonSummary?.returns_gross_total ?? comparisonSummary?.returns_gross
              }
              isNegative
              isComparison={isComparison}
            />
            <MetricRow
              label="Продажи (розница)"
              value={summary.sale_gross_total ?? summary.sale_gross}
              comparisonValue={comparisonSummary?.sale_gross_total ?? comparisonSummary?.sale_gross}
              highlight
              isComparison={isComparison}
            />
            <MetricRow
              label="К перечислению за товар"
              value={summary.to_pay_goods_total ?? summary.to_pay_goods}
              comparisonValue={
                comparisonSummary?.to_pay_goods_total ?? comparisonSummary?.to_pay_goods
              }
              highlight
              isComparison={isComparison}
            />
            <MetricRow
              label="Выручка доставки продавца (DBS)"
              value={summary.seller_delivery_revenue_total ?? summary.seller_delivery_revenue}
              comparisonValue={
                comparisonSummary?.seller_delivery_revenue_total ??
                comparisonSummary?.seller_delivery_revenue
              }
              isComparison={isComparison}
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
