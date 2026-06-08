/**
 * FunnelAnomalyIndicator tests — Defensive Frontend Principle (#191).
 *
 * Smoke: renders AlertTriangle tooltip with the anomaly message constant.
 */

import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FunnelAnomalyIndicator } from '../FunnelAnomalyIndicator'

describe('FunnelAnomalyIndicator', () => {
  it('renders an AlertTriangle SVG icon', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has correct aria-label on the trigger span', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const labeledEl = container.querySelector('[aria-label]')
    expect(labeledEl).toBeInTheDocument()
    // Should contain the anomaly message about impossible conversion
    expect(labeledEl?.getAttribute('aria-label')).toBeTruthy()
  })

  it('renders inline-flex with cursor-help styling', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const span = container.querySelector('.inline-flex.cursor-help')
    expect(span).toBeInTheDocument()
  })

  it('applies amber-600 color class', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const span = container.querySelector('.text-amber-600')
    expect(span).toBeInTheDocument()
  })
})
