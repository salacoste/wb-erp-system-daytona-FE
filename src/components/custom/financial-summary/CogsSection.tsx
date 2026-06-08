/**
 * Story 25.2: COGS Section - Себестоимость
 * Shows cost of goods sold and coverage metrics
 */

import type { FinanceSummary } from '@/hooks/useDashboard'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, AlertTriangle } from 'lucide-react'
import { MetricRow } from './MetricRow'
import { CogsCoverageRow, CogsProductsRow } from './CogsSubRows'

interface CogsSectionProps {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}

export function CogsSection({ summary, comparisonSummary, isComparison }: CogsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-600" />
          Себестоимость (COGS)
        </CardTitle>
        <CardDescription>Себестоимость товаров и расчёт чистой прибыли</CardDescription>
      </CardHeader>
      <CardContent>
        {summary.cogs_total === null || summary.cogs_total === undefined ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Нет данных о себестоимости за этот период. Назначьте себестоимости товарам для расчёта
              маржи.
            </AlertDescription>
          </Alert>
        ) : (
          <>
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
                  label="Себестоимость (COGS)"
                  value={summary.cogs_total}
                  comparisonValue={comparisonSummary?.cogs_total}
                  isComparison={isComparison}
                />
                <CogsCoverageRow
                  summary={summary}
                  comparisonSummary={comparisonSummary}
                  isComparison={isComparison}
                />
                <CogsProductsRow
                  summary={summary}
                  comparisonSummary={comparisonSummary}
                  isComparison={isComparison}
                />
              </TableBody>
            </Table>

            {/* Warning when COGS coverage < 100% */}
            {summary.cogs_coverage_pct !== null &&
              summary.cogs_coverage_pct !== undefined &&
              summary.cogs_coverage_pct < 100 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Внесите себестоимости для{' '}
                    {(summary.products_total ?? 0) - (summary.products_with_cogs ?? 0)} товаров для
                    расчёта чистой прибыли.
                  </AlertDescription>
                </Alert>
              )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
