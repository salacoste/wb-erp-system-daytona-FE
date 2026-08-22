/**
 * GapsPageContent Unit Tests
 *
 * Verifies financial gaps page:
 * - Renders page header with title and description
 * - Renders date range inputs
 * - Renders summary cards
 * - Renders gaps table
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

vi.mock('../components/useGapsPageState', () => ({
  useGapsPageState: () => ({
    dateFrom: '2026-05-09',
    dateTo: '2026-06-08',
    gaps: {
      data: {
        total_days: 30,
        complete_days: 28,
        missing_count: 2,
        missing_dates: ['2026-05-15', '2026-05-20'],
      },
      isLoading: false,
    },
    analyze: { isPending: false, variables: null, mutateAsync: vi.fn() },
    remediate: { isPending: false, mutateAsync: vi.fn() },
    analysisResult: null,
    analysisDialogOpen: false,
    setAnalysisDialogOpen: vi.fn(),
    handleAnalyze: vi.fn(),
    handleRemediate: vi.fn(),
    updateDateRange: vi.fn(),
  }),
}))

vi.mock('../components/GapsSummaryCards', () => ({
  GapsSummaryCards: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="gaps-summary-cards">{isLoading ? 'Loading' : 'Summary'}</div>
  ),
}))

vi.mock('../components/GapsTable', () => ({
  GapsTable: ({
    missingDates,
    isLoading,
  }: {
    missingDates: string[] | undefined
    isLoading: boolean
  }) => (
    <div data-testid="gaps-table">
      {isLoading ? 'Loading table' : `${missingDates?.length ?? 0} gaps`}
    </div>
  ),
}))

vi.mock('../components/GapAnalysisDialog', () => ({
  GapAnalysisDialog: () => <div data-testid="gap-analysis-dialog" />,
}))

import { GapsPageContent } from '../components/GapsPageContent'

describe('GapsPageContent', () => {
  it('renders page title and description', () => {
    renderWithProviders(<GapsPageContent />)
    expect(screen.getByText('Пропуски в данных')).toBeInTheDocument()
    expect(
      screen.getByText('Анализ и исправление пропущенных дней в финансовых данных')
    ).toBeInTheDocument()
  })

  it('renders date range inputs', () => {
    renderWithProviders(<GapsPageContent />)
    // date inputs have value attribute; check labels are present
    expect(screen.getByText('С')).toBeInTheDocument()
    expect(screen.getByText('По')).toBeInTheDocument()
  })

  it('renders summary cards', () => {
    renderWithProviders(<GapsPageContent />)
    expect(screen.getByTestId('gaps-summary-cards')).toBeInTheDocument()
  })

  it('renders gaps table', () => {
    renderWithProviders(<GapsPageContent />)
    expect(screen.getByTestId('gaps-table')).toBeInTheDocument()
    expect(screen.getByText('2 gaps')).toBeInTheDocument()
  })

  it('renders analysis dialog', () => {
    renderWithProviders(<GapsPageContent />)
    expect(screen.getByTestId('gap-analysis-dialog')).toBeInTheDocument()
  })

  it('links date labels to their inputs (htmlFor ↔ id)', () => {
    renderWithProviders(<GapsPageContent />)
    expect(screen.getByLabelText('С')).toHaveAttribute('id', 'gaps-date-from')
    expect(screen.getByLabelText('По')).toHaveAttribute('id', 'gaps-date-to')
  })
})
