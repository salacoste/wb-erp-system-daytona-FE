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
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { BackfillCabinetStatus } from '@/types/backfill'

interface BackfillErrorLogProps {
  cabinet: BackfillCabinetStatus
}

/**
 * Error badge with expandable error details modal.
 *
 * Story 165.5: this modal is purely informational — it shows WHY a source failed.
 * The retry affordance for a failed source lives in `BackfillRetryControls`
 * (per-source `/report/retry` | `/analytics/retry`), rendered in the same row,
 * NOT a cabinet-wide `/start` masquerading as retry here. AC2/AC4: a failed
 * source's retry is per-source, never cabinet-wide.
 */
export function BackfillErrorLog({ cabinet }: BackfillErrorLogProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Use last_error from cabinet status
  if (!cabinet.last_error) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 whitespace-normal text-status-error hover:bg-status-error/10 hover:text-status-error"
          aria-label={`Показать ошибку для ${cabinet.cabinet_name}`}
        >
          <Badge
            variant="outline"
            className="border-status-error/40 bg-status-error/10 text-status-error"
          >
            <AlertCircle className="mr-1 h-3 w-3" />
            Ошибка
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-status-error">
            <AlertCircle className="h-5 w-5" />
            Ошибка бэкфилла: {cabinet.cabinet_name}
          </DialogTitle>
          <DialogDescription>
            Информация об ошибке при загрузке исторических данных
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-2 rounded-md border border-status-error/40 bg-status-error/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
            <span className="break-words text-sm text-status-error">{cabinet.last_error}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="min-h-11">
              Закрыть
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BackfillErrorLog
