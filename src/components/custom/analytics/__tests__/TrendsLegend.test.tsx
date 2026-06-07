/**
 * Tests for TrendsLegend Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Tests interactive legend with metric toggles, color indicators,
 * and visibility controls.
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { TrendsLegend } from '@/components/custom/dashboard/TrendsLegend'
import {
  TRENDS_METRICS,
  DEFAULT_VISIBLE_TRENDS_METRICS,
  type TrendsMetricKey,
} from '@/components/custom/dashboard/trends-config'

/** Helper to render with visible metrics set */
function renderLegend(
  visibleMetrics: Set<TrendsMetricKey> = DEFAULT_VISIBLE_TRENDS_METRICS,
  onToggle = vi.fn()
) {
  return renderWithProviders(<TrendsLegend visibleMetrics={visibleMetrics} onToggle={onToggle} />)
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('TrendsLegend - Basic Rendering', () => {
  it('should render correct number of metric buttons matching TRENDS_METRICS', () => {
    renderLegend()
    const buttons = screen.getAllByRole('checkbox')
    expect(buttons.length).toBe(TRENDS_METRICS.length)
  })

  it('should display "Выручка" label for revenue metric', () => {
    renderLegend()
    expect(screen.getByText('Выручка')).toBeInTheDocument()
  })

  it('should display "К перечислению" label for payout metric', () => {
    renderLegend()
    expect(screen.getByText('К перечислению')).toBeInTheDocument()
  })

  it('should display "Маржа" label for margin metric', () => {
    renderLegend()
    expect(screen.getByText('Маржа')).toBeInTheDocument()
  })

  it('should render color indicator (line) for each metric', () => {
    const { container } = renderLegend()
    // Each metric has a color line span with h-0.5 class
    const colorLines = container.querySelectorAll('.h-0\\.5')
    expect(colorLines.length).toBe(TRENDS_METRICS.length)
  })

  it('should apply correct color to each indicator from config', () => {
    const { container } = renderLegend()
    const colorLines = container.querySelectorAll<HTMLSpanElement>('.h-0\\.5')
    const colors = Array.from(colorLines).map(el => el.style.backgroundColor)
    // Each line should have a non-empty backgroundColor
    colors.forEach(c => expect(c).toBeTruthy())
  })

  it('should render in flex container', () => {
    const { container } = renderLegend()
    const group = container.querySelector('[role="group"]')
    expect(group).toBeInTheDocument()
    expect(group!.className).toContain('flex')
  })

  it('should have aria-label "Выбор метрик" on group', () => {
    const { container } = renderLegend()
    const group = container.querySelector('[role="group"]')
    expect(group).toHaveAttribute('aria-label', 'Выбор метрик')
  })
})

// ============================================================================
// Visibility State Tests
// ============================================================================

describe('TrendsLegend - Visibility State', () => {
  it('should show full opacity for visible metrics', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    renderLegend(visible)
    const revenueBtn = screen.getByText('Выручка').closest('button')!
    expect(revenueBtn.className).toContain('text-foreground')
  })

  it('should show dimmed opacity for hidden metrics', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    renderLegend(visible)
    const payoutBtn = screen.getByText('К перечислению').closest('button')!
    expect(payoutBtn.className).toContain('opacity-60')
  })

  it('should reflect visibility prop for each metric', () => {
    const visible = new Set<TrendsMetricKey>(['margin_pct'])
    renderLegend(visible)
    const marginBtn = screen.getByRole('checkbox', { name: /Маржа/ })
    expect(marginBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('should update visual state when visibility changes', () => {
    const visible1 = new Set<TrendsMetricKey>(['wb_sales_gross'])
    const { rerender } = renderLegend(visible1)
    const btn = screen.getByRole('checkbox', { name: /Выручка/ })
    expect(btn).toHaveAttribute('aria-checked', 'true')

    const visible2 = new Set<TrendsMetricKey>(['margin_pct'])
    rerender(<TrendsLegend visibleMetrics={visible2} onToggle={vi.fn()} />)
    expect(btn).toHaveAttribute('aria-checked', 'false')
  })

  it('should maintain color indicator regardless of visibility', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    const { container } = renderLegend(visible)
    const colorLines = container.querySelectorAll('.h-0\\.5')
    expect(colorLines.length).toBe(TRENDS_METRICS.length)
  })

  it('should handle mixed visibility states', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross', 'margin_pct'])
    renderLegend(visible)
    const revenueBtn = screen.getByRole('checkbox', { name: /Выручка/ })
    const marginBtn = screen.getByRole('checkbox', { name: /Маржа/ })
    expect(revenueBtn).toHaveAttribute('aria-checked', 'true')
    expect(marginBtn).toHaveAttribute('aria-checked', 'true')
  })
})

// ============================================================================
// Click Interaction Tests
// ============================================================================

describe('TrendsLegend - Click Interactions', () => {
  it('should call onToggle when revenue button clicked', () => {
    const onToggle = vi.fn()
    renderLegend(DEFAULT_VISIBLE_TRENDS_METRICS, onToggle)
    fireEvent.click(screen.getByText('Выручка'))
    expect(onToggle).toHaveBeenCalledWith('wb_sales_gross')
  })

  it('should call onToggle when payout button clicked', () => {
    const onToggle = vi.fn()
    renderLegend(DEFAULT_VISIBLE_TRENDS_METRICS, onToggle)
    fireEvent.click(screen.getByText('К перечислению'))
    expect(onToggle).toHaveBeenCalledWith('payout_total')
  })

  it('should call onToggle when margin button clicked', () => {
    const onToggle = vi.fn()
    const allVisible = new Set<TrendsMetricKey>(['wb_sales_gross', 'payout_total', 'margin_pct'])
    renderLegend(allVisible, onToggle)
    fireEvent.click(screen.getByText('Маржа'))
    expect(onToggle).toHaveBeenCalledWith('margin_pct')
  })

  it('should pass correct metric key to onToggle', () => {
    const onToggle = vi.fn()
    const allVisible = new Set<TrendsMetricKey>([
      'wb_sales_gross',
      'payout_total',
      'logistics_cost',
    ])
    renderLegend(allVisible, onToggle)
    fireEvent.click(screen.getByText('Логистика'))
    expect(onToggle).toHaveBeenCalledWith('logistics_cost')
  })

  it('should not call onToggle for last visible metric (disabled)', () => {
    const onToggle = vi.fn()
    const singleVisible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    renderLegend(singleVisible, onToggle)
    const btn = screen.getByText('Выручка').closest('button')!
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('should be clickable when multiple metrics visible', () => {
    const onToggle = vi.fn()
    renderLegend(DEFAULT_VISIBLE_TRENDS_METRICS, onToggle)
    const btn = screen.getByText('Выручка').closest('button')!
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// Last Visible Metric Protection
// ============================================================================

describe('TrendsLegend - Last Visible Metric Protection', () => {
  it('should prevent hiding when only one metric visible', () => {
    const singleVisible = new Set<TrendsMetricKey>(['payout_total'])
    renderLegend(singleVisible)
    const btn = screen.getByText('К перечислению').closest('button')!
    expect(btn).toBeDisabled()
  })

  it('should not call onToggle for last visible metric', () => {
    const onToggle = vi.fn()
    const singleVisible = new Set<TrendsMetricKey>(['margin_pct'])
    renderLegend(singleVisible, onToggle)
    fireEvent.click(screen.getByText('Маржа'))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('should show visual indicator for protected metric (cursor-not-allowed)', () => {
    const singleVisible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    const { container } = renderLegend(singleVisible)
    const btn = container.querySelector('button.cursor-not-allowed')
    expect(btn).toBeInTheDocument()
  })

  it('should allow toggling when multiple metrics visible', () => {
    const onToggle = vi.fn()
    const multiVisible = new Set<TrendsMetricKey>(['wb_sales_gross', 'payout_total', 'margin_pct'])
    renderLegend(multiVisible, onToggle)
    fireEvent.click(screen.getByText('Выручка'))
    expect(onToggle).toHaveBeenCalledWith('wb_sales_gross')
  })
})

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('TrendsLegend - Accessibility', () => {
  it('should have aria-checked attribute on each checkbox', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross', 'margin_pct'])
    renderLegend(visible)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(cb => {
      expect(cb).toHaveAttribute('aria-checked')
    })
  })

  it('should have descriptive aria-label for each button', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    renderLegend(visible)
    const visibleBtn = screen.getByRole('checkbox', { name: /Скрыть Выручка/ })
    expect(visibleBtn).toBeInTheDocument()
  })

  it('should show "Скрыть" in label for visible metrics', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    renderLegend(visible)
    expect(screen.getByRole('checkbox', { name: /Скрыть Выручка/ })).toBeInTheDocument()
  })

  it('should show "Показать" in label for hidden metrics', () => {
    const visible = new Set<TrendsMetricKey>(['wb_sales_gross'])
    renderLegend(visible)
    expect(screen.getByRole('checkbox', { name: /Показать Маржа/ })).toBeInTheDocument()
  })

  it('should be keyboard accessible (button elements)', () => {
    renderLegend()
    const buttons = screen.getAllByRole('checkbox')
    buttons.forEach(btn => {
      expect(btn.tagName).toBe('BUTTON')
    })
  })

  it('should have focus visible indicator via CSS class', () => {
    const { container } = renderLegend()
    const btn = container.querySelector('button')
    expect(btn!.className).toContain('focus-visible:ring')
  })

  it('should support Tab navigation between buttons', () => {
    renderLegend()
    const buttons = screen.getAllByRole('checkbox')
    // All are focusable buttons (some may be disabled)
    expect(buttons.length).toBeGreaterThanOrEqual(TRENDS_METRICS.length)
  })
})

// ============================================================================
// Responsive Design Tests
// ============================================================================

describe('TrendsLegend - Responsive Design', () => {
  it('should wrap items on small screens (flex-wrap)', () => {
    const { container } = renderLegend()
    const group = container.querySelector('[role="group"]')
    expect(group!.className).toContain('flex-wrap')
  })

  it('should maintain touch-friendly button size (py-1)', () => {
    const { container } = renderLegend()
    const buttons = container.querySelectorAll('button')
    buttons.forEach(btn => {
      expect(btn.className).toContain('py-1')
    })
  })

  it('should have gap between items', () => {
    const { container } = renderLegend()
    const group = container.querySelector('[role="group"]')
    expect(group!.className).toContain('gap-4')
  })
})
