'use client'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { MarginCalculationStatus } from '../MarginCalculationStatus'

interface MarginRecalculation {
  triggered: boolean
  affectedWeeks: string[]
  taskUuid: string
}

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
  marginRecalculation?: MarginRecalculation
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
        </DialogHeader>

        {resultData && (
          <div className="space-y-4">
            {/* Margin Recalculation Status (Request #118/119) */}
            {resultData.marginRecalculation && (
              <Alert variant="default" className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <div className="mb-1 font-medium">Пересчёт маржи запущен автоматически</div>
                  <div className="space-y-1 text-sm">
                    <div>
                      Статус:{' '}
                      <span className="font-medium">
                        {resultData.marginRecalculation.triggered ? 'Запущен' : 'Не запущен'}
                      </span>
                    </div>
                    {resultData.marginRecalculation.affectedWeeks.length > 0 && (
                      <div>Недели: {resultData.marginRecalculation.affectedWeeks.join(', ')}</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* No Margin Recalculation Warning */}
            {resultData.succeeded > 0 && !resultData.marginRecalculation && (
              <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <div className="mb-1 font-medium">Пересчёт маржи не требуется</div>
                  <div className="text-sm">
                    Для загруженных недель нет данных о продажах. Маржа будет рассчитана
                    автоматически после импорта финансовых отчетов.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Margin Calculation Status */}
            {isPolling && resultData.succeeded > 0 && (
              <MarginCalculationStatus
                isPolling={isPolling}
                attempts={pollingAttempts}
                maxAttempts={pollingStrategy.maxAttempts}
                estimatedTime={pollingStrategy.estimatedTime}
                isBulk={true}
                bulkCount={resultData.succeeded}
              />
            )}

            {/* Timeout Warning */}
            {pollingTimeout && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Расчёт маржи занимает больше времени. Обновите страницу через минуту.
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="text-sm font-medium text-green-900">Успешно</div>
                </div>
                <div className="mt-2 text-2xl font-bold text-green-900">{resultData.succeeded}</div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div className="text-sm font-medium text-red-900">Ошибок</div>
                </div>
                <div className="mt-2 text-2xl font-bold text-red-900">{resultData.failed}</div>
              </div>
            </div>

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
