'use client'

/**
 * GenerateStickersModal Component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Modal for generating and downloading stickers with format selection and preview.
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StickerFormatSelector } from './StickerFormatSelector'
import { StickerPreview } from './StickerPreview'
import { useGenerateStickers } from '@/hooks/useGenerateStickers'
import { downloadStickersFromBase64 } from '@/hooks/useDownloadDocument'
import type { StickerFormat } from '@/types/supplies'

interface GenerateStickersModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Supply ID to generate stickers for */
  supplyId: string
}

export function GenerateStickersModal({
  open,
  onOpenChange,
  supplyId,
}: GenerateStickersModalProps) {
  const [format, setFormat] = useState<StickerFormat>('png')

  const {
    mutate: generateStickersMutation,
    isPending,
    data: generatedData,
  } = useGenerateStickers({
    onSuccess: data => {
      // If we have base64 data, trigger download
      if (data.data) {
        downloadStickersFromBase64(data.data, format, supplyId)
        toast.success('Стикеры скачаны')
        onOpenChange(false)
      } else if (format === 'zpl') {
        // ZPL doesn't have preview data, just success
        toast.success('Стикеры сгенерированы')
        onOpenChange(false)
      }
    },
  })

  const handleDownload = () => {
    generateStickersMutation({ supplyId, format })
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during loading
    if (!newOpen && isPending) {
      return
    }
    onOpenChange(newOpen)
  }

  // Get preview data for current format if already generated
  const previewData = generatedData?.data

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Генерация стикеров</DialogTitle>
          <DialogDescription>Выберите формат и скачайте стикеры для поставки.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format selector */}
          <StickerFormatSelector value={format} onChange={setFormat} disabled={isPending} />

          {/* Preview area */}
          <StickerPreview format={format} data={previewData} isLoading={isPending} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Отмена
          </Button>
          <Button onClick={handleDownload} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Скачать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
