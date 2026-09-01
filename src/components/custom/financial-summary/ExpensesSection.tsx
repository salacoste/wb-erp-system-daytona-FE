/**
 * Expenses Section - Redesigned per Request #02 / WB Financial Structure
 * Reference: docs/request-product-manager/02-financial-data-presentation-concept.md
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
import { extractExpenseData } from './expenses-data'
import { ExpenseTableRows } from './ExpenseTableRows'

interface ExpensesSectionProps {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}

export function ExpensesSection({
  summary,
  comparisonSummary,
  isComparison,
}: ExpensesSectionProps) {
  const d = extractExpenseData(summary, comparisonSummary)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{'💸 Расходы WB'}</CardTitle>
        <CardDescription>
          Все удержания Wildberries (комиссии + операционные расходы)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table scrollContainerTabIndex={0} scrollContainerAriaLabel="Расходы Wildberries">
          <TableCaption className="sr-only">Расходы Wildberries</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Статья расходов</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="text-right">% оборота</TableHead>
              {isComparison && (
                <>
                  <TableHead className="text-right">Сравнение</TableHead>
                  <TableHead className="text-right">% оборота</TableHead>
                  <TableHead className="text-right">Изменение</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            <ExpenseTableRows d={d} isComparison={isComparison} />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
