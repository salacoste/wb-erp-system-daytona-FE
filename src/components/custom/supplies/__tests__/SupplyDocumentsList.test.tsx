/**
 * Unit Tests for SupplyDocumentsList component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Lists generated documents
 * - Shows document type, format, generated date
 * - Download button
 * - Empty state (no documents yet)
 * - File size formatting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SupplyDocumentsList, useSupplyDocumentDownload } from '../SupplyDocumentsList'
import {
  mockStickerDocumentPng,
  mockStickerDocumentSvg,
  mockStickerDocumentZpl,
  mockBarcodeDocument,
  mockAcceptanceActDocument,
  mockDocumentNoSize,
} from '@/test/fixtures/supplies'
import {
  mockSupplyClosed,
  mockSupplyDelivering,
  mockSupplyDelivered,
} from '@/test/fixtures/supplies-responses'
import type { SupplyDocument } from '@/types/supplies'

const { mockDownloadSupplyDocument, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockDownloadSupplyDocument: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}))

vi.mock('@/lib/api/supplies', () => ({
  downloadDocument: mockDownloadSupplyDocument,
}))

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

const mockDocuments = [mockStickerDocumentPng, mockBarcodeDocument, mockAcceptanceActDocument]

function renderDocs(overrides: Partial<Parameters<typeof SupplyDocumentsList>[0]> = {}) {
  const props = {
    supplyId: 'supply-001',
    documents: mockDocuments,
    onDownload: vi.fn(),
    isDownloading: false,
    downloadingType: undefined as string | undefined,
    ...overrides,
  }
  const result = renderWithProviders(<SupplyDocumentsList {...props} />)
  return { ...result, props }
}

describe('SupplyDocumentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // 1. List Rendering Tests (AC7)
  // ===========================================================================

  describe('List Rendering', () => {
    it('renders list of documents', () => {
      renderDocs()
      expect(screen.getByText('Документы')).toBeInTheDocument()
    })

    it('renders correct number of document items', () => {
      renderDocs()
      const downloadButtons = screen.getAllByText('Скачать')
      expect(downloadButtons).toHaveLength(3)
    })

    it('renders document items in a list structure', () => {
      renderDocs()
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })

    it('section has heading "Документы"', () => {
      renderDocs()
      expect(screen.getByRole('heading', { level: 2, name: 'Документы' })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 2. Document Item Display Tests (AC7)
  // ===========================================================================

  describe('Document Item Display', () => {
    it('displays document name/type (e.g., "Стикеры (PNG)")', () => {
      renderDocs()
      expect(screen.getByText(/Стикеры \(PNG\)/)).toBeInTheDocument()
    })

    it('displays format (png, svg, zpl, pdf)', () => {
      renderDocs()
      expect(screen.getAllByText(/PNG/).length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText(/PDF/)).toBeInTheDocument()
    })

    it('displays file size formatted (KB, MB)', () => {
      renderDocs()
      // mockStickerDocumentPng has sizeBytes: 245760 -> 240 КБ
      expect(screen.getByText(/240 КБ/)).toBeInTheDocument()
    })

    it('displays "—" when file size is null', () => {
      renderDocs({ documents: [mockDocumentNoSize] })
      expect(screen.getByText(/—/)).toBeInTheDocument()
    })

    it('displays generated date formatted', () => {
      renderDocs()
      // Date is rendered as formatted text with middot separator
      const separators = screen.getAllByText(/·/)
      expect(separators.length).toBeGreaterThanOrEqual(3)
    })

    it('shows appropriate icon for document type', () => {
      const { container } = renderDocs()
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // 3. Document Type Labels Tests
  // ===========================================================================

  describe('Document Type Labels', () => {
    it('sticker type shows "Стикеры"', () => {
      renderDocs()
      expect(screen.getByText(/Стикеры/)).toBeInTheDocument()
    })

    it('barcode type shows "Штрихкоды"', () => {
      renderDocs()
      expect(screen.getByText(/Штрихкоды/)).toBeInTheDocument()
    })

    it('acceptance_act type shows "Акт приёмки"', () => {
      renderDocs()
      expect(screen.getByText(/Акт приёмки/)).toBeInTheDocument()
    })

    it('format shown in parentheses (e.g., "Стикеры (PNG)")', () => {
      renderDocs()
      expect(screen.getByText(/Стикеры \(PNG\)/)).toBeInTheDocument()
    })

    it('format is uppercase', () => {
      renderDocs()
      // All format labels use uppercase in parentheses
      expect(screen.getByText(/Штрихкоды \(PNG\)/)).toBeInTheDocument()
      expect(screen.getByText(/Акт приёмки \(PDF\)/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 4. Download Button Tests (AC7)
  // ===========================================================================

  describe('Download Button', () => {
    it('each document row has download button', () => {
      renderDocs()
      const downloadButtons = screen.getAllByText('Скачать')
      expect(downloadButtons).toHaveLength(3)
    })

    it('download button labeled "Скачать"', () => {
      renderDocs()
      expect(screen.getAllByText('Скачать').length).toBeGreaterThan(0)
    })

    it('download button has download icon', () => {
      renderDocs()
      const buttons = screen.getAllByText('Скачать')
      for (const btn of buttons) {
        const svg = btn.closest('button')?.querySelector('svg')
        expect(svg).toBeInTheDocument()
      }
    })

    it('clicking download button calls onDownload with supplyId and docType', async () => {
      const user = userEvent.setup()
      const { props } = renderDocs()
      const downloadButtons = screen.getAllByRole('button', { name: /Скачать/ })
      await user.click(downloadButtons[0])
      expect(props.onDownload).toHaveBeenCalledWith('sticker', 'sticker-png.png')
    })

    it('download button disabled while downloading', () => {
      renderDocs({ isDownloading: true })
      const buttons = screen.getAllByRole('button', { name: /Скачать/ })
      buttons.forEach(btn => {
        expect(btn).toBeDisabled()
      })
    })

    it('shows loading spinner during download of specific type', () => {
      renderDocs({ isDownloading: true, downloadingType: 'sticker' })
      // The downloading item shows Loader2 spinner
      const buttons = screen.getAllByRole('button')
      const downloadingBtn = buttons.find(b => b.querySelector('.animate-spin'))
      expect(downloadingBtn).toBeTruthy()
    })
  })

  describe('Download Controller', () => {
    it('downloads the requested document and cleans up its blob URL', async () => {
      const blob = new Blob(['document'], { type: 'application/pdf' })
      const announce = vi.fn()
      const createObjectURL = vi.fn().mockReturnValue('blob:supply-document')
      const revokeObjectURL = vi.fn()
      Object.defineProperties(URL, {
        createObjectURL: { configurable: true, value: createObjectURL },
        revokeObjectURL: { configurable: true, value: revokeObjectURL },
      })
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      mockDownloadSupplyDocument.mockResolvedValue(blob)
      const { result } = renderHook(() => useSupplyDocumentDownload('supply-42', announce))

      await act(async () => {
        await result.current.downloadDocument('acceptance_act', 'acceptance-act-42.xlsx')
      })

      expect(mockDownloadSupplyDocument).toHaveBeenCalledWith('supply-42', 'acceptance_act')
      expect(createObjectURL).toHaveBeenCalledWith(blob)
      const anchor = click.mock.instances[0] as HTMLAnchorElement
      expect(anchor.download).toBe('acceptance-act-42.xlsx')
      expect(anchor.href).toBe('blob:supply-document')
      expect(anchor).not.toBeInTheDocument()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:supply-document')
      expect(mockToastSuccess).toHaveBeenCalledWith('Документ скачан')
      expect(announce).toHaveBeenCalledWith('Документ скачан')
      expect(result.current.downloadingType).toBeUndefined()
    })

    it('announces API download failures and resets pending state', async () => {
      const announce = vi.fn()
      mockDownloadSupplyDocument.mockRejectedValue(new Error('download failed'))
      const { result } = renderHook(() => useSupplyDocumentDownload('supply-42', announce))

      await act(async () => {
        await result.current.downloadDocument('barcode', 'barcode.pdf')
      })

      expect(mockDownloadSupplyDocument).toHaveBeenCalledWith('supply-42', 'barcode')
      expect(mockToastError).toHaveBeenCalledWith('Не удалось скачать документ')
      expect(announce).toHaveBeenCalledWith('Не удалось скачать документ')
      expect(result.current.downloadingType).toBeUndefined()
    })
  })

  // ===========================================================================
  // 5. Empty State Tests (AC7)
  // ===========================================================================

  describe('Empty State', () => {
    it('shows empty state when documents array is empty', () => {
      renderDocs({ documents: [] })
      expect(screen.getByText('Документы ещё не сгенерированы')).toBeInTheDocument()
    })

    it('empty state message is "Документы ещё не сгенерированы"', () => {
      renderDocs({ documents: [] })
      expect(screen.getByText('Документы ещё не сгенерированы')).toBeInTheDocument()
    })

    it('empty state has appropriate icon', () => {
      const { container } = renderDocs({ documents: [] })
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('section heading still visible in empty state', () => {
      renderDocs({ documents: [] })
      expect(screen.getByText('Документы')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 6. File Size Formatting Tests
  // ===========================================================================

  describe('File Size Formatting', () => {
    it('formats bytes < 1024 as "N байт"', () => {
      const smallDoc: SupplyDocument = { ...mockStickerDocumentPng, sizeBytes: 512 }
      renderDocs({ documents: [smallDoc] })
      expect(screen.getByText(/512 байт/)).toBeInTheDocument()
    })

    it('formats KB correctly (e.g., "100 КБ")', () => {
      const kbDoc: SupplyDocument = { ...mockStickerDocumentPng, sizeBytes: 102400 }
      renderDocs({ documents: [kbDoc] })
      expect(screen.getByText(/100 КБ/)).toBeInTheDocument()
    })

    it('formats MB correctly (e.g., "1.2 МБ")', () => {
      const mbDoc: SupplyDocument = { ...mockStickerDocumentPng, sizeBytes: 1258291 }
      renderDocs({ documents: [mbDoc] })
      // 1258291 / 1048576 = 1.2
      expect(screen.getByText(/1\.2 МБ/)).toBeInTheDocument()
    })

    it('handles null sizeBytes gracefully', () => {
      renderDocs({ documents: [mockDocumentNoSize] })
      expect(screen.getByText(/—/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 7. Status Visibility Tests (AC7)
  // ===========================================================================

  describe('Status-Based Visibility', () => {
    it('component renders for CLOSED status documents', () => {
      renderDocs({ documents: mockSupplyClosed.documents })
      expect(screen.getByText('Документы')).toBeInTheDocument()
    })

    it('component renders for DELIVERING status documents', () => {
      renderDocs({ documents: mockSupplyDelivering.documents })
      expect(screen.getByText('Документы')).toBeInTheDocument()
    })

    it('component renders for DELIVERED status documents', () => {
      renderDocs({ documents: mockSupplyDelivered.documents })
      expect(screen.getByText('Документы')).toBeInTheDocument()
    })

    it('component renders empty state for empty documents', () => {
      renderDocs({ documents: [] })
      expect(screen.getByText('Документы ещё не сгенерированы')).toBeInTheDocument()
    })

    it('component does not crash for any document array', () => {
      expect(() => renderDocs({ documents: [] })).not.toThrow()
      expect(() => renderDocs({ documents: mockDocuments })).not.toThrow()
    })
  })

  // ===========================================================================
  // 8. Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('section has proper heading (h2)', () => {
      renderDocs()
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Документы')
    })

    it('download buttons have accessible labels', () => {
      renderDocs()
      const buttons = screen.getAllByRole('button')
      for (const btn of buttons) {
        expect(btn.getAttribute('aria-label')).toBeTruthy()
      }
    })

    it('list has proper list semantics', () => {
      renderDocs()
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('screen reader can identify download action', () => {
      renderDocs()
      const downloadBtns = screen.getAllByRole('button', { name: /Скачать/ })
      expect(downloadBtns.length).toBeGreaterThan(0)
    })

    it('focus management works on download buttons', () => {
      renderDocs()
      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        buttons[0].focus()
        expect(document.activeElement).toBe(buttons[0])
      }
    })
  })

  // ===========================================================================
  // TDD Verification Test
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have document fixtures ready', () => {
      expect(mockStickerDocumentPng).toBeDefined()
      expect(mockStickerDocumentPng.type).toBe('sticker')
      expect(mockStickerDocumentPng.format).toBe('png')
      expect(mockStickerDocumentSvg).toBeDefined()
      expect(mockStickerDocumentZpl).toBeDefined()
      expect(mockBarcodeDocument).toBeDefined()
      expect(mockBarcodeDocument.type).toBe('barcode')
      expect(mockAcceptanceActDocument).toBeDefined()
      expect(mockAcceptanceActDocument.type).toBe('acceptance_act')
    })

    it('should have document with null size', () => {
      expect(mockDocumentNoSize).toBeDefined()
      expect(mockDocumentNoSize.sizeBytes).toBeNull()
    })

    it('should have supplies with documents', () => {
      expect(mockSupplyClosed.documents).toBeDefined()
      expect(mockSupplyClosed.documents.length).toBeGreaterThan(0)
      expect(mockSupplyDelivering.documents).toBeDefined()
      expect(mockSupplyDelivered.documents).toBeDefined()
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(userEvent).toBeDefined()
      expect(renderWithProviders).toBeDefined()
    })
  })
})
