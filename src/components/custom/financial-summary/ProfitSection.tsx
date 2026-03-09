/**
 * Story 25.2: Profit Section - only when COGS coverage = 100%
 * Shows net profit after COGS deduction
 */

import type { FinanceSummary } from '@/hooks/useDashboard'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gem } from 'lucide-react'
import { MetricRow } from './MetricRow'

interface ProfitSectionProps {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}

export function ProfitSection({ summary, comparisonSummary, isComparison }: ProfitSectionProps) {
  if (summary.cogs_coverage_pct !== 100 || summary.gross_profit === null) {
    return null
  }

  return (
    <Card className="border-2 border-emerald-500">
      <CardHeader className="bg-emerald-50">
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <Gem className="h-5 w-5" />
          Чистая прибыль
        </CardTitle>
        <CardDescription className="text-emerald-700">
          Прибыль после вычета себестоимости товаров
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
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
              label="Чистая прибыль"
              value={summary.gross_profit}
              comparisonValue={comparisonSummary?.gross_profit}
              highlight
              isComparison={isComparison}
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
