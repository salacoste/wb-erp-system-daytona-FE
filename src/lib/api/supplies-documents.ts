/**
 * Supplies Document & Sync API Client
 * Extracted from supplies.ts for file size compliance (Epic 74)
 *
 * Document operations (stickers, downloads) and WB sync.
 */

import { apiClient } from '../api-client'
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
  console.info('[Supplies API] Generating stickers:', { supplyId, format })

  const response = await apiClient.post<GenerateStickersResponse>(
    `/v1/supplies/${supplyId}/stickers`,
    { format } as GenerateStickersRequest
  )

  console.info('[Supplies API] Stickers generated:', response.document?.type)

  return response
}

/**
 * Download document (returns blob)
 * GET /v1/supplies/:id/documents/:type
 */
export async function downloadDocument(supplyId: string, docType: DocumentType): Promise<Blob> {
  console.info('[Supplies API] Downloading document:', { supplyId, docType })

  const response = await apiClient.get<Blob>(`/v1/supplies/${supplyId}/documents/${docType}`, {
    skipDataUnwrap: true,
  })

  console.info('[Supplies API] Document downloaded')

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
  console.info('[Supplies API] Syncing supplies with WB')

  const response = await apiClient.post<SyncSuppliesResponse>('/v1/supplies/sync', {})

  console.info('[Supplies API] Sync completed:', {
    syncedCount: response.syncedCount,
    statusChanges: response.statusChanges?.length ?? 0,
  })

  return response
}
