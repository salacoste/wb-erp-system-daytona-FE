/**
 * Export Dialog Component
 * Story 6.5-FE: Export Analytics UI
 *
 * Dialog for configuring and initiating analytics exports:
 * - Select export type (by-sku, by-brand, by-category, cabinet-summary)
 * - Select date range using DateRangePicker (from Story 6.1-FE)
 * - Select format (CSV or Excel)
 * - Toggle COGS inclusion
 * - Shows ExportStatusDisplay during export
 *
 * Reference: frontend/docs/stories/epic-6/story-6.5-fe-export-analytics.md
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/custom/DateRangePicker'
import { ExportStatusDisplay } from '@/components/custom/ExportStatusDisplay'
import { useExportAnalytics } from '@/hooks/useExportAnalytics'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { FileSpreadsheet, FileText, Download } from 'lucide-react'
import type { ExportType, ExportFormat } from '@/types/analytics'

/**
 * Props for ExportDialog component
 */
export interface ExportDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Default export type */
  defaultType?: ExportType
  /** Default week start (from page context) */
  defaultWeekStart?: string
  /** Default week end (from page context) */
  defaultWeekEnd?: string
}

/**
 * Export type labels in Russian
 */
const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  'by-sku': 'По товарам (SKU)',
  'by-brand': 'По брендам',
  'by-category': 'По категориям',
  'cabinet-summary': 'Сводка по кабинету',
}

/**
 * ExportDialog component
 *
 * Provides a full export configuration interface with date range selection,
 * format selection, and real-time status updates.
 *
 * @example
 * ```tsx
 * <ExportDialog
 *   open={showExportDialog}
 *   onOpenChange={setShowExportDialog}
 *   defaultType="by-sku"
 *   defaultWeekStart={weekStart}
 *   defaultWeekEnd={weekEnd}
 * />
 * ```
 */
export function ExportDialog({
  open,
  onOpenChange,
  defaultType = 'by-sku',
  defaultWeekStart,
  defaultWeekEnd,
}: ExportDialogProps) {
  const lastCompletedWeek = getLastCompletedWeek()

  // Form state
  const [type, setType] = useState<ExportType>(defaultType)
  const [weekStart, setWeekStart] = useState(defaultWeekStart ?? lastCompletedWeek)
  const [weekEnd, setWeekEnd] = useState(defaultWeekEnd ?? lastCompletedWeek)
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [includeCogs, setIncludeCogs] = useState(true)

  // Export hook
  const {
    createExport,
    isCreating,
    status,
    reset,
    createError,
  } = useExportAnalytics()

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (open) {
      setType(defaultType)
      setWeekStart(defaultWeekStart ?? lastCompletedWeek)
      setWeekEnd(defaultWeekEnd ?? lastCompletedWeek)
      setFormat('xlsx')
      setIncludeCogs(true)
    }
  }, [open, defaultType, defaultWeekStart, defaultWeekEnd, lastCompletedWeek])

  // Auto-download when export completes
  useEffect(() => {
    if (status?.status === 'completed' && status.download_url) {
      // Try to trigger download
      const link = document.createElement('a')
      link.href = status.download_url
      link.download = ''
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [status])

  // Handle export submit
  const handleExport = () => {
    createExport({
      type,
      weekStart,
      weekEnd,
      format,
      includeCogs,
    })
  }

  // Handle dialog close
  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  // Handle retry
  const handleRetry = () => {
    reset()
  }

  // Handle date range change
  const handleRangeChange = (newStart: string, newEnd: string) => {
    setWeekStart(newStart)
    setWeekEnd(newEnd)
  }

  // Determine if we're showing the form or the status
  const showForm = !status
  const showStatus = !!status
  const isCompleted = status?.status === 'completed'
  const isFailed = status?.status === 'failed'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Экспорт аналитики
          </DialogTitle>
          <DialogDescription>
            Выберите параметры экспорта для скачивания данных
          </DialogDescription>
        </DialogHeader>

        {/* Configuration Form */}
        {showForm && (
          <div className="space-y-5 py-4">
            {/* Export Type */}
            <div className="space-y-2">
              <Label htmlFor="export-type">Тип данных</Label>
              <Select value={type} onValueChange={(value) => setType(value as ExportType)}>
                <SelectTrigger id="export-type">
                  <SelectValue placeholder="Выберите тип данных" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <DateRangePicker
                weekStart={weekStart}
                weekEnd={weekEnd}
                onRangeChange={handleRangeChange}
                maxWeeks={52}
                showQuickSelect={true}
              />
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Формат файла</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={format === 'xlsx' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat('xlsx')}
                  className="flex-1 gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Button>
                <Button
                  type="button"
                  variant={format === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat('csv')}
                  className="flex-1 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Include COGS Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-cogs"
                checked={includeCogs}
                onCheckedChange={(checked) => setIncludeCogs(checked === true)}
              />
              <Label
                htmlFor="include-cogs"
                className="text-sm font-normal cursor-pointer"
              >
                Включить данные COGS (себестоимость)
              </Label>
            </div>

            {/* Error from creation */}
            {createError && (
              <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                {createError.message || 'Ошибка при создании экспорта'}
              </div>
            )}
          </div>
        )}

        {/* Export Status Display */}
        {showStatus && (
          <ExportStatusDisplay
            status={status}
            onRetry={handleRetry}
          />
        )}

        {/* Footer Actions */}
        <DialogFooter>
          {showForm && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                onClick={handleExport}
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <>Создание...</>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Экспортировать
                  </>
                )}
              </Button>
            </>
          )}

          {isCompleted && (
            <Button onClick={handleClose}>
              Закрыть
            </Button>
          )}

          {isFailed && (
            <Button variant="outline" onClick={handleClose}>
              Закрыть
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
