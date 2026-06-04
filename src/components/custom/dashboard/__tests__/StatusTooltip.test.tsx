/**
 * Russian-locale guard for StatusTooltip's percentage (iter-110).
 *
 * The tooltip rendered `{data.percentage.toFixed(1)}%` (split-line dot-locale → "80.0%", no NBSP) →
 * formatPercentage(data.percentage, 1) → "80,0 %" (comma + NBSP). percentage is percent-units 0-100,
 * fractional (1 decimal). StatusTooltip is a recharts custom tooltip (active/payload props) so it's
 * unit-testable directly without hover. Implements the it.todo placeholders in OrdersStatusBreakdown.test.
 * `\s` matches the ru-RU NBSP.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusTooltip } from '../StatusTooltip'

const payloadFor = (percentage: number, count = 400) => [
  { payload: { status: 'complete' as const, count, percentage } },
]

describe('StatusTooltip — percentage locale', () => {
  it('renders whole-ish percentage as "80,0 %" (comma + NBSP)', () => {
    render(<StatusTooltip active payload={payloadFor(80.0)} />)
    expect(screen.getByText(/^80,0\s%$/)).toBeInTheDocument()
  })

  it('renders fractional percentage as "6,4 %"', () => {
    render(<StatusTooltip active payload={payloadFor(6.4)} />)
    expect(screen.getByText(/^6,4\s%$/)).toBeInTheDocument()
  })

  it('renders nothing when inactive', () => {
    const { container } = render(<StatusTooltip active={false} payload={payloadFor(80)} />)
    expect(container).toBeEmptyDOMElement()
  })
})
