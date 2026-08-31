/**
 * Compensations Section - only positive adjustments (income side)
 * Note: wb_commission_adj and other_adjustments_net moved to Expenses section
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

interface CompensationsSectionProps {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}

export function CompensationsSection({
  summary,
  comparisonSummary,
  isComparison,
}: CompensationsSectionProps) {
  if ((summary.loyalty_compensation_total ?? summary.loyalty_compensation ?? 0) <= 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Компенсации</CardTitle>
        <CardDescription>Компенсации от Wildberries (входят в доход)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">Компенсации</TableCaption>
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
              label="Компенсация лояльности"
              value={summary.loyalty_compensation_total ?? summary.loyalty_compensation}
              comparisonValue={
                comparisonSummary?.loyalty_compensation_total ??
                comparisonSummary?.loyalty_compensation
              }
              isComparison={isComparison}
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
