'use client'

import { formatWeekDisplay } from '@/hooks/useFinancialSummary'
import { FinancialSummaryTable } from '@/components/custom/FinancialSummaryTable'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { FinanceSummary } from '@/hooks/useDashboard'

interface AnalyticsSummaryContentProps {
  viewMode: string
  selectedWeek: string
  isLoading: boolean
  isError: boolean
  error: unknown
  primarySummary: FinanceSummary | null | undefined
  secondarySummary: FinanceSummary | null | undefined
  onRetry: () => void
}

/** Loading, error, empty, and content states for the analytics financial summary */
export function AnalyticsSummaryContent({
  viewMode,
  selectedWeek,
  isLoading,
  isError,
  error,
  primarySummary,
  secondarySummary,
  onRetry,
}: AnalyticsSummaryContentProps) {
  const hasPrimarySummary = Boolean(primarySummary)

  // Error State
  if (isError && !hasPrimarySummary) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {error instanceof Error
              ? error.message
              : 'Не удалось загрузить финансовые данные. Пожалуйста, попробуйте еще раз.'}
          </span>
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Loading State
  if (isLoading && !hasPrimarySummary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[600px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Content
  if (primarySummary) {
    return (
      <>
        {isError && (
          <Alert className="border-status-warning/30 bg-status-warning/15">
            <AlertCircle className="h-4 w-4 text-status-warning" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>Не удалось обновить сводку. Показаны ранее загруженные данные.</span>
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {isLoading && (
          <p role="status" className="text-sm text-muted-foreground">
            Обновляем финансовую сводку…
          </p>
        )}
        <FinancialSummaryTable
          summary={primarySummary!}
          comparisonSummary={secondarySummary ?? undefined}
        />

        {viewMode === 'single' && (
          <Card>
            <CardHeader>
              <CardTitle>Разбивка расходов</CardTitle>
              <CardDescription>
                Визуализация структуры расходов за {formatWeekDisplay(selectedWeek)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseChart weekOverride={selectedWeek} />
            </CardContent>
          </Card>
        )}
      </>
    )
  }

  // Empty State
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Нет данных для отображения. Пожалуйста, загрузите финансовые отчеты или выберите другой
        период.
      </AlertDescription>
    </Alert>
  )
}
