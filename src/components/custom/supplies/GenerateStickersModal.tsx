'use client'

/**
 * GenerateStickersModal Component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Modal for generating and downloading stickers with format selection and preview.
 */

import { useEffect, useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
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
import { useDownloadDocument } from '@/hooks/useDownloadDocument'
import type { DocumentType, StickerFormat } from '@/types/supplies'

const GENERATED_DOCUMENT_TYPES: Record<'STICKER', DocumentType> = {
  STICKER: 'sticker',
}

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
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [format, setFormat] = useState<StickerFormat>('png')

  const { mutateAsync: generateStickersMutation, isPending: isGenerating } = useGenerateStickers()
  const { mutateAsync: downloadDocumentMutation, isPending: isDownloading } = useDownloadDocument()
  const isPending = isGenerating || isDownloading

  const handleDownload = async () => {
    try {
      const generatedDocument = await generateStickersMutation({ supplyId, format })
      const documentType = GENERATED_DOCUMENT_TYPES[generatedDocument.docType]
      const downloadedFormat: StickerFormat =
        generatedDocument.format === 'zplv' ? 'zpl' : generatedDocument.format

      await downloadDocumentMutation({
        supplyId,
        docType: documentType,
        format: downloadedFormat,
        filename: `stickers-${supplyId}.${downloadedFormat}`,
      })
      onOpenChange(false)
    } catch {
      // Mutation hooks own the user-facing generation/download errors.
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during loading
    if (!newOpen && isPending) {
      return
    }
    onOpenChange(newOpen)
  }

  useEffect(() => {
    if (open) return

    const rememberFocus = () => {
      if (document.activeElement instanceof HTMLElement) {
        if (document.activeElement.closest('[role="dialog"], [role="alertdialog"]')) return
        returnFocusRef.current = document.activeElement
      }
    }

    rememberFocus()
    document.addEventListener('focusin', rememberFocus)
    return () => document.removeEventListener('focusin', rememberFocus)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement) {
            returnFocusRef.current = document.activeElement
          }
        }}
        onCloseAutoFocus={event => {
          if (!returnFocusRef.current?.isConnected) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Генерация стикеров</DialogTitle>
          <DialogDescription>Выберите формат и скачайте стикеры для поставки.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format selector */}
          <StickerFormatSelector value={format} onChange={setFormat} disabled={isPending} />

          {/* Preview area */}
          <StickerPreview format={format} isLoading={isPending} />
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          {isPending ? 'Стикеры генерируются и подготавливаются к скачиванию' : ''}
        </span>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Отмена
          </Button>
          <Button onClick={handleDownload} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Генерация...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Скачать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
