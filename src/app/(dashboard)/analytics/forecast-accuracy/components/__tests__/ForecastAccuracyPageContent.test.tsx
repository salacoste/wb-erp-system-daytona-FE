import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { ForecastAccuracyPageContent } from '../ForecastAccuracyPageContent'
import type { ForecastAccuracyResponse } from '@/types/ai/forecast-accuracy'

vi.mock('@/hooks/useForecastAccuracy', () => ({
  useForecastAccuracy: vi.fn(),
}))

import { useForecastAccuracy } from '@/hooks/useForecastAccuracy'

const mockUseForecastAccuracy = vi.mocked(useForecastAccuracy)

const mockData: ForecastAccuracyResponse = {
  totalValidated: 95,
  avgMAPE: 14.2,
  avgMAE: 3.5,
  avgBias: 0.8,
  byHorizon: [
    { horizonDays: 7, mape: 10.5, mae: 2.0, count: 45 },
    { horizonDays: 14, mape: 18.0, mae: 5.0, count: 30 },
  ],
  bySKU: [
    { nmId: 123456, mape: 12.0, mae: 3.0, count: 8 },
    { nmId: 789012, mape: 20.0, mae: 4.0, count: 12 },
  ],
}

describe('ForecastAccuracyPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useForecastAccuracy>)
    const { container } = render(<ForecastAccuracyPageContent />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows error alert on fetch failure', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
    } as ReturnType<typeof useForecastAccuracy>)
    render(<ForecastAccuracyPageContent />)
    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
    expect(screen.getByText(/Network error/)).toBeInTheDocument()
  })

  it('renders page title and metric cards with data', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useForecastAccuracy>)
    render(<ForecastAccuracyPageContent />)
    expect(screen.getByText('Точность прогнозов')).toBeInTheDocument()
    expect(screen.getByText('Валидировано')).toBeInTheDocument()
    expect(screen.getByText('Средний MAPE')).toBeInTheDocument()
  })

  it('renders horizon breakdown section', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useForecastAccuracy>)
    render(<ForecastAccuracyPageContent />)
    expect(screen.getByText('По горизонту прогноза')).toBeInTheDocument()
  })

  it('renders SKU breakdown section', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useForecastAccuracy>)
    render(<ForecastAccuracyPageContent />)
    expect(screen.getByText('По SKU (топ-20)')).toBeInTheDocument()
  })
})
