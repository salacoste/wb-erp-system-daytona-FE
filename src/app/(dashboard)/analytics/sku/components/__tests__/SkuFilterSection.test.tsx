import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { SkuFilterSection } from '../SkuFilterSection'

vi.mock('@/components/custom/DateRangePicker', () => ({
  DateRangePicker: () => <div data-testid="date-range-picker" />,
}))

describe('SkuFilterSection owner states', () => {
  it('renders missing COGS as an explicit coverage gap instead of a zero margin', () => {
    render(
      <SkuFilterSection
        weekStart="2026-W30"
        weekEnd="2026-W30"
        onRangeChange={vi.fn()}
        historicalSppEnabled={true}
        onHistoricalSppChange={vi.fn()}
        stats={{
          total: 3,
          withCogs: 0,
          withoutCogs: 3,
          avgMargin: null,
          totalRevenue: 0,
          totalProfit: 0,
        }}
      />
    )

    expect(screen.getByText('Без себестоимости:').nextSibling).toHaveTextContent('3')
    expect(screen.getByText('операционная маржа').previousSibling).toHaveTextContent('—')
    expect(screen.getByText('Охват:').nextSibling).toHaveTextContent('0')
  })
})
