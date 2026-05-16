/**
 * AiPreferencesToggleView Tests — Story 108.2-FE.
 * Tests the pure presentational view directly (pure-functions-over-hook-mocking pattern).
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AiPreferencesToggleView } from '../AiPreferencesToggle'

/** Default props — override per test as needed. */
const defaultProps = {
  aiEnabled: false,
  isPending: false,
  isLoading: false,
  isError: false,
  hasData: false,
  onToggle: vi.fn(),
}

describe('AiPreferencesToggleView', () => {
  it('renders skeleton when isLoading=true', () => {
    const { container } = render(
      React.createElement(AiPreferencesToggleView, { ...defaultProps, isLoading: true })
    )
    expect(container.firstChild).toBeTruthy()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('shows error indicator when isError=true and no cached data', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        ...defaultProps,
        isError: true,
        hasData: false,
      })
    )
    expect(screen.getByText('Не удалось загрузить настройку')).toBeTruthy()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('shows toggle when isError=true but hasData=true (stale data still available)', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        ...defaultProps,
        aiEnabled: true,
        isError: true,
        hasData: true,
      })
    )
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  it('shows "AI прогнозы включены" when aiEnabled=true', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        ...defaultProps,
        aiEnabled: true,
        hasData: true,
      })
    )
    expect(screen.getByText('AI прогнозы включены')).toBeTruthy()
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toBeTruthy()
    expect(switchEl.getAttribute('data-state')).toBe('checked')
  })

  it('shows "AI прогнозы отключены" when aiEnabled=false', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        ...defaultProps,
        aiEnabled: false,
        hasData: true,
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
        ...defaultProps,
        aiEnabled: true,
        hasData: true,
        onToggle,
      })
    )
    fireEvent.click(screen.getByRole('switch'))
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('disables switch when isPending=true', () => {
    render(
      React.createElement(AiPreferencesToggleView, {
        ...defaultProps,
        aiEnabled: true,
        isPending: true,
        hasData: true,
      })
    )
    expect(screen.getByRole('switch')).toBeDisabled()
  })
})
