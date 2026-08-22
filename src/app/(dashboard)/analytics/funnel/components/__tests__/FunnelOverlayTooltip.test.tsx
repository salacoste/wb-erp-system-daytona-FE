import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ChartLegend, OverlayTooltip } from '../FunnelOverlayTooltip'
import { fmtCurrency, OVERLAY_SERIES } from '../funnel-overlay-config'

describe('FunnelOverlayTooltip', () => {
  const basePayload = [
    { dataKey: 'openCardCount', value: 1500, color: 'var(--color-chart-1)' },
    { dataKey: 'ordersCount', value: 200, color: 'var(--color-chart-2)' },
    { dataKey: 'buyoutCount', value: 150, color: 'var(--color-chart-3)' },
  ]

  it('returns null while inactive or without a date label', () => {
    const { container, rerender } = render(
      <OverlayTooltip
        active={false}
        payload={basePayload}
        label="2026-03-01"
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )
    expect(container.firstChild).toBeNull()

    rerender(
      <OverlayTooltip
        active
        payload={basePayload}
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('formats the date in Russian and renders only visible funnel series', () => {
    render(
      <OverlayTooltip
        active
        payload={basePayload}
        label="2026-03-01"
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )

    expect(screen.getByText(/1 марта/)).toBeVisible()
    expect(screen.getByText('Просмотры:')).toBeVisible()
    expect(screen.getByText(/1.*500/)).toBeVisible()
    expect(screen.queryByText('Заказы:')).not.toBeInTheDocument()
  })
  it('uses the same full advertising precision formatter as chart evidence', () => {
    render(
      <OverlayTooltip
        active
        label="2026-03-01"
        visible={['adSpend']}
        showAdOverlay
        payload={[
          {
            dataKey: 'adSpend',
            value: 4567.89,
            color: 'var(--color-chart-2)',
          },
        ]}
      />
    )

    const formatted = fmtCurrency(4567.89)
    expect(screen.getByText((_, element) => element?.textContent === formatted)).toBeVisible()
  })

  it('renders Недоступно instead of a zero for a missing series value', () => {
    render(
      <OverlayTooltip
        active
        label="2026-03-01"
        visible={['adSpend']}
        showAdOverlay
        payload={[
          {
            dataKey: 'adSpend',
            value: undefined,
            color: 'var(--color-chart-2)',
          },
        ]}
      />
    )

    expect(screen.getByText('Недоступно')).toBeVisible()
    expect(screen.queryByText(/0,00 ₽/)).not.toBeInTheDocument()
  })

  it('renders the tooltip container with the popover surface token', () => {
    const { container } = render(
      <OverlayTooltip
        active
        label="2026-03-01"
        payload={[{ dataKey: 'openCardCount', value: 1500, color: 'var(--color-chart-1)' }]}
        visible={['openCardCount']}
        showAdOverlay
      />
    )

    const tooltipContainer = container.querySelector('div.rounded-lg.border')
    expect(tooltipContainer).not.toBeNull()
    expect(tooltipContainer).toHaveClass('bg-popover')
    expect(tooltipContainer).toHaveClass('shadow-lg')
    expect(tooltipContainer).not.toHaveClass('bg-background')
    expect(tooltipContainer).not.toHaveClass('shadow-sm')
  })

  it('preserves direct legend visibility and toggle behavior', () => {
    const onToggle = vi.fn()
    const series = OVERLAY_SERIES.filter(item => item.key !== 'adSpend')
    render(<ChartLegend series={series} visible={['openCardCount']} onToggle={onToggle} />)

    expect(screen.getByRole('group', { name: 'Переключатели метрик' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Просмотры' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Заказы' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }))
    expect(onToggle).toHaveBeenCalledWith('ordersCount')
  })
})
