/**
 * Export Status Display Component
 * Story 6.5-FE: Export Analytics UI
 *
 * Displays the current status of an export operation:
 * - Pending: "В очереди..." with spinner
 * - Processing: "Обработка..." with spinner
 * - Completed: Success with download button and file info
 * - Failed: Error message with retry button
 *
 * Reference: frontend/docs/stories/epic-6/story-6.5-fe-export-analytics.md
 */

import { Loader2, CheckCircle, XCircle, Download, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExportStatus } from '@/types/analytics'
import { formatBytes, formatExpirationDate } from '@/hooks/useExportAnalytics'

/**
 * Props for ExportStatusDisplay component
 */
export interface ExportStatusDisplayProps {
  /** Current export status */
  status: ExportStatus
  /** Callback when retry button is clicked */
  onRetry: () => void
  /** Optional class name */
  className?: string
}

/**
 * Status labels in Russian
 */
const STATUS_LABELS: Record<ExportStatus['status'], string> = {
  pending: 'В очереди...',
  processing: 'Обработка...',
  completed: 'Готово!',
  failed: 'Ошибка',
}

/**
 * ExportStatusDisplay component
 *
 * Displays the status of an export with appropriate icons, messages,
 * and action buttons based on the current state.
 *
 * @example
 * ```tsx
 * <ExportStatusDisplay
 *   status={exportStatus}
 *   onRetry={() => reset()}
 * />
 * ```
 */
export function ExportStatusDisplay({
  status,
  onRetry,
  className,
}: ExportStatusDisplayProps) {
  const isLoading = status.status === 'pending' || status.status === 'processing'
  const isCompleted = status.status === 'completed'
  const isFailed = status.status === 'failed'

  return (
    <div className={cn('space-y-4 py-4', className)}>
      {/* Status Header */}
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        {isLoading && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        )}
        {isCompleted && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {isFailed && (
          <XCircle className="h-5 w-5 text-red-600" />
        )}

        {/* Status Label */}
        <span
          className={cn(
            'font-medium',
            isLoading && 'text-blue-700',
            isCompleted && 'text-green-700',
            isFailed && 'text-red-700'
          )}
        >
          {STATUS_LABELS[status.status]}
        </span>

        {/* Estimated Time (during processing) */}
        {isLoading && status.estimated_time_sec && (
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{Math.ceil(status.estimated_time_sec / 60)} мин
          </span>
        )}
      </div>

      {/* Completed State: File Info & Download */}
      {isCompleted && status.download_url && (
        <div className="space-y-3">
          {/* File Info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-2">
              <span className="font-medium">Файл:</span>
              <span>{formatBytes(status.file_size_bytes)}</span>
              <span className="text-gray-400">•</span>
              <span>{status.rows_count?.toLocaleString('ru-RU')} строк</span>
            </p>

            {/* Expiration Warning */}
            {status.expires_at && (
              <p className="flex items-center gap-2 text-amber-600">
                <Clock className="h-3 w-3" />
                <span>Ссылка действительна до: {formatExpirationDate(status.expires_at)}</span>
              </p>
            )}
          </div>

          {/* Download Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            asChild
          >
            <a href={status.download_url} download>
              <Download className="h-4 w-4" />
              Скачать файл
            </a>
          </Button>
        </div>
      )}

      {/* Failed State: Error Message & Retry */}
      {isFailed && (
        <div className="space-y-3">
          {/* Error Message */}
          <p className="text-sm text-red-600">
            {status.error_message || 'Произошла ошибка при экспорте. Попробуйте еще раз.'}
          </p>

          {/* Retry Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Loading Progress Indicator */}
      {isLoading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full animate-pulse"
            style={{
              width: status.status === 'processing' ? '60%' : '20%',
            }}
          />
        </div>
      )}
    </div>
  )
}
