'use client'

/**
 * Main client component for Financial Gaps page
 * Date range picker + summary cards + gaps table + analysis dialog
 */

import { toast } from 'sonner'
import { useRef } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/product'
import { GapsSummaryCards } from './GapsSummaryCards'
import { GapsTable } from './GapsTable'
import { GapAnalysisDialog } from './GapAnalysisDialog'
import { useGapsPageState } from './useGapsPageState'

export function GapsPageContent() {
  const {
    dateFrom,
    dateTo,
    gaps,
    analyze,
    remediate,
    analysisResult,
    analysisDialogOpen,
    setAnalysisDialogOpen,
    handleAnalyze,
    handleRemediate,
    updateDateRange,
  } = useGapsPageState()

  const hasGapsData = gaps.data !== undefined
  const dateRangeIncomplete = !dateFrom || !dateTo
  const terminalQueryError = !dateRangeIncomplete && gaps.isError && !hasGapsData
  const initialQueryPaused = !dateRangeIncomplete && !hasGapsData && gaps.isPending && gaps.isPaused
  const backgroundRefreshing = hasGapsData && gaps.isFetching && !gaps.isError
  const dialogReturnFocusRef = useRef<HTMLElement | null>(null)
  const dialogFallbackFocusRef = useRef<HTMLInputElement>(null)

  const onAnalyze = async (missingDate: string, trigger: HTMLButtonElement) => {
    dialogReturnFocusRef.current = trigger

    try {
      await handleAnalyze(missingDate)
    } catch {
      toast.error('Ошибка при анализе пропуска')
    }
  }

  const onRemediate = async (missingDate: string, rootCause?: string) => {
    try {
      await handleRemediate(missingDate, rootCause)
      toast.success('Исправление запущено')
    } catch {
      toast.error('Ошибка при запуске исправления')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header — PageHeader has no icon slot; the decorative CalendarSearch icon was dropped */}
      <PageHeader
        title="Пропуски в данных"
        description="Анализ и исправление пропущенных дней в финансовых данных"
      />

      {/* Date range */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
        <div>
          <label htmlFor="gaps-date-from" className="mb-1 block text-sm text-muted-foreground">
            С
          </label>
          <Input
            ref={dialogFallbackFocusRef}
            id="gaps-date-from"
            type="date"
            value={dateFrom}
            onChange={e => updateDateRange(e.target.value, dateTo)}
            className="min-h-11 w-full sm:w-44"
          />
        </div>
        <div>
          <label htmlFor="gaps-date-to" className="mb-1 block text-sm text-muted-foreground">
            По
          </label>
          <Input
            id="gaps-date-to"
            type="date"
            value={dateTo}
            onChange={e => updateDateRange(dateFrom, e.target.value)}
            className="min-h-11 w-full sm:w-44"
          />
        </div>
      </div>

      {dateRangeIncomplete && (
        <Alert role="status">
          <AlertDescription>Укажите обе даты, чтобы выполнить анализ пропусков</AlertDescription>
        </Alert>
      )}

      {initialQueryPaused && (
        <Alert role="status" aria-live="polite">
          <AlertDescription>
            Загрузка данных приостановлена. Проверьте подключение к сети
          </AlertDescription>
        </Alert>
      )}

      {backgroundRefreshing && (
        <Alert role="status" aria-live="polite" aria-busy="true">
          <AlertDescription>Обновляем данные о пропусках</AlertDescription>
        </Alert>
      )}

      {!dateRangeIncomplete && gaps.isError && (
        <Alert
          variant={terminalQueryError ? 'destructive' : 'warning'}
          role={terminalQueryError ? 'alert' : 'status'}
          aria-live={terminalQueryError ? 'assertive' : 'polite'}
          aria-busy={gaps.isFetching}
        >
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {terminalQueryError
                ? 'Не удалось загрузить данные о пропусках'
                : 'Показаны ранее загруженные данные; обновление завершилось ошибкой'}
            </span>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0"
              disabled={gaps.isFetching}
              onClick={() => void gaps.refetch()}
            >
              {gaps.isFetching ? 'Повторная загрузка…' : 'Повторить загрузку'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!dateRangeIncomplete && !terminalQueryError && !initialQueryPaused && (
        <>
          {/* Summary cards */}
          <GapsSummaryCards data={gaps.data} isLoading={gaps.isLoading} />

          {/* Gaps table */}
          <GapsTable
            missingDates={gaps.data?.missing_dates}
            isLoading={gaps.isLoading}
            analyzingDate={analyze.isPending ? (analyze.variables ?? null) : null}
            onAnalyze={onAnalyze}
          />
        </>
      )}

      {/* Analysis dialog */}
      <GapAnalysisDialog
        isOpen={analysisDialogOpen}
        onOpenChange={setAnalysisDialogOpen}
        analysis={analysisResult}
        isRemediating={remediate.isPending}
        onRemediate={onRemediate}
        returnFocusRef={dialogReturnFocusRef}
        fallbackFocusRef={dialogFallbackFocusRef}
      />
    </div>
  )
}
