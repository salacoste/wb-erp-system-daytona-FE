import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchAnalyticsStatusCard } from '../SearchAnalyticsStatusCard'
import type { DashboardSearchAnalytics } from '../../types/monitoring'

function makeData(status: DashboardSearchAnalytics['status']): DashboardSearchAnalytics {
  const complete = status === 'complete' || status === 'no_data'
  const known = status !== 'unknown' && status !== 'error'
  return {
    totalQueries: status === 'no_data' ? 0 : 4,
    totalSearchImpressions: status === 'no_data' ? 0 : 100,
    totalSearchClicks: 10,
    totalSearchOrders: 2,
    avgSearchPosition: 12,
    topQueries: [],
    status,
    coverage: {
      coverageKnown: known,
      requestedDayCount: 2,
      coveredDayCount: complete ? 2 : status === 'partial' ? 1 : 0,
      missingDayCount: complete ? 0 : status === 'partial' ? 1 : 2,
      coverageComplete: complete,
      coveredDates: complete
        ? ['2026-05-01', '2026-05-02']
        : status === 'partial'
          ? ['2026-05-01']
          : [],
      missingDates: complete
        ? []
        : status === 'partial'
          ? ['2026-05-02']
          : ['2026-05-01', '2026-05-02'],
      status: status === 'no_data' ? 'complete' : status,
    },
  }
}

describe('SearchAnalyticsStatusCard', () => {
  it.each([
    ['complete', 'Полные данные'],
    ['no_data', 'Нет строк — период покрыт полностью'],
    ['partial', 'Частичные данные'],
    ['uncovered', 'Период не покрыт'],
    ['unknown', 'Полнота неизвестна'],
    ['error', 'Ошибка получения'],
  ] as const)('renders %s as a distinct public state', (status, label) => {
    render(<SearchAnalyticsStatusCard data={makeData(status)} />)
    expect(screen.getByTestId('dashboard-search-status')).toHaveTextContent(label)
  })

  it('does not collapse covered zero rows into an unavailable state', () => {
    render(<SearchAnalyticsStatusCard data={makeData('no_data')} />)
    expect(screen.getByText(/Запросов:/)).toHaveTextContent('0')
    expect(screen.queryByText(/Метрики скрыты/)).not.toBeInTheDocument()
  })

  it('fails closed when dashboard search metadata is absent', () => {
    render(<SearchAnalyticsStatusCard />)
    expect(screen.getByTestId('dashboard-search-status')).toHaveTextContent('Полнота неизвестна')
    expect(screen.getByText(/Метрики скрыты/)).toBeInTheDocument()
  })

  // Pass-1 M1: the LIVE fail-closed shape is a PRESENT block with unknown/error coverage
  // (the normalizer never emits null). It must not render placeholder 0/0 counts as data.
  it('unknown coverage with a present block hides the 0/0 placeholder alert', () => {
    render(<SearchAnalyticsStatusCard data={makeData('unknown')} />)
    expect(screen.getByTestId('dashboard-search-status')).toHaveTextContent('Полнота неизвестна')
    expect(screen.getByText(/Метрики скрыты/)).toBeInTheDocument()
    expect(screen.queryByText(/Покрыто .*\/.*дней/)).not.toBeInTheDocument()
  })

  it('error coverage renders a destructive message without day counts', () => {
    render(<SearchAnalyticsStatusCard data={makeData('error')} />)
    expect(screen.getByText('Ошибка получения')).toBeInTheDocument()
    expect(screen.getByText(/Не удалось получить реестр покрытия/)).toBeInTheDocument()
    expect(screen.queryByText(/Покрыто .*\/.*дней/)).not.toBeInTheDocument()
  })
})
