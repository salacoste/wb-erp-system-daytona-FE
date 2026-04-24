/**
 * Unit tests for WeeklyChartTooltip
 * Epic 92-FE Story 92.4: M-2 fix — defensive payload guard + 3-row rendering.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { WeeklyChartTooltip } from '../monitor-weekly-chart-tooltip'

describe('WeeklyChartTooltip', () => {
  it('returns null when inactive', () => {
    const { container } = renderWithProviders(<WeeklyChartTooltip active={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when payload is empty', () => {
    const { container } = renderWithProviders(<WeeklyChartTooltip active payload={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when payload row is malformed (M-2 defensive guard)', () => {
    const { container } = renderWithProviders(
      <WeeklyChartTooltip
        active
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload={[{ dataKey: 'x', value: 0, payload: null as any }]}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders 3 metric rows with Russian labels for active data', () => {
    const payload = [
      {
        dataKey: 'sales',
        value: 12,
        payload: { date: '2026-04-20', label: 'Пн 20.04', sales: 12, orders: 14, returns: 2 },
      },
    ]
    renderWithProviders(<WeeklyChartTooltip active payload={payload} />)

    expect(screen.getByText('Продажи:')).toBeInTheDocument()
    expect(screen.getByText('Заказы:')).toBeInTheDocument()
    expect(screen.getByText('Возвраты:')).toBeInTheDocument()
    // Values rendered as locale strings — use regex to match Russian numeral format
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('formats the date header in full Russian (20 апреля 2026)', () => {
    const payload = [
      {
        dataKey: 'sales',
        value: 5,
        payload: { date: '2026-04-20', label: 'Пн 20.04', sales: 5, orders: 6, returns: 1 },
      },
    ]
    renderWithProviders(<WeeklyChartTooltip active payload={payload} />)

    expect(screen.getByText('20 апреля 2026')).toBeInTheDocument()
  })
})
