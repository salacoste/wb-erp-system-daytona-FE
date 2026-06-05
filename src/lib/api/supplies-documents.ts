/**
 * Supplies Document & Sync API Client
 * Extracted from supplies.ts for file size compliance (Epic 74)
 *
 * Document operations (stickers, downloads) and WB sync.
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  GenerateStickersRequest,
  GenerateStickersResponse,
  SyncSuppliesResponse,
  StickerFormat,
  DocumentType,
} from '@/types/supplies'

// =============================================================================
// Document Operations
// =============================================================================

/**
 * Generate stickers for supply
 * POST /v1/supplies/:id/stickers
 */
export async function generateStickers(
  supplyId: string,
  format: StickerFormat = 'png'
): Promise<GenerateStickersResponse> {
  logger.debug('[Supplies API] Generating stickers:', { supplyId, format })

  const response = await apiClient.post<GenerateStickersResponse>(
    `/v1/supplies/${supplyId}/stickers`,
    { format } as GenerateStickersRequest
  )

  logger.debug('[Supplies API] Stickers generated:', response.document?.type)

  return response
}

/**
 * Download document (returns blob)
 * GET /v1/supplies/:id/documents/:type
 */
export async function downloadDocument(supplyId: string, docType: DocumentType): Promise<Blob> {
  logger.debug('[Supplies API] Downloading document:', { supplyId, docType })

  const response = await apiClient.get<Blob>(`/v1/supplies/${supplyId}/documents/${docType}`, {
    skipDataUnwrap: true,
  })

  logger.debug('[Supplies API] Document downloaded')

  return response
}

// =============================================================================
// Sync Operations
// =============================================================================

/**
 * Trigger manual sync with WB
 * POST /v1/supplies/sync
 * Rate limited: 1 request per 5 minutes
 */
export async function syncSupplies(): Promise<SyncSuppliesResponse> {
  logger.debug('[Supplies API] Syncing supplies with WB')

  // Async enqueue (HTTP 202): backend returns { jobId, message } — NOT a synchronous result.
  const response = await apiClient.post<SyncSuppliesResponse>('/v1/supplies/sync', {})

  logger.debug('[Supplies API] Sync job enqueued:', { jobId: response.jobId })

  return response
}
