/**
 * Tests for PricingBasisToggle (SPP-1.7-FE)
 * Selector renders current basis; change fires mutation; error reverts + toasts;
 * loading/error render a disabled placeholder (never a fabricated basis).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { UseQueryResult } from '@tanstack/react-query'
import type { PriceBasisOrUnknown } from '@/types/price-recommendations'

const mockMutate = vi.fn()

vi.mock('@/hooks/usePricingBasis', () => ({
  usePricingBasis: vi.fn(),
  useUpdatePricingBasis: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}))

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'
import { usePricingBasis } from '@/hooks/usePricingBasis'
import { PricingBasisToggle } from '../PricingBasisToggle'

const mockedUsePricingBasis = vi.mocked(usePricingBasis)

/**
 * Minimal UseQueryResult subset the component reads.
 * AP#4-adjacent mock bridge: declare the subset, widen via unknown.
 */
function queryResult(overrides: {
  data?: PriceBasisOrUnknown
  isSuccess: boolean
  isError?: boolean
  isPending?: boolean
}): UseQueryResult<PriceBasisOrUnknown> {
  const isSuccess = overrides.isSuccess
  const subset = {
    data: undefined,
    error: null,
    isError: overrides.isError ?? false,
    isPending: overrides.isPending ?? !isSuccess,
    isLoading: false,
    status: (isSuccess ? 'success' : 'pending') as 'success' | 'pending',
    fetchStatus: 'idle' as const,
    refetch: vi.fn(),
    queryKey: ['pricing-basis'],
  }
  return { ...subset, ...overrides } as unknown as UseQueryResult<PriceBasisOrUnknown>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUsePricingBasis.mockReturnValue(queryResult({ isSuccess: false }))
})

describe('PricingBasisToggle', () => {
  it('renders nothing when cabinetId is null', () => {
    const { container } = render(<PricingBasisToggle cabinetId={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the label and combobox for a cabinet', () => {
    renderWithProviders(<PricingBasisToggle cabinetId="cab-1" />)
    expect(screen.getByText('Базис:')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Базис расчёта' })).toBeInTheDocument()
  })

  it('is DISABLED with a dash placeholder before the query resolves (no fabricated basis)', () => {
    renderWithProviders(<PricingBasisToggle cabinetId="cab-1" />)
    const combobox = screen.getByRole('combobox', { name: 'Базис расчёта' })
    expect(combobox).toBeDisabled()
    expect(combobox).toHaveTextContent('—')
    expect(combobox).not.toHaveTextContent('Продавец')
  })

  it('is DISABLED with an error placeholder when the GET fails', () => {
    mockedUsePricingBasis.mockReturnValue(queryResult({ isSuccess: false, isError: true }))
    renderWithProviders(<PricingBasisToggle cabinetId="cab-1" />)
    const combobox = screen.getByRole('combobox', { name: 'Базис расчёта' })
    expect(combobox).toBeDisabled()
    expect(combobox).toHaveTextContent('Ошибка загрузки')
  })

  it('shows the server basis once the query succeeds', () => {
    mockedUsePricingBasis.mockReturnValue(queryResult({ data: 'STOREFRONT_ANON', isSuccess: true }))
    renderWithProviders(<PricingBasisToggle cabinetId="cab-1" />)
    expect(screen.getByRole('combobox', { name: 'Базис расчёта' })).toHaveTextContent('Витрина')
  })

  it('treats UNKNOWN server basis as not-loaded (disabled placeholder)', () => {
    mockedUsePricingBasis.mockReturnValue(queryResult({ data: 'UNKNOWN', isSuccess: true }))
    renderWithProviders(<PricingBasisToggle cabinetId="cab-1" />)
    const combobox = screen.getByRole('combobox', { name: 'Базис расчёта' })
    expect(combobox).toBeDisabled()
  })

  it('change fires mutation with the selected basis + recompute hint', async () => {
    const user = userEvent.setup()
    mockedUsePricingBasis.mockReturnValue(queryResult({ data: 'SELLER', isSuccess: true }))
    renderWithProviders(<PricingBasisToggle cabinetId="cab-1" />)

    await user.click(screen.getByRole('combobox', { name: 'Базис расчёта' }))
    await user.click(screen.getByRole('option', { name: 'Витрина' }))

    expect(mockMutate).toHaveBeenCalledOnce()
    expect(mockMutate.mock.calls[0][0]).toBe('STOREFRONT_ANON')
    expect(toast.info).toHaveBeenCalledWith(
      'Базис изменён — нажмите «Обновить» для пересчёта рекомендаций'
    )
  })

  it('ADVERSARIAL revert path: invoking onError reverts the selection to the previous basis', async () => {
    const user = userEvent.setup()
    mockedUsePricingBasis.mockReturnValue(queryResult({ data: 'SELLER', isSuccess: true }))
    renderWithProviders(<PricingBasisToggle cabinetId="cab-1" />)

    await user.click(screen.getByRole('combobox', { name: 'Базис расчёта' }))
    await user.click(screen.getByRole('option', { name: 'Витрина' }))

    const options = mockMutate.mock.calls[0][1] as { onError: () => void }
    expect(typeof options.onError).toBe('function')

    // Simulate the PUT failure: the toggle must revert to the previous value.
    // (act-wrapped: the revert runs inside React state updates)
    act(() => {
      options.onError()
    })

    expect(screen.getByRole('combobox', { name: 'Базис расчёта' })).toHaveTextContent('Продавец')
    expect(toast.error).toHaveBeenCalledWith('Не удалось изменить базис расчёта')
  })
})
