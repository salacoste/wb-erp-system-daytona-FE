import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchCoverageNotice } from '../SearchCoverageNotice'
import type { SearchOrdersSummary } from '@/types/search-analytics'
import { unknownSearchCoverage } from '@/lib/api/search-coverage-normalizer'

function makeSummary(overrides: Partial<SearchOrdersSummary> = {}): SearchOrdersSummary {
  return {
    totalSearchOrders: 10,
    searchOrderShare: 25,
    ...unknownSearchCoverage(),
    ...overrides,
  }
}

describe('SearchCoverageNotice', () => {
  it('renders nothing for a known complete range (no noise on healthy data)', () => {
    const { container } = render(
      <SearchCoverageNotice
        summary={makeSummary({
          coverageKnown: true,
          requestedDayCount: 3,
          coveredDayCount: 3,
          missingDayCount: 0,
          coverageComplete: true,
          coveredDates: ['2026-05-01', '2026-05-02', '2026-05-03'],
          missingDates: [],
          status: 'complete',
        })}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a warning with counts and missing dates for a partial range', () => {
    render(
      <SearchCoverageNotice
        summary={makeSummary({
          coverageKnown: true,
          requestedDayCount: 3,
          coveredDayCount: 2,
          missingDayCount: 1,
          coverageComplete: false,
          coveredDates: ['2026-05-01', '2026-05-02'],
          missingDates: ['2026-05-03'],
          status: 'partial',
        })}
      />
    )
    expect(screen.getByTestId('search-coverage-notice')).toBeInTheDocument()
    expect(screen.getByText('Неполное покрытие поисковой аналитики')).toBeInTheDocument()
    expect(screen.getByText(/Покрыто 2 из 3/)).toBeInTheDocument()
    expect(screen.getByText(/2026-05-03/)).toBeInTheDocument()
    expect(
      screen.getByText(/Метрики и доли рассчитаны только по покрытым датам/)
    ).toBeInTheDocument()
  })

  it('renders the unconfirmed copy when coverage metadata is absent or inconsistent', () => {
    render(<SearchCoverageNotice summary={makeSummary({ coverageKnown: false })} />)
    expect(screen.getByText('Полнота поисковой аналитики не подтверждена')).toBeInTheDocument()
    expect(
      screen.getByText(/Метаданные покрытия отсутствуют или противоречивы/)
    ).toBeInTheDocument()
  })

  it('distinguishes an explicit retrieval error from unknown metadata', () => {
    render(
      <SearchCoverageNotice summary={makeSummary({ coverageKnown: false, status: 'error' })} />
    )
    expect(screen.getByText('Ошибка проверки покрытия поисковой аналитики')).toBeInTheDocument()
    expect(screen.getByText(/Не удалось получить реестр покрытия/)).toBeInTheDocument()
  })

  it('says missing dates are undetermined when the list is empty on an incomplete range', () => {
    render(
      <SearchCoverageNotice
        summary={makeSummary({
          coverageKnown: true,
          requestedDayCount: 2,
          coveredDayCount: 1,
          missingDayCount: 1,
          coverageComplete: false,
          coveredDates: ['2026-05-01'],
          missingDates: [],
          status: 'partial',
        })}
      />
    )
    expect(screen.getByText(/Даты без покрытия: не определены/)).toBeInTheDocument()
  })
})
