/**
 * useDownloadDocument Mutation Hook
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Hook for downloading supply documents (stickers, barcodes, etc.)
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { downloadDocument } from '@/lib/api/supplies'
import type { DocumentType, StickerFormat } from '@/types/supplies'

/** API Error interface for error handling */
interface ApiError extends Error {
  status?: number
  code?: string
}

/** MIME types for different formats */
const FORMAT_MIME_TYPES: Record<StickerFormat, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  zpl: 'application/octet-stream',
}

/** File extensions for different formats */
const FORMAT_EXTENSIONS: Record<StickerFormat, string> = {
  png: 'png',
  svg: 'svg',
  zpl: 'zpl',
}

/** Error message mapping */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const apiError = error as ApiError

    if (apiError.status === 0 || apiError.message === 'Failed to fetch') {
      return 'Проверьте соединение и попробуйте снова'
    }
    if (apiError.status === 404) {
      return 'Документ не найден'
    }
    if (apiError.status === 403) {
      return 'Нет доступа к документу'
    }
    if (apiError.status === 500) {
      return 'Ошибка сервера. Попробуйте позже.'
    }

    return apiError.message
  }

  return 'Не удалось скачать документ'
}

/** Request parameters for downloading document */
interface DownloadDocumentParams {
  supplyId: string
  docType: DocumentType
  format?: StickerFormat
  filename?: string
}

/** Options for the useDownloadDocument hook */
interface UseDownloadDocumentOptions {
  /** Callback on successful download */
  onSuccess?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Trigger browser download from blob data
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Hook for downloading supply documents
 *
 * @param options - Hook options
 * @returns Mutation object with mutate, mutateAsync, isPending, error
 *
 * @example
 * const { mutate, isPending } = useDownloadDocument({
 *   onSuccess: () => toast.success('Downloaded!'),
 * })
 * mutate({ supplyId: 'supply-001', docType: 'sticker', format: 'png' })
 */
export function useDownloadDocument(options: UseDownloadDocumentOptions = {}) {
  return useMutation({
    mutationFn: async ({ supplyId, docType, format = 'png', filename }: DownloadDocumentParams) => {
      console.info('[useDownloadDocument] Downloading document:', { supplyId, docType, format })

      const blob = await downloadDocument(supplyId, docType)

      // Generate filename if not provided
      const ext = FORMAT_EXTENSIONS[format]
      const downloadFilename = filename || `${docType}-${supplyId}.${ext}`

      // Trigger browser download
      triggerDownload(blob, downloadFilename)

      return { blob, filename: downloadFilename }
    },

    onSuccess: (_data, { docType }) => {
      console.info('[useDownloadDocument] Document downloaded successfully')

      // Show success toast based on document type
      const docLabels: Record<DocumentType, string> = {
        sticker: 'Стикеры скачаны',
        barcode: 'Штрих-код скачан',
        acceptance_act: 'Акт приёмки скачан',
      }
      toast.success(docLabels[docType] || 'Документ скачан')

      options.onSuccess?.()
    },

    onError: (error: Error, { docType }) => {
      console.error('[useDownloadDocument] Failed to download document:', docType, error)

      const message = getErrorMessage(error)
      toast.error(message)

      options.onError?.(error)
    },
  })
}

/**
 * Helper to download stickers from base64 data (from generate response)
 */
export function downloadStickersFromBase64(
  data: string,
  format: StickerFormat,
  supplyId: string
): void {
  const mimeType = FORMAT_MIME_TYPES[format]
  const ext = FORMAT_EXTENSIONS[format]
  const filename = `stickers-${supplyId}.${ext}`

  // Convert base64 to blob
  const binaryString = atob(data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })

  triggerDownload(blob, filename)
}
