/**
 * AnomalyIndicator Unit Tests — Story 96.14-FE
 *
 * Verifies Defensive Frontend indicator component:
 *   - count <= 0: renders plain number, no AlertTriangle
 *   - count > 0: renders amber count + AlertTriangle + correct aria-label per type
 *   - Keyboard a11y: tabIndex present (Story 96.13 L2-2 lesson)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnomalyIndicator } from '../AnomalyIndicator'

describe('AnomalyIndicator', () => {
  it('renders plain count without AlertTriangle when count is 0', () => {
    render(<AnomalyIndicator count={0} type="return_without_buyout" />)
    expect(screen.getByText('0')).toBeInTheDocument()
    // M2-2 fix: role="button" dropped — query by aria-label absence instead
    expect(screen.queryByLabelText(/Аномалия/)).toBeNull()
  })

  it('renders AlertTriangle and amber count when count > 0 for return_without_buyout', () => {
    render(<AnomalyIndicator count={3} type="return_without_buyout" />)
    expect(screen.getByText('3')).toBeInTheDocument()
    // M2-2 fix: role="button" dropped (focus-based tooltip disclosure, not click activation)
    // Query by aria-label on the trigger span — still identifies the anomaly type unambiguously
    expect(
      screen.getByLabelText(/Аномалия: возврат без подтверждённого выкупа/)
    ).toBeInTheDocument()
  })

  it('renders correct aria-label for orphan_buyout type', () => {
    render(<AnomalyIndicator count={2} type="orphan_buyout" />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Аномалия: выкуп без подтверждённого исходного заказа/)
    ).toBeInTheDocument()
  })

  it('renders correct aria-label for return_quantity_mismatch type', () => {
    render(<AnomalyIndicator count={1} type="return_quantity_mismatch" />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Аномалия: расхождение количества возвратов между источниками/)
    ).toBeInTheDocument()
  })

  it('has tabIndex=0 on indicator trigger for keyboard accessibility (Story 96.13 L2-2)', () => {
    const { container } = render(<AnomalyIndicator count={5} type="orphan_buyout" />)
    const triggerSpan = container.querySelector('[tabindex="0"]')
    expect(triggerSpan).not.toBeNull()
  })

  it('renders plain count without AlertTriangle when count is negative', () => {
    render(<AnomalyIndicator count={-1} type="return_without_buyout" />)
    expect(screen.getByText('-1')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Аномалия/)).toBeNull()
  })
})
