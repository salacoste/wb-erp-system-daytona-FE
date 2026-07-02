/**
 * Tests for SkuVariantSection (FR-7 #221 Phase 2).
 *
 * useMarginAnalyticsByVariant is mocked at the module level so the section's four
 * branches (loading / error / success / empty) can be exercised without touching the
 * network. VariantTable's own rendering is covered in VariantTable.test.tsx — here
 * we only assert the section wires data through and shows the right state branch.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuVariantSection } from '../SkuVariantSection'
import { variantEmptyResponse, variantSampleItem } from '@/test/fixtures/variant-empty'

// Mock the variant hook — using vi.hoisted to avoid hoisting issues (repo convention).
const { useMarginAnalyticsByVariantMock } = vi.hoisted(() => ({
  useMarginAnalyticsByVariantMock: vi.fn(),
}))

vi.mock('@/hooks/useMarginAnalyticsByVariant', () => ({
  useMarginAnalyticsByVariant: (...args: unknown[]) => useMarginAnalyticsByVariantMock(...args),
}))

describe('SkuVariantSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMarginAnalyticsByVariantMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
  })

  it('shows the loading state while variants are fetching', () => {
    renderWithProviders(<SkuVariantSection week="2026-W26" />)
    expect(screen.getByText('Загрузка вариантов…')).toBeInTheDocument()
  })

  it('renders VariantTable rows on success', async () => {
    useMarginAnalyticsByVariantMock.mockReturnValue({
      data: {
        data: [variantSampleItem],
        meta: { count: 1, has_more: false, next_cursor: null },
      },
      isLoading: false,
      isError: false,
      error: null,
    })
    renderWithProviders(<SkuVariantSection week="2026-W26" />)
    // Variant label «Синий · 42» from the fixture, surfaced via VariantTable.
    expect(await screen.findByText(/Синий · 42/)).toBeInTheDocument()
  })

  it('shows the empty state when there are no variants', () => {
    useMarginAnalyticsByVariantMock.mockReturnValue({
      data: variantEmptyResponse,
      isLoading: false,
      isError: false,
      error: null,
    })
    renderWithProviders(<SkuVariantSection week="2026-W26" />)
    expect(screen.getByText('Нет вариантов FBS за эту неделю')).toBeInTheDocument()
  })

  it('shows the error branch with message when the fetch fails', async () => {
    useMarginAnalyticsByVariantMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('500 Internal Server Error'),
    })
    renderWithProviders(<SkuVariantSection week="2026-W26" />)
    // The error heading + the underlying message are both rendered.
    expect(screen.getByText('Не удалось загрузить варианты.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/500 Internal Server Error/)).toBeInTheDocument()
    })
  })
})
