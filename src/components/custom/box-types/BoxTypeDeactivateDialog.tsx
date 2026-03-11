'use client'

/**
 * Deactivate confirmation dialog for Box Types
 * Epic 75-FE, Story 75.2 (AC: #5, #7)
 */

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeactivateBoxType } from '@/hooks/use-box-types'
import type { BoxType } from '@/types/shipment-cost'

interface BoxTypeDeactivateDialogProps {
  boxType: BoxType | null
  onClose: () => void
}

export function BoxTypeDeactivateDialog({ boxType, onClose }: BoxTypeDeactivateDialogProps) {
  const deactivateMutation = useDeactivateBoxType()
  const [apiError, setApiError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!boxType) return
    setApiError(null)
    try {
      await deactivateMutation.mutateAsync(boxType.id)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка деактивации'
      setApiError(
        msg.includes('409')
          ? 'Невозможно деактивировать — есть привязки к товарам. Удалите привязки упаковки сначала.'
          : msg
      )
    }
  }

  return (
    <AlertDialog
      open={!!boxType}
      onOpenChange={v => !v && !deactivateMutation.isPending && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Деактивировать тип коробки?</AlertDialogTitle>
          <AlertDialogDescription>
            Тип коробки &quot;{boxType?.name}&quot; будет деактивирован и не сможет использоваться
            для новых привязок. Существующие привязки сохранятся.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {apiError && <p className="text-sm text-destructive px-6">{apiError}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Отмена</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={deactivateMutation.isPending}
            variant="destructive"
          >
            {deactivateMutation.isPending ? 'Деактивация...' : 'Деактивировать'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
