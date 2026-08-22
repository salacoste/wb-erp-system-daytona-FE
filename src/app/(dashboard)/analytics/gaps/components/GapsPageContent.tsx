'use client'

/**
 * Main client component for Financial Gaps page
 * Date range picker + summary cards + gaps table + analysis dialog
 */

import { toast } from 'sonner'
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

  const onAnalyze = async (missingDate: string) => {
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
      <div className="flex items-end gap-3">
        <div>
          <label htmlFor="gaps-date-from" className="mb-1 block text-sm text-muted-foreground">
            С
          </label>
          <Input
            id="gaps-date-from"
            type="date"
            value={dateFrom}
            onChange={e => updateDateRange(e.target.value, dateTo)}
            className="w-44 min-h-11"
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
            className="w-44 min-h-11"
          />
        </div>
      </div>

      {/* Summary cards */}
      <GapsSummaryCards data={gaps.data} isLoading={gaps.isLoading} />

      {/* Gaps table */}
      <GapsTable
        missingDates={gaps.data?.missing_dates}
        isLoading={gaps.isLoading}
        analyzingDate={analyze.isPending ? (analyze.variables ?? null) : null}
        onAnalyze={onAnalyze}
      />

      {/* Analysis dialog */}
      <GapAnalysisDialog
        isOpen={analysisDialogOpen}
        onOpenChange={setAnalysisDialogOpen}
        analysis={analysisResult}
        isRemediating={remediate.isPending}
        onRemediate={onRemediate}
      />
    </div>
  )
}
