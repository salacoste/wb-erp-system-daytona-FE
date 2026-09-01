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

  it('renders valid zero error as 0% and keeps it distinct from an undefined metric', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: {
        ...mockData,
        avgMAPE: 0,
        byHorizon: [{ horizonDays: 7, mape: 0, mae: 0, count: 45 }],
        bySKU: [{ nmId: 123456, mape: 0, mae: 0, count: 8 }],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useForecastAccuracy>)

    render(<ForecastAccuracyPageContent />)

    expect(screen.getAllByText(/0(?:[,.]0)?\s*%/).length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByText('—')).not.toBeInTheDocument()
    expect(screen.queryByText('Ошибка загрузки')).not.toBeInTheDocument()
  })

  it('renders an undefined metric as a dash instead of a valid zero percentage', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: { ...mockData, avgMAPE: null },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useForecastAccuracy>)

    render(<ForecastAccuracyPageContent />)

    const mapeHeading = screen.getByText('Средний MAPE')
    expect(mapeHeading.closest('[class*="rounded-xl"]')).toHaveTextContent('—')
  })

  it('labels a zero-observation response as insufficient sample instead of successful accuracy', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: {
        ...mockData,
        totalValidated: 0,
        avgMAPE: null,
        avgMAE: null,
        avgBias: null,
        byHorizon: [],
        bySKU: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useForecastAccuracy>)

    render(<ForecastAccuracyPageContent />)

    expect(screen.getByText('Недостаточно данных для оценки')).toBeInTheDocument()
    expect(screen.getByText('Нет данных по горизонтам')).toBeInTheDocument()
    expect(screen.getByText('Нет данных по SKU')).toBeInTheDocument()
  })

  it('keeps the populated horizon breakdown when the SKU breakdown is unavailable', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: { ...mockData, bySKU: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useForecastAccuracy>)

    render(<ForecastAccuracyPageContent />)

    expect(screen.getByRole('cell', { name: '7' })).toBeInTheDocument()
    expect(screen.getByText('Нет данных по SKU')).toBeInTheDocument()
    expect(screen.getByText('По SKU (топ-20)')).toBeInTheDocument()
  })

  it('explains extreme MAPE values so users do not read outliers as normal accuracy', () => {
    mockUseForecastAccuracy.mockReturnValue({
      data: {
        ...mockData,
        avgMAPE: 8374.35,
        byHorizon: [{ horizonDays: 7, mape: 8374.35, mae: 669.11, count: 103 }],
        bySKU: [{ nmId: 395995092, mape: 9999.99, mae: 712.14, count: 7 }],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useForecastAccuracy>)

    render(<ForecastAccuracyPageContent />)

    expect(screen.getByText('Очень высокая MAPE')).toBeInTheDocument()
    expect(screen.getByText(/фактические продажи близки к нулю/)).toBeInTheDocument()
    expect(screen.getByText(/Проверяйте MAE и количество наблюдений/)).toBeInTheDocument()
  })
})
