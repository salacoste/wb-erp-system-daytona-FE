'use client'

/**
 * DocumentDownloadButton — per-row download control.
 *
 * Wraps the `useDownloadDocument` mutation: an extension selector (pdf/xlsx)
 * + a download button. Surfaces rate-limit/error inline (RU). The mutation
 * decodes base64 → Blob → triggers the browser download (download-blob.ts).
 *
 * NEW-7 AC: each document row can download in pdf or xlsx.
 */

import { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useDownloadDocument } from '@/hooks/useFinances'
import type { DocumentExtension, DocumentsLocale } from '@/types/finances'

export interface DocumentDownloadButtonProps {
  /** WB serviceName (REQUIRED by the WB download API — path param). */
  serviceName: string
  /** Extensions WB says are available for this document (defaults to pdf|xlsx). */
  extensions?: string[]
  /** Response locale forwarded to the download API. */
  locale?: DocumentsLocale
  /** Disable when serviceName is missing. */
  disabled?: boolean
}

const DEFAULT_EXTENSIONS: DocumentExtension[] = ['pdf', 'xlsx']

export function DocumentDownloadButton({
  serviceName,
  extensions,
  locale,
  disabled,
}: DocumentDownloadButtonProps) {
  const available = pickExtensions(extensions)
  const [extension, setExtension] = useState<DocumentExtension>(available[0])
  const mutation = useDownloadDocument()

  const handleDownload = () => {
    if (!serviceName || mutation.isPending) return
    mutation.mutate({ serviceName, extension, locale })
  }

  // Inline error (rate-limit / WB-unavailable / empty base64). Cleared on retry.
  const showError = mutation.isError

  return (
    <div className="flex items-center gap-1">
      <Select
        value={extension}
        onValueChange={v => setExtension(v as DocumentExtension)}
        disabled={disabled || available.length <= 1}
      >
        <SelectTrigger className="h-8 w-[84px]" aria-label="Формат скачивания" disabled={disabled}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {available.map(ext => (
            <SelectItem key={ext} value={ext}>
              {ext.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={handleDownload}
        disabled={disabled || !serviceName || mutation.isPending}
        aria-label={`Скачать документ (${extension.toUpperCase()})`}
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showError ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      {showError && (
        <span className="sr-only" role="alert">
          Ошибка скачивания документа
        </span>
      )}
    </div>
  )
}

/** Coerce the BE `extensions` array into valid DocumentExtension values. */
function pickExtensions(extensions?: string[]): DocumentExtension[] {
  if (!extensions || extensions.length === 0) return DEFAULT_EXTENSIONS
  const valid = extensions.filter(isValidExtension)
  return valid.length > 0 ? (valid as DocumentExtension[]) : DEFAULT_EXTENSIONS
}

function isValidExtension(ext: unknown): ext is DocumentExtension {
  return ext === 'pdf' || ext === 'xlsx'
}
