/**
 * Tests for Supplies API Client - Documents & Stickers
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests: generateStickers, downloadDocument
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateStickers, downloadDocument } from '../supplies-documents'
import { apiClient } from '@/lib/api-client'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

const createApiError = (status: number, message: string) => {
  const err = new Error(message)
  Object.assign(err, { response: { status, data: { message } } })
  return err
}

describe('generateStickers()', () => {
  const mockResponse = {
    document: {
      type: 'sticker',
      format: 'png',
      generatedAt: '2026-01-16T09:00:00.000Z',
      downloadUrl: '/v1/supplies/supply-001/documents/sticker',
      sizeBytes: 245760,
    },
    data: 'base64data',
    message: 'Stickers generated successfully',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse)
  })

  describe('basic functionality', () => {
    it('should call POST /v1/supplies/:id/stickers endpoint', async () => {
      await generateStickers('supply-001')
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/supplies/supply-001/stickers',
        expect.objectContaining({ format: 'png' })
      )
    })

    it('should return GenerateStickersResponse structure', async () => {
      const result = await generateStickers('supply-001')
      expect(result).toHaveProperty('document')
      expect(result).toHaveProperty('message')
    })

    it('should include document in response', async () => {
      const result = await generateStickers('supply-001')
      expect(result.document).toBeDefined()
      expect(result.document.type).toBe('sticker')
    })

    it('should include message in response', async () => {
      const result = await generateStickers('supply-001')
      expect(typeof result.message).toBe('string')
      expect(result.message.length).toBeGreaterThan(0)
    })
  })

  describe('request handling', () => {
    it('should pass supply ID in URL path', async () => {
      await generateStickers('supply-42')
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/supplies/supply-42/stickers',
        expect.anything()
      )
    })

    it('should send format in request body', async () => {
      await generateStickers('supply-001', 'svg')
      expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), { format: 'svg' })
    })

    it('should default to png format when not specified', async () => {
      await generateStickers('supply-001')
      expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), { format: 'png' })
    })
  })

  describe('PNG format', () => {
    it('should accept png format', async () => {
      const result = await generateStickers('supply-001', 'png')
      expect(result.document.format).toBe('png')
    })

    it('should return base64 data for PNG', async () => {
      const result = await generateStickers('supply-001', 'png')
      expect(result.data).toBeDefined()
      expect(typeof result.data).toBe('string')
    })

    it('should return document with png format', async () => {
      const result = await generateStickers('supply-001', 'png')
      expect(result.document.format).toBe('png')
    })

    it('should return document with sticker type', async () => {
      const result = await generateStickers('supply-001', 'png')
      expect(result.document.type).toBe('sticker')
    })
  })

  describe('SVG format', () => {
    it('should accept svg format', async () => {
      const svgResp = {
        ...mockResponse,
        document: { ...mockResponse.document, format: 'svg' },
        data: 'svgdata',
      }
      vi.mocked(apiClient.post).mockResolvedValue(svgResp)
      const result = await generateStickers('supply-001', 'svg')
      expect(result.document.format).toBe('svg')
    })

    it('should return base64 data for SVG', async () => {
      const svgResp = {
        ...mockResponse,
        document: { ...mockResponse.document, format: 'svg' },
        data: 'svgdata',
      }
      vi.mocked(apiClient.post).mockResolvedValue(svgResp)
      const result = await generateStickers('supply-001', 'svg')
      expect(result.data).toBeDefined()
    })

    it('should return document with svg format', async () => {
      const svgResp = {
        ...mockResponse,
        document: { ...mockResponse.document, format: 'svg' },
        data: 'svgdata',
      }
      vi.mocked(apiClient.post).mockResolvedValue(svgResp)
      const result = await generateStickers('supply-001', 'svg')
      expect(result.document.format).toBe('svg')
    })
  })

  describe('ZPL format', () => {
    it('should accept zpl format', async () => {
      const zplResp = { ...mockResponse, document: { ...mockResponse.document, format: 'zpl' } }
      vi.mocked(apiClient.post).mockResolvedValue(zplResp)
      const result = await generateStickers('supply-001', 'zpl')
      expect(result.document.format).toBe('zpl')
    })

    it('should NOT return data for ZPL (download only)', async () => {
      const zplResp = { ...mockResponse, document: { ...mockResponse.document, format: 'zpl' } }
      delete (zplResp as Record<string, unknown>).data
      vi.mocked(apiClient.post).mockResolvedValue(zplResp)
      const result = await generateStickers('supply-001', 'zpl')
      expect(result.data).toBeUndefined()
    })

    it('should return document with zpl format', async () => {
      const zplResp = { ...mockResponse, document: { ...mockResponse.document, format: 'zpl' } }
      vi.mocked(apiClient.post).mockResolvedValue(zplResp)
      const result = await generateStickers('supply-001', 'zpl')
      expect(result.document.format).toBe('zpl')
    })
  })

  describe('document structure', () => {
    it('should return type as sticker', async () => {
      const result = await generateStickers('supply-001')
      expect(result.document.type).toBe('sticker')
    })

    it('should return format matching request', async () => {
      const svgResp = { ...mockResponse, document: { ...mockResponse.document, format: 'svg' } }
      vi.mocked(apiClient.post).mockResolvedValue(svgResp)
      const result = await generateStickers('supply-001', 'svg')
      expect(result.document.format).toBe('svg')
    })

    it('should return generatedAt timestamp', async () => {
      const result = await generateStickers('supply-001')
      expect(result.document.generatedAt).toBeDefined()
      expect(typeof result.document.generatedAt).toBe('string')
    })

    it('should return downloadUrl', async () => {
      const result = await generateStickers('supply-001')
      expect(result.document.downloadUrl).toBeDefined()
      expect(result.document.downloadUrl.length).toBeGreaterThan(0)
    })
  })

  describe('console logging', () => {
    it('should log supply ID and format', async () => {
      const { logger } = await import('@/lib/logger')
      await generateStickers('supply-001', 'png')
      expect(logger.debug).toHaveBeenCalled()
    })

    it('should log generated document type', async () => {
      const { logger } = await import('@/lib/logger')
      await generateStickers('supply-001')
      expect(logger.debug).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('should throw 400 for invalid format', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(createApiError(400, 'Invalid format'))
      await expect(generateStickers('supply-001')).rejects.toThrow()
    })

    it('should throw 403 when no access to supply', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(createApiError(403, 'Forbidden'))
      await expect(generateStickers('supply-001')).rejects.toThrow()
    })

    it('should throw 404 when supply not found', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(createApiError(404, 'Not found'))
      await expect(generateStickers('supply-001')).rejects.toThrow()
    })

    it('should throw 409 when supply is not CLOSED', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(createApiError(409, 'Supply is not CLOSED'))
      await expect(generateStickers('supply-001')).rejects.toThrow()
    })
  })
})

// =============================================================================
// SECTION 2: downloadDocument() Tests
// =============================================================================

describe('downloadDocument()', () => {
  const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(mockBlob)
  })

  describe('basic functionality', () => {
    it('should call GET /v1/supplies/:id/documents/:type endpoint', async () => {
      await downloadDocument('supply-001', 'sticker')
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/supplies/supply-001/documents/sticker',
        expect.objectContaining({ skipDataUnwrap: true })
      )
    })

    it('should return Blob response', async () => {
      const result = await downloadDocument('supply-001', 'sticker')
      expect(result).toBeInstanceOf(Blob)
    })

    it('should use responseType blob option', async () => {
      await downloadDocument('supply-001', 'sticker')
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skipDataUnwrap: true })
      )
    })

    it('should skip data unwrapping', async () => {
      await downloadDocument('supply-001', 'sticker')
      const callArgs = vi.mocked(apiClient.get).mock.calls[0]
      expect(callArgs[1]).toEqual(expect.objectContaining({ skipDataUnwrap: true }))
    })
  })

  describe('URL construction', () => {
    it('should pass supply ID in URL path', async () => {
      await downloadDocument('supply-42', 'sticker')
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/supplies/supply-42/documents/sticker',
        expect.anything()
      )
    })

    it('should pass document type in URL path', async () => {
      await downloadDocument('supply-001', 'barcode')
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/supplies/supply-001/documents/barcode',
        expect.anything()
      )
    })

    it('should handle sticker document type', async () => {
      await downloadDocument('supply-001', 'sticker')
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/documents/sticker'),
        expect.anything()
      )
    })

    it('should handle barcode document type', async () => {
      await downloadDocument('supply-001', 'barcode')
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/documents/barcode'),
        expect.anything()
      )
    })

    it('should handle acceptance_act document type', async () => {
      await downloadDocument('supply-001', 'acceptance_act')
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/documents/acceptance_act'),
        expect.anything()
      )
    })
  })

  describe('sticker download', () => {
    it('should download sticker as Blob', async () => {
      const result = await downloadDocument('supply-001', 'sticker')
      expect(result).toBeInstanceOf(Blob)
    })

    it('should return correct content type for PNG', async () => {
      const pngBlob = new Blob(['png data'], { type: 'image/png' })
      vi.mocked(apiClient.get).mockResolvedValue(pngBlob)
      const result = await downloadDocument('supply-001', 'sticker')
      expect(result.type).toBe('image/png')
    })

    it('should return correct content type for SVG', async () => {
      const svgBlob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' })
      vi.mocked(apiClient.get).mockResolvedValue(svgBlob)
      const result = await downloadDocument('supply-001', 'sticker')
      expect(result.type).toBe('image/svg+xml')
    })

    it('should return correct content type for ZPL', async () => {
      const zplBlob = new Blob(['ZPL data'], { type: 'application/x-zpl' })
      vi.mocked(apiClient.get).mockResolvedValue(zplBlob)
      const result = await downloadDocument('supply-001', 'sticker')
      expect(result.type).toBe('application/x-zpl')
    })
  })

  describe('barcode download', () => {
    it('should download barcode as Blob', async () => {
      const result = await downloadDocument('supply-001', 'barcode')
      expect(result).toBeInstanceOf(Blob)
    })

    it('should return image/png content type', async () => {
      const barcodeBlob = new Blob(['barcode'], { type: 'image/png' })
      vi.mocked(apiClient.get).mockResolvedValue(barcodeBlob)
      const result = await downloadDocument('supply-001', 'barcode')
      expect(result.type).toBe('image/png')
    })
  })

  describe('acceptance act download', () => {
    it('should download acceptance_act as Blob', async () => {
      const result = await downloadDocument('supply-001', 'acceptance_act')
      expect(result).toBeInstanceOf(Blob)
    })

    it('should return application/pdf content type', async () => {
      const pdfBlob = new Blob(['pdf'], { type: 'application/pdf' })
      vi.mocked(apiClient.get).mockResolvedValue(pdfBlob)
      const result = await downloadDocument('supply-001', 'acceptance_act')
      expect(result.type).toBe('application/pdf')
    })
  })

  describe('console logging', () => {
    it('should log supply ID and document type', async () => {
      const { logger } = await import('@/lib/logger')
      await downloadDocument('supply-001', 'sticker')
      expect(logger.debug).toHaveBeenCalled()
    })

    it('should log download completion', async () => {
      const { logger } = await import('@/lib/logger')
      await downloadDocument('supply-001', 'sticker')
      expect(logger.debug).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('should throw 403 when no access to supply', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(createApiError(403, 'Forbidden'))
      await expect(downloadDocument('supply-001', 'sticker')).rejects.toThrow()
    })

    it('should throw 404 when supply not found', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(createApiError(404, 'Not found'))
      await expect(downloadDocument('supply-001', 'sticker')).rejects.toThrow()
    })

    it('should throw 404 when document not found', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        createApiError(404, 'Document not found')
      )
      await expect(downloadDocument('supply-001', 'sticker')).rejects.toThrow()
    })
  })
})
