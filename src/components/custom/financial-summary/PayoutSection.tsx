/**
 * Payout Summary Section
 * Shows the total amount to be paid to the seller
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

interface PayoutSectionProps {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}

export function PayoutSection({ summary, comparisonSummary, isComparison }: PayoutSectionProps) {
  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-blue-900">Итого к оплате</CardTitle>
        <CardDescription className="text-blue-700">
          Общая сумма к перечислению продавцу за период
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableCaption className="sr-only">Итого к оплате</TableCaption>
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
            <MetricRow
              label="Итого к оплате"
              value={summary.payout_total}
              comparisonValue={comparisonSummary?.payout_total}
              highlight
              isComparison={isComparison}
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
