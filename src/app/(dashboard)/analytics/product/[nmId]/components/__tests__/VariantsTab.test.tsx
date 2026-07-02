/**
 * VariantsTab unit tests — FR-7 Phase 3 (#221).
 * Verifies client-side nm_id filtering, empty state, single-week note, and error state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { variantSampleItem, variantNullColorItem } from '@/test/fixtures/variant-empty'

// vi.hoisted so the mock state is available inside the vi.mock factory (repo convention).
const { mockUseVariant } = vi.hoisted(() => ({
  mockUseVariant: vi.fn(),
}))

vi.mock('@/hooks/useMarginAnalyticsByVariant', () => ({
  useMarginAnalyticsByVariant: mockUseVariant,
}))

import { VariantsTab } from '../VariantsTab'

// Bridge the partial mock through unknown (AP#4 — TanStack Query observer fields).
function setVariantReturn(
  data: (typeof variantSampleItem)[] | undefined,
  overrides?: {
    isLoading?: boolean
    isError?: boolean
  }
) {
  mockUseVariant.mockReturnValue({
    data: data ? { data, meta: undefined } : undefined,
    isLoading: overrides?.isLoading ?? false,
    isError: overrides?.isError ?? false,
  })
}

describe('VariantsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVariantReturn([])
  })

  it('renders only this product variants (filters by nm_id)', () => {
    // variantSampleItem.nm_id === 202867769 (matching); nullColor item has a different nm_id.
    const other = { ...variantNullColorItem, nm_id: 999999999 }
    setVariantReturn([variantSampleItem, other])

    renderWithProviders(<VariantsTab nmId={String(variantSampleItem.nm_id)} />)

    // Matching row label «Синий · 42» present; other product's row (chrt label) absent.
    expect(screen.getByText('Синий · 42')).toBeInTheDocument()
    expect(screen.queryByText(`chrt ${other.chrt_id}`)).not.toBeInTheDocument()
    // Phase-1 contract preserved: the allocated (approximate) header markers render.
    expect(
      screen.getAllByLabelText('Столбец содержит приблизительные значения').length
    ).toBeGreaterThan(0)
  })

  it('renders the empty state when the product has no variants that week', () => {
    // Only non-matching nm_id items → VariantTable shows «Нет вариантов FBS за эту неделю».
    setVariantReturn([{ ...variantSampleItem, nm_id: 999999999 }])

    renderWithProviders(<VariantsTab nmId={String(variantSampleItem.nm_id)} />)

    expect(screen.getByText('Нет вариантов FBS за эту неделю')).toBeInTheDocument()
  })

  it('shows the «последнюю завершённую неделю» note', () => {
    setVariantReturn([])

    renderWithProviders(<VariantsTab nmId={String(variantSampleItem.nm_id)} />)

    expect(
      screen.getByText(/Данные по вариантам — за последнюю завершённую неделю/)
    ).toBeInTheDocument()
  })

  it('renders the error note when the fetch fails (no page crash)', () => {
    setVariantReturn(undefined, { isError: true })

    renderWithProviders(<VariantsTab nmId={String(variantSampleItem.nm_id)} />)

    expect(screen.getByText('Не удалось загрузить варианты')).toBeInTheDocument()
  })

  it('shows an error note for a malformed nmId (no misleading empty state)', () => {
    setVariantReturn([variantSampleItem])

    renderWithProviders(<VariantsTab nmId="not-a-number" />)

    expect(screen.getByText('Некорректный ID товара')).toBeInTheDocument()
    // Must NOT render the deceptive «no variants» empty state for a bad id.
    expect(screen.queryByText('Нет вариантов FBS за эту неделю')).not.toBeInTheDocument()
  })
})
