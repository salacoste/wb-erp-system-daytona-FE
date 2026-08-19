/**
 * AnomalyIndicator Unit Tests — Story 96.14-FE
 *
 * Verifies Defensive Frontend indicator component:
 *   - count <= 0: renders plain number, no AlertTriangle
 *   - count > 0: renders warning count + AlertTriangle + correct aria-label per type
 *   - Keyboard a11y: tabIndex present (Story 96.13 L2-2 lesson)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AnomalyIndicator } from '../AnomalyIndicator'

/** Wrap in TooltipProvider since AnomalyIndicator renders inside a Tooltip. */
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('AnomalyIndicator', () => {
  it('renders plain count without AlertTriangle when count is 0', () => {
    renderWithTooltip(<AnomalyIndicator count={0} type="return_without_buyout" />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Аномалия/)).toBeNull()
  })

  it('renders AlertTriangle and amber count when count > 0 for return_without_buyout', () => {
    renderWithTooltip(<AnomalyIndicator count={3} type="return_without_buyout" />)
    expect(screen.getByText('3')).toBeInTheDocument()
    // M2-2: role="button" dropped — focus-based Tooltip disclosure uses aria-label, not click role
    expect(
      screen.getByLabelText(/Аномалия: возврат без подтверждённого выкупа/)
    ).toBeInTheDocument()
  })

  it('renders correct aria-label for orphan_buyout type', () => {
    renderWithTooltip(<AnomalyIndicator count={2} type="orphan_buyout" />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Аномалия: выкуп без подтверждённого исходного заказа/)
    ).toBeInTheDocument()
  })

  it('renders correct aria-label for return_quantity_mismatch type', () => {
    renderWithTooltip(<AnomalyIndicator count={1} type="return_quantity_mismatch" />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Аномалия: расхождение количества возвратов между источниками/)
    ).toBeInTheDocument()
  })

  it('has tabIndex=0 on indicator trigger for keyboard accessibility (Story 96.13 L2-2)', () => {
    const { container } = renderWithTooltip(<AnomalyIndicator count={5} type="orphan_buyout" />)
    const triggerSpan = container.querySelector('[tabindex="0"]')
    expect(triggerSpan).not.toBeNull()
  })

  it('renders plain count without AlertTriangle when count is negative', () => {
    renderWithTooltip(<AnomalyIndicator count={-1} type="return_without_buyout" />)
    expect(screen.getByText('-1')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Аномалия/)).toBeNull()
  })

  // Epic 169.5: status-token pins (exact class assertions, no [class*=])
  it('Epic 169.5: count and icon use text-status-warning; no legacy amber count class', () => {
    const { container } = renderWithTooltip(<AnomalyIndicator count={3} type="orphan_buyout" />)
    const count = screen.getByText('3')
    expect(count).toHaveClass('text-status-warning')
    // Negative pin: legacy amber literal must be gone (Epic 169.5)
    expect(count).not.toHaveClass('text-amber-700')
    const icon = container.querySelector('svg')
    expect(icon).not.toBeNull()
    expect(icon).toHaveClass('text-status-warning')
  })

  it('Epic 169.5: tooltip trigger uses focus-visible:ring-ring token', () => {
    const { container } = renderWithTooltip(<AnomalyIndicator count={5} type="orphan_buyout" />)
    const trigger = container.querySelector('[tabindex="0"]')
    expect(trigger).not.toBeNull()
    expect(trigger).toHaveClass('focus-visible:ring-ring')
    // Ring weight preserved (Epic 169.5: token swap only, no weight change)
    expect(trigger).toHaveClass('focus-visible:ring-2')
  })
})
