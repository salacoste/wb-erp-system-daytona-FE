'use client'

/**
 * SupplyDocumentsList Component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Displays available documents for download.
 */

import { FileText, Download, Loader2, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { SupplyDocument, DocumentType } from '@/types/supplies'

interface SupplyDocumentsListProps {
  supplyId: string
  documents: SupplyDocument[]
  onDownload: (docType: string, filename: string) => void
  isDownloading?: boolean
  downloadingType?: string
}

/** Get document type label in Russian */
function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    sticker: 'Стикеры',
    barcode: 'Штрихкоды',
    acceptance_act: 'Акт приёмки',
  }
  return labels[type] || type
}

/** Format file size */
function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} байт`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

/** Get document icon */
function getDocumentIcon(format: string) {
  // Different icons could be used for different formats
  if (format === 'pdf') return FileText
  return File
}

export function SupplyDocumentsList({
  documents,
  onDownload,
  isDownloading = false,
  downloadingType,
}: SupplyDocumentsListProps) {
  // Empty state
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Документы</h2>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <FileText className="mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
          <p className="text-gray-500">Документы ещё не сгенерированы</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Документы</h2>
      <ul className="divide-y">
        {documents.map(doc => {
          const Icon = getDocumentIcon(doc.format)
          const label = `${getDocumentTypeLabel(doc.type)} (${doc.format.toUpperCase()})`
          const filename = `${doc.type}-${doc.format}.${doc.format === 'pdf' ? 'pdf' : doc.format}`
          const isThisDownloading = isDownloading && downloadingType === doc.type

          return (
            <li
              key={`${doc.type}-${doc.format}`}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(doc.sizeBytes)} &middot;{' '}
                    {(() => {
                      const date = new Date(doc.generatedAt)
                      const hours = date.getHours().toString().padStart(2, '0')
                      const minutes = date.getMinutes().toString().padStart(2, '0')
                      return `${formatDate(date)} ${hours}:${minutes}`
                    })()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(doc.type, filename)}
                disabled={isDownloading}
                aria-label={`Скачать ${label}`}
              >
                {isThisDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Скачать
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
