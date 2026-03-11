'use client'

/**
 * Shipment delete confirmation dialog
 * Epic 76-FE, Story 76.5: Extracted from ShipmentDetailHeader
 */

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

interface ShipmentDeleteDialogProps {
  isDeleting: boolean
  onDelete: () => void
}

export function ShipmentDeleteDialog({ isDeleting, onDelete }: ShipmentDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" aria-label="Удалить отправку">
          <Trash2 className="h-4 w-4 mr-1" />
          Удалить
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить отправку?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены? Это действие невозможно отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
