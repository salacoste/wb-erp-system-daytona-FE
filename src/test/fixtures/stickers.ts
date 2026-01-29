/**
 * Test Fixtures for Stickers Module
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Fixtures for sticker generation, preview, and download tests.
 */

import type {
  StickerFormat,
  SupplyDocument,
  GenerateStickersRequest,
  GenerateStickersResponse,
} from '@/types/supplies'

// =============================================================================
// Sticker Format Constants
// =============================================================================

export const STICKER_FORMATS: StickerFormat[] = ['png', 'svg', 'zpl']

export const FORMAT_LABELS: Record<StickerFormat, string> = {
  png: 'PNG - для обычных принтеров',
  svg: 'SVG - высокое качество',
  zpl: 'ZPL - для термопринтеров Zebra',
}

export const FORMAT_MIME_TYPES: Record<StickerFormat, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  zpl: 'application/octet-stream',
}

// =============================================================================
// Mock Base64 Image Data (truncated for testing)
// =============================================================================

// Minimal valid PNG (1x1 red pixel)
export const MOCK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

// Minimal valid SVG
export const MOCK_SVG_BASE64 =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0icmVkIi8+PC9zdmc+'

// ZPL code (text-based label format)
export const MOCK_ZPL_CONTENT = `^XA
^FO50,50^ADN,36,20^FDWB-12345678^FS
^FO50,100^BY3^BCN,100,Y,N,N^FDWB12345678^FS
^XZ`

// =============================================================================
// Sticker Document Fixtures
// =============================================================================

export const mockStickerDocPng: SupplyDocument = {
  type: 'sticker',
  format: 'png',
  generatedAt: '2026-03-20T14:35:00.000Z',
  downloadUrl: '/v1/supplies/sup_123abc/documents/sticker',
  sizeBytes: 245760,
}

export const mockStickerDocSvg: SupplyDocument = {
  type: 'sticker',
  format: 'svg',
  generatedAt: '2026-03-20T14:35:00.000Z',
  downloadUrl: '/v1/supplies/sup_123abc/documents/sticker',
  sizeBytes: 102400,
}

export const mockStickerDocZpl: SupplyDocument = {
  type: 'sticker',
  format: 'zpl',
  generatedAt: '2026-03-20T14:35:00.000Z',
  downloadUrl: '/v1/supplies/sup_123abc/documents/sticker',
  sizeBytes: 15360,
}

// =============================================================================
// Generate Stickers Request Fixtures
// =============================================================================

export const mockGenerateRequestPng: GenerateStickersRequest = { format: 'png' }
export const mockGenerateRequestSvg: GenerateStickersRequest = { format: 'svg' }
export const mockGenerateRequestZpl: GenerateStickersRequest = { format: 'zpl' }

// =============================================================================
// Generate Stickers Response Fixtures
// =============================================================================

export const mockGenerateResponsePng: GenerateStickersResponse = {
  document: mockStickerDocPng,
  data: MOCK_PNG_BASE64,
  message: 'Stickers generated successfully',
}

export const mockGenerateResponseSvg: GenerateStickersResponse = {
  document: mockStickerDocSvg,
  data: MOCK_SVG_BASE64,
  message: 'Stickers generated successfully',
}

export const mockGenerateResponseZpl: GenerateStickersResponse = {
  document: mockStickerDocZpl,
  message: 'Stickers generated successfully',
  // No data field for ZPL (no preview)
}

// =============================================================================
// Preview Data Fixtures
// =============================================================================

export const mockPreviewPng = {
  format: 'png' as const,
  dataUrl: `data:image/png;base64,${MOCK_PNG_BASE64}`,
  width: 400,
  height: 600,
}

export const mockPreviewSvg = {
  format: 'svg' as const,
  dataUrl: `data:image/svg+xml;base64,${MOCK_SVG_BASE64}`,
  width: 400,
  height: 600,
}

// =============================================================================
// Download Blob Fixtures
// =============================================================================

export function createMockPngBlob(): Blob {
  const binaryString = atob(MOCK_PNG_BASE64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'image/png' })
}

export function createMockSvgBlob(): Blob {
  const svgContent = atob(MOCK_SVG_BASE64)
  return new Blob([svgContent], { type: 'image/svg+xml' })
}

export function createMockZplBlob(): Blob {
  return new Blob([MOCK_ZPL_CONTENT], { type: 'application/octet-stream' })
}

// =============================================================================
// Error Response Fixtures
// =============================================================================

export const mockErrorInvalidFormat = {
  code: 'INVALID_FORMAT',
  message: 'Invalid sticker format',
}

export const mockErrorWrongStatus = {
  code: 'WRONG_STATUS',
  message: 'Stickers are only available for closed supplies',
}

export const mockErrorGenerationFailed = {
  code: 'GENERATION_FAILED',
  message: 'Failed to generate stickers',
}

export const mockErrorDownloadFailed = {
  code: 'DOWNLOAD_FAILED',
  message: 'Failed to download document',
}

// =============================================================================
// Close Supply Response Fixtures (Duplicated for convenience)
// =============================================================================

export const mockCloseResponse = {
  id: 'sup_123abc',
  status: 'CLOSED' as const,
  closedAt: '2026-03-20T14:30:00.000Z',
  supplyNumber: 'WB-12345678',
}

export const mockCloseErrorEmpty = {
  code: 'EMPTY_SUPPLY',
  message: 'Cannot close supply with no orders',
}

export const mockCloseErrorAlreadyClosed = {
  code: 'ALREADY_CLOSED',
  message: 'Supply is already closed',
}

// =============================================================================
// Helper Functions
// =============================================================================

export function createMockStickerDocument(
  format: StickerFormat,
  supplyId: string = 'sup_123abc'
): SupplyDocument {
  const sizeMap: Record<StickerFormat, number> = {
    png: 245760,
    svg: 102400,
    zpl: 15360,
  }

  return {
    type: 'sticker',
    format,
    generatedAt: new Date().toISOString(),
    downloadUrl: `/v1/supplies/${supplyId}/documents/sticker`,
    sizeBytes: sizeMap[format],
  }
}

export function createMockGenerateResponse(format: StickerFormat): GenerateStickersResponse {
  const document = createMockStickerDocument(format)

  if (format === 'zpl') {
    return { document, message: 'Stickers generated successfully' }
  }

  const dataMap: Record<'png' | 'svg', string> = {
    png: MOCK_PNG_BASE64,
    svg: MOCK_SVG_BASE64,
  }

  return {
    document,
    data: dataMap[format],
    message: 'Stickers generated successfully',
  }
}
