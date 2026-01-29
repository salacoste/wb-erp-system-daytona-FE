/**
 * Start Backfill Dialog Component
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Dialog for starting a new backfill job
 */

'use client'

import { useState } from 'react'
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

interface StartBackfillDialogProps {
  cabinets: BackfillCabinetStatus[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStart: (request: StartBackfillRequest) => void
  isStarting?: boolean
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
}: StartBackfillDialogProps) {
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('')

  // Filter cabinets that can start backfill
  const availableCabinets = cabinets.filter(
    c => c.status === 'idle' || c.status === 'completed' || c.status === 'failed'
  )

  const handleStart = () => {
    if (!selectedCabinetId) return

    onStart({
      cabinet_id: selectedCabinetId,
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedCabinetId('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
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
            <Select value={selectedCabinetId} onValueChange={setSelectedCabinetId}>
              <SelectTrigger id="cabinet-select">
                <SelectValue placeholder="Выберите кабинет" />
              </SelectTrigger>
              <SelectContent>
                {availableCabinets.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Нет доступных кабинетов
                  </SelectItem>
                ) : (
                  availableCabinets.map(cabinet => (
                    <SelectItem key={cabinet.cabinet_id} value={cabinet.cabinet_id}>
                      {cabinet.cabinet_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {availableCabinets.length === 0 && (
            <p className="text-sm text-amber-600">
              Все кабинеты уже загружают данные или находятся на паузе
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isStarting}>
            Отмена
          </Button>
          <Button onClick={handleStart} disabled={!selectedCabinetId || isStarting}>
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
