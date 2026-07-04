'use client'

/**
 * Acceptance-act hooks — Epic Moysklad, Story O5 (S8 / F4).
 * Upload (base64) + download of a supply's WB acceptance act.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O5)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  uploadAcceptanceAct,
  downloadAcceptanceAct,
  detectAcceptanceActFormat,
  fileToBase64,
  suppliesQueryKeys,
} from '@/lib/api/supplies'
import type { AcceptanceActMeta } from '@/types/supplies'
import { ApiError } from '@/types/api'
import { logger } from '@/lib/logger'

/** Max acceptance-act upload size (client-side guard before base64 encoding). */
const MAX_ACCEPTANCE_ACT_BYTES = 25 * 1024 * 1024

/** Trigger a browser download from a Blob. */
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

interface UploadAcceptanceActInput {
  supplyId: string
  file: File
}

/**
 * Upload a WB acceptance act (base64). Validates the extension client-side
 * (xlsx/zip) before encoding. On success: invalidate the supply detail +
 * documents caches + toast.
 */
export function useUploadAcceptanceAct() {
  const queryClient = useQueryClient()
  return useMutation<AcceptanceActMeta, Error, UploadAcceptanceActInput>({
    mutationFn: async ({ supplyId, file }) => {
      const format = detectAcceptanceActFormat(file.name)
      if (!format) {
        throw new Error('Поддерживаются только файлы .xlsx и .zip')
      }
      if (file.size > MAX_ACCEPTANCE_ACT_BYTES) {
        throw new Error('Файл слишком большой (макс. 25 МБ)')
      }
      const base64 = await fileToBase64(file)
      return uploadAcceptanceAct(supplyId, { file: base64, filename: file.name, format })
    },
    onSuccess: (data, variables) => {
      logger.debug('[useUploadAcceptanceAct] Uploaded:', data.id)
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.detail(variables.supplyId) })
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.documents(variables.supplyId) })
      toast.success('Акт приёмки загружен')
    },
    onError: error => {
      logger.error('[useUploadAcceptanceAct] Upload failed:', error)
      toast.error(error.message || 'Не удалось загрузить акт приёмки')
    },
  })
}

/**
 * Download the stored acceptance act for a supply (binary → browser download).
 * A 404 means no act stored yet — surfaced as a friendly Russian message.
 */
export function useDownloadAcceptanceAct() {
  return useMutation<Blob, Error, { supplyId: string; filename: string }>({
    mutationFn: async ({ supplyId, filename }) => {
      const blob = await downloadAcceptanceAct(supplyId)
      triggerDownload(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Акт приёмки скачан')
    },
    onError: error => {
      logger.error('[useDownloadAcceptanceAct] Download failed:', error)
      // Status-based (not locale-substring): backend returns an English message.
      const is404 = error instanceof ApiError && error.status === 404
      toast.error(is404 ? 'Акт приёмки ещё не загружен' : 'Не удалось скачать акт приёмки')
    },
  })
}
