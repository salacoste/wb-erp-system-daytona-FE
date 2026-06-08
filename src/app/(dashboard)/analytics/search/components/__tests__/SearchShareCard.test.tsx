import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SearchShareCard } from '../SearchShareCard'
import type { SearchOrdersSummary } from '@/types/search-analytics'

function formatPercent(n: number | undefined | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n / 100)
}

const INFLATED_MSG = 'Доля >100% — это норма'

function makeSummary(overrides: Partial<SearchOrdersSummary> = {}): SearchOrdersSummary {
  return {
    totalSearchOrders: 100,
    searchOrderShare: 45.5,
    ...overrides,
  }
}

describe('SearchShareCard', () => {
  it('renders the card label "Доля поисковых заказов"', () => {
    render(
      <SearchShareCard
        summary={makeSummary()}
        formatPercent={formatPercent}
        inflatedMessage={INFLATED_MSG}
      />
    )
    expect(screen.getByText('Доля поисковых заказов')).toBeInTheDocument()
  })

  it('shows raw share when no deduplicated value', () => {
    render(
      <SearchShareCard
        summary={makeSummary({ searchOrderShare: 45.5 })}
        formatPercent={formatPercent}
        inflatedMessage={INFLATED_MSG}
      />
    )
    // formatPercent(45.5) => 45,5 %
    expect(screen.getByText('45,5 %')).toBeInTheDocument()
  })

  it('shows deduplicated share as primary when available', () => {
    render(
      <SearchShareCard
        summary={makeSummary({
          searchOrderShare: 188.6,
          searchOrderShareDeduplicated: 42.3,
        })}
        formatPercent={formatPercent}
        inflatedMessage={INFLATED_MSG}
      />
    )
    expect(screen.getByText('42,3 %')).toBeInTheDocument()
    // raw multi-attributed value shown as subtext
    expect(screen.getByText(/С мультиатрибуцией:/)).toBeInTheDocument()
  })

  it('shows inflated info icon when share >100% and flag set', () => {
    render(
      <SearchShareCard
        summary={makeSummary({
          searchOrderShare: 188.6,
          searchOrderShareInflated: true,
        })}
        formatPercent={formatPercent}
        inflatedMessage={INFLATED_MSG}
      />
    )
    expect(screen.getByText('188,6 %')).toBeInTheDocument()
  })

  it('shows dash when share is null', () => {
    render(
      <SearchShareCard
        summary={makeSummary({ searchOrderShare: null })}
        formatPercent={formatPercent}
        inflatedMessage={INFLATED_MSG}
      />
    )
    // The primary value renders '—'
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
