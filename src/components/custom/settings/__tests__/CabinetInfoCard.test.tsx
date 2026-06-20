import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, renderWithProviders } from '@/test/utils/test-utils'
import { CabinetInfoCard } from '../CabinetInfoCard'

const mockUseSellerInfo = vi.fn()
const mockUseJamStatus = vi.fn()

vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: (...args: unknown[]) => mockUseSellerInfo(...args),
}))

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: (...args: unknown[]) => mockUseJamStatus(...args),
}))

vi.mock('../SellerRatingCard', () => ({
  SellerRatingCard: () => <div data-testid="seller-rating-card" />,
}))

describe('CabinetInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders explicit unavailable states when seller and Jam data are absent', () => {
    mockUseSellerInfo.mockReturnValue({ data: undefined, isLoading: false })
    mockUseJamStatus.mockReturnValue({ data: undefined, isLoading: false })

    renderWithProviders(<CabinetInfoCard cabinetId="cabinet-1" />)

    expect(screen.getByText(/Информация о продавце сейчас недоступна/)).toBeInTheDocument()
    expect(screen.getByText(/Статус подписки Джем сейчас недоступен/)).toBeInTheDocument()
    expect(screen.getByTestId('seller-rating-card')).toBeInTheDocument()
  })
})
