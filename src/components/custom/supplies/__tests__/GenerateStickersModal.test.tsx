/**
 * Unit Tests for GenerateStickersModal component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Coverage: modal open/close, format selector, preview area (PNG/SVG/ZPL),
 * download flow, loading states, error handling, accessibility, cache invalidation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { mockToast, mockGenerateStickersFn, mockDownloadDocumentFn } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
  mockGenerateStickersFn: vi.fn(),
  mockDownloadDocumentFn: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: mockToast }))
vi.mock('@/lib/api/supplies', () => ({
  generateStickers: (...args: unknown[]) => mockGenerateStickersFn(...args),
  suppliesQueryKeys: {
    all: ['supplies'],
    detail: (id: string) => ['supplies', 'detail', id],
    documents: (id: string) => ['supplies', 'documents', id],
  },
}))
vi.mock('@/hooks/useDownloadDocument', () => ({
  useDownloadDocument: () => ({ mutateAsync: mockDownloadDocumentFn, isPending: false }),
}))

import { GenerateStickersModal } from '../GenerateStickersModal'
import {
  mockGenerateResponsePng,
  mockGenerateResponseSvg,
  mockGenerateResponseZpl,
} from '@/test/fixtures/stickers'

function createTestQC(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderWithQC(ui: React.ReactElement, qc?: QueryClient): ReturnType<typeof render> {
  const client = qc ?? createTestQC()
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function pendingPromise(): Promise<unknown> {
  return new Promise(() => {})
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('GenerateStickersModal', () => {
  const defaultProps = { open: true, onOpenChange: vi.fn(), supplyId: 'sup_123abc' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateStickersFn.mockResolvedValue(mockGenerateResponsePng)
    mockDownloadDocumentFn.mockImplementation(async () => {
      mockToast.success('Стикеры скачаны')
      return {
        blob: new Blob(['story-162-4-sticker'], { type: 'image/png' }),
        filename: 'stickers-sup_123abc.png',
      }
    })
  })

  // ==========================================================================
  // 1. Modal Open/Close
  // ==========================================================================

  describe('Modal Open/Close', () => {
    it('renders modal when open is true', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render modal content when open is false', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} open={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('calls onOpenChange(false) when cancel button clicked', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByRole('button', { name: 'Отмена' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) when X button clicked', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByRole('button', { name: 'Закрыть' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) when Escape key pressed', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.keyboard('{Escape}')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) after successful download', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(mockDownloadDocumentFn).toHaveBeenCalledOnce())
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('does not close when clicking inside modal content', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByText('Генерация стикеров'))
      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // 2. Modal Title & Structure
  // ==========================================================================

  describe('Modal Title & Structure', () => {
    it('displays title, close button, format selector, preview, and footer', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      expect(screen.getByText('Генерация стикеров')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument()
      expect(screen.getByText('Выберите формат:')).toBeInTheDocument()
      expect(screen.getByText('Превью будет доступно после генерации')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /скачать/i })).toBeInTheDocument()
    })

    it('title has proper heading level (h2)', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      const heading = screen.getByRole('heading', { name: 'Генерация стикеров' })
      expect(heading.tagName).toBe('H2')
    })
  })

  // ==========================================================================
  // 3. Format Selector
  // ==========================================================================

  describe('Format Selector', () => {
    it('renders radio group with PNG selected by default', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /PNG/i })).toBeChecked()
      expect(screen.getByRole('radio', { name: /SVG/i })).not.toBeChecked()
      expect(screen.getByRole('radio', { name: /ZPL/i })).not.toBeChecked()
    })

    it('handles format change and updates preview for ZPL', async () => {
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      expect(screen.getByText('Превью будет доступно после генерации')).toBeInTheDocument()
      await user.click(screen.getByRole('radio', { name: /ZPL/i }))
      expect(screen.getByText('Предпросмотр ZPL недоступен.')).toBeInTheDocument()
    })

    it('selector is disabled during loading', async () => {
      mockGenerateStickersFn.mockReturnValue(pendingPromise())
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => {
        screen.getAllByRole('radio').forEach(r => expect(r).toBeDisabled())
      })
    })
  })

  // ==========================================================================
  // 4. Preview Area (PNG / SVG / ZPL)
  // ==========================================================================

  describe('Preview Area', () => {
    it('shows placeholder before generation for PNG', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      expect(screen.getByText('Превью будет доступно после генерации')).toBeInTheDocument()
    })

    it('shows loading skeleton while generating', async () => {
      mockGenerateStickersFn.mockReturnValue(pendingPromise())
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(screen.queryByLabelText('Загрузка превью')).toBeInTheDocument())
    })

    it('shows info message for ZPL without preview or skeleton', async () => {
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('radio', { name: /ZPL/i }))
      expect(screen.getByText('Предпросмотр ZPL недоступен.')).toBeInTheDocument()
      expect(
        screen.getByText('Этот формат предназначен для термопринтеров Zebra.')
      ).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Загрузка превью')).not.toBeInTheDocument()
    })

    it('ZPL info area has blue background styling', async () => {
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('radio', { name: /ZPL/i }))
      const infoText = screen.getByText('Предпросмотр ZPL недоступен.')
      expect(infoText.closest('div[class*="bg-blue"]')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // 5. Buttons (Cancel & Download)
  // ==========================================================================

  describe('Buttons', () => {
    it('cancel has outline styling and is enabled by default', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      expect(cancelBtn.className).toMatch(/border/)
      expect(cancelBtn).toBeEnabled()
    })

    it('download is enabled by default with SVG icon', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      const btn = screen.getByRole('button', { name: /скачать/i })
      expect(btn).toBeEnabled()
      expect(btn.textContent).toContain('Скачать')
      expect(btn.querySelector('svg')).toBeInTheDocument()
    })

    it('clicking download triggers generate mutation with current format', async () => {
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      expect(mockGenerateStickersFn).toHaveBeenCalledWith('sup_123abc', 'png')
    })

    it('cancel is disabled during loading', async () => {
      mockGenerateStickersFn.mockReturnValue(pendingPromise())
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled())
    })
  })

  // ==========================================================================
  // 6. Generate Mutation (format passthrough)
  // ==========================================================================

  describe('Generate Mutation', () => {
    it('passes "png" by default, "svg" when SVG selected, "zpl" when ZPL selected', async () => {
      mockGenerateStickersFn.mockResolvedValue(mockGenerateResponseSvg)
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)

      // Default PNG
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      expect(mockGenerateStickersFn).toHaveBeenCalledWith('sup_123abc', 'png')

      // SVG
      await user.click(screen.getByRole('radio', { name: /SVG/i }))
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      expect(mockGenerateStickersFn).toHaveBeenCalledWith('sup_123abc', 'svg')

      // ZPL
      mockGenerateStickersFn.mockResolvedValue(mockGenerateResponseZpl)
      await user.click(screen.getByRole('radio', { name: /ZPL/i }))
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      expect(mockGenerateStickersFn).toHaveBeenCalledWith('sup_123abc', 'zpl')
    })
  })

  // ==========================================================================
  // 7. Loading State
  // ==========================================================================

  describe('Loading State', () => {
    beforeEach(() => {
      mockGenerateStickersFn.mockReturnValue(pendingPromise())
    })

    it('shows spinner and "Генерация..." text, disables buttons and selector', async () => {
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /генерация/i })
        expect(btn.querySelector('svg.animate-spin')).toBeInTheDocument()
        expect(btn).toBeDisabled()
      })
      expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
      screen.getAllByRole('radio').forEach(r => expect(r).toBeDisabled())
    })

    it('prevents modal close during loading', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      const cancelBtn = await screen.findByRole('button', { name: 'Отмена' })
      expect(cancelBtn).toBeDisabled()
      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // 8. Download Flow
  // ==========================================================================

  describe('Download Flow', () => {
    it('downloads the generated sticker through the document endpoint before closing', async () => {
      const onOpenChange = vi.fn()
      mockGenerateStickersFn.mockResolvedValue({
        id: 'story-162-4-sticker-document',
        docType: 'STICKER',
        format: 'png',
        fileSize: 19,
        generatedAt: '2026-08-05T13:05:00.000Z',
      })
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)

      await user.click(screen.getByRole('button', { name: /скачать/i }))

      await waitFor(() => {
        expect(mockDownloadDocumentFn).toHaveBeenCalledWith({
          supplyId: 'sup_123abc',
          docType: 'sticker',
          format: 'png',
          filename: 'stickers-sup_123abc.png',
        })
      })
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('does not close until the binary download has completed', async () => {
      const onOpenChange = vi.fn()
      const pendingDownload = deferred<{ blob: Blob; filename: string }>()
      mockDownloadDocumentFn.mockReturnValueOnce(pendingDownload.promise)
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)

      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(mockDownloadDocumentFn).toHaveBeenCalledOnce())
      expect(onOpenChange).not.toHaveBeenCalledWith(false)

      pendingDownload.resolve({
        blob: new Blob(['story-162-4-sticker'], { type: 'image/png' }),
        filename: 'stickers-sup_123abc.png',
      })
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it('downloads PNG as a blob, shows toast, and closes modal', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => {
        expect(mockDownloadDocumentFn).toHaveBeenCalledWith({
          supplyId: 'sup_123abc',
          docType: 'sticker',
          format: 'png',
          filename: 'stickers-sup_123abc.png',
        })
        expect(mockToast.success).toHaveBeenCalledWith('Стикеры скачаны')
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('downloads SVG with correct extension when SVG selected', async () => {
      mockGenerateStickersFn.mockResolvedValue(mockGenerateResponseSvg)
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('radio', { name: /SVG/i }))
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() =>
        expect(mockDownloadDocumentFn).toHaveBeenCalledWith({
          supplyId: 'sup_123abc',
          docType: 'sticker',
          format: 'svg',
          filename: 'stickers-sup_123abc.svg',
        })
      )
    })

    it('downloads the backend zplv result with a frontend .zpl filename', async () => {
      mockGenerateStickersFn.mockResolvedValue(mockGenerateResponseZpl)
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('radio', { name: /ZPL/i }))
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => {
        expect(mockDownloadDocumentFn).toHaveBeenCalledWith({
          supplyId: 'sup_123abc',
          docType: 'sticker',
          format: 'zpl',
          filename: 'stickers-sup_123abc.zpl',
        })
        expect(mockToast.success).toHaveBeenCalledWith('Стикеры скачаны')
      })
    })

    it('keeps the modal open when the binary download fails', async () => {
      const onOpenChange = vi.fn()
      mockDownloadDocumentFn.mockImplementationOnce(async () => {
        mockToast.error('Документ не найден')
        throw new Error('Document not found')
      })
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)

      await user.click(screen.getByRole('button', { name: /скачать/i }))

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Документ не найден'))
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
      expect(screen.getByRole('dialog')).toBeVisible()
    })
  })

  // ==========================================================================
  // 9. Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('shows error toast with specific messages for INVALID_FORMAT and WRONG_STATUS', async () => {
      const user = userEvent.setup()

      // INVALID_FORMAT
      const fmtError = new Error('Invalid format')
      Object.assign(fmtError, { code: 'INVALID_FORMAT' })
      mockGenerateStickersFn.mockRejectedValueOnce(fmtError)
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Неверный формат стикеров'))

      // WRONG_STATUS
      const statusError = new Error('Wrong status')
      Object.assign(statusError, { code: 'WRONG_STATUS' })
      mockGenerateStickersFn.mockRejectedValueOnce(statusError)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() =>
        expect(mockToast.error).toHaveBeenCalledWith(
          'Стикеры доступны только для закрытых поставок'
        )
      )
    })

    it('shows generic error message for unknown errors', async () => {
      const error = new Error('Unknown failure')
      mockGenerateStickersFn.mockRejectedValueOnce(error)
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Unknown failure'))
    })

    it('modal remains open and buttons re-enabled after error', async () => {
      const onOpenChange = vi.fn()
      mockGenerateStickersFn.mockRejectedValueOnce(new Error('fail'))
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
      expect(screen.getByRole('button', { name: /скачать/i })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Отмена' })).toBeEnabled()
    })

    it('user can retry after error', async () => {
      mockGenerateStickersFn
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(mockGenerateResponsePng)
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(mockGenerateStickersFn).toHaveBeenCalledTimes(2))
      expect(mockToast.success).toHaveBeenCalledWith('Стикеры скачаны')
    })
  })

  // ==========================================================================
  // 10. Cache Invalidation
  // ==========================================================================

  describe('Cache Invalidation', () => {
    it('invalidates detail and documents queries after success', async () => {
      const qc = createTestQC()
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />, qc)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(2))
      const keys = invalidateSpy.mock.calls.map(c => c[0]!.queryKey)
      expect(keys).toContainEqual(['supplies', 'detail', 'sup_123abc'])
      expect(keys).toContainEqual(['supplies', 'documents', 'sup_123abc'])
    })
  })

  // ==========================================================================
  // 11. Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('has role="dialog" with aria-modal or data-state', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      const hasModal =
        dialog.getAttribute('aria-modal') === 'true' || dialog.hasAttribute('data-state')
      expect(hasModal).toBe(true)
    })

    it('has aria-labelledby pointing to title element', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      const labelledBy = dialog.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      const labelledEl = document.getElementById(labelledBy!)
      expect(labelledEl?.textContent).toContain('Генерация стикеров')
    })

    it('contains focusable buttons inside dialog', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      const focusable = within(screen.getByRole('dialog')).getAllByRole('button')
      expect(focusable.length).toBeGreaterThanOrEqual(2)
    })

    it('radio buttons are keyboard navigable with proper role', () => {
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      const radios = screen.getAllByRole('radio')
      expect(radios.length).toBe(3)
      radios.forEach(r => expect(r).toHaveAttribute('role', 'radio'))
    })

    it('loading skeleton has accessible label', async () => {
      mockGenerateStickersFn.mockReturnValue(pendingPromise())
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /скачать/i }))
      await waitFor(() => expect(screen.queryByLabelText('Загрузка превью')).toBeInTheDocument())
    })

    it('ZPL info icon has aria-hidden="true"', async () => {
      const user = userEvent.setup()
      renderWithQC(<GenerateStickersModal {...defaultProps} />)
      await user.click(screen.getByRole('radio', { name: /ZPL/i }))
      const zplContainer = screen.getByText('Предпросмотр ZPL недоступен.').closest('div')
      const svg = zplContainer?.parentElement?.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
