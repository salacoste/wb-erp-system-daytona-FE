/**
 * Unit tests for BuyoutDailyTrendTooltip — Epic 169.4 dark-safety pins
 *
 * Tooltip surface must use the popover token (not bg-white) so dark mode renders correctly
 * (MarginTrendTooltip canonical pattern).
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BuyoutDailyTrendTooltip } from '../BuyoutDailyTrendTooltip'

const mockPayload = [
  {
    dataKey: 'buyoutRate',
    value: 78.5,
    payload: {
      date: '2025-12-01',
      buyoutRate: 78.5,
      returnRate: 21.5,
      ordersCount: 120,
      returnsCount: 26,
    },
  },
]

describe('BuyoutDailyTrendTooltip (Epic 169.4 dark-safe token pins)', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(
      <BuyoutDailyTrendTooltip
        active={false}
        payload={mockPayload}
        visibleSeries={['buyoutRate']}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('uses bg-popover token, not bg-white (dark-mode safety)', () => {
    const { container } = render(
      <BuyoutDailyTrendTooltip active={true} payload={mockPayload} visibleSeries={['buyoutRate']} />
    )
    const root = container.firstElementChild
    expect(root?.classList.contains('bg-popover')).toBe(true)
    expect(root?.classList.contains('bg-white')).toBe(false)
  })

  it('uses foreground text token for the date header', () => {
    const { container } = render(
      <BuyoutDailyTrendTooltip active={true} payload={mockPayload} visibleSeries={['buyoutRate']} />
    )
    const header = container.querySelector('p')
    expect(header?.classList.contains('text-foreground')).toBe(true)
  })

  it('metric labels use muted-foreground token', () => {
    const { container } = render(
      <BuyoutDailyTrendTooltip
        active={true}
        payload={mockPayload}
        visibleSeries={['buyoutRate', 'returnRate', 'ordersCount']}
      />
    )
    const labels = Array.from(container.querySelectorAll('span')).filter(s =>
      s.classList.contains('text-muted-foreground')
    )
    expect(labels.length).toBeGreaterThanOrEqual(3)
  })
})
