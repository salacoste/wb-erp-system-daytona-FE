/**
 * Tests for ExpenseChartTooltip — Russian-locale percentage rendering.
 *
 * Regression: the "Доля" line rendered dot-locale `${data.percentage.toFixed(1)}%` ("12.5%");
 * now via formatPercentage (comma + NBSP). Inactive/empty → renders nothing.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpenseChartTooltip } from '../ExpenseChartTooltip'
import type { ExpenseChartDataItem } from '../expense-chart-config'

function payloadFor(percentage: number) {
  return [
    {
      payload: {
        key: 'cogs',
        name: 'COGS',
        value: 1000,
        percentage,
        color: 'var(--color-chart-1)',
      } as ExpenseChartDataItem,
    },
  ]
}

describe('ExpenseChartTooltip — Russian locale', () => {
  it('renders the share percentage in comma+NBSP locale, not dot-locale', () => {
    render(<ExpenseChartTooltip active payload={payloadFor(12.5)} />)
    expect(screen.getByText(/12,5\s+%/)).toBeInTheDocument()
    expect(screen.queryByText('12.5%')).not.toBeInTheDocument()
  })

  it('renders nothing when inactive', () => {
    const { container } = render(<ExpenseChartTooltip active={false} payload={payloadFor(12.5)} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when payload is empty', () => {
    const { container } = render(<ExpenseChartTooltip active payload={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
