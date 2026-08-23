import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import type { FinancialGapsResponse } from '@/types/financial-gaps'

const { mockPageState, mockDialogProps } = vi.hoisted(() => ({
  mockPageState: vi.fn(),
  mockDialogProps: vi.fn(),
}))

vi.mock('../useGapsPageState', () => ({
  useGapsPageState: () => mockPageState(),
}))

vi.mock('../GapsSummaryCards', () => ({
  GapsSummaryCards: ({ data }: { data: FinancialGapsResponse | undefined }) => (
    <div data-testid="gaps-summary-cards">
      {data ? `Покрытие ${data.coverage_percent}%` : 'SummaryCards'}
    </div>
  ),
}))

vi.mock('../GapsTable', () => ({
  GapsTable: ({
    missingDates,
    onAnalyze,
  }: {
    missingDates: FinancialGapsResponse['missing_dates']
    onAnalyze: (missingDate: string, trigger: HTMLButtonElement) => void
  }) => (
    <div data-testid="gaps-table">
      {missingDates?.map(item => item.missing_date).join(', ') || 'GapsTable'}
      {missingDates?.[0] && (
        <button onClick={event => onAnalyze(missingDates[0].missing_date, event.currentTarget)}>
          Анализ за {missingDates[0].missing_date}
        </button>
      )}
    </div>
  ),
}))

vi.mock('../GapAnalysisDialog', () => ({
  GapAnalysisDialog: (props: unknown) => {
    mockDialogProps(props)
    return <div data-testid="gap-analysis-dialog">AnalysisDialog</div>
  },
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
      isFetching: false,
      isPending: false,
      isPaused: false,
      refetch: vi.fn(),
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

  it('links date labels to their inputs (htmlFor ↔ id)', () => {
    render(<GapsPageContent />)
    expect(screen.getByLabelText('С')).toHaveAttribute('id', 'gaps-date-from')
    expect(screen.getByLabelText('По')).toHaveAttribute('id', 'gaps-date-to')
  })

  it('stacks the date toolbar and lets inputs fill narrow screens', () => {
    render(<GapsPageContent />)

    const dateFrom = screen.getByLabelText('С')
    const dateTo = screen.getByLabelText('По')
    const toolbar = dateFrom.parentElement?.parentElement

    expect(toolbar).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2')
    expect(dateFrom).toHaveClass('w-full')
    expect(dateTo).toHaveClass('w-full')
  })

  it('distinguishes a terminal query failure from a valid no-gaps result and retries', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    mockPageState.mockReturnValue(
      createPageState({
        gaps: {
          data: undefined,
          isLoading: false,
          isError: true,
          isFetching: false,
          refetch,
        },
      })
    )

    render(<GapsPageContent />)

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить данные о пропусках')
    expect(screen.queryByTestId('gaps-summary-cards')).not.toBeInTheDocument()
    expect(screen.queryByTestId('gaps-table')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('keeps retained evidence visible while disclosing a failed background refresh', () => {
    const retainedData: FinancialGapsResponse = {
      cabinet_id: 'cabinet-1',
      date_from: '2026-05-01',
      date_to: '2026-05-31',
      total_days: 31,
      existing_days: 30,
      missing_days: 1,
      coverage_percent: 96.8,
      missing_dates: [{ missing_date: '2026-05-10', day_of_week: 6, day_name: 'Saturday' }],
    }

    mockPageState.mockReturnValue(
      createPageState({
        gaps: {
          data: retainedData,
          isLoading: false,
          isError: true,
          isFetching: false,
          refetch: vi.fn(),
        },
      })
    )

    render(<GapsPageContent />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Показаны ранее загруженные данные; обновление завершилось ошибкой'
    )
    expect(screen.getByTestId('gaps-summary-cards')).toHaveTextContent('Покрытие 96.8%')
    expect(screen.getByTestId('gaps-table')).toHaveTextContent('2026-05-10')
  })

  it('politely announces a normal background refresh while retaining evidence', () => {
    const retainedData: FinancialGapsResponse = {
      cabinet_id: 'cabinet-1',
      date_from: '2026-05-01',
      date_to: '2026-05-31',
      total_days: 31,
      existing_days: 30,
      missing_days: 1,
      coverage_percent: 96.8,
      missing_dates: [{ missing_date: '2026-05-10', day_of_week: 6, day_name: 'Saturday' }],
    }
    mockPageState.mockReturnValue(
      createPageState({
        gaps: {
          data: retainedData,
          isLoading: false,
          isError: false,
          isFetching: true,
          isPending: false,
          isPaused: false,
          refetch: vi.fn(),
        },
      })
    )

    render(<GapsPageContent />)

    expect(screen.getByRole('status')).toHaveTextContent('Обновляем данные о пропусках')
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('gaps-summary-cards')).toHaveTextContent('Покрытие 96.8%')
    expect(screen.getByTestId('gaps-table')).toHaveTextContent('2026-05-10')
  })

  it('does not present a paused initial query as a successful no-gaps result', () => {
    mockPageState.mockReturnValue(
      createPageState({
        gaps: {
          data: undefined,
          isLoading: false,
          isError: false,
          isFetching: false,
          isPending: true,
          isPaused: true,
          refetch: vi.fn(),
        },
      })
    )

    render(<GapsPageContent />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Загрузка данных приостановлена. Проверьте подключение к сети'
    )
    expect(screen.queryByTestId('gaps-summary-cards')).not.toBeInTheDocument()
    expect(screen.queryByTestId('gaps-table')).not.toBeInTheDocument()
  })

  it('captures the exact analyze action as the dialog return-focus target', async () => {
    const user = userEvent.setup()
    const handleAnalyze = vi.fn()
    const retainedData: FinancialGapsResponse = {
      cabinet_id: 'cabinet-1',
      date_from: '2026-05-01',
      date_to: '2026-05-31',
      total_days: 31,
      existing_days: 30,
      missing_days: 1,
      coverage_percent: 96.8,
      missing_dates: [{ missing_date: '2026-05-10', day_of_week: 6, day_name: 'Saturday' }],
    }
    mockPageState.mockReturnValue(
      createPageState({
        gaps: {
          data: retainedData,
          isLoading: false,
          isError: false,
          isFetching: false,
          isPending: false,
          isPaused: false,
          refetch: vi.fn(),
        },
        handleAnalyze,
      })
    )

    render(<GapsPageContent />)
    const analyzeAction = screen.getByRole('button', { name: 'Анализ за 2026-05-10' })
    await user.click(analyzeAction)

    expect(handleAnalyze).toHaveBeenCalledWith('2026-05-10')
    expect(mockDialogProps.mock.lastCall?.[0].returnFocusRef.current).toBe(analyzeAction)
  })

  it.each([
    ['dateFrom', { dateFrom: '' }],
    ['dateTo', { dateTo: '' }],
  ])('does not present a successful no-gaps result when %s is missing', (_, dateOverride) => {
    mockPageState.mockReturnValue(createPageState(dateOverride))

    render(<GapsPageContent />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Укажите обе даты, чтобы выполнить анализ пропусков'
    )
    expect(screen.queryByTestId('gaps-summary-cards')).not.toBeInTheDocument()
    expect(screen.queryByTestId('gaps-table')).not.toBeInTheDocument()
  })

  it('communicates an active retry and prevents duplicate refetches', () => {
    const retainedData: FinancialGapsResponse = {
      cabinet_id: 'cabinet-1',
      date_from: '2026-05-01',
      date_to: '2026-05-31',
      total_days: 31,
      existing_days: 30,
      missing_days: 1,
      coverage_percent: 96.8,
      missing_dates: [],
    }
    mockPageState.mockReturnValue(
      createPageState({
        gaps: {
          data: retainedData,
          isLoading: false,
          isError: true,
          isFetching: true,
          refetch: vi.fn(),
        },
      })
    )

    render(<GapsPageContent />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Повторная загрузка…' })).toBeDisabled()
  })
})
