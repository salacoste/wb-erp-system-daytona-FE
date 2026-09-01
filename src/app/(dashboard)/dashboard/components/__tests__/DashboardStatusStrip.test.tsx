/**
 * Unit tests for DashboardStatusStrip (TZ-1).
 * Verifies collapsed/expanded behaviour, the urgent-severity default-open rule,
 * aria wiring, children-mount-with-hidden (CTAs preserved while collapsed),
 * and the Russian pluralization of the attention-count phrase.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardStatusStrip, formatAttentionCount } from '../DashboardStatusStrip'

describe('formatAttentionCount (Russian pluralization)', () => {
  it.each([
    [0, '0 элементов требуют внимания'],
    [1, '1 элемент требует внимания'],
    [2, '2 элемента требуют внимания'],
    [3, '3 элемента требуют внимания'],
    [5, '5 элементов требуют внимания'],
    [11, '11 элементов требуют внимания'],
    [12, '12 элементов требуют внимания'],
    [21, '21 элемент требует внимания'],
    [23, '23 элемента требуют внимания'],
    [100, '100 элементов требуют внимания'],
    [-3, '-3 элемента требуют внимания'],
  ])('renders %i as "%s"', (count, expected) => {
    expect(formatAttentionCount(count)).toBe(expected)
  })
})

describe('DashboardStatusStrip', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(
      <DashboardStatusStrip count={0} severity="failed">
        <p>never shown</p>
      </DashboardStatusStrip>
    )
    expect(container.firstChild).toBeNull()
  })

  it('collapses non-urgent severities by default (detail hidden, content mounted)', () => {
    render(
      <DashboardStatusStrip count={3} severity="reportPending">
        <p>detail banner</p>
      </DashboardStatusStrip>
    )
    const button = screen.getByRole('button', { name: /3 элемента требуют внимания/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'dashboard-status-detail')

    // Detail region is mounted (content preserved — "no alert content lost") but hidden.
    const detail = document.getElementById('dashboard-status-detail')
    expect(detail).not.toBeNull()
    expect(detail).toHaveAttribute('hidden')
    expect(detail).toHaveTextContent('detail banner')
  })

  it('defaults OPEN for urgent `failed` severity (retry/error must be visible + announced)', () => {
    render(
      <DashboardStatusStrip count={1} severity="failed">
        <p>failure detail</p>
      </DashboardStatusStrip>
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('dashboard-status-detail')).not.toHaveAttribute('hidden')
  })

  it('defaults OPEN for `error` severity', () => {
    render(
      <DashboardStatusStrip count={1} severity="error">
        <p>error detail</p>
      </DashboardStatusStrip>
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })

  it('expands on click: aria-expanded flips and detail becomes visible', () => {
    render(
      <DashboardStatusStrip count={1} severity="tax">
        <p>tax detail</p>
      </DashboardStatusStrip>
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('dashboard-status-detail')).not.toHaveAttribute('hidden')
  })

  it('preserves a CTA inside the collapsed region (mounted though hidden) — "no content lost"', () => {
    render(
      <DashboardStatusStrip count={1} severity="missingCogs">
        <button type="button">Назначить COGS</button>
      </DashboardStatusStrip>
    )
    // The CTA stays mounted in the DOM even while the region is collapsed/hidden, so it is
    // reachable the moment the user expands. Note: getByRole excludes `hidden` subtrees (the
    // correct a11y-tree behaviour), so query by text to assert the DOM node is present.
    expect(screen.getByText(/назначить cogs/i)).toBeInTheDocument()
  })

  it('renders a severity icon (svg)', () => {
    const { container } = render(
      <DashboardStatusStrip count={1} severity="failed">
        <p>x</p>
      </DashboardStatusStrip>
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('uses foreground text on warning-tinted backgrounds for AA contrast', () => {
    render(
      <DashboardStatusStrip count={1} severity="reportPending">
        <p>pending detail</p>
      </DashboardStatusStrip>
    )

    const region = screen.getByRole('region', { name: 'Статус данных' })
    expect(region).toHaveClass('bg-status-warning/10', 'text-foreground')
    expect(region).not.toHaveClass('text-status-warning')
    expect(region.querySelector('svg')).toHaveClass('text-status-warning')
  })
})
