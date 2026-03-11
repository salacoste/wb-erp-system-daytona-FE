import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { PreflightWarnings } from '../PreflightWarnings'

let mockPackagingError = false
let mockPackagingFetched = false
let mockProductData: { products: { nm_id: number; has_cogs: boolean }[] } | null = null
let mockProductFetched = false

vi.mock('@/hooks/use-sku-packaging', () => ({
  useSkuPackagingByNmId: () => ({
    get isError() {
      return mockPackagingError
    },
    get isFetched() {
      return mockPackagingFetched
    },
  }),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    get data() {
      return mockProductData
    },
    get isFetched() {
      return mockProductFetched
    },
  }),
}))

describe('PreflightWarnings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPackagingError = false
    mockPackagingFetched = false
    mockProductData = null
    mockProductFetched = false
  })

  it('renders nothing when nmId is null', () => {
    const { container } = renderWithProviders(<PreflightWarnings nmId={null} />)
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument()
  })

  it('renders nothing when data is still loading', () => {
    const { container } = renderWithProviders(<PreflightWarnings nmId={123} />)
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument()
  })

  it('shows packaging warning when packaging is missing', () => {
    mockPackagingError = true
    mockPackagingFetched = true
    renderWithProviders(<PreflightWarnings nmId={123} />)
    expect(screen.getByText(/нет настройки упаковки/)).toBeInTheDocument()
    expect(screen.getByText('Настроить упаковку')).toHaveAttribute(
      'href',
      '/shipments/sku-packaging'
    )
  })

  it('shows COGS warning when COGS is missing', () => {
    mockProductData = { products: [{ nm_id: 456, has_cogs: false }] }
    mockProductFetched = true
    renderWithProviders(<PreflightWarnings nmId={456} />)
    expect(screen.getByText(/не указана себестоимость/)).toBeInTheDocument()
    expect(screen.getByText('Указать себестоимость')).toHaveAttribute(
      'href',
      '/products?filter=456'
    )
  })

  it('shows both warnings simultaneously', () => {
    mockPackagingError = true
    mockPackagingFetched = true
    mockProductData = { products: [{ nm_id: 789, has_cogs: false }] }
    mockProductFetched = true
    renderWithProviders(<PreflightWarnings nmId={789} />)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
  })

  it('shows no warnings when packaging and COGS both exist', () => {
    mockPackagingError = false
    mockPackagingFetched = true
    mockProductData = { products: [{ nm_id: 111, has_cogs: true }] }
    mockProductFetched = true
    const { container } = renderWithProviders(<PreflightWarnings nmId={111} />)
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument()
  })
})
