/**
 * Story 25.2: COGS Section - Себестоимость
 * Shows cost of goods sold and coverage metrics
 */

import type { FinanceSummary } from '@/hooks/useDashboard'
import { formatPercentage, formatPercentagePoints } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, AlertTriangle } from 'lucide-react'
import { MetricRow } from './MetricRow'

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

/* --- Sub-rows for COGS section --- */

function CogsCoverageRow({
  summary,
  comparisonSummary,
  isComparison,
}: {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">Покрытие COGS</TableCell>
      <TableCell className="text-right">
        {summary.cogs_coverage_pct !== null && summary.cogs_coverage_pct !== undefined
          ? formatPercentage(summary.cogs_coverage_pct, 1)
          : '\u2014'}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className="text-right">
            {comparisonSummary?.cogs_coverage_pct !== null &&
            comparisonSummary?.cogs_coverage_pct !== undefined
              ? formatPercentage(comparisonSummary.cogs_coverage_pct, 1)
              : '\u2014'}
          </TableCell>
          <TableCell className="text-right">
            {summary.cogs_coverage_pct !== null &&
            comparisonSummary?.cogs_coverage_pct !== null &&
            summary.cogs_coverage_pct !== undefined &&
            comparisonSummary?.cogs_coverage_pct !== undefined ? (
              <span
                className={
                  summary.cogs_coverage_pct > comparisonSummary.cogs_coverage_pct
                    ? 'text-green-600'
                    : summary.cogs_coverage_pct < comparisonSummary.cogs_coverage_pct
                      ? 'text-red-600'
                      : 'text-gray-500'
                }
              >
                {/* canonical pp-delta: comma + Russian "п.п." + built-in sign (was dot-locale
                    "+2.5pp"). formatPercentagePoints handles the sign; manual prefix removed. */}
                {formatPercentagePoints(
                  summary.cogs_coverage_pct - comparisonSummary.cogs_coverage_pct
                )}
              </span>
            ) : (
              <span className="text-gray-400">{'\u2014'}</span>
            )}
          </TableCell>
        </>
      )}
    </TableRow>
  )
}

function CogsProductsRow({
  summary,
  comparisonSummary,
  isComparison,
}: {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">Товаров с COGS</TableCell>
      <TableCell className="text-right">
        {summary.products_with_cogs !== null &&
        summary.products_with_cogs !== undefined &&
        summary.products_total !== null &&
        summary.products_total !== undefined
          ? `${summary.products_with_cogs} / ${summary.products_total}`
          : '\u2014'}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className="text-right">
            {comparisonSummary?.products_with_cogs !== null &&
            comparisonSummary?.products_with_cogs !== undefined &&
            comparisonSummary?.products_total !== null &&
            comparisonSummary?.products_total !== undefined
              ? `${comparisonSummary.products_with_cogs} / ${comparisonSummary.products_total}`
              : '\u2014'}
          </TableCell>
          <TableCell className="text-right">
            <span className="text-gray-400">{'\u2014'}</span>
          </TableCell>
        </>
      )}
    </TableRow>
  )
}
