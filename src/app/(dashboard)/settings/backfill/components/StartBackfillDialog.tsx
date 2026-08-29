/**
 * Start Backfill Dialog Component
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Dialog for starting a new backfill job
 */

'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { BackfillCabinetStatus, StartBackfillRequest } from '@/types/backfill'
import { canStartBackfill } from '@/lib/backfill-utils'

interface StartBackfillDialogProps {
  cabinets: BackfillCabinetStatus[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStart: (request: StartBackfillRequest) => void | Promise<void>
  isStarting?: boolean
  returnFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Dialog for configuring and starting a backfill job
 */
export function StartBackfillDialog({
  cabinets,
  isOpen,
  onOpenChange,
  onStart,
  isStarting = false,
  returnFocusRef,
}: StartBackfillDialogProps) {
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionLock = useRef(false)
  const selectTriggerRef = useRef<HTMLButtonElement>(null)

  const availableCabinets = cabinets.filter(
    cabinet => canStartBackfill(cabinet.status) && canStartBackfill(cabinet.analytics_status)
  )
  const selectedCabinet = availableCabinets.find(
    cabinet => cabinet.cabinet_id === selectedCabinetId
  )

  useEffect(() => {
    if (selectedCabinetId && !selectedCabinet) setSelectedCabinetId('')
  }, [selectedCabinet, selectedCabinetId])

  const handleStart = async () => {
    if (!selectedCabinet || submissionLock.current) return

    submissionLock.current = true
    setIsSubmitting(true)
    try {
      await onStart({ cabinet_id: selectedCabinet.cabinet_id })
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  const isBusy = isStarting || isSubmitting

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedCabinetId('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={event => {
          event.preventDefault()
          selectTriggerRef.current?.focus()
        }}
        onCloseAutoFocus={event => {
          if (!returnFocusRef?.current) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Запуск бэкфилла
          </DialogTitle>
          <DialogDescription>
            Выберите кабинет для загрузки исторических данных за 365 дней
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cabinet-select">Кабинет</Label>
            <Select
              value={selectedCabinet?.cabinet_id ?? ''}
              onValueChange={setSelectedCabinetId}
              disabled={isBusy}
            >
              <SelectTrigger ref={selectTriggerRef} id="cabinet-select" className="min-h-11">
                <SelectValue placeholder="Выберите кабинет" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)]">
                {availableCabinets.length === 0 ? (
                  <SelectItem
                    value="none"
                    disabled
                    className="min-h-11 whitespace-normal break-words"
                  >
                    Нет доступных кабинетов
                  </SelectItem>
                ) : (
                  availableCabinets.map(cabinet => (
                    <SelectItem
                      key={cabinet.cabinet_id}
                      value={cabinet.cabinet_id}
                      className="min-h-11 whitespace-normal break-words"
                    >
                      {cabinet.cabinet_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {availableCabinets.length === 0 && (
            <p className="text-sm text-status-warning">
              Все кабинеты уже загружают данные или находятся на паузе
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="min-h-11">
            Отмена
          </Button>
          <Button
            onClick={() => void handleStart()}
            disabled={!selectedCabinet || isBusy}
            aria-busy={isBusy}
            className="min-h-11"
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                Запуск...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Запустить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StartBackfillDialog
