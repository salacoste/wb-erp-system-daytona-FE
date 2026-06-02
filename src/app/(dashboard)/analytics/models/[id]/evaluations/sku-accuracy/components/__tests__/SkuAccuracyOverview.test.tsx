/**
 * SkuAccuracyOverview — Rules-of-Hooks regression (iter-63)
 *
 * The csvFileName/csvContent useMemo hooks previously sat AFTER the isLoading/isError early
 * returns. Once the page actually loaded data (after the modelId-400 fix), the loading render
 * early-returned BEFORE the useMemos while the data render reached them → "Rendered more hooks
 * than during the previous render" crash. This test exercises the loading → data transition that
 * Playwright caught but unit tests previously did not, and asserts the page renders without throwing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import type { SkuAccuracyListResponse } from '@/types/ai/evaluations'

const mockUseAiSkuAccuracy = vi.fn()
vi.mock('@/hooks/useAiSkuAccuracy', () => ({
  useAiSkuAccuracy: (...args: unknown[]) => mockUseAiSkuAccuracy(...args),
}))

import { SkuAccuracyOverview } from '../SkuAccuracyOverview'

function loadingState() {
  return { data: undefined, isLoading: true, isError: false, error: null }
}
function dataState(resp: SkuAccuracyListResponse) {
  return { data: resp, isLoading: false, isError: false, error: null }
}

describe('SkuAccuracyOverview — loading→data transition (Rules of Hooks, iter-63)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not crash when transitioning loading → empty-data (hooks stay above early returns)', () => {
    mockUseAiSkuAccuracy.mockReturnValue(loadingState())
    const { rerender } = render(<SkuAccuracyOverview modelId="model-1" />)
    expect(screen.getByTestId('sku-accuracy-skeleton')).toBeInTheDocument()

    // The transition that crashed: loading render early-returned before the useMemos; the data
    // render reaches them. With the fix (memos hoisted) the hook count is stable across renders.
    mockUseAiSkuAccuracy.mockReturnValue(dataState({ skuAccuracies: [] }))
    expect(() => rerender(<SkuAccuracyOverview modelId="model-1" />)).not.toThrow()
    expect(screen.getByText(/Нет данных по точности SKU/)).toBeInTheDocument()
  })

  it('renders empty-state directly on a non-loading empty response', () => {
    mockUseAiSkuAccuracy.mockReturnValue(dataState({ skuAccuracies: [] }))
    render(<SkuAccuracyOverview modelId="model-1" />)
    expect(screen.getByText(/Нет данных по точности SKU/)).toBeInTheDocument()
  })

  it('shows the error state without reaching the memos when the query errors', () => {
    mockUseAiSkuAccuracy.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('boom'),
    })
    render(<SkuAccuracyOverview modelId="model-1" />)
    expect(screen.getByText(/Ошибка загрузки данных по SKU/)).toBeInTheDocument()
  })
})
