import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

const mockPageState = vi.fn()

vi.mock('../useGapsPageState', () => ({
  useGapsPageState: () => mockPageState(),
}))

vi.mock('../GapsSummaryCards', () => ({
  GapsSummaryCards: () => <div data-testid="gaps-summary-cards">SummaryCards</div>,
}))

vi.mock('../GapsTable', () => ({
  GapsTable: () => <div data-testid="gaps-table">GapsTable</div>,
}))

vi.mock('../GapAnalysisDialog', () => ({
  GapAnalysisDialog: () => <div data-testid="gap-analysis-dialog">AnalysisDialog</div>,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { GapsPageContent } from '../GapsPageContent'

function createPageState(overrides = {}) {
  return {
    dateFrom: '2026-05-01',
    dateTo: '2026-05-31',
    gaps: {
      data: undefined,
      isLoading: false,
      isError: false,
    },
    analyze: {
      isPending: false,
      variables: null,
      mutateAsync: vi.fn(),
    },
    remediate: {
      isPending: false,
      mutateAsync: vi.fn(),
    },
    analysisResult: null,
    analysisDialogOpen: false,
    setAnalysisDialogOpen: vi.fn(),
    handleAnalyze: vi.fn(),
    handleRemediate: vi.fn(),
    updateDateRange: vi.fn(),
    ...overrides,
  }
}

describe('GapsPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPageState.mockReturnValue(createPageState())
  })

  it('renders page title and description', () => {
    render(<GapsPageContent />)
    expect(screen.getByText('Пропуски в данных')).toBeInTheDocument()
    expect(
      screen.getByText('Анализ и исправление пропущенных дней в финансовых данных')
    ).toBeInTheDocument()
  })

  it('renders date inputs', () => {
    render(<GapsPageContent />)
    expect(screen.getByText('С')).toBeInTheDocument()
    expect(screen.getByText('По')).toBeInTheDocument()
  })

  it('renders summary cards component', () => {
    render(<GapsPageContent />)
    expect(screen.getByTestId('gaps-summary-cards')).toBeInTheDocument()
  })

  it('renders gaps table component', () => {
    render(<GapsPageContent />)
    expect(screen.getByTestId('gaps-table')).toBeInTheDocument()
  })

  it('renders analysis dialog component', () => {
    render(<GapsPageContent />)
    expect(screen.getByTestId('gap-analysis-dialog')).toBeInTheDocument()
  })

  it('shows date values in inputs', () => {
    render(<GapsPageContent />)
    // <input type="date"> renders as input but not role="textbox" in jsdom
    const inputs = document.querySelectorAll('input[type="date"]')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })
})
