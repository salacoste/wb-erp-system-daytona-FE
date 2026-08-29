import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SellerRatingCard } from '../SellerRatingCard'

const mockUseSellerRating = vi.fn()

vi.mock('@/hooks/useSellerRating', () => ({
  useSellerRating: (...args: unknown[]) => mockUseSellerRating(...args),
}))

describe('SellerRatingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an accessible loading status', () => {
    mockUseSellerRating.mockReturnValue({ data: undefined, isLoading: true })

    renderWithProviders(<SellerRatingCard cabinetId="cabinet-loading" />)

    expect(screen.getByRole('status', { name: /загрузка рейтинга продавца/i })).toBeVisible()
  })

  it('renders an explicit unavailable state when rating data is absent', () => {
    mockUseSellerRating.mockReturnValue({ data: undefined, isLoading: false })

    renderWithProviders(<SellerRatingCard cabinetId="cabinet-unavailable" />)

    expect(screen.getByText(/рейтинг продавца сейчас недоступен/i)).toBeVisible()
  })

  it('shows the mapped unavailable reason', () => {
    mockUseSellerRating.mockReturnValue({
      data: {
        valuation: null,
        feedbackCount: null,
        available: false,
        reason: 'insufficient_permissions',
      },
      isLoading: false,
    })

    renderWithProviders(<SellerRatingCard cabinetId="cabinet-restricted" />)

    expect(screen.getByText(/нужна категория «Вопросы и отзывы»/i)).toBeVisible()
  })

  it('shows an accessible rating and feedback count', () => {
    mockUseSellerRating.mockReturnValue({
      data: { valuation: 4.6, feedbackCount: 1234, available: true },
      isLoading: false,
    })

    renderWithProviders(<SellerRatingCard cabinetId="cabinet-rated" />)

    expect(screen.getByLabelText('Рейтинг: 4.6 из 5')).toBeVisible()
    expect(screen.getByText('1234 отзывов')).toBeVisible()
    expect(mockUseSellerRating).toHaveBeenCalledWith('cabinet-rated')
  })

  it('distinguishes an available seller without a rating', () => {
    mockUseSellerRating.mockReturnValue({
      data: { valuation: null, feedbackCount: null, available: true },
      isLoading: false,
    })

    renderWithProviders(<SellerRatingCard cabinetId="cabinet-new" />)

    expect(screen.getByText(/рейтинг пока отсутствует/i)).toBeVisible()
  })
})
