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
import { Loader2 } from 'lucide-react'
import type { BulkCogsProduct } from './bulk-cogs.types'

interface BulkCogsPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  selectedProductDetails: BulkCogsProduct[]
  formattedPreview: string | null
  isPending: boolean
  isPolling: boolean
  onConfirm: () => void
}

/**
 * Preview dialog shown before submitting bulk COGS assignment
 * Story 4.2: Bulk COGS Assignment Capability
 */
export function BulkCogsPreviewDialog({
  open,
  onOpenChange,
  selectedCount,
  selectedProductDetails,
  formattedPreview,
  isPending,
  isPolling,
  onConfirm,
}: BulkCogsPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Подтверждение массового назначения</DialogTitle>
          <DialogDescription>
            Вы собираетесь назначить себестоимость для {selectedCount} товаров
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-600">Себестоимость</div>
            <div className="text-2xl font-bold text-gray-900">{formattedPreview || '\u2014'}</div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-gray-600">
              Выбранные товары ({selectedProductDetails.length}):
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <Table>
                <TableBody>
                  {selectedProductDetails.slice(0, 50).map(product => (
                    <TableRow key={product.nm_id}>
                      <TableCell className="font-mono text-sm">{product.nm_id}</TableCell>
                      <TableCell>{product.sa_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedProductDetails.length > 50 && (
                <div className="p-2 text-center text-sm text-gray-500">
                  ...и ещё {selectedProductDetails.length - 50} товаров
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending || isPolling}
          >
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || isPolling}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Назначение...
              </>
            ) : isPolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ожидание расчёта маржи...
              </>
            ) : (
              'Подтвердить'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
