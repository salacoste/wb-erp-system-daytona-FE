import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResponsiveChartFrame } from './ResponsiveChartFrame'

describe('ResponsiveChartFrame', () => {
  it('provides a positive-size frame for Recharts responsive containers', () => {
    render(
      <ResponsiveChartFrame label="Тестовый график" className="h-48">
        <div className="recharts-responsive-container" />
      </ResponsiveChartFrame>
    )

    const frame = screen.getByRole('img', { name: 'Тестовый график' })
    expect(frame).toHaveClass('min-h-[240px]')
    expect(frame).toHaveClass('w-full')
    expect(frame).toHaveClass('[&_.recharts-responsive-container]:min-h-[inherit]')
  })

  it('keeps sizing reusable without forcing image semantics or default min-height', () => {
    render(
      <ResponsiveChartFrame minHeightClassName="min-h-[320px]" role="group">
        <div data-testid="chart-child" />
      </ResponsiveChartFrame>
    )

    const frame = screen.getByRole('group')
    expect(frame).toHaveClass('min-h-[320px]')
    expect(frame).not.toHaveClass('min-h-[240px]')
  })
})
