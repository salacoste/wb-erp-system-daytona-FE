/**
 * Unit Tests for Forecast Accuracy Page
 * Epic 123-FE Story 123.4: AI Forecast Accuracy Dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import ForecastAccuracyPage from '../page'

// --- Mock hook ---
const mockUseForecastAccuracy = vi.fn()

vi.mock('@/hooks/useForecastAccuracy', () => ({
  useForecastAccuracy: (...args: unknown[]) => mockUseForecastAccuracy(...args),
  forecastAccuracyKeys: {
    all: (cabinetId: string | null) => ['ai', 'forecast-accuracy', cabinetId],
  },
}))

// --- Mock child components ---
vi.mock('../components/AccuracyMetricsCards', () => ({
  AccuracyMetricsCards: ({
    totalValidated,
    avgMAPE,
  }: {
    totalValidated: number
    avgMAPE: number
    avgMAE: number
    avgBias: number
  }) => (
    <div data-testid="accuracy-metrics-cards">
      MetricsCards (validated={totalValidated}, mape={avgMAPE})
    </div>
  ),
}))

vi.mock('../components/HorizonBreakdownTable', () => ({
  HorizonBreakdownTable: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="horizon-breakdown-table">HorizonBreakdown ({rows.length} rows)</div>
  ),
}))

vi.mock('../components/SkuBreakdownTable', () => ({
  SkuBreakdownTable: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="sku-breakdown-table">SkuBreakdown ({rows.length} rows)</div>
  ),
}))

// --- Mock data ---
const mockForecastData = {
  totalValidated: 150,
  avgMAPE: 12.5,
  avgMAE: 3.2,
  avgBias: -0.8,
  byHorizon: [
    { horizon: '7d', mape: 10.1, mae: 2.5, bias: -0.3, count: 50 },
    { horizon: '14d', mape: 13.8, mae: 3.8, bias: -1.1, count: 50 },
    { horizon: '30d', mape: 15.2, mae: 4.1, bias: -1.0, count: 50 },
  ],
  bySKU: [
    { nmId: 12345, name: 'Product A', mape: 8.3, mae: 1.2, bias: 0.5, count: 10 },
    { nmId: 67890, name: 'Product B', mape: 11.7, mae: 2.9, bias: -0.2, count: 8 },
  ],
}

function setupMocks(overrides?: Record<string, unknown>) {
  mockUseForecastAccuracy.mockReturnValue({
    data: mockForecastData,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  })
}

function renderPage() {
  return renderWithProviders(<ForecastAccuracyPage />)
}

// --- Rendering ---

describe('ForecastAccuracyPage - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders the page heading "Точность прогнозов"', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Точность прогнозов/, level: 1 })
    ).toBeInTheDocument()
  })

  it('renders AccuracyMetricsCards when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('accuracy-metrics-cards')).toBeInTheDocument()
  })

  it('renders HorizonBreakdownTable when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('horizon-breakdown-table')).toBeInTheDocument()
  })

  it('renders SkuBreakdownTable when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('sku-breakdown-table')).toBeInTheDocument()
  })

  it('renders "По горизонту прогноза" card title', () => {
    renderPage()
    expect(screen.getByText('По горизонту прогноза')).toBeInTheDocument()
  })

  it('renders "По SKU (топ-20)" card title', () => {
    renderPage()
    expect(screen.getByText('По SKU (топ-20)')).toBeInTheDocument()
  })
})

// --- Loading State ---

describe('ForecastAccuracyPage - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({ data: undefined, isLoading: true })
  })

  it('renders skeleton loading state without crashing', () => {
    renderPage()
    // Skeleton renders without heading text
    expect(screen.queryByText('Точность прогнозов')).not.toBeInTheDocument()
  })

  it('does not render data components during loading', () => {
    renderPage()
    expect(screen.queryByTestId('accuracy-metrics-cards')).not.toBeInTheDocument()
    expect(screen.queryByTestId('horizon-breakdown-table')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sku-breakdown-table')).not.toBeInTheDocument()
  })
})

// --- Error State ---

describe('ForecastAccuracyPage - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Сервер недоступен'),
    })
  })

  it('renders error alert with title', () => {
    renderPage()
    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
  })

  it('renders error description text', () => {
    renderPage()
    expect(screen.getByText(/Не удалось загрузить данные точности прогнозов/)).toBeInTheDocument()
  })

  it('displays the error message', () => {
    renderPage()
    expect(screen.getByText(/Сервер недоступен/)).toBeInTheDocument()
  })

  it('does not render data components on error', () => {
    renderPage()
    expect(screen.queryByTestId('accuracy-metrics-cards')).not.toBeInTheDocument()
  })
})

// --- Empty / No Data State ---

describe('ForecastAccuracyPage - No Data State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({ data: undefined, isLoading: false, isError: false, error: null })
  })

  it('renders nothing when data is null', () => {
    const { container } = renderPage()
    expect(container.innerHTML).toBe('')
  })
})

// --- Accessibility ---

describe('ForecastAccuracyPage - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('has exactly one h1 heading', () => {
    renderPage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('unmounts without errors', () => {
    const { unmount } = renderPage()
    expect(() => unmount()).not.toThrow()
  })
})
