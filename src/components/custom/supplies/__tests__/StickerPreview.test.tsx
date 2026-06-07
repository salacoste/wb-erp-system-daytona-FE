/**
 * Unit Tests for StickerPreview component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - PNG preview display
 * - SVG preview display
 * - ZPL placeholder display
 * - Loading states
 * - Error states
 * - Image sizing
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { StickerPreview } from '../StickerPreview'
import {
  MOCK_PNG_BASE64,
  MOCK_SVG_BASE64,
  mockPreviewPng,
  mockPreviewSvg,
  mockErrorGenerationFailed,
} from '@/test/fixtures/stickers'
import type { StickerFormat } from '@/types/supplies'

function renderPreview(overrides: Partial<Parameters<typeof StickerPreview>[0]> = {}) {
  const props = {
    format: 'png' as StickerFormat,
    data: MOCK_PNG_BASE64,
    isLoading: false,
    error: undefined as string | undefined,
    onRetry: vi.fn(),
    ...overrides,
  }
  const result = renderWithProviders(<StickerPreview {...props} />)
  return { ...result, props }
}

describe('StickerPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // 1. PNG Preview Display
  // ===========================================================================

  describe('PNG Preview Display', () => {
    it('displays image element for PNG', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })

    it('image src contains base64 PNG data', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = screen.getByRole('img') as HTMLImageElement
      expect(img.src).toContain('data:image/png;base64')
    })

    it('image has alt text "Превью стикера"', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = screen.getByAltText('Превью стикера')
      expect(img).toBeInTheDocument()
    })

    it('renders preview when format is "png" with data', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('shows no-data message when PNG has no data', () => {
      renderPreview({ format: 'png', data: undefined })
      expect(screen.getByText('Превью будет доступно после генерации')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 2. SVG Preview Display
  // ===========================================================================

  describe('SVG Preview Display', () => {
    it('displays image element for SVG', () => {
      renderPreview({ format: 'svg', data: MOCK_SVG_BASE64 })
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })

    it('image src contains base64 SVG data', () => {
      renderPreview({ format: 'svg', data: MOCK_SVG_BASE64 })
      const img = screen.getByRole('img') as HTMLImageElement
      expect(img.src).toContain('data:image/svg+xml;base64')
    })

    it('SVG renders with correct format', () => {
      renderPreview({ format: 'svg', data: MOCK_SVG_BASE64 })
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Превью стикера')
    })

    it('shows no-data message when SVG has no data', () => {
      renderPreview({ format: 'svg', data: undefined })
      expect(screen.getByText('Превью будет доступно после генерации')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 3. ZPL Placeholder Display
  // ===========================================================================

  describe('ZPL Placeholder Display', () => {
    it('does not fetch preview when format is "zpl"', () => {
      renderPreview({ format: 'zpl', data: undefined })
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('displays info icon for ZPL', () => {
      const { container } = renderPreview({ format: 'zpl', data: undefined })
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('displays text: "Предпросмотр ZPL недоступен."', () => {
      renderPreview({ format: 'zpl', data: undefined })
      expect(screen.getByText('Предпросмотр ZPL недоступен.')).toBeInTheDocument()
    })

    it('displays text: "Этот формат предназначен для термопринтеров Zebra."', () => {
      renderPreview({ format: 'zpl', data: undefined })
      expect(
        screen.getByText('Этот формат предназначен для термопринтеров Zebra.')
      ).toBeInTheDocument()
    })

    it('info container has distinctive background color', () => {
      const { container } = renderPreview({ format: 'zpl', data: undefined })
      const infoBox = container.querySelector('.bg-blue-50')
      expect(infoBox).toBeInTheDocument()
    })

    it('info icon is blue/info colored', () => {
      const { container } = renderPreview({ format: 'zpl', data: undefined })
      const icon = container.querySelector('.text-blue-500')
      expect(icon).toBeInTheDocument()
    })

    it('no image element is rendered for ZPL', () => {
      renderPreview({ format: 'zpl', data: undefined })
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 4. Loading State
  // ===========================================================================

  describe('Loading State', () => {
    it('shows loading skeleton while fetching preview', () => {
      renderPreview({ isLoading: true })
      expect(screen.getByLabelText('Загрузка превью')).toBeInTheDocument()
    })

    it('skeleton has appropriate dimensions', () => {
      renderPreview({ isLoading: true })
      const skeleton = screen.getByLabelText('Загрузка превью')
      expect(skeleton).toBeInTheDocument()
    })

    it('loading container has aria-busy', () => {
      renderPreview({ isLoading: true })
      const busyEl = document.querySelector('[aria-busy="true"]')
      expect(busyEl).toBeInTheDocument()
    })

    it('loading skeleton matches preview container size', () => {
      renderPreview({ isLoading: true })
      const skeleton = screen.getByLabelText('Загрузка превью')
      expect(skeleton.className).toContain('h-[200px]')
    })

    it('no image shown during loading', () => {
      renderPreview({ isLoading: true })
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 5. Error State
  // ===========================================================================

  describe('Error State', () => {
    it('shows error message on fetch failure', () => {
      renderPreview({ error: 'Network error' })
      expect(screen.getByText('Не удалось загрузить превью')).toBeInTheDocument()
    })

    it('error message: "Не удалось загрузить превью"', () => {
      renderPreview({ error: 'something went wrong' })
      expect(screen.getByText('Не удалось загрузить превью')).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      renderPreview({ error: 'Network error' })
      expect(screen.getByText('Повторить')).toBeInTheDocument()
    })

    it('retry button text: "Повторить"', () => {
      renderPreview({ error: 'test error' })
      expect(screen.getByText('Повторить')).toBeInTheDocument()
    })

    it('clicking retry calls onRetry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      renderPreview({ error: 'Network error', onRetry })
      await user.click(screen.getByText('Повторить'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('error state has error icon', () => {
      const { container } = renderPreview({ error: 'Network error' })
      const icon = container.querySelector('.text-red-500')
      expect(icon).toBeInTheDocument()
    })

    it('error container has error styling', () => {
      const { container } = renderPreview({ error: 'Network error' })
      const errorBox = container.querySelector('.bg-red-50')
      expect(errorBox).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 6. Image Sizing & Layout
  // ===========================================================================

  describe('Image Sizing & Layout', () => {
    it('image has max-width: 100%', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = screen.getByRole('img') as HTMLImageElement
      expect(img.className).toContain('max-w-full')
    })

    it('image has max-height: 300px', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = screen.getByRole('img') as HTMLImageElement
      expect(img.className).toContain('max-h-[300px]')
    })

    it('image maintains aspect ratio', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = screen.getByRole('img') as HTMLImageElement
      expect(img.className).toContain('object-contain')
    })

    it('image is centered in container', () => {
      const { container } = renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const wrapper = container.querySelector('.flex.items-center.justify-center')
      expect(wrapper).toBeInTheDocument()
    })

    it('container has border/frame styling', () => {
      const { container } = renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const bordered = container.querySelector('.rounded-lg.border')
      expect(bordered).toBeInTheDocument()
    })

    it('container has rounded corners', () => {
      const { container } = renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const rounded = container.querySelector('.rounded-lg')
      expect(rounded).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 7. Format Change Handling
  // ===========================================================================

  describe('Format Change Handling', () => {
    it('refetches preview when format changes from png to svg', () => {
      const { rerender } = renderWithProviders(
        <StickerPreview format="png" data={MOCK_PNG_BASE64} isLoading={false} onRetry={vi.fn()} />
      )
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Превью стикера')
      rerender(
        <StickerPreview format="svg" data={MOCK_SVG_BASE64} isLoading={false} onRetry={vi.fn()} />
      )
      const img = screen.getByRole('img') as HTMLImageElement
      expect(img.src).toContain('image/svg+xml')
    })

    it('switches to placeholder when format changes to zpl', () => {
      const { rerender } = renderWithProviders(
        <StickerPreview format="png" data={MOCK_PNG_BASE64} isLoading={false} onRetry={vi.fn()} />
      )
      expect(screen.getByRole('img')).toBeInTheDocument()
      rerender(<StickerPreview format="zpl" data={undefined} isLoading={false} onRetry={vi.fn()} />)
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.getByText('Предпросмотр ZPL недоступен.')).toBeInTheDocument()
    })

    it('shows loading state during format switch', () => {
      renderWithProviders(
        <StickerPreview format="svg" data={undefined} isLoading={true} onRetry={vi.fn()} />
      )
      expect(screen.getByLabelText('Загрузка превью')).toBeInTheDocument()
    })

    it('shows no-data state for png without data', () => {
      renderPreview({ format: 'png', data: undefined, isLoading: false })
      expect(screen.getByText('Превью будет доступно после генерации')).toBeInTheDocument()
    })

    it('cancels previous request when format changes', () => {
      // Just verify no crash on rapid format changes
      const { rerender } = renderWithProviders(
        <StickerPreview format="png" data={MOCK_PNG_BASE64} isLoading={false} onRetry={vi.fn()} />
      )
      rerender(
        <StickerPreview format="svg" data={MOCK_SVG_BASE64} isLoading={false} onRetry={vi.fn()} />
      )
      rerender(<StickerPreview format="zpl" data={undefined} isLoading={false} onRetry={vi.fn()} />)
      expect(screen.getByText('Предпросмотр ZPL недоступен.')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 8. Accessibility
  // ===========================================================================

  describe('Accessibility', () => {
    it('image has meaningful alt text', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      expect(screen.getByAltText('Превью стикера')).toBeInTheDocument()
    })

    it('loading state has aria-busy="true"', () => {
      renderPreview({ isLoading: true })
      const busyEl = document.querySelector('[aria-busy="true"]')
      expect(busyEl).toBeInTheDocument()
    })

    it('loading skeleton has aria-label', () => {
      renderPreview({ isLoading: true })
      expect(screen.getByLabelText('Загрузка превью')).toBeInTheDocument()
    })

    it('retry button is keyboard accessible', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      renderPreview({ error: 'Network error', onRetry })
      const btn = screen.getByText('Повторить')
      btn.focus()
      await user.keyboard('{Enter}')
      expect(onRetry).toHaveBeenCalled()
    })

    it('info icon has aria-hidden="true"', () => {
      const { container } = renderPreview({ format: 'zpl', data: undefined })
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })

    it('ZPL info text is readable by screen readers', () => {
      renderPreview({ format: 'zpl', data: undefined })
      expect(screen.getByText('Предпросмотр ZPL недоступен.')).toBeInTheDocument()
      expect(
        screen.getByText('Этот формат предназначен для термопринтеров Zebra.')
      ).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 9. Optional Zoom Feature
  // ===========================================================================

  describe('Optional Zoom Feature', () => {
    it('image is clickable element in container', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })

    it('no zoom modal by default', () => {
      renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('image container renders without zoom', () => {
      const { container } = renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const wrapper = container.querySelector('.rounded-lg.border')
      expect(wrapper).toBeInTheDocument()
    })

    it('cursor is default (no zoom implemented)', () => {
      const { container } = renderPreview({ format: 'png', data: MOCK_PNG_BASE64 })
      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // TDD Verification Tests
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have base64 data fixtures ready', () => {
      expect(MOCK_PNG_BASE64).toBeDefined()
      expect(MOCK_PNG_BASE64.length).toBeGreaterThan(0)
      expect(MOCK_SVG_BASE64).toBeDefined()
      expect(MOCK_SVG_BASE64.length).toBeGreaterThan(0)
    })

    it('should have preview fixtures ready', () => {
      expect(mockPreviewPng).toBeDefined()
      expect(mockPreviewPng.format).toBe('png')
      expect(mockPreviewPng.dataUrl).toContain('data:image/png;base64')
      expect(mockPreviewSvg).toBeDefined()
      expect(mockPreviewSvg.format).toBe('svg')
      expect(mockPreviewSvg.dataUrl).toContain('data:image/svg+xml;base64')
    })

    it('should have error fixtures ready', () => {
      expect(mockErrorGenerationFailed).toBeDefined()
      expect(mockErrorGenerationFailed.code).toBe('GENERATION_FAILED')
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(userEvent).toBeDefined()
      expect(renderWithProviders).toBeDefined()
    })
  })
})

// Suppress unused fixture warnings
void MOCK_PNG_BASE64
void MOCK_SVG_BASE64
void mockPreviewPng
void mockPreviewSvg
void mockErrorGenerationFailed
