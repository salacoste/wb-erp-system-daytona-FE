/**
 * Tests for AnalyticalDisclosure (TZ-6): collapsed + lazy by default, expand mounts children.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnalyticalDisclosure } from '../AnalyticalDisclosure'

describe('AnalyticalDisclosure (TZ-6)', () => {
  it('is collapsed by default and children are not mounted (lazy)', () => {
    render(
      <AnalyticalDisclosure>
        <div data-testid="child">analytics</div>
      </AnalyticalDisclosure>
    )
    const button = screen.getByRole('button', { name: /аналитика/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'analytical-detail')
    // Lazy: children not in the DOM until expanded.
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })

  it('expands on click: aria-expanded flips and children mount', () => {
    render(
      <AnalyticalDisclosure>
        <div data-testid="child">analytics</div>
      </AnalyticalDisclosure>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('collapses again on a second click', () => {
    render(
      <AnalyticalDisclosure>
        <div data-testid="child">analytics</div>
      </AnalyticalDisclosure>
    )
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
