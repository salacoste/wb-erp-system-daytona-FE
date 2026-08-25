/**
 * Story 170.6-FE — selected scatter point detail (RTC).
 *
 * JSdom approach (declared per validator E3 — no chart tests existed before):
 * recharts ResponsiveContainer measures 0×0 in jsdom (no layout), so it is mocked
 * to clone its child chart with EXPLICIT width/height — the REAL ScatterChart/
 * Scatter/tooltip/onClick wiring then renders genuine SVG symbols we can click.
 * No other recharts piece is stubbed.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { cloneElement, isValidElement } from 'react'
import { OrganicVsAdScatter } from '../OrganicVsAdScatter'
import { PositionSpendChart } from '../PositionSpendChart'
import type { CrossReferenceItem } from '../../utils/cross-reference-utils'

vi.mock('recharts', async importOriginal => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      isValidElement(children)
        ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            width: 800,
            height: 350,
          })
        : null,
  }
})

function makeItem(o: Partial<CrossReferenceItem> = {}): CrossReferenceItem {
  return {
    nmId: 1,
    vendorCode: 'VC-1',
    totalOrders: 5,
    uniqueQueries: 3,
    adSpend: 100,
    adClicks: 10,
    adRevenue: 500,
    channel: 'both',
    ...o,
  }
}

function clickFirstSymbol(container: HTMLElement) {
  // recharts renders one .recharts-scatter-symbol per datum
  const symbol = container.querySelector<HTMLElement>('.recharts-scatter-symbol')
  if (!symbol) throw new Error('no .recharts-scatter-symbol rendered')
  fireEvent.click(symbol)
}

describe('OrganicVsAdScatter — selected point detail', () => {
  it('clicking a point shows the detail line with product identity + tooltip-precision values, then clears', () => {
    const { container } = render(
      <OrganicVsAdScatter items={[makeItem({ nmId: 777, vendorCode: 'VC-777', adSpend: 12345 })]} />
    )
    expect(screen.queryByTestId('scatter-selected-point')).not.toBeInTheDocument()
    clickFirstSymbol(container)
    const detail = screen.getByTestId('scatter-selected-point')
    expect(detail.textContent).toContain('VC-777')
    expect(detail.textContent).toContain('Заказы')
    expect(detail.textContent).toMatch(/5/)
    expect(detail.textContent).toMatch(/12[\s ]345/) // 12 345 ₽ tooltip precision (whole ₽, NBSP-agnostic)
    expect(detail.textContent).toContain('Клики')
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить выбранную точку' }))
    expect(screen.queryByTestId('scatter-selected-point')).not.toBeInTheDocument()
  })
})

describe('PositionSpendChart — selected point detail', () => {
  it('clicking a point shows the detail line (organic orders + ad spend), then clears', () => {
    const { container } = render(
      <PositionSpendChart
        items={[makeItem({ nmId: 1, adSpend: 100 }), makeItem({ nmId: 2, adSpend: 300 })]}
      />
    )
    expect(screen.queryByTestId('scatter-selected-point')).not.toBeInTheDocument()
    clickFirstSymbol(container)
    const detail = screen.getByTestId('scatter-selected-point')
    expect(detail.textContent).toContain('Органические заказы')
    expect(detail.textContent).toContain('Рекламный расход')
    expect(detail.textContent).toMatch(/₽/)
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить выбранную точку' }))
    expect(screen.queryByTestId('scatter-selected-point')).not.toBeInTheDocument()
  })
})
