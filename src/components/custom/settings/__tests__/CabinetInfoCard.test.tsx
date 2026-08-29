import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, renderWithProviders } from '@/test/utils/test-utils'
import { CabinetInfoCard } from '../CabinetInfoCard'

const mockUseSellerInfo = vi.fn()
const mockUseJamStatus = vi.fn()
const mockUseDelayedLoadingState = vi.fn()

vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: (...args: unknown[]) => mockUseSellerInfo(...args),
}))

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: (...args: unknown[]) => mockUseJamStatus(...args),
}))

vi.mock('@/hooks/useDelayedLoadingState', () => ({
  useDelayedLoadingState: (...args: unknown[]) => mockUseDelayedLoadingState(...args),
}))

vi.mock('../SellerRatingCard', () => ({
  SellerRatingCard: ({ cabinetId }: { cabinetId: string }) => (
    <div data-testid="seller-rating-card" data-cabinet-id={cabinetId} />
  ),
}))

describe('CabinetInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDelayedLoadingState.mockReturnValue(false)
  })

  it('renders explicit unavailable states when seller and Jam data are absent', () => {
    mockUseSellerInfo.mockReturnValue({ data: undefined, isLoading: false })
    mockUseJamStatus.mockReturnValue({ data: undefined, isLoading: false })

    renderWithProviders(<CabinetInfoCard cabinetId="cabinet-1" />)

    expect(screen.getByText(/Информация о продавце сейчас недоступна/)).toBeInTheDocument()
    expect(screen.getByText(/Статус подписки Джем сейчас недоступен/)).toBeInTheDocument()
    expect(screen.getByTestId('seller-rating-card')).toBeInTheDocument()
  })

  it('preserves partial seller and unavailable Jam evidence', () => {
    mockUseSellerInfo.mockReturnValue({
      data: {
        name: 'Очень длинное название кабинета продавца на Wildberries',
        sid: '',
        tradeMark: 'Очень длинная торговая марка продавца',
        available: false,
        reason: 'insufficient_permissions',
      },
      isLoading: false,
    })
    mockUseJamStatus.mockReturnValue({
      data: {
        tier: 'unknown',
        available: false,
        searchTextsLimit: 0,
        checkedAt: '2026-08-29T12:00:00Z',
        probeCallsMade: 1,
        reason: 'timeout',
      },
      isLoading: false,
    })

    renderWithProviders(<CabinetInfoCard cabinetId="cabinet-partial" />)

    expect(screen.getByText(/Недостаточно прав/)).toBeInTheDocument()
    expect(
      screen.getByText('Очень длинное название кабинета продавца на Wildberries')
    ).toBeVisible()
    expect(screen.getByText('—')).toBeVisible()
    expect(screen.getByText('Очень длинная торговая марка продавца')).toBeVisible()
    expect(screen.getByText(/Таймаут запроса/)).toBeInTheDocument()
    expect(screen.getByText('Неизвестный тариф')).toBeVisible()
    expect(screen.getByText(/29\.08\.2026/)).toBeVisible()
  })

  it('keeps immediate and delayed loading states distinct', () => {
    mockUseSellerInfo.mockReturnValue({ data: undefined, isLoading: true })
    mockUseJamStatus.mockReturnValue({ data: undefined, isLoading: true })

    const { container, rerender } = renderWithProviders(
      <CabinetInfoCard cabinetId="cabinet-loading" />
    )
    expect(container.querySelectorAll('[class*="animate-pulse"]')).toHaveLength(5)

    mockUseDelayedLoadingState.mockReturnValue(true)
    rerender(<CabinetInfoCard cabinetId="cabinet-loading" />)

    expect(screen.getByText(/продавце загружается дольше обычного/)).toBeVisible()
    expect(screen.getByText(/Джем загружается дольше обычного/)).toBeVisible()
  })

  it('requests seller and Jam data only for the supplied cabinet', () => {
    mockUseSellerInfo.mockReturnValue({ data: undefined, isLoading: false })
    mockUseJamStatus.mockReturnValue({ data: undefined, isLoading: false })

    renderWithProviders(<CabinetInfoCard cabinetId="cabinet-isolated" />)

    expect(mockUseSellerInfo).toHaveBeenCalledOnce()
    expect(mockUseSellerInfo).toHaveBeenCalledWith('cabinet-isolated')
    expect(mockUseJamStatus).toHaveBeenCalledOnce()
    expect(mockUseJamStatus).toHaveBeenCalledWith('cabinet-isolated')
    expect(screen.getByTestId('seller-rating-card')).toHaveAttribute(
      'data-cabinet-id',
      'cabinet-isolated'
    )
  })

  it('shows the search-text limit only for an available paid Jam tier', () => {
    mockUseSellerInfo.mockReturnValue({ data: undefined, isLoading: false })
    mockUseJamStatus.mockReturnValue({
      data: {
        tier: 'standard',
        available: true,
        searchTextsLimit: 50,
        checkedAt: '2026-08-29T12:00:00Z',
        probeCallsMade: 1,
      },
      isLoading: false,
    })

    renderWithProviders(<CabinetInfoCard cabinetId="cabinet-paid" />)

    expect(screen.getByText('Джем Стандарт')).toBeVisible()
    expect(screen.getByText('50 текстов на товар')).toBeVisible()
  })
})
