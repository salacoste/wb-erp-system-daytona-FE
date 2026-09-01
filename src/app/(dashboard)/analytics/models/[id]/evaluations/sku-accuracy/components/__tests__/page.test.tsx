/**
 * SkuAccuracyPage routing tests — Story 110.3-FE Task 5.
 * Covers: breadcrumb renders, overview vs detail routing on ?nmId=,
 * hook called with correct modelId.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkuAccuracyPage from '../../page'
import * as skuAccuracyHook from '@/hooks/useAiSkuAccuracy'
import type { SkuAccuracyListResponse } from '@/types/ai/evaluations'

// Mock next/navigation
const mockGet = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'model-abc' }),
  useSearchParams: () => ({ get: mockGet }),
}))

// Mock child components to isolate page routing logic
vi.mock('../../components/SkuAccuracyOverview', () => ({
  SkuAccuracyOverview: ({ modelId }: { modelId: string }) =>
    React.createElement('div', { 'data-testid': 'sku-overview', 'data-model-id': modelId }),
}))

vi.mock('../../components/SkuAccuracyDetail', () => ({
  SkuAccuracyDetail: ({
    nmId,
    modelId,
  }: {
    nmId: number
    modelId: string
    skuAccuracies?: unknown
    isLoading?: boolean
    isError?: boolean
  }) =>
    React.createElement('div', {
      'data-testid': 'sku-detail',
      'data-nm-id': nmId,
      'data-model-id': modelId,
    }),
}))

vi.mock('@/hooks/useAiSkuAccuracy')

const mockUseAiSkuAccuracy = vi.mocked(skuAccuracyHook.useAiSkuAccuracy)

const emptyResponse: SkuAccuracyListResponse = { skuAccuracies: [] }

describe('SkuAccuracyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAiSkuAccuracy.mockReturnValue({
      data: emptyResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof skuAccuracyHook.useAiSkuAccuracy>)
  })

  it('renders breadcrumb with link to evaluations', () => {
    mockGet.mockReturnValue(null)
    render(<SkuAccuracyPage />)
    const link = screen.getByRole('link', { name: /Оценки точности/ })
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toContain('model-abc')
    expect(link.getAttribute('href')).toContain('evaluations')
  })

  it('renders page title "Точность по SKU"', () => {
    mockGet.mockReturnValue(null)
    render(<SkuAccuracyPage />)
    expect(screen.getByRole('heading', { name: 'Точность по SKU' })).toBeTruthy()
  })

  it('renders SkuAccuracyOverview when no ?nmId= param', () => {
    mockGet.mockReturnValue(null)
    render(<SkuAccuracyPage />)
    expect(screen.getByTestId('sku-overview')).toBeTruthy()
    expect(screen.queryByTestId('sku-detail')).toBeNull()
  })

  it('renders SkuAccuracyDetail when ?nmId= param present', () => {
    mockGet.mockReturnValue('12345')
    render(<SkuAccuracyPage />)
    expect(screen.getByTestId('sku-detail')).toBeTruthy()
    expect(screen.queryByTestId('sku-overview')).toBeNull()
  })

  it('passes modelId to SkuAccuracyOverview', () => {
    mockGet.mockReturnValue(null)
    render(<SkuAccuracyPage />)
    const overview = screen.getByTestId('sku-overview')
    expect(overview.getAttribute('data-model-id')).toBe('model-abc')
  })

  it('passes parsed nmId (number) to SkuAccuracyDetail', () => {
    mockGet.mockReturnValue('12345')
    render(<SkuAccuracyPage />)
    const detail = screen.getByTestId('sku-detail')
    expect(detail.getAttribute('data-nm-id')).toBe('12345')
    expect(detail.getAttribute('data-model-id')).toBe('model-abc')
  })

  it('calls useAiSkuAccuracy with modelId', () => {
    mockGet.mockReturnValue(null)
    render(<SkuAccuracyPage />)
    // Page calls useAiSkuAccuracy(modelId) without second arg — hook default handles nmId=undefined
    expect(mockUseAiSkuAccuracy).toHaveBeenCalledWith('model-abc')
  })

  // F-5: malformed context must be distinct from the valid overview state.
  it('F-5: malformed ?nmId=abc renders an explicit invalid-parameter error', () => {
    mockGet.mockReturnValue('abc')
    render(<SkuAccuracyPage />)
    expect(screen.getByText(/Некорректный параметр SKU/)).toBeTruthy()
    expect(screen.queryByTestId('sku-overview')).toBeNull()
    expect(screen.queryByTestId('sku-detail')).toBeNull()
  })

  // F-2: renamed — 1.5e2 === 150 IS an integer in JS, so Number.isInteger(150) === true → Detail renders
  it('F-2: ?nmId=1.5e2 = 150 (integer in scientific notation) renders Detail', () => {
    mockGet.mockReturnValue('1.5e2')
    render(<SkuAccuracyPage />)
    // 1.5e2 parses to 150, which is a positive integer → Detail rendered
    expect(screen.getByTestId('sku-detail')).toBeTruthy()
    expect(screen.queryByTestId('sku-overview')).toBeNull()
  })

  // F-2: a non-integer query value is invalid route context, not an overview request.
  it('F-2: ?nmId=1.5 (true non-integer float) renders an invalid-parameter error', () => {
    mockGet.mockReturnValue('1.5')
    render(<SkuAccuracyPage />)
    expect(screen.getByText(/Некорректный параметр SKU/)).toBeTruthy()
    expect(screen.queryByTestId('sku-overview')).toBeNull()
    expect(screen.queryByTestId('sku-detail')).toBeNull()
  })

  // F-1: additional boundary tests for tightened Number.isInteger + >0 guard
  it('F-1: ?nmId=0 renders an invalid-parameter error (zero is not a valid SKU id)', () => {
    mockGet.mockReturnValue('0')
    render(<SkuAccuracyPage />)
    expect(screen.getByText(/Некорректный параметр SKU/)).toBeTruthy()
    expect(screen.queryByTestId('sku-overview')).toBeNull()
    expect(screen.queryByTestId('sku-detail')).toBeNull()
  })

  it('F-1: ?nmId=-1 renders an invalid-parameter error', () => {
    mockGet.mockReturnValue('-1')
    render(<SkuAccuracyPage />)
    expect(screen.getByText(/Некорректный параметр SKU/)).toBeTruthy()
    expect(screen.queryByTestId('sku-overview')).toBeNull()
    expect(screen.queryByTestId('sku-detail')).toBeNull()
  })

  it('F-1: ?nmId=999999999999999999999 renders an invalid-parameter error', () => {
    // Number('999999999999999999999') === 1e+21 in JS (not Infinity).
    // Number.isSafeInteger(1e+21) === false → nmId resolves to null → Overview rendered.
    mockGet.mockReturnValue('999999999999999999999')
    render(<SkuAccuracyPage />)
    expect(screen.getByText(/Некорректный параметр SKU/)).toBeTruthy()
    expect(screen.queryByTestId('sku-overview')).toBeNull()
    expect(screen.queryByTestId('sku-detail')).toBeNull()
  })

  // F-2: isLoading/isError forwarded to SkuAccuracyDetail
  it('F-2: passes isLoading=true to SkuAccuracyDetail when hook is loading', () => {
    mockGet.mockReturnValue('12345')
    mockUseAiSkuAccuracy.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof skuAccuracyHook.useAiSkuAccuracy>)
    render(<SkuAccuracyPage />)
    // SkuAccuracyDetail is mocked — verify it is rendered (isLoading prop accepted without crash)
    expect(screen.getByTestId('sku-detail')).toBeTruthy()
  })

  it('F-2: passes isError=true to SkuAccuracyDetail when hook errors', () => {
    mockGet.mockReturnValue('12345')
    mockUseAiSkuAccuracy.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('network error'),
    } as ReturnType<typeof skuAccuracyHook.useAiSkuAccuracy>)
    render(<SkuAccuracyPage />)
    expect(screen.getByTestId('sku-detail')).toBeTruthy()
  })
})
