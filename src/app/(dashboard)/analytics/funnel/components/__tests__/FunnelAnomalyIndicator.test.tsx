/**
 * FunnelAnomalyIndicator tests — Defensive Frontend Principle (#191).
 *
 * Smoke: renders AlertTriangle tooltip with the anomaly message constant.
 */

import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FunnelAnomalyIndicator } from '../FunnelAnomalyIndicator'
import { FUNNEL_CONVERSION_ANOMALY_MESSAGE } from '../funnel-anomaly'

describe('FunnelAnomalyIndicator', () => {
  it('renders an AlertTriangle SVG icon', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('exposes the complete diagnostic message on the trigger span', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const labeledEl = container.querySelector('[aria-label]')
    expect(labeledEl).toBeInTheDocument()
    expect(labeledEl).toHaveAttribute('aria-label', FUNNEL_CONVERSION_ANOMALY_MESSAGE)
  })

  it('moves keyboard focus to the anomaly diagnostic trigger', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FunnelAnomalyIndicator />)

    await user.tab()

    expect(screen.getByRole('button', { name: FUNNEL_CONVERSION_ANOMALY_MESSAGE })).toHaveFocus()
  })

  it('reveals the diagnostic message when the trigger is activated by touch or click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FunnelAnomalyIndicator />)

    await user.click(screen.getByRole('button', { name: FUNNEL_CONVERSION_ANOMALY_MESSAGE }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(FUNNEL_CONVERSION_ANOMALY_MESSAGE)
  })

  it('renders inline-flex with cursor-help styling', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const span = container.querySelector('.inline-flex.cursor-help')
    expect(span).toBeInTheDocument()
  })

  it('uses the semantic warning token without a legacy amber utility', () => {
    const { container } = renderWithProviders(<FunnelAnomalyIndicator />)
    const span = container.querySelector('.inline-flex.cursor-help')
    expect(span).toHaveClass('text-status-warning')
    expect(span).not.toHaveClass('text-amber-600')
  })
})
