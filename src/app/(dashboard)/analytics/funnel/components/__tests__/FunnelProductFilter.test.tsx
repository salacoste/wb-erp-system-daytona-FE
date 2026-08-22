import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFunnelResponse, makeFunnelProductItem } from '@/test/fixtures/funnel-empty'

import { FunnelProductFilter } from '../FunnelProductFilter'

const useFunnelDataMock = vi.fn()

vi.mock('@/hooks/use-funnel-analytics', () => ({
  useFunnelData: (...args: unknown[]) => useFunnelDataMock(...args),
}))

describe('FunnelProductFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('distinguishes request failure from an empty product result and retries', async () => {
    const refetch = vi.fn()
    const user = userEvent.setup()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })

    renderWithProviders(
      <FunnelProductFilter from="2025-01-01" to="2025-01-07" value={[]} onChange={vi.fn()} />
    )
    await user.click(screen.getByRole('combobox', { name: /Фильтр по товарам/ }))

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить товары')
    expect(screen.getByText('Не удалось загрузить товары')).toBeVisible()
    expect(screen.queryByText('Товары не найдены')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку товаров' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('announces the product loading state with visible status text', async () => {
    const user = userEvent.setup()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(
      <FunnelProductFilter from="2025-01-01" to="2025-01-07" value={[]} onChange={vi.fn()} />
    )
    await user.click(screen.getByRole('combobox', { name: /Фильтр по товарам/ }))

    expect(screen.getByRole('status')).toHaveTextContent('Товары загружаются')
  })

  it('keeps cached product options available after a background refresh error', async () => {
    const refetch = vi.fn()
    const user = userEvent.setup()
    const product = makeFunnelProductItem({
      nmId: 123456,
      vendorCode: 'cached-product',
      brandName: 'Cached Brand',
    })
    useFunnelDataMock.mockReturnValue({
      data: emptyFunnelResponse({
        items: [product],
        pagination: { total: 1, limit: 500, offset: 0, hasMore: false },
      }),
      isLoading: false,
      isError: true,
      refetch,
    })

    renderWithProviders(
      <FunnelProductFilter from="2025-01-01" to="2025-01-07" value={[]} onChange={vi.fn()} />
    )
    await user.click(screen.getByRole('combobox', { name: /Фильтр по товарам/ }))

    expect(screen.getByRole('alert')).toHaveTextContent(/Показаны ранее загруженные товары/)
    expect(screen.getByRole('option', { name: /cached-product/i })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку товаров' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('keeps successful global empty distinct and exposes a 44px search target', async () => {
    const user = userEvent.setup()
    useFunnelDataMock.mockReturnValue({
      data: emptyFunnelResponse(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(
      <FunnelProductFilter from="2025-01-01" to="2025-01-07" value={[]} onChange={vi.fn()} />
    )
    await user.click(screen.getByRole('combobox', { name: /Фильтр по товарам/ }))

    expect(screen.getByText('Товары не найдены')).toBeVisible()
    expect(screen.getByPlaceholderText(/Поиск по названию/)).toHaveClass('min-h-11')
  })
})
