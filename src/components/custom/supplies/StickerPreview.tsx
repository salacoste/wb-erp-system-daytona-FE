'use client'

/**
 * StickerPreview Component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Preview area for stickers. Shows image for PNG/SVG, placeholder for ZPL.
 */

import { useState, useEffect } from 'react'
import { AlertCircle, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { StickerFormat } from '@/types/supplies'

interface StickerPreviewProps {
  /** Sticker format */
  format: StickerFormat
  /** Base64 data for the preview (PNG/SVG only) */
  data?: string
  /** Whether preview is loading */
  isLoading?: boolean
  /** Error message if preview failed */
  error?: string
  /** Callback to retry loading preview */
  onRetry?: () => void
  /** Additional className for the container */
  className?: string
}

/** MIME types for different formats */
const FORMAT_MIME_TYPES: Record<'png' | 'svg', string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
}

export function StickerPreview({
  format,
  data,
  isLoading = false,
  error,
  onRetry,
  className,
}: StickerPreviewProps) {
  const [imageError, setImageError] = useState(false)

  // Reset image error when format or data changes
  useEffect(() => {
    setImageError(false)
  }, [format, data])

  // ZPL format - show info placeholder
  if (format === 'zpl') {
    return (
      <div className={cn('rounded-lg border border-blue-200 bg-blue-50 p-6', className)}>
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Предпросмотр ZPL недоступен.</p>
            <p className="mt-1 text-blue-600">Этот формат предназначен для термопринтеров Zebra.</p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border bg-gray-50 p-4', className)} aria-busy="true">
        <Skeleton className="mx-auto h-[200px] w-full max-w-[300px]" aria-label="Загрузка превью" />
      </div>
    )
  }

  // Error state
  if (error || imageError) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-6', className)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
          <div className="text-sm text-red-700">
            <p className="font-medium">Не удалось загрузить превью</p>
            {error && <p className="mt-1 text-red-600">{error}</p>}
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Повторить
            </Button>
          )}
        </div>
      </div>
    )
  }

  // No data yet
  if (!data) {
    return (
      <div className={cn('rounded-lg border bg-gray-50 p-6', className)}>
        <div className="flex items-center justify-center text-sm text-gray-500">
          Превью будет доступно после генерации
        </div>
      </div>
    )
  }

  // Build data URL for image
  const mimeType = FORMAT_MIME_TYPES[format as 'png' | 'svg']
  const dataUrl = `data:${mimeType};base64,${data}`

  return (
    <div
      className={cn('flex items-center justify-center rounded-lg border bg-white p-4', className)}
    >
      <img
        src={dataUrl}
        alt="Превью стикера"
        className="max-h-[300px] max-w-full object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  )
}
