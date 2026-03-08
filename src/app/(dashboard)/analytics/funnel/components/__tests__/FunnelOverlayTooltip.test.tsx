import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OverlayTooltip, ChartLegend } from '../FunnelOverlayTooltip'
import { OVERLAY_SERIES } from '../funnel-overlay-config'

describe('OverlayTooltip', () => {
  const basePayload = [
    { dataKey: 'openCardCount', value: 1500, color: '#60A5FA' },
    { dataKey: 'ordersCount', value: 200, color: '#FB923C' },
    { dataKey: 'buyoutCount', value: 150, color: '#4ADE80' },
  ]

  it('returns null when not active', () => {
    const { container } = render(
      <OverlayTooltip
        active={false}
        payload={basePayload}
        label="2026-03-01"
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when no label', () => {
    const { container } = render(
      <OverlayTooltip
        active={true}
        payload={basePayload}
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders date in Russian locale', () => {
    render(
      <OverlayTooltip
        active={true}
        payload={basePayload}
        label="2026-03-01"
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )
    expect(screen.getByText(/1 марта/)).toBeInTheDocument()
  })

  it('only shows visible series', () => {
    render(
      <OverlayTooltip
        active={true}
        payload={basePayload}
        label="2026-03-01"
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )
    expect(screen.getByText('Просмотры:')).toBeInTheDocument()
    expect(screen.queryByText('Заказы:')).not.toBeInTheDocument()
    expect(screen.queryByText('Выкупы:')).not.toBeInTheDocument()
  })

  it('formats ad spend as currency when overlay active', () => {
    const payload = [...basePayload, { dataKey: 'adSpend', value: 12500, color: '#7C3AED' }]
    render(
      <OverlayTooltip
        active={true}
        payload={payload}
        label="2026-03-01"
        visible={['adSpend']}
        showAdOverlay={true}
      />
    )
    const text = screen.getByText(/12.*500.*₽/)
    expect(text).toBeInTheDocument()
  })

  it('formats funnel metrics as locale numbers', () => {
    render(
      <OverlayTooltip
        active={true}
        payload={basePayload}
        label="2026-03-01"
        visible={['openCardCount']}
        showAdOverlay={false}
      />
    )
    expect(screen.getByText(/1.*500/)).toBeInTheDocument()
  })
})

describe('ChartLegend', () => {
  const funnelSeries = OVERLAY_SERIES.filter(s => s.key !== 'adSpend')

  it('renders all series labels', () => {
    render(
      <ChartLegend
        series={funnelSeries}
        visible={['openCardCount', 'ordersCount', 'buyoutCount']}
        onToggle={() => {}}
      />
    )
    expect(screen.getByText('Просмотры')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Выкупы')).toBeInTheDocument()
  })

  it('sets aria-pressed based on visibility', () => {
    render(<ChartLegend series={funnelSeries} visible={['openCardCount']} onToggle={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'false')
  })

  it('applies opacity-40 class for hidden series', () => {
    render(<ChartLegend series={funnelSeries} visible={['openCardCount']} onToggle={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0].className).toContain('opacity-100')
    expect(buttons[1].className).toContain('opacity-40')
  })

  it('calls onToggle with correct key when clicked', () => {
    const onToggle = vi.fn()
    render(<ChartLegend series={funnelSeries} visible={['openCardCount']} onToggle={onToggle} />)
    fireEvent.click(screen.getByText('Заказы'))
    expect(onToggle).toHaveBeenCalledWith('ordersCount')
  })

  it('has group role with accessible label', () => {
    render(<ChartLegend series={funnelSeries} visible={[]} onToggle={() => {}} />)
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Переключатели метрик')
  })
})
