'use client'

/** Delete confirmation dialog for SKU Packaging — Epic 75-FE, Story 75.3 (AC: #6) */

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
import { useDeleteSkuPackaging } from '@/hooks/use-sku-packaging'
import type { SkuPackaging } from '@/types/shipment-cost'

interface SkuPackagingDeleteDialogProps {
  item: SkuPackaging | null
  onClose: () => void
}

export function SkuPackagingDeleteDialog({ item, onClose }: SkuPackagingDeleteDialogProps) {
  const deleteMutation = useDeleteSkuPackaging()
  const [apiError, setApiError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!item) return
    setApiError(null)
    try {
      await deleteMutation.mutateAsync(item.nmId)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка удаления'
      setApiError(msg)
    }
  }

  return (
    <AlertDialog open={!!item} onOpenChange={v => !v && !deleteMutation.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить привязку упаковки?</AlertDialogTitle>
          <AlertDialogDescription>
            Привязка товара {item?.nmId} к типу коробки &quot;{item?.boxType?.name}&quot; будет
            удалена.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {apiError && <p className="text-sm text-destructive px-6">{apiError}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Отмена</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={deleteMutation.isPending} variant="destructive">
            {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
