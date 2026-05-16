/**
 * AiPreferencesToggleView Tests — Story 108.2-FE.
 * Tests the pure presentational view directly (pure-functions-over-hook-mocking pattern).
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AiPreferencesToggleView } from '../AiPreferencesToggle'

describe('AiPreferencesToggleView', () => {
  it('renders skeleton when isLoading=true', () => {
    const { container } = render(
      React.createElement(AiPreferencesToggleView, {
        aiEnabled: false,
        isPending: false,
        isLoading: true,
        onToggle: vi.fn(),
      })
    )
    expect(container.firstChild).toBeTruthy()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('shows "AI прогнозы включены" when aiEnabled=true', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        aiEnabled: true,
        isPending: false,
        isLoading: false,
        onToggle: vi.fn(),
      })
    )
    expect(screen.getByText('AI прогнозы включены')).toBeTruthy()
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toBeTruthy()
    // Switch should be checked
    expect(switchEl.getAttribute('data-state')).toBe('checked')
  })

  it('shows "AI прогнозы отключены" when aiEnabled=false', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        aiEnabled: false,
        isPending: false,
        isLoading: false,
        onToggle: vi.fn(),
      })
    )
    expect(screen.getByText('AI прогнозы отключены')).toBeTruthy()
    const switchEl = screen.getByRole('switch')
    expect(switchEl.getAttribute('data-state')).toBe('unchecked')
  })

  it('calls onToggle with new value when switch is clicked', () => {
    const onToggle = vi.fn()
    render(
      React.createElement(AiPreferencesToggleView, {
        aiEnabled: true,
        isPending: false,
        isLoading: false,
        onToggle,
      })
    )
    fireEvent.click(screen.getByRole('switch'))
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('disables switch when isPending=true', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        aiEnabled: true,
        isPending: true,
        isLoading: false,
        onToggle: vi.fn(),
      })
    )
    expect(screen.getByRole('switch')).toBeDisabled()
  })
})
