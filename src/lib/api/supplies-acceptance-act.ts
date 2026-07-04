/**
 * Supplies Acceptance-Act API Client — Epic Moysklad, Story O5 (S8 / F4).
 * Upload (base64) for indefinite storage + download of the stored act.
 *
 * Verified contract (backend src/supplies/controllers/supplies.controller.ts):
 *   POST /v1/supplies/:id/acceptance-act  body UploadAcceptanceActDto → AcceptanceActMeta
 *   GET  /v1/supplies/:id/acceptance-act  → binary stream (404 if none stored)
 */
import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  UploadAcceptanceActBody,
  AcceptanceActMeta,
  AcceptanceActFormat,
} from '@/types/supplies'

/**
 * Upload a WB acceptance act (base64-encoded) for indefinite storage.
 * POST /v1/supplies/:supplyId/acceptance-act → AcceptanceActMeta.
 */
export async function uploadAcceptanceAct(
  supplyId: string,
  body: UploadAcceptanceActBody
): Promise<AcceptanceActMeta> {
  logger.debug('[Supplies API] Upload acceptance act:', {
    supplyId,
    format: body.format,
    filename: body.filename,
  })
  return apiClient.post<AcceptanceActMeta>(`/v1/supplies/${supplyId}/acceptance-act`, body)
}

/**
 * Download the stored acceptance act for a supply (binary Blob).
 * GET /v1/supplies/:supplyId/acceptance-act → Blob (404 if none stored).
 */
export async function downloadAcceptanceAct(supplyId: string): Promise<Blob> {
  logger.debug('[Supplies API] Download acceptance act:', supplyId)
  return apiClient.get<Blob>(`/v1/supplies/${supplyId}/acceptance-act`, {
    skipDataUnwrap: true,
    responseType: 'blob',
  })
}

/**
 * Detect the acceptance-act format from a filename extension.
 * Returns null for unsupported extensions (the caller rejects the upload).
 */
export function detectAcceptanceActFormat(filename: string): AcceptanceActFormat | null {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (ext === 'xlsx') return 'xlsx'
  if (ext === 'zip') return 'zip'
  return null
}

/**
 * Read a browser File as base64 (no data-URL prefix). Used by the upload hook
 * to format the body the backend expects (IsBase64 on the raw base64 string).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Не удалось прочитать файл'))
        return
      }
      // readAsDataURL returns "data:<mime>;base64,<payload>" — strip the prefix.
      const commaIdx = result.indexOf(',')
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}
