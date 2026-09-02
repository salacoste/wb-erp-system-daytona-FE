/**
 * Story 25.2: Profit Section - only when COGS coverage = 100%
 * Shows net profit after COGS deduction
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes — see debt-p2-boundary-wave1 artifact. text-status-success
// on success/10 measures 4.49:1 (light) — sub-AA — so this tinted header band
// keeps foreground text (14.1:1 light) with the success identity carried by the
// tint, border, and Gem icon (4.49:1 ≥ 3:1 graphic contrast).

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
    <Card className="border-2 border-status-success/20">
      <CardHeader className="bg-status-success/10">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Gem className="h-5 w-5 text-status-success" />
          Чистая прибыль
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Прибыль после вычета себестоимости товаров
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableCaption className="sr-only">Чистая прибыль</TableCaption>
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
