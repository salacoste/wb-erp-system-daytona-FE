import { describe, it, expect } from 'vitest'
import { render } from '@/test/utils/test-utils'
import { CustomTooltip } from '../WaterfallTooltip'
import type { WaterfallChartDataPoint } from '../waterfall-chart-utils'

function makePoint(overrides: Partial<WaterfallChartDataPoint> = {}): WaterfallChartDataPoint {
  return {
    name: 'Выручка',
    value: 1000,
    start: 0,
    end: 1000,
    fill: '#22C55E',
    isProfit: false,
    isRevenue: true,
    percentage: 100,
    absoluteValue: 1000,
    ...overrides,
  }
}

describe('WaterfallTooltip CustomTooltip — zero vs missing (Story 163.4-FE / FR8)', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(
      <CustomTooltip active={false} payload={[{ payload: makePoint() }]} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a genuine zero absoluteValue as "0 ₽", NOT "—" (iter-58 regression)', () => {
    const { container } = render(
      <CustomTooltip active payload={[{ payload: makePoint({ absoluteValue: 0 }) }]} />
    )
    // Scope to the bold headline value (text-lg font-bold), not the name/percentage subtext.
    const valueEl = container.querySelector('.text-lg.font-bold')
    expect(valueEl?.textContent).toMatch(/0/)
    expect(valueEl?.textContent).toMatch(/₽/)
    // A genuine zero profit/value must not collapse to the missing-data dash.
    expect(valueEl?.textContent).not.toBe('—')
  })

  it('renders a positive absoluteValue with whole-ruble ₽ formatting', () => {
    const { container } = render(
      <CustomTooltip active payload={[{ payload: makePoint({ absoluteValue: 5000 }) }]} />
    )
    const valueEl = container.querySelector('.text-lg.font-bold')
    expect(valueEl?.textContent).toMatch(/5.*000/)
    expect(valueEl?.textContent).toMatch(/₽/)
  })

  it('renders a negative absoluteValue with a leading minus + ₽', () => {
    const { container } = render(
      <CustomTooltip active payload={[{ payload: makePoint({ absoluteValue: -750 }) }]} />
    )
    const valueEl = container.querySelector('.text-lg.font-bold')
    expect(valueEl?.textContent).toMatch(/^-|−/)
    expect(valueEl?.textContent).toMatch(/750/)
    expect(valueEl?.textContent).toMatch(/₽/)
  })
})
