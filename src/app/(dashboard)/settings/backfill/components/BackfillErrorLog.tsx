/**
 * Backfill Error Log Component
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Display and modal for error messages from failed backfill jobs
 */

'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { BackfillCabinetStatus } from '@/types/backfill'

interface BackfillErrorLogProps {
  cabinet: BackfillCabinetStatus
  onRetry?: (cabinetId: string) => void
}

/**
 * Error badge with expandable error details modal
 */
export function BackfillErrorLog({ cabinet, onRetry }: BackfillErrorLogProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Use last_error from cabinet status
  if (!cabinet.last_error) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1"
        aria-label={`Показать ошибку для ${cabinet.cabinet_name}`}
      >
        <Badge variant="destructive" className="cursor-pointer hover:bg-red-600">
          <AlertCircle className="mr-1 h-3 w-3" />
          Ошибка
        </Badge>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Ошибка бэкфилла: {cabinet.cabinet_name}
            </DialogTitle>
            <DialogDescription>
              Информация об ошибке при загрузке исторических данных
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span className="text-sm text-red-700">{cabinet.last_error}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Закрыть
            </Button>
            {onRetry && (
              <Button
                variant="default"
                onClick={() => {
                  onRetry(cabinet.cabinet_id)
                  setIsOpen(false)
                }}
              >
                Повторить бэкфилл
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BackfillErrorLog
