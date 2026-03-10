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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExportStatusDisplay } from '@/components/custom/ExportStatusDisplay'
import { Download } from 'lucide-react'
import { ExportDialogForm } from './export-dialog/ExportDialogForm'
import { useExportDialogState } from './export-dialog/useExportDialogState'
import type { ExportType } from '@/types/analytics'

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
  const state = useExportDialogState({
    open,
    defaultType,
    defaultWeekStart,
    defaultWeekEnd,
    onOpenChange,
  })

  return (
    <Dialog open={open} onOpenChange={state.handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Экспорт аналитики
          </DialogTitle>
          <DialogDescription>Выберите параметры экспорта для скачивания данных</DialogDescription>
        </DialogHeader>

        {/* Configuration Form */}
        {state.showForm && (
          <ExportDialogForm
            type={state.type}
            onTypeChange={state.setType}
            weekStart={state.weekStart}
            weekEnd={state.weekEnd}
            onRangeChange={state.handleRangeChange}
            format={state.format}
            onFormatChange={state.setFormat}
            includeCogs={state.includeCogs}
            onIncludeCogsChange={state.setIncludeCogs}
            createError={state.createError}
          />
        )}

        {/* Export Status Display */}
        {state.status && <ExportStatusDisplay status={state.status} onRetry={state.handleRetry} />}

        {/* Footer Actions */}
        <DialogFooter>
          {state.showForm && (
            <>
              <Button variant="outline" onClick={state.handleClose}>
                Отмена
              </Button>
              <Button onClick={state.handleExport} disabled={state.isCreating} className="gap-2">
                {state.isCreating ? (
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

          {state.isCompleted && <Button onClick={state.handleClose}>Закрыть</Button>}

          {state.isFailed && (
            <Button variant="outline" onClick={state.handleClose}>
              Закрыть
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
