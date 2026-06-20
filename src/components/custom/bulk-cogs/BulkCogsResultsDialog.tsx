'use client'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BulkCogsAlerts } from './BulkCogsAlerts'

interface ResultItem {
  nm_id: string
  success: boolean
  error_message?: string
  error_code?: string
}

// F-34: flattened to match the canonical BulkCogsResultSummary (fields top-level, not
// nested under `.data`). Structurally accepts BulkCogsResultSummary.
interface ResultData {
  succeeded: number
  failed: number
  results: ResultItem[]
}

interface PollingStrategy {
  interval: number
  maxAttempts: number
  estimatedTime: number
}

interface BulkCogsResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resultData: ResultData | undefined
  isPolling: boolean
  pollingAttempts: number
  pollingTimeout: boolean
  pollingStrategy: PollingStrategy
  onRetry: () => void
}

/**
 * Results dialog showing success/failure after bulk COGS assignment
 * Story 4.2 + Request #118/119 (margin recalculation status)
 */
export function BulkCogsResultsDialog({
  open,
  onOpenChange,
  resultData,
  isPolling,
  pollingAttempts,
  pollingTimeout,
  pollingStrategy,
  onRetry,
}: BulkCogsResultsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Результаты массового назначения</DialogTitle>
          <DialogDescription>
            Проверьте, какие себестоимости назначены успешно, а какие требуют повторной попытки.
          </DialogDescription>
        </DialogHeader>

        {resultData && (
          <div className="space-y-4">
            <BulkCogsAlerts
              resultData={resultData}
              isPolling={isPolling}
              pollingAttempts={pollingAttempts}
              pollingTimeout={pollingTimeout}
              pollingMaxAttempts={pollingStrategy.maxAttempts}
              pollingEstimatedTime={pollingStrategy.estimatedTime}
            />

            {/* Failed Items */}
            {resultData.failed > 0 && (
              <div>
                <div className="mb-2 text-sm font-medium text-gray-900">Не удалось обновить:</div>
                <div className="max-h-64 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableBody>
                      {resultData.results
                        .filter(r => !r.success)
                        .map(result => (
                          <TableRow key={result.nm_id}>
                            <TableCell className="font-mono text-sm">{result.nm_id}</TableCell>
                            <TableCell className="text-sm text-red-600">
                              {result.error_message || result.error_code}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {resultData && resultData.failed > 0 && (
            <Button variant="outline" onClick={onRetry}>
              Повторить для неудачных
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
