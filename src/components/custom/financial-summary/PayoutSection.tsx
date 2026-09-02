/**
 * Payout Summary Section
 * Shows the total amount to be paid to the seller
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes over the card surface — see debt-p2-boundary-wave1
// artifact. Information trio (bg-status-information/10 + text-status-information):
// 4.98:1 light / 7.32:1 dark.

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
    <Card className="border-2 border-status-information/20">
      <CardHeader className="bg-status-information/10">
        <CardTitle className="text-status-information">Итого к оплате</CardTitle>
        <CardDescription className="text-muted-foreground">
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
