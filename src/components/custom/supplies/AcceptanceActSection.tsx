'use client'

/**
 * AcceptanceActSection — upload/download a supply's WB acceptance act.
 * Epic Moysklad, Story O5 (S8 / F4).
 *
 * WB retains acceptance acts for only 3 months; we store them indefinitely.
 * The operator picks a local .xlsx/.zip act (downloaded from WB), the section
 * base64-encodes + uploads it (useUploadAcceptanceAct), then shows the stored
 * timestamp + a download button. Re-uploading replaces the stored act.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O5)
 */

import { useRef, useState } from 'react'
import { Upload, Download, Loader2, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { SupplyDocument } from '@/types/supplies'

interface AcceptanceActSectionProps {
  /** Stored acceptance-act doc (from supply.documents), or null when none. */
  storedAct: SupplyDocument | null
  /** Receives the picked file. */
  onUpload: (file: File) => void
  /** Downloads the stored act. */
  onDownload: () => void
  /** True while the upload mutation is in-flight. */
  uploadPending?: boolean
  /** True while the download mutation is in-flight. */
  downloadPending?: boolean
}

/**
 * Renders the acceptance-act upload/download card for a supply.
 */
export function AcceptanceActSection({
  storedAct,
  onUpload,
  onDownload,
  uploadPending = false,
  downloadPending = false,
}: AcceptanceActSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handlePick = () => {
    setValidationError(null)
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so picking the same file again still fires onChange.
    e.target.value = ''
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.zip')) {
      setValidationError('Поддерживаются только файлы .xlsx и .zip')
      return
    }
    setValidationError(null)
    onUpload(file)
  }

  return (
    <div className="rounded-lg border bg-card p-6" data-testid="acceptance-act-section">
      <h2 className="mb-4 text-lg font-semibold">Акт приёмки</h2>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {uploadPending
          ? 'Акт приёмки загружается'
          : downloadPending
            ? 'Акт приёмки подготавливается к скачиванию'
            : ''}
      </span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm" aria-live="polite">
          {storedAct ? (
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-status-success" aria-hidden="true" />
              <span>Загружен {formatDateTime(storedAct.generatedAt)}</span>
            </div>
          ) : (
            <p className="text-muted-foreground">Акт приёмки ещё не загружен</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePick}
            disabled={uploadPending}
            data-testid="acceptance-act-upload-btn"
          >
            {uploadPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Загрузить акт
          </Button>
          {storedAct && (
            <Button
              variant="ghost"
              onClick={onDownload}
              disabled={downloadPending}
              data-testid="acceptance-act-download-btn"
            >
              {downloadPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Скачать
            </Button>
          )}
        </div>
      </div>
      {validationError && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {validationError}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.zip"
        className="hidden"
        onChange={handleChange}
        data-testid="acceptance-act-file-input"
        aria-label="Файл акта приёмки"
      />
    </div>
  )
}
